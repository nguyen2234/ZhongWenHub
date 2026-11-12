using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Data.Entities.AI;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.AILearning;

public interface IAIExerciseService
{
    Task<List<AiGeneratedExerciseDto>> GenerateExercisesAsync(Guid userId, GenerateAiExercisesRequestDto request, CancellationToken cancellationToken = default);
    Task<List<AiGeneratedExerciseDto>> ListMyExercisesAsync(Guid userId, int? hskLevel = null, Guid? lessonId = null, CancellationToken cancellationToken = default);
    Task<AiExerciseAttemptResultDto> SubmitAttemptAsync(Guid userId, Guid aiExerciseId, SubmitAiExerciseAttemptDto request, CancellationToken cancellationToken = default);
}

public sealed class AIExerciseService : IAIExerciseService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private static readonly HashSet<string> AllowedSourceTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "VOCABULARY", "GRAMMAR", "READING", "WEAKNESS"
    };

    private static readonly HashSet<string> AllowedExerciseTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "multiple-choice", "fill-blank", "sentence-order", "meaning-match", "pinyin-match", "error-correction"
    };

    private readonly ApplicationDbContext _dbContext;
    private readonly IAIProvider _aiProvider;
    private readonly IAIUsageLogger _usageLogger;
    private readonly IAIErrorAnalysisService _errorAnalysisService;
    private readonly ILogger<AIExerciseService> _logger;

    public AIExerciseService(
        ApplicationDbContext dbContext,
        IAIProvider aiProvider,
        IAIUsageLogger usageLogger,
        IAIErrorAnalysisService errorAnalysisService,
        ILogger<AIExerciseService> logger)
    {
        _dbContext = dbContext;
        _aiProvider = aiProvider;
        _usageLogger = usageLogger;
        _errorAnalysisService = errorAnalysisService;
        _logger = logger;
    }

    public async Task<List<AiGeneratedExerciseDto>> GenerateExercisesAsync(
        Guid userId,
        GenerateAiExercisesRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var hskLevel = Math.Clamp(request.HskLevel, 1, 4);
        var count = Math.Clamp(request.Count, 1, 5);
        var sourceType = AllowedSourceTypes.Contains(request.SourceType?.Trim() ?? "")
            ? request.SourceType!.Trim().ToUpperInvariant()
            : "VOCABULARY";
        var exerciseType = AllowedExerciseTypes.Contains(request.ExerciseType?.Trim() ?? "")
            ? request.ExerciseType!.Trim().ToLowerInvariant()
            : "multiple-choice";

        await _usageLogger.EnsureWithinDailyBudgetAsync(userId, cancellationToken);

        var (sourceContextText, sourceReviewNote) = await BuildVerifiedSourceContextAsync(
            userId, hskLevel, request.LessonId, sourceType, cancellationToken);

        if (string.IsNullOrWhiteSpace(sourceContextText))
        {
            throw AITutorException.BadRequest("Không có đủ dữ liệu nguồn hợp lệ để tạo bài tập cho lựa chọn này.");
        }

        var systemPrompt = BuildGeneratorSystemPrompt(hskLevel, exerciseType, count);
        var userPrompt = $"[NGUỒN DỮ LIỆU ĐÃ XÁC MINH - HSK {hskLevel} - {sourceType}]\n{sourceContextText}\n\nHãy tạo {count} bài tập dạng '{exerciseType}' đúng chuẩn JSON.";

        AIProviderResponse aiResponse;
        try
        {
            aiResponse = await _aiProvider.GenerateContentAsync(
                new AIProviderRequest
                {
                    Feature = "AI_EXERCISE_GEN",
                    SystemInstruction = systemPrompt,
                    UserPrompt = userPrompt,
                    ExpectJson = true,
                    Temperature = 0.3,
                    MaxOutputTokens = 1800
                },
                cancellationToken);
            await _usageLogger.LogAsync(userId, "AI_EXERCISE_GEN", aiResponse, true, null, cancellationToken);
        }
        catch (AITutorException ex)
        {
            await _usageLogger.LogAsync(userId, "AI_EXERCISE_GEN", null, false, $"HTTP_{ex.StatusCode}", cancellationToken);
            throw;
        }

        var validatedEntities = ParseAndValidateExercises(
            userId,
            hskLevel,
            request.LessonId,
            sourceType,
            exerciseType,
            sourceReviewNote,
            aiResponse.RawText,
            count);

        if (validatedEntities.Count == 0)
        {
            throw AITutorException.ProviderUnavailable("Bài tập AI tạo ra chưa đạt chuẩn kiểm định schema/đáp án. Vui lòng thử lại.");
        }

        _dbContext.AiGeneratedExercises.AddRange(validatedEntities);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return validatedEntities.Select(MapDto).ToList();
    }

    public async Task<List<AiGeneratedExerciseDto>> ListMyExercisesAsync(
        Guid userId,
        int? hskLevel = null,
        Guid? lessonId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.AiGeneratedExercises
            .AsNoTracking()
            .Where(e => e.UserId == userId);

        if (hskLevel is >= 1 and <= 4)
        {
            query = query.Where(e => e.HskLevel == hskLevel.Value);
        }

        if (lessonId.HasValue)
        {
            query = query.Where(e => e.LessonId == lessonId.Value);
        }

        var items = await query
            .OrderByDescending(e => e.CreatedAt)
            .Take(30)
            .ToListAsync(cancellationToken);

        return items.Select(MapDto).ToList();
    }

    public async Task<AiExerciseAttemptResultDto> SubmitAttemptAsync(
        Guid userId,
        Guid aiExerciseId,
        SubmitAiExerciseAttemptDto request,
        CancellationToken cancellationToken = default)
    {
        var exercise = await _dbContext.AiGeneratedExercises
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == aiExerciseId && e.UserId == userId, cancellationToken);

        if (exercise is null)
        {
            throw new KeyNotFoundException("Không tìm thấy bài tập AI này.");
        }

        var isCorrect = EvaluateAttempt(exercise, request);
        var userAnswerText = !string.IsNullOrWhiteSpace(request.UserAnswer)
            ? PromptSanitizer.SanitizeUntrustedText(request.UserAnswer, 400)
            : (request.SelectedIndex?.ToString() ?? string.Empty);

        var skillCategory = MapSkillCategory(exercise.ExerciseType, exercise.SourceType);

        var attempt = new AiExerciseAttempt
        {
            UserId = userId,
            AiExerciseId = exercise.Id,
            UserAnswer = userAnswerText,
            SelectedIndex = request.SelectedIndex,
            IsCorrect = isCorrect,
            SkillCategory = skillCategory,
            AttemptedAt = DateTime.UtcNow
        };

        _dbContext.AiExerciseAttempts.Add(attempt);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Update persisted skill statistics deterministically
        await _errorAnalysisService.RecomputeAndPersistSkillStatsAsync(userId, cancellationToken);

        return new AiExerciseAttemptResultDto
        {
            AttemptId = attempt.Id,
            AiExerciseId = exercise.Id,
            IsCorrect = isCorrect,
            CorrectIndex = exercise.CorrectIndex,
            CorrectAnswer = exercise.CorrectAnswer,
            ExplanationVi = exercise.ExplanationVi,
            SkillCategory = skillCategory,
            AttemptedAt = attempt.AttemptedAt
        };
    }

    public static bool EvaluateAttempt(AiGeneratedExercise exercise, SubmitAiExerciseAttemptDto request)
    {
        if (exercise.CorrectIndex.HasValue && request.SelectedIndex.HasValue)
        {
            return request.SelectedIndex.Value == exercise.CorrectIndex.Value;
        }

        if (!string.IsNullOrWhiteSpace(exercise.CorrectAnswer) && !string.IsNullOrWhiteSpace(request.UserAnswer))
        {
            return string.Equals(
                NormalizeAnswer(exercise.CorrectAnswer),
                NormalizeAnswer(request.UserAnswer),
                StringComparison.OrdinalIgnoreCase);
        }

        return false;
    }

    public List<AiGeneratedExercise> ParseAndValidateExercises(
        Guid userId,
        int hskLevel,
        Guid? lessonId,
        string sourceType,
        string requestedExerciseType,
        string sourceReviewNote,
        string rawJson,
        int maxCount)
    {
        var results = new List<AiGeneratedExercise>();
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
            if (!doc.RootElement.TryGetProperty("exercises", out var arr) || arr.ValueKind != JsonValueKind.Array)
            {
                return results;
            }

            foreach (var item in arr.EnumerateArray().Take(maxCount))
            {
                var validated = ValidateSingleExerciseItem(
                    userId, hskLevel, lessonId, sourceType, requestedExerciseType, sourceReviewNote, item);
                if (validated is not null)
                {
                    results.Add(validated);
                }
            }
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Invalid JSON returned from AI exercise generator.");
        }

        return results;
    }

    public static AiGeneratedExercise? ValidateSingleExerciseItem(
        Guid userId,
        int hskLevel,
        Guid? lessonId,
        string sourceType,
        string requestedExerciseType,
        string sourceReviewNote,
        JsonElement item)
    {
        if (item.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        var promptZh = item.TryGetProperty("promptZh", out var pz) && pz.ValueKind == JsonValueKind.String
            ? pz.GetString()?.Trim() ?? string.Empty
            : string.Empty;

        if (string.IsNullOrWhiteSpace(promptZh))
        {
            return null;
        }

        var promptPinyin = item.TryGetProperty("promptPinyin", out var pp) && pp.ValueKind == JsonValueKind.String
            ? pp.GetString()?.Trim()
            : null;
        var promptVi = item.TryGetProperty("promptVi", out var pv) && pv.ValueKind == JsonValueKind.String
            ? pv.GetString()?.Trim()
            : null;
        var explanationVi = item.TryGetProperty("explanationVi", out var ev) && ev.ValueKind == JsonValueKind.String
            ? ev.GetString()?.Trim() ?? string.Empty
            : string.Empty;

        if (string.IsNullOrWhiteSpace(explanationVi))
        {
            return null;
        }

        var exType = item.TryGetProperty("exerciseType", out var et) && et.ValueKind == JsonValueKind.String && AllowedExerciseTypes.Contains(et.GetString() ?? "")
            ? et.GetString()!.Trim().ToLowerInvariant()
            : requestedExerciseType;

        var options = new List<string>();
        if (item.TryGetProperty("options", out var optArr) && optArr.ValueKind == JsonValueKind.Array)
        {
            foreach (var o in optArr.EnumerateArray())
            {
                if (o.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(o.GetString()))
                {
                    options.Add(o.GetString()!.Trim());
                }
            }
        }

        int? correctIndex = item.TryGetProperty("correctIndex", out var ci) && ci.TryGetInt32(out var ciVal)
            ? ciVal
            : null;

        var correctAnswer = item.TryGetProperty("correctAnswer", out var ca) && ca.ValueKind == JsonValueKind.String
            ? ca.GetString()?.Trim()
            : null;

        var isChoiceBased = exType is "multiple-choice" or "meaning-match" or "pinyin-match" or "fill-blank";
        if (isChoiceBased)
        {
            // Enforce 2..4 distinct options and a valid unique correctIndex
            if (options.Count < 2 || options.Count > 4)
            {
                return null;
            }

            if (options.Distinct(StringComparer.OrdinalIgnoreCase).Count() != options.Count)
            {
                return null;
            }

            if (!correctIndex.HasValue || correctIndex.Value < 0 || correctIndex.Value >= options.Count)
            {
                return null;
            }

            correctAnswer = options[correctIndex.Value];
        }
        else
        {
            if (string.IsNullOrWhiteSpace(correctAnswer))
            {
                return null;
            }
        }

        return new AiGeneratedExercise
        {
            UserId = userId,
            HskLevel = hskLevel,
            LessonId = lessonId,
            SourceType = sourceType,
            ExerciseType = exType,
            OriginTag = "AI_GENERATED",
            AcademicStatus = "UNAPPROVED_EXPERIMENTAL",
            SourceReviewNote = sourceReviewNote,
            PromptZh = promptZh,
            PromptPinyin = promptPinyin,
            PromptVi = promptVi,
            OptionsJson = options.Count > 0 ? JsonSerializer.Serialize(options, JsonOptions) : null,
            CorrectIndex = correctIndex,
            CorrectAnswer = correctAnswer,
            ExplanationVi = explanationVi
        };
    }

    private async Task<(string ContextText, string ReviewNote)> BuildVerifiedSourceContextAsync(
        Guid userId,
        int hskLevel,
        Guid? lessonId,
        string sourceType,
        CancellationToken cancellationToken)
    {
        if (sourceType == "WEAKNESS")
        {
            var weakAttempts = await _dbContext.StudentPracticeAttempts
                .AsNoTracking()
                .Where(a => a.UserId == userId && !a.IsCorrect)
                .OrderByDescending(a => a.AttemptedAt)
                .Take(10)
                .Select(a => new { a.TopicTitle, a.Category, a.HskLevel })
                .ToListAsync(cancellationToken);

            if (weakAttempts.Count > 0)
            {
                var topics = weakAttempts
                    .Select(w => $"{w.TopicTitle} ({w.Category}, HSK {w.HskLevel})")
                    .Distinct()
                    .Take(5);
                return (string.Join("\n", topics), "Sinh từ lỗi sai thực tế của học viên (AI_GENERATED).");
            }
        }

        if (sourceType == "GRAMMAR")
        {
            var gpQuery = _dbContext.GrammarPoints.AsNoTracking().Where(g => g.Status == "PUBLISHED");
            if (lessonId.HasValue)
            {
                gpQuery = gpQuery.Where(g => g.LessonId == lessonId.Value);
            }
            else
            {
                gpQuery = gpQuery.Where(g => g.HskLevel == hskLevel);
            }

            var gps = await gpQuery
                .OrderBy(g => g.Title)
                .Take(5)
                .Select(g => new { g.Title, g.StructureFormula, g.Explanation })
                .ToListAsync(cancellationToken);

            var text = string.Join("\n", gps.Select(g => $"- {g.Title}: {g.StructureFormula} ({g.Explanation})"));
            return (text, "Sinh từ điểm ngữ pháp trong kho dữ liệu; bài tập gắn nhãn AI_GENERATED.");
        }

        if (sourceType == "READING")
        {
            var lessonQuery = _dbContext.Lessons
                .AsNoTracking()
                .Include(l => l.Course)
                .Where(l => l.Status == "PUBLISHED" && l.DialogueJson != null && (l.Course == null || l.Course.HskLevel == hskLevel));

            if (lessonId.HasValue)
            {
                lessonQuery = lessonQuery.Where(l => l.Id == lessonId.Value);
            }

            var lesson = await lessonQuery.OrderBy(l => l.LessonNumber).FirstOrDefaultAsync(cancellationToken);
            if (lesson?.DialogueJson is not null)
            {
                var (sentencesText, academicApproved) = ExtractReadingSentencesOnly(lesson.DialogueJson);
                if (!string.IsNullOrWhiteSpace(sentencesText))
                {
                    var note = academicApproved
                        ? "Sinh từ bài đọc đã duyệt học thuật; câu hỏi gắn nhãn AI_GENERATED."
                        : "Sinh từ bài đọc thử nghiệm (chưa duyệt học thuật); không sử dụng 110 câu hỏi thiếu questionZh HSK 2-4.";
                    return (sentencesText, note);
                }
            }
        }

        // Default: VOCABULARY
        var vocabQuery = _dbContext.Vocabularies.AsNoTracking().Where(v => v.Status == "PUBLISHED");
        if (lessonId.HasValue)
        {
            vocabQuery = vocabQuery.Where(v =>
                v.LessonId == lessonId.Value ||
                v.LessonVocabularies.Any(lv => lv.LessonId == lessonId.Value));
        }
        else
        {
            vocabQuery = vocabQuery.Where(v => v.HskLevel == hskLevel);
        }

        var vocabs = await vocabQuery
            .OrderBy(v => v.Hanzi)
            .Take(8)
            .Select(v => new { v.Hanzi, v.Pinyin, v.MeaningVi })
            .ToListAsync(cancellationToken);

        var vocabText = string.Join("\n", vocabs.Select(v => $"- {v.Hanzi} ({v.Pinyin}): {v.MeaningVi}"));
        return (vocabText, "Sinh từ từ vựng HSK 2.0; bài tập gắn nhãn AI_GENERATED.");
    }

    private static (string Text, bool AcademicApproved) ExtractReadingSentencesOnly(string dialogueJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(dialogueJson);
            if (!doc.RootElement.TryGetProperty("readingPassage", out var rp) || rp.ValueKind != JsonValueKind.Object)
            {
                return (string.Empty, false);
            }

            var approved = rp.TryGetProperty("academicApproved", out var ap) && ap.ValueKind == JsonValueKind.True;
            if (!rp.TryGetProperty("sentences", out var sentences) || sentences.ValueKind != JsonValueKind.Array)
            {
                return (string.Empty, approved);
            }

            var lines = new List<string>();
            foreach (var s in sentences.EnumerateArray().Take(4))
            {
                var zh = s.TryGetProperty("zh", out var z) ? z.GetString() : null;
                var py = s.TryGetProperty("pinyin", out var p) ? p.GetString() : null;
                var vi = s.TryGetProperty("vi", out var v) ? v.GetString() : null;
                if (!string.IsNullOrWhiteSpace(zh))
                {
                    lines.Add($"- {zh} | {py} | {vi}");
                }
            }

            return (string.Join("\n", lines), approved);
        }
        catch (JsonException)
        {
            return (string.Empty, false);
        }
    }

    private static string BuildGeneratorSystemPrompt(int hskLevel, string exerciseType, int count)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Bạn là chuyên gia biên soạn bài tập HSK {hskLevel} cho người Việt.");
        sb.AppendLine($"Hãy tạo chính xác {count} bài tập dạng '{exerciseType}' dựa STRICTLY trên dữ liệu nguồn được cung cấp.");
        sb.AppendLine("Ràng buộc bắt buộc:");
        sb.AppendLine($"1. Từ vựng và ngữ pháp không vượt quá cấp HSK {hskLevel} một cách không cần thiết.");
        sb.AppendLine("2. Không tạo câu hỏi từ trường dữ liệu bị thiếu hoặc bịa đặt thông tin ngoài nguồn.");
        sb.AppendLine("3. Với dạng multiple-choice, meaning-match, pinyin-match, fill-blank: cung cấp đúng 4 đáp án khác nhau, 1 đáp án đúng duy nhất (correctIndex 0..3).");
        sb.AppendLine("4. Với dạng sentence-order hoặc error-correction: options để mảng rỗng [], điền đáp án chuẩn vào correctAnswer.");
        sb.AppendLine("TRẢ VỀ DUY NHẤT 1 JSON OBJECT:");
        sb.AppendLine("""
{
  "exercises": [
    {
      "exerciseType": "multiple-choice",
      "skillCategory": "vocabulary",
      "promptZh": "Câu hỏi hoặc câu tiếng Trung",
      "promptPinyin": "Pinyin chuẩn dấu thanh",
      "promptVi": "Hướng dẫn bằng tiếng Việt",
      "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
      "correctIndex": 0,
      "correctAnswer": "Phương án A",
      "explanationVi": "Giải thích ngắn gọn, rõ ràng bằng tiếng Việt"
    }
  ]
}
""");
        return sb.ToString();
    }

    private static string MapSkillCategory(string exerciseType, string sourceType)
    {
        if (exerciseType == "pinyin-match") return "pinyin";
        if (sourceType == "GRAMMAR" || exerciseType is "sentence-order" or "error-correction") return "grammar";
        if (sourceType == "READING") return "reading";
        return "vocabulary";
    }

    private static string NormalizeAnswer(string input) =>
        input.Trim().Replace(" ", "").Replace("。", "").Replace(".", "").Replace("？", "").Replace("?", "");

    private static AiGeneratedExerciseDto MapDto(AiGeneratedExercise e)
    {
        var options = new List<string>();
        if (!string.IsNullOrWhiteSpace(e.OptionsJson))
        {
            try
            {
                options = JsonSerializer.Deserialize<List<string>>(e.OptionsJson, JsonOptions) ?? new List<string>();
            }
            catch (JsonException) { }
        }

        return new AiGeneratedExerciseDto
        {
            Id = e.Id,
            HskLevel = e.HskLevel,
            LessonId = e.LessonId,
            SourceType = e.SourceType,
            ExerciseType = e.ExerciseType,
            OriginTag = e.OriginTag,
            AcademicStatus = e.AcademicStatus,
            SourceReviewNote = e.SourceReviewNote,
            PromptZh = e.PromptZh,
            PromptPinyin = e.PromptPinyin,
            PromptVi = e.PromptVi,
            Options = options,
            CorrectIndex = e.CorrectIndex,
            CorrectAnswer = e.CorrectAnswer,
            ExplanationVi = e.ExplanationVi,
            CreatedAt = e.CreatedAt
        };
    }
}
