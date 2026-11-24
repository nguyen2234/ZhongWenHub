using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Features.AI.DTOs;
using ZhongWenHub.Features.AI;
using ZhongWenHub.Data.Entities.AI;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Features.AI;

public interface IAIErrorAnalysisService
{
    Task<ErrorAnalysisReportDto> GetErrorAnalysisAsync(Guid userId, CancellationToken cancellationToken = default);
    Task RecomputeAndPersistSkillStatsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<AIErrorAnalysisDetailDto> AnalyzeErrorDetailAsync(
        Guid userId,
        RequestErrorAnalysisDto request,
        CancellationToken cancellationToken = default);
}

public sealed class AIErrorAnalysisService : IAIErrorAnalysisService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private static readonly (string Key, string Label)[] SkillDefinitions =
    {
        ("vocabulary", "Từ vựng (Vocabulary)"),
        ("grammar", "Ngữ pháp (Grammar)"),
        ("hanzi", "Nhận diện Hanzi"),
        ("pinyin", "Pinyin & Thanh điệu văn bản"),
        ("reading", "Đọc hiểu (Reading)"),
        ("listening", "Nghe hiểu (Listening)")
    };

    private readonly ApplicationDbContext _dbContext;
    private readonly IAIProvider? _aiProvider;
    private readonly IAIUsageLogger? _usageLogger;
    private readonly ILogger<AIErrorAnalysisService>? _logger;

    public AIErrorAnalysisService(
        ApplicationDbContext dbContext,
        IAIProvider? aiProvider = null,
        IAIUsageLogger? usageLogger = null,
        ILogger<AIErrorAnalysisService>? logger = null)
    {
        _dbContext = dbContext;
        _aiProvider = aiProvider;
        _usageLogger = usageLogger;
        _logger = logger;
    }

    private const int MaxAttemptsWindow = 200;

    public async Task<ErrorAnalysisReportDto> GetErrorAnalysisAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        // Exclude AI attempts saved to StudentPracticeAttempts with 'ai_' prefix to avoid double-counting
        // Cap query with MaxAttemptsWindow to prevent unbounded memory growth
        var practiceAttempts = await _dbContext.StudentPracticeAttempts
            .AsNoTracking()
            .Where(a => a.UserId == userId && !a.ExerciseId.StartsWith("ai_"))
            .OrderByDescending(a => a.AttemptedAt)
            .Take(MaxAttemptsWindow)
            .Select(a => new AttemptPoint(
                NormalizeSkill(a.Category),
                string.IsNullOrWhiteSpace(a.TopicTitle) ? a.KnowledgePointId : a.TopicTitle,
                a.HskLevel,
                a.IsCorrect))
            .ToListAsync(cancellationToken);

        var aiAttempts = await _dbContext.AiExerciseAttempts
            .AsNoTracking()
            .Include(a => a.AiExercise)
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.AttemptedAt)
            .Take(MaxAttemptsWindow)
            .Select(a => new AttemptPoint(
                NormalizeSkill(a.SkillCategory),
                a.AiExercise != null ? $"{a.AiExercise.SourceType} HSK {a.AiExercise.HskLevel}" : "Bài tập AI",
                a.AiExercise != null ? a.AiExercise.HskLevel : 1,
                a.IsCorrect))
            .ToListAsync(cancellationToken);

        var allAttempts = practiceAttempts.Concat(aiAttempts).ToList();
        var skills = BuildSkillStats(allAttempts);
        var weakPoints = BuildWeakPoints(allAttempts);

        await UpsertSkillStatsAsync(userId, skills, cancellationToken);

        var total = allAttempts.Count;
        var correct = allAttempts.Count(a => a.IsCorrect);
        var overallAccuracy = total > 0 ? Math.Round(correct * 100.0 / total, 1) : 0;

        return new ErrorAnalysisReportDto
        {
            TotalAttemptsAnalyzed = total,
            OverallAccuracyPercent = overallAccuracy,
            HasAudioEvaluation = false,
            AudioEvaluationNote = "Chưa có dữ liệu âm thanh được chấm điểm; hệ thống không suy đoán lỗi phát âm.",
            Skills = skills,
            WeakPoints = weakPoints,
            GeneratedAt = DateTime.UtcNow
        };
    }

    public async Task RecomputeAndPersistSkillStatsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        _ = await GetErrorAnalysisAsync(userId, cancellationToken);
    }

    public async Task<AIErrorAnalysisDetailDto> AnalyzeErrorDetailAsync(
        Guid userId,
        RequestErrorAnalysisDto request,
        CancellationToken cancellationToken = default)
    {
        var questionText = request.QuestionText?.Trim() ?? string.Empty;
        var userAnswer = request.UserAnswer?.Trim() ?? string.Empty;
        var correctAnswer = request.CorrectAnswer?.Trim() ?? string.Empty;
        var skillCategory = NormalizeSkill(request.SkillCategory);
        var hskLevel = Math.Clamp(request.HskLevel, 1, 4);
        var isAuthoritative = false;
        AiGeneratedExercise? exercise = null;

        // Authoritative resolution from DB if ExerciseId is provided (strict cross-user authorization)
        string? cacheKey = null;
        string? normAnswer = null;

        if (request.ExerciseId.HasValue && request.ExerciseId.Value != Guid.Empty)
        {
            exercise = await _dbContext.AiGeneratedExercises
                .FirstOrDefaultAsync(e => e.Id == request.ExerciseId.Value, cancellationToken);

            if (exercise == null)
            {
                throw new KeyNotFoundException("Không tìm thấy bài tập được yêu cầu.");
            }

            if (exercise.UserId != userId)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền truy cập hoặc phân tích bài tập của học viên khác.");
            }

            isAuthoritative = true;

            // Always use authoritative DB ground-truth - NEVER trust client-provided CorrectAnswer
            questionText = exercise.PromptZh;
            correctAnswer = exercise.CorrectAnswer ?? string.Empty;
            hskLevel = exercise.HskLevel;
            skillCategory = NormalizeSkill(exercise.SourceType);

            // Fetch actual user answer from database if available (prioritize DB over untrusted client payload)
            var attempt = await _dbContext.AiExerciseAttempts
                .AsNoTracking()
                .Where(a => a.AiExerciseId == exercise.Id && a.UserId == userId)
                .OrderByDescending(a => a.AttemptedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (attempt != null && !string.IsNullOrWhiteSpace(attempt.UserAnswer))
            {
                userAnswer = attempt.UserAnswer;
            }

            normAnswer = NormalizeAnswer(userAnswer);
            cacheKey = attempt != null ? $"att_{attempt.Id:N}" : $"ans_{normAnswer}";

            // Check cached error analysis in exercise metadata to eliminate duplicate LLM calls on retry
            // Must strictly verify that cache belongs to the exact attempt or user answer
            if (!string.IsNullOrWhiteSpace(exercise.MetadataJson))
            {
                try
                {
                    using var metaDoc = JsonDocument.Parse(exercise.MetadataJson);
                    if (metaDoc.RootElement.TryGetProperty("cachedErrorAnalyses", out var analysesMap) && analysesMap.ValueKind == JsonValueKind.Object)
                    {
                        if (analysesMap.TryGetProperty(cacheKey, out var cachedProp) && cachedProp.ValueKind == JsonValueKind.Object)
                        {
                            var cached = JsonSerializer.Deserialize<AIErrorAnalysisDetailDto>(cachedProp.GetRawText(), JsonOptions);
                            if (cached != null)
                            {
                                return cached;
                            }
                        }
                        else if (!string.IsNullOrWhiteSpace(normAnswer) && analysesMap.TryGetProperty($"ans_{normAnswer}", out var cachedAnsProp) && cachedAnsProp.ValueKind == JsonValueKind.Object)
                        {
                            var cached = JsonSerializer.Deserialize<AIErrorAnalysisDetailDto>(cachedAnsProp.GetRawText(), JsonOptions);
                            if (cached != null)
                            {
                                return cached;
                            }
                        }
                    }
                }
                catch (JsonException) { }
            }
        }

        // Sanitize inputs
        questionText = PromptSanitizer.SanitizeUntrustedText(questionText, 500);
        userAnswer = PromptSanitizer.SanitizeUntrustedText(userAnswer, 200);
        correctAnswer = PromptSanitizer.SanitizeUntrustedText(correctAnswer, 200);

        // Ground-truth check
        var isActuallyCorrect = !string.IsNullOrWhiteSpace(correctAnswer) &&
                                !string.IsNullOrWhiteSpace(userAnswer) &&
                                string.Equals(NormalizeAnswer(userAnswer), NormalizeAnswer(correctAnswer), StringComparison.OrdinalIgnoreCase);

        if (isActuallyCorrect)
        {
            var correctResult = new AIErrorAnalysisDetailDto
            {
                ErrorType = skillCategory,
                ErrorTypeLabelVi = GetSkillLabelVi(skillCategory),
                WhyIncorrectVi = isAuthoritative
                    ? "Câu trả lời của bạn thực tế đã hoàn toàn chính xác hoặc tương đương đáp án chuẩn."
                    : "Câu trả lời của bạn khớp với văn bản tham chiếu cung cấp (đối chiếu tham khảo).",
                WhyCorrectVi = isAuthoritative
                    ? $"Đáp án '{correctAnswer}' là câu trả lời chuẩn xác cho câu hỏi."
                    : $"Văn bản '{correctAnswer}' là câu trả lời tham chiếu.",
                KnowledgePointVi = "Bạn đã nắm vững điểm kiến thức này.",
                Examples = new List<AIErrorExampleDto>(),
                RecommendedPracticeAction = "Tiếp tục bài tập kế tiếp.",
                RecommendedRoute = "/ai-exercises",
                IsAiGenerated = false,
                IsFallback = false,
                IsAuthoritativeGrading = isAuthoritative
            };

            if (exercise != null && cacheKey != null)
            {
                await CacheAnalysisInMetadataAsync(exercise, cacheKey, normAnswer ?? string.Empty, correctResult, cancellationToken);
            }

            return correctResult;
        }

        AIErrorAnalysisDetailDto finalAnalysis;

        // If no AI Provider configured, immediate pedagogical fallback
        if (_aiProvider == null)
        {
            finalAnalysis = BuildPedagogicalOfflineFallback(skillCategory, questionText, userAnswer, correctAnswer, hskLevel, isAuthoritative);
        }
        else
        {
            // Check budget & quota before calling AI
            var quotaAvailable = true;
            if (_usageLogger != null)
            {
                try
                {
                    await _usageLogger.EnsureWithinDailyBudgetAsync(userId, cancellationToken);
                }
                catch (AITutorException)
                {
                    quotaAvailable = false;
                }
            }

            if (!quotaAvailable)
            {
                finalAnalysis = BuildPedagogicalOfflineFallback(skillCategory, questionText, userAnswer, correctAnswer, hskLevel, isAuthoritative);
            }
            else
            {
                var systemPrompt = BuildErrorAnalysisSystemPrompt(hskLevel);
                var userPrompt = BuildErrorAnalysisUserPrompt(skillCategory, questionText, userAnswer, correctAnswer, hskLevel);

                try
                {
                    var aiResponse = await _aiProvider.GenerateContentAsync(
                        new AIProviderRequest
                        {
                            Feature = "AI_ERROR_ANALYSIS",
                            SystemInstruction = systemPrompt,
                            UserPrompt = userPrompt,
                            ExpectJson = true,
                            Temperature = 0.3,
                            MaxOutputTokens = 1200
                        },
                        cancellationToken);

                    if (_usageLogger != null)
                    {
                        await _usageLogger.LogAsync(userId, "AI_ERROR_ANALYSIS", aiResponse, true, null, cancellationToken);
                    }

                    var parsed = ParseAndValidateErrorAnalysis(aiResponse.RawText, skillCategory, hskLevel, isAuthoritative);
                    finalAnalysis = parsed ?? BuildPedagogicalOfflineFallback(skillCategory, questionText, userAnswer, correctAnswer, hskLevel, isAuthoritative);
                }
                catch (Exception ex)
                {
                    _logger?.LogWarning(ex, "AI Error Analysis call failed, falling back to offline pedagogical engine");
                    if (_usageLogger != null)
                    {
                        await _usageLogger.LogAsync(userId, "AI_ERROR_ANALYSIS", null, false, ex.Message, cancellationToken);
                    }
                    finalAnalysis = BuildPedagogicalOfflineFallback(skillCategory, questionText, userAnswer, correctAnswer, hskLevel, isAuthoritative);
                }
            }
        }

        // Cache error analysis into exercise metadata keyed by attempt / user answer
        if (exercise != null && cacheKey != null)
        {
            await CacheAnalysisInMetadataAsync(exercise, cacheKey, normAnswer ?? string.Empty, finalAnalysis, cancellationToken);
        }

        return finalAnalysis;
    }

    private async Task CacheAnalysisInMetadataAsync(
        AiGeneratedExercise exercise,
        string cacheKey,
        string normalizedAnswer,
        AIErrorAnalysisDetailDto analysis,
        CancellationToken cancellationToken)
    {
        try
        {
            var dict = new Dictionary<string, object>();
            if (!string.IsNullOrWhiteSpace(exercise.MetadataJson))
            {
                try
                {
                    dict = JsonSerializer.Deserialize<Dictionary<string, object>>(exercise.MetadataJson, JsonOptions) ?? new();
                }
                catch (JsonException) { }
            }

            var analysesMap = new Dictionary<string, object>();
            if (dict.TryGetValue("cachedErrorAnalyses", out var existingMapObj) && existingMapObj != null)
            {
                try
                {
                    var jsonText = existingMapObj is JsonElement je ? je.GetRawText() : existingMapObj.ToString();
                    if (!string.IsNullOrWhiteSpace(jsonText))
                    {
                        analysesMap = JsonSerializer.Deserialize<Dictionary<string, object>>(jsonText, JsonOptions) ?? new();
                    }
                }
                catch (JsonException) { }
            }

            analysesMap[cacheKey] = analysis;
            if (!string.IsNullOrWhiteSpace(normalizedAnswer))
            {
                analysesMap[$"ans_{normalizedAnswer}"] = analysis;
            }

            dict["cachedErrorAnalyses"] = analysesMap;
            exercise.MetadataJson = JsonSerializer.Serialize(dict, JsonOptions);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Could not cache error analysis in exercise metadata");
        }
    }

    public static AIErrorAnalysisDetailDto? ParseAndValidateErrorAnalysis(string rawJson, string skillCategory, int hskLevel, bool isAuthoritative = true)
    {
        if (string.IsNullOrWhiteSpace(rawJson)) return null;

        try
        {
            var cleaned = rawJson.Trim();
            if (cleaned.StartsWith("```"))
            {
                var start = cleaned.IndexOf('{');
                var end = cleaned.LastIndexOf('}');
                if (start >= 0 && end > start)
                {
                    cleaned = cleaned[start..(end + 1)];
                }
            }

            using var doc = JsonDocument.Parse(cleaned);
            var root = doc.RootElement;

            var errorType = root.TryGetProperty("errorType", out var et) && et.ValueKind == JsonValueKind.String
                ? NormalizeSkill(et.GetString())
                : skillCategory;

            var errorTypeLabelVi = root.TryGetProperty("errorTypeLabelVi", out var el) && el.ValueKind == JsonValueKind.String
                ? el.GetString()?.Trim() ?? GetSkillLabelVi(errorType)
                : GetSkillLabelVi(errorType);

            var whyIncorrectVi = root.TryGetProperty("whyIncorrectVi", out var wi) && wi.ValueKind == JsonValueKind.String
                ? wi.GetString()?.Trim()
                : null;

            var whyCorrectVi = root.TryGetProperty("whyCorrectVi", out var wc) && wc.ValueKind == JsonValueKind.String
                ? wc.GetString()?.Trim()
                : null;

            var knowledgePointVi = root.TryGetProperty("knowledgePointVi", out var kp) && kp.ValueKind == JsonValueKind.String
                ? kp.GetString()?.Trim()
                : null;

            if (string.IsNullOrWhiteSpace(whyIncorrectVi) || string.IsNullOrWhiteSpace(whyCorrectVi))
            {
                return null;
            }

            var examples = new List<AIErrorExampleDto>();
            if (root.TryGetProperty("examples", out var exArr) && exArr.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in exArr.EnumerateArray())
                {
                    var hz = item.TryGetProperty("hanzi", out var h) && h.ValueKind == JsonValueKind.String ? h.GetString()?.Trim() : null;
                    var py = item.TryGetProperty("pinyin", out var p) && p.ValueKind == JsonValueKind.String ? p.GetString()?.Trim() : null;
                    var vi = item.TryGetProperty("vietnamese", out var v) && v.ValueKind == JsonValueKind.String ? v.GetString()?.Trim() : null;
                    if (!string.IsNullOrWhiteSpace(hz))
                    {
                        examples.Add(new AIErrorExampleDto
                        {
                            Hanzi = hz,
                            Pinyin = py ?? string.Empty,
                            Vietnamese = vi ?? string.Empty
                        });
                    }
                }
            }

            var recommendedPracticeAction = root.TryGetProperty("recommendedPracticeAction", out var ra) && ra.ValueKind == JsonValueKind.String
                ? ra.GetString()?.Trim() ?? "Luyện tập thêm các câu củng cố kiến thức này."
                : "Luyện tập thêm các câu củng cố kiến thức này.";

            var recommendedRoute = root.TryGetProperty("recommendedRoute", out var rr) && rr.ValueKind == JsonValueKind.String
                ? rr.GetString()?.Trim() ?? $"/ai-exercises?hsk={hskLevel}&source={errorType.ToUpperInvariant()}"
                : $"/ai-exercises?hsk={hskLevel}&source={errorType.ToUpperInvariant()}";

            var whyCorrectText = whyCorrectVi;
            var whyIncorrectText = whyIncorrectVi;
            if (!isAuthoritative)
            {
                whyCorrectText = $"{whyCorrectText} (Đối chiếu theo văn bản tham chiếu, không phải kết quả thi chính thức).";
                whyIncorrectText = $"{whyIncorrectText} (Tham khảo đối chiếu, không phải bài chấm chính thức).";
            }

            return new AIErrorAnalysisDetailDto
            {
                ErrorType = errorType,
                ErrorTypeLabelVi = errorTypeLabelVi,
                WhyIncorrectVi = whyIncorrectText,
                WhyCorrectVi = whyCorrectText,
                KnowledgePointVi = knowledgePointVi ?? "Cần chú ý đối chiếu cấu trúc ngữ nghĩa và ngữ cảnh câu hỏi.",
                Examples = examples,
                RecommendedPracticeAction = recommendedPracticeAction,
                RecommendedRoute = recommendedRoute,
                IsAiGenerated = true,
                IsFallback = false,
                IsAuthoritativeGrading = isAuthoritative
            };
        }
        catch (JsonException)
        {
            return null;
        }
    }

    public static AIErrorAnalysisDetailDto BuildPedagogicalOfflineFallback(
        string skillCategory,
        string questionText,
        string userAnswer,
        string correctAnswer,
        int hskLevel,
        bool isAuthoritative = true)
    {
        var category = NormalizeSkill(skillCategory);
        var label = GetSkillLabelVi(category);

        string whyIncorrect;
        string whyCorrect;
        string knowledgePoint;
        List<AIErrorExampleDto> examples = new();

        switch (category)
        {
            case "pinyin":
                whyIncorrect = $"Lựa chọn '{userAnswer}' nhầm lẫn về thanh điệu hoặc phụ âm/nguyên âm tương cận trong Pinyin.";
                whyCorrect = $"Đáp án đúng '{correctAnswer}' thể hiện phiên âm Pinyin chuẩn xác theo chuẩn phiên âm tiếng Hán HSK {hskLevel}.";
                knowledgePoint = "Quy tắc thanh điệu: Cần chú ý phân biệt rõ thanh 1 (cao bằng - ā), thanh 2 (lên cao - á), thanh 3 (xuống lên - ǎ) và thanh 4 (xuống dứt khoát - à).";
                examples.Add(new AIErrorExampleDto { Hanzi = "妈妈", Pinyin = "māma", Vietnamese = "Mẹ (thanh 1)" });
                examples.Add(new AIErrorExampleDto { Hanzi = "马", Pinyin = "mǎ", Vietnamese = "Ngựa (thanh 3)" });
                break;

            case "vocabulary":
                whyIncorrect = $"Phương án bạn chọn '{userAnswer}' không tương thích với ngữ cảnh hoặc sắc thái nghĩa trong câu hỏi HSK {hskLevel}.";
                whyCorrect = $"Từ '{correctAnswer}' mang nghĩa và ngữ dụng phù hợp nhất với cụm từ hoặc ngữ cảnh câu hỏi.";
                knowledgePoint = "Phân biệt từ gần nghĩa và từ loại: Hãy chú ý từ loại (danh từ, động từ, tính từ) và đối tượng kết hợp thường dùng trong câu.";
                examples.Add(new AIErrorExampleDto { Hanzi = "我想学中文。", Pinyin = "Wǒ xiǎng xué Zhōngwén.", Vietnamese = "Tôi muốn học tiếng Trung." });
                break;

            case "hanzi":
                whyIncorrect = $"Chữ Hán '{userAnswer}' có bộ thủ hoặc cấu tạo tương tự nhưng mang ý nghĩa hoặc phát âm hoàn toàn khác.";
                whyCorrect = $"Chữ '{correctAnswer}' có kết cấu bộ thủ và ý nghĩa chuẩn xác cho ngữ cảnh được hỏi.";
                knowledgePoint = "Phương pháp nhận diện chữ Hán: Quan sát kỹ bộ thủ biểu nghĩa và phần biểu âm để tránh nhầm các chữ có hình dạng gần giống nhau.";
                examples.Add(new AIErrorExampleDto { Hanzi = "太 / 大", Pinyin = "tài / dà", Vietnamese = "Quá, lắm / To, lớn" });
                break;

            case "reading":
                whyIncorrect = $"Lựa chọn '{userAnswer}' suy diễn chưa bám sát chi tiết trực tiếp trong văn bản đọc.";
                whyCorrect = $"Đáp án '{correctAnswer}' phản ánh chính xác thông tin được khẳng định trong ngữ cảnh bài đọc.";
                knowledgePoint = "Kỹ năng đọc hiểu HSK: Luôn định vị từ khóa (keywords) trong câu hỏi và đối chiếu trực tiếp với câu chứa từ khóa trong đoạn văn.";
                examples.Add(new AIErrorExampleDto { Hanzi = "根据课文内容，...", Pinyin = "Gēnjù kèwén nèiróng, ...", Vietnamese = "Căn cứ vào nội dung bài đọc, ..." });
                break;

            case "listening":
                whyIncorrect = $"Bạn có thể đã nghe nhầm từ đồng âm khác nghĩa hoặc thanh điệu trong đoạn nghe.";
                whyCorrect = $"Đáp án '{correctAnswer}' khớp chính xác với thông tin chính được phát ra trong bài nghe.";
                knowledgePoint = "Kỹ năng nghe hiểu HSK: Chú ý nắm bắt câu hỏi trước khi nghe và tập trung vào các từ then chốt (thời gian, địa điểm, hành động).";
                examples.Add(new AIErrorExampleDto { Hanzi = "他在做作业。", Pinyin = "Tā zài zuò zuòyè.", Vietnamese = "Anh ấy đang làm bài tập." });
                break;

            default: // grammar
                whyIncorrect = $"Lựa chọn '{userAnswer}' vi phạm trật tự từ hoặc ngữ pháp kết hợp trong tiếng Trung (người học Việt Nam hay áp dụng trật tự từ tiếng Việt).";
                whyCorrect = $"Đáp án '{correctAnswer}' tuân thủ đúng kết cấu ngữ pháp chuẩn tiếng Trung cho câu này.";
                knowledgePoint = "Quy tắc ngữ pháp quan trọng: Định ngữ và trạng ngữ chỉ thời gian/địa điểm luôn đứng TRƯỚC trung tâm ngữ và vị ngữ chính.";
                examples.Add(new AIErrorExampleDto { Hanzi = "我明天在北京看朋友。", Pinyin = "Wǒ míngtiān zài Běijīng kàn péngyou.", Vietnamese = "Ngày mai tôi gặp bạn ở Bắc Kinh (Thời gian + Địa điểm đứng trước hành động)." });
                break;
        }

        if (!isAuthoritative)
        {
            whyIncorrect = $"{whyIncorrect} (Tham khảo đối chiếu, không phải bài chấm chính thức).";
            whyCorrect = $"{whyCorrect} (Đối chiếu theo văn bản tham chiếu, không phải kết quả thi chính thức).";
        }

        return new AIErrorAnalysisDetailDto
        {
            ErrorType = category,
            ErrorTypeLabelVi = label,
            WhyIncorrectVi = whyIncorrect,
            WhyCorrectVi = whyCorrect,
            KnowledgePointVi = knowledgePoint,
            Examples = examples,
            RecommendedPracticeAction = $"Luyện tập thêm 3-5 câu thuộc mảng {label} để củng cố phản xạ.",
            RecommendedRoute = $"/ai-exercises?hsk={hskLevel}&source={category.ToUpperInvariant()}",
            IsAiGenerated = false,
            IsFallback = true,
            IsAuthoritativeGrading = isAuthoritative
        };
    }

    private static string BuildErrorAnalysisSystemPrompt(int hskLevel)
    {
        return $$"""
Bạn là chuyên gia sư phạm tiếng Trung (HSK {{hskLevel}}) hướng dẫn cho người học Việt Nam.
Khi học viên làm sai câu hỏi tiếng Trung, nhiệm vụ của bạn là phân tích sâu sắc NGUYÊN NHÂN LỖI SAI:
1. Phân loại loại lỗi: 'vocabulary', 'grammar', 'pinyin', 'hanzi', 'reading', 'listening'.
2. Chỉ rõ vì sao học viên nhầm lẫn (đặc biệt là lỗi do chuyển di tiêu cực từ tiếng Việt như trật tự từ, lượng từ, thanh điệu, cấu trúc câu).
3. Giải thích tại sao đáp án đúng là đúng.
4. Nêu điểm kiến thức cốt lõi cần nhớ (ngắn gọn, sư phạm).
5. Đưa ra 1-2 ví dụ minh họa kèm Chữ Hán, Pinyin, và Dịch nghĩa tiếng Việt.
6. Đề xuất hành động luyện tập tiếp theo.

TUYỆT ĐỐI TUÂN THỦ:
- Không bịa đặt kiến thức ngoài chương trình HSK {{hskLevel}}.
- Không chứa thông tin cá nhân (PII).
- Luôn trả về DUY NHẤT 1 JSON Object hợp lệ theo cấu trúc sau:
{
  "errorType": "grammar",
  "errorTypeLabelVi": "Ngữ pháp - Trật tự từ chỉ thời gian",
  "whyIncorrectVi": "Giải thích chi tiết vì sao học viên sai...",
  "whyCorrectVi": "Giải thích tại sao đáp án đúng là chuẩn xác...",
  "knowledgePointVi": "Quy tắc cốt lõi cần ghi nhớ...",
  "examples": [
    {
      "hanzi": "我昨天买了一本书。",
      "pinyin": "Wǒ zuótiān mǎi le yì běn shū.",
      "vietnamese": "Hôm qua tôi đã mua một quyển sách."
    }
  ],
  "recommendedPracticeAction": "Luyện thêm 3 câu trắc nghiệm về lượng từ và trợ từ.",
  "recommendedRoute": "/ai-exercises?hsk={{hskLevel}}&source=GRAMMAR"
}
""";
    }

    private static string BuildErrorAnalysisUserPrompt(
        string skillCategory,
        string questionText,
        string userAnswer,
        string correctAnswer,
        int hskLevel)
    {
        return $"""
[YÊU CẦU PHÂN TÍCH LỖI SAI HSK {hskLevel}]
- Kỹ năng/Chủ đề: {skillCategory}
- Câu hỏi/Đề bài: {questionText}
- Câu trả lời của học viên: {userAnswer}
- Đáp án đúng của hệ thống: {correctAnswer}

Hãy phân tích lỗi sai trên và trả về JSON theo đúng định dạng được yêu cầu.
""";
    }

    private async Task UpsertSkillStatsAsync(
        Guid userId,
        List<SkillStatisticDto> skills,
        CancellationToken cancellationToken)
    {
        var existing = await _dbContext.LearningSkillStatistics
            .Where(s => s.UserId == userId)
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;
        foreach (var skill in skills)
        {
            var entity = existing.FirstOrDefault(e => e.SkillCategory == skill.SkillCategory);
            if (entity is null)
            {
                entity = new LearningSkillStatistic
                {
                    UserId = userId,
                    SkillCategory = skill.SkillCategory
                };
                _dbContext.LearningSkillStatistics.Add(entity);
            }

            entity.TotalAttempts = skill.TotalAttempts;
            entity.CorrectAttempts = skill.CorrectAttempts;
            entity.IncorrectAttempts = skill.IncorrectAttempts;
            entity.AccuracyPercent = skill.AccuracyPercent;
            entity.WeakTopicsJson = JsonSerializer.Serialize(skill.WeakTopics, JsonOptions);
            entity.LastAssessedAt = now;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public static List<SkillStatisticDto> BuildSkillStats(IReadOnlyList<AttemptPoint> attempts)
    {
        var results = new List<SkillStatisticDto>();
        foreach (var (key, label) in SkillDefinitions)
        {
            var matched = attempts.Where(a => a.SkillCategory == key).ToList();
            var total = matched.Count;
            var correct = matched.Count(m => m.IsCorrect);
            var incorrect = total - correct;
            var accuracy = total > 0 ? Math.Round(correct * 100.0 / total, 1) : 0;

            var weakTopics = matched
                .Where(m => !m.IsCorrect && !string.IsNullOrWhiteSpace(m.TopicTitle))
                .GroupBy(m => m.TopicTitle)
                .OrderByDescending(g => g.Count())
                .Take(3)
                .Select(g => g.Key)
                .ToList();

            results.Add(new SkillStatisticDto
            {
                SkillCategory = key,
                LabelVi = label,
                TotalAttempts = total,
                CorrectAttempts = correct,
                IncorrectAttempts = incorrect,
                AccuracyPercent = accuracy,
                HasData = total > 0,
                WeakTopics = weakTopics
            });
        }

        return results;
    }

    public static List<ErrorAnalysisWeakPointDto> BuildWeakPoints(IReadOnlyList<AttemptPoint> attempts)
    {
        return attempts
            .GroupBy(a => new { a.TopicTitle, a.SkillCategory, a.HskLevel })
            .Select(g =>
            {
                var total = g.Count();
                var correct = g.Count(x => x.IsCorrect);
                var incorrect = total - correct;
                var accuracy = Math.Round(correct * 100.0 / total, 1);
                return new
                {
                    g.Key.TopicTitle,
                    g.Key.SkillCategory,
                    g.Key.HskLevel,
                    Total = total,
                    Incorrect = incorrect,
                    Accuracy = accuracy
                };
            })
            .Where(x => x.Incorrect > 0 && (x.Accuracy < 75 || x.Incorrect >= 2))
            .OrderByDescending(x => x.Incorrect)
            .ThenBy(x => x.Accuracy)
            .Take(6)
            .Select(x => new ErrorAnalysisWeakPointDto
            {
                TopicTitle = string.IsNullOrWhiteSpace(x.TopicTitle) ? "Kiến thức tổng hợp" : x.TopicTitle,
                SkillCategory = x.SkillCategory,
                HskLevel = x.HskLevel,
                TotalAttempts = x.Total,
                IncorrectAttempts = x.Incorrect,
                AccuracyPercent = x.Accuracy,
                EvidenceVi = $"Sai {x.Incorrect}/{x.Total} lần làm (độ chính xác {x.Accuracy}%).",
                SuggestedActionRoute = "/ai-exercises"
            })
            .ToList();
    }

    public static string NormalizeSkill(string? category)
    {
        if (string.IsNullOrWhiteSpace(category)) return "unclassified";
        var c = category.Trim().ToLowerInvariant();
        return c switch
        {
            "vocabulary" or "vocab" => "vocabulary",
            "grammar" or "sentence" => "grammar",
            "reading" => "reading",
            "listening" => "listening",
            "hanzi" or "character" or "writing" => "hanzi",
            "pinyin" or "tone" or "phonetics" => "pinyin",
            _ => c.Contains(':') ? c : $"unclassified:{c}"
        };
    }

    private static string GetSkillLabelVi(string category)
    {
        return category switch
        {
            "vocabulary" => "Từ vựng (Vocabulary)",
            "grammar" => "Ngữ pháp (Grammar)",
            "hanzi" => "Nhận diện chữ Hán (Hanzi)",
            "pinyin" => "Pinyin & Thanh điệu",
            "reading" => "Đọc hiểu (Reading)",
            "listening" => "Nghe hiểu (Listening)",
            _ => "Kiến thức tổng hợp"
        };
    }

    private static string NormalizeAnswer(string input) =>
        input.Trim().Replace(" ", "").Replace("。", "").Replace(".", "").Replace("？", "").Replace("?", "");

    public sealed record AttemptPoint(string SkillCategory, string TopicTitle, int HskLevel, bool IsCorrect);
}
