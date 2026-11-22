using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
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
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> AttemptLocks = new();

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

        // Concurrency control: per (UserId, ExerciseId) async lock to prevent duplicate submissions
        var lockKey = $"{userId:N}_{aiExerciseId:N}";
        var semaphore = AttemptLocks.GetOrAdd(lockKey, _ => new SemaphoreSlim(1, 1));
        await semaphore.WaitAsync(cancellationToken);
        try
        {
            // Idempotency check: if already attempted, return existing result without duplicate records or re-calling LLM
            var existingAttempt = await _dbContext.AiExerciseAttempts
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.AiExerciseId == aiExerciseId && a.UserId == userId, cancellationToken);

            if (existingAttempt != null)
            {
                return await BuildIdempotentResultAsync(userId, exercise, existingAttempt, cancellationToken);
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

            AiExerciseAttempt? committedAttempt = null;
            try
            {
                if (_dbContext.Database.IsRelational())
                {
                    var strategy = _dbContext.Database.CreateExecutionStrategy();
                    await strategy.ExecuteAsync(async () =>
                    {
                        // Check if attempt was already committed in a previous iteration (e.g. transient failure after commit)
                        var existingInRetry = await _dbContext.AiExerciseAttempts
                            .AsNoTracking()
                            .FirstOrDefaultAsync(a => a.AiExerciseId == aiExerciseId && a.UserId == userId, cancellationToken);

                        if (existingInRetry != null)
                        {
                            committedAttempt = existingInRetry;
                            return;
                        }

                        await using var tx = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
                        _dbContext.AiExerciseAttempts.Add(attempt);
                        _dbContext.StudentPracticeAttempts.Add(practiceAttempt);
                        await _dbContext.SaveChangesAsync(cancellationToken);
                        await tx.CommitAsync(cancellationToken);
                    });
                }
                else
                {
                    _dbContext.AiExerciseAttempts.Add(attempt);
                    _dbContext.StudentPracticeAttempts.Add(practiceAttempt);
                    await _dbContext.SaveChangesAsync(cancellationToken);
                }
            }
            catch (DbUpdateException ex)
            {
                _logger.LogWarning(ex, "Concurrent duplicate attempt detected for user {UserId} and exercise {ExerciseId}. Reloading existing attempt.", userId, aiExerciseId);
                _dbContext.ChangeTracker.Clear();
                var reloadedAttempt = await _dbContext.AiExerciseAttempts
                    .AsNoTracking()
                    .FirstOrDefaultAsync(a => a.AiExerciseId == aiExerciseId && a.UserId == userId, cancellationToken);

                if (reloadedAttempt != null)
                {
                    return await BuildIdempotentResultAsync(userId, exercise, reloadedAttempt, cancellationToken);
                }
                throw;
            }

            if (committedAttempt != null)
            {
                return await BuildIdempotentResultAsync(userId, exercise, committedAttempt, cancellationToken);
            }

            // Update persisted skill statistics deterministically
            try
            {
                await _errorAnalysisService.RecomputeAndPersistSkillStatsAsync(userId, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error recomputing skill stats after attempt submission.");
            }

            // Detailed error analysis if student was incorrect
            AIErrorAnalysisDetailDto? errorAnalysis = null;
            if (!isCorrect)
            {
                try
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
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error analyzing detail after attempt submission for attempt {AttemptId}.", attempt.Id);
                }
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
        finally
        {
            semaphore.Release();
        }
    }

    private async Task<AiExerciseAttemptResultDto> BuildIdempotentResultAsync(
        Guid userId,
        AiGeneratedExercise exercise,
        AiExerciseAttempt existingAttempt,
        CancellationToken cancellationToken)
    {
        AIErrorAnalysisDetailDto? existingAnalysis = null;
        if (!existingAttempt.IsCorrect)
        {
            try
            {
                existingAnalysis = await _errorAnalysisService.AnalyzeErrorDetailAsync(
                    userId,
                    new RequestErrorAnalysisDto
                    {
                        ExerciseId = exercise.Id,
                        QuestionText = exercise.PromptZh,
                        UserAnswer = existingAttempt.UserAnswer,
                        CorrectAnswer = exercise.CorrectAnswer,
                        SkillCategory = existingAttempt.SkillCategory,
                        HskLevel = exercise.HskLevel
                    },
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error fetching cached error analysis for existing attempt {AttemptId}.", existingAttempt.Id);
            }
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

    private async Task<AiGeneratedExercise?> BuildCuratedFallbackExerciseAsync(
        Guid userId,
        int hskLevel,
        string skill,
        HashSet<string> recentPrompts,
        CancellationToken cancellationToken)
    {
        // 1. Skill: Grammar - build from published GrammarPoints
        if (skill == "grammar")
        {
            var targetGp = await _dbContext.GrammarPoints
                .AsNoTracking()
                .Where(g => g.HskLevel == hskLevel && g.Status == "PUBLISHED" && !recentPrompts.Contains(g.Title) && !string.IsNullOrWhiteSpace(g.StructureFormula))
                .OrderBy(g => Guid.NewGuid())
                .FirstOrDefaultAsync(cancellationToken);

            targetGp ??= await _dbContext.GrammarPoints
                .AsNoTracking()
                .Where(g => g.HskLevel == hskLevel && g.Status == "PUBLISHED" && !string.IsNullOrWhiteSpace(g.StructureFormula))
                .OrderBy(g => Guid.NewGuid())
                .FirstOrDefaultAsync(cancellationToken);

            if (targetGp != null && !string.IsNullOrWhiteSpace(targetGp.StructureFormula))
            {
                var distractorFormulas = await _dbContext.GrammarPoints
                    .AsNoTracking()
                    .Where(g => g.Id != targetGp.Id && g.Status == "PUBLISHED" && !string.IsNullOrWhiteSpace(g.StructureFormula) && g.StructureFormula != targetGp.StructureFormula)
                    .OrderBy(g => Guid.NewGuid())
                    .Take(5)
                    .Select(g => g.StructureFormula)
                    .ToListAsync(cancellationToken);

                var options = new List<string> { targetGp.StructureFormula };
                options.AddRange(distractorFormulas);
                var distinctOptions = options.Distinct(StringComparer.OrdinalIgnoreCase).Take(4).ToList();

                if (distinctOptions.Count >= 2)
                {
                    var (shuffled, correctIndex) = ShuffleOptions(distinctOptions, targetGp.StructureFormula);
                    return new AiGeneratedExercise
                    {
                        UserId = userId,
                        HskLevel = hskLevel,
                        SourceType = "GRAMMAR",
                        ExerciseType = "multiple-choice",
                        OriginTag = "CURATED_FALLBACK",
                        AcademicStatus = "UNAPPROVED_EXPERIMENTAL",
                        SourceReviewNote = "Câu hỏi fallback tự sinh từ điểm ngữ pháp hệ thống.",
                        PromptZh = $"请选择语法点“{targetGp.Title}”的正确结构：",
                        PromptVi = $"Chọn cấu trúc đúng của điểm ngữ pháp \"{targetGp.Title}\":",
                        OptionsJson = JsonSerializer.Serialize(shuffled, JsonOptions),
                        CorrectIndex = correctIndex,
                        CorrectAnswer = targetGp.StructureFormula,
                        ExplanationVi = $"Điểm ngữ pháp '{targetGp.Title}' có cấu trúc chuẩn là: {targetGp.StructureFormula}. {targetGp.Explanation}",
                        CreatedAt = DateTime.UtcNow
                    };
                }
            }
        }

        // 2. Skill: Pinyin - build from published Vocabularies
        if (skill == "pinyin")
        {
            var targetVocab = await _dbContext.Vocabularies
                .AsNoTracking()
                .Where(v => v.HskLevel == hskLevel && v.Status == "PUBLISHED" && !recentPrompts.Contains(v.Hanzi) && !string.IsNullOrWhiteSpace(v.Pinyin))
                .OrderBy(v => Guid.NewGuid())
                .FirstOrDefaultAsync(cancellationToken);

            targetVocab ??= await _dbContext.Vocabularies
                .AsNoTracking()
                .Where(v => v.HskLevel == hskLevel && v.Status == "PUBLISHED" && !string.IsNullOrWhiteSpace(v.Pinyin))
                .OrderBy(v => Guid.NewGuid())
                .FirstOrDefaultAsync(cancellationToken);

            if (targetVocab != null)
            {
                var distractorPinyins = await _dbContext.Vocabularies
                    .AsNoTracking()
                    .Where(v => v.Id != targetVocab.Id && v.Status == "PUBLISHED" && !string.IsNullOrWhiteSpace(v.Pinyin) && v.Pinyin != targetVocab.Pinyin)
                    .OrderBy(v => Guid.NewGuid())
                    .Take(5)
                    .Select(v => v.Pinyin)
                    .ToListAsync(cancellationToken);

                var options = new List<string> { targetVocab.Pinyin };
                options.AddRange(distractorPinyins);
                var distinctOptions = options.Distinct(StringComparer.OrdinalIgnoreCase).Take(4).ToList();

                if (distinctOptions.Count >= 2)
                {
                    var (shuffled, correctIndex) = ShuffleOptions(distinctOptions, targetVocab.Pinyin);
                    return new AiGeneratedExercise
                    {
                        UserId = userId,
                        HskLevel = hskLevel,
                        SourceType = "VOCABULARY",
                        ExerciseType = "pinyin-match",
                        OriginTag = "CURATED_FALLBACK",
                        AcademicStatus = "UNAPPROVED_EXPERIMENTAL",
                        SourceReviewNote = "Câu hỏi fallback tự sinh từ từ vựng kiểm duyệt.",
                        PromptZh = $"请选择汉字“{targetVocab.Hanzi}”的正确拼音：",
                        PromptVi = $"Chọn Pinyin chuẩn của chữ Hán \"{targetVocab.Hanzi}\":",
                        OptionsJson = JsonSerializer.Serialize(shuffled, JsonOptions),
                        CorrectIndex = correctIndex,
                        CorrectAnswer = targetVocab.Pinyin,
                        ExplanationVi = $"Chữ Hán '{targetVocab.Hanzi}' có phiên âm Pinyin chuẩn là: {targetVocab.Pinyin} ({targetVocab.MeaningVi}).",
                        CreatedAt = DateTime.UtcNow
                    };
                }
            }
        }

        // 3. Skill: Hanzi - build from published Vocabularies
        if (skill == "hanzi")
        {
            var targetVocab = await _dbContext.Vocabularies
                .AsNoTracking()
                .Where(v => v.HskLevel == hskLevel && v.Status == "PUBLISHED" && !recentPrompts.Contains(v.Hanzi) && !string.IsNullOrWhiteSpace(v.Hanzi))
                .OrderBy(v => Guid.NewGuid())
                .FirstOrDefaultAsync(cancellationToken);

            targetVocab ??= await _dbContext.Vocabularies
                .AsNoTracking()
                .Where(v => v.HskLevel == hskLevel && v.Status == "PUBLISHED" && !string.IsNullOrWhiteSpace(v.Hanzi))
                .OrderBy(v => Guid.NewGuid())
                .FirstOrDefaultAsync(cancellationToken);

            if (targetVocab != null)
            {
                var distractorHanzis = await _dbContext.Vocabularies
                    .AsNoTracking()
                    .Where(v => v.Id != targetVocab.Id && v.Status == "PUBLISHED" && !string.IsNullOrWhiteSpace(v.Hanzi) && v.Hanzi != targetVocab.Hanzi)
                    .OrderBy(v => Guid.NewGuid())
                    .Take(5)
                    .Select(v => v.Hanzi)
                    .ToListAsync(cancellationToken);

                var options = new List<string> { targetVocab.Hanzi };
                options.AddRange(distractorHanzis);
                var distinctOptions = options.Distinct(StringComparer.OrdinalIgnoreCase).Take(4).ToList();

                if (distinctOptions.Count >= 2)
                {
                    var (shuffled, correctIndex) = ShuffleOptions(distinctOptions, targetVocab.Hanzi);
                    return new AiGeneratedExercise
                    {
                        UserId = userId,
                        HskLevel = hskLevel,
                        SourceType = "VOCABULARY",
                        ExerciseType = "multiple-choice",
                        OriginTag = "CURATED_FALLBACK",
                        AcademicStatus = "UNAPPROVED_EXPERIMENTAL",
                        SourceReviewNote = "Câu hỏi fallback tự sinh từ từ vựng kiểm duyệt.",
                        PromptZh = $"请选择拼音“{targetVocab.Pinyin}”对应的汉字：",
                        PromptPinyin = targetVocab.Pinyin,
                        PromptVi = $"Chọn chữ Hán đúng tương ứng với Pinyin \"{targetVocab.Pinyin}\" ({targetVocab.MeaningVi}):",
                        OptionsJson = JsonSerializer.Serialize(shuffled, JsonOptions),
                        CorrectIndex = correctIndex,
                        CorrectAnswer = targetVocab.Hanzi,
                        ExplanationVi = $"Pinyin '{targetVocab.Pinyin}' tương ứng với chữ Hán '{targetVocab.Hanzi}' có nghĩa là: {targetVocab.MeaningVi}.",
                        CreatedAt = DateTime.UtcNow
                    };
                }
            }
        }

        // 4. Skill: Reading - build from published Lessons or Vocabularies
        if (skill == "reading")
        {
            var lesson = await _dbContext.Lessons
                .AsNoTracking()
                .Include(l => l.Course)
                .Where(l => l.Status == "PUBLISHED" && l.DialogueJson != null && (l.Course == null || l.Course.HskLevel == hskLevel))
                .OrderBy(l => Guid.NewGuid())
                .FirstOrDefaultAsync(cancellationToken);

            if (lesson?.DialogueJson != null)
            {
                var (passageText, _) = ExtractReadingSentencesOnly(lesson.DialogueJson);
                if (!string.IsNullOrWhiteSpace(passageText))
                {
                    var targetVocab = await _dbContext.Vocabularies
                        .AsNoTracking()
                        .Where(v => v.HskLevel == hskLevel && v.Status == "PUBLISHED" && !string.IsNullOrWhiteSpace(v.MeaningVi))
                        .OrderBy(v => Guid.NewGuid())
                        .FirstOrDefaultAsync(cancellationToken);

                    if (targetVocab != null)
                    {
                        var distractorMeanings = await _dbContext.Vocabularies
                            .AsNoTracking()
                            .Where(v => v.Id != targetVocab.Id && v.Status == "PUBLISHED" && !string.IsNullOrWhiteSpace(v.MeaningVi) && v.MeaningVi != targetVocab.MeaningVi)
                            .OrderBy(v => Guid.NewGuid())
                            .Take(5)
                            .Select(v => v.MeaningVi)
                            .ToListAsync(cancellationToken);

                        var options = new List<string> { targetVocab.MeaningVi };
                        options.AddRange(distractorMeanings);
                        var distinctOptions = options.Distinct(StringComparer.OrdinalIgnoreCase).Take(4).ToList();

                        if (distinctOptions.Count >= 2)
                        {
                            var (shuffled, correctIndex) = ShuffleOptions(distinctOptions, targetVocab.MeaningVi);
                            var shortExcerpt = passageText.Length > 120 ? passageText[..120] + "..." : passageText;
                            return new AiGeneratedExercise
                            {
                                UserId = userId,
                                HskLevel = hskLevel,
                                SourceType = "READING",
                                ExerciseType = "multiple-choice",
                                OriginTag = "CURATED_FALLBACK",
                                AcademicStatus = "UNAPPROVED_EXPERIMENTAL",
                                SourceReviewNote = "Câu hỏi fallback tự sinh từ bài đọc giáo trình.",
                                PromptZh = $"阅读短文：“{shortExcerpt}”\n请问文中关键词“{targetVocab.Hanzi}”的意思是：",
                                PromptVi = $"Đọc đoạn văn và chọn nghĩa đúng của từ \"{targetVocab.Hanzi}\":",
                                OptionsJson = JsonSerializer.Serialize(shuffled, JsonOptions),
                                CorrectIndex = correctIndex,
                                CorrectAnswer = targetVocab.MeaningVi,
                                ExplanationVi = $"Trong ngữ cảnh bài đọc, từ '{targetVocab.Hanzi}' mang nghĩa tiếng Việt là: {targetVocab.MeaningVi}.",
                                CreatedAt = DateTime.UtcNow
                            };
                        }
                    }
                }
            }

            // Fallback reading question from vocabulary comprehension
            var readVocab = await _dbContext.Vocabularies
                .AsNoTracking()
                .Where(v => v.HskLevel == hskLevel && v.Status == "PUBLISHED" && !string.IsNullOrWhiteSpace(v.MeaningVi))
                .OrderBy(v => Guid.NewGuid())
                .FirstOrDefaultAsync(cancellationToken);

            if (readVocab != null)
            {
                var distractorMeanings = await _dbContext.Vocabularies
                    .AsNoTracking()
                    .Where(v => v.Id != readVocab.Id && v.Status == "PUBLISHED" && !string.IsNullOrWhiteSpace(v.MeaningVi) && v.MeaningVi != readVocab.MeaningVi)
                    .OrderBy(v => Guid.NewGuid())
                    .Take(5)
                    .Select(v => v.MeaningVi)
                    .ToListAsync(cancellationToken);

                var options = new List<string> { readVocab.MeaningVi };
                options.AddRange(distractorMeanings);
                var distinctOptions = options.Distinct(StringComparer.OrdinalIgnoreCase).Take(4).ToList();

                if (distinctOptions.Count >= 2)
                {
                    var (shuffled, correctIndex) = ShuffleOptions(distinctOptions, readVocab.MeaningVi);
                    return new AiGeneratedExercise
                    {
                        UserId = userId,
                        HskLevel = hskLevel,
                        SourceType = "READING",
                        ExerciseType = "multiple-choice",
                        OriginTag = "CURATED_FALLBACK",
                        AcademicStatus = "UNAPPROVED_EXPERIMENTAL",
                        SourceReviewNote = "Câu hỏi fallback đọc hiểu từ vựng kiểm duyệt.",
                        PromptZh = $"阅读理解：请根据上下文选择词语“{readVocab.Hanzi}”（{readVocab.Pinyin}）的正确释义：",
                        PromptVi = $"Đọc hiểu: Chọn nghĩa đúng của từ \"{readVocab.Hanzi}\":",
                        OptionsJson = JsonSerializer.Serialize(shuffled, JsonOptions),
                        CorrectIndex = correctIndex,
                        CorrectAnswer = readVocab.MeaningVi,
                        ExplanationVi = $"Từ '{readVocab.Hanzi}' có nghĩa tiếng Việt là: {readVocab.MeaningVi}.",
                        CreatedAt = DateTime.UtcNow
                    };
                }
            }
        }

        // 5. Skill: Vocabulary (default fallback) - build from published Vocabularies
        var targetVocabDefault = await _dbContext.Vocabularies
            .AsNoTracking()
            .Where(v => v.HskLevel == hskLevel && v.Status == "PUBLISHED" && !recentPrompts.Contains(v.Hanzi) && !string.IsNullOrWhiteSpace(v.MeaningVi))
            .OrderBy(v => Guid.NewGuid())
            .FirstOrDefaultAsync(cancellationToken);

        targetVocabDefault ??= await _dbContext.Vocabularies
            .AsNoTracking()
            .Where(v => v.HskLevel == hskLevel && v.Status == "PUBLISHED" && !string.IsNullOrWhiteSpace(v.MeaningVi))
            .OrderBy(v => Guid.NewGuid())
            .FirstOrDefaultAsync(cancellationToken);

        if (targetVocabDefault != null)
        {
            var distractorMeanings = await _dbContext.Vocabularies
                .AsNoTracking()
                .Where(v => v.Id != targetVocabDefault.Id && v.Status == "PUBLISHED" && !string.IsNullOrWhiteSpace(v.MeaningVi) && v.MeaningVi != targetVocabDefault.MeaningVi)
                .OrderBy(v => Guid.NewGuid())
                .Take(5)
                .Select(v => v.MeaningVi)
                .ToListAsync(cancellationToken);

            var options = new List<string> { targetVocabDefault.MeaningVi };
            options.AddRange(distractorMeanings);
            var distinctOptions = options.Distinct(StringComparer.OrdinalIgnoreCase).Take(4).ToList();

            if (distinctOptions.Count >= 2)
            {
                var (shuffled, correctIndex) = ShuffleOptions(distinctOptions, targetVocabDefault.MeaningVi);
                return new AiGeneratedExercise
                {
                    UserId = userId,
                    HskLevel = hskLevel,
                    SourceType = "VOCABULARY",
                    ExerciseType = "multiple-choice",
                    OriginTag = "CURATED_FALLBACK",
                    AcademicStatus = "UNAPPROVED_EXPERIMENTAL",
                    SourceReviewNote = "Ngân hàng từ vựng kiểm duyệt chính thức.",
                    PromptZh = $"请选择“{targetVocabDefault.Hanzi}”的意思：",
                    PromptPinyin = targetVocabDefault.Pinyin,
                    PromptVi = $"Chọn nghĩa đúng của từ \"{targetVocabDefault.Hanzi}\":",
                    OptionsJson = JsonSerializer.Serialize(shuffled, JsonOptions),
                    CorrectIndex = correctIndex,
                    CorrectAnswer = targetVocabDefault.MeaningVi,
                    ExplanationVi = $"Từ '{targetVocabDefault.Hanzi}' ({targetVocabDefault.Pinyin}) có nghĩa tiếng Việt là: {targetVocabDefault.MeaningVi}.",
                    CreatedAt = DateTime.UtcNow
                };
            }
        }

        // If insufficient distinct data is available in the database, return null to reflect actual valid counts
        return null;
    }

    private static (List<string> Shuffled, int CorrectIndex) ShuffleOptions(List<string> options, string correctAnswer)
    {
        var list = new List<string>(options);
        var rng = Random.Shared;
        for (int i = list.Count - 1; i > 0; i--)
        {
            int j = rng.Next(i + 1);
            (list[i], list[j]) = (list[j], list[i]);
        }
        int correctIndex = list.IndexOf(correctAnswer);
        return (list, correctIndex);
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
