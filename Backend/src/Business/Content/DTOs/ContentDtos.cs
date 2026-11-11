using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Business.Content.DTOs;

public class CourseDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int HskLevel { get; set; }
    public string Status { get; set; } = "PUBLISHED";
    public int OrderIndex { get; set; }
    public int UnitCount { get; set; }
    public int LessonCount { get; set; }
    public int PublishedLessonCount { get; set; }
    public int DraftLessonCount { get; set; }
    public int PendingReviewLessonCount { get; set; }
    public int ArchivedLessonCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateCourseDto
{
    [Required(ErrorMessage = "Mã khóa học không được để trống.")]
    [StringLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tiêu đề khóa học không được để trống.")]
    [StringLength(150)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Range(1, 6)]
    public int HskLevel { get; set; } = 1;

    public string Status { get; set; } = "PUBLISHED";
    public int OrderIndex { get; set; } = 1;
}

public class UpdateCourseDto
{
    [Required(ErrorMessage = "Tiêu đề khóa học không được để trống.")]
    [StringLength(150)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Range(1, 6)]
    public int HskLevel { get; set; } = 1;

    public string Status { get; set; } = "PUBLISHED";
    public int OrderIndex { get; set; } = 1;
}

public class UnitDto
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public int UnitNumber { get; set; }
    public string TitleZh { get; set; } = string.Empty;
    public string TitleVi { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OrderIndex { get; set; }
    public string Status { get; set; } = "PUBLISHED";
    public int LessonCount { get; set; }
    public int PublishedLessonCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateUnitDto
{
    [Required]
    public Guid CourseId { get; set; }

    [Range(1, 100)]
    public int UnitNumber { get; set; } = 1;

    [Required(ErrorMessage = "Tiêu đề tiếng Trung không được để trống.")]
    [StringLength(150)]
    public string TitleZh { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tiêu đề tiếng Việt không được để trống.")]
    [StringLength(150)]
    public string TitleVi { get; set; } = string.Empty;

    public string? Description { get; set; }
    public int OrderIndex { get; set; } = 1;
    public string Status { get; set; } = "PUBLISHED";
}

public class UpdateUnitDto
{
    [Range(1, 100)]
    public int UnitNumber { get; set; } = 1;

    [Required(ErrorMessage = "Tiêu đề tiếng Trung không được để trống.")]
    [StringLength(150)]
    public string TitleZh { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tiêu đề tiếng Việt không được để trống.")]
    [StringLength(150)]
    public string TitleVi { get; set; } = string.Empty;

    public string? Description { get; set; }
    public int OrderIndex { get; set; } = 1;
    public string Status { get; set; } = "PUBLISHED";
}

public class LessonDto
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public Guid? UnitId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public int LessonNumber { get; set; }
    public string TitleZh { get; set; } = string.Empty;
    public string TitleVi { get; set; } = string.Empty;
    public string? Pinyin { get; set; }
    public string? Summary { get; set; }
    public int DurationMinutes { get; set; }
    public int XpReward { get; set; }
    public int OrderIndex { get; set; }
    public string Status { get; set; } = "PUBLISHED";
    public string? DialogueJson { get; set; }
    public string? ListeningJson { get; set; }
    public int VocabularyCount { get; set; }
    public int GrammarCount { get; set; }
    public int ExerciseCount { get; set; }
    public Guid? UpdatedByUserId { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNotes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class ReadingComprehensionQuestionDto
{
    public string QuestionZh { get; set; } = string.Empty;
    public string? QuestionPinyin { get; set; }
    public string QuestionVi { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
    public int CorrectIndex { get; set; }
    public string Explanation { get; set; } = string.Empty;
}

public class ReadingPassageDto
{
    public int UnitNumber { get; set; }
    public int LessonNumber { get; set; }
    public string TitleZh { get; set; } = string.Empty;
    public string TitleVi { get; set; } = string.Empty;
    public string PassageZh { get; set; } = string.Empty;
    public string PassagePinyin { get; set; } = string.Empty;
    public string PassageVi { get; set; } = string.Empty;
    public int CharacterCount { get; set; }
    public List<string> TargetWords { get; set; } = new();
    public List<string> TargetGrammar { get; set; } = new();
    public List<ReadingComprehensionQuestionDto> ComprehensionQuestions { get; set; } = new();
}

public class LessonDetailDto : LessonDto
{
    public List<VocabularyDto> Vocabularies { get; set; } = new();
    public List<GrammarPointDto> GrammarPoints { get; set; } = new();
    public List<ExerciseDto> Exercises { get; set; } = new();
    public ReadingPassageDto? ReadingPassage { get; set; }
}

public class CreateLessonDto
{
    [Required]
    public Guid CourseId { get; set; }

    public Guid? UnitId { get; set; }

    [Range(1, 100)]
    public int LessonNumber { get; set; } = 1;

    [Required(ErrorMessage = "Tiêu đề tiếng Trung không được để trống.")]
    [StringLength(150)]
    public string TitleZh { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tiêu đề tiếng Việt không được để trống.")]
    [StringLength(150)]
    public string TitleVi { get; set; } = string.Empty;

    public string? Pinyin { get; set; }
    public string? Summary { get; set; }

    [Range(1, 300, ErrorMessage = "Thời lượng phải từ 1 đến 300 phút.")]
    public int DurationMinutes { get; set; } = 30;

    [Range(0, 1000, ErrorMessage = "Điểm thưởng XP phải từ 0 đến 1000.")]
    public int XpReward { get; set; } = 50;

    public int OrderIndex { get; set; } = 1;
    public string Status { get; set; } = "DRAFT";
    public bool AllowExceedStandardLimit { get; set; } = false;
    public string? DialogueJson { get; set; }
    public string? ListeningJson { get; set; }
}

public class UpdateLessonDto
{
    public Guid? UnitId { get; set; }

    [Range(1, 100)]
    public int LessonNumber { get; set; } = 1;

    [Required(ErrorMessage = "Tiêu đề tiếng Trung không được để trống.")]
    [StringLength(150)]
    public string TitleZh { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tiêu đề tiếng Việt không được để trống.")]
    [StringLength(150)]
    public string TitleVi { get; set; } = string.Empty;

    public string? Pinyin { get; set; }
    public string? Summary { get; set; }
    public int DurationMinutes { get; set; } = 30;
    public int XpReward { get; set; } = 50;
    public int OrderIndex { get; set; } = 1;
    public string Status { get; set; } = "PUBLISHED";
    public string? DialogueJson { get; set; }
    public string? ListeningJson { get; set; }

    public List<Guid>? LinkedVocabularyIds { get; set; }
    public List<Guid>? LinkedGrammarPointIds { get; set; }
    public List<Guid>? LinkedExerciseIds { get; set; }
}

public class VocabularyDto
{
    public Guid Id { get; set; }
    public int HskLevel { get; set; }
    public string Hanzi { get; set; } = string.Empty;
    public string? Traditional { get; set; }
    public string Pinyin { get; set; } = string.Empty;
    public string MeaningVi { get; set; } = string.Empty;
    public string? SuggestedMeaningVi { get; set; }
    public string? MeaningEn { get; set; }
    public string? PartOfSpeech { get; set; }
    public string? AudioUrl { get; set; }
    public string? ExamplesJson { get; set; }
    public string Status { get; set; } = "PUBLISHED";
    public string? SourceDataset { get; set; }
    public string? SourceEntryId { get; set; }
    public string? SourceId { get; set; }
    public string? Entry { get; set; }
    public string? Homograph { get; set; }
    public string? LevelLabel { get; set; }
    public int? SourcePdfPage { get; set; }
    public Guid? LessonId { get; set; }
    public Guid? UpdatedByUserId { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNotes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateVocabularyDto
{
    [Range(1, 6, ErrorMessage = "Cấp độ HSK phải từ 1 đến 6.")]
    public int HskLevel { get; set; } = 1;

    [Required(ErrorMessage = "Chữ Hán không được để trống.")]
    [StringLength(50)]
    public string Hanzi { get; set; } = string.Empty;

    public string? Traditional { get; set; }

    [Required(ErrorMessage = "Pinyin không được để trống.")]
    [StringLength(100)]
    public string Pinyin { get; set; } = string.Empty;

    [StringLength(255)]
    public string? MeaningVi { get; set; }

    public string? SuggestedMeaningVi { get; set; }
    public string? MeaningEn { get; set; }
    public string? PartOfSpeech { get; set; }
    public string? AudioUrl { get; set; }
    public string? ExamplesJson { get; set; }
    public string Status { get; set; } = "PUBLISHED";
    public string? ReviewNotes { get; set; }
    public string? SourceDataset { get; set; }
    public string? SourceEntryId { get; set; }
    public string? SourceId { get; set; }
    public string? Entry { get; set; }
    public string? Homograph { get; set; }
    public string? LevelLabel { get; set; }
    public int? SourcePdfPage { get; set; }
    public Guid? LessonId { get; set; }
}

public class UpdateVocabularyDto : CreateVocabularyDto
{
}

public class Hsk3CsvRow
{
    [CsvHelper.Configuration.Attributes.Name("id")]
    public string Id { get; set; } = string.Empty;

    [CsvHelper.Configuration.Attributes.Name("level")]
    public string Level { get; set; } = string.Empty;

    [CsvHelper.Configuration.Attributes.Name("hanzi")]
    public string Hanzi { get; set; } = string.Empty;

    [CsvHelper.Configuration.Attributes.Name("pinyin")]
    public string Pinyin { get; set; } = string.Empty;

    [CsvHelper.Configuration.Attributes.Name("part_of_speech")]
    public string? PartOfSpeech { get; set; }

    [CsvHelper.Configuration.Attributes.Name("entry")]
    public string? Entry { get; set; }

    [CsvHelper.Configuration.Attributes.Name("homograph")]
    public string? Homograph { get; set; }

    [CsvHelper.Configuration.Attributes.Name("level_label")]
    public string? LevelLabel { get; set; }

    [CsvHelper.Configuration.Attributes.Name("source_pdf_page")]
    public string? SourcePdfPage { get; set; }
}

public class VocabularyImportRowError
{
    public int RowNumber { get; set; }
    public string? ColumnName { get; set; }
    public string? SourceDataset { get; set; }
    public string? SourceEntryId { get; set; }
    public string? SourceId { get; set; }
    public string? Hanzi { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class VocabularyImportPreviewItem
{
    public int RowNumber { get; set; }
    public string? SourceDataset { get; set; }
    public string? SourceEntryId { get; set; }
    public string SourceId { get; set; } = string.Empty;
    public int HskLevel { get; set; }
    public string LevelLabel { get; set; } = string.Empty;
    public string Hanzi { get; set; } = string.Empty;
    public string Pinyin { get; set; } = string.Empty;
    public string? MeaningVi { get; set; }
    public string? MeaningEn { get; set; }
    public string? PartOfSpeech { get; set; }
    public string? ExampleHanzi { get; set; }
    public string? ExamplePinyin { get; set; }
    public string? ExampleMeaningVi { get; set; }
    public string? Entry { get; set; }
    public string? Homograph { get; set; }
    public int? SourcePdfPage { get; set; }
    public bool IsDuplicate { get; set; }
    public string Status { get; set; } = "DRAFT";
}

public class VocabularyImportResultDto
{
    public bool DryRun { get; set; }
    public int TotalRows { get; set; }
    public int SuccessCount { get; set; }
    public int SkippedDuplicateCount { get; set; }
    public int ErrorCount { get; set; }
    public List<VocabularyImportRowError> Errors { get; set; } = new();
    public List<VocabularyImportPreviewItem> PreviewItems { get; set; } = new();
}

public class BatchPublishRequestDto
{
    public List<Guid> Ids { get; set; } = new();
}

public class BatchPublishResultDto
{
    public int PublishedCount { get; set; }
    public int SkippedCount { get; set; }
    public List<string> SkippedReasons { get; set; } = new();
}

public class BatchUpdateMeaningItemDto
{
    public Guid Id { get; set; }

    public string? Hanzi { get; set; }

    public string? Pinyin { get; set; }

    [StringLength(255, ErrorMessage = "Nghĩa tiếng Việt tối đa 255 ký tự.")]
    public string MeaningVi { get; set; } = string.Empty;

    public string? PartOfSpeech { get; set; }

    public string? Status { get; set; }
}

public class BatchUpdateMeaningsRequestDto
{
    [Required]
    public List<BatchUpdateMeaningItemDto> Items { get; set; } = new();
}

public class BatchUpdateMeaningErrorItemDto
{
    public Guid? Id { get; set; }
    public string? Hanzi { get; set; }
    public string? Pinyin { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class BatchUpdateMeaningsResultDto
{
    public int TotalRequested { get; set; }
    public int UpdatedCount { get; set; }
    public int ErrorCount { get; set; }
    public List<BatchUpdateMeaningErrorItemDto> Errors { get; set; } = new();
}

public class GrammarPointDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string PinyinTitle { get; set; } = string.Empty;
    public int HskLevel { get; set; }
    public string Category { get; set; } = "cơ bản";
    public string StructureFormula { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
    public string Difficulty { get; set; } = "Dễ";
    public string ExamplesJson { get; set; } = "[]";
    public string? PracticeJson { get; set; }
    public string Status { get; set; } = "PUBLISHED";
    public string? GrammarType { get; set; }
    public string? CategoryType { get; set; }
    public string? RawExplanationCn { get; set; }
    public string? SourceDataset { get; set; }
    public string? SourceEntryId { get; set; }
    public Guid? LessonId { get; set; }
    public Guid? UpdatedByUserId { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNotes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateGrammarPointDto
{
    [Required(ErrorMessage = "Mã ngữ pháp không được để trống.")]
    [StringLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tiêu đề không được để trống.")]
    [StringLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Pinyin không được để trống.")]
    [StringLength(150)]
    public string PinyinTitle { get; set; } = string.Empty;

    [Range(1, 6)]
    public int HskLevel { get; set; } = 1;

    [Required]
    public string Category { get; set; } = "cơ bản";

    [Required]
    public string StructureFormula { get; set; } = string.Empty;

    [Required]
    public string Explanation { get; set; } = string.Empty;

    public string Difficulty { get; set; } = "Dễ";
    public string ExamplesJson { get; set; } = "[]";
    public string? PracticeJson { get; set; }
    public string Status { get; set; } = "PUBLISHED";
    public Guid? LessonId { get; set; }
}

public class UpdateGrammarPointDto
{
    [Required(ErrorMessage = "Tiêu đề không được để trống.")]
    [StringLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Pinyin không được để trống.")]
    [StringLength(150)]
    public string PinyinTitle { get; set; } = string.Empty;

    [Range(1, 6)]
    public int HskLevel { get; set; } = 1;

    [Required]
    public string Category { get; set; } = "cơ bản";

    [Required]
    public string StructureFormula { get; set; } = string.Empty;

    [Required]
    public string Explanation { get; set; } = string.Empty;

    public string Difficulty { get; set; } = "Dễ";
    public string ExamplesJson { get; set; } = "[]";
    public string? PracticeJson { get; set; }
    public string Status { get; set; } = "PUBLISHED";
    public Guid? LessonId { get; set; }
}

public class ExerciseDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = "multiple-choice";
    public string Skill { get; set; } = "reading";
    public int HskLevel { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Instruction { get; set; } = string.Empty;
    public string? PromptHanzi { get; set; }
    public string? PromptPinyin { get; set; }
    public string? PromptVietnamese { get; set; }
    public string? AudioUrl { get; set; }
    public string? OptionsJson { get; set; }
    public int? CorrectOptionIndex { get; set; }
    public string? CorrectAnswer { get; set; }
    public string? Explanation { get; set; }
    public int XpReward { get; set; } = 10;
    public string Status { get; set; } = "PUBLISHED";
    public Guid? LessonId { get; set; }
    public Guid? GrammarPointId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateExerciseDto
{
    [Required]
    public string Type { get; set; } = "multiple-choice";

    [Required]
    public string Skill { get; set; } = "reading";

    [Range(1, 6)]
    public int HskLevel { get; set; } = 1;

    [Required(ErrorMessage = "Tiêu đề bài tập không được để trống.")]
    [StringLength(255)]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Hướng dẫn làm bài không được để trống.")]
    [StringLength(500)]
    public string Instruction { get; set; } = string.Empty;

    public string? PromptHanzi { get; set; }
    public string? PromptPinyin { get; set; }
    public string? PromptVietnamese { get; set; }
    public string? AudioUrl { get; set; }
    public string? OptionsJson { get; set; }
    public int? CorrectOptionIndex { get; set; }
    public string? CorrectAnswer { get; set; }
    public string? Explanation { get; set; }
    public int XpReward { get; set; } = 10;
    public string Status { get; set; } = "PUBLISHED";
    public Guid? LessonId { get; set; }
    public Guid? GrammarPointId { get; set; }
}

public class UpdateExerciseDto : CreateExerciseDto
{
}

public class UpdateContentStatusDto
{
    [Required(ErrorMessage = "Trạng thái không được để trống.")]
    public string Status { get; set; } = "PUBLISHED";
}

public class AdminGrammarStatsDto
{
    public int Total { get; set; }
    public int Published { get; set; }
    public int Draft { get; set; }
    public int Pending { get; set; }
    public int Archived { get; set; }
    public Dictionary<int, int> ByHsk { get; set; } = new();
}

public class AdminExerciseStatsDto
{
    public int Total { get; set; }
    public int Published { get; set; }
    public int Draft { get; set; }
    public int Pending { get; set; }
    public int Archived { get; set; }
    public Dictionary<int, int> ByHsk { get; set; } = new();
    public Dictionary<string, int> BySkill { get; set; } = new();
    public Dictionary<string, int> ByType { get; set; } = new();
}

public class ReviewContentDto
{
    [Required(ErrorMessage = "Trạng thái không được để trống.")]
    public string Status { get; set; } = "PENDING_REVIEW"; // PENDING_REVIEW, PUBLISHED, DRAFT

    public string? ReviewNotes { get; set; }
}

public class BatchReviewContentDto
{
    [Required(ErrorMessage = "Danh sách ID không được để trống.")]
    public List<Guid> Ids { get; set; } = new();

    [Required(ErrorMessage = "Trạng thái không được để trống.")]
    public string Status { get; set; } = "PENDING_REVIEW";

    public string? ReviewNotes { get; set; }
}

public class BatchReviewResultDto
{
    public int ProcessedCount { get; set; }
    public int SkippedCount { get; set; }
    public List<string> SkippedReasons { get; set; } = new();
}

public class HanziRequirementDto
{
    public int HskLevel { get; set; }
    public int RequirementType { get; set; } // 1: Handwriting, 2: Recognition
}

public class HanziCharacterDto
{
    public Guid Id { get; set; }
    public string Character { get; set; } = string.Empty;
    public string? Pinyin { get; set; }
    public string? SinoVietnamese { get; set; }
    public string? MeaningVi { get; set; }
    public int? StrokeCount { get; set; }
    public string? Radical { get; set; }
    public int FirstHskLevel { get; set; }
    public List<HanziRequirementDto> Requirements { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class UpdateHanziCharacterDto
{
    [Required(ErrorMessage = "Pinyin không được để trống.")]
    public string Pinyin { get; set; } = string.Empty;

    public string? SinoVietnamese { get; set; }
    public string? MeaningVi { get; set; }
    public int? StrokeCount { get; set; }
    public string? Radical { get; set; }
    [Range(1, 6)]
    public int FirstHskLevel { get; set; } = 1;
}

public class AdminHanziStatsDto
{
    public int Total { get; set; }
    public Dictionary<int, int> ByHsk { get; set; } = new();
}

public class LessonReleaseReadinessDto
{
    public Guid LessonId { get; set; }
    public int LessonNumber { get; set; }
    public string TitleZh { get; set; } = string.Empty;
    public string TitleVi { get; set; } = string.Empty;
    public string CurrentStatus { get; set; } = string.Empty;
    public bool IsReadyForPublish { get; set; }
    public bool DialogueValid { get; set; }
    public bool ListeningValid { get; set; }
    public int VocabCount { get; set; }
    public int GrammarCount { get; set; }
    public int ExerciseCount { get; set; }
    public bool AudioFilesExist { get; set; }
    public bool HumanReviewCompleted { get; set; }
    public string ReadinessState { get; set; } = "BLOCKED"; // PUBLISHED, READY_TO_PUBLISH, PENDING_REVIEW, BLOCKED
    public string? UnitStatus { get; set; }
    public Guid? UpdatedByUserId { get; set; }
    public List<string> BlockerReasons { get; set; } = new();
}

public class CoursePublicationReadinessDto
{
    public Guid CourseId { get; set; }
    public int HskLevel { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public string CourseStatus { get; set; } = string.Empty;
    public int UnitCount { get; set; }
    public int? StandardLessonTarget { get; set; }
    public int TotalLessons { get; set; }
    public int PublishedCount { get; set; }
    public int DraftCount { get; set; }
    public int ReadyToPublishCount { get; set; }
    public int PendingReviewCount { get; set; }
    public int BlockedCount { get; set; }
    public List<LessonReleaseReadinessDto> Lessons { get; set; } = new();
}
