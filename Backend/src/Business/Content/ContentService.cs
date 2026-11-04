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
        var pageSizeClamped = Math.Clamp(pageSize, 1, 100);

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
            CreatedAt = lesson.CreatedAt,
            UpdatedAt = lesson.UpdatedAt
        };
    }

    public async Task<LessonDto> CreateLessonAsync(CreateLessonDto dto, CancellationToken cancellationToken = default)
    {
        var course = await _dbContext.Courses.FindAsync(new object[] { dto.CourseId }, cancellationToken);
        if (course == null)
        {
            throw new InvalidOperationException("Không tìm thấy khóa học tương ứng.");
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
            Status = dto.Status
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

    public async Task<LessonDto?> UpdateLessonAsync(Guid id, UpdateLessonDto dto, CancellationToken cancellationToken = default)
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
        lesson.Status = dto.Status;

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
            DurationMinutes = lesson.DurationMinutes,
            XpReward = lesson.XpReward,
            OrderIndex = lesson.OrderIndex,
            Status = lesson.Status,
            CreatedAt = lesson.CreatedAt,
            UpdatedAt = lesson.UpdatedAt
        };
    }

    public async Task<LessonDto?> UpdateLessonStatusAsync(Guid id, string status, CancellationToken cancellationToken = default)
    {
        var lesson = await _dbContext.Lessons.Include(l => l.Course).FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
        if (lesson == null) return null;

        lesson.Status = status;
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
            DurationMinutes = lesson.DurationMinutes,
            XpReward = lesson.XpReward,
            OrderIndex = lesson.OrderIndex,
            Status = lesson.Status,
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

    public async Task<PagedResponse<VocabularyDto>> GetVocabulariesAsync(int? hskLevel = null, Guid? lessonId = null, string? search = null, string? status = null, int page = 1, int pageSize = 20, bool publishedOnly = false, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Vocabularies.AsNoTracking().AsQueryable();

        if (publishedOnly)
        {
            query = query.Where(v => v.Status == "PUBLISHED");
        }
        else if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
        {
            query = query.Where(v => v.Status == status);
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
            query = query.Where(v => v.Hanzi.ToLower().Contains(q) || v.Pinyin.ToLower().Contains(q) || v.MeaningVi.ToLower().Contains(q));
        }

        var totalItems = await query.CountAsync(cancellationToken);
        var pageClamped = Math.Max(1, page);
        var pageSizeClamped = Math.Clamp(pageSize, 1, 100);

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
                MeaningVi = v.MeaningVi,
                MeaningEn = v.MeaningEn,
                PartOfSpeech = v.PartOfSpeech,
                AudioUrl = v.AudioUrl,
                ExamplesJson = v.ExamplesJson,
                Status = v.Status,
                LessonId = v.LessonId,
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
            MeaningVi = v.MeaningVi,
            MeaningEn = v.MeaningEn,
            PartOfSpeech = v.PartOfSpeech,
            AudioUrl = v.AudioUrl,
            ExamplesJson = v.ExamplesJson,
            Status = v.Status,
            LessonId = v.LessonId,
            CreatedAt = v.CreatedAt,
            UpdatedAt = v.UpdatedAt
        };
    }

    public async Task<VocabularyDto> CreateVocabularyAsync(CreateVocabularyDto dto, CancellationToken cancellationToken = default)
    {
        var v = new VocabularyEntity
        {
            HskLevel = dto.HskLevel,
            Hanzi = dto.Hanzi.Trim(),
            Traditional = dto.Traditional?.Trim(),
            Pinyin = dto.Pinyin.Trim(),
            MeaningVi = dto.MeaningVi.Trim(),
            MeaningEn = dto.MeaningEn?.Trim(),
            PartOfSpeech = dto.PartOfSpeech?.Trim(),
            AudioUrl = dto.AudioUrl?.Trim(),
            ExamplesJson = dto.ExamplesJson,
            Status = dto.Status,
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
            LessonId = v.LessonId,
            CreatedAt = v.CreatedAt,
            UpdatedAt = v.UpdatedAt
        };
    }

    public async Task<VocabularyDto?> UpdateVocabularyAsync(Guid id, UpdateVocabularyDto dto, CancellationToken cancellationToken = default)
    {
        var v = await _dbContext.Vocabularies.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (v == null) return null;

        v.HskLevel = dto.HskLevel;
        v.Hanzi = dto.Hanzi.Trim();
        v.Traditional = dto.Traditional?.Trim();
        v.Pinyin = dto.Pinyin.Trim();
        v.MeaningVi = dto.MeaningVi.Trim();
        v.MeaningEn = dto.MeaningEn?.Trim();
        v.PartOfSpeech = dto.PartOfSpeech?.Trim();
        v.AudioUrl = dto.AudioUrl?.Trim();
        v.ExamplesJson = dto.ExamplesJson;
        v.Status = dto.Status;
        v.LessonId = dto.LessonId;

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
            LessonId = v.LessonId,
            CreatedAt = v.CreatedAt,
            UpdatedAt = v.UpdatedAt
        };
    }

    public async Task<bool> DeleteVocabularyAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var v = await _dbContext.Vocabularies.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (v == null) return false;

        _dbContext.Vocabularies.Remove(v);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    #endregion

    #region Grammar

    public async Task<PagedResponse<GrammarPointDto>> GetGrammarPointsAsync(int? hskLevel = null, string? category = null, string? search = null, string? status = null, int page = 1, int pageSize = 20, bool publishedOnly = false, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.GrammarPoints.AsNoTracking().AsQueryable();

        if (publishedOnly)
        {
            query = query.Where(g => g.Status == "PUBLISHED");
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
        var pageSizeClamped = Math.Clamp(pageSize, 1, 100);

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
                LessonId = g.LessonId,
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
            LessonId = g.LessonId,
            CreatedAt = g.CreatedAt,
            UpdatedAt = g.UpdatedAt
        };
    }

    public async Task<GrammarPointDto> CreateGrammarPointAsync(CreateGrammarPointDto dto, CancellationToken cancellationToken = default)
    {
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
            LessonId = g.LessonId,
            CreatedAt = g.CreatedAt,
            UpdatedAt = g.UpdatedAt
        };
    }

    public async Task<GrammarPointDto?> UpdateGrammarPointAsync(Guid id, UpdateGrammarPointDto dto, CancellationToken cancellationToken = default)
    {
        var g = await _dbContext.GrammarPoints.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (g == null) return null;

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
            LessonId = g.LessonId,
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
        var pageSizeClamped = Math.Clamp(pageSize, 1, 100);

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

