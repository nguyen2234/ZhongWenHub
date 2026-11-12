using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ZhongWenHub.Business.AITutor.DTOs;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.AITutor;

public sealed class EfAITutorContextVerifier : IAITutorContextVerifier
{
    private static readonly HashSet<string> AllowedSources = new(StringComparer.OrdinalIgnoreCase)
    {
        "dashboard", "lesson", "vocabulary", "practice", "mistake", "general"
    };

    private readonly ApplicationDbContext _dbContext;

    public EfAITutorContextVerifier(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<VerifiedAITutorContext> VerifyAndNormalizeAsync(
        Guid userId,
        AITutorContextDto? requestedContext,
        CancellationToken cancellationToken = default)
    {
        var userInfo = await _dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.Id, u.Status })
            .FirstOrDefaultAsync(cancellationToken);

        if (userInfo is null || userInfo.Status != UserStatus.ACTIVE)
        {
            throw AITutorException.UnauthorizedUser();
        }

        var profile = await _dbContext.StudentLearningProfiles
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .Select(p => new { p.SelectedHskLevel, p.TargetDailyMinutes })
            .FirstOrDefaultAsync(cancellationToken);

        var requestedLevel = requestedContext?.HskLevel;
        var effectiveHskLevel = requestedLevel is >= 1 and <= 9
            ? requestedLevel.Value
            : (profile?.SelectedHskLevel is >= 1 and <= 9 ? profile.SelectedHskLevel : 2);

        var source = requestedContext?.Source is not null && AllowedSources.Contains(requestedContext.Source.Trim())
            ? requestedContext.Source.Trim().ToLowerInvariant()
            : "general";

        var languagePreference = string.Equals(requestedContext?.LanguagePreference?.Trim(), "English", StringComparison.OrdinalIgnoreCase)
            ? "English"
            : "Vietnamese";

        var (verifiedLessonId, verifiedLessonTitle) = await ResolveVerifiedLessonAsync(requestedContext, effectiveHskLevel, cancellationToken);
        var (lessonReadingPreview, lessonAcademicNote) = await ResolveLessonReadingSummaryAsync(verifiedLessonId, cancellationToken);
        var verifiedGrammar = await ResolveVerifiedGrammarAsync(requestedContext, cancellationToken);
        var verifiedVocabulary = await ResolveVerifiedVocabularyAsync(requestedContext, effectiveHskLevel, cancellationToken);
        var verifiedExercise = await ResolveVerifiedExerciseAsync(requestedContext?.ExerciseContext, cancellationToken);

        var grammarPoints = SanitizeList(requestedContext?.GrammarPoints, maxItems: 3, maxLength: 80);
        var lessonVocabularyPreview = new List<string>();
        if (verifiedLessonId.HasValue)
        {
            if (grammarPoints.Count == 0)
            {
                grammarPoints = await _dbContext.GrammarPoints
                    .AsNoTracking()
                    .Where(g => g.LessonId == verifiedLessonId.Value && g.Status == "PUBLISHED")
                    .OrderBy(g => g.Title)
                    .Select(g => g.Title)
                    .Take(3)
                    .ToListAsync(cancellationToken);
            }

            var lessonVocabs = await _dbContext.Vocabularies
                .AsNoTracking()
                .Where(v => v.Status == "PUBLISHED" &&
                            (v.LessonId == verifiedLessonId.Value ||
                             v.LessonVocabularies.Any(lv => lv.LessonId == verifiedLessonId.Value)))
                .OrderBy(v => v.HskLevel)
                .ThenBy(v => v.Hanzi)
                .Select(v => new { v.Hanzi, v.Pinyin, v.MeaningVi })
                .Take(5)
                .ToListAsync(cancellationToken);

            lessonVocabularyPreview = lessonVocabs
                .Select(v => $"{v.Hanzi} ({v.Pinyin}): {Truncate(v.MeaningVi, 60)}")
                .ToList();
        }

        var weaknesses = SanitizeList(requestedContext?.Weaknesses, maxItems: 3, maxLength: 80);
        var learningGoal = !string.IsNullOrWhiteSpace(requestedContext?.LearningGoal)
            ? PromptSanitizer.SanitizeUntrustedText(requestedContext.LearningGoal, 120)
            : (profile is not null ? $"HSK {effectiveHskLevel} ({profile.TargetDailyMinutes} phút/ngày)" : $"HSK {effectiveHskLevel}");

        return new VerifiedAITutorContext
        {
            UserId = userId,
            EffectiveHskLevel = effectiveHskLevel,
            Source = source,
            LanguagePreference = languagePreference,
            VerifiedLessonId = verifiedLessonId,
            VerifiedLessonTitle = verifiedLessonTitle,
            LessonReadingPreview = lessonReadingPreview,
            LessonAcademicNote = lessonAcademicNote,
            CurrentStep = Truncate(requestedContext?.CurrentStep, 60),
            LearningGoal = learningGoal,
            GrammarPoints = grammarPoints,
            VerifiedGrammar = verifiedGrammar,
            LessonVocabularyPreview = lessonVocabularyPreview,
            VerifiedVocabulary = verifiedVocabulary,
            VerifiedExercise = verifiedExercise,
            Weaknesses = weaknesses
        };
    }

    private async Task<(Guid? LessonId, string? Title)> ResolveVerifiedLessonAsync(
        AITutorContextDto? ctx,
        int hskLevel,
        CancellationToken cancellationToken)
    {
        if (ctx?.LessonId is JsonElement lessonIdEl && lessonIdEl.ValueKind != JsonValueKind.Null && lessonIdEl.ValueKind != JsonValueKind.Undefined)
        {
            if (lessonIdEl.ValueKind == JsonValueKind.String && Guid.TryParse(lessonIdEl.GetString(), out var lessonGuid))
            {
                var dbLesson = await _dbContext.Lessons
                    .AsNoTracking()
                    .Include(l => l.Course)
                    .Where(l => l.Id == lessonGuid && l.Status == "PUBLISHED")
                    .Select(l => new { l.Id, l.LessonNumber, l.TitleZh, l.TitleVi, CourseHsk = l.Course != null ? l.Course.HskLevel : hskLevel })
                    .FirstOrDefaultAsync(cancellationToken);

                if (dbLesson is not null)
                {
                    return (dbLesson.Id, $"HSK {dbLesson.CourseHsk} - Bài {dbLesson.LessonNumber}: {dbLesson.TitleZh} ({dbLesson.TitleVi})");
                }
            }
            else if (TryExtractInt(lessonIdEl, out var lessonNumber) && lessonNumber > 0)
            {
                var dbLesson = await _dbContext.Lessons
                    .AsNoTracking()
                    .Include(l => l.Course)
                    .Where(l => l.LessonNumber == lessonNumber && l.Status == "PUBLISHED" && (l.Course == null || l.Course.HskLevel == hskLevel))
                    .Select(l => new { l.Id, l.LessonNumber, l.TitleZh, l.TitleVi, CourseHsk = l.Course != null ? l.Course.HskLevel : hskLevel })
                    .FirstOrDefaultAsync(cancellationToken);

                if (dbLesson is not null)
                {
                    return (dbLesson.Id, $"HSK {dbLesson.CourseHsk} - Bài {dbLesson.LessonNumber}: {dbLesson.TitleZh} ({dbLesson.TitleVi})");
                }
            }
        }

        return (null, Truncate(ctx?.LessonTitle, 120));
    }

    private async Task<(string? ReadingPreview, string? AcademicNote)> ResolveLessonReadingSummaryAsync(
        Guid? lessonId,
        CancellationToken cancellationToken)
    {
        if (!lessonId.HasValue)
        {
            return (null, null);
        }

        var dialogueJson = await _dbContext.Lessons
            .AsNoTracking()
            .Where(l => l.Id == lessonId.Value)
            .Select(l => l.DialogueJson)
            .FirstOrDefaultAsync(cancellationToken);

        if (string.IsNullOrWhiteSpace(dialogueJson))
        {
            return (null, null);
        }

        try
        {
            using var doc = JsonDocument.Parse(dialogueJson);
            var root = doc.RootElement;
            string? academicNote = null;
            if (root.TryGetProperty("readingPassage", out var rp) && rp.ValueKind == JsonValueKind.Object)
            {
                if (rp.TryGetProperty("academicApproved", out var approvedProp) && approvedProp.ValueKind == JsonValueKind.False)
                {
                    academicNote = "Nội dung bài đọc đang ở trạng thái luyện tập thử nghiệm (chưa duyệt học thuật).";
                }

                if (rp.TryGetProperty("sentences", out var sentencesProp) && sentencesProp.ValueKind == JsonValueKind.Array)
                {
                    var items = new List<string>();
                    foreach (var s in sentencesProp.EnumerateArray().Take(2))
                    {
                        var zh = s.TryGetProperty("zh", out var zhEl) ? zhEl.GetString() : null;
                        var py = s.TryGetProperty("pinyin", out var pyEl) ? pyEl.GetString() : null;
                        if (!string.IsNullOrWhiteSpace(zh))
                        {
                            items.Add(string.IsNullOrWhiteSpace(py) ? zh : $"{zh} ({py})");
                        }
                    }

                    if (items.Count > 0)
                    {
                        return (Truncate(string.Join(" / ", items), 260), academicNote);
                    }
                }
            }

            return (null, academicNote);
        }
        catch (JsonException)
        {
            return (null, null);
        }
    }

    private async Task<VerifiedGrammarInfo?> ResolveVerifiedGrammarAsync(
        AITutorContextDto? ctx,
        CancellationToken cancellationToken)
    {
        if (ctx?.GrammarPointId is not JsonElement gpEl ||
            gpEl.ValueKind != JsonValueKind.String ||
            !Guid.TryParse(gpEl.GetString(), out var grammarId))
        {
            return null;
        }

        var gp = await _dbContext.GrammarPoints
            .AsNoTracking()
            .Where(g => g.Id == grammarId && g.Status == "PUBLISHED")
            .Select(g => new { g.Id, g.Title, g.StructureFormula, g.Explanation })
            .FirstOrDefaultAsync(cancellationToken);

        if (gp is null)
        {
            return null;
        }

        return new VerifiedGrammarInfo
        {
            Id = gp.Id,
            Title = Truncate(gp.Title, 100) ?? string.Empty,
            StructureFormula = Truncate(gp.StructureFormula, 120) ?? string.Empty,
            Explanation = Truncate(gp.Explanation, 240) ?? string.Empty
        };
    }

    private async Task<VerifiedVocabularyInfo?> ResolveVerifiedVocabularyAsync(
        AITutorContextDto? ctx,
        int defaultHskLevel,
        CancellationToken cancellationToken)
    {
        // Prefer authoritative database lookup by vocabulary ID or Hanzi when available.
        if (ctx?.VocabularyIds is { Count: > 0 })
        {
            foreach (var idEl in ctx.VocabularyIds.Take(5))
            {
                if (idEl.ValueKind == JsonValueKind.String && Guid.TryParse(idEl.GetString(), out var vocabId))
                {
                    var dbVocab = await _dbContext.Vocabularies
                        .AsNoTracking()
                        .Where(v => v.Id == vocabId && v.Status == "PUBLISHED")
                        .Select(v => new { v.Hanzi, v.Pinyin, v.MeaningVi, v.HskLevel, v.ExamplesJson })
                        .FirstOrDefaultAsync(cancellationToken);

                    if (dbVocab is not null)
                    {
                        return new VerifiedVocabularyInfo
                        {
                            Hanzi = dbVocab.Hanzi,
                            Pinyin = dbVocab.Pinyin,
                            Meaning = dbVocab.MeaningVi,
                            HskLevel = dbVocab.HskLevel,
                            Examples = ExtractVocabularyExamples(dbVocab.ExamplesJson),
                            IsDatabaseVerified = true
                        };
                    }
                }
            }
        }

        var hanziInput = Truncate(ctx?.VocabularyWord?.Hanzi, 30);
        if (string.IsNullOrWhiteSpace(hanziInput))
        {
            return null;
        }

        var dbWord = await _dbContext.Vocabularies
            .AsNoTracking()
            .Where(v => v.Status == "PUBLISHED" && v.Hanzi == hanziInput)
            .OrderBy(v => v.HskLevel)
            .Select(v => new { v.Hanzi, v.Pinyin, v.MeaningVi, v.HskLevel, v.ExamplesJson })
            .FirstOrDefaultAsync(cancellationToken);

        if (dbWord is not null)
        {
            return new VerifiedVocabularyInfo
            {
                Hanzi = dbWord.Hanzi,
                Pinyin = dbWord.Pinyin,
                Meaning = dbWord.MeaningVi,
                HskLevel = dbWord.HskLevel,
                Examples = ExtractVocabularyExamples(dbWord.ExamplesJson),
                IsDatabaseVerified = true
            };
        }

        return new VerifiedVocabularyInfo
        {
            Hanzi = hanziInput,
            Pinyin = Truncate(ctx?.VocabularyWord?.Pinyin, 60) ?? string.Empty,
            Meaning = Truncate(ctx?.VocabularyWord?.Meaning, 140) ?? string.Empty,
            HskLevel = defaultHskLevel,
            IsDatabaseVerified = false
        };
    }

    private async Task<VerifiedExerciseInfo?> ResolveVerifiedExerciseAsync(
        AITutorExerciseContextDto? ex,
        CancellationToken cancellationToken)
    {
        if (ex is null)
        {
            return null;
        }

        if (ex.ExerciseId is JsonElement exIdEl &&
            exIdEl.ValueKind == JsonValueKind.String &&
            Guid.TryParse(exIdEl.GetString(), out var exerciseGuid))
        {
            var dbEx = await _dbContext.Exercises
                .AsNoTracking()
                .Where(e => e.Id == exerciseGuid && e.Status == "PUBLISHED")
                .Select(e => new
                {
                    e.Instruction,
                    e.PromptHanzi,
                    e.PromptPinyin,
                    e.PromptVietnamese,
                    e.CorrectAnswer,
                    e.Explanation
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (dbEx is not null)
            {
                return new VerifiedExerciseInfo
                {
                    Question = Truncate(dbEx.Instruction, 240) ?? string.Empty,
                    PromptHanzi = Truncate(dbEx.PromptHanzi, 200),
                    PromptPinyin = Truncate(dbEx.PromptPinyin, 240),
                    PromptVietnamese = Truncate(dbEx.PromptVietnamese, 240),
                    UserAnswer = Truncate(ex.UserAnswer, 180),
                    CorrectAnswer = Truncate(dbEx.CorrectAnswer, 180) ?? Truncate(ex.CorrectAnswer, 180),
                    Explanation = Truncate(dbEx.Explanation, 400),
                    IsDatabaseVerified = true
                };
            }
        }

        var question = Truncate(ex.Question, 240);
        if (string.IsNullOrWhiteSpace(question) && string.IsNullOrWhiteSpace(ex.PromptHanzi))
        {
            return null;
        }

        return new VerifiedExerciseInfo
        {
            Question = question ?? string.Empty,
            PromptHanzi = Truncate(ex.PromptHanzi, 200),
            PromptPinyin = Truncate(ex.PromptPinyin, 240),
            PromptVietnamese = Truncate(ex.PromptVietnamese, 240),
            UserAnswer = Truncate(ex.UserAnswer, 180),
            CorrectAnswer = Truncate(ex.CorrectAnswer, 180),
            Explanation = Truncate(ex.Explanation, 400),
            IsDatabaseVerified = false
        };
    }

    private static bool TryExtractInt(JsonElement el, out int value)
    {
        if (el.ValueKind == JsonValueKind.Number && el.TryGetInt32(out value))
        {
            return true;
        }

        if (el.ValueKind == JsonValueKind.String && int.TryParse(el.GetString(), out value))
        {
            return true;
        }

        value = 0;
        return false;
    }

    private static List<string> SanitizeList(IEnumerable<string>? items, int maxItems, int maxLength)
    {
        if (items is null) return new List<string>();
        return items
            .Select(s => Truncate(s, maxLength))
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s!)
            .Take(maxItems)
            .ToList();
    }

    private static List<string> ExtractVocabularyExamples(string? examplesJson)
    {
        var results = new List<string>();
        if (string.IsNullOrWhiteSpace(examplesJson))
        {
            return results;
        }

        try
        {
            using var doc = JsonDocument.Parse(examplesJson);
            if (doc.RootElement.ValueKind != JsonValueKind.Array)
            {
                return results;
            }

            foreach (var item in doc.RootElement.EnumerateArray())
            {
                if (results.Count >= 2) break;

                if (item.ValueKind == JsonValueKind.String)
                {
                    var text = Truncate(item.GetString(), 140);
                    if (!string.IsNullOrWhiteSpace(text)) results.Add(text);
                    continue;
                }

                if (item.ValueKind != JsonValueKind.Object) continue;

                var zh = TryGetStringProp(item, "hanzi") ?? TryGetStringProp(item, "chinese") ?? TryGetStringProp(item, "zh");
                var py = TryGetStringProp(item, "pinyin");
                var vi = TryGetStringProp(item, "vietnamese") ?? TryGetStringProp(item, "meaning") ?? TryGetStringProp(item, "vi");

                if (!string.IsNullOrWhiteSpace(zh))
                {
                    var formatted = string.IsNullOrWhiteSpace(py)
                        ? $"{zh} — {vi}"
                        : $"{zh} ({py}) — {vi}";
                    var bounded = Truncate(formatted, 180);
                    if (!string.IsNullOrWhiteSpace(bounded)) results.Add(bounded);
                }
            }
        }
        catch (JsonException)
        {
            // Ignore malformed ExamplesJson in content rows
        }

        return results;
    }

    private static string? TryGetStringProp(JsonElement obj, string name)
    {
        return obj.TryGetProperty(name, out var prop) && prop.ValueKind == JsonValueKind.String
            ? prop.GetString()?.Trim()
            : null;
    }

    private static string? Truncate(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
    }
}
