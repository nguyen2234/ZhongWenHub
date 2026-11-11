using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Learning;
using ZhongWenHub.Business.Learning.DTOs;
using ZhongWenHub.Business.QuestionBank.DTOs;
using ZhongWenHub.Business.QuestionBank.Helpers;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Entities.Learning;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.QuestionBank;

public class QuestionBankService : IQuestionBankService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILearningService _learningService;

    public QuestionBankService(
        ApplicationDbContext dbContext,
        ILearningService learningService)
    {
        _dbContext = dbContext;
        _learningService = learningService;
    }

    public async Task<PagedResponse<QuestionBankItemDto>> GetQuestionBankAsync(
        int? hskLevel,
        string? skill,
        string? type,
        string? difficulty,
        string? status,
        string? reviewStatus,
        Guid? lessonId,
        Guid? grammarPointId,
        Guid? vocabularyId,
        string? tag,
        string? search,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Exercises.AsNoTracking().AsQueryable();

        if (hskLevel.HasValue && hskLevel.Value > 0)
            query = query.Where(e => e.HskLevel == hskLevel.Value);

        if (!string.IsNullOrWhiteSpace(skill) && !skill.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var normSkill = QuestionValidationHelper.NormalizeSkill(skill);
            query = query.Where(e => e.Skill == normSkill);
        }

        if (!string.IsNullOrWhiteSpace(type) && !type.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var normType = QuestionValidationHelper.NormalizeType(type);
            var trimmed = type.Trim().ToLowerInvariant();
            query = query.Where(e => e.Type == normType || e.Type == trimmed);
        }

        if (!string.IsNullOrWhiteSpace(difficulty) && !difficulty.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var normDiff = QuestionValidationHelper.NormalizeDifficulty(difficulty);
            query = query.Where(e => e.Difficulty == normDiff);
        }

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var normStatus = QuestionValidationHelper.NormalizeStatus(status);
            query = query.Where(e => e.Status == normStatus);
        }

        if (!string.IsNullOrWhiteSpace(reviewStatus) && !reviewStatus.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var normRev = QuestionValidationHelper.NormalizeReviewStatus(reviewStatus);
            query = query.Where(e => e.ReviewStatus == normRev);
        }

        if (lessonId.HasValue)
            query = query.Where(e => e.LessonId == lessonId.Value);

        if (grammarPointId.HasValue)
            query = query.Where(e => e.GrammarPointId == grammarPointId.Value);

        if (vocabularyId.HasValue)
            query = query.Where(e => e.VocabularyId == vocabularyId.Value);

        if (!string.IsNullOrWhiteSpace(tag))
        {
            var cleanTag = tag.Trim();
            query = query.Where(e => e.Tags != null && e.Tags.Contains(cleanTag));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(e =>
                e.Title.Contains(s) ||
                e.Instruction.Contains(s) ||
                (e.PromptHanzi != null && e.PromptHanzi.Contains(s)) ||
                (e.PromptVietnamese != null && e.PromptVietnamese.Contains(s)) ||
                (e.Tags != null && e.Tags.Contains(s)) ||
                (e.SourceId != null && e.SourceId.Contains(s)));
        }

        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 100);
        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(e => e.CreatedAt)
            .ThenBy(e => e.Id)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .Select(e => new QuestionBankItemDto
            {
                Id = e.Id,
                Type = e.Type,
                Skill = e.Skill,
                HskLevel = e.HskLevel,
                Difficulty = e.Difficulty,
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
                ReviewStatus = e.ReviewStatus,
                Tags = e.Tags,
                SourceId = e.SourceId,
                SourceLicense = e.SourceLicense,
                QualityScore = e.QualityScore,
                ContentHash = e.ContentHash,
                ReviewedByUserId = e.ReviewedByUserId,
                ReviewedAt = e.ReviewedAt,
                ReviewNotes = e.ReviewNotes,
                LessonId = e.LessonId,
                LessonTitle = e.Lesson != null ? e.Lesson.TitleVi : null,
                GrammarPointId = e.GrammarPointId,
                GrammarTitle = e.GrammarPoint != null ? e.GrammarPoint.Title : null,
                VocabularyId = e.VocabularyId,
                VocabularyHanzi = e.Vocabulary != null ? e.Vocabulary.Hanzi : null,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        foreach (var item in items)
        {
            item.Options = QuestionValidationHelper.ParseOptions(item.OptionsJson);
            item.HasSubstantiveExplanation = QuestionValidationHelper.HasSubstantiveExplanation(
                item.Explanation,
                item.CorrectAnswer);
            item.IsReported = !string.IsNullOrWhiteSpace(item.Tags) &&
                item.Tags.Contains("reported-issue", StringComparison.OrdinalIgnoreCase);
        }

        return new PagedResponse<QuestionBankItemDto>(items, total, safePage, safePageSize);
    }

    public async Task<QuestionBankItemDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var e = await _dbContext.Exercises
            .AsNoTracking()
            .Include(x => x.Lesson)
            .Include(x => x.GrammarPoint)
            .Include(x => x.Vocabulary)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        return e == null ? null : MapToDto(e);
    }

    public async Task<QuestionBankItemDto> CreateAsync(CreateQuestionBankItemDto dto, CancellationToken cancellationToken = default)
    {
        var optionsJson = ResolveOptionsJson(dto.OptionsJson, dto.Options);
        var validation = QuestionValidationHelper.ValidateQuestion(
            dto.Type, dto.Skill, dto.HskLevel, dto.Difficulty,
            dto.Title, dto.Instruction, dto.PromptHanzi, dto.PromptPinyin,
            dto.PromptVietnamese, dto.AudioUrl, optionsJson, dto.CorrectOptionIndex,
            dto.CorrectAnswer, dto.Explanation, dto.Tags);

        if (!validation.IsValid)
        {
            throw new ArgumentException(string.Join(" ", validation.Errors));
        }

        var desiredStatus = QuestionValidationHelper.NormalizeStatus(dto.Status, "DRAFT");
        // Staff-authored creation allows DRAFT/PENDING_REVIEW/PUBLISHED, keeping review audit coherent
        var reviewStatus = desiredStatus == "PUBLISHED" ? "APPROVED" : "DRAFT";

        var entity = new ExerciseEntity
        {
            Type = validation.NormalizedType,
            Skill = validation.NormalizedSkill,
            HskLevel = dto.HskLevel,
            Difficulty = validation.NormalizedDifficulty,
            Title = dto.Title.Trim(),
            Instruction = dto.Instruction.Trim(),
            PromptHanzi = dto.PromptHanzi?.Trim(),
            PromptPinyin = dto.PromptPinyin?.Trim(),
            PromptVietnamese = dto.PromptVietnamese?.Trim(),
            AudioUrl = dto.AudioUrl?.Trim(),
            OptionsJson = optionsJson,
            CorrectOptionIndex = validation.NormalizedCorrectOptionIndex,
            CorrectAnswer = validation.NormalizedCorrectAnswer,
            Explanation = dto.Explanation?.Trim(),
            XpReward = Math.Clamp(dto.XpReward, 5, 100),
            Status = desiredStatus,
            ReviewStatus = reviewStatus,
            Tags = NormalizeTags(dto.Tags),
            SourceId = string.IsNullOrWhiteSpace(dto.SourceId) ? "cms-manual" : dto.SourceId.Trim(),
            SourceLicense = string.IsNullOrWhiteSpace(dto.SourceLicense) ? "INTERNAL_AUTHORED" : dto.SourceLicense.Trim(),
            QualityScore = validation.QualityScore,
            ContentHash = validation.ContentHash,
            LessonId = dto.LessonId,
            GrammarPointId = dto.GrammarPointId,
            VocabularyId = dto.VocabularyId
        };

        _dbContext.Exercises.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(entity.Id, cancellationToken) ?? MapToDto(entity);
    }

    public async Task<QuestionBankItemDto?> UpdateAsync(Guid id, UpdateQuestionBankItemDto dto, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.Exercises.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity == null) return null;

        var optionsJson = ResolveOptionsJson(dto.OptionsJson, dto.Options);
        var validation = QuestionValidationHelper.ValidateQuestion(
            dto.Type, dto.Skill, dto.HskLevel, dto.Difficulty,
            dto.Title, dto.Instruction, dto.PromptHanzi, dto.PromptPinyin,
            dto.PromptVietnamese, dto.AudioUrl, optionsJson, dto.CorrectOptionIndex,
            dto.CorrectAnswer, dto.Explanation, dto.Tags);

        if (!validation.IsValid)
        {
            throw new ArgumentException(string.Join(" ", validation.Errors));
        }

        entity.Type = validation.NormalizedType;
        entity.Skill = validation.NormalizedSkill;
        entity.HskLevel = dto.HskLevel;
        entity.Difficulty = validation.NormalizedDifficulty;
        entity.Title = dto.Title.Trim();
        entity.Instruction = dto.Instruction.Trim();
        entity.PromptHanzi = dto.PromptHanzi?.Trim();
        entity.PromptPinyin = dto.PromptPinyin?.Trim();
        entity.PromptVietnamese = dto.PromptVietnamese?.Trim();
        entity.AudioUrl = dto.AudioUrl?.Trim();
        entity.OptionsJson = optionsJson;
        entity.CorrectOptionIndex = validation.NormalizedCorrectOptionIndex;
        entity.CorrectAnswer = validation.NormalizedCorrectAnswer;
        entity.Explanation = dto.Explanation?.Trim();
        entity.XpReward = Math.Clamp(dto.XpReward, 5, 100);
        entity.Tags = NormalizeTags(dto.Tags);
        if (!string.IsNullOrWhiteSpace(dto.SourceId)) entity.SourceId = dto.SourceId.Trim();
        if (!string.IsNullOrWhiteSpace(dto.SourceLicense)) entity.SourceLicense = dto.SourceLicense.Trim();
        entity.QualityScore = validation.QualityScore;
        entity.ContentHash = validation.ContentHash;
        entity.LessonId = dto.LessonId;
        entity.GrammarPointId = dto.GrammarPointId;
        entity.VocabularyId = dto.VocabularyId;

        var requestedStatus = QuestionValidationHelper.NormalizeStatus(dto.Status, entity.Status);
        if (requestedStatus == "PUBLISHED")
        {
            if (!QuestionValidationHelper.IsPublishQualified(validation, entity.Explanation, entity.CorrectAnswer, out var reason))
            {
                throw new ArgumentException(reason);
            }
            if (entity.ReviewStatus != "APPROVED")
            {
                entity.ReviewStatus = "APPROVED";
            }
        }
        entity.Status = requestedStatus;
        entity.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(entity.Id, cancellationToken) ?? MapToDto(entity);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.Exercises.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity == null) return false;

        var usedInExam = await _dbContext.ExamQuestions.AnyAsync(q => q.ExerciseId == id, cancellationToken);
        if (usedInExam)
        {
            throw new InvalidOperationException("Không thể xóa câu hỏi đang thuộc đề thi trong Kho đề thi. Vui lòng chuyển sang lưu trữ (ARCHIVED).");
        }

        _dbContext.Exercises.Remove(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<QuestionBankStatsDto> GetStatsAsync(CancellationToken cancellationToken = default)
    {
        var total = await _dbContext.Exercises.CountAsync(cancellationToken);
        var published = await _dbContext.Exercises.CountAsync(e => e.Status == "PUBLISHED", cancellationToken);
        var draft = await _dbContext.Exercises.CountAsync(e => e.Status == "DRAFT", cancellationToken);
        var archived = await _dbContext.Exercises.CountAsync(e => e.Status == "ARCHIVED", cancellationToken);
        var pendingReview = await _dbContext.Exercises.CountAsync(e => e.ReviewStatus == "PENDING_REVIEW", cancellationToken);
        var validatedReview = await _dbContext.Exercises.CountAsync(e => e.ReviewStatus == "VALIDATED", cancellationToken);
        var needsAcademicReview = await _dbContext.Exercises.CountAsync(e => e.ReviewStatus == "NEEDS_ACADEMIC_REVIEW", cancellationToken);
        var approvedReview = await _dbContext.Exercises.CountAsync(e => e.ReviewStatus == "APPROVED", cancellationToken);
        var rejectedReview = await _dbContext.Exercises.CountAsync(e => e.ReviewStatus == "REJECTED", cancellationToken);
        var reportedCount = await _dbContext.Exercises.CountAsync(e => e.Tags != null && e.Tags.Contains("reported-issue"), cancellationToken);
        var withSubstantiveExp = await _dbContext.Exercises.CountAsync(
            e => e.Explanation != null &&
                 e.Explanation.Trim().Length >= 24 &&
                 !(e.Explanation.Trim().Length < 70 &&
                   (e.Explanation.StartsWith("Đáp án đúng là '") ||
                    e.Explanation.StartsWith("Đáp án đúng:") ||
                    e.Explanation.StartsWith("Chữ Hán đúng là '"))),
            cancellationToken);
        var linkedToLessons = await _dbContext.Exercises.CountAsync(e => e.LessonId != null, cancellationToken);

        var byHskList = await _dbContext.Exercises
            .GroupBy(e => e.HskLevel)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);
        var byHsk = byHskList.ToDictionary(x => x.Key, x => x.Count);
        for (var i = 1; i <= 4; i++)
        {
            if (!byHsk.ContainsKey(i)) byHsk[i] = 0;
        }

        var bySkillList = await _dbContext.Exercises
            .GroupBy(e => e.Skill)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var byTypeList = await _dbContext.Exercises
            .GroupBy(e => e.Type)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var byDiffList = await _dbContext.Exercises
            .GroupBy(e => e.Difficulty)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var byReviewList = await _dbContext.Exercises
            .GroupBy(e => e.ReviewStatus)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        return new QuestionBankStatsDto
        {
            Total = total,
            Published = published,
            Draft = draft,
            PendingReview = pendingReview,
            ValidatedReview = validatedReview,
            NeedsAcademicReview = needsAcademicReview,
            ApprovedReview = approvedReview,
            RejectedReview = rejectedReview,
            Archived = archived,
            WithSubstantiveExplanation = withSubstantiveExp,
            ReportedCount = reportedCount,
            LinkedToLessons = linkedToLessons,
            StandaloneBank = total - linkedToLessons,
            ByHsk = byHsk,
            BySkill = bySkillList.ToDictionary(x => x.Key, x => x.Count),
            ByType = byTypeList.ToDictionary(x => x.Key, x => x.Count),
            ByDifficulty = byDiffList.ToDictionary(x => x.Key, x => x.Count),
            ByReviewStatus = byReviewList.ToDictionary(x => x.Key, x => x.Count)
        };
    }

    public async Task<CheckDuplicatesResultDto> CheckDuplicatesAsync(
        CheckDuplicatesRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var hash = QuestionValidationHelper.ComputeContentHash(
            dto.HskLevel,
            dto.Type,
            dto.PromptHanzi,
            dto.PromptVietnamese,
            dto.CorrectAnswer);

        var hashMatches = await _dbContext.Exercises
            .AsNoTracking()
            .Where(e => e.ContentHash == hash && (!dto.ExcludeId.HasValue || e.Id != dto.ExcludeId.Value))
            .Take(10)
            .Select(e => new DuplicateMatchDto
            {
                Id = e.Id,
                Title = e.Title,
                HskLevel = e.HskLevel,
                Type = e.Type,
                Status = e.Status,
                ReviewStatus = e.ReviewStatus,
                PromptHanzi = e.PromptHanzi,
                MatchReason = "CONTENT_HASH_EXACT"
            })
            .ToListAsync(cancellationToken);

        if (hashMatches.Count == 0 && !string.IsNullOrWhiteSpace(dto.PromptHanzi))
        {
            var trimmedHanzi = dto.PromptHanzi.Trim();
            var normPrompt = QuestionValidationHelper.NormalizeAnswerText(trimmedHanzi);
            var normAns = QuestionValidationHelper.NormalizeAnswerText(dto.CorrectAnswer);

            var candidates = await _dbContext.Exercises
                .AsNoTracking()
                .Where(e => e.HskLevel == dto.HskLevel
                    && e.PromptHanzi != null
                    && (!dto.ExcludeId.HasValue || e.Id != dto.ExcludeId.Value)
                    && (e.PromptHanzi == trimmedHanzi || (e.PromptHanzi.Length > 4 && e.PromptHanzi.Contains(trimmedHanzi))))
                .Take(25)
                .ToListAsync(cancellationToken);

            foreach (var c in candidates)
            {
                if (QuestionValidationHelper.NormalizeAnswerText(c.PromptHanzi) == normPrompt &&
                    QuestionValidationHelper.NormalizeAnswerText(c.CorrectAnswer) == normAns)
                {
                    hashMatches.Add(new DuplicateMatchDto
                    {
                        Id = c.Id,
                        Title = c.Title,
                        HskLevel = c.HskLevel,
                        Type = c.Type,
                        Status = c.Status,
                        ReviewStatus = c.ReviewStatus,
                        PromptHanzi = c.PromptHanzi,
                        MatchReason = "NORMALIZED_PROMPT_ANSWER"
                    });
                }
            }
        }

        return new CheckDuplicatesResultDto
        {
            HasDuplicates = hashMatches.Count > 0,
            ContentHash = hash,
            Matches = hashMatches
        };
    }

    public async Task<ImportQuestionsResultDto> ImportQuestionsAsync(
        ImportQuestionsRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var result = new ImportQuestionsResultDto
        {
            DryRun = dto.DryRun,
            TotalReceived = dto.Items.Count
        };

        if (dto.Items.Count == 0)
        {
            return result;
        }

        // Load existing content hashes from DB + legacy normalized keys for fast O(1) dedup
        var existingHashes = new HashSet<string>(
            await _dbContext.Exercises
                .AsNoTracking()
                .Where(e => e.ContentHash != null)
                .Select(e => e.ContentHash!)
                .ToListAsync(cancellationToken),
            StringComparer.OrdinalIgnoreCase);

        var legacyKeyRows = await _dbContext.Exercises
            .AsNoTracking()
            .Where(e => e.ContentHash == null)
            .Select(e => new { e.HskLevel, e.Type, e.PromptHanzi, e.PromptVietnamese, e.CorrectAnswer })
            .ToListAsync(cancellationToken);

        foreach (var row in legacyKeyRows)
        {
            existingHashes.Add(QuestionValidationHelper.ComputeContentHash(
                row.HskLevel, row.Type, row.PromptHanzi, row.PromptVietnamese, row.CorrectAnswer));
        }

        var batchEntities = new List<ExerciseEntity>();

        for (var i = 0; i < dto.Items.Count; i++)
        {
            var item = dto.Items[i];
            var optionsJson = ResolveOptionsJson(item.OptionsJson, item.Options);
            var val = QuestionValidationHelper.ValidateQuestion(
                item.Type,
                item.Skill,
                item.HskLevel,
                item.Difficulty,
                item.Title,
                item.Instruction,
                item.PromptHanzi,
                item.PromptPinyin,
                item.PromptVietnamese,
                item.AudioUrl,
                optionsJson,
                item.CorrectOptionIndex,
                item.CorrectAnswer,
                item.Explanation,
                item.Tags);

            if (!val.IsValid)
            {
                result.RejectedCount++;
                result.Rejections.Add(new ImportItemRejectionDto
                {
                    Index = i,
                    Title = item.Title,
                    Reason = string.Join(" ", val.Errors)
                });
                continue;
            }

            if (existingHashes.Contains(val.ContentHash))
            {
                result.DuplicateSkippedCount++;
                continue;
            }

            existingHashes.Add(val.ContentHash);

            // Imported items ALWAYS enter moderation queue as DRAFT + PENDING_REVIEW.
            var entity = new ExerciseEntity
            {
                Id = Guid.NewGuid(),
                Type = val.NormalizedType,
                Skill = val.NormalizedSkill,
                HskLevel = item.HskLevel,
                Difficulty = val.NormalizedDifficulty,
                Title = item.Title.Trim(),
                Instruction = item.Instruction.Trim(),
                PromptHanzi = item.PromptHanzi?.Trim(),
                PromptPinyin = item.PromptPinyin?.Trim(),
                PromptVietnamese = item.PromptVietnamese?.Trim(),
                AudioUrl = item.AudioUrl?.Trim(),
                OptionsJson = optionsJson,
                CorrectOptionIndex = val.NormalizedCorrectOptionIndex,
                CorrectAnswer = val.NormalizedCorrectAnswer,
                Explanation = item.Explanation?.Trim(),
                XpReward = Math.Clamp(item.XpReward, 5, 100),
                Status = "DRAFT",
                ReviewStatus = "PENDING_REVIEW",
                Tags = NormalizeTags(item.Tags),
                SourceId = string.IsNullOrWhiteSpace(item.SourceId)
                    ? (dto.DefaultSourceId?.Trim() ?? "external-import")
                    : item.SourceId.Trim(),
                SourceLicense = string.IsNullOrWhiteSpace(item.SourceLicense)
                    ? (dto.DefaultSourceLicense?.Trim() ?? "UNSPECIFIED")
                    : item.SourceLicense.Trim(),
                QualityScore = val.QualityScore,
                ContentHash = val.ContentHash,
                LessonId = item.LessonId,
                GrammarPointId = item.GrammarPointId,
                VocabularyId = item.VocabularyId
            };

            batchEntities.Add(entity);
            result.ImportedCount++;
            result.ImportedIds.Add(entity.Id);
        }

        if (!dto.DryRun && batchEntities.Count > 0)
        {
            _dbContext.Exercises.AddRange(batchEntities);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return result;
    }

    public async Task<List<QuestionBankItemDto>> ExportQuestionsAsync(
        int? hskLevel,
        string? skill,
        string? status,
        string? reviewStatus,
        int limit = 1000,
        CancellationToken cancellationToken = default)
    {
        var page = await GetQuestionBankAsync(
            hskLevel, skill, null, null, status, reviewStatus,
            null, null, null, null, null,
            page: 1,
            pageSize: Math.Clamp(limit, 1, 5000),
            cancellationToken: cancellationToken);

        return page.Items.ToList();
    }

    public async Task<GenerateQuestionsResultDto> GenerateQuestionsAsync(
        GenerateQuestionsRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var hsk = Math.Clamp(dto.HskLevel, 1, 4);
        var normType = QuestionValidationHelper.NormalizeType(dto.Type);
        var normSkill = QuestionValidationHelper.NormalizeSkill(dto.Skill);
        var normDiff = QuestionValidationHelper.NormalizeDifficulty(dto.Difficulty, hsk);
        var count = Math.Clamp(dto.Count, 1, 30);

        var result = new GenerateQuestionsResultDto
        {
            DryRun = dto.DryRun,
            RequestedCount = count,
            GeneratorMode = "DETERMINISTIC_SYLLABUS"
        };

        var existingHashes = new HashSet<string>(
            await _dbContext.Exercises
                .AsNoTracking()
                .Where(e => e.HskLevel == hsk && e.ContentHash != null)
                .Select(e => e.ContentHash!)
                .ToListAsync(cancellationToken),
            StringComparer.OrdinalIgnoreCase);

        // Fetch verified syllabus vocab & grammar for the target HSK level
        var vocabsQuery = _dbContext.Vocabularies.AsNoTracking().Where(v => v.HskLevel == hsk && v.Status == "PUBLISHED");
        if (dto.LessonId.HasValue)
        {
            var lessonVocabIds = await _dbContext.Vocabularies
                .AsNoTracking()
                .Where(v => v.LessonId == dto.LessonId.Value)
                .OrderBy(v => v.Hanzi)
                .ToListAsync(cancellationToken);
            if (lessonVocabIds.Count >= 4)
            {
                vocabsQuery = _dbContext.Vocabularies.AsNoTracking().Where(v => v.LessonId == dto.LessonId.Value);
            }
        }

        var vocabs = await vocabsQuery
            .Where(v => !string.IsNullOrWhiteSpace(v.Hanzi) && !string.IsNullOrWhiteSpace(v.MeaningVi))
            .OrderBy(v => v.Id)
            .Take(250)
            .ToListAsync(cancellationToken);

        var grammars = await _dbContext.GrammarPoints
            .AsNoTracking()
            .Where(g => g.HskLevel == hsk && (!dto.GrammarPointId.HasValue || g.Id == dto.GrammarPointId.Value))
            .OrderBy(g => g.Id)
            .Take(50)
            .ToListAsync(cancellationToken);

        var candidates = BuildGeneratedCandidates(hsk, normSkill, normType, normDiff, count, dto.LessonId, dto.GrammarPointId, vocabs, grammars);
        var entities = new List<ExerciseEntity>();

        foreach (var cand in candidates)
        {
            var optionsJson = ResolveOptionsJson(cand.OptionsJson, cand.Options);
            var val = QuestionValidationHelper.ValidateQuestion(
                cand.Type, cand.Skill, cand.HskLevel, cand.Difficulty,
                cand.Title, cand.Instruction, cand.PromptHanzi, cand.PromptPinyin,
                cand.PromptVietnamese, cand.AudioUrl, optionsJson, cand.CorrectOptionIndex,
                cand.CorrectAnswer, cand.Explanation, cand.Tags);

            if (!val.IsValid)
            {
                result.ValidationRejectedCount++;
                continue;
            }

            if (existingHashes.Contains(val.ContentHash))
            {
                result.DuplicateSkippedCount++;
                continue;
            }

            existingHashes.Add(val.ContentHash);

            // Safety gate: AI / generated questions NEVER auto-publish!
            var entity = new ExerciseEntity
            {
                Id = Guid.NewGuid(),
                Type = val.NormalizedType,
                Skill = val.NormalizedSkill,
                HskLevel = cand.HskLevel,
                Difficulty = val.NormalizedDifficulty,
                Title = cand.Title.Trim(),
                Instruction = cand.Instruction.Trim(),
                PromptHanzi = cand.PromptHanzi?.Trim(),
                PromptPinyin = cand.PromptPinyin?.Trim(),
                PromptVietnamese = cand.PromptVietnamese?.Trim(),
                OptionsJson = optionsJson,
                CorrectOptionIndex = val.NormalizedCorrectOptionIndex,
                CorrectAnswer = val.NormalizedCorrectAnswer,
                Explanation = cand.Explanation?.Trim(),
                XpReward = 10,
                Status = "DRAFT",
                ReviewStatus = "PENDING_REVIEW",
                Tags = NormalizeTags(cand.Tags),
                SourceId = "ai-syllabus-generator",
                SourceLicense = "INTERNAL_GENERATED_REVIEW_REQUIRED",
                QualityScore = val.QualityScore,
                ContentHash = val.ContentHash,
                LessonId = cand.LessonId,
                GrammarPointId = cand.GrammarPointId,
                VocabularyId = cand.VocabularyId
            };

            entities.Add(entity);
            result.PreviewItems.Add(MapToDto(entity));
            result.GeneratedCount++;
            if (entities.Count >= count) break;
        }

        if (!dto.DryRun && entities.Count > 0)
        {
            _dbContext.Exercises.AddRange(entities);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return result;
    }

    public async Task<QuestionBankItemDto?> ReviewAsync(
        Guid id,
        Guid reviewerId,
        ReviewQuestionRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.Exercises.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity == null) return null;

        var decision = QuestionValidationHelper.NormalizeReviewStatus(dto.Decision, "PENDING_REVIEW");

        if (decision is "APPROVED" or "VALIDATED" || dto.PublishImmediately)
        {
            var val = QuestionValidationHelper.ValidateQuestion(
                entity.Type, entity.Skill, entity.HskLevel, entity.Difficulty,
                entity.Title, entity.Instruction, entity.PromptHanzi, entity.PromptPinyin,
                entity.PromptVietnamese, entity.AudioUrl, entity.OptionsJson, entity.CorrectOptionIndex,
                entity.CorrectAnswer, entity.Explanation, entity.Tags);

            if (!val.IsValid)
            {
                throw new ArgumentException($"Câu hỏi chưa đạt chuẩn kiểm duyệt: {string.Join(" ", val.Errors)}");
            }

            if (dto.PublishImmediately &&
                !QuestionValidationHelper.IsPublishQualified(val, entity.Explanation, entity.CorrectAnswer, out var publishReason))
            {
                throw new ArgumentException(publishReason);
            }

            entity.QualityScore = val.QualityScore;
            entity.ContentHash ??= val.ContentHash;
        }

        entity.ReviewStatus = decision;
        entity.ReviewedByUserId = reviewerId;
        entity.ReviewedAt = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(dto.ReviewNotes))
        {
            entity.ReviewNotes = dto.ReviewNotes.Trim();
        }

        if (decision is "REJECTED" or "NEEDS_ACADEMIC_REVIEW")
        {
            if (entity.LessonId == null || decision == "REJECTED")
            {
                entity.Status = "DRAFT";
            }
        }
        else if (decision == "APPROVED" && dto.PublishImmediately)
        {
            entity.Status = "PUBLISHED";
        }

        entity.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<BatchActionResultDto> BatchReviewAsync(
        Guid reviewerId,
        BatchReviewQuestionsRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var res = new BatchActionResultDto { RequestedCount = dto.QuestionIds.Count };
        foreach (var id in dto.QuestionIds.Distinct())
        {
            try
            {
                var updated = await ReviewAsync(id, reviewerId, new ReviewQuestionRequestDto
                {
                    Decision = dto.Decision,
                    ReviewNotes = dto.ReviewNotes,
                    PublishImmediately = dto.PublishImmediately
                }, cancellationToken);

                if (updated != null) res.UpdatedCount++;
                else res.SkippedCount++;
            }
            catch (Exception ex)
            {
                res.SkippedCount++;
                res.Errors.Add($"{id}: {ex.Message}");
            }
        }
        return res;
    }

    public async Task<QuestionBankItemDto?> PublishAsync(
        Guid id,
        Guid reviewerId,
        CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.Exercises.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity == null) return null;

        if (!string.Equals(entity.ReviewStatus, "APPROVED", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Câu hỏi phải được duyệt (ReviewStatus = APPROVED) trước khi xuất bản (PUBLISHED).");
        }

        var val = QuestionValidationHelper.ValidateQuestion(
            entity.Type, entity.Skill, entity.HskLevel, entity.Difficulty,
            entity.Title, entity.Instruction, entity.PromptHanzi, entity.PromptPinyin,
            entity.PromptVietnamese, entity.AudioUrl, entity.OptionsJson, entity.CorrectOptionIndex,
            entity.CorrectAnswer, entity.Explanation, entity.Tags);

        if (!QuestionValidationHelper.IsPublishQualified(val, entity.Explanation, entity.CorrectAnswer, out var publishReason))
        {
            throw new InvalidOperationException(publishReason);
        }

        entity.Status = "PUBLISHED";
        entity.QualityScore = val.QualityScore;
        entity.ReviewedByUserId ??= reviewerId;
        entity.ReviewedAt ??= DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<BatchActionResultDto> BatchPublishAsync(
        Guid reviewerId,
        List<Guid> questionIds,
        CancellationToken cancellationToken = default)
    {
        var res = new BatchActionResultDto { RequestedCount = questionIds.Count };
        foreach (var id in questionIds.Distinct())
        {
            try
            {
                var updated = await PublishAsync(id, reviewerId, cancellationToken);
                if (updated != null) res.UpdatedCount++;
                else res.SkippedCount++;
            }
            catch (Exception ex)
            {
                res.SkippedCount++;
                res.Errors.Add($"{id}: {ex.Message}");
            }
        }
        return res;
    }

    public async Task<ReportQuestionResultDto?> ReportQuestionAsync(
        Guid id,
        Guid reporterUserId,
        ReportQuestionRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.Exercises.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity == null) return null;

        var existingTags = (entity.Tags ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();
        if (!existingTags.Any(t => string.Equals(t, "reported-issue", StringComparison.OrdinalIgnoreCase)))
        {
            existingTags.Add("reported-issue");
        }
        entity.Tags = string.Join(",", existingTags);

        var detailPart = string.IsNullOrWhiteSpace(dto.Details) ? string.Empty : $" — {dto.Details.Trim()}";
        var noteLine = $"[Reported {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC by {reporterUserId:N}] {dto.Reason.Trim()}{detailPart}";
        entity.ReviewNotes = string.IsNullOrWhiteSpace(entity.ReviewNotes)
            ? noteLine
            : $"{noteLine}\n{entity.ReviewNotes}";
        if (entity.ReviewNotes.Length > 1900)
        {
            entity.ReviewNotes = entity.ReviewNotes[..1900];
        }

        // Only move standalone bank items back to NEEDS_ACADEMIC_REVIEW; keep published lesson items flagged without breaking curriculum.
        if (entity.LessonId == null)
        {
            entity.ReviewStatus = "NEEDS_ACADEMIC_REVIEW";
        }
        entity.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new ReportQuestionResultDto
        {
            QuestionId = entity.Id,
            ReviewStatus = entity.ReviewStatus,
            Tags = entity.Tags ?? string.Empty,
            Message = "Đã ghi nhận báo cáo lỗi câu hỏi và chuyển vào hàng đợi kiểm duyệt học thuật."
        };
    }

    // =========================================================================
    // Adaptive Learning & Student Practice Sessions
    // =========================================================================

    public async Task<AdaptiveRecommendationsResponseDto> GetAdaptiveRecommendationsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var publishedQuery = _dbContext.Exercises
            .AsNoTracking()
            .Where(e => e.Status == "PUBLISHED");

        var totalPublished = await publishedQuery.CountAsync(cancellationToken);
        var byHsk = await publishedQuery
            .GroupBy(e => e.HskLevel)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count, cancellationToken);

        var bySkill = await publishedQuery
            .GroupBy(e => e.Skill)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count, cancellationToken);

        var byDiff = await publishedQuery
            .GroupBy(e => e.Difficulty)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count, cancellationToken);

        var recentAttempts = await _dbContext.StudentPracticeAttempts
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.AttemptedAt)
            .Take(300)
            .ToListAsync(cancellationToken);

        var weakAreas = BuildWeakAreas(recentAttempts);
        var (skillStats, hskStats, grammarStats) = await BuildAnalyticsBucketsAsync(recentAttempts, cancellationToken);
        var mistakeCount = recentAttempts
            .Where(a => !a.IsCorrect)
            .Select(a => a.ExerciseId)
            .Distinct()
            .Count();

        return new AdaptiveRecommendationsResponseDto
        {
            TotalPublishedQuestions = totalPublished,
            PublishedByHsk = byHsk,
            PublishedBySkill = bySkill,
            PublishedByDifficulty = byDiff,
            MistakeReviewCount = mistakeCount,
            WeakAreas = weakAreas,
            SkillStats = skillStats,
            HskStats = hskStats,
            GrammarStats = grammarStats
        };
    }

    public async Task<PracticeSessionDto> CreatePracticeSessionAsync(
        Guid userId,
        CreatePracticeSessionRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var count = Math.Clamp(dto.QuestionCount, 1, 30);
        var mode = string.IsNullOrWhiteSpace(dto.Mode) ? "random" : dto.Mode.Trim().ToLowerInvariant();
        var normSkill = !string.IsNullOrWhiteSpace(dto.Skill) && !dto.Skill.Equals("ALL", StringComparison.OrdinalIgnoreCase)
            ? QuestionValidationHelper.NormalizeSkill(dto.Skill)
            : null;
        var normDiff = !string.IsNullOrWhiteSpace(dto.Difficulty) && !dto.Difficulty.Equals("ALL", StringComparison.OrdinalIgnoreCase)
            ? QuestionValidationHelper.NormalizeDifficulty(dto.Difficulty)
            : null;

        // 1. Gather user's attempt history + last 5 sessions to prevent back-to-back repetition
        var attempts = await _dbContext.StudentPracticeAttempts
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.AttemptedAt)
            .Take(300)
            .ToListAsync(cancellationToken);

        var recentSessionPayloads = await _dbContext.QuestionBankPracticeSessions
            .AsNoTracking()
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.StartedAt)
            .Take(5)
            .Select(s => s.ExerciseIdsJson)
            .ToListAsync(cancellationToken);

        var lastSessionIds = new HashSet<Guid>();
        var recentSessionIds = new HashSet<Guid>();
        for (var sIdx = 0; sIdx < recentSessionPayloads.Count; sIdx++)
        {
            try
            {
                var ids = JsonSerializer.Deserialize<List<Guid>>(recentSessionPayloads[sIdx]) ?? [];
                foreach (var qid in ids)
                {
                    if (sIdx == 0) lastSessionIds.Add(qid);
                    else recentSessionIds.Add(qid);
                }
            }
            catch
            {
                // ignore malformed session id cache
            }
        }

        var weakAreas = BuildWeakAreas(attempts);
        var weakSkills = weakAreas
            .Select(w => w.RecommendedSkill)
            .Where(s => !string.IsNullOrEmpty(s))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var weakKnowledgeIds = weakAreas
            .Select(w => w.Key)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        // Most recent outcome per exercise so mastered mistakes cool down while unresolved mistakes stay prioritized
        var latestAttemptByEx = new Dictionary<Guid, StudentPracticeAttempt>();
        foreach (var att in attempts)
        {
            if (Guid.TryParse(att.ExerciseId, out var exGuid) && !latestAttemptByEx.ContainsKey(exGuid))
            {
                latestAttemptByEx[exGuid] = att;
            }
        }

        var wrongExerciseIds = latestAttemptByEx
            .Where(kv => !kv.Value.IsCorrect)
            .Select(kv => kv.Key)
            .ToHashSet();

        var dueReviewCutoff = DateTime.UtcNow.AddDays(-3);
        var dueReviewExerciseIds = latestAttemptByEx
            .Where(kv => kv.Value.AttemptedAt <= dueReviewCutoff)
            .Select(kv => kv.Key)
            .ToHashSet();

        var attemptedExerciseIds = latestAttemptByEx.Keys.ToHashSet();
        var preferredDifficulty = ResolveAdaptiveDifficulty(attempts, dto.HskLevel);

        var dueVocabHanzi = await _dbContext.StudentVocabularyProgresses
            .AsNoTracking()
            .Where(v => v.UserId == userId && v.NextReviewAt <= DateTime.UtcNow && v.Hanzi != null)
            .Select(v => v.Hanzi!)
            .Take(40)
            .ToListAsync(cancellationToken);

        // 2. Query ONLY PUBLISHED candidates cleanly using index-friendly projection (bounded pool <= 400)
        var candidateQuery = _dbContext.Exercises
            .AsNoTracking()
            .Where(e => e.Status == "PUBLISHED");

        if (dto.HskLevel.HasValue && dto.HskLevel.Value is >= 1 and <= 4)
        {
            candidateQuery = candidateQuery.Where(e => e.HskLevel == dto.HskLevel.Value);
        }

        if (normSkill != null)
        {
            candidateQuery = candidateQuery.Where(e => e.Skill == normSkill);
        }

        if (normDiff != null)
        {
            candidateQuery = candidateQuery.Where(e => e.Difficulty == normDiff);
        }

        if (mode == "mistake-review" && wrongExerciseIds.Count > 0)
        {
            var mistakePool = await candidateQuery
                .Where(e => wrongExerciseIds.Contains(e.Id))
                .Select(e => new CandidateMeta(e.Id, e.HskLevel, e.Skill, e.Difficulty, e.GrammarPointId, e.VocabularyId, e.PromptHanzi))
                .Take(200)
                .ToListAsync(cancellationToken);

            if (mistakePool.Count >= count)
            {
                return await PersistAndMaterializeSessionAsync(
                    userId, dto.HskLevel, normSkill, normDiff, mode,
                    SelectCandidatesWithReasons(
                        mistakePool, count, mode, weakSkills, weakKnowledgeIds,
                        wrongExerciseIds, dueReviewExerciseIds, attemptedExerciseIds,
                        lastSessionIds, recentSessionIds, dueVocabHanzi, preferredDifficulty),
                    cancellationToken);
            }
        }

        var pool = await candidateQuery
            .OrderByDescending(e => e.QualityScore ?? 80.0)
            .ThenBy(e => e.Id)
            .Select(e => new CandidateMeta(e.Id, e.HskLevel, e.Skill, e.Difficulty, e.GrammarPointId, e.VocabularyId, e.PromptHanzi))
            .Take(400)
            .ToListAsync(cancellationToken);

        // Relax difficulty filter gracefully if specific HSK+Skill+Difficulty combination is too sparse
        if (pool.Count == 0 && normDiff != null)
        {
            var relaxedQuery = _dbContext.Exercises.AsNoTracking().Where(e => e.Status == "PUBLISHED");
            if (dto.HskLevel.HasValue && dto.HskLevel.Value is >= 1 and <= 4)
                relaxedQuery = relaxedQuery.Where(e => e.HskLevel == dto.HskLevel.Value);
            if (normSkill != null)
                relaxedQuery = relaxedQuery.Where(e => e.Skill == normSkill);

            pool = await relaxedQuery
                .OrderByDescending(e => e.QualityScore ?? 80.0)
                .Select(e => new CandidateMeta(e.Id, e.HskLevel, e.Skill, e.Difficulty, e.GrammarPointId, e.VocabularyId, e.PromptHanzi))
                .Take(400)
                .ToListAsync(cancellationToken);
        }

        if (pool.Count == 0)
        {
            throw new InvalidOperationException("Chưa có câu hỏi đã xuất bản phù hợp với bộ lọc đã chọn.");
        }

        var useAdaptiveWeighting = mode is "weakness" or "adaptive" or "mistake-review" || dto.PrioritizeWeakness;
        var picked = SelectCandidatesWithReasons(
            pool,
            count,
            useAdaptiveWeighting ? "weakness" : mode,
            weakSkills,
            weakKnowledgeIds,
            wrongExerciseIds,
            dueReviewExerciseIds,
            attemptedExerciseIds,
            lastSessionIds,
            recentSessionIds,
            dueVocabHanzi,
            preferredDifficulty);

        return await PersistAndMaterializeSessionAsync(
            userId, dto.HskLevel, normSkill, normDiff, mode, picked, cancellationToken);
    }

    public async Task<PracticeSessionDto?> GetPracticeSessionAsync(
        Guid userId,
        Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        var session = await _dbContext.QuestionBankPracticeSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken);

        if (session == null) return null;

        var exerciseIds = JsonSerializer.Deserialize<List<Guid>>(session.ExerciseIdsJson) ?? [];
        var reasons = JsonSerializer.Deserialize<Dictionary<Guid, PracticeQuestionSelectionReasonDto>>(session.SelectionReasonsJson) ?? new();

        var exercises = await _dbContext.Exercises
            .AsNoTracking()
            .Where(e => exerciseIds.Contains(e.Id))
            .ToDictionaryAsync(e => e.Id, cancellationToken);

        var questions = exerciseIds
            .Where(id => exercises.ContainsKey(id))
            .Select(id => MapToStudentQuestionDto(exercises[id], reasons.GetValueOrDefault(id)))
            .ToList();

        return new PracticeSessionDto
        {
            SessionId = session.Id,
            HskLevel = session.HskLevel,
            Skill = session.Skill,
            Difficulty = session.Difficulty,
            Mode = session.Mode,
            Status = session.Status,
            TotalQuestions = session.TotalQuestions,
            CorrectCount = session.CorrectCount,
            XpAwarded = session.XpAwarded,
            Accuracy = session.Accuracy,
            TimeSpentSeconds = session.TimeSpentSeconds,
            StartedAt = session.StartedAt,
            CompletedAt = session.CompletedAt,
            Questions = questions
        };
    }

    public async Task<SubmitPracticeSessionResultDto> SubmitPracticeSessionAsync(
        Guid userId,
        Guid sessionId,
        SubmitPracticeSessionRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var session = await _dbContext.QuestionBankPracticeSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken);

        if (session == null)
        {
            throw new KeyNotFoundException("Không tìm thấy phiên luyện tập.");
        }

        var exerciseIds = JsonSerializer.Deserialize<List<Guid>>(session.ExerciseIdsJson) ?? [];
        var exercises = await _dbContext.Exercises
            .AsNoTracking()
            .Where(e => exerciseIds.Contains(e.Id))
            .ToDictionaryAsync(e => e.Id, cancellationToken);

        // Strictly idempotent re-submission: return stored results & 0 additional XP
        if (session.Status == "COMPLETED")
        {
            var savedResults = !string.IsNullOrWhiteSpace(session.AnswersJson)
                ? (JsonSerializer.Deserialize<List<PracticeQuestionReviewItemDto>>(session.AnswersJson) ?? [])
                : [];
            var recs = await GetAdaptiveRecommendationsAsync(userId, cancellationToken);
            return new SubmitPracticeSessionResultDto
            {
                SessionId = session.Id,
                Status = "COMPLETED",
                TotalQuestions = session.TotalQuestions,
                CorrectCount = session.CorrectCount,
                Accuracy = session.Accuracy,
                XpAwarded = 0,
                AlreadyCompleted = true,
                TimeSpentSeconds = session.TimeSpentSeconds,
                CompletedAt = session.CompletedAt ?? DateTime.UtcNow,
                QuestionResults = savedResults,
                UpdatedWeakAreas = recs.WeakAreas
            };
        }

        var answerByQuestion = (dto.Answers ?? [])
            .GroupBy(a => a.QuestionId)
            .ToDictionary(g => g.Key, g => g.Last());

        var results = new List<PracticeQuestionReviewItemDto>();
        var now = DateTime.UtcNow;
        var correctCount = 0;

        foreach (var exId in exerciseIds)
        {
            if (!exercises.TryGetValue(exId, out var ex)) continue;
            answerByQuestion.TryGetValue(exId, out var userAns);

            var (isCorrect, givenAnswer) = QuestionValidationHelper.GradeSubmission(
                ex,
                userAns?.SelectedOption,
                userAns?.OrderedTokens,
                userAns?.MatchedPairs,
                userAns?.TextAnswer);

            if (isCorrect) correctCount++;

            var kpId = ex.GrammarPointId?.ToString()
                ?? ex.VocabularyId?.ToString()
                ?? $"skill:{ex.Skill}:hsk{ex.HskLevel}";

            _dbContext.StudentPracticeAttempts.Add(new StudentPracticeAttempt
            {
                UserId = userId,
                ExerciseId = ex.Id.ToString(),
                QuestionId = ex.Id.ToString(),
                KnowledgePointId = kpId,
                TopicTitle = ex.Title,
                Category = ex.Skill,
                HskLevel = ex.HskLevel,
                UserAnswer = givenAnswer.Length > 500 ? givenAnswer[..500] : givenAnswer,
                IsCorrect = isCorrect,
                AttemptedAt = now
            });

            results.Add(new PracticeQuestionReviewItemDto
            {
                QuestionId = ex.Id,
                Title = ex.Title,
                Skill = ex.Skill,
                HskLevel = ex.HskLevel,
                Difficulty = ex.Difficulty,
                IsCorrect = isCorrect,
                GivenAnswer = givenAnswer,
                CorrectAnswer = ex.CorrectAnswer,
                CorrectOptionIndex = ex.CorrectOptionIndex,
                Explanation = ex.Explanation
            });
        }

        var totalQuestions = Math.Max(1, results.Count);
        var accuracy = Math.Round((double)correctCount / totalQuestions * 100, 1);
        var resolvedXp = LearningService.ResolvePracticeSessionXp(correctCount, totalQuestions);

        session.Status = "COMPLETED";
        session.CorrectCount = correctCount;
        session.TotalQuestions = totalQuestions;
        session.Accuracy = accuracy;
        session.XpAwarded = resolvedXp;
        session.TimeSpentSeconds = Math.Clamp(dto.TimeSpentSeconds, 1, 7200);
        session.CompletedAt = now;
        session.UpdatedAt = now;
        session.AnswersJson = JsonSerializer.Serialize(results);

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Award XP idempotently + update daily activity & streak via existing LearningService
        await _learningService.RecordPracticeSessionAsync(userId, new PracticeSessionResultDto
        {
            SessionId = $"qb_{session.Id}",
            TotalQuestions = totalQuestions,
            CorrectQuestions = correctCount,
            XpEarned = resolvedXp,
            TimeSpentSeconds = session.TimeSpentSeconds
        }, cancellationToken);

        var updatedRecs = await GetAdaptiveRecommendationsAsync(userId, cancellationToken);

        return new SubmitPracticeSessionResultDto
        {
            SessionId = session.Id,
            Status = "COMPLETED",
            TotalQuestions = totalQuestions,
            CorrectCount = correctCount,
            Accuracy = accuracy,
            XpAwarded = resolvedXp,
            AlreadyCompleted = false,
            TimeSpentSeconds = session.TimeSpentSeconds,
            CompletedAt = now,
            QuestionResults = results,
            UpdatedWeakAreas = updatedRecs.WeakAreas
        };
    }

    public async Task<List<PracticeSessionHistoryItemDto>> GetPracticeHistoryAsync(
        Guid userId,
        int limit = 20,
        CancellationToken cancellationToken = default)
    {
        var take = Math.Clamp(limit, 1, 100);
        return await _dbContext.QuestionBankPracticeSessions
            .AsNoTracking()
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.StartedAt)
            .Take(take)
            .Select(s => new PracticeSessionHistoryItemDto
            {
                SessionId = s.Id,
                HskLevel = s.HskLevel,
                Skill = s.Skill,
                Difficulty = s.Difficulty,
                Mode = s.Mode,
                Status = s.Status,
                TotalQuestions = s.TotalQuestions,
                CorrectCount = s.CorrectCount,
                Accuracy = s.Accuracy,
                XpAwarded = s.XpAwarded,
                TimeSpentSeconds = s.TimeSpentSeconds,
                StartedAt = s.StartedAt,
                CompletedAt = s.CompletedAt
            })
            .ToListAsync(cancellationToken);
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    private sealed record CandidateMeta(
        Guid Id,
        int HskLevel,
        string Skill,
        string Difficulty,
        Guid? GrammarPointId,
        Guid? VocabularyId,
        string? PromptHanzi);

    private static List<(CandidateMeta Candidate, PracticeQuestionSelectionReasonDto Reason)> SelectCandidatesWithReasons(
        List<CandidateMeta> pool,
        int count,
        string mode,
        HashSet<string?> weakSkills,
        HashSet<string> weakKnowledgeIds,
        HashSet<Guid> wrongExerciseIds,
        HashSet<Guid> dueReviewExerciseIds,
        HashSet<Guid> attemptedExerciseIds,
        HashSet<Guid> lastSessionIds,
        HashSet<Guid> recentSessionIds,
        List<string> dueVocabHanzi,
        string preferredDifficulty)
    {
        var rng = Random.Shared;

        double ComputeRepeatPenalty(Guid id) =>
            lastSessionIds.Contains(id) ? -180 : recentSessionIds.Contains(id) ? -70 : 0;

        if (mode is not ("weakness" or "adaptive" or "mistake-review"))
        {
            return pool
                .OrderByDescending(c =>
                    ComputeRepeatPenalty(c.Id)
                    + (!attemptedExerciseIds.Contains(c.Id) ? 25 : 0)
                    + rng.NextDouble() * 12)
                .Take(count)
                .Select(c => (c, new PracticeQuestionSelectionReasonDto
                {
                    ReasonCode = !attemptedExerciseIds.Contains(c.Id)
                        ? "UNSEEN_DISCOVERY"
                        : mode == "skill" ? "SKILL_FILTER" : "RANDOM_PRACTICE",
                    ReasonLabel = !attemptedExerciseIds.Contains(c.Id)
                        ? $"Câu hỏi mới HSK {c.HskLevel} chưa luyện"
                        : mode == "skill"
                            ? $"Luyện tập kỹ năng {c.Skill}"
                            : $"Luyện tập tổng hợp HSK {c.HskLevel}"
                }))
                .ToList();
        }

        // Weighted adaptive pool (~65% targeted mistakes/weakness/due-review/unseen, ~35% spaced variety),
        // strictly avoiding back-to-back repeats from the immediately preceding sessions when pool permits.
        var priority = new List<(CandidateMeta Candidate, double Score, PracticeQuestionSelectionReasonDto Reason)>();
        var exploratory = new List<(CandidateMeta Candidate, double Score, PracticeQuestionSelectionReasonDto Reason)>();

        foreach (var c in pool)
        {
            var penalty = ComputeRepeatPenalty(c.Id);
            double score = 0;
            var code = "EXPLORATION_REVIEW";
            var label = $"Củng cố kiến thức HSK {c.HskLevel}";

            if (wrongExerciseIds.Contains(c.Id))
            {
                score += 70;
                code = "PAST_MISTAKE_REVIEW";
                label = "Câu bạn từng trả lời sai gần đây";
            }

            if (c.GrammarPointId.HasValue && weakKnowledgeIds.Contains(c.GrammarPointId.Value.ToString()))
            {
                score += 45;
                if (code == "EXPLORATION_REVIEW")
                {
                    code = "WEAK_GRAMMAR_POINT";
                    label = "Điểm ngữ pháp cần củng cố thêm";
                }
            }

            if (dueReviewExerciseIds.Contains(c.Id))
            {
                score += 40;
                if (code == "EXPLORATION_REVIEW")
                {
                    code = "DUE_FOR_REVIEW";
                    label = "Câu đến hạn ôn tập lại để ghi nhớ dài hạn";
                }
            }

            if (weakSkills.Contains(c.Skill))
            {
                score += 35;
                if (code == "EXPLORATION_REVIEW")
                {
                    code = "WEAK_SKILL_TARGET";
                    label = $"Kỹ năng {c.Skill} đang có tỷ lệ đúng thấp";
                }
            }

            if (!string.IsNullOrWhiteSpace(c.PromptHanzi) &&
                dueVocabHanzi.Any(h => c.PromptHanzi.Contains(h, StringComparison.Ordinal)))
            {
                score += 30;
                if (code == "EXPLORATION_REVIEW")
                {
                    code = "SRS_DUE_VOCABULARY";
                    label = "Từ vựng đang đến hạn ôn tập SRS";
                }
            }

            if (!attemptedExerciseIds.Contains(c.Id))
            {
                score += 22;
                if (code == "EXPLORATION_REVIEW")
                {
                    code = "UNSEEN_DISCOVERY";
                    label = $"Câu mới HSK {c.HskLevel} chưa từng làm";
                }
            }

            if (string.Equals(c.Difficulty, preferredDifficulty, StringComparison.OrdinalIgnoreCase))
            {
                score += 15;
            }

            var finalScore = score + penalty + rng.NextDouble() * 6;
            if (score > 25)
            {
                priority.Add((c, finalScore, new PracticeQuestionSelectionReasonDto
                {
                    ReasonCode = code,
                    ReasonLabel = label
                }));
            }
            else
            {
                exploratory.Add((c, finalScore, new PracticeQuestionSelectionReasonDto
                {
                    ReasonCode = !attemptedExerciseIds.Contains(c.Id) ? "UNSEEN_DISCOVERY" : "SPACED_VARIETY",
                    ReasonLabel = !attemptedExerciseIds.Contains(c.Id)
                        ? $"Mở rộng câu mới HSK {c.HskLevel}"
                        : $"Ôn tập đan xen kỹ năng {c.Skill}"
                }));
            }
        }

        var targetPriority = Math.Min(priority.Count, (int)Math.Ceiling(count * 0.65));
        var selected = priority
            .OrderByDescending(x => x.Score)
            .Take(targetPriority)
            .Select(x => (x.Candidate, x.Reason))
            .ToList();

        var remaining = count - selected.Count;
        if (remaining > 0)
        {
            var pickedSet = selected.Select(x => x.Candidate.Id).ToHashSet();
            selected.AddRange(exploratory
                .Where(e => !pickedSet.Contains(e.Candidate.Id))
                .OrderByDescending(e => e.Score)
                .Take(remaining)
                .Select(x => (x.Candidate, x.Reason)));
        }

        if (selected.Count < count && priority.Count > selected.Count)
        {
            var pickedIds = selected.Select(x => x.Candidate.Id).ToHashSet();
            selected.AddRange(priority
                .Where(p => !pickedIds.Contains(p.Candidate.Id))
                .OrderByDescending(x => x.Score)
                .Take(count - selected.Count)
                .Select(x => (x.Candidate, x.Reason)));
        }

        return selected;
    }

    private static string ResolveAdaptiveDifficulty(List<StudentPracticeAttempt> attempts, int? targetHskLevel)
    {
        var scoped = targetHskLevel.HasValue
            ? attempts.Where(a => a.HskLevel == targetHskLevel.Value).ToList()
            : attempts;
        if (scoped.Count < 4) return "EASY";
        var acc = scoped.Count(a => a.IsCorrect) * 100.0 / scoped.Count;
        if (acc < 60) return "EASY";
        if (acc < 82) return "MEDIUM";
        return "HARD";
    }

    private async Task<(List<PracticeStatBucketDto> SkillStats, List<PracticeStatBucketDto> HskStats, List<PracticeStatBucketDto> GrammarStats)> BuildAnalyticsBucketsAsync(
        List<StudentPracticeAttempt> attempts,
        CancellationToken cancellationToken)
    {
        if (attempts.Count == 0)
        {
            return ([], [], []);
        }

        var skillStats = attempts
            .GroupBy(a => QuestionValidationHelper.NormalizeSkill(a.Category))
            .Select(g =>
            {
                var total = g.Count();
                var correct = g.Count(x => x.IsCorrect);
                return new PracticeStatBucketDto
                {
                    Key = g.Key,
                    Label = g.Key switch
                    {
                        "vocabulary" => "Từ vựng",
                        "grammar" => "Ngữ pháp",
                        "reading" => "Đọc hiểu",
                        "listening" => "Luyện nghe",
                        "sentence" => "Cấu trúc câu",
                        _ => "Tổng hợp"
                    },
                    TotalAttempts = total,
                    CorrectCount = correct,
                    Accuracy = Math.Round(correct * 100.0 / total, 1)
                };
            })
            .OrderByDescending(x => x.TotalAttempts)
            .ToList();

        var hskStats = attempts
            .Where(a => a.HskLevel is >= 1 and <= 6)
            .GroupBy(a => a.HskLevel)
            .Select(g =>
            {
                var total = g.Count();
                var correct = g.Count(x => x.IsCorrect);
                return new PracticeStatBucketDto
                {
                    Key = $"hsk{g.Key}",
                    Label = $"HSK {g.Key}",
                    TotalAttempts = total,
                    CorrectCount = correct,
                    Accuracy = Math.Round(correct * 100.0 / total, 1)
                };
            })
            .OrderBy(x => x.Key)
            .ToList();

        var grammarGuids = attempts
            .Select(a => Guid.TryParse(a.KnowledgePointId, out var g) ? g : (Guid?)null)
            .Where(g => g.HasValue)
            .Select(g => g!.Value)
            .Distinct()
            .Take(20)
            .ToList();

        var grammarNames = grammarGuids.Count > 0
            ? await _dbContext.GrammarPoints
                .AsNoTracking()
                .Where(g => grammarGuids.Contains(g.Id))
                .ToDictionaryAsync(g => g.Id, g => g.Title, cancellationToken)
            : new Dictionary<Guid, string>();

        var grammarStats = attempts
            .Where(a => Guid.TryParse(a.KnowledgePointId, out var gid) && grammarNames.ContainsKey(gid))
            .GroupBy(a => Guid.Parse(a.KnowledgePointId))
            .Select(g =>
            {
                var total = g.Count();
                var correct = g.Count(x => x.IsCorrect);
                return new PracticeStatBucketDto
                {
                    Key = g.Key.ToString(),
                    Label = grammarNames.GetValueOrDefault(g.Key, "Điểm ngữ pháp"),
                    TotalAttempts = total,
                    CorrectCount = correct,
                    Accuracy = Math.Round(correct * 100.0 / total, 1)
                };
            })
            .OrderBy(x => x.Accuracy)
            .Take(8)
            .ToList();

        return (skillStats, hskStats, grammarStats);
    }

    private async Task<PracticeSessionDto> PersistAndMaterializeSessionAsync(
        Guid userId,
        int? hskLevel,
        string? skill,
        string? difficulty,
        string mode,
        List<(CandidateMeta Candidate, PracticeQuestionSelectionReasonDto Reason)> picked,
        CancellationToken cancellationToken)
    {
        var ids = picked.Select(x => x.Candidate.Id).ToList();
        var reasonDict = picked.ToDictionary(x => x.Candidate.Id, x => x.Reason);

        var entity = new QuestionBankPracticeSessionEntity
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            HskLevel = hskLevel,
            Skill = skill,
            Difficulty = difficulty,
            Mode = mode,
            Status = "IN_PROGRESS",
            TotalQuestions = ids.Count,
            ExerciseIdsJson = JsonSerializer.Serialize(ids),
            SelectionReasonsJson = JsonSerializer.Serialize(reasonDict),
            StartedAt = DateTime.UtcNow
        };

        _dbContext.QuestionBankPracticeSessions.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var loaded = await _dbContext.Exercises
            .AsNoTracking()
            .Where(e => ids.Contains(e.Id))
            .ToDictionaryAsync(e => e.Id, cancellationToken);

        var questions = ids
            .Where(id => loaded.ContainsKey(id))
            .Select(id => MapToStudentQuestionDto(loaded[id], reasonDict.GetValueOrDefault(id)))
            .ToList();

        return new PracticeSessionDto
        {
            SessionId = entity.Id,
            HskLevel = entity.HskLevel,
            Skill = entity.Skill,
            Difficulty = entity.Difficulty,
            Mode = entity.Mode,
            Status = entity.Status,
            TotalQuestions = questions.Count,
            CorrectCount = 0,
            XpAwarded = 0,
            Accuracy = 0,
            TimeSpentSeconds = 0,
            StartedAt = entity.StartedAt,
            CompletedAt = null,
            Questions = questions
        };
    }

    private static List<AdaptiveRecommendationDto> BuildWeakAreas(List<StudentPracticeAttempt> attempts)
    {
        if (attempts.Count == 0) return [];

        var bySkill = attempts
            .GroupBy(a => new { Category = QuestionValidationHelper.NormalizeSkill(a.Category), a.HskLevel })
            .Select(g =>
            {
                var total = g.Count();
                var wrong = g.Count(x => !x.IsCorrect);
                var acc = total > 0 ? Math.Round((double)(total - wrong) / total * 100, 1) : 100;
                var weaknessScore = Math.Round((100 - acc) * Math.Log2(total + 1) + wrong * 8, 1);
                return new AdaptiveRecommendationDto
                {
                    Key = $"skill:{g.Key.Category}:hsk{g.Key.HskLevel}",
                    Category = "skill",
                    Title = $"Kỹ năng {g.Key.Category} · HSK {g.Key.HskLevel}",
                    HskLevel = g.Key.HskLevel,
                    RecommendedSkill = g.Key.Category,
                    Accuracy = acc,
                    TotalAttempts = total,
                    WrongCount = wrong,
                    WeaknessScore = weaknessScore,
                    Reason = $"Đúng {total - wrong}/{total} câu ({acc}%)"
                };
            })
            .Where(w => w.WrongCount > 0 || w.Accuracy < 80)
            .OrderByDescending(w => w.WeaknessScore)
            .Take(5)
            .ToList();

        return bySkill;
    }

    private static List<QuestionImportItemDto> BuildGeneratedCandidates(
        int hskLevel,
        string skill,
        string type,
        string difficulty,
        int targetCount,
        Guid? lessonId,
        Guid? grammarPointId,
        List<VocabularyEntity> vocabs,
        List<GrammarPointEntity> grammars)
    {
        var items = new List<QuestionImportItemDto>();
        if (vocabs.Count < 4) return items;

        for (var i = 0; i < vocabs.Count && items.Count < targetCount * 2; i++)
        {
            var word = vocabs[i];
            var distractors = vocabs
                .Where((v, idx) => idx != i && !string.Equals(v.MeaningVi, word.MeaningVi, StringComparison.OrdinalIgnoreCase) && !string.Equals(v.Hanzi, word.Hanzi, StringComparison.OrdinalIgnoreCase))
                .OrderBy(v => Math.Abs(v.Hanzi.Length - word.Hanzi.Length))
                .Take(3)
                .ToList();

            if (distractors.Count < 3) continue;

            if (type == "vietnamese-to-chinese")
            {
                var options = new List<string> { word.Hanzi, distractors[0].Hanzi, distractors[1].Hanzi, distractors[2].Hanzi };
                var rotate = i % 4;
                var rotated = options.Select((_, idx) => options[(idx + rotate) % 4]).ToList();
                var correctIdx = rotated.IndexOf(word.Hanzi);
                items.Add(new QuestionImportItemDto
                {
                    Type = "vietnamese-to-chinese",
                    Skill = "vocabulary",
                    HskLevel = hskLevel,
                    Difficulty = difficulty,
                    Title = $"HSK {hskLevel} · Chọn chữ Hán cho \"{word.MeaningVi}\"",
                    Instruction = "Chọn từ tiếng Trung tương ứng với nghĩa tiếng Việt dưới đây.",
                    PromptHanzi = word.MeaningVi,
                    PromptVietnamese = $"Nghĩa cần tìm: {word.MeaningVi}",
                    Options = rotated,
                    CorrectOptionIndex = correctIdx,
                    CorrectAnswer = word.Hanzi,
                    Explanation = $"'{word.Hanzi}' ({word.Pinyin}) mang nghĩa '{word.MeaningVi}' thuộc giáo trình HSK {hskLevel}.",
                    Tags = $"hsk{hskLevel},vocabulary,generated,vi-to-zh",
                    LessonId = lessonId ?? word.LessonId,
                    VocabularyId = word.Id
                });
            }
            else if (type == "fill-blank")
            {
                items.Add(new QuestionImportItemDto
                {
                    Type = "fill-blank",
                    Skill = skill == "vocabulary" ? "vocabulary" : "reading",
                    HskLevel = hskLevel,
                    Difficulty = difficulty,
                    Title = $"HSK {hskLevel} · Điền từ theo nghĩa \"{word.MeaningVi}\"",
                    Instruction = "Gõ đúng chữ Hán tương ứng với gợi ý Pinyin và nghĩa tiếng Việt.",
                    PromptHanzi = "____",
                    PromptPinyin = word.Pinyin,
                    PromptVietnamese = $"Nghĩa: {word.MeaningVi}",
                    CorrectAnswer = word.Hanzi,
                    Explanation = $"Đáp án đúng là '{word.Hanzi}' ({word.Pinyin}): {word.MeaningVi}.",
                    Tags = $"hsk{hskLevel},fill-blank,generated",
                    LessonId = lessonId ?? word.LessonId,
                    VocabularyId = word.Id
                });
            }
            else if (type == "sentence-order" && grammars.Count > 0)
            {
                var grammar = grammars[i % grammars.Count];
                // Construct a clean deterministic bracketed prompt if grammar example parses cleanly; fallback to MCQ grammar question otherwise
                var examplePair = TryExtractFirstExample(grammar.ExamplesJson);
                if (examplePair != null && examplePair.Value.Hanzi.Length >= 4)
                {
                    var tokens = examplePair.Value.Hanzi
                        .Where(c => !char.IsWhiteSpace(c) && !"。！？，、".Contains(c))
                        .Select(c => c.ToString())
                        .ToList();
                    if (tokens.Count >= 3 && tokens.Count <= 8)
                    {
                        var reversed = tokens.AsEnumerable().Reverse().Select(t => $"[{t}]");
                        items.Add(new QuestionImportItemDto
                        {
                            Type = "sentence-order",
                            Skill = "sentence",
                            HskLevel = hskLevel,
                            Difficulty = difficulty,
                            Title = $"HSK {hskLevel} · Sắp xếp câu ({grammar.Title})",
                            Instruction = "Sắp xếp các mảnh từ thành câu tiếng Trung hoàn chỉnh theo nghĩa tiếng Việt.",
                            PromptHanzi = string.Join(" ", reversed),
                            PromptPinyin = examplePair.Value.Pinyin,
                            PromptVietnamese = examplePair.Value.Vietnamese,
                            CorrectAnswer = examplePair.Value.Hanzi,
                            Explanation = $"Cấu trúc ngữ pháp '{grammar.Title}': {grammar.StructureFormula}. {grammar.Explanation}",
                            Tags = $"hsk{hskLevel},sentence-order,grammar,generated",
                            LessonId = lessonId ?? grammar.LessonId,
                            GrammarPointId = grammarPointId ?? grammar.Id
                        });
                        continue;
                    }
                    else if (tokens.Count > 8)
                    {
                        // Group long sentences into 4-5 meaningful 2-character chunks cleanly
                        var chunks = tokens
                            .Chunk(Math.Max(2, tokens.Count / 4))
                            .Select(ch => string.Join(string.Empty, ch))
                            .Where(s => !string.IsNullOrEmpty(s))
                            .ToList();
                        if (chunks.Count >= 3)
                        {
                            var reversedChunks = chunks.AsEnumerable().Reverse().Select(t => $"[{t}]");
                            items.Add(new QuestionImportItemDto
                            {
                                Type = "sentence-order",
                                Skill = "sentence",
                                HskLevel = hskLevel,
                                Difficulty = difficulty,
                                Title = $"HSK {hskLevel} · Sắp xếp câu ({grammar.Title})",
                                Instruction = "Sắp xếp các mảnh từ thành câu tiếng Trung hoàn chỉnh theo nghĩa tiếng Việt.",
                                PromptHanzi = string.Join(" ", reversedChunks),
                                PromptPinyin = examplePair.Value.Pinyin,
                                PromptVietnamese = examplePair.Value.Vietnamese,
                                CorrectAnswer = examplePair.Value.Hanzi,
                                Explanation = $"Cấu trúc ngữ pháp '{grammar.Title}': {grammar.StructureFormula}. {grammar.Explanation}",
                                Tags = $"hsk{hskLevel},sentence-order,grammar,generated",
                                LessonId = lessonId ?? grammar.LessonId,
                                GrammarPointId = grammarPointId ?? grammar.Id
                            });
                            continue;
                        }
                    }
                }
            }
            else
            {
                var options = new List<string> { word.MeaningVi, distractors[0].MeaningVi, distractors[1].MeaningVi, distractors[2].MeaningVi };
                var rotate = i % 4;
                var rotated = options.Select((_, idx) => options[(idx + rotate) % 4]).ToList();
                var correctIdx = rotated.IndexOf(word.MeaningVi);
                items.Add(new QuestionImportItemDto
                {
                    Type = type == "listen-choice" ? "listen-choice" : "multiple-choice",
                    Skill = skill,
                    HskLevel = hskLevel,
                    Difficulty = difficulty,
                    Title = $"HSK {hskLevel} · Nghĩa của từ \"{word.Hanzi}\"",
                    Instruction = "Chọn nghĩa tiếng Việt đúng nhất cho từ/cụm từ tiếng Trung sau.",
                    PromptHanzi = word.Hanzi,
                    PromptPinyin = word.Pinyin,
                    PromptVietnamese = $"Từ vựng HSK {hskLevel}",
                    Options = rotated,
                    CorrectOptionIndex = correctIdx,
                    CorrectAnswer = word.MeaningVi,
                    Explanation = $"'{word.Hanzi}' ({word.Pinyin}) có nghĩa là '{word.MeaningVi}'.",
                    Tags = $"hsk{hskLevel},{skill},generated",
                    LessonId = lessonId ?? word.LessonId,
                    VocabularyId = word.Id
                });
            }
        }

        return items;
    }

    private static (string Hanzi, string? Pinyin, string? Vietnamese)? TryExtractFirstExample(string? examplesJson)
    {
        if (string.IsNullOrWhiteSpace(examplesJson)) return null;
        try
        {
            using var doc = JsonDocument.Parse(examplesJson);
            if (doc.RootElement.ValueKind != JsonValueKind.Array || doc.RootElement.GetArrayLength() == 0)
                return null;

            var first = doc.RootElement[0];
            var hanzi = first.TryGetProperty("hanzi", out var h) ? h.GetString()
                : first.TryGetProperty("cn", out var c) ? c.GetString()
                : null;
            if (string.IsNullOrWhiteSpace(hanzi)) return null;

            var pinyin = first.TryGetProperty("pinyin", out var p) ? p.GetString() : null;
            var vi = first.TryGetProperty("vietnamese", out var v) ? v.GetString()
                : first.TryGetProperty("vi", out var v2) ? v2.GetString()
                : null;

            return (hanzi.Trim(), pinyin, vi);
        }
        catch
        {
            return null;
        }
    }

    private static string? ResolveOptionsJson(string? rawOptionsJson, List<string>? options)
    {
        if (options != null && options.Count > 0)
        {
            return JsonSerializer.Serialize(options.Select(o => o.Trim()).ToList());
        }
        return string.IsNullOrWhiteSpace(rawOptionsJson) ? null : rawOptionsJson.Trim();
    }

    private static string? NormalizeTags(string? rawTags)
    {
        if (string.IsNullOrWhiteSpace(rawTags)) return null;
        var clean = rawTags
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(t => t.ToLowerInvariant())
            .Distinct()
            .ToList();
        return clean.Count == 0 ? null : string.Join(",", clean);
    }

    private static QuestionBankItemDto MapToDto(ExerciseEntity e) => new()
    {
        Id = e.Id,
        Type = e.Type,
        Skill = e.Skill,
        HskLevel = e.HskLevel,
        Difficulty = e.Difficulty,
        Title = e.Title,
        Instruction = e.Instruction,
        PromptHanzi = e.PromptHanzi,
        PromptPinyin = e.PromptPinyin,
        PromptVietnamese = e.PromptVietnamese,
        AudioUrl = e.AudioUrl,
        OptionsJson = e.OptionsJson,
        Options = QuestionValidationHelper.ParseOptions(e.OptionsJson),
        CorrectOptionIndex = e.CorrectOptionIndex,
        CorrectAnswer = e.CorrectAnswer,
        Explanation = e.Explanation,
        HasSubstantiveExplanation = QuestionValidationHelper.HasSubstantiveExplanation(e.Explanation, e.CorrectAnswer),
        IsReported = !string.IsNullOrWhiteSpace(e.Tags) && e.Tags.Contains("reported-issue", StringComparison.OrdinalIgnoreCase),
        XpReward = e.XpReward,
        Status = e.Status,
        ReviewStatus = e.ReviewStatus,
        Tags = e.Tags,
        SourceId = e.SourceId,
        SourceLicense = e.SourceLicense,
        QualityScore = e.QualityScore,
        ContentHash = e.ContentHash,
        ReviewedByUserId = e.ReviewedByUserId,
        ReviewedAt = e.ReviewedAt,
        ReviewNotes = e.ReviewNotes,
        LessonId = e.LessonId,
        LessonTitle = e.Lesson?.TitleVi,
        GrammarPointId = e.GrammarPointId,
        GrammarTitle = e.GrammarPoint?.Title,
        VocabularyId = e.VocabularyId,
        VocabularyHanzi = e.Vocabulary?.Hanzi,
        CreatedAt = e.CreatedAt,
        UpdatedAt = e.UpdatedAt
    };

    private static StudentPracticeQuestionDto MapToStudentQuestionDto(
        ExerciseEntity e,
        PracticeQuestionSelectionReasonDto? reason) => new()
    {
        Id = e.Id,
        Type = e.Type,
        Skill = e.Skill,
        HskLevel = e.HskLevel,
        Difficulty = e.Difficulty,
        Title = e.Title,
        Instruction = e.Instruction,
        PromptHanzi = e.PromptHanzi,
        PromptPinyin = e.PromptPinyin,
        PromptVietnamese = e.PromptVietnamese,
        AudioUrl = e.AudioUrl,
        Options = QuestionValidationHelper.ParseOptions(e.OptionsJson),
        OptionsJson = e.OptionsJson,
        XpReward = e.XpReward,
        LessonId = e.LessonId,
        GrammarPointId = e.GrammarPointId,
        KnowledgePointId = e.GrammarPointId?.ToString()
            ?? e.VocabularyId?.ToString()
            ?? $"skill:{e.Skill}:hsk{e.HskLevel}",
        SelectionReasonCode = reason?.ReasonCode,
        SelectionReasonLabel = reason?.ReasonLabel
    };
}
