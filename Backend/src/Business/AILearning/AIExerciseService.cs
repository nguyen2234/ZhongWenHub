using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AILearning.Services.Competency;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Data.Entities.AI;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Entities.Learning;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.AILearning;

public interface IAIExerciseService
{
    Task<List<AiGeneratedExerciseDto>> GenerateExercisesAsync(Guid userId, GenerateAiExercisesRequestDto request, CancellationToken cancellationToken = default);
    Task<List<AiGeneratedExerciseDto>> ListMyExercisesAsync(Guid userId, int? hskLevel = null, Guid? lessonId = null, CancellationToken cancellationToken = default);
    Task<AiExerciseAttemptResultDto> SubmitAttemptAsync(Guid userId, Guid aiExerciseId, SubmitAiExerciseAttemptDto request, CancellationToken cancellationToken = default);
    Task<AdaptiveSessionDto> GenerateAdaptiveSessionAsync(Guid userId, GenerateAdaptiveSessionRequestDto request, CancellationToken cancellationToken = default);
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
    private readonly ICompetencyProfileService? _competencyService;
    private readonly ILogger<AIExerciseService> _logger;

    public AIExerciseService(
        ApplicationDbContext dbContext,
        IAIProvider aiProvider,
        IAIUsageLogger usageLogger,
        IAIErrorAnalysisService errorAnalysisService,
        ILogger<AIExerciseService> logger,
        ICompetencyProfileService? competencyService = null)
    {
        _dbContext = dbContext;
        _aiProvider = aiProvider;
        _usageLogger = usageLogger;
        _errorAnalysisService = errorAnalysisService;
        _logger = logger;
        _competencyService = competencyService;
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

        // Security: Newly generated exercises must NOT expose answers before submission
        return validatedEntities.Select(e => MapDto(e, isAttempted: false)).ToList();
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

        // Determine which exercises have been attempted by this user
        var attemptedExerciseIds = await _dbContext.AiExerciseAttempts
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .Select(a => a.AiExerciseId)
            .ToHashSetAsync(cancellationToken);

        return items.Select(e => MapDto(e, isAttempted: attemptedExerciseIds.Contains(e.Id))).ToList();
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

        // Idempotency check: if already attempted, return existing result without duplicate records or re-calling LLM
        var existingAttempt = await _dbContext.AiExerciseAttempts
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.AiExerciseId == aiExerciseId && a.UserId == userId, cancellationToken);

        if (existingAttempt != null)
        {
            AIErrorAnalysisDetailDto? existingAnalysis = null;
            if (!existingAttempt.IsCorrect)
            {
                existingAnalysis = await _errorAnalysisService.AnalyzeErrorDetailAsync(
                    userId,
                    new RequestErrorAnalysisDto
                    {
                        ExerciseId = aiExerciseId,
                        QuestionText = exercise.PromptZh,
                        UserAnswer = existingAttempt.UserAnswer,
                        CorrectAnswer = exercise.CorrectAnswer,
                        SkillCategory = existingAttempt.SkillCategory,
                        HskLevel = exercise.HskLevel
                    },
                    cancellationToken);
            }

            return new AiExerciseAttemptResultDto
            {
                AttemptId = existingAttempt.Id,
                AiExerciseId = exercise.Id,
                IsCorrect = existingAttempt.IsCorrect,
                CorrectIndex = exercise.CorrectIndex,
                CorrectAnswer = exercise.CorrectAnswer,
                ExplanationVi = exercise.ExplanationVi,
                SkillCategory = existingAttempt.SkillCategory,
                AttemptedAt = existingAttempt.AttemptedAt,
                ErrorAnalysis = existingAnalysis,
                NextSuggestion = BuildNextSuggestion(existingAttempt.SkillCategory, exercise.HskLevel, existingAttempt.IsCorrect)
            };
        }

        var isCorrect = EvaluateAttempt(exercise, request);
        var userAnswerText = !string.IsNullOrWhiteSpace(request.UserAnswer)
            ? PromptSanitizer.SanitizeUntrustedText(request.UserAnswer, 400)
            : (request.SelectedIndex?.ToString() ?? string.Empty);

        var skillCategory = MapSkillCategory(exercise.ExerciseType, exercise.SourceType);
        var now = DateTime.UtcNow;

        var attempt = new AiExerciseAttempt
        {
            UserId = userId,
            AiExerciseId = exercise.Id,
            UserAnswer = userAnswerText,
            SelectedIndex = request.SelectedIndex,
            IsCorrect = isCorrect,
            SkillCategory = skillCategory,
            AttemptedAt = now
        };
        _dbContext.AiExerciseAttempts.Add(attempt);

        // Record StudentPracticeAttempt with 'ai_' prefix so other services can see student progress without duplicate counts in BKT
        var practiceAttempt = new StudentPracticeAttempt
        {
            UserId = userId,
            ExerciseId = $"ai_{exercise.Id}",
            QuestionId = exercise.Id.ToString(),
            KnowledgePointId = exercise.SourceType,
            TopicTitle = exercise.PromptZh,
            Category = skillCategory,
            HskLevel = exercise.HskLevel,
            UserAnswer = userAnswerText,
            IsCorrect = isCorrect,
            AttemptedAt = now
        };
        _dbContext.StudentPracticeAttempts.Add(practiceAttempt);

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Update persisted skill statistics deterministically
        await _errorAnalysisService.RecomputeAndPersistSkillStatsAsync(userId, cancellationToken);

        // Detailed error analysis if student was incorrect
        AIErrorAnalysisDetailDto? errorAnalysis = null;
        if (!isCorrect)
        {
            errorAnalysis = await _errorAnalysisService.AnalyzeErrorDetailAsync(
                userId,
                new RequestErrorAnalysisDto
                {
                    ExerciseId = exercise.Id,
                    QuestionText = exercise.PromptZh,
                    UserAnswer = userAnswerText,
                    CorrectAnswer = exercise.CorrectAnswer,
                    SkillCategory = skillCategory,
                    HskLevel = exercise.HskLevel
                },
                cancellationToken);
        }

        var nextSuggestion = BuildNextSuggestion(skillCategory, exercise.HskLevel, isCorrect);

        return new AiExerciseAttemptResultDto
        {
            AttemptId = attempt.Id,
            AiExerciseId = exercise.Id,
            IsCorrect = isCorrect,
            CorrectIndex = exercise.CorrectIndex,
            CorrectAnswer = exercise.CorrectAnswer,
            ExplanationVi = exercise.ExplanationVi,
            SkillCategory = skillCategory,
            AttemptedAt = attempt.AttemptedAt,
            ErrorAnalysis = errorAnalysis,
            NextSuggestion = nextSuggestion
        };
    }

    public async Task<AdaptiveSessionDto> GenerateAdaptiveSessionAsync(
        Guid userId,
        GenerateAdaptiveSessionRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var targetHsk = request.TargetHskLevel.HasValue && request.TargetHskLevel.Value >= 1 && request.TargetHskLevel.Value <= 4
            ? request.TargetHskLevel.Value
            : 1;

        List<WeakConceptDto> weakConcepts = new();
        if (_competencyService != null && !request.TargetHskLevel.HasValue)
        {
            try
            {
                var profile = await _competencyService.GetCompetencyProfileAsync(userId, cancellationToken);
                targetHsk = profile.EstimatedHskLevel ?? profile.SelectedHskLevel;
                targetHsk = Math.Clamp(targetHsk, 1, 4);
                weakConcepts = profile.TopWeakConcepts;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not fetch Competency Profile for adaptive session, using default target HSK {Hsk}", targetHsk);
            }
        }

        var questionCount = Math.Clamp(request.QuestionCount, 1, 10);
        var focusSkill = (request.FocusSkill ?? "all").Trim().ToLowerInvariant();

        // Anti-duplication: load recent attempted prompts
        var recentPrompts = await _dbContext.AiExerciseAttempts
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.AttemptedAt)
            .Take(30)
            .Select(a => a.AiExercise != null ? a.AiExercise.PromptZh : string.Empty)
            .Where(p => !string.IsNullOrEmpty(p))
            .ToListAsync(cancellationToken);

        var recentSet = new HashSet<string>(recentPrompts, StringComparer.OrdinalIgnoreCase);

        // Fetch SRS due vocabulary
        List<string> srsDueWords = new();
        if (request.IncludeSrsDue)
        {
            srsDueWords = await _dbContext.StudentVocabularyProgresses
                .AsNoTracking()
                .Where(p => p.UserId == userId && p.NextReviewAt <= DateTime.UtcNow)
                .OrderBy(p => p.NextReviewAt)
                .Take(5)
                .Select(p => p.Hanzi ?? string.Empty)
                .Where(h => !string.IsNullOrEmpty(h))
                .ToListAsync(cancellationToken);
        }

        var strategySummary = BuildAdaptiveStrategySummary(targetHsk, focusSkill, weakConcepts, srsDueWords.Count);
        var sessionExercises = new List<AiGeneratedExercise>();

        // Plan slots
        for (var i = 0; i < questionCount; i++)
        {
            var slotSkill = focusSkill != "all" ? focusSkill : PickAdaptiveSlotSkill(i, weakConcepts, srsDueWords.Count > 0);
            var slotSourceType = slotSkill switch
            {
                "grammar" => "GRAMMAR",
                "reading" => "READING",
                "pinyin" => "VOCABULARY",
                _ => (srsDueWords.Count > 0 && i == 0 ? "VOCABULARY" : (weakConcepts.Count > 0 && i % 2 == 1 ? "WEAKNESS" : "VOCABULARY"))
            };

            var slotExerciseType = slotSkill switch
            {
                "pinyin" => "pinyin-match",
                "reading" => "multiple-choice",
                "grammar" => (i % 2 == 0 ? "multiple-choice" : "sentence-order"),
                _ => (i % 2 == 0 ? "multiple-choice" : "meaning-match")
            };

            AiGeneratedExercise? generated = null;

            // Try LLM generation first
            try
            {
                var (sourceText, reviewNote) = await BuildVerifiedSourceContextAsync(userId, targetHsk, null, slotSourceType, cancellationToken);
                if (!string.IsNullOrWhiteSpace(sourceText))
                {
                    var systemPrompt = BuildGeneratorSystemPrompt(targetHsk, slotExerciseType, 1);
                    var userPrompt = $"[BÀI TẬP THÍCH ỨNG - HSK {targetHsk} - {slotSourceType}]\n{sourceText}\n\nTạo 1 bài tập '{slotExerciseType}' chất lượng cao, đúng chuẩn JSON.";

                    var aiResp = await _aiProvider.GenerateContentAsync(
                        new AIProviderRequest
                        {
                            Feature = "AI_EXERCISE_GEN",
                            SystemInstruction = systemPrompt,
                            UserPrompt = userPrompt,
                            ExpectJson = true,
                            Temperature = 0.3,
                            MaxOutputTokens = 900
                        },
                        cancellationToken);

                    var parsed = ParseAndValidateExercises(userId, targetHsk, null, slotSourceType, slotExerciseType, reviewNote, aiResp.RawText, 1);
                    if (parsed.Count > 0 && !recentSet.Contains(parsed[0].PromptZh))
                    {
                        generated = parsed[0];
                        generated.OriginTag = "AI_GENERATED";
                        generated.AcademicStatus = "UNAPPROVED_EXPERIMENTAL";
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "LLM adaptive generation for slot {Slot} failed, using curated fallback", i);
            }

            // Curated Fallback if LLM failed, unvalidated, or duplicate
            if (generated == null)
            {
                generated = await BuildCuratedFallbackExerciseAsync(userId, targetHsk, slotSkill, recentSet, cancellationToken);
            }

            if (generated != null)
            {
                recentSet.Add(generated.PromptZh);
                sessionExercises.Add(generated);
            }
        }

        if (sessionExercises.Count > 0)
        {
            _dbContext.AiGeneratedExercises.AddRange(sessionExercises);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        // Return session DTO with ZERO answer leakage
        var sessionDto = new AdaptiveSessionDto
        {
            SessionId = Guid.NewGuid(),
            HskLevel = targetHsk,
            FocusSkill = focusSkill,
            Mode = "ADAPTIVE",
            TotalQuestions = sessionExercises.Count,
            StrategySummaryVi = strategySummary,
            Questions = sessionExercises.Select(e => MapAdaptiveDto(e, targetHsk)).ToList(),
            CreatedAt = DateTime.UtcNow
        };

        return sessionDto;
    }

    private async Task<AiGeneratedExercise> BuildCuratedFallbackExerciseAsync(
        Guid userId,
        int hskLevel,
        string skill,
        HashSet<string> recentPrompts,
        CancellationToken cancellationToken)
    {
        // 1. If Grammar: build from published GrammarPoints
        if (skill == "grammar")
        {
            var gp = await _dbContext.GrammarPoints
                .AsNoTracking()
                .Where(g => g.HskLevel == hskLevel && g.Status == "PUBLISHED" && !recentPrompts.Contains(g.Title))
                .OrderBy(g => Guid.NewGuid())
                .FirstOrDefaultAsync(cancellationToken);

            if (gp != null)
            {
                var options = new List<string> { gp.StructureFormula, "S + V + O", "S + zài + V", "S + bǎ + O + V" }.Distinct().Take(4).ToList();
                while (options.Count < 4) options.Add($"Công thức cấu trúc {options.Count + 1}");

                return new AiGeneratedExercise
                {
                    UserId = userId,
                    HskLevel = hskLevel,
                    SourceType = "GRAMMAR",
                    ExerciseType = "multiple-choice",
                    OriginTag = "CURATED_QUESTION_BANK",
                    AcademicStatus = "ACADEMIC_APPROVED",
                    SourceReviewNote = "Ngân hàng câu hỏi ngữ pháp kiểm duyệt chính thức.",
                    PromptZh = $"请选择语法点“{gp.Title}”的正确结构：",
                    PromptVi = $"Chọn cấu trúc đúng của điểm ngữ pháp \"{gp.Title}\":",
                    OptionsJson = JsonSerializer.Serialize(options, JsonOptions),
                    CorrectIndex = 0,
                    CorrectAnswer = options[0],
                    ExplanationVi = $"Điểm ngữ pháp '{gp.Title}' có cấu trúc chuẩn là: {gp.StructureFormula}. {gp.Explanation}",
                    CreatedAt = DateTime.UtcNow
                };
            }
        }

        // 2. Default/Vocabulary/Hanzi/Pinyin: build from published Vocabularies
        var vocabs = await _dbContext.Vocabularies
            .AsNoTracking()
            .Where(v => v.HskLevel == hskLevel && v.Status == "PUBLISHED")
            .OrderBy(v => Guid.NewGuid())
            .Take(8)
            .ToListAsync(cancellationToken);

        if (vocabs.Count >= 4)
        {
            var target = vocabs[0];
            var distractors = vocabs.Skip(1).Take(3).ToList();

            if (skill == "pinyin")
            {
                var options = new List<string> { target.Pinyin };
                options.AddRange(distractors.Select(d => d.Pinyin));
                var distinctOptions = options.Distinct().Take(4).ToList();
                while (distinctOptions.Count < 4) distinctOptions.Add("pinyin_opt");

                return new AiGeneratedExercise
                {
                    UserId = userId,
                    HskLevel = hskLevel,
                    SourceType = "VOCABULARY",
                    ExerciseType = "pinyin-match",
                    OriginTag = "CURATED_QUESTION_BANK",
                    AcademicStatus = "ACADEMIC_APPROVED",
                    SourceReviewNote = "Ngân hàng từ vựng kiểm duyệt chính thức.",
                    PromptZh = $"请选择汉字“{target.Hanzi}”的正确拼音：",
                    PromptVi = $"Chọn Pinyin chuẩn của chữ Hán \"{target.Hanzi}\":",
                    OptionsJson = JsonSerializer.Serialize(distinctOptions, JsonOptions),
                    CorrectIndex = 0,
                    CorrectAnswer = distinctOptions[0],
                    ExplanationVi = $"Chữ Hán '{target.Hanzi}' có phiên âm Pinyin chuẩn là: {target.Pinyin} ({target.MeaningVi}).",
                    CreatedAt = DateTime.UtcNow
                };
            }

            // Meaning match
            var meaningOptions = new List<string> { target.MeaningVi };
            meaningOptions.AddRange(distractors.Select(d => d.MeaningVi));
            var distinctMeanings = meaningOptions.Distinct().Take(4).ToList();
            while (distinctMeanings.Count < 4) distinctMeanings.Add("Ý nghĩa tham chiếu");

            return new AiGeneratedExercise
            {
                UserId = userId,
                HskLevel = hskLevel,
                SourceType = "VOCABULARY",
                ExerciseType = "multiple-choice",
                OriginTag = "CURATED_QUESTION_BANK",
                AcademicStatus = "ACADEMIC_APPROVED",
                SourceReviewNote = "Ngân hàng từ vựng kiểm duyệt chính thức.",
                PromptZh = $"请选择“{target.Hanzi}”的意思：",
                PromptPinyin = target.Pinyin,
                PromptVi = $"Chọn nghĩa đúng của từ \"{target.Hanzi}\":",
                OptionsJson = JsonSerializer.Serialize(distinctMeanings, JsonOptions),
                CorrectIndex = 0,
                CorrectAnswer = distinctMeanings[0],
                ExplanationVi = $"Từ '{target.Hanzi}' ({target.Pinyin}) có nghĩa tiếng Việt là: {target.MeaningVi}.",
                CreatedAt = DateTime.UtcNow
            };
        }

        // Generic robust fallback
        return new AiGeneratedExercise
        {
            UserId = userId,
            HskLevel = hskLevel,
            SourceType = "VOCABULARY",
            ExerciseType = "multiple-choice",
            OriginTag = "CURATED_QUESTION_BANK",
            AcademicStatus = "ACADEMIC_APPROVED",
            SourceReviewNote = "Ngân hàng câu hỏi kiểm duyệt chuẩn HSK.",
            PromptZh = "请选择“你好”的意思：",
            PromptPinyin = "Nǐ hǎo",
            PromptVi = "Chọn nghĩa đúng của câu chào \"你好\":",
            OptionsJson = JsonSerializer.Serialize(new List<string> { "Xin chào", "Tạm biệt", "Cảm ơn", "Xin lỗi" }, JsonOptions),
            CorrectIndex = 0,
            CorrectAnswer = "Xin chào",
            ExplanationVi = "你好 (Nǐ hǎo) là lời chào thông dụng nhất trong tiếng Trung, có nghĩa là Xin chào.",
            CreatedAt = DateTime.UtcNow
        };
    }

    private static string PickAdaptiveSlotSkill(int index, List<WeakConceptDto> weakConcepts, bool hasSrsDue)
    {
        if (hasSrsDue && index == 0) return "vocabulary";
        if (weakConcepts.Count > 0 && index % 2 == 1)
        {
            var wc = weakConcepts[(index / 2) % weakConcepts.Count];
            return wc.SkillCategory;
        }

        return (index % 3) switch
        {
            0 => "vocabulary",
            1 => "grammar",
            _ => "reading"
        };
    }

    private static string BuildAdaptiveStrategySummary(
        int targetHsk,
        string focusSkill,
        List<WeakConceptDto> weakConcepts,
        int srsDueCount)
    {
        var sb = new StringBuilder();
        sb.Append($"Chiến lược luyện tập HSK {targetHsk}: ");

        if (focusSkill != "all")
        {
            sb.Append($"Tập trung chuyên sâu kỹ năng {focusSkill.ToUpperInvariant()}. ");
        }
        else
        {
            sb.Append("Thích ứng toàn diện đa kỹ năng. ");
        }

        if (srsDueCount > 0)
        {
            sb.Append($"Đan xen {srsDueCount} từ vựng SRS sắp quên. ");
        }

        if (weakConcepts.Count > 0)
        {
            sb.Append($"Ưu tiên khắc phục điểm yếu: {weakConcepts[0].TitleVi}.");
        }
        else
        {
            sb.Append("Duy trì độ khó phù hợp với cấp độ hiện tại.");
        }

        return sb.ToString();
    }

    private static NextPracticeSuggestionDto BuildNextSuggestion(string skillCategory, int hskLevel, bool isCorrect)
    {
        if (isCorrect)
        {
            return new NextPracticeSuggestionDto
            {
                Title = $"Tiếp tục chinh phục HSK {hskLevel}",
                SkillCategory = skillCategory,
                HskLevel = hskLevel,
                ActionRoute = $"/ai-exercises?hsk={hskLevel}",
                ReasonVi = "Bạn đã trả lời đúng! Hãy tiếp tục duy trì đà luyện tập để nâng cao mastery score."
            };
        }

        return new NextPracticeSuggestionDto
        {
            Title = $"Củng cố kỹ năng {skillCategory.ToUpperInvariant()}",
            SkillCategory = skillCategory,
            HskLevel = hskLevel,
            ActionRoute = $"/ai-exercises?hsk={hskLevel}&source={skillCategory.ToUpperInvariant()}",
            ReasonVi = "Luyện tập thêm 3-5 câu thuộc mảng này để khắc phục triệt để điểm nhầm lẫn."
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
        catch (JsonException)
        {
            return results;
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
            ExplanationVi = explanationVi,
            CreatedAt = DateTime.UtcNow
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

            if (gps.Count > 0)
            {
                var text = string.Join("\n", gps.Select(g => $"- {g.Title}: {g.StructureFormula} ({g.Explanation})"));
                return (text, "Sinh từ điểm ngữ pháp trong kho dữ liệu; bài tập gắn nhãn AI_GENERATED.");
            }
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

        if (vocabs.Count > 0)
        {
            var vocabText = string.Join("\n", vocabs.Select(v => $"- {v.Hanzi} ({v.Pinyin}): {v.MeaningVi}"));
            return (vocabText, "Sinh từ từ vựng HSK 2.0; bài tập gắn nhãn AI_GENERATED.");
        }

        return ("- 你好 (nǐ hǎo): Xin chào\n- 谢谢 (xièxie): Cảm ơn", "Dữ liệu mẫu cơ bản HSK.");
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

    public static AiGeneratedExerciseDto MapDto(AiGeneratedExercise e, bool isAttempted)
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
            // SECURITY: Never leak answers or explanations before submission
            CorrectIndex = isAttempted ? e.CorrectIndex : null,
            CorrectAnswer = isAttempted ? e.CorrectAnswer : null,
            ExplanationVi = isAttempted ? e.ExplanationVi : string.Empty,
            CreatedAt = e.CreatedAt
        };
    }

    public static AdaptiveExerciseDto MapAdaptiveDto(AiGeneratedExercise e, int targetHsk)
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

        var diffTag = e.HskLevel > targetHsk ? "Nâng cao" : (e.HskLevel < targetHsk ? "Cơ bản" : "Tiêu chuẩn");

        return new AdaptiveExerciseDto
        {
            Id = e.Id,
            HskLevel = e.HskLevel,
            SkillCategory = MapSkillCategory(e.ExerciseType, e.SourceType),
            ExerciseType = e.ExerciseType,
            OriginTag = e.OriginTag,
            AcademicStatus = e.AcademicStatus,
            SourceReviewNote = e.SourceReviewNote,
            PromptZh = e.PromptZh,
            PromptPinyin = e.PromptPinyin,
            PromptVi = e.PromptVi,
            Options = options,
            DifficultyTag = diffTag,
            TargetConcept = e.SourceType
        };
    }
}
