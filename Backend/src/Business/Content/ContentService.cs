using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Content.DTOs;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.Content;

public class ContentService : IContentService
{
    private readonly ApplicationDbContext _dbContext;

    public ContentService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    #region Courses

    public async Task<List<CourseDto>> GetCoursesAsync(int? hskLevel = null, string? status = null, bool publishedOnly = false, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Courses.AsNoTracking().AsQueryable();

        if (publishedOnly)
        {
            query = query.Where(c => c.Status == "PUBLISHED");
        }
        else if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
        {
            query = query.Where(c => c.Status == status);
        }

        if (hskLevel.HasValue && hskLevel.Value > 0)
        {
            query = query.Where(c => c.HskLevel == hskLevel.Value);
        }

        var courses = await query.OrderBy(c => c.OrderIndex).ToListAsync(cancellationToken);

        var courseIds = courses.Select(c => c.Id).ToList();
        var lessonStats = await _dbContext.Lessons.AsNoTracking()
            .Where(l => courseIds.Contains(l.CourseId))
            .GroupBy(l => l.CourseId)
            .Select(g => new
            {
                CourseId = g.Key,
                Total = g.Count(),
                Published = g.Count(l => l.Status == "PUBLISHED")
            })
            .ToListAsync(cancellationToken);

        var statsMap = lessonStats.ToDictionary(s => s.CourseId);

        return courses.Select(c =>
        {
            statsMap.TryGetValue(c.Id, out var s);
            return new CourseDto
            {
                Id = c.Id,
                Code = c.Code,
                Title = c.Title,
                Description = c.Description,
                HskLevel = c.HskLevel,
                Status = c.Status,
                OrderIndex = c.OrderIndex,
                LessonCount = s?.Total ?? 0,
                PublishedLessonCount = s?.Published ?? 0,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            };
        }).ToList();
    }

    public async Task<CourseDto?> GetCourseByIdAsync(Guid id, bool publishedOnly = false, CancellationToken cancellationToken = default)
    {
        var course = await _dbContext.Courses.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (course == null || (publishedOnly && course.Status != "PUBLISHED"))
        {
            return null;
        }

        var totalLessons = await _dbContext.Lessons.CountAsync(l => l.CourseId == id, cancellationToken);
        var publishedLessons = await _dbContext.Lessons.CountAsync(l => l.CourseId == id && l.Status == "PUBLISHED", cancellationToken);

        return new CourseDto
        {
            Id = course.Id,
            Code = course.Code,
            Title = course.Title,
            Description = course.Description,
            HskLevel = course.HskLevel,
            Status = course.Status,
            OrderIndex = course.OrderIndex,
            LessonCount = totalLessons,
            PublishedLessonCount = publishedLessons,
            CreatedAt = course.CreatedAt,
            UpdatedAt = course.UpdatedAt
        };
    }

    public async Task<CourseDto> CreateCourseAsync(CreateCourseDto dto, CancellationToken cancellationToken = default)
    {
        var course = new CourseEntity
        {
            Code = dto.Code.Trim(),
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim(),
            HskLevel = dto.HskLevel,
            Status = dto.Status,
            OrderIndex = dto.OrderIndex
        };

        _dbContext.Courses.Add(course);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new CourseDto
        {
            Id = course.Id,
            Code = course.Code,
            Title = course.Title,
            Description = course.Description,
            HskLevel = course.HskLevel,
            Status = course.Status,
            OrderIndex = course.OrderIndex,
            LessonCount = 0,
            PublishedLessonCount = 0,
            CreatedAt = course.CreatedAt,
            UpdatedAt = course.UpdatedAt
        };
    }

    public async Task<CourseDto?> UpdateCourseAsync(Guid id, UpdateCourseDto dto, CancellationToken cancellationToken = default)
    {
        var course = await _dbContext.Courses.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (course == null) return null;

        course.Title = dto.Title.Trim();
        course.Description = dto.Description?.Trim();
        course.HskLevel = dto.HskLevel;
        course.Status = dto.Status;
        course.OrderIndex = dto.OrderIndex;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var totalLessons = await _dbContext.Lessons.CountAsync(l => l.CourseId == id, cancellationToken);
        var publishedLessons = await _dbContext.Lessons.CountAsync(l => l.CourseId == id && l.Status == "PUBLISHED", cancellationToken);

        return new CourseDto
        {
            Id = course.Id,
            Code = course.Code,
            Title = course.Title,
            Description = course.Description,
            HskLevel = course.HskLevel,
            Status = course.Status,
            OrderIndex = course.OrderIndex,
            LessonCount = totalLessons,
            PublishedLessonCount = publishedLessons,
            CreatedAt = course.CreatedAt,
            UpdatedAt = course.UpdatedAt
        };
    }

    public async Task<bool> DeleteCourseAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var course = await _dbContext.Courses.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (course == null) return false;

        _dbContext.Courses.Remove(course);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    #endregion

    #region Units

    public async Task<List<UnitDto>> GetUnitsAsync(Guid? courseId = null, string? status = null, bool publishedOnly = false, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Units.AsNoTracking().AsQueryable();

        if (publishedOnly)
        {
            query = query.Where(u => u.Status == "PUBLISHED");
        }
        else if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
        {
            query = query.Where(u => u.Status == status);
        }

        if (courseId.HasValue && courseId.Value != Guid.Empty)
        {
            query = query.Where(u => u.CourseId == courseId.Value);
        }

        var units = await query.OrderBy(u => u.OrderIndex).ToListAsync(cancellationToken);
        var unitIds = units.Select(u => u.Id).ToList();

        var lessonStats = await _dbContext.Lessons.AsNoTracking()
            .Where(l => l.UnitId.HasValue && unitIds.Contains(l.UnitId.Value))
            .GroupBy(l => l.UnitId!.Value)
            .Select(g => new
            {
                UnitId = g.Key,
                Total = g.Count(),
                Published = g.Count(l => l.Status == "PUBLISHED")
            })
            .ToListAsync(cancellationToken);

        var statsMap = lessonStats.ToDictionary(s => s.UnitId);

        return units.Select(u =>
        {
            statsMap.TryGetValue(u.Id, out var s);
            return new UnitDto
            {
                Id = u.Id,
                CourseId = u.CourseId,
                UnitNumber = u.UnitNumber,
                TitleZh = u.TitleZh,
                TitleVi = u.TitleVi,
                Description = u.Description,
                OrderIndex = u.OrderIndex,
                Status = u.Status,
                LessonCount = s?.Total ?? 0,
                PublishedLessonCount = s?.Published ?? 0,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt
            };
        }).ToList();
    }

    public async Task<UnitDto?> GetUnitByIdAsync(Guid id, bool publishedOnly = false, CancellationToken cancellationToken = default)
    {
        var unit = await _dbContext.Units.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (unit == null || (publishedOnly && unit.Status != "PUBLISHED")) return null;

        var total = await _dbContext.Lessons.CountAsync(l => l.UnitId == id, cancellationToken);
        var published = await _dbContext.Lessons.CountAsync(l => l.UnitId == id && l.Status == "PUBLISHED", cancellationToken);

        return new UnitDto
        {
            Id = unit.Id,
            CourseId = unit.CourseId,
            UnitNumber = unit.UnitNumber,
            TitleZh = unit.TitleZh,
            TitleVi = unit.TitleVi,
            Description = unit.Description,
            OrderIndex = unit.OrderIndex,
            Status = unit.Status,
            LessonCount = total,
            PublishedLessonCount = published,
            CreatedAt = unit.CreatedAt,
            UpdatedAt = unit.UpdatedAt
        };
    }

    public async Task<UnitDto> CreateUnitAsync(CreateUnitDto dto, CancellationToken cancellationToken = default)
    {
        var unit = new UnitEntity
        {
            Id = Guid.NewGuid(),
            CourseId = dto.CourseId,
            UnitNumber = dto.UnitNumber,
            TitleZh = dto.TitleZh.Trim(),
            TitleVi = dto.TitleVi.Trim(),
            Description = dto.Description?.Trim(),
            OrderIndex = dto.OrderIndex,
            Status = dto.Status
        };

        _dbContext.Units.Add(unit);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new UnitDto
        {
            Id = unit.Id,
            CourseId = unit.CourseId,
            UnitNumber = unit.UnitNumber,
            TitleZh = unit.TitleZh,
            TitleVi = unit.TitleVi,
            Description = unit.Description,
            OrderIndex = unit.OrderIndex,
            Status = unit.Status,
            LessonCount = 0,
            PublishedLessonCount = 0,
            CreatedAt = unit.CreatedAt,
            UpdatedAt = unit.UpdatedAt
        };
    }

    public async Task<UnitDto?> UpdateUnitAsync(Guid id, UpdateUnitDto dto, CancellationToken cancellationToken = default)
    {
        var unit = await _dbContext.Units.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (unit == null) return null;

        unit.UnitNumber = dto.UnitNumber;
        unit.TitleZh = dto.TitleZh.Trim();
        unit.TitleVi = dto.TitleVi.Trim();
        unit.Description = dto.Description?.Trim();
        unit.OrderIndex = dto.OrderIndex;
        unit.Status = dto.Status;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var total = await _dbContext.Lessons.CountAsync(l => l.UnitId == id, cancellationToken);
        var published = await _dbContext.Lessons.CountAsync(l => l.UnitId == id && l.Status == "PUBLISHED", cancellationToken);

        return new UnitDto
        {
            Id = unit.Id,
            CourseId = unit.CourseId,
            UnitNumber = unit.UnitNumber,
            TitleZh = unit.TitleZh,
            TitleVi = unit.TitleVi,
            Description = unit.Description,
            OrderIndex = unit.OrderIndex,
            Status = unit.Status,
            LessonCount = total,
            PublishedLessonCount = published,
            CreatedAt = unit.CreatedAt,
            UpdatedAt = unit.UpdatedAt
        };
    }

    public async Task<bool> DeleteUnitAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var unit = await _dbContext.Units.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (unit == null) return false;

        _dbContext.Units.Remove(unit);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    #endregion

    #region Lessons

    public async Task<PagedResponse<LessonDto>> GetLessonsAsync(Guid? courseId = null, Guid? unitId = null, string? status = null, string? search = null, int page = 1, int pageSize = 20, bool publishedOnly = false, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Lessons.AsNoTracking().Include(l => l.Course).AsQueryable();

        if (publishedOnly)
        {
            query = query.Where(l => l.Status == "PUBLISHED");
        }
        else if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
        {
            query = query.Where(l => l.Status == status);
        }

        if (courseId.HasValue && courseId.Value != Guid.Empty)
        {
            query = query.Where(l => l.CourseId == courseId.Value);
        }

        if (unitId.HasValue && unitId.Value != Guid.Empty)
        {
            query = query.Where(l => l.UnitId == unitId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(l => l.TitleZh.ToLower().Contains(q) || l.TitleVi.ToLower().Contains(q) || (l.Pinyin != null && l.Pinyin.ToLower().Contains(q)));
        }

        var totalItems = await query.CountAsync(cancellationToken);
        var pageClamped = Math.Max(1, page);
        var pageSizeClamped = Math.Clamp(pageSize, 1, 500);

        var items = await query
            .OrderBy(l => l.OrderIndex)
            .ThenBy(l => l.LessonNumber)
            .Skip((pageClamped - 1) * pageSizeClamped)
            .Take(pageSizeClamped)
            .Select(l => new LessonDto
            {
                Id = l.Id,
                CourseId = l.CourseId,
                UnitId = l.UnitId,
                CourseTitle = l.Course != null ? l.Course.Title : string.Empty,
                LessonNumber = l.LessonNumber,
                TitleZh = l.TitleZh,
                TitleVi = l.TitleVi,
                Pinyin = l.Pinyin,
                Summary = l.Summary,
                DialogueJson = l.DialogueJson,
                ListeningJson = l.ListeningJson,
                DurationMinutes = l.DurationMinutes,
                XpReward = l.XpReward,
                OrderIndex = l.OrderIndex,
                Status = l.Status,
                VocabularyCount = l.Vocabularies.Count,
                GrammarCount = l.GrammarPoints.Count,
                ExerciseCount = l.Exercises.Count,
                CreatedAt = l.CreatedAt,
                UpdatedAt = l.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResponse<LessonDto>(items, totalItems, pageClamped, pageSizeClamped);
    }

    public async Task<LessonDetailDto?> GetLessonByIdAsync(Guid id, bool publishedOnly = false, CancellationToken cancellationToken = default)
    {
        var lesson = await _dbContext.Lessons.AsNoTracking()
            .Include(l => l.Course)
            .Include(l => l.Vocabularies)
            .Include(l => l.GrammarPoints)
            .Include(l => l.Exercises)
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        if (lesson == null || (publishedOnly && lesson.Status != "PUBLISHED"))
        {
            return null;
        }

        var vocabList = lesson.Vocabularies
            .Where(v => !publishedOnly || v.Status == "PUBLISHED")
            .Select(v => new VocabularyDto
            {
                Id = v.Id,
                HskLevel = v.HskLevel,
                Hanzi = v.Hanzi,
                Traditional = v.Traditional,
                Pinyin = v.Pinyin,
                MeaningVi = v.MeaningVi,
                MeaningEn = v.MeaningEn,
                PartOfSpeech = v.PartOfSpeech,
                AudioUrl = v.AudioUrl,
                ExamplesJson = v.ExamplesJson,
                Status = v.Status,
                LessonId = v.LessonId,
                CreatedAt = v.CreatedAt,
                UpdatedAt = v.UpdatedAt
            }).ToList();

        var grammarList = lesson.GrammarPoints
            .Where(g => !publishedOnly || g.Status == "PUBLISHED")
            .Select(g => new GrammarPointDto
            {
                Id = g.Id,
                Code = g.Code,
                Title = g.Title,
                PinyinTitle = g.PinyinTitle,
                HskLevel = g.HskLevel,
                Category = g.Category,
                StructureFormula = g.StructureFormula,
                Explanation = g.Explanation,
                Difficulty = g.Difficulty,
                ExamplesJson = g.ExamplesJson,
                PracticeJson = g.PracticeJson,
                Status = g.Status,
                LessonId = g.LessonId,
                CreatedAt = g.CreatedAt,
                UpdatedAt = g.UpdatedAt
            }).ToList();

        var exerciseList = lesson.Exercises
            .Where(e => !publishedOnly || e.Status == "PUBLISHED")
            .Select(e => new ExerciseDto
            {
                Id = e.Id,
                Type = e.Type,
                Skill = e.Skill,
                HskLevel = e.HskLevel,
                Title = e.Title,
                Instruction = e.Instruction,
                PromptHanzi = e.PromptHanzi,
                PromptPinyin = e.PromptPinyin,
                PromptVietnamese = e.PromptVietnamese,
                AudioUrl = e.AudioUrl,
                OptionsJson = e.OptionsJson,
                CorrectOptionIndex = e.CorrectOptionIndex,
                CorrectAnswer = e.CorrectAnswer,
                Explanation = e.Explanation,
                XpReward = e.XpReward,
                Status = e.Status,
                LessonId = e.LessonId,
                GrammarPointId = e.GrammarPointId,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            }).ToList();

        ReadingPassageDto? readingPassage = null;
        if (!string.IsNullOrWhiteSpace(lesson.DialogueJson))
        {
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(lesson.DialogueJson);
                if (doc.RootElement.ValueKind == System.Text.Json.JsonValueKind.Object && doc.RootElement.TryGetProperty("readingPassage", out var rpElem))
                {
                    readingPassage = System.Text.Json.JsonSerializer.Deserialize<ReadingPassageDto>(rpElem.GetRawText(), new System.Text.Json.JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                }
            }
            catch
            {
                // Graceful fallback if dialogueJson is not JSON or does not contain readingPassage
            }
        }

        return new LessonDetailDto
        {
            Id = lesson.Id,
            CourseId = lesson.CourseId,
            UnitId = lesson.UnitId,
            CourseTitle = lesson.Course?.Title ?? string.Empty,
            LessonNumber = lesson.LessonNumber,
            TitleZh = lesson.TitleZh,
            TitleVi = lesson.TitleVi,
            Pinyin = lesson.Pinyin,
            Summary = lesson.Summary,
            DialogueJson = lesson.DialogueJson,
            ListeningJson = lesson.ListeningJson,
            DurationMinutes = lesson.DurationMinutes,
            XpReward = lesson.XpReward,
            OrderIndex = lesson.OrderIndex,
            Status = lesson.Status,
            VocabularyCount = vocabList.Count,
            GrammarCount = grammarList.Count,
            ExerciseCount = exerciseList.Count,
            Vocabularies = vocabList,
            GrammarPoints = grammarList,
            Exercises = exerciseList,
            ReadingPassage = readingPassage,
            CreatedAt = lesson.CreatedAt,
            UpdatedAt = lesson.UpdatedAt
        };
    }

    public async Task<LessonDto> CreateLessonAsync(CreateLessonDto dto, Guid? currentUserId = null, CancellationToken cancellationToken = default)
    {
        var course = await _dbContext.Courses.FindAsync(new object[] { dto.CourseId }, cancellationToken);
        if (course == null)
        {
            throw new InvalidOperationException("Không tìm thấy khóa học tương ứng.");
        }

        var targetStatus = (dto.Status ?? "DRAFT").Trim().ToUpperInvariant();
        if (targetStatus == "PUBLISHED")
        {
            throw new InvalidOperationException("Không thể tạo trực tiếp bài học ở trạng thái PUBLISHED. Mọi bài học mới bắt buộc phải khởi tạo ở trạng thái DRAFT và trải qua quy trình kiểm duyệt Release Gate.");
        }
        if (targetStatus != "DRAFT" && targetStatus != "PENDING_REVIEW")
        {
            targetStatus = "DRAFT";
        }

        var lesson = new LessonEntity
        {
            CourseId = dto.CourseId,
            UnitId = dto.UnitId.HasValue && dto.UnitId.Value != Guid.Empty ? dto.UnitId.Value : null,
            LessonNumber = dto.LessonNumber,
            TitleZh = dto.TitleZh.Trim(),
            TitleVi = dto.TitleVi.Trim(),
            Pinyin = dto.Pinyin?.Trim(),
            Summary = dto.Summary?.Trim(),
            DurationMinutes = dto.DurationMinutes,
            XpReward = dto.XpReward,
            OrderIndex = dto.OrderIndex,
            Status = targetStatus,
            UpdatedByUserId = currentUserId,
            DialogueJson = dto.DialogueJson,
            ListeningJson = dto.ListeningJson
        };

        _dbContext.Lessons.Add(lesson);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new LessonDto
        {
            Id = lesson.Id,
            CourseId = lesson.CourseId,
            UnitId = lesson.UnitId,
            CourseTitle = course.Title,
            LessonNumber = lesson.LessonNumber,
            TitleZh = lesson.TitleZh,
            TitleVi = lesson.TitleVi,
            Pinyin = lesson.Pinyin,
            Summary = lesson.Summary,
            DialogueJson = lesson.DialogueJson,
            ListeningJson = lesson.ListeningJson,
            DurationMinutes = lesson.DurationMinutes,
            XpReward = lesson.XpReward,
            OrderIndex = lesson.OrderIndex,
            Status = lesson.Status,
            VocabularyCount = 0,
            GrammarCount = 0,
            ExerciseCount = 0,
            CreatedAt = lesson.CreatedAt,
            UpdatedAt = lesson.UpdatedAt
        };
    }

    public async Task<LessonDto?> UpdateLessonAsync(Guid id, UpdateLessonDto dto, Guid? currentUserId = null, CancellationToken cancellationToken = default)
    {
        var lesson = await _dbContext.Lessons.Include(l => l.Course).FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
        if (lesson == null) return null;

        if (dto.UnitId.HasValue)
        {
            lesson.UnitId = dto.UnitId.Value == Guid.Empty ? null : dto.UnitId.Value;
        }
        lesson.LessonNumber = dto.LessonNumber;
        lesson.TitleZh = dto.TitleZh.Trim();
        lesson.TitleVi = dto.TitleVi.Trim();
        lesson.Pinyin = dto.Pinyin?.Trim();
        lesson.Summary = dto.Summary?.Trim();
        lesson.DurationMinutes = dto.DurationMinutes;
        lesson.XpReward = dto.XpReward;
        lesson.OrderIndex = dto.OrderIndex;

        if (!string.IsNullOrWhiteSpace(dto.Status))
        {
            var requestedStatus = dto.Status.Trim().ToUpperInvariant();
            if (requestedStatus == "PUBLISHED" && !string.Equals(lesson.Status, "PUBLISHED", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Không thể thay đổi trạng thái thành PUBLISHED thông qua API cập nhật thông thường. Bài học bắt buộc phải trải qua API kiểm duyệt chính thức (/review hoặc /status) và thỏa mãn Release Gate.");
            }
            if (requestedStatus == "DRAFT" || requestedStatus == "PENDING_REVIEW" || requestedStatus == "ARCHIVED")
            {
                lesson.Status = requestedStatus;
            }
        }

        lesson.UpdatedByUserId = currentUserId;
        if (dto.DialogueJson != null)
        {
            lesson.DialogueJson = dto.DialogueJson;
        }
        if (dto.ListeningJson != null)
        {
            lesson.ListeningJson = dto.ListeningJson;
        }

        if (dto.LinkedVocabularyIds != null)
        {
            var existingVocabs = await _dbContext.Vocabularies
                .Where(v => v.LessonId == id)
                .ToListAsync(cancellationToken);
            foreach (var v in existingVocabs)
            {
                if (!dto.LinkedVocabularyIds.Contains(v.Id))
                {
                    v.LessonId = null;
                }
            }

            var toLinkVocabs = await _dbContext.Vocabularies
                .Where(v => dto.LinkedVocabularyIds.Contains(v.Id))
                .ToListAsync(cancellationToken);
            foreach (var v in toLinkVocabs)
            {
                v.LessonId = id;
            }
        }

        if (dto.LinkedGrammarPointIds != null)
        {
            var existingGrammars = await _dbContext.GrammarPoints
                .Where(g => g.LessonId == id)
                .ToListAsync(cancellationToken);
            foreach (var g in existingGrammars)
            {
                if (!dto.LinkedGrammarPointIds.Contains(g.Id))
                {
                    g.LessonId = null;
                }
            }

            var toLinkGrammars = await _dbContext.GrammarPoints
                .Where(g => dto.LinkedGrammarPointIds.Contains(g.Id))
                .ToListAsync(cancellationToken);
            foreach (var g in toLinkGrammars)
            {
                g.LessonId = id;
            }
        }

        if (dto.LinkedExerciseIds != null)
        {
            var existingExercises = await _dbContext.Exercises
                .Where(e => e.LessonId == id)
                .ToListAsync(cancellationToken);
            foreach (var e in existingExercises)
            {
                if (!dto.LinkedExerciseIds.Contains(e.Id))
                {
                    e.LessonId = null;
                }
            }

            var toLinkExercises = await _dbContext.Exercises
                .Where(e => dto.LinkedExerciseIds.Contains(e.Id))
                .ToListAsync(cancellationToken);
            foreach (var e in toLinkExercises)
            {
                e.LessonId = id;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new LessonDto
        {
            Id = lesson.Id,
            CourseId = lesson.CourseId,
            UnitId = lesson.UnitId,
            CourseTitle = lesson.Course?.Title ?? string.Empty,
            LessonNumber = lesson.LessonNumber,
            TitleZh = lesson.TitleZh,
            TitleVi = lesson.TitleVi,
            Pinyin = lesson.Pinyin,
            Summary = lesson.Summary,
            DialogueJson = lesson.DialogueJson,
            ListeningJson = lesson.ListeningJson,
            DurationMinutes = lesson.DurationMinutes,
            XpReward = lesson.XpReward,
            OrderIndex = lesson.OrderIndex,
            Status = lesson.Status,
            CreatedAt = lesson.CreatedAt,
            UpdatedAt = lesson.UpdatedAt
        };
    }

    public async Task<LessonReleaseReadinessDto?> GetLessonReleaseReadinessAsync(Guid lessonId, CancellationToken cancellationToken = default)
    {
        var lesson = await _dbContext.Lessons.Include(l => l.Course).FirstOrDefaultAsync(l => l.Id == lessonId, cancellationToken);
        if (lesson == null) return null;

        var vocabCount = await _dbContext.Vocabularies.CountAsync(v => v.LessonId == lessonId, cancellationToken);
        var grammarCount = await _dbContext.GrammarPoints.CountAsync(g => g.LessonId == lessonId, cancellationToken);
        var exerciseCount = await _dbContext.Exercises.CountAsync(e => e.LessonId == lessonId, cancellationToken);

        var blockerReasons = new List<string>();

        // Gate 1: Dialogue
        bool dialogueValid = false;
        if (string.IsNullOrWhiteSpace(lesson.DialogueJson))
        {
            blockerReasons.Add("Kịch bản hội thoại (DialogueJson) bị thiếu.");
        }
        else
        {
            try
            {
                using var doc = JsonDocument.Parse(lesson.DialogueJson);
                var root = doc.RootElement;
                if (root.TryGetProperty("lines", out var linesElem) && linesElem.GetArrayLength() >= 2)
                {
                    bool hasLeakedHanzi = false;
                    foreach (var line in linesElem.EnumerateArray())
                    {
                        var py = line.TryGetProperty("pinyin", out var pProp) ? pProp.GetString() ?? "" : "";
                        var vi = line.TryGetProperty("meaningVi", out var vProp) ? vProp.GetString() ?? "" : "";
                        if (Regex.IsMatch(py, @"[\u4e00-\u9fff]") || Regex.IsMatch(vi, @"[\u4e00-\u9fff]"))
                        {
                            hasLeakedHanzi = true;
                            break;
                        }
                    }
                    if (hasLeakedHanzi)
                    {
                        blockerReasons.Add("Hội thoại còn chứa ký tự Hán chưa chuyển đổi trong Pinyin hoặc Tiếng Việt.");
                    }
                    else
                    {
                        dialogueValid = true;
                    }
                }
                else
                {
                    blockerReasons.Add("Hội thoại không đủ số lượt thoại tối thiểu (cần >= 2 lượt thoại).");
                }
            }
            catch (Exception)
            {
                blockerReasons.Add("Cú pháp JSON của hội thoại không hợp lệ.");
            }
        }

        // Gate 2: Listening
        bool listeningValid = false;
        if (string.IsNullOrWhiteSpace(lesson.ListeningJson))
        {
            blockerReasons.Add("Kịch bản luyện nghe (ListeningJson) bị thiếu.");
        }
        else
        {
            try
            {
                using var doc = JsonDocument.Parse(lesson.ListeningJson);
                var root = doc.RootElement;
                if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() >= 1)
                {
                    bool hasLeakedHanzi = false;
                    foreach (var q in root.EnumerateArray())
                    {
                        var py = q.TryGetProperty("transcriptPinyin", out var pProp) ? pProp.GetString() ?? "" : "";
                        var vi = q.TryGetProperty("transcriptVi", out var vProp) ? vProp.GetString() ?? "" : "";
                        if (Regex.IsMatch(py, @"[\u4e00-\u9fff]") || Regex.IsMatch(vi, @"[\u4e00-\u9fff]"))
                        {
                            hasLeakedHanzi = true;
                            break;
                        }
                    }
                    if (hasLeakedHanzi)
                    {
                        blockerReasons.Add("Kịch bản luyện nghe còn chứa ký tự Hán chưa chuyển đổi trong Pinyin hoặc Tiếng Việt.");
                    }
                    else
                    {
                        listeningValid = true;
                    }
                }
                else
                {
                    blockerReasons.Add("Kịch bản luyện nghe phải chứa ít nhất 1 bài nghe hiểu.");
                }
            }
            catch (Exception)
            {
                blockerReasons.Add("Cú pháp JSON của kịch bản luyện nghe không hợp lệ.");
            }
        }

        // Gate 3: Vocab
        if (vocabCount < 5)
        {
            blockerReasons.Add($"Số lượng từ vựng chưa đạt chuẩn tối thiểu (hiện có: {vocabCount}, yêu cầu >= 5).");
        }

        // Gate 4: Grammar
        if (grammarCount < 1)
        {
            blockerReasons.Add("Bài học chưa được liên kết điểm ngữ pháp nào.");
        }

        // Gate 5: Exercises
        if (exerciseCount < 1)
        {
            blockerReasons.Add("Bài học chưa có bài tập tương tác kiểm tra đầu ra.");
        }

        bool audioExists = dialogueValid && listeningValid;
        bool isReady = blockerReasons.Count == 0;

        return new LessonReleaseReadinessDto
        {
            LessonId = lesson.Id,
            LessonNumber = lesson.LessonNumber,
            TitleZh = lesson.TitleZh,
            TitleVi = lesson.TitleVi,
            CurrentStatus = lesson.Status,
            IsReadyForPublish = isReady,
            DialogueValid = dialogueValid,
            ListeningValid = listeningValid,
            VocabCount = vocabCount,
            GrammarCount = grammarCount,
            ExerciseCount = exerciseCount,
            AudioFilesExist = audioExists,
            HumanReviewCompleted = lesson.ReviewedByUserId.HasValue && lesson.ReviewedAt.HasValue,
            BlockerReasons = blockerReasons
        };
    }

    public async Task<LessonDto?> UpdateLessonStatusAsync(Guid id, string status, Guid? currentUserId = null, CancellationToken cancellationToken = default)
    {
        return await ReviewLessonAsync(id, new ReviewContentDto { Status = status }, currentUserId, cancellationToken);
    }

    public async Task<LessonDto?> ReviewLessonAsync(Guid id, ReviewContentDto dto, Guid? currentUserId = null, CancellationToken cancellationToken = default)
    {
        var validStatuses = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "DRAFT", "PENDING_REVIEW", "PUBLISHED", "ARCHIVED" };
        var targetStatus = dto.Status.Trim().ToUpperInvariant();
        if (!validStatuses.Contains(targetStatus))
        {
            throw new ArgumentException($"Trạng thái '{dto.Status}' không hợp lệ.");
        }

        var lesson = await _dbContext.Lessons.Include(l => l.Course).FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
        if (lesson == null) return null;

        if (targetStatus == "PUBLISHED")
        {
            if (!lesson.Status.Equals("PENDING_REVIEW", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Quy trình xuất bản yêu cầu bài học phải trải qua bước kiểm duyệt (PENDING_REVIEW) và có sự phê duyệt của người có thẩm quyền trước khi xuất bản (PUBLISHED). Không thể chuyển thẳng từ DRAFT sang PUBLISHED.");
            }

            if (!currentUserId.HasValue || currentUserId.Value == Guid.Empty)
            {
                throw new InvalidOperationException("Yêu cầu thông tin định danh của người thẩm định (ReviewedByUserId) để hoàn tất phê duyệt xuất bản.");
            }

            if (lesson.UpdatedByUserId.HasValue && lesson.UpdatedByUserId.Value == currentUserId.Value)
            {
                throw new InvalidOperationException("Vi phạm nguyên tắc phân tách nhiệm vụ (Segregation of Duties): Người tạo hoặc gửi yêu cầu kiểm duyệt bài học không được phép tự phê duyệt xuất bản bài học của chính mình.");
            }

            var readiness = await GetLessonReleaseReadinessAsync(id, cancellationToken);
            if (readiness != null && !readiness.IsReadyForPublish)
            {
                throw new InvalidOperationException($"Không thể xuất bản bài học: {string.Join("; ", readiness.BlockerReasons)}");
            }

            lesson.ReviewedByUserId = currentUserId.Value;
            lesson.ReviewedAt = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(dto.ReviewNotes))
            {
                lesson.ReviewNotes = dto.ReviewNotes.Trim();
            }
        }
        else if (targetStatus == "PENDING_REVIEW")
        {
            lesson.UpdatedByUserId = currentUserId;
            if (!string.IsNullOrWhiteSpace(dto.ReviewNotes))
            {
                lesson.ReviewNotes = dto.ReviewNotes.Trim();
            }
        }
        else if (targetStatus == "DRAFT")
        {
            lesson.UpdatedByUserId = currentUserId;
            if (!string.IsNullOrWhiteSpace(dto.ReviewNotes))
            {
                lesson.ReviewNotes = dto.ReviewNotes.Trim();
            }
        }

        lesson.Status = targetStatus;
        lesson.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new LessonDto
        {
            Id = lesson.Id,
            CourseId = lesson.CourseId,
            CourseTitle = lesson.Course?.Title ?? string.Empty,
            LessonNumber = lesson.LessonNumber,
            TitleZh = lesson.TitleZh,
            TitleVi = lesson.TitleVi,
            Pinyin = lesson.Pinyin,
            Summary = lesson.Summary,
            DialogueJson = lesson.DialogueJson,
            ListeningJson = lesson.ListeningJson,
            DurationMinutes = lesson.DurationMinutes,
            XpReward = lesson.XpReward,
            OrderIndex = lesson.OrderIndex,
            Status = lesson.Status,
            UpdatedByUserId = lesson.UpdatedByUserId,
            ReviewedByUserId = lesson.ReviewedByUserId,
            ReviewedAt = lesson.ReviewedAt,
            ReviewNotes = lesson.ReviewNotes,
            CreatedAt = lesson.CreatedAt,
            UpdatedAt = lesson.UpdatedAt
        };
    }

    public async Task<bool> DeleteLessonAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var lesson = await _dbContext.Lessons.FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
        if (lesson == null) return false;

        _dbContext.Lessons.Remove(lesson);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    #endregion

    #region Vocabulary

    public async Task<PagedResponse<VocabularyDto>> GetVocabulariesAsync(int? hskLevel = null, Guid? lessonId = null, string? search = null, string? status = null, int page = 1, int pageSize = 20, bool publishedOnly = false, bool? missingMeaningVi = null, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Vocabularies.AsNoTracking().AsQueryable();

        if (publishedOnly)
        {
            query = query.Where(v => v.Status == "PUBLISHED");
            if (!string.IsNullOrWhiteSpace(status) && status != "ALL" && status != "PUBLISHED")
            {
                query = query.Where(v => false);
            }
        }
        else if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
        {
            query = query.Where(v => v.Status == status);
        }

        if (missingMeaningVi.HasValue)
        {
            if (missingMeaningVi.Value)
            {
                query = query.Where(v => string.IsNullOrWhiteSpace(v.MeaningVi) || v.MeaningVi == "");
            }
            else
            {
                query = query.Where(v => !string.IsNullOrWhiteSpace(v.MeaningVi));
            }
        }

        if (hskLevel.HasValue && hskLevel.Value > 0)
        {
            query = query.Where(v => v.HskLevel == hskLevel.Value);
        }

        if (lessonId.HasValue && lessonId.Value != Guid.Empty)
        {
            query = query.Where(v => v.LessonId == lessonId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(v => v.Hanzi.ToLower().Contains(q) || v.Pinyin.ToLower().Contains(q) || (v.MeaningVi != null && v.MeaningVi.ToLower().Contains(q)));
        }

        var totalItems = await query.CountAsync(cancellationToken);
        var pageClamped = Math.Max(1, page);
        var pageSizeClamped = Math.Clamp(pageSize, 1, 500);

        var items = await query
            .OrderBy(v => v.HskLevel)
            .ThenBy(v => v.Hanzi)
            .Skip((pageClamped - 1) * pageSizeClamped)
            .Take(pageSizeClamped)
            .Select(v => new VocabularyDto
            {
                Id = v.Id,
                HskLevel = v.HskLevel,
                Hanzi = v.Hanzi,
                Traditional = v.Traditional,
                Pinyin = v.Pinyin,
                MeaningVi = v.MeaningVi ?? "",
                SuggestedMeaningVi = publishedOnly ? null : v.SuggestedMeaningVi,
                MeaningEn = v.MeaningEn,
                PartOfSpeech = v.PartOfSpeech,
                AudioUrl = v.AudioUrl,
                ExamplesJson = v.ExamplesJson,
                Status = v.Status,
                SourceDataset = publishedOnly ? null : v.SourceDataset,
                SourceEntryId = publishedOnly ? null : v.SourceEntryId,
                SourceId = publishedOnly ? null : (v.SourceId ?? v.SourceEntryId),
                Entry = v.Entry,
                Homograph = v.Homograph,
                LevelLabel = v.LevelLabel,
                SourcePdfPage = publishedOnly ? null : v.SourcePdfPage,
                LessonId = v.LessonId,
                UpdatedByUserId = publishedOnly ? null : v.UpdatedByUserId,
                ReviewedByUserId = publishedOnly ? null : v.ReviewedByUserId,
                ReviewedAt = publishedOnly ? null : v.ReviewedAt,
                ReviewNotes = publishedOnly ? null : v.ReviewNotes,
                CreatedAt = v.CreatedAt,
                UpdatedAt = v.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResponse<VocabularyDto>(items, totalItems, pageClamped, pageSizeClamped);
    }

    public async Task<VocabularyDto?> GetVocabularyByIdAsync(Guid id, bool publishedOnly = false, CancellationToken cancellationToken = default)
    {
        var v = await _dbContext.Vocabularies.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (v == null || (publishedOnly && v.Status != "PUBLISHED")) return null;

        return new VocabularyDto
        {
            Id = v.Id,
            HskLevel = v.HskLevel,
            Hanzi = v.Hanzi,
            Traditional = v.Traditional,
            Pinyin = v.Pinyin,
            MeaningVi = v.MeaningVi ?? "",
            SuggestedMeaningVi = publishedOnly ? null : v.SuggestedMeaningVi,
            MeaningEn = v.MeaningEn,
            PartOfSpeech = v.PartOfSpeech,
            AudioUrl = v.AudioUrl,
            ExamplesJson = v.ExamplesJson,
            Status = v.Status,
            SourceDataset = publishedOnly ? null : v.SourceDataset,
            SourceEntryId = publishedOnly ? null : v.SourceEntryId,
            SourceId = publishedOnly ? null : (v.SourceId ?? v.SourceEntryId),
            Entry = v.Entry,
            Homograph = v.Homograph,
            LevelLabel = v.LevelLabel,
            SourcePdfPage = publishedOnly ? null : v.SourcePdfPage,
            LessonId = v.LessonId,
            UpdatedByUserId = publishedOnly ? null : v.UpdatedByUserId,
            ReviewedByUserId = publishedOnly ? null : v.ReviewedByUserId,
            ReviewedAt = publishedOnly ? null : v.ReviewedAt,
            ReviewNotes = publishedOnly ? null : v.ReviewNotes,
            CreatedAt = v.CreatedAt,
            UpdatedAt = v.UpdatedAt
        };
    }

    public async Task<VocabularyDto> CreateVocabularyAsync(CreateVocabularyDto dto, CancellationToken cancellationToken = default)
    {
        if (dto.HskLevel < 1 || dto.HskLevel > 6)
        {
            throw new ArgumentException("Cấp độ HSK phải từ 1 đến 6.");
        }

        if ((dto.Status == "PUBLISHED" || dto.Status == "PENDING_REVIEW") && string.IsNullOrWhiteSpace(dto.MeaningVi))
        {
            throw new ArgumentException("Từ vựng không thể chuyển sang Chờ duyệt hoặc Xuất bản khi chưa có nghĩa tiếng Việt hợp lệ.");
        }

        var v = new VocabularyEntity
        {
            HskLevel = dto.HskLevel,
            Hanzi = dto.Hanzi.Trim(),
            Traditional = dto.Traditional?.Trim(),
            Pinyin = dto.Pinyin.Trim(),
            MeaningVi = dto.MeaningVi?.Trim() ?? "",
            MeaningEn = dto.MeaningEn?.Trim(),
            PartOfSpeech = dto.PartOfSpeech?.Trim(),
            AudioUrl = dto.AudioUrl?.Trim(),
            ExamplesJson = dto.ExamplesJson,
            Status = dto.Status,
            SourceDataset = dto.SourceDataset?.Trim(),
            SourceEntryId = dto.SourceEntryId?.Trim() ?? dto.SourceId?.Trim(),
            SourceId = dto.SourceId?.Trim() ?? dto.SourceEntryId?.Trim(),
            Entry = dto.Entry?.Trim(),
            Homograph = dto.Homograph?.Trim(),
            LevelLabel = dto.LevelLabel?.Trim(),
            SourcePdfPage = dto.SourcePdfPage,
            LessonId = dto.LessonId
        };

        _dbContext.Vocabularies.Add(v);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new VocabularyDto
        {
            Id = v.Id,
            HskLevel = v.HskLevel,
            Hanzi = v.Hanzi,
            Traditional = v.Traditional,
            Pinyin = v.Pinyin,
            MeaningVi = v.MeaningVi,
            MeaningEn = v.MeaningEn,
            PartOfSpeech = v.PartOfSpeech,
            AudioUrl = v.AudioUrl,
            ExamplesJson = v.ExamplesJson,
            Status = v.Status,
            SourceDataset = v.SourceDataset,
            SourceEntryId = v.SourceEntryId,
            SourceId = v.SourceId,
            Entry = v.Entry,
            Homograph = v.Homograph,
            LevelLabel = v.LevelLabel,
            SourcePdfPage = v.SourcePdfPage,
            LessonId = v.LessonId,
            CreatedAt = v.CreatedAt,
            UpdatedAt = v.UpdatedAt
        };
    }

    public async Task<VocabularyDto?> UpdateVocabularyAsync(Guid id, UpdateVocabularyDto dto, CancellationToken cancellationToken = default)
    {
        var v = await _dbContext.Vocabularies.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (v == null) return null;

        if (dto.HskLevel < 1 || dto.HskLevel > 6)
        {
            throw new ArgumentException("Cấp độ HSK phải từ 1 đến 6.");
        }

        if ((dto.Status == "PUBLISHED" || dto.Status == "PENDING_REVIEW") && string.IsNullOrWhiteSpace(dto.MeaningVi))
        {
            throw new ArgumentException("Từ vựng chỉ có thể chuyển sang kiểm duyệt hoặc xuất bản khi đã có nghĩa tiếng Việt hợp lệ.");
        }

        v.HskLevel = dto.HskLevel;
        v.Hanzi = dto.Hanzi.Trim();
        v.Traditional = dto.Traditional?.Trim();
        v.Pinyin = dto.Pinyin.Trim();
        v.MeaningVi = dto.MeaningVi?.Trim() ?? "";
        if (dto.SuggestedMeaningVi != null) v.SuggestedMeaningVi = dto.SuggestedMeaningVi.Trim();
        v.MeaningEn = dto.MeaningEn?.Trim();
        v.PartOfSpeech = dto.PartOfSpeech?.Trim();
        v.AudioUrl = dto.AudioUrl?.Trim();
        v.ExamplesJson = dto.ExamplesJson;
        v.Status = dto.Status;
        if (!string.IsNullOrWhiteSpace(dto.ReviewNotes)) v.ReviewNotes = dto.ReviewNotes.Trim();
        if (!string.IsNullOrWhiteSpace(dto.SourceDataset)) v.SourceDataset = dto.SourceDataset.Trim();
        if (!string.IsNullOrWhiteSpace(dto.SourceEntryId)) v.SourceEntryId = dto.SourceEntryId.Trim();
        if (!string.IsNullOrWhiteSpace(dto.SourceId)) v.SourceId = dto.SourceId.Trim();
        if (string.IsNullOrWhiteSpace(v.SourceEntryId) && !string.IsNullOrWhiteSpace(v.SourceId)) v.SourceEntryId = v.SourceId;
        if (string.IsNullOrWhiteSpace(v.SourceId) && !string.IsNullOrWhiteSpace(v.SourceEntryId)) v.SourceId = v.SourceEntryId;
        if (!string.IsNullOrWhiteSpace(dto.Entry)) v.Entry = dto.Entry.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Homograph)) v.Homograph = dto.Homograph.Trim();
        if (!string.IsNullOrWhiteSpace(dto.LevelLabel)) v.LevelLabel = dto.LevelLabel.Trim();
        if (dto.SourcePdfPage.HasValue) v.SourcePdfPage = dto.SourcePdfPage;
        v.LessonId = dto.LessonId;
        v.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new VocabularyDto
        {
            Id = v.Id,
            HskLevel = v.HskLevel,
            Hanzi = v.Hanzi,
            Traditional = v.Traditional,
            Pinyin = v.Pinyin,
            MeaningVi = v.MeaningVi,
            SuggestedMeaningVi = v.SuggestedMeaningVi,
            MeaningEn = v.MeaningEn,
            PartOfSpeech = v.PartOfSpeech,
            AudioUrl = v.AudioUrl,
            ExamplesJson = v.ExamplesJson,
            Status = v.Status,
            SourceDataset = v.SourceDataset,
            SourceEntryId = v.SourceEntryId,
            SourceId = v.SourceId,
            Entry = v.Entry,
            Homograph = v.Homograph,
            LevelLabel = v.LevelLabel,
            SourcePdfPage = v.SourcePdfPage,
            LessonId = v.LessonId,
            UpdatedByUserId = v.UpdatedByUserId,
            ReviewedByUserId = v.ReviewedByUserId,
            ReviewedAt = v.ReviewedAt,
            ReviewNotes = v.ReviewNotes,
            CreatedAt = v.CreatedAt,
            UpdatedAt = v.UpdatedAt
        };
    }

    public async Task<VocabularyImportResultDto> ImportVocabulariesFromCsvAsync(Stream csvStream, bool dryRun = false, CancellationToken cancellationToken = default)
    {
        using var reader = new StreamReader(csvStream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
        var csvConfig = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            TrimOptions = TrimOptions.Trim,
            BadDataFound = null,
            MissingFieldFound = null,
            HeaderValidated = null
        };

        using var csv = new CsvReader(reader, csvConfig);

        const string datasetName = "HSK 3.0";

        // Fetch existing keys to prevent duplicates
        var existingSourceEntriesList = await _dbContext.Vocabularies
            .AsNoTracking()
            .Where(v => v.SourceDataset != null && v.SourceEntryId != null)
            .Select(v => $"{v.SourceDataset}|{v.SourceEntryId}")
            .ToListAsync(cancellationToken);
        var existingSourceEntries = new HashSet<string>(existingSourceEntriesList, StringComparer.OrdinalIgnoreCase);

        var existingSourceIdsList = await _dbContext.Vocabularies
            .AsNoTracking()
            .Where(v => v.SourceId != null && v.SourceId != "")
            .Select(v => v.SourceId!)
            .ToListAsync(cancellationToken);
        var existingSourceIds = new HashSet<string>(existingSourceIdsList, StringComparer.OrdinalIgnoreCase);

        var existingLookup = await _dbContext.Vocabularies
            .AsNoTracking()
            .Select(v => new { v.HskLevel, v.Hanzi, v.Pinyin, Homograph = v.Homograph ?? "" })
            .ToListAsync(cancellationToken);

        var existingLookupSet = existingLookup
            .Select(x => $"{x.HskLevel}|{x.Hanzi}|{x.Pinyin}|{x.Homograph}")
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var seenInCurrentFile = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        int rowNumber = 1; // Row 1 is header
        int totalRows = 0;
        int successCount = 0;
        int skippedDuplicateCount = 0;
        var errors = new List<VocabularyImportRowError>();
        var previewItems = new List<VocabularyImportPreviewItem>();
        var toInsert = new List<VocabularyEntity>();

        while (await csv.ReadAsync())
        {
            rowNumber++;
            totalRows++;

            Hsk3CsvRow? row;
            try
            {
                row = csv.GetRecord<Hsk3CsvRow>();
            }
            catch (Exception ex)
            {
                errors.Add(new VocabularyImportRowError
                {
                    RowNumber = rowNumber,
                    Reason = $"Lỗi định dạng dòng CSV: {ex.Message}"
                });
                continue;
            }

            if (row == null)
            {
                errors.Add(new VocabularyImportRowError
                {
                    RowNumber = rowNumber,
                    Reason = "Dòng trống hoặc không thể phân tích."
                });
                continue;
            }

            // Validate Hanzi
            if (string.IsNullOrWhiteSpace(row.Hanzi))
            {
                errors.Add(new VocabularyImportRowError
                {
                    RowNumber = rowNumber,
                    SourceDataset = datasetName,
                    SourceEntryId = row.Id,
                    SourceId = row.Id,
                    Hanzi = row.Hanzi,
                    Reason = "Chữ Hán không được để trống."
                });
                continue;
            }

            // Validate Pinyin
            if (string.IsNullOrWhiteSpace(row.Pinyin))
            {
                errors.Add(new VocabularyImportRowError
                {
                    RowNumber = rowNumber,
                    SourceDataset = datasetName,
                    SourceEntryId = row.Id,
                    SourceId = row.Id,
                    Hanzi = row.Hanzi,
                    Reason = "Pinyin không được để trống."
                });
                continue;
            }

            // Validate & parse Level: ONLY HSK 1-6 allowed.
            // Backend rejects file with records outside 1-6.
            string rawLevel = row.Level?.Trim() ?? "";
            if (!int.TryParse(rawLevel, out var parsedLevel) || parsedLevel < 1 || parsedLevel > 6)
            {
                throw new ArgumentException($"Tệp tin bị từ chối: chứa cấp độ HSK không hợp lệ hoặc không được hỗ trợ ('{rawLevel}' tại dòng {rowNumber}). ZhongWenHub chỉ hỗ trợ chuẩn HSK 3.0 từ cấp 1 đến cấp 6.");
            }

            int hskLevel = parsedLevel;

            int? sourcePdfPage = null;
            if (int.TryParse(row.SourcePdfPage, out var p))
            {
                sourcePdfPage = p;
            }

            string sourceEntryId = row.Id?.Trim() ?? "";
            string sourceKey = !string.IsNullOrEmpty(sourceEntryId) ? $"{datasetName}|{sourceEntryId}" : "";
            string homograph = row.Homograph?.Trim() ?? "";
            string naturalKey = $"{hskLevel}|{row.Hanzi.Trim()}|{row.Pinyin.Trim()}|{homograph}";
            string levelLabel = string.IsNullOrWhiteSpace(row.LevelLabel)
                ? hskLevel.ToString()
                : row.LevelLabel.Trim();

            // Check duplicate by SourceDataset & SourceEntryId AND natural compound key (never Hanzi alone)
            bool isDuplicate = false;
            if (!string.IsNullOrEmpty(sourceKey) && existingSourceEntries.Contains(sourceKey))
            {
                isDuplicate = true;
            }
            else if (!string.IsNullOrEmpty(sourceEntryId) && existingSourceIds.Contains(sourceEntryId))
            {
                isDuplicate = true;
            }
            else if (existingLookupSet.Contains(naturalKey))
            {
                isDuplicate = true;
            }
            else if (!string.IsNullOrEmpty(sourceKey) && seenInCurrentFile.Contains(sourceKey))
            {
                isDuplicate = true;
            }
            else if (seenInCurrentFile.Contains(naturalKey))
            {
                isDuplicate = true;
            }

            if (isDuplicate)
            {
                skippedDuplicateCount++;
                if (previewItems.Count < 50)
                {
                    previewItems.Add(new VocabularyImportPreviewItem
                    {
                        RowNumber = rowNumber,
                        SourceDataset = datasetName,
                        SourceEntryId = sourceEntryId,
                        SourceId = sourceEntryId,
                        HskLevel = hskLevel,
                        LevelLabel = levelLabel,
                        Hanzi = row.Hanzi.Trim(),
                        Pinyin = row.Pinyin.Trim(),
                        PartOfSpeech = row.PartOfSpeech?.Trim(),
                        Entry = row.Entry?.Trim(),
                        Homograph = homograph,
                        SourcePdfPage = sourcePdfPage,
                        IsDuplicate = true,
                        Status = "DRAFT"
                    });
                }
                continue;
            }

            if (!string.IsNullOrEmpty(sourceKey)) seenInCurrentFile.Add(sourceKey);
            seenInCurrentFile.Add(naturalKey);

            successCount++;

            if (previewItems.Count < 50)
            {
                previewItems.Add(new VocabularyImportPreviewItem
                {
                    RowNumber = rowNumber,
                    SourceDataset = datasetName,
                    SourceEntryId = sourceEntryId,
                    SourceId = sourceEntryId,
                    HskLevel = hskLevel,
                    LevelLabel = levelLabel,
                    Hanzi = row.Hanzi.Trim(),
                    Pinyin = row.Pinyin.Trim(),
                    PartOfSpeech = row.PartOfSpeech?.Trim(),
                    Entry = row.Entry?.Trim(),
                    Homograph = homograph,
                    SourcePdfPage = sourcePdfPage,
                    IsDuplicate = false,
                    Status = "DRAFT"
                });
            }

            if (!dryRun)
            {
                toInsert.Add(new VocabularyEntity
                {
                    HskLevel = hskLevel,
                    Hanzi = row.Hanzi.Trim(),
                    Pinyin = row.Pinyin.Trim(),
                    MeaningVi = "", // MeaningVi empty when DRAFT - NO fake Vietnamese meanings!
                    PartOfSpeech = row.PartOfSpeech?.Trim(),
                    Entry = row.Entry?.Trim(),
                    Homograph = homograph,
                    LevelLabel = levelLabel,
                    SourcePdfPage = sourcePdfPage,
                    SourceDataset = datasetName,
                    SourceEntryId = string.IsNullOrEmpty(sourceEntryId) ? null : sourceEntryId,
                    SourceId = string.IsNullOrEmpty(sourceEntryId) ? null : sourceEntryId,
                    Status = "DRAFT",
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        // Batch save to SQL Server
        if (!dryRun && toInsert.Count > 0)
        {
            const int batchSize = 500;
            for (int i = 0; i < toInsert.Count; i += batchSize)
            {
                var batch = toInsert.Skip(i).Take(batchSize).ToList();
                await _dbContext.Vocabularies.AddRangeAsync(batch, cancellationToken);
                await _dbContext.SaveChangesAsync(cancellationToken);
            }
        }

        return new VocabularyImportResultDto
        {
            DryRun = dryRun,
            TotalRows = totalRows,
            SuccessCount = successCount,
            SkippedDuplicateCount = skippedDuplicateCount,
            ErrorCount = errors.Count,
            Errors = errors,
            PreviewItems = previewItems
        };
    }

    public Task<byte[]> GenerateVocabularyExcelTemplateAsync(CancellationToken cancellationToken = default)
    {
        using var workbook = new XLWorkbook();

        // ----------------------------------------------------
        // Sheet 1: DuLieu
        // ----------------------------------------------------
        var sheetData = workbook.Worksheets.Add("DuLieu");
        sheetData.TabColor = XLColor.FromHtml("#E60012"); // Viettel Red

        // Columns definition
        string[] headers =
        {
            "SourceEntryId",
            "HskLevel",
            "Hanzi",
            "Pinyin",
            "MeaningVi",
            "MeaningEn",
            "PartOfSpeech",
            "ExampleHanzi",
            "ExamplePinyin",
            "ExampleMeaningVi"
        };

        for (int col = 0; col < headers.Length; col++)
        {
            var cell = sheetData.Cell(1, col + 1);
            cell.Value = headers[col];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#991B1B"); // Dark Red
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        }
        sheetData.Row(1).Height = 28;

        // Data validation for HskLevel (Column B: 1-6)
        var levelValidation = sheetData.Range("B2:B5000").CreateDataValidation();
        levelValidation.WholeNumber.Between(1, 6);
        levelValidation.ErrorTitle = "Cấp độ HSK không hợp lệ";
        levelValidation.ErrorMessage = "Chỉ cho phép nhập cấp độ HSK từ 1 đến 6 theo chuẩn HSK 3.0. Cấp 7-9 không được hỗ trợ.";
        levelValidation.ShowErrorMessage = true;
        levelValidation.InputTitle = "Cấp độ HSK 3.0";
        levelValidation.InputMessage = "Nhập số nguyên từ 1 đến 6.";
        levelValidation.ShowInputMessage = true;

        // 3 sample rows (clearly labeled as examples)
        object[,] sampleRows =
        {
            {
                "HSK1-EX01",
                1,
                "你好",
                "nǐ hǎo",
                "Xin chào (DÒNG VÍ DỤ - HÃY XÓA TRƯỚC KHI IMPORT)",
                "hello",
                "Thán từ",
                "你好！很高兴认识你。",
                "Nǐ hǎo! Hěn gāoxìng rènshí nǐ.",
                "Xin chào! Rất vui được gặp bạn."
            },
            {
                "HSK1-EX02",
                1,
                "谢谢",
                "xièxie",
                "Cảm ơn (DÒNG VÍ DỤ - HÃY XÓA TRƯỚC KHI IMPORT)",
                "thank you",
                "Động từ",
                "非常感谢你的帮助。",
                "Fēicháng gǎnxiè nǐ de bāngzhù.",
                "Rất cảm ơn sự giúp đỡ của bạn."
            },
            {
                "HSK2-EX01",
                2,
                "帮助",
                "bāngzhù",
                "Giúp đỡ (DÒNG VÍ DỤ - HÃY XÓA TRƯỚC KHI IMPORT)",
                "help",
                "Động từ",
                "你能帮助我吗？",
                "Nǐ néng bāngzhù wǒ ma?",
                "Bạn có thể giúp tôi không?"
            }
        };

        for (int r = 0; r < 3; r++)
        {
            int rowIdx = r + 2;
            for (int c = 0; c < headers.Length; c++)
            {
                var cell = sheetData.Cell(rowIdx, c + 1);
                var val = sampleRows[r, c];
                if (val is int intVal) cell.Value = intVal;
                else cell.Value = val?.ToString() ?? "";

                cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#FEF3C7"); // Light amber for examples
                cell.Style.Font.Italic = true;
            }
            sheetData.Row(rowIdx).Height = 22;
        }

        sheetData.Columns().AdjustToContents(15, 60);

        // ----------------------------------------------------
        // Sheet 2: HuongDan
        // ----------------------------------------------------
        var sheetGuide = workbook.Worksheets.Add("HuongDan");
        sheetGuide.TabColor = XLColor.FromHtml("#2563EB");

        sheetGuide.Cell("A1").Value = "HƯỚNG DẪN ĐIỀN DỮ LIỆU IMPORT TỪ VỰNG HSK 3.0";
        sheetGuide.Cell("A1").Style.Font.Bold = true;
        sheetGuide.Cell("A1").Style.Font.FontSize = 14;
        sheetGuide.Cell("A1").Style.Font.FontColor = XLColor.FromHtml("#1E293B");

        sheetGuide.Cell("A2").Value = "Hệ thống ZhongWenHub - Hỗ trợ HSK 3.0 (Cấp 1 đến Cấp 6). Không hỗ trợ HSK 7-9.";
        sheetGuide.Cell("A2").Style.Font.Italic = true;
        sheetGuide.Cell("A2").Style.Font.FontColor = XLColor.FromHtml("#64748B");

        string[,] guideColumns =
        {
            { "SourceEntryId", "Tùy chọn", "Mã định danh nguồn từ vựng (ví dụ: HSK1-001). Dùng để chống trùng lặp khi import lại." },
            { "HskLevel", "BẮT BUỘC", "Cấp độ HSK từ 1 đến 6. Cấp 7-9 không được hỗ trợ và hệ thống sẽ từ chối import." },
            { "Hanzi", "BẮT BUỘC", "Chữ Hán giản thể chuẩn (không được để trống)." },
            { "Pinyin", "BẮT BUỘC", "Phiên âm Pinyin có dấu thanh điệu chuẩn (ví dụ: nǐ hǎo, xièxie)." },
            { "MeaningVi", "Tùy chọn", "Nghĩa tiếng Việt. Có thể để trống nếu lưu ở dạng DRAFT (Bản nháp) để kiểm duyệt sau." },
            { "MeaningEn", "Tùy chọn", "Nghĩa tiếng Anh tham khảo." },
            { "PartOfSpeech", "Tùy chọn", "Từ loại (Danh từ, Động từ, Tính từ, Phó từ, Đại từ, Thán từ...)." },
            { "ExampleHanzi", "Tùy chọn", "Câu ví dụ minh họa bằng chữ Hán." },
            { "ExamplePinyin", "Tùy chọn", "Phiên âm Pinyin của câu ví dụ." },
            { "ExampleMeaningVi", "Tùy chọn", "Nghĩa tiếng Việt của câu ví dụ." }
        };

        sheetGuide.Cell(4, 1).Value = "Tên cột";
        sheetGuide.Cell(4, 2).Value = "Bắt buộc";
        sheetGuide.Cell(4, 3).Value = "Giải thích & Quy tắc";
        var headerRange = sheetGuide.Range(4, 1, 4, 3);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Font.FontColor = XLColor.White;
        headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#1E293B");

        for (int i = 0; i < guideColumns.GetLength(0); i++)
        {
            int row = i + 5;
            sheetGuide.Cell(row, 1).Value = guideColumns[i, 0];
            sheetGuide.Cell(row, 1).Style.Font.Bold = true;
            sheetGuide.Cell(row, 2).Value = guideColumns[i, 1];
            sheetGuide.Cell(row, 2).Style.Font.FontColor = guideColumns[i, 1] == "BẮT BUỘC" ? XLColor.Red : XLColor.FromHtml("#475569");
            sheetGuide.Cell(row, 3).Value = guideColumns[i, 2];
            sheetGuide.Row(row).Height = 20;
        }

        int noteRow = 5 + guideColumns.GetLength(0) + 1;
        sheetGuide.Cell(noteRow, 1).Value = "CÁC LƯU Ý QUAN TRỌNG:";
        sheetGuide.Cell(noteRow, 1).Style.Font.Bold = true;
        sheetGuide.Cell(noteRow, 1).Style.Font.FontColor = XLColor.FromHtml("#B91C1C");

        sheetGuide.Cell(noteRow + 1, 1).Value = "1. Vui lòng XÓA các dòng dữ liệu mẫu màu vàng tại sheet 'DuLieu' trước khi nhập dữ liệu thật.";
        sheetGuide.Cell(noteRow + 2, 1).Value = "2. Không đổi tên hoặc thay đổi thứ tự các cột ở sheet 'DuLieu'.";
        sheetGuide.Cell(noteRow + 3, 1).Value = "3. Toàn bộ từ vựng mới nhập sẽ ở trạng thái DRAFT (Bản nháp), không tự động xuất bản (PUBLISHED).";
        sheetGuide.Cell(noteRow + 4, 1).Value = "4. Hệ thống tự động chống trùng theo SourceDataset + SourceEntryId hoặc HskLevel + Hanzi + Pinyin.";

        sheetGuide.Columns().AdjustToContents(15, 80);

        using var memoryStream = new MemoryStream();
        workbook.SaveAs(memoryStream);
        return Task.FromResult(memoryStream.ToArray());
    }

    public async Task<byte[]> ExportVocabulariesExcelAsync(
        int? hskLevel = null,
        string? partOfSpeech = null,
        string? status = null,
        string? search = null,
        bool? missingMeaningVi = null,
        bool? needsReview = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Vocabularies.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
        {
            query = query.Where(v => v.Status == status);
        }

        if (hskLevel.HasValue && hskLevel.Value > 0)
        {
            query = query.Where(v => v.HskLevel == hskLevel.Value);
        }

        if (!string.IsNullOrWhiteSpace(partOfSpeech) && partOfSpeech != "ALL")
        {
            var pos = partOfSpeech.Trim().ToLower();
            query = query.Where(v => v.PartOfSpeech != null && v.PartOfSpeech.ToLower().Contains(pos));
        }

        if (missingMeaningVi.HasValue)
        {
            if (missingMeaningVi.Value)
            {
                query = query.Where(v => string.IsNullOrWhiteSpace(v.MeaningVi));
            }
            else
            {
                query = query.Where(v => !string.IsNullOrWhiteSpace(v.MeaningVi));
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(v => v.Hanzi.ToLower().Contains(q) || v.Pinyin.ToLower().Contains(q) || (v.MeaningVi != null && v.MeaningVi.ToLower().Contains(q)));
        }

        var list = await query
            .OrderBy(v => v.HskLevel)
            .ThenBy(v => v.Hanzi)
            .ToListAsync(cancellationToken);

        if (needsReview == true)
        {
            list = list.Where(v => !string.IsNullOrWhiteSpace(v.Homograph) || v.Pinyin.Contains(' ') || (v.Entry != null && v.Entry != v.Hanzi)).ToList();
        }

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("DuLieu");

        // Headers
        string[] headers = new[]
        {
            "SourceEntryId",
            "SourceDataset",
            "HskLevel",
            "Hanzi",
            "Pinyin",
            "MeaningVi",
            "MeaningEn",
            "PartOfSpeech",
            "Status",
            "Homograph"
        };

        for (int col = 1; col <= headers.Length; col++)
        {
            var cell = ws.Cell(1, col);
            cell.Value = headers[col - 1];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1E293B");
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }
        ws.Row(1).Height = 24;

        for (int i = 0; i < list.Count; i++)
        {
            var item = list[i];
            int r = i + 2;

            ws.Cell(r, 1).SetValue(item.SourceEntryId ?? "");
            ws.Cell(r, 2).SetValue(item.SourceDataset ?? "HSK 3.0");
            ws.Cell(r, 3).SetValue(item.HskLevel);
            ws.Cell(r, 4).SetValue(item.Hanzi);
            ws.Cell(r, 5).SetValue(item.Pinyin);
            ws.Cell(r, 6).SetValue(item.MeaningVi ?? "");
            ws.Cell(r, 7).SetValue(item.MeaningEn ?? "");
            ws.Cell(r, 8).SetValue(item.PartOfSpeech ?? "");
            ws.Cell(r, 9).SetValue(item.Status);
            ws.Cell(r, 10).SetValue(item.Homograph ?? "");

            ws.Cell(r, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws.Cell(r, 4).Style.Font.Bold = true;
            ws.Cell(r, 9).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            if (item.Status == "PUBLISHED")
            {
                ws.Cell(r, 9).Style.Font.FontColor = XLColor.FromHtml("#15803D");
            }
            else
            {
                ws.Cell(r, 9).Style.Font.FontColor = XLColor.FromHtml("#B45309");
            }

            ws.Row(r).Height = 20;
        }

        ws.Columns().AdjustToContents(10, 50);

        using var memoryStream = new MemoryStream();
        workbook.SaveAs(memoryStream);
        return memoryStream.ToArray();
    }

    public async Task<VocabularyImportResultDto> ImportVocabulariesFromExcelAsync(Stream excelStream, bool dryRun = false, CancellationToken cancellationToken = default)
    {
        XLWorkbook workbook;
        try
        {
            workbook = new XLWorkbook(excelStream);
        }
        catch (Exception ex)
        {
            throw new ArgumentException($"Tệp tin không phải định dạng Excel (.xlsx) hợp lệ hoặc bị hỏng: {ex.Message}");
        }

        using (workbook)
        {
            // Find data worksheet
            var sheet = workbook.Worksheets.FirstOrDefault(w =>
                w.Name.Equals("DuLieu", StringComparison.OrdinalIgnoreCase) ||
                w.Name.Equals("Dữ liệu", StringComparison.OrdinalIgnoreCase))
                ?? workbook.Worksheets.FirstOrDefault();

            if (sheet == null)
            {
                throw new ArgumentException("Tệp Excel không chứa sheet dữ liệu nào.");
            }

            const string datasetName = "HSK 3.0";

            // Map headers in row 1
            var headerMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            var headerRow = sheet.Row(1);
            int lastCol = sheet.LastColumnUsed()?.ColumnNumber() ?? 0;
            if (lastCol == 0)
            {
                throw new ArgumentException("Sheet dữ liệu trống, không tìm thấy hàng tiêu đề.");
            }

            for (int col = 1; col <= lastCol; col++)
            {
                var rawVal = headerRow.Cell(col).GetString()?.Trim() ?? "";
                if (string.IsNullOrWhiteSpace(rawVal)) continue;

                var norm = rawVal.ToLowerInvariant()
                    .Replace(" ", "")
                    .Replace("_", "")
                    .Replace("-", "");

                if (norm.Contains("examplehanzi") || norm.Contains("viduchuhan") || norm.Contains("viduhanzi"))
                    headerMap["examplehanzi"] = col;
                else if (norm.Contains("examplepinyin") || norm.Contains("vidupinyin"))
                    headerMap["examplepinyin"] = col;
                else if (norm.Contains("examplemeaningvi") || norm.Contains("vidunghiatiengviet") || norm.Contains("vidunghiavi"))
                    headerMap["examplemeaningvi"] = col;
                else if (norm.Contains("sourceentryid") || norm.Equals("id") || norm.Equals("ma") || norm.Equals("matuvung"))
                    headerMap["sourceentryid"] = col;
                else if (norm.Contains("hsklevel") || norm.Equals("level") || norm.Contains("caphsk") || norm.Contains("capdo"))
                    headerMap["hsklevel"] = col;
                else if (norm.Equals("hanzi") || norm.Contains("chuhan") || norm.Contains("hantu"))
                    headerMap["hanzi"] = col;
                else if (norm.Equals("pinyin") || norm.Contains("phienam"))
                    headerMap["pinyin"] = col;
                else if (norm.Contains("meaningvi") || norm.Contains("nghiatiengviet") || norm.Contains("nghiavi"))
                    headerMap["meaningvi"] = col;
                else if (norm.Contains("meaningen") || norm.Contains("nghiatienganh") || norm.Contains("nghiaen"))
                    headerMap["meaningen"] = col;
                else if (norm.Contains("partofspeech") || norm.Contains("tuloai") || norm.Contains("pos"))
                    headerMap["partofspeech"] = col;
            }

            // Validate mandatory headers
            var missing = new List<string>();
            if (!headerMap.ContainsKey("hsklevel")) missing.Add("HskLevel");
            if (!headerMap.ContainsKey("hanzi")) missing.Add("Hanzi");
            if (!headerMap.ContainsKey("pinyin")) missing.Add("Pinyin");

            if (missing.Count > 0)
            {
                throw new ArgumentException($"Tệp Excel thiếu các cột bắt buộc: {string.Join(", ", missing)}. Vui lòng tải template mẫu để kiểm tra đúng cấu trúc.");
            }

            // Fetch existing keys to prevent duplicates
            var existingSourceEntriesList = await _dbContext.Vocabularies
                .AsNoTracking()
                .Where(v => v.SourceDataset != null && v.SourceEntryId != null)
                .Select(v => $"{v.SourceDataset}|{v.SourceEntryId}")
                .ToListAsync(cancellationToken);
            var existingSourceEntries = new HashSet<string>(existingSourceEntriesList, StringComparer.OrdinalIgnoreCase);

            var existingSourceIdsList = await _dbContext.Vocabularies
                .AsNoTracking()
                .Where(v => v.SourceId != null && v.SourceId != "")
                .Select(v => v.SourceId!)
                .ToListAsync(cancellationToken);
            var existingSourceIds = new HashSet<string>(existingSourceIdsList, StringComparer.OrdinalIgnoreCase);

            var existingLookup = await _dbContext.Vocabularies
                .AsNoTracking()
                .Select(v => new { v.HskLevel, v.Hanzi, v.Pinyin, Homograph = v.Homograph ?? "" })
                .ToListAsync(cancellationToken);

            var existingLookupSet = existingLookup
                .Select(x => $"{x.HskLevel}|{x.Hanzi}|{x.Pinyin}|{x.Homograph}")
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var seenInCurrentFile = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            int lastRow = sheet.LastRowUsed()?.RowNumber() ?? 1;
            int totalRows = 0;
            int successCount = 0;
            int skippedDuplicateCount = 0;
            var errors = new List<VocabularyImportRowError>();
            var previewItems = new List<VocabularyImportPreviewItem>();
            var toInsert = new List<VocabularyEntity>();

            string GetSanitizedCell(IXLRow row, string key)
            {
                if (!headerMap.TryGetValue(key, out var colIdx)) return "";
                var cell = row.Cell(colIdx);
                var str = cell.GetString()?.Trim() ?? "";
                if (string.IsNullOrEmpty(str)) return "";
                // Prevent spreadsheet formula injection by sanitizing leading =, +, -, @
                if (str.StartsWith("=") || str.StartsWith("+") || str.StartsWith("-") || str.StartsWith("@"))
                {
                    str = str.TrimStart('=', '+', '-', '@').Trim();
                }
                return str;
            }

            for (int r = 2; r <= lastRow; r++)
            {
                var row = sheet.Row(r);
                if (row.IsEmpty()) continue;

                string rawLevel = GetSanitizedCell(row, "hsklevel");
                string hanzi = GetSanitizedCell(row, "hanzi");
                string pinyin = GetSanitizedCell(row, "pinyin");
                string sourceEntryId = GetSanitizedCell(row, "sourceentryid");
                string meaningVi = GetSanitizedCell(row, "meaningvi");
                string meaningEn = GetSanitizedCell(row, "meaningen");
                string partOfSpeech = GetSanitizedCell(row, "partofspeech");
                string exampleHanzi = GetSanitizedCell(row, "examplehanzi");
                string examplePinyin = GetSanitizedCell(row, "examplepinyin");
                string exampleMeaningVi = GetSanitizedCell(row, "examplemeaningvi");

                // If entire row content is blank
                if (string.IsNullOrWhiteSpace(rawLevel) && string.IsNullOrWhiteSpace(hanzi) && string.IsNullOrWhiteSpace(pinyin))
                {
                    continue;
                }

                // Skip template sample rows
                if ((!string.IsNullOrEmpty(sourceEntryId) && sourceEntryId.StartsWith("HSK", StringComparison.OrdinalIgnoreCase) && sourceEntryId.Contains("-EX", StringComparison.OrdinalIgnoreCase)) ||
                    meaningVi.Contains("DÒNG VÍ DỤ", StringComparison.OrdinalIgnoreCase) ||
                    meaningVi.Contains("DONG VI DU", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                totalRows++;

                // Validate Level: HSK 1-6 ONLY. Reject 7-9 or invalid numbers.
                if (!int.TryParse(rawLevel, out var parsedLevel) || parsedLevel < 1 || parsedLevel > 6)
                {
                    errors.Add(new VocabularyImportRowError
                    {
                        RowNumber = r,
                        ColumnName = "HskLevel",
                        SourceDataset = datasetName,
                        SourceEntryId = sourceEntryId,
                        Hanzi = hanzi,
                        Reason = $"Cấp độ HSK không hợp lệ ('{rawLevel}'). Hệ thống chỉ hỗ trợ chuẩn HSK 3.0 từ cấp 1 đến cấp 6, từ chối cấp 7–9."
                    });
                    continue;
                }

                int hskLevel = parsedLevel;

                // Validate Hanzi
                if (string.IsNullOrWhiteSpace(hanzi))
                {
                    errors.Add(new VocabularyImportRowError
                    {
                        RowNumber = r,
                        ColumnName = "Hanzi",
                        SourceDataset = datasetName,
                        SourceEntryId = sourceEntryId,
                        Hanzi = hanzi,
                        Reason = "Chữ Hán không được để trống."
                    });
                    continue;
                }

                // Validate Pinyin
                if (string.IsNullOrWhiteSpace(pinyin))
                {
                    errors.Add(new VocabularyImportRowError
                    {
                        RowNumber = r,
                        ColumnName = "Pinyin",
                        SourceDataset = datasetName,
                        SourceEntryId = sourceEntryId,
                        Hanzi = hanzi,
                        Reason = "Pinyin không được để trống."
                    });
                    continue;
                }

                string sourceKey = !string.IsNullOrEmpty(sourceEntryId) ? $"{datasetName}|{sourceEntryId}" : "";
                string naturalKey = $"{hskLevel}|{hanzi}|{pinyin}|";
                string levelLabel = hskLevel.ToString();

                // Check duplicates (unified with CSV)
                bool isDuplicate = false;
                if (!string.IsNullOrEmpty(sourceKey) && existingSourceEntries.Contains(sourceKey))
                {
                    isDuplicate = true;
                }
                else if (!string.IsNullOrEmpty(sourceEntryId) && existingSourceIds.Contains(sourceEntryId))
                {
                    isDuplicate = true;
                }
                else if (existingLookupSet.Contains(naturalKey))
                {
                    isDuplicate = true;
                }
                else if (!string.IsNullOrEmpty(sourceKey) && seenInCurrentFile.Contains(sourceKey))
                {
                    isDuplicate = true;
                }
                else if (seenInCurrentFile.Contains(naturalKey))
                {
                    isDuplicate = true;
                }

                if (isDuplicate)
                {
                    skippedDuplicateCount++;
                    if (previewItems.Count < 50)
                    {
                        previewItems.Add(new VocabularyImportPreviewItem
                        {
                            RowNumber = r,
                            SourceDataset = datasetName,
                            SourceEntryId = sourceEntryId,
                            SourceId = sourceEntryId,
                            HskLevel = hskLevel,
                            LevelLabel = levelLabel,
                            Hanzi = hanzi,
                            Pinyin = pinyin,
                            MeaningVi = meaningVi,
                            MeaningEn = meaningEn,
                            PartOfSpeech = partOfSpeech,
                            ExampleHanzi = exampleHanzi,
                            ExamplePinyin = examplePinyin,
                            ExampleMeaningVi = exampleMeaningVi,
                            IsDuplicate = true,
                            Status = "DRAFT"
                        });
                    }
                    continue;
                }

                if (!string.IsNullOrEmpty(sourceKey)) seenInCurrentFile.Add(sourceKey);
                seenInCurrentFile.Add(naturalKey);

                successCount++;

                if (previewItems.Count < 50)
                {
                    previewItems.Add(new VocabularyImportPreviewItem
                    {
                        RowNumber = r,
                        SourceDataset = datasetName,
                        SourceEntryId = sourceEntryId,
                        SourceId = sourceEntryId,
                        HskLevel = hskLevel,
                        LevelLabel = levelLabel,
                        Hanzi = hanzi,
                        Pinyin = pinyin,
                        MeaningVi = meaningVi,
                        MeaningEn = meaningEn,
                        PartOfSpeech = partOfSpeech,
                        ExampleHanzi = exampleHanzi,
                        ExamplePinyin = examplePinyin,
                        ExampleMeaningVi = exampleMeaningVi,
                        IsDuplicate = false,
                        Status = "DRAFT"
                    });
                }

                if (!dryRun)
                {
                    string? examplesJson = null;
                    if (!string.IsNullOrWhiteSpace(exampleHanzi))
                    {
                        var exList = new[]
                        {
                            new
                            {
                                hanzi = exampleHanzi,
                                pinyin = examplePinyin ?? "",
                                meaningVi = exampleMeaningVi ?? ""
                            }
                        };
                        var jsonSerializerOptions = new JsonSerializerOptions
                        {
                            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                        };
                        examplesJson = JsonSerializer.Serialize(exList, jsonSerializerOptions);
                    }

                    toInsert.Add(new VocabularyEntity
                    {
                        HskLevel = hskLevel,
                        Hanzi = hanzi,
                        Pinyin = pinyin,
                        MeaningVi = meaningVi,
                        MeaningEn = string.IsNullOrWhiteSpace(meaningEn) ? null : meaningEn,
                        PartOfSpeech = string.IsNullOrWhiteSpace(partOfSpeech) ? null : partOfSpeech,
                        ExamplesJson = examplesJson,
                        LevelLabel = levelLabel,
                        SourceDataset = datasetName,
                        SourceEntryId = string.IsNullOrEmpty(sourceEntryId) ? null : sourceEntryId,
                        SourceId = string.IsNullOrEmpty(sourceEntryId) ? null : sourceEntryId,
                        Status = "DRAFT",
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            // Save to SQL Server in batches if not dry run
            if (!dryRun && toInsert.Count > 0)
            {
                const int batchSize = 500;
                for (int i = 0; i < toInsert.Count; i += batchSize)
                {
                    var batch = toInsert.Skip(i).Take(batchSize).ToList();
                    await _dbContext.Vocabularies.AddRangeAsync(batch, cancellationToken);
                    await _dbContext.SaveChangesAsync(cancellationToken);
                }
            }

            return new VocabularyImportResultDto
            {
                DryRun = dryRun,
                TotalRows = totalRows,
                SuccessCount = successCount,
                SkippedDuplicateCount = skippedDuplicateCount,
                ErrorCount = errors.Count,
                Errors = errors,
                PreviewItems = previewItems
            };
        }
    }

    public async Task<bool> DeleteVocabularyAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var v = await _dbContext.Vocabularies.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (v == null) return false;

        _dbContext.Vocabularies.Remove(v);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<BatchPublishResultDto> BatchPublishVocabulariesAsync(List<Guid> ids, CancellationToken cancellationToken = default)
    {
        if (ids == null || ids.Count == 0)
        {
            return new BatchPublishResultDto();
        }

        var distinctIds = ids.Distinct().ToList();
        var vocabs = await _dbContext.Vocabularies
            .Where(v => distinctIds.Contains(v.Id))
            .ToListAsync(cancellationToken);

        int publishedCount = 0;
        int skippedCount = 0;
        var skippedReasons = new List<string>();

        foreach (var v in vocabs)
        {
            if (string.IsNullOrWhiteSpace(v.MeaningVi))
            {
                skippedCount++;
                skippedReasons.Add($"Từ '{v.Hanzi}' ({v.Pinyin}) chưa có nghĩa tiếng Việt, không thể xuất bản.");
                continue;
            }

            v.Status = "PUBLISHED";
            v.UpdatedAt = DateTime.UtcNow;
            publishedCount++;
        }

        if (publishedCount > 0)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return new BatchPublishResultDto
        {
            PublishedCount = publishedCount,
            SkippedCount = skippedCount,
            SkippedReasons = skippedReasons
        };
    }

    public async Task<BatchUpdateMeaningsResultDto> BatchUpdateMeaningsAsync(List<BatchUpdateMeaningItemDto> items, CancellationToken cancellationToken = default)
    {
        var result = new BatchUpdateMeaningsResultDto
        {
            TotalRequested = items?.Count ?? 0
        };

        if (items == null || items.Count == 0)
        {
            return result;
        }

        var ids = items.Select(x => x.Id).Distinct().ToList();
        var vocabs = await _dbContext.Vocabularies
            .Where(v => ids.Contains(v.Id))
            .ToDictionaryAsync(v => v.Id, cancellationToken);

        foreach (var item in items)
        {
            if (item.Id == Guid.Empty)
            {
                result.ErrorCount++;
                result.Errors.Add(new BatchUpdateMeaningErrorItemDto
                {
                    Id = item.Id,
                    Hanzi = item.Hanzi,
                    Pinyin = item.Pinyin,
                    Reason = "ID từ vựng không hợp lệ."
                });
                continue;
            }

            if (!vocabs.TryGetValue(item.Id, out var vocab))
            {
                result.ErrorCount++;
                result.Errors.Add(new BatchUpdateMeaningErrorItemDto
                {
                    Id = item.Id,
                    Hanzi = item.Hanzi,
                    Pinyin = item.Pinyin,
                    Reason = $"Không tìm thấy từ vựng với ID {item.Id}."
                });
                continue;
            }

            // Cross-validation of Hanzi if provided
            if (!string.IsNullOrWhiteSpace(item.Hanzi) && !string.Equals(vocab.Hanzi.Trim(), item.Hanzi.Trim(), StringComparison.Ordinal))
            {
                result.ErrorCount++;
                result.Errors.Add(new BatchUpdateMeaningErrorItemDto
                {
                    Id = item.Id,
                    Hanzi = item.Hanzi,
                    Pinyin = item.Pinyin,
                    Reason = $"Hán tự '{item.Hanzi}' không khớp với cơ sở dữ liệu ('{vocab.Hanzi}')."
                });
                continue;
            }

            // Cross-validation of Pinyin if provided (crucial for homographs / duoyinzi)
            if (!string.IsNullOrWhiteSpace(item.Pinyin) && !string.Equals(vocab.Pinyin.Trim(), item.Pinyin.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                result.ErrorCount++;
                result.Errors.Add(new BatchUpdateMeaningErrorItemDto
                {
                    Id = item.Id,
                    Hanzi = item.Hanzi,
                    Pinyin = item.Pinyin,
                    Reason = $"Pinyin '{item.Pinyin}' không khớp với cơ sở dữ liệu ('{vocab.Pinyin}')."
                });
                continue;
            }

            if (string.IsNullOrWhiteSpace(item.MeaningVi))
            {
                result.ErrorCount++;
                result.Errors.Add(new BatchUpdateMeaningErrorItemDto
                {
                    Id = item.Id,
                    Hanzi = item.Hanzi,
                    Pinyin = item.Pinyin,
                    Reason = "Nghĩa tiếng Việt không được để trống."
                });
                continue;
            }

            // Status handling: if explicitly requested as PUBLISHED, MeaningVi must be non-empty (already checked).
            // Otherwise, keep existing status (or apply provided valid status e.g. DRAFT).
            if (!string.IsNullOrWhiteSpace(item.Status))
            {
                var upperStatus = item.Status.Trim().ToUpperInvariant();
                if (upperStatus != "DRAFT" && upperStatus != "PENDING_REVIEW" && upperStatus != "PUBLISHED" && upperStatus != "ARCHIVED")
                {
                    result.ErrorCount++;
                    result.Errors.Add(new BatchUpdateMeaningErrorItemDto
                    {
                        Id = item.Id,
                        Hanzi = item.Hanzi,
                        Pinyin = item.Pinyin,
                        Reason = $"Trạng thái '{item.Status}' không hợp lệ."
                    });
                    continue;
                }
                vocab.Status = upperStatus;
            }

            vocab.MeaningVi = item.MeaningVi.Trim();
            if (!string.IsNullOrWhiteSpace(item.PartOfSpeech))
            {
                vocab.PartOfSpeech = item.PartOfSpeech.Trim();
            }
            vocab.UpdatedAt = DateTime.UtcNow;

            result.UpdatedCount++;
        }

        if (result.UpdatedCount > 0)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return result;
    }

    public async Task<VocabularyDto?> ReviewVocabularyAsync(Guid id, ReviewContentDto dto, Guid? currentUserId = null, CancellationToken cancellationToken = default)
    {
        var v = await _dbContext.Vocabularies.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (v == null) return null;

        var targetStatus = dto.Status.Trim().ToUpperInvariant();
        if (targetStatus != "DRAFT" && targetStatus != "PENDING_REVIEW" && targetStatus != "PUBLISHED" && targetStatus != "ARCHIVED")
        {
            throw new ArgumentException($"Trạng thái '{dto.Status}' không hợp lệ.");
        }

        if ((targetStatus == "PUBLISHED" || targetStatus == "PENDING_REVIEW") && string.IsNullOrWhiteSpace(v.MeaningVi))
        {
            throw new InvalidOperationException($"Từ vựng không thể chuyển sang {(targetStatus == "PUBLISHED" ? "Xuất bản" : "Chờ duyệt")} khi chưa có nghĩa tiếng Việt.");
        }

        v.Status = targetStatus;
        if (!string.IsNullOrWhiteSpace(dto.ReviewNotes))
        {
            v.ReviewNotes = dto.ReviewNotes.Trim();
        }
        v.ReviewedByUserId = currentUserId;
        v.ReviewedAt = DateTime.UtcNow;
        v.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new VocabularyDto
        {
            Id = v.Id,
            HskLevel = v.HskLevel,
            Hanzi = v.Hanzi,
            Traditional = v.Traditional,
            Pinyin = v.Pinyin,
            MeaningVi = v.MeaningVi,
            SuggestedMeaningVi = v.SuggestedMeaningVi,
            MeaningEn = v.MeaningEn,
            PartOfSpeech = v.PartOfSpeech,
            AudioUrl = v.AudioUrl,
            ExamplesJson = v.ExamplesJson,
            Status = v.Status,
            SourceDataset = v.SourceDataset,
            SourceEntryId = v.SourceEntryId,
            SourceId = v.SourceId,
            Entry = v.Entry,
            Homograph = v.Homograph,
            LevelLabel = v.LevelLabel,
            SourcePdfPage = v.SourcePdfPage,
            LessonId = v.LessonId,
            UpdatedByUserId = v.UpdatedByUserId,
            ReviewedByUserId = v.ReviewedByUserId,
            ReviewedAt = v.ReviewedAt,
            ReviewNotes = v.ReviewNotes,
            CreatedAt = v.CreatedAt,
            UpdatedAt = v.UpdatedAt
        };
    }

    public async Task<BatchReviewResultDto> BatchReviewVocabulariesAsync(BatchReviewContentDto dto, Guid? currentUserId = null, CancellationToken cancellationToken = default)
    {
        var result = new BatchReviewResultDto();
        if (dto.Ids == null || dto.Ids.Count == 0) return result;

        var targetStatus = dto.Status.Trim().ToUpperInvariant();
        if (targetStatus != "DRAFT" && targetStatus != "PENDING_REVIEW" && targetStatus != "PUBLISHED" && targetStatus != "ARCHIVED")
        {
            throw new ArgumentException($"Trạng thái '{dto.Status}' không hợp lệ.");
        }

        var distinctIds = dto.Ids.Distinct().ToList();
        var vocabs = await _dbContext.Vocabularies
            .Where(v => distinctIds.Contains(v.Id))
            .ToListAsync(cancellationToken);

        var foundIds = vocabs.Select(v => v.Id).ToHashSet();
        foreach (var id in distinctIds)
        {
            if (!foundIds.Contains(id))
            {
                result.SkippedCount++;
                result.SkippedReasons.Add($"Không tìm thấy từ vựng có ID {id}.");
            }
        }

        foreach (var v in vocabs)
        {
            if ((targetStatus == "PUBLISHED" || targetStatus == "PENDING_REVIEW") && string.IsNullOrWhiteSpace(v.MeaningVi))
            {
                result.SkippedCount++;
                result.SkippedReasons.Add($"Từ '{v.Hanzi}' ({v.Pinyin}) chưa có nghĩa tiếng Việt, không thể chuyển sang {targetStatus}.");
                continue;
            }

            v.Status = targetStatus;
            if (!string.IsNullOrWhiteSpace(dto.ReviewNotes))
            {
                v.ReviewNotes = dto.ReviewNotes.Trim();
            }
            v.ReviewedByUserId = currentUserId;
            v.ReviewedAt = DateTime.UtcNow;
            v.UpdatedAt = DateTime.UtcNow;
            result.ProcessedCount++;
        }

        if (result.ProcessedCount > 0)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return result;
    }

    #endregion

    #region Grammar

    public async Task<PagedResponse<GrammarPointDto>> GetGrammarPointsAsync(int? hskLevel = null, string? category = null, string? search = null, string? status = null, int page = 1, int pageSize = 20, bool publishedOnly = false, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.GrammarPoints.AsNoTracking().AsQueryable();

        if (publishedOnly)
        {
            query = query.Where(g => g.Status == "PUBLISHED");
            if (!string.IsNullOrWhiteSpace(status) && status != "ALL" && status != "PUBLISHED")
            {
                query = query.Where(g => false);
            }
        }
        else if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
        {
            query = query.Where(g => g.Status == status);
        }

        if (hskLevel.HasValue && hskLevel.Value > 0)
        {
            query = query.Where(g => g.HskLevel == hskLevel.Value);
        }

        if (!string.IsNullOrWhiteSpace(category) && category != "ALL")
        {
            query = query.Where(g => g.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(g => g.Title.ToLower().Contains(q) || g.Code.ToLower().Contains(q) || g.Explanation.ToLower().Contains(q) || g.StructureFormula.ToLower().Contains(q));
        }

        var totalItems = await query.CountAsync(cancellationToken);
        var pageClamped = Math.Max(1, page);
        var pageSizeClamped = Math.Clamp(pageSize, 1, 500);

        var items = await query
            .OrderBy(g => g.HskLevel)
            .ThenBy(g => g.Code)
            .Skip((pageClamped - 1) * pageSizeClamped)
            .Take(pageSizeClamped)
            .Select(g => new GrammarPointDto
            {
                Id = g.Id,
                Code = g.Code,
                Title = g.Title,
                PinyinTitle = g.PinyinTitle,
                HskLevel = g.HskLevel,
                Category = g.Category,
                StructureFormula = g.StructureFormula,
                Explanation = g.Explanation,
                Difficulty = g.Difficulty,
                ExamplesJson = g.ExamplesJson,
                PracticeJson = g.PracticeJson,
                Status = g.Status,
                GrammarType = g.GrammarType,
                CategoryType = g.CategoryType,
                RawExplanationCn = publishedOnly ? null : g.RawExplanationCn,
                SourceDataset = publishedOnly ? null : g.SourceDataset,
                SourceEntryId = publishedOnly ? null : g.SourceEntryId,
                LessonId = g.LessonId,
                UpdatedByUserId = publishedOnly ? null : g.UpdatedByUserId,
                ReviewedByUserId = publishedOnly ? null : g.ReviewedByUserId,
                ReviewedAt = publishedOnly ? null : g.ReviewedAt,
                ReviewNotes = publishedOnly ? null : g.ReviewNotes,
                CreatedAt = g.CreatedAt,
                UpdatedAt = g.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResponse<GrammarPointDto>(items, totalItems, pageClamped, pageSizeClamped);
    }

    public async Task<GrammarPointDto?> GetGrammarPointByIdAsync(Guid id, bool publishedOnly = false, CancellationToken cancellationToken = default)
    {
        var g = await _dbContext.GrammarPoints.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (g == null || (publishedOnly && g.Status != "PUBLISHED")) return null;

        return new GrammarPointDto
        {
            Id = g.Id,
            Code = g.Code,
            Title = g.Title,
            PinyinTitle = g.PinyinTitle,
            HskLevel = g.HskLevel,
            Category = g.Category,
            StructureFormula = g.StructureFormula,
            Explanation = g.Explanation,
            Difficulty = g.Difficulty,
            ExamplesJson = g.ExamplesJson,
            PracticeJson = g.PracticeJson,
            Status = g.Status,
            GrammarType = g.GrammarType,
            CategoryType = g.CategoryType,
            RawExplanationCn = publishedOnly ? null : g.RawExplanationCn,
            SourceDataset = publishedOnly ? null : g.SourceDataset,
            SourceEntryId = publishedOnly ? null : g.SourceEntryId,
            LessonId = g.LessonId,
            UpdatedByUserId = publishedOnly ? null : g.UpdatedByUserId,
            ReviewedByUserId = publishedOnly ? null : g.ReviewedByUserId,
            ReviewedAt = publishedOnly ? null : g.ReviewedAt,
            ReviewNotes = publishedOnly ? null : g.ReviewNotes,
            CreatedAt = g.CreatedAt,
            UpdatedAt = g.UpdatedAt
        };
    }

    public async Task<GrammarPointDto> CreateGrammarPointAsync(CreateGrammarPointDto dto, CancellationToken cancellationToken = default)
    {
        if ((dto.Status == "PUBLISHED" || dto.Status == "PENDING_REVIEW") &&
            (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Explanation) || string.IsNullOrWhiteSpace(dto.StructureFormula)))
        {
            throw new ArgumentException("Điểm ngữ pháp chỉ có thể chuyển sang Chờ duyệt hoặc Xuất bản khi có tiêu đề, công thức cấu trúc và giải thích tiếng Việt hợp lệ.");
        }

        var g = new GrammarPointEntity
        {
            Code = dto.Code.Trim(),
            Title = dto.Title.Trim(),
            PinyinTitle = dto.PinyinTitle.Trim(),
            HskLevel = dto.HskLevel,
            Category = dto.Category.Trim(),
            StructureFormula = dto.StructureFormula.Trim(),
            Explanation = dto.Explanation.Trim(),
            Difficulty = dto.Difficulty.Trim(),
            ExamplesJson = dto.ExamplesJson,
            PracticeJson = dto.PracticeJson,
            Status = dto.Status,
            LessonId = dto.LessonId
        };

        _dbContext.GrammarPoints.Add(g);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new GrammarPointDto
        {
            Id = g.Id,
            Code = g.Code,
            Title = g.Title,
            PinyinTitle = g.PinyinTitle,
            HskLevel = g.HskLevel,
            Category = g.Category,
            StructureFormula = g.StructureFormula,
            Explanation = g.Explanation,
            Difficulty = g.Difficulty,
            ExamplesJson = g.ExamplesJson,
            PracticeJson = g.PracticeJson,
            Status = g.Status,
            GrammarType = g.GrammarType,
            CategoryType = g.CategoryType,
            RawExplanationCn = g.RawExplanationCn,
            SourceDataset = g.SourceDataset,
            SourceEntryId = g.SourceEntryId,
            LessonId = g.LessonId,
            UpdatedByUserId = g.UpdatedByUserId,
            ReviewedByUserId = g.ReviewedByUserId,
            ReviewedAt = g.ReviewedAt,
            ReviewNotes = g.ReviewNotes,
            CreatedAt = g.CreatedAt,
            UpdatedAt = g.UpdatedAt
        };
    }

    public async Task<GrammarPointDto?> UpdateGrammarPointAsync(Guid id, UpdateGrammarPointDto dto, CancellationToken cancellationToken = default)
    {
        var g = await _dbContext.GrammarPoints.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (g == null) return null;

        if ((dto.Status == "PUBLISHED" || dto.Status == "PENDING_REVIEW") &&
            (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Explanation) || string.IsNullOrWhiteSpace(dto.StructureFormula)))
        {
            throw new ArgumentException("Điểm ngữ pháp chỉ có thể chuyển sang Chờ duyệt hoặc Xuất bản khi có tiêu đề, công thức cấu trúc và giải thích tiếng Việt hợp lệ.");
        }

        g.Title = dto.Title.Trim();
        g.PinyinTitle = dto.PinyinTitle.Trim();
        g.HskLevel = dto.HskLevel;
        g.Category = dto.Category.Trim();
        g.StructureFormula = dto.StructureFormula.Trim();
        g.Explanation = dto.Explanation.Trim();
        g.Difficulty = dto.Difficulty.Trim();
        g.ExamplesJson = dto.ExamplesJson;
        g.PracticeJson = dto.PracticeJson;
        g.Status = dto.Status;
        g.LessonId = dto.LessonId;
        g.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new GrammarPointDto
        {
            Id = g.Id,
            Code = g.Code,
            Title = g.Title,
            PinyinTitle = g.PinyinTitle,
            HskLevel = g.HskLevel,
            Category = g.Category,
            StructureFormula = g.StructureFormula,
            Explanation = g.Explanation,
            Difficulty = g.Difficulty,
            ExamplesJson = g.ExamplesJson,
            PracticeJson = g.PracticeJson,
            Status = g.Status,
            GrammarType = g.GrammarType,
            CategoryType = g.CategoryType,
            RawExplanationCn = g.RawExplanationCn,
            SourceDataset = g.SourceDataset,
            SourceEntryId = g.SourceEntryId,
            LessonId = g.LessonId,
            UpdatedByUserId = g.UpdatedByUserId,
            ReviewedByUserId = g.ReviewedByUserId,
            ReviewedAt = g.ReviewedAt,
            ReviewNotes = g.ReviewNotes,
            CreatedAt = g.CreatedAt,
            UpdatedAt = g.UpdatedAt
        };
    }

    public async Task<bool> DeleteGrammarPointAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var g = await _dbContext.GrammarPoints.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (g == null) return false;

        _dbContext.GrammarPoints.Remove(g);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<GrammarPointDto?> ReviewGrammarPointAsync(Guid id, ReviewContentDto dto, Guid? currentUserId = null, CancellationToken cancellationToken = default)
    {
        var g = await _dbContext.GrammarPoints.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (g == null) return null;

        var targetStatus = dto.Status.Trim().ToUpperInvariant();
        if (targetStatus != "DRAFT" && targetStatus != "PENDING_REVIEW" && targetStatus != "PUBLISHED" && targetStatus != "ARCHIVED")
        {
            throw new ArgumentException($"Trạng thái '{dto.Status}' không hợp lệ.");
        }

        if ((targetStatus == "PUBLISHED" || targetStatus == "PENDING_REVIEW") &&
            (string.IsNullOrWhiteSpace(g.Title) || string.IsNullOrWhiteSpace(g.Explanation) || string.IsNullOrWhiteSpace(g.StructureFormula)))
        {
            throw new InvalidOperationException($"Điểm ngữ pháp không thể chuyển sang {(targetStatus == "PUBLISHED" ? "Xuất bản" : "Chờ duyệt")} khi chưa có tiêu đề, công thức cấu trúc hoặc giải thích hợp lệ.");
        }

        g.Status = targetStatus;
        if (!string.IsNullOrWhiteSpace(dto.ReviewNotes))
        {
            g.ReviewNotes = dto.ReviewNotes.Trim();
        }
        g.ReviewedByUserId = currentUserId;
        g.ReviewedAt = DateTime.UtcNow;
        g.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new GrammarPointDto
        {
            Id = g.Id,
            Code = g.Code,
            Title = g.Title,
            PinyinTitle = g.PinyinTitle,
            HskLevel = g.HskLevel,
            Category = g.Category,
            StructureFormula = g.StructureFormula,
            Explanation = g.Explanation,
            Difficulty = g.Difficulty,
            ExamplesJson = g.ExamplesJson,
            PracticeJson = g.PracticeJson,
            Status = g.Status,
            GrammarType = g.GrammarType,
            CategoryType = g.CategoryType,
            RawExplanationCn = g.RawExplanationCn,
            SourceDataset = g.SourceDataset,
            SourceEntryId = g.SourceEntryId,
            LessonId = g.LessonId,
            UpdatedByUserId = g.UpdatedByUserId,
            ReviewedByUserId = g.ReviewedByUserId,
            ReviewedAt = g.ReviewedAt,
            ReviewNotes = g.ReviewNotes,
            CreatedAt = g.CreatedAt,
            UpdatedAt = g.UpdatedAt
        };
    }

    public async Task<AdminGrammarStatsDto> GetGrammarStatsAsync(CancellationToken cancellationToken = default)
    {
        var total = await _dbContext.GrammarPoints.CountAsync(cancellationToken);
        var published = await _dbContext.GrammarPoints.CountAsync(g => g.Status == "PUBLISHED", cancellationToken);
        var draft = await _dbContext.GrammarPoints.CountAsync(g => g.Status == "DRAFT", cancellationToken);
        var pending = await _dbContext.GrammarPoints.CountAsync(g => g.Status == "PENDING_REVIEW", cancellationToken);
        var archived = await _dbContext.GrammarPoints.CountAsync(g => g.Status == "ARCHIVED", cancellationToken);

        var byHskList = await _dbContext.GrammarPoints.GroupBy(g => g.HskLevel)
            .Select(g => new { HskLevel = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var byHsk = byHskList.ToDictionary(x => x.HskLevel, x => x.Count);
        for (int i = 1; i <= 6; i++)
        {
            if (!byHsk.ContainsKey(i)) byHsk[i] = 0;
        }

        return new AdminGrammarStatsDto
        {
            Total = total,
            Published = published,
            Draft = draft,
            Pending = pending,
            Archived = archived,
            ByHsk = byHsk
        };
    }

    public async Task<BatchReviewResultDto> BatchReviewGrammarPointsAsync(BatchReviewContentDto dto, Guid? currentUserId = null, CancellationToken cancellationToken = default)
    {
        var result = new BatchReviewResultDto();
        if (dto.Ids == null || dto.Ids.Count == 0) return result;

        var targetStatus = dto.Status.Trim().ToUpperInvariant();
        if (targetStatus != "DRAFT" && targetStatus != "PENDING_REVIEW" && targetStatus != "PUBLISHED" && targetStatus != "ARCHIVED")
        {
            throw new ArgumentException($"Trạng thái '{dto.Status}' không hợp lệ.");
        }

        var distinctIds = dto.Ids.Distinct().ToList();
        var grammarPoints = await _dbContext.GrammarPoints
            .Where(g => distinctIds.Contains(g.Id))
            .ToListAsync(cancellationToken);

        var foundIds = grammarPoints.Select(g => g.Id).ToHashSet();
        foreach (var id in distinctIds)
        {
            if (!foundIds.Contains(id))
            {
                result.SkippedCount++;
                result.SkippedReasons.Add($"Không tìm thấy điểm ngữ pháp có ID {id}.");
            }
        }

        foreach (var g in grammarPoints)
        {
            if ((targetStatus == "PUBLISHED" || targetStatus == "PENDING_REVIEW") &&
                (string.IsNullOrWhiteSpace(g.Title) || string.IsNullOrWhiteSpace(g.Explanation) || string.IsNullOrWhiteSpace(g.StructureFormula)))
            {
                result.SkippedCount++;
                result.SkippedReasons.Add($"Điểm ngữ pháp '{g.Code}' ({g.Title}) thiếu tiêu đề, công thức hoặc giải thích, không thể chuyển sang {targetStatus}.");
                continue;
            }

            g.Status = targetStatus;
            if (!string.IsNullOrWhiteSpace(dto.ReviewNotes))
            {
                g.ReviewNotes = dto.ReviewNotes.Trim();
            }
            g.ReviewedByUserId = currentUserId;
            g.ReviewedAt = DateTime.UtcNow;
            g.UpdatedAt = DateTime.UtcNow;
            result.ProcessedCount++;
        }

        if (result.ProcessedCount > 0)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return result;
    }

    public async Task<BatchPublishResultDto> BatchPublishGrammarPointsAsync(List<Guid> ids, Guid? currentUserId = null, CancellationToken cancellationToken = default)
    {
        var result = new BatchPublishResultDto();
        if (ids == null || ids.Count == 0) return result;

        var distinctIds = ids.Distinct().ToList();
        var grammarPoints = await _dbContext.GrammarPoints
            .Where(g => distinctIds.Contains(g.Id))
            .ToListAsync(cancellationToken);

        var foundIds = grammarPoints.Select(g => g.Id).ToHashSet();
        foreach (var id in distinctIds)
        {
            if (!foundIds.Contains(id))
            {
                result.SkippedCount++;
                result.SkippedReasons.Add($"Không tìm thấy điểm ngữ pháp có ID {id}.");
            }
        }

        foreach (var g in grammarPoints)
        {
            if (string.IsNullOrWhiteSpace(g.Title) || string.IsNullOrWhiteSpace(g.Explanation) || string.IsNullOrWhiteSpace(g.StructureFormula))
            {
                result.SkippedCount++;
                result.SkippedReasons.Add($"Điểm ngữ pháp '{g.Code}' ({g.Title}) thiếu tiêu đề, công thức hoặc giải thích, không thể xuất bản.");
                continue;
            }

            g.Status = "PUBLISHED";
            g.ReviewedByUserId = currentUserId;
            g.ReviewedAt = DateTime.UtcNow;
            g.UpdatedAt = DateTime.UtcNow;
            result.PublishedCount++;
        }

        if (result.PublishedCount > 0)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return result;
    }

    #endregion

    #region Hanzi Characters

    public async Task<PagedResponse<HanziCharacterDto>> GetHanziCharactersAsync(int? hskLevel = null, string? search = null, int page = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.HanziCharacters
            .Include(h => h.LevelRequirements)
            .AsNoTracking()
            .AsQueryable();

        if (hskLevel.HasValue && hskLevel.Value >= 1 && hskLevel.Value <= 6)
        {
            query = query.Where(h => h.FirstHskLevel == hskLevel.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(h => h.Character.Contains(s)
                || (h.Pinyin != null && h.Pinyin.Contains(s))
                || (h.SinoVietnamese != null && h.SinoVietnamese.Contains(s))
                || (h.MeaningVi != null && h.MeaningVi.Contains(s))
                || (h.Radical != null && h.Radical.Contains(s)));
        }

        var totalItems = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(h => h.FirstHskLevel)
            .ThenBy(h => h.StrokeCount)
            .ThenBy(h => h.Character)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(h => new HanziCharacterDto
            {
                Id = h.Id,
                Character = h.Character,
                Pinyin = h.Pinyin,
                SinoVietnamese = h.SinoVietnamese,
                MeaningVi = h.MeaningVi,
                StrokeCount = h.StrokeCount,
                Radical = h.Radical,
                FirstHskLevel = h.FirstHskLevel,
                Requirements = h.LevelRequirements.Select(r => new HanziRequirementDto
                {
                    HskLevel = r.HskLevel,
                    RequirementType = r.Type
                }).ToList(),
                CreatedAt = h.CreatedAt,
                UpdatedAt = h.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResponse<HanziCharacterDto>(items, page, pageSize, totalItems);
    }

    public async Task<HanziCharacterDto?> GetHanziCharacterByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var h = await _dbContext.HanziCharacters
            .Include(x => x.LevelRequirements)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (h == null) return null;

        return new HanziCharacterDto
        {
            Id = h.Id,
            Character = h.Character,
            Pinyin = h.Pinyin,
            SinoVietnamese = h.SinoVietnamese,
            MeaningVi = h.MeaningVi,
            StrokeCount = h.StrokeCount,
            Radical = h.Radical,
            FirstHskLevel = h.FirstHskLevel,
            Requirements = h.LevelRequirements.Select(r => new HanziRequirementDto
            {
                HskLevel = r.HskLevel,
                RequirementType = r.Type
            }).ToList(),
            CreatedAt = h.CreatedAt,
            UpdatedAt = h.UpdatedAt
        };
    }

    public async Task<HanziCharacterDto?> UpdateHanziCharacterAsync(Guid id, UpdateHanziCharacterDto dto, CancellationToken cancellationToken = default)
    {
        var h = await _dbContext.HanziCharacters
            .Include(x => x.LevelRequirements)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (h == null) return null;

        h.Pinyin = dto.Pinyin.Trim();
        h.SinoVietnamese = dto.SinoVietnamese?.Trim();
        h.MeaningVi = dto.MeaningVi?.Trim();
        h.StrokeCount = dto.StrokeCount;
        h.Radical = dto.Radical?.Trim();
        h.FirstHskLevel = dto.FirstHskLevel;
        h.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new HanziCharacterDto
        {
            Id = h.Id,
            Character = h.Character,
            Pinyin = h.Pinyin,
            SinoVietnamese = h.SinoVietnamese,
            MeaningVi = h.MeaningVi,
            StrokeCount = h.StrokeCount,
            Radical = h.Radical,
            FirstHskLevel = h.FirstHskLevel,
            Requirements = h.LevelRequirements.Select(r => new HanziRequirementDto
            {
                HskLevel = r.HskLevel,
                RequirementType = r.Type
            }).ToList(),
            CreatedAt = h.CreatedAt,
            UpdatedAt = h.UpdatedAt
        };
    }

    public async Task<AdminHanziStatsDto> GetHanziStatsAsync(CancellationToken cancellationToken = default)
    {
        var total = await _dbContext.HanziCharacters.CountAsync(cancellationToken);
        var byHskList = await _dbContext.HanziCharacters.GroupBy(h => h.FirstHskLevel)
            .Select(g => new { HskLevel = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var byHsk = byHskList.ToDictionary(x => x.HskLevel, x => x.Count);
        for (int i = 1; i <= 6; i++)
        {
            if (!byHsk.ContainsKey(i)) byHsk[i] = 0;
        }

        return new AdminHanziStatsDto
        {
            Total = total,
            ByHsk = byHsk
        };
    }

    #endregion

    #region Exercises

    public async Task<PagedResponse<ExerciseDto>> GetExercisesAsync(int? hskLevel = null, string? type = null, string? skill = null, Guid? lessonId = null, string? search = null, string? status = null, int page = 1, int pageSize = 20, bool publishedOnly = false, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Exercises.AsNoTracking().AsQueryable();

        if (publishedOnly)
        {
            query = query.Where(e => e.Status == "PUBLISHED");
        }
        else if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
        {
            query = query.Where(e => e.Status == status);
        }

        if (hskLevel.HasValue && hskLevel.Value > 0)
        {
            query = query.Where(e => e.HskLevel == hskLevel.Value);
        }

        if (!string.IsNullOrWhiteSpace(type) && type != "ALL")
        {
            query = query.Where(e => e.Type == type);
        }

        if (!string.IsNullOrWhiteSpace(skill) && skill != "ALL")
        {
            query = query.Where(e => e.Skill == skill);
        }

        if (lessonId.HasValue && lessonId.Value != Guid.Empty)
        {
            query = query.Where(e => e.LessonId == lessonId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(e => e.Title.ToLower().Contains(q) || e.Instruction.ToLower().Contains(q) || (e.PromptHanzi != null && e.PromptHanzi.ToLower().Contains(q)));
        }

        var totalItems = await query.CountAsync(cancellationToken);
        var pageClamped = Math.Max(1, page);
        var pageSizeClamped = Math.Clamp(pageSize, 1, 500);

        var items = await query
            .OrderBy(e => e.HskLevel)
            .ThenBy(e => e.Title)
            .Skip((pageClamped - 1) * pageSizeClamped)
            .Take(pageSizeClamped)
            .Select(e => new ExerciseDto
            {
                Id = e.Id,
                Type = e.Type,
                Skill = e.Skill,
                HskLevel = e.HskLevel,
                Title = e.Title,
                Instruction = e.Instruction,
                PromptHanzi = e.PromptHanzi,
                PromptPinyin = e.PromptPinyin,
                PromptVietnamese = e.PromptVietnamese,
                AudioUrl = e.AudioUrl,
                OptionsJson = e.OptionsJson,
                CorrectOptionIndex = e.CorrectOptionIndex,
                CorrectAnswer = e.CorrectAnswer,
                Explanation = e.Explanation,
                XpReward = e.XpReward,
                Status = e.Status,
                LessonId = e.LessonId,
                GrammarPointId = e.GrammarPointId,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResponse<ExerciseDto>(items, totalItems, pageClamped, pageSizeClamped);
    }

    public async Task<ExerciseDto?> GetExerciseByIdAsync(Guid id, bool publishedOnly = false, CancellationToken cancellationToken = default)
    {
        var e = await _dbContext.Exercises.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (e == null || (publishedOnly && e.Status != "PUBLISHED")) return null;

        return new ExerciseDto
        {
            Id = e.Id,
            Type = e.Type,
            Skill = e.Skill,
            HskLevel = e.HskLevel,
            Title = e.Title,
            Instruction = e.Instruction,
            PromptHanzi = e.PromptHanzi,
            PromptPinyin = e.PromptPinyin,
            PromptVietnamese = e.PromptVietnamese,
            AudioUrl = e.AudioUrl,
            OptionsJson = e.OptionsJson,
            CorrectOptionIndex = e.CorrectOptionIndex,
            CorrectAnswer = e.CorrectAnswer,
            Explanation = e.Explanation,
            XpReward = e.XpReward,
            Status = e.Status,
            LessonId = e.LessonId,
            GrammarPointId = e.GrammarPointId,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt
        };
    }

    public async Task<ExerciseDto> CreateExerciseAsync(CreateExerciseDto dto, CancellationToken cancellationToken = default)
    {
        var e = new ExerciseEntity
        {
            Type = dto.Type,
            Skill = dto.Skill,
            HskLevel = dto.HskLevel,
            Title = dto.Title.Trim(),
            Instruction = dto.Instruction.Trim(),
            PromptHanzi = dto.PromptHanzi?.Trim(),
            PromptPinyin = dto.PromptPinyin?.Trim(),
            PromptVietnamese = dto.PromptVietnamese?.Trim(),
            AudioUrl = dto.AudioUrl?.Trim(),
            OptionsJson = dto.OptionsJson,
            CorrectOptionIndex = dto.CorrectOptionIndex,
            CorrectAnswer = dto.CorrectAnswer?.Trim(),
            Explanation = dto.Explanation?.Trim(),
            XpReward = dto.XpReward,
            Status = dto.Status,
            LessonId = dto.LessonId,
            GrammarPointId = dto.GrammarPointId
        };

        _dbContext.Exercises.Add(e);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new ExerciseDto
        {
            Id = e.Id,
            Type = e.Type,
            Skill = e.Skill,
            HskLevel = e.HskLevel,
            Title = e.Title,
            Instruction = e.Instruction,
            PromptHanzi = e.PromptHanzi,
            PromptPinyin = e.PromptPinyin,
            PromptVietnamese = e.PromptVietnamese,
            AudioUrl = e.AudioUrl,
            OptionsJson = e.OptionsJson,
            CorrectOptionIndex = e.CorrectOptionIndex,
            CorrectAnswer = e.CorrectAnswer,
            Explanation = e.Explanation,
            XpReward = e.XpReward,
            Status = e.Status,
            LessonId = e.LessonId,
            GrammarPointId = e.GrammarPointId,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt
        };
    }

    public async Task<ExerciseDto?> UpdateExerciseAsync(Guid id, UpdateExerciseDto dto, CancellationToken cancellationToken = default)
    {
        var e = await _dbContext.Exercises.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (e == null) return null;

        e.Type = dto.Type;
        e.Skill = dto.Skill;
        e.HskLevel = dto.HskLevel;
        e.Title = dto.Title.Trim();
        e.Instruction = dto.Instruction.Trim();
        e.PromptHanzi = dto.PromptHanzi?.Trim();
        e.PromptPinyin = dto.PromptPinyin?.Trim();
        e.PromptVietnamese = dto.PromptVietnamese?.Trim();
        e.AudioUrl = dto.AudioUrl?.Trim();
        e.OptionsJson = dto.OptionsJson;
        e.CorrectOptionIndex = dto.CorrectOptionIndex;
        e.CorrectAnswer = dto.CorrectAnswer?.Trim();
        e.Explanation = dto.Explanation?.Trim();
        e.XpReward = dto.XpReward;
        e.Status = dto.Status;
        e.LessonId = dto.LessonId;
        e.GrammarPointId = dto.GrammarPointId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new ExerciseDto
        {
            Id = e.Id,
            Type = e.Type,
            Skill = e.Skill,
            HskLevel = e.HskLevel,
            Title = e.Title,
            Instruction = e.Instruction,
            PromptHanzi = e.PromptHanzi,
            PromptPinyin = e.PromptPinyin,
            PromptVietnamese = e.PromptVietnamese,
            AudioUrl = e.AudioUrl,
            OptionsJson = e.OptionsJson,
            CorrectOptionIndex = e.CorrectOptionIndex,
            CorrectAnswer = e.CorrectAnswer,
            Explanation = e.Explanation,
            XpReward = e.XpReward,
            Status = e.Status,
            LessonId = e.LessonId,
            GrammarPointId = e.GrammarPointId,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt
        };
    }

    public async Task<bool> DeleteExerciseAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var e = await _dbContext.Exercises.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (e == null) return false;

        _dbContext.Exercises.Remove(e);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<AdminExerciseStatsDto> GetExerciseStatsAsync(CancellationToken cancellationToken = default)
    {
        var total = await _dbContext.Exercises.CountAsync(cancellationToken);
        var published = await _dbContext.Exercises.CountAsync(e => e.Status == "PUBLISHED", cancellationToken);
        var draft = await _dbContext.Exercises.CountAsync(e => e.Status == "DRAFT", cancellationToken);
        var pending = await _dbContext.Exercises.CountAsync(e => e.Status == "PENDING_REVIEW", cancellationToken);
        var archived = await _dbContext.Exercises.CountAsync(e => e.Status == "ARCHIVED", cancellationToken);

        var byHskList = await _dbContext.Exercises.GroupBy(e => e.HskLevel)
            .Select(g => new { HskLevel = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);
        var byHsk = byHskList.ToDictionary(x => x.HskLevel, x => x.Count);
        for (int i = 1; i <= 6; i++)
        {
            if (!byHsk.ContainsKey(i)) byHsk[i] = 0;
        }

        var bySkillList = await _dbContext.Exercises.GroupBy(e => e.Skill)
            .Select(g => new { Skill = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);
        var bySkill = bySkillList.ToDictionary(x => x.Skill, x => x.Count);

        var byTypeList = await _dbContext.Exercises.GroupBy(e => e.Type)
            .Select(g => new { Type = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);
        var byType = byTypeList.ToDictionary(x => x.Type, x => x.Count);

        return new AdminExerciseStatsDto
        {
            Total = total,
            Published = published,
            Draft = draft,
            Pending = pending,
            Archived = archived,
            ByHsk = byHsk,
            BySkill = bySkill,
            ByType = byType
        };
    }

    #endregion
}

