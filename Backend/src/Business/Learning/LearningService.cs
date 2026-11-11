using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ZhongWenHub.Business.Learning.DTOs;
using ZhongWenHub.Data.Entities.Learning;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.Learning;

public class LearningService : ILearningService
{
    private readonly ApplicationDbContext _context;

    public LearningService(ApplicationDbContext context)
    {
        _context = context;
    }

    public const string Lesson1Guid = "aaaaaaaa-1111-1111-1111-111111111111";
    public const string LegacyLesson1Id = "les-1";

    public static string NormalizeLessonId(string? lessonId)
    {
        if (string.IsNullOrWhiteSpace(lessonId)) return string.Empty;
        var trimmed = lessonId.Trim();
        if (string.Equals(trimmed, LegacyLesson1Id, StringComparison.OrdinalIgnoreCase))
        {
            return Lesson1Guid;
        }
        return trimmed.ToLowerInvariant();
    }

    public static bool IsLesson1(string? lessonId)
    {
        if (string.IsNullOrWhiteSpace(lessonId)) return false;
        var trimmed = lessonId.Trim();
        return string.Equals(trimmed, LegacyLesson1Id, StringComparison.OrdinalIgnoreCase) ||
               string.Equals(trimmed, Lesson1Guid, StringComparison.OrdinalIgnoreCase) ||
               string.Equals(trimmed, "les-hsk1-1", StringComparison.OrdinalIgnoreCase);
    }

    public static bool TryParseLessonSlug(string? input, out int hskLevel, out int lessonNumber)
    {
        hskLevel = 1;
        lessonNumber = 0;
        if (string.IsNullOrWhiteSpace(input)) return false;

        var trimmed = input.Trim();
        if (!trimmed.StartsWith("les-", StringComparison.OrdinalIgnoreCase) &&
            !trimmed.StartsWith("les_", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var remainder = trimmed.Substring(4);
        if (int.TryParse(remainder, out var directNum) && directNum > 0)
        {
            hskLevel = 1;
            lessonNumber = directNum;
            return true;
        }

        if (remainder.StartsWith("hsk", StringComparison.OrdinalIgnoreCase))
        {
            var hskPart = remainder.Substring(3);
            var sepIdx = hskPart.IndexOfAny(new[] { '-', '_' });
            if (sepIdx > 0 &&
                int.TryParse(hskPart.Substring(0, sepIdx), out var parsedLevel) && parsedLevel > 0 &&
                int.TryParse(hskPart.Substring(sepIdx + 1), out var parsedLessonNum) && parsedLessonNum > 0)
            {
                hskLevel = parsedLevel;
                lessonNumber = parsedLessonNum;
                return true;
            }
        }

        return false;
    }

    public static int CalculateCompletionPercent(int completedLessons, int totalLessons)
    {
        if (totalLessons <= 0 || completedLessons <= 0) return 0;
        return Math.Clamp((int)Math.Round(completedLessons * 100.0 / totalLessons, MidpointRounding.AwayFromZero), 0, 100);
    }

    private static string GetLocalDateString(DateTime? utc = null)
    {
        var time = (utc ?? DateTime.UtcNow).AddHours(7); // Vietnam UTC+7
        return time.ToString("yyyy-MM-dd");
    }

    private static string GetYesterdayDateString(DateTime? utc = null)
    {
        var time = (utc ?? DateTime.UtcNow).AddHours(7).AddDays(-1);
        return time.ToString("yyyy-MM-dd");
    }

    private async Task<StudentLearningProfile> GetOrCreateProfileAsync(Guid userId, CancellationToken cancellationToken)
    {
        var profile = await _context.StudentLearningProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (profile == null)
        {
            profile = new StudentLearningProfile
            {
                UserId = userId,
                SelectedHskLevel = 1,
                CurrentLessonId = Lesson1Guid,
                XpTotal = 0,
                StreakDays = 0,
                LastActivityDate = string.Empty,
                TargetDailyMinutes = 30,
                TargetDailyXp = 50
            };
            _context.StudentLearningProfiles.Add(profile);

            // Also initialize first lesson progress
            var firstLesson = new StudentLessonProgress
            {
                UserId = userId,
                LessonId = Lesson1Guid,
                Status = "NOT_STARTED",
                CurrentStepIndex = 0,
                MaxUnlockedStepIndex = 0,
                QuizScore = 0,
                TotalQuizQuestions = 5,
                XpEarned = 0
            };
            _context.StudentLessonProgresses.Add(firstLesson);

            await _context.SaveChangesAsync(cancellationToken);
        }

        return profile;
    }

    private static void UpdateStreak(StudentLearningProfile profile, string todayStr, string yesterdayStr)
    {
        if (profile.StreakDays == 0 || string.IsNullOrEmpty(profile.LastActivityDate))
        {
            profile.StreakDays = 1;
            profile.LastActivityDate = todayStr;
            return;
        }

        if (profile.LastActivityDate == todayStr)
        {
            // Already active today; streak stays same
            return;
        }

        if (profile.LastActivityDate == yesterdayStr)
        {
            profile.StreakDays += 1;
        }
        else
        {
            // Reset to 1 upon restarting
            profile.StreakDays = 1;
        }

        profile.LastActivityDate = todayStr;
    }

    private async Task<StudentDailyActivity> GetOrCreateDailyActivityAsync(Guid userId, string dateStr, CancellationToken cancellationToken)
    {
        var activity = _context.StudentDailyActivities.Local
            .FirstOrDefault(a => a.UserId == userId && a.ActivityDate == dateStr)
            ?? await _context.StudentDailyActivities
                .FirstOrDefaultAsync(a => a.UserId == userId && a.ActivityDate == dateStr, cancellationToken);

        if (activity == null)
        {
            activity = new StudentDailyActivity
            {
                UserId = userId,
                ActivityDate = dateStr,
                Minutes = 0,
                XpEarned = 0,
                CompletedLessonsJson = "[]",
                ExercisesCompleted = 0,
                ReviewsCompleted = 0
            };
            _context.StudentDailyActivities.Add(activity);
        }

        return activity;
    }

    private async Task<int> AwardIdempotentXpAsync(
        StudentLearningProfile profile,
        string eventId,
        int amount,
        string source,
        string? description,
        string todayStr,
        CancellationToken cancellationToken)
    {
        if (amount <= 0) return 0;

        var exists = await _context.StudentXpTransactions
            .AnyAsync(x => x.UserId == profile.UserId && x.EventId == eventId, cancellationToken);

        if (exists)
        {
            return 0;
        }

        var tx = new StudentXpTransaction
        {
            UserId = profile.UserId,
            EventId = eventId,
            Amount = amount,
            Source = source,
            Description = description
        };
        _context.StudentXpTransactions.Add(tx);

        profile.XpTotal += amount;

        var daily = await GetOrCreateDailyActivityAsync(profile.UserId, todayStr, cancellationToken);
        daily.XpEarned += amount;

        return amount;
    }

    public async Task<StudentLearningStateDto> GetStudentLearningStateAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var profile = await GetOrCreateProfileAsync(userId, cancellationToken);

        var lessons = await _context.StudentLessonProgresses
            .Where(l => l.UserId == userId)
            .ToListAsync(cancellationToken);

        var attempts = await _context.StudentPracticeAttempts
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.AttemptedAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        var vocabularies = await _context.StudentVocabularyProgresses
            .Where(v => v.UserId == userId)
            .ToListAsync(cancellationToken);

        var activities = await _context.StudentDailyActivities
            .Where(a => a.UserId == userId)
            .ToListAsync(cancellationToken);

        var rewardedEvents = await _context.StudentXpTransactions
            .Where(x => x.UserId == userId)
            .Select(x => x.EventId)
            .ToListAsync(cancellationToken);

        var todayStr = GetLocalDateString();

        var state = new StudentLearningStateDto
        {
            SchemaVersion = 1,
            StudentId = userId.ToString(),
            SelectedHskLevel = profile.SelectedHskLevel,
            CurrentLessonId = NormalizeLessonId(profile.CurrentLessonId),
            CompletedLessonIds = lessons.Where(l => l.Status == "COMPLETED").Select(l => NormalizeLessonId(l.LessonId)).Distinct().ToList(),
            XpTotal = profile.XpTotal,
            StreakDays = profile.StreakDays,
            LastActivityDate = profile.LastActivityDate,
            DailyGoal = new DailyGoalDto
            {
                TargetMinutes = profile.TargetDailyMinutes,
                TargetXp = profile.TargetDailyXp
            },
            RewardedEventIds = rewardedEvents
        };

        foreach (var l in lessons)
        {
            var normalized = NormalizeLessonId(l.LessonId);
            var dto = new LessonProgressDto
            {
                LessonId = normalized,
                UserId = userId.ToString(),
                Status = l.Status,
                CurrentStepIndex = l.CurrentStepIndex,
                MaxUnlockedStepIndex = l.MaxUnlockedStepIndex,
                QuizScore = l.QuizScore,
                TotalQuizQuestions = l.TotalQuizQuestions,
                XpEarned = l.XpEarned,
                CompletedAt = l.CompletedAt?.ToString("o"),
                UpdatedAt = (l.UpdatedAt ?? l.CreatedAt).ToString("o")
            };
            state.LessonProgress[normalized] = dto;
            if (normalized == Lesson1Guid)
            {
                // Backward compatibility alias for legacy frontends / tests
                state.LessonProgress[LegacyLesson1Id] = dto;
            }
        }

        foreach (var a in attempts)
        {
            state.ExerciseAttempts.Add(new PracticeAttemptDto
            {
                Id = a.Id.ToString(),
                StudentId = userId.ToString(),
                ExerciseId = a.ExerciseId,
                QuestionId = a.QuestionId,
                KnowledgePointId = a.KnowledgePointId,
                TopicTitle = a.TopicTitle,
                Category = a.Category,
                HskLevel = a.HskLevel,
                UserAnswer = a.UserAnswer,
                IsCorrect = a.IsCorrect,
                AttemptedAt = a.AttemptedAt.ToString("o")
            });
        }

        foreach (var v in vocabularies)
        {
            var nextReviewStr = GetLocalDateString(v.NextReviewAt);
            state.UserVocabStates[v.VocabularyId] = new UserVocabularyStateDto
            {
                VocabularyId = v.VocabularyId,
                Status = v.Status,
                FirstLearnedAt = GetLocalDateString(v.FirstLearnedAt),
                LastReviewedAt = GetLocalDateString(v.LastReviewedAt),
                NextReviewAt = nextReviewStr,
                ReviewCount = v.ReviewCount,
                CorrectCount = v.CorrectCount,
                IsDueToday = nextReviewStr.CompareTo(todayStr) <= 0
            };

            state.UserSrsStates[v.VocabularyId] = new SrsStateDto
            {
                VocabularyId = v.VocabularyId,
                Stability = v.Stability,
                Difficulty = v.Difficulty,
                Interval = v.IntervalDays,
                Repetitions = v.Repetitions,
                EaseFactor = v.EaseFactor
            };
        }

        foreach (var act in activities)
        {
            List<string> completedList;
            try
            {
                completedList = JsonSerializer.Deserialize<List<string>>(act.CompletedLessonsJson) ?? new List<string>();
            }
            catch
            {
                completedList = new List<string>();
            }

            state.DailyActivityHistory[act.ActivityDate] = new DailyActivityDto
            {
                Date = act.ActivityDate,
                Minutes = act.Minutes,
                XpEarned = act.XpEarned,
                CompletedLessons = completedList,
                ExercisesCompleted = act.ExercisesCompleted,
                ReviewsCompleted = act.ReviewsCompleted
            };
        }

        // Calculate Weak Knowledge
        state.WeakKnowledgePoints = CalculateWeakKnowledge(attempts);
        state.HskProgress = await ComputeHskProgressAsync(lessons, cancellationToken);

        return state;
    }

    public async Task<List<HskCourseProgressDto>> GetHskProgressAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var progresses = await _context.StudentLessonProgresses
            .AsNoTracking()
            .Where(l => l.UserId == userId)
            .ToListAsync(cancellationToken);

        return await ComputeHskProgressAsync(progresses, cancellationToken);
    }

    private async Task<List<HskCourseProgressDto>> ComputeHskProgressAsync(
        IReadOnlyCollection<StudentLessonProgress> userProgresses,
        CancellationToken cancellationToken)
    {
        var courses = await _context.Courses
            .AsNoTracking()
            .Where(c => c.HskLevel >= 1 && c.HskLevel <= 6 && (c.Status == null || c.Status != "ARCHIVED"))
            .OrderBy(c => c.HskLevel)
            .Select(c => new { c.Id, c.HskLevel, c.Title })
            .ToListAsync(cancellationToken);

        var dbLessons = await _context.Lessons
            .AsNoTracking()
            .Include(l => l.Course)
            .Where(l => l.Course != null && l.Course.HskLevel >= 1 && l.Course.HskLevel <= 6 && (l.Status == null || l.Status != "ARCHIVED"))
            .Select(l => new
            {
                l.Id,
                HskLevel = l.Course!.HskLevel,
                l.LessonNumber,
                l.OrderIndex,
                l.Status
            })
            .ToListAsync(cancellationToken);

        // Map canonical GUIDs and legacy/hsk slugs -> canonical lowercase lesson GUID so each real DB lesson is counted once.
        var slugToGuid = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var l in dbLessons)
        {
            var canonical = l.Id.ToString().ToLowerInvariant();
            slugToGuid[canonical] = canonical;
            var num = l.LessonNumber > 0 ? l.LessonNumber : l.OrderIndex;
            if (num > 0)
            {
                slugToGuid[$"les-hsk{l.HskLevel}-{num}"] = canonical;
                if (l.HskLevel == 1)
                {
                    slugToGuid[$"les-{num}"] = canonical;
                }
            }
        }

        var completedCanonicalIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var inProgressCanonicalIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var p in userProgresses)
        {
            var normalized = NormalizeLessonId(p.LessonId);
            if (!slugToGuid.TryGetValue(normalized, out var canonical) &&
                !slugToGuid.TryGetValue(p.LessonId ?? string.Empty, out canonical))
            {
                continue;
            }

            if (string.Equals(p.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
            {
                completedCanonicalIds.Add(canonical);
            }
            else if (string.Equals(p.Status, "IN_PROGRESS", StringComparison.OrdinalIgnoreCase))
            {
                inProgressCanonicalIds.Add(canonical);
            }
        }

        var lessonsByLevel = dbLessons.GroupBy(l => l.HskLevel).ToDictionary(g => g.Key, g => g.ToList());
        var courseByLevel = courses.GroupBy(c => c.HskLevel).ToDictionary(g => g.Key, g => g.First());

        var result = new List<HskCourseProgressDto>(6);
        for (int level = 1; level <= 6; level++)
        {
            courseByLevel.TryGetValue(level, out var course);
            lessonsByLevel.TryGetValue(level, out var levelLessons);
            levelLessons ??= new();

            var publishedCount = levelLessons.Count(l => string.Equals(l.Status, "PUBLISHED", StringComparison.OrdinalIgnoreCase));
            var totalLessons = levelLessons.Count;
            var completedCount = levelLessons.Count(l => completedCanonicalIds.Contains(l.Id.ToString().ToLowerInvariant()));
            var inProgressCount = levelLessons.Count(l => !completedCanonicalIds.Contains(l.Id.ToString().ToLowerInvariant())
                                                        && inProgressCanonicalIds.Contains(l.Id.ToString().ToLowerInvariant()));

            result.Add(new HskCourseProgressDto
            {
                HskLevel = level,
                CourseId = course?.Id.ToString().ToLowerInvariant() ?? string.Empty,
                Title = course?.Title ?? $"HSK {level}",
                TotalLessons = totalLessons,
                PublishedLessons = publishedCount,
                CompletedLessons = completedCount,
                InProgressLessons = inProgressCount,
                Percent = CalculateCompletionPercent(completedCount, totalLessons),
                IsComingSoon = totalLessons == 0 || (level >= 5 && publishedCount == 0)
            });
        }

        return result;
    }

    private static List<WeakKnowledgeDto> CalculateWeakKnowledge(List<StudentPracticeAttempt> attempts)
    {
        var grouped = attempts
            .GroupBy(a => new { a.KnowledgePointId, a.TopicTitle, a.Category, a.HskLevel })
            .Select(g =>
            {
                var total = g.Count();
                var correct = g.Count(x => x.IsCorrect);
                var incorrect = total - correct;
                var accuracy = total > 0 ? (double)correct / total * 100 : 0;

                string masteryLevel;
                if (total < 2) masteryLevel = "INSUFFICIENT_DATA";
                else if (accuracy >= 80) masteryLevel = "MASTERED";
                else if (accuracy >= 60) masteryLevel = "RECOVERING";
                else masteryLevel = "WEAK";

                return new WeakKnowledgeDto
                {
                    Id = $"wk-{g.Key.KnowledgePointId}",
                    KnowledgePointId = g.Key.KnowledgePointId,
                    TopicTitle = g.Key.TopicTitle,
                    Category = g.Key.Category,
                    HskLevel = g.Key.HskLevel,
                    TotalAttempts = total,
                    CorrectAttempts = correct,
                    IncorrectAttempts = incorrect,
                    Accuracy = Math.Round(accuracy, 1),
                    MasteryLevel = masteryLevel,
                    Trend = "improving",
                    Evidence = $"Độ chính xác {Math.Round(accuracy, 0)}% qua {total} lượt làm bài",
                    LastEvaluatedAt = DateTime.UtcNow.ToString("o"),
                    SuggestedPractice = new WeakKnowledgeSuggestedPracticeDto
                    {
                        Title = $"Luyện tập {g.Key.TopicTitle}",
                        Route = $"/practice/grammar/{g.Key.KnowledgePointId}",
                        ExerciseIds = g.Select(x => x.ExerciseId).Distinct().Take(5).ToList()
                    }
                };
            })
            .Where(w => w.MasteryLevel == "WEAK" || w.MasteryLevel == "RECOVERING")
            .ToList();

        return grouped;
    }

    public async Task<StudentLearningStateDto> UpdatePreferencesAsync(Guid userId, UpdateLearningPreferencesDto dto, CancellationToken cancellationToken = default)
    {
        var profile = await GetOrCreateProfileAsync(userId, cancellationToken);

        if (dto.SelectedHskLevel.HasValue && dto.SelectedHskLevel.Value >= 1 && dto.SelectedHskLevel.Value <= 9)
        {
            profile.SelectedHskLevel = dto.SelectedHskLevel.Value;
        }

        if (dto.TargetDailyMinutes.HasValue && dto.TargetDailyMinutes.Value > 0)
        {
            profile.TargetDailyMinutes = dto.TargetDailyMinutes.Value;
        }

        if (dto.TargetDailyXp.HasValue && dto.TargetDailyXp.Value > 0)
        {
            profile.TargetDailyXp = dto.TargetDailyXp.Value;
        }

        if (!string.IsNullOrWhiteSpace(dto.CurrentLessonId))
        {
            profile.CurrentLessonId = NormalizeLessonId(dto.CurrentLessonId);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return await GetStudentLearningStateAsync(userId, cancellationToken);
    }

    public async Task<List<LessonProgressDto>> GetLessonProgressesAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var lessons = await _context.StudentLessonProgresses
            .Where(l => l.UserId == userId)
            .ToListAsync(cancellationToken);

        return lessons.Select(l => new LessonProgressDto
        {
            LessonId = NormalizeLessonId(l.LessonId),
            UserId = userId.ToString(),
            Status = l.Status,
            CurrentStepIndex = l.CurrentStepIndex,
            MaxUnlockedStepIndex = l.MaxUnlockedStepIndex,
            QuizScore = l.QuizScore,
            TotalQuizQuestions = l.TotalQuizQuestions,
            XpEarned = l.XpEarned,
            CompletedAt = l.CompletedAt?.ToString("o"),
            UpdatedAt = (l.UpdatedAt ?? l.CreatedAt).ToString("o")
        }).ToList();
    }

    public static int ResolveServerLessonXp(int dbXpReward)
        => dbXpReward > 0 ? Math.Clamp(dbXpReward, 10, 200) : 50;

    public static int ResolvePracticeSessionXp(int correctQuestions, int totalQuestions)
    {
        var validQuestions = Math.Clamp(totalQuestions, 1, 50);
        var validCorrect = Math.Clamp(correctQuestions, 0, validQuestions);
        return Math.Clamp(validCorrect * 5, 5, 100);
    }

    public static int ResolveSrsSessionXp(int wordsReviewedCount)
    {
        var reviewedCount = Math.Clamp(wordsReviewedCount, 1, 50);
        return Math.Clamp(reviewedCount * 3, 5, 60);
    }

    public static void EnsureLessonPublishedOrThrow(string? status, string lessonId)
    {
        if (!string.Equals(status, "PUBLISHED", StringComparison.OrdinalIgnoreCase))
        {
            throw new KeyNotFoundException($"Bài học '{lessonId}' chưa được xuất bản.");
        }
    }

    private async Task<(string NormalizedId, int ServerXpReward)> ResolveAndValidateLessonIdAsync(string? lessonId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(lessonId))
        {
            throw new KeyNotFoundException("Mã bài học không được để trống.");
        }

        var trimmed = lessonId.Trim();

        // 1. Check if it's a legacy or HSK-prefixed slug like 'les-1' or 'les-hsk1-2'
        if (TryParseLessonSlug(trimmed, out int hskLevel, out int lessonNum))
        {
            var matched = await _context.Lessons.AsNoTracking()
                .Include(l => l.Course)
                .Where(l => ((l.Course != null && l.Course.HskLevel == hskLevel) || (hskLevel == 1 && l.Course == null))
                            && (l.Status == null || l.Status != "ARCHIVED")
                            && (l.LessonNumber == lessonNum || l.OrderIndex == lessonNum))
                .Select(l => new { l.Id, l.Status, l.XpReward })
                .FirstOrDefaultAsync(cancellationToken);

            if (matched != null)
            {
                EnsureLessonPublishedOrThrow(matched.Status, lessonId);
                return (matched.Id.ToString().ToLowerInvariant(), ResolveServerLessonXp(matched.XpReward));
            }

            throw new KeyNotFoundException($"Không tìm thấy bài học với mã '{lessonId}'.");
        }

        // 2. Check if it's a GUID
        if (Guid.TryParse(trimmed, out var guid))
        {
            var matched = await _context.Lessons.AsNoTracking()
                .Where(l => l.Id == guid)
                .Select(l => new { l.Id, l.Status, l.XpReward })
                .FirstOrDefaultAsync(cancellationToken);

            if (matched == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy bài học với GUID '{lessonId}'.");
            }

            EnsureLessonPublishedOrThrow(matched.Status, lessonId);
            return (guid.ToString().ToLowerInvariant(), ResolveServerLessonXp(matched.XpReward));
        }

        throw new KeyNotFoundException($"Không tìm thấy bài học với mã '{lessonId}'.");
    }

    public async Task<LessonProgressDto> UpdateLessonStepAsync(Guid userId, string lessonId, UpdateLessonStepDto dto, CancellationToken cancellationToken = default)
    {
        var (normalizedId, _) = await ResolveAndValidateLessonIdAsync(lessonId, cancellationToken);
        var isLesson1 = IsLesson1(lessonId);

        var profile = await GetOrCreateProfileAsync(userId, cancellationToken);
        var todayStr = GetLocalDateString();
        var yesterdayStr = GetYesterdayDateString();

        var lesson = _context.StudentLessonProgresses.Local
            .FirstOrDefault(l => l.UserId == userId && (l.LessonId == normalizedId || (isLesson1 && l.LessonId == LegacyLesson1Id)))
            ?? await _context.StudentLessonProgresses
                .FirstOrDefaultAsync(l => l.UserId == userId && (l.LessonId == normalizedId || (isLesson1 && l.LessonId == LegacyLesson1Id)), cancellationToken);

        var safeStep = Math.Max(0, dto.CurrentStepIndex);
        var safeMax = Math.Max(safeStep, dto.MaxUnlockedStepIndex ?? safeStep);

        if (lesson == null)
        {
            lesson = new StudentLessonProgress
            {
                UserId = userId,
                LessonId = normalizedId,
                Status = "IN_PROGRESS",
                CurrentStepIndex = safeStep,
                MaxUnlockedStepIndex = safeMax
            };
            _context.StudentLessonProgresses.Add(lesson);
        }
        else
        {
            if (lesson.LessonId == LegacyLesson1Id)
            {
                lesson.LessonId = Lesson1Guid;
            }
            if (lesson.Status == "NOT_STARTED") lesson.Status = "IN_PROGRESS";
            lesson.CurrentStepIndex = safeStep;
            lesson.MaxUnlockedStepIndex = Math.Max(lesson.MaxUnlockedStepIndex, safeMax);
        }

        profile.CurrentLessonId = normalizedId;
        UpdateStreak(profile, todayStr, yesterdayStr);

        var daily = await GetOrCreateDailyActivityAsync(userId, todayStr, cancellationToken);
        daily.Minutes += 1;

        await _context.SaveChangesAsync(cancellationToken);

        return new LessonProgressDto
        {
            LessonId = lesson.LessonId,
            UserId = userId.ToString(),
            Status = lesson.Status,
            CurrentStepIndex = lesson.CurrentStepIndex,
            MaxUnlockedStepIndex = lesson.MaxUnlockedStepIndex,
            QuizScore = lesson.QuizScore,
            TotalQuizQuestions = lesson.TotalQuizQuestions,
            XpEarned = lesson.XpEarned,
            CompletedAt = lesson.CompletedAt?.ToString("o"),
            UpdatedAt = (lesson.UpdatedAt ?? lesson.CreatedAt).ToString("o")
        };
    }

    public async Task<StudentLearningStateDto> CompleteLessonAsync(Guid userId, string lessonId, CompleteLessonDto dto, CancellationToken cancellationToken = default)
    {
        var (normalizedId, serverXpReward) = await ResolveAndValidateLessonIdAsync(lessonId, cancellationToken);
        var isLesson1 = IsLesson1(lessonId);

        var profile = await GetOrCreateProfileAsync(userId, cancellationToken);
        var todayStr = GetLocalDateString();
        var yesterdayStr = GetYesterdayDateString();

        var lesson = _context.StudentLessonProgresses.Local
            .FirstOrDefault(l => l.UserId == userId && (l.LessonId == normalizedId || (isLesson1 && l.LessonId == LegacyLesson1Id)))
            ?? await _context.StudentLessonProgresses
                .FirstOrDefaultAsync(l => l.UserId == userId && (l.LessonId == normalizedId || (isLesson1 && l.LessonId == LegacyLesson1Id)), cancellationToken);

        var now = DateTime.UtcNow;
        // Always derive XP from authoritative DB Lesson.XpReward, ignoring client-supplied dto.XpEarned.
        var xpAmount = serverXpReward;

        if (lesson == null)
        {
            lesson = new StudentLessonProgress
            {
                UserId = userId,
                LessonId = normalizedId,
                Status = "COMPLETED",
                CurrentStepIndex = 5,
                MaxUnlockedStepIndex = 5,
                QuizScore = dto.QuizScore,
                TotalQuizQuestions = dto.TotalQuizQuestions,
                XpEarned = xpAmount,
                CompletedAt = now
            };
            _context.StudentLessonProgresses.Add(lesson);
        }
        else
        {
            if (lesson.LessonId == LegacyLesson1Id)
            {
                lesson.LessonId = Lesson1Guid;
            }
            lesson.Status = "COMPLETED";
            lesson.CurrentStepIndex = 5;
            lesson.MaxUnlockedStepIndex = 5;
            lesson.QuizScore = dto.QuizScore;
            lesson.TotalQuizQuestions = dto.TotalQuizQuestions;
            lesson.XpEarned = xpAmount;
            lesson.CompletedAt = now;
        }

        // Award XP idempotently using normalizedId
        var eventId = $"lesson_complete_{normalizedId}";
        await AwardIdempotentXpAsync(profile, eventId, xpAmount, "LESSON_COMPLETION", $"Hoàn thành bài học {normalizedId}", todayStr, cancellationToken);

        // Update streak
        UpdateStreak(profile, todayStr, yesterdayStr);

        // Update daily activity
        var daily = await GetOrCreateDailyActivityAsync(userId, todayStr, cancellationToken);
        daily.Minutes += 15;

        List<string> completedLessons;
        try
        {
            completedLessons = JsonSerializer.Deserialize<List<string>>(daily.CompletedLessonsJson) ?? new List<string>();
        }
        catch
        {
            completedLessons = new List<string>();
        }
        if (!completedLessons.Contains(normalizedId))
        {
            completedLessons.Add(normalizedId);
            daily.CompletedLessonsJson = JsonSerializer.Serialize(completedLessons);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return await GetStudentLearningStateAsync(userId, cancellationToken);
    }

    public async Task<Dictionary<string, DailyActivityDto>> GetDailyActivitiesAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var activities = await _context.StudentDailyActivities
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.ActivityDate)
            .Take(30)
            .ToListAsync(cancellationToken);

        var result = new Dictionary<string, DailyActivityDto>();
        foreach (var act in activities)
        {
            List<string> completedList;
            try
            {
                completedList = JsonSerializer.Deserialize<List<string>>(act.CompletedLessonsJson) ?? new List<string>();
            }
            catch
            {
                completedList = new List<string>();
            }

            result[act.ActivityDate] = new DailyActivityDto
            {
                Date = act.ActivityDate,
                Minutes = act.Minutes,
                XpEarned = act.XpEarned,
                CompletedLessons = completedList,
                ExercisesCompleted = act.ExercisesCompleted,
                ReviewsCompleted = act.ReviewsCompleted
            };
        }

        return result;
    }

    public async Task<StudentLearningStateDto> RecordPracticeAttemptAsync(Guid userId, RecordPracticeAttemptDto dto, CancellationToken cancellationToken = default)
    {
        var profile = await GetOrCreateProfileAsync(userId, cancellationToken);
        var todayStr = GetLocalDateString();
        var yesterdayStr = GetYesterdayDateString();

        var attempt = new StudentPracticeAttempt
        {
            UserId = userId,
            ExerciseId = dto.ExerciseId,
            QuestionId = dto.QuestionId,
            KnowledgePointId = dto.KnowledgePointId,
            TopicTitle = dto.TopicTitle,
            Category = string.IsNullOrWhiteSpace(dto.Category) ? "grammar" : dto.Category.Trim(),
            HskLevel = Math.Clamp(dto.HskLevel, 1, 9),
            UserAnswer = dto.UserAnswer ?? string.Empty,
            IsCorrect = dto.IsCorrect,
            AttemptedAt = DateTime.UtcNow
        };
        _context.StudentPracticeAttempts.Add(attempt);

        UpdateStreak(profile, todayStr, yesterdayStr);

        var daily = await GetOrCreateDailyActivityAsync(userId, todayStr, cancellationToken);
        daily.ExercisesCompleted += 1;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetStudentLearningStateAsync(userId, cancellationToken);
    }

    public async Task<StudentLearningStateDto> RecordPracticeSessionAsync(Guid userId, PracticeSessionResultDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.SessionId))
        {
            throw new ArgumentException("SessionId không được để trống.");
        }

        var profile = await GetOrCreateProfileAsync(userId, cancellationToken);
        var todayStr = GetLocalDateString();
        var yesterdayStr = GetYesterdayDateString();

        var safeSessionId = dto.SessionId.Trim();
        var eventId = $"practice_session_{safeSessionId}";
        var xpAmount = ResolvePracticeSessionXp(dto.CorrectQuestions, dto.TotalQuestions);

        await AwardIdempotentXpAsync(profile, eventId, xpAmount, "PRACTICE_SESSION", $"Luyện tập {safeSessionId}", todayStr, cancellationToken);

        UpdateStreak(profile, todayStr, yesterdayStr);

        var clampedSeconds = Math.Clamp(dto.TimeSpentSeconds, 0, 7200);
        var clampedQuestions = Math.Clamp(dto.TotalQuestions, 1, 200);
        var daily = await GetOrCreateDailyActivityAsync(userId, todayStr, cancellationToken);
        daily.ExercisesCompleted += clampedQuestions;
        daily.Minutes += Math.Max(2, (int)Math.Round((double)clampedSeconds / 60));

        await _context.SaveChangesAsync(cancellationToken);

        return await GetStudentLearningStateAsync(userId, cancellationToken);
    }

    public async Task<Dictionary<string, UserVocabularyStateDto>> GetVocabularyProgressAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var vocabularies = await _context.StudentVocabularyProgresses
            .Where(v => v.UserId == userId)
            .ToListAsync(cancellationToken);

        var todayStr = GetLocalDateString();
        var result = new Dictionary<string, UserVocabularyStateDto>();

        foreach (var v in vocabularies)
        {
            var nextReviewStr = GetLocalDateString(v.NextReviewAt);
            result[v.VocabularyId] = new UserVocabularyStateDto
            {
                VocabularyId = v.VocabularyId,
                Status = v.Status,
                FirstLearnedAt = GetLocalDateString(v.FirstLearnedAt),
                LastReviewedAt = GetLocalDateString(v.LastReviewedAt),
                NextReviewAt = nextReviewStr,
                ReviewCount = v.ReviewCount,
                CorrectCount = v.CorrectCount,
                IsDueToday = nextReviewStr.CompareTo(todayStr) <= 0
            };
        }

        return result;
    }

    public async Task<StudentLearningStateDto> RecordSrsReviewAsync(Guid userId, SrsReviewRequestDto dto, CancellationToken cancellationToken = default)
    {
        var profile = await GetOrCreateProfileAsync(userId, cancellationToken);
        var todayStr = GetLocalDateString();
        var yesterdayStr = GetYesterdayDateString();

        var vocab = _context.StudentVocabularyProgresses.Local
            .FirstOrDefault(v => v.UserId == userId && v.VocabularyId == dto.VocabularyId)
            ?? await _context.StudentVocabularyProgresses
                .FirstOrDefaultAsync(v => v.UserId == userId && v.VocabularyId == dto.VocabularyId, cancellationToken);

        var now = DateTime.UtcNow;
        var rating = dto.Rating.ToLowerInvariant();
        var isCorrect = rating != "again";

        if (vocab == null)
        {
            vocab = new StudentVocabularyProgress
            {
                UserId = userId,
                VocabularyId = dto.VocabularyId,
                Status = "learning",
                FirstLearnedAt = now,
                LastReviewedAt = now,
                NextReviewAt = now.AddDays(1),
                ReviewCount = 0,
                CorrectCount = 0,
                SrsStage = 0,
                Stability = 1.0,
                Difficulty = 5.0,
                IntervalDays = 1,
                Repetitions = 0,
                EaseFactor = 2.5
            };
            _context.StudentVocabularyProgresses.Add(vocab);
        }

        // SRS SM-2 / Leitner progression
        var currentInterval = Math.Max(1, vocab.IntervalDays);
        var ease = vocab.EaseFactor > 1.3 ? vocab.EaseFactor : 2.5;
        int nextIntervalDays;

        switch (rating)
        {
            case "again":
                nextIntervalDays = 1;
                vocab.Repetitions = 0;
                vocab.EaseFactor = Math.Max(1.3, ease - 0.2);
                break;
            case "hard":
                nextIntervalDays = vocab.Repetitions == 0 ? 1 : (int)Math.Round(currentInterval * 1.2);
                vocab.Repetitions += 1;
                vocab.EaseFactor = Math.Max(1.3, ease - 0.15);
                break;
            case "easy":
                nextIntervalDays = vocab.Repetitions == 0 ? 4 : (int)Math.Round(currentInterval * ease * 1.4);
                vocab.Repetitions += 1;
                vocab.EaseFactor = Math.Min(3.0, ease + 0.15);
                break;
            case "good":
            default:
                if (vocab.Repetitions == 0) nextIntervalDays = 1;
                else if (vocab.Repetitions == 1) nextIntervalDays = 3;
                else nextIntervalDays = (int)Math.Round(currentInterval * ease);
                vocab.Repetitions += 1;
                break;
        }

        vocab.IntervalDays = Math.Min(365, Math.Max(1, nextIntervalDays));
        vocab.ReviewCount += 1;
        if (isCorrect) vocab.CorrectCount += 1;
        vocab.LastReviewedAt = now;
        vocab.NextReviewAt = now.AddDays(vocab.IntervalDays);

        if (vocab.Repetitions >= 5 && vocab.IntervalDays >= 14)
        {
            vocab.Status = "mastered";
        }
        else if (vocab.Repetitions >= 2)
        {
            vocab.Status = "reviewing";
        }
        else
        {
            vocab.Status = "learning";
        }

        UpdateStreak(profile, todayStr, yesterdayStr);

        var daily = await GetOrCreateDailyActivityAsync(userId, todayStr, cancellationToken);
        daily.ReviewsCompleted += 1;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetStudentLearningStateAsync(userId, cancellationToken);
    }

    public async Task<StudentLearningStateDto> CompleteSrsSessionAsync(Guid userId, CompleteSrsSessionDto dto, CancellationToken cancellationToken = default)
    {
        var profile = await GetOrCreateProfileAsync(userId, cancellationToken);
        var todayStr = GetLocalDateString();
        var yesterdayStr = GetYesterdayDateString();

        var eventId = $"srs_session_{todayStr}_{DateTime.UtcNow.Ticks}";
        var xpAmount = ResolveSrsSessionXp(dto.WordsReviewedCount);

        await AwardIdempotentXpAsync(profile, eventId, xpAmount, "SRS_SESSION", "Ôn tập thẻ từ vựng SRS", todayStr, cancellationToken);

        UpdateStreak(profile, todayStr, yesterdayStr);

        var daily = await GetOrCreateDailyActivityAsync(userId, todayStr, cancellationToken);
        daily.ReviewsCompleted += dto.WordsReviewedCount;
        daily.Minutes += Math.Max(3, (int)Math.Round(dto.WordsReviewedCount * 0.5));

        await _context.SaveChangesAsync(cancellationToken);

        return await GetStudentLearningStateAsync(userId, cancellationToken);
    }

    public async Task<StudentLearningStateDto> AddVocabularyAsync(Guid userId, AddVocabularyRequestDto dto, CancellationToken cancellationToken = default)
    {
        var profile = await GetOrCreateProfileAsync(userId, cancellationToken);
        var vocabId = !string.IsNullOrWhiteSpace(dto.VocabularyId)
            ? dto.VocabularyId
            : $"vocab-custom-{Uri.EscapeDataString(dto.Hanzi.Trim())}";

        var existing = _context.StudentVocabularyProgresses.Local
            .FirstOrDefault(v => v.UserId == userId && v.VocabularyId == vocabId)
            ?? await _context.StudentVocabularyProgresses
                .FirstOrDefaultAsync(v => v.UserId == userId && v.VocabularyId == vocabId, cancellationToken);

        if (existing == null)
        {
            var now = DateTime.UtcNow;
            var vocab = new StudentVocabularyProgress
            {
                UserId = userId,
                VocabularyId = vocabId,
                Hanzi = dto.Hanzi.Trim(),
                Pinyin = dto.Pinyin,
                Status = "learning",
                FirstLearnedAt = now,
                LastReviewedAt = now,
                NextReviewAt = now, // due today
                ReviewCount = 0,
                CorrectCount = 0,
                SrsStage = 0,
                Stability = 1.0,
                Difficulty = 4.0,
                IntervalDays = 1,
                Repetitions = 0,
                EaseFactor = 2.5
            };
            _context.StudentVocabularyProgresses.Add(vocab);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return await GetStudentLearningStateAsync(userId, cancellationToken);
    }
}
