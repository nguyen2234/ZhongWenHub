using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Business.QuestionBank.DTOs;

public class QuestionBankItemDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = "multiple-choice";
    public string Skill { get; set; } = "reading";
    public int HskLevel { get; set; }
    public string Difficulty { get; set; } = "MEDIUM";
    public string Title { get; set; } = string.Empty;
    public string Instruction { get; set; } = string.Empty;
    public string? PromptHanzi { get; set; }
    public string? PromptPinyin { get; set; }
    public string? PromptVietnamese { get; set; }
    public string? AudioUrl { get; set; }
    public string? OptionsJson { get; set; }
    public List<string> Options { get; set; } = [];
    public int? CorrectOptionIndex { get; set; }
    public string? CorrectAnswer { get; set; }
    public string? Explanation { get; set; }
    public bool HasSubstantiveExplanation { get; set; }
    public bool IsReported { get; set; }
    public int XpReward { get; set; } = 10;
    public string Status { get; set; } = "DRAFT";
    public string ReviewStatus { get; set; } = "DRAFT";
    public string? Tags { get; set; }
    public string? SourceId { get; set; }
    public string? SourceLicense { get; set; }
    public double? QualityScore { get; set; }
    public string? ContentHash { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNotes { get; set; }
    public string AdministrativeApprovalStatus { get; set; } = "NONE";
    public string? AdministrativeApprovalScope { get; set; }
    public string? AdministrativeApprovalSource { get; set; }
    public string? AdministrativeApprovalNotes { get; set; }
    public DateTime? AdministrativeApprovedAt { get; set; }
    public string HumanAcademicReviewStatus { get; set; } = "NOT_REVIEWED";
    public Guid? LessonId { get; set; }
    public string? LessonTitle { get; set; }
    public Guid? GrammarPointId { get; set; }
    public string? GrammarTitle { get; set; }
    public Guid? VocabularyId { get; set; }
    public string? VocabularyHanzi { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateQuestionBankItemDto
{
    [Required]
    public string Type { get; set; } = "multiple-choice";

    [Required]
    public string Skill { get; set; } = "reading";

    [Range(1, 6)]
    public int HskLevel { get; set; } = 1;

    public string Difficulty { get; set; } = "MEDIUM";

    [Required(ErrorMessage = "Tiêu đề câu hỏi không được để trống.")]
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
    public List<string>? Options { get; set; }
    public int? CorrectOptionIndex { get; set; }
    public string? CorrectAnswer { get; set; }
    public string? Explanation { get; set; }
    public int XpReward { get; set; } = 10;
    public string Status { get; set; } = "DRAFT";
    public string? Tags { get; set; }
    public string? SourceId { get; set; }
    public string? SourceLicense { get; set; }
    public Guid? LessonId { get; set; }
    public Guid? GrammarPointId { get; set; }
    public Guid? VocabularyId { get; set; }
}

public class UpdateQuestionBankItemDto : CreateQuestionBankItemDto
{
}

public class QuestionBankStatsDto
{
    public int Total { get; set; }
    public int Published { get; set; }
    public int Draft { get; set; }
    public int PendingReview { get; set; }
    public int ValidatedReview { get; set; }
    public int NeedsAcademicReview { get; set; }
    public int ApprovedReview { get; set; }
    public int RejectedReview { get; set; }
    public int AdminApprovedCount { get; set; }
    public int AdminUnapprovedCount { get; set; }
    public int AdminApprovedDraftCount { get; set; }
    public int HumanApprovedCount { get; set; }
    public int Archived { get; set; }
    public int WithSubstantiveExplanation { get; set; }
    public int ReportedCount { get; set; }
    public int LinkedToLessons { get; set; }
    public int StandaloneBank { get; set; }
    public Dictionary<int, int> ByHsk { get; set; } = new();
    public Dictionary<string, int> BySkill { get; set; } = new();
    public Dictionary<string, int> ByType { get; set; } = new();
    public Dictionary<string, int> ByDifficulty { get; set; } = new();
    public Dictionary<string, int> ByReviewStatus { get; set; } = new();
    public Dictionary<string, int> ByAdministrativeApprovalStatus { get; set; } = new();
}

public class CheckDuplicatesRequestDto
{
    public int HskLevel { get; set; } = 1;
    public string Type { get; set; } = "multiple-choice";
    public string? PromptHanzi { get; set; }
    public string? PromptVietnamese { get; set; }
    public string? CorrectAnswer { get; set; }
    public Guid? ExcludeId { get; set; }
}

public class DuplicateMatchDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int HskLevel { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string ReviewStatus { get; set; } = string.Empty;
    public string? PromptHanzi { get; set; }
    public string MatchReason { get; set; } = "CONTENT_HASH_EXACT";
}

public class CheckDuplicatesResultDto
{
    public bool HasDuplicates { get; set; }
    public string ContentHash { get; set; } = string.Empty;
    public List<DuplicateMatchDto> Matches { get; set; } = [];
}

public class QuestionImportItemDto
{
    public string Type { get; set; } = "multiple-choice";
    public string Skill { get; set; } = "reading";
    public int HskLevel { get; set; } = 1;
    public string? Difficulty { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Instruction { get; set; } = string.Empty;
    public string? PromptHanzi { get; set; }
    public string? PromptPinyin { get; set; }
    public string? PromptVietnamese { get; set; }
    public string? AudioUrl { get; set; }
    public List<string>? Options { get; set; }
    public string? OptionsJson { get; set; }
    public int? CorrectOptionIndex { get; set; }
    public string? CorrectAnswer { get; set; }
    public string? Explanation { get; set; }
    public int XpReward { get; set; } = 10;
    public string? Tags { get; set; }
    public string? SourceId { get; set; }
    public string? SourceLicense { get; set; }
    public Guid? LessonId { get; set; }
    public Guid? GrammarPointId { get; set; }
    public Guid? VocabularyId { get; set; }
}

public class ImportQuestionsRequestDto
{
    [Required]
    public List<QuestionImportItemDto> Items { get; set; } = [];
    public string? DefaultSourceId { get; set; }
    public string? DefaultSourceLicense { get; set; }
    public bool DryRun { get; set; } = false;
}

public class ImportItemRejectionDto
{
    public int Index { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}

public class ImportQuestionsResultDto
{
    public bool DryRun { get; set; }
    public int TotalReceived { get; set; }
    public int ImportedCount { get; set; }
    public int DuplicateSkippedCount { get; set; }
    public int RejectedCount { get; set; }
    public List<Guid> ImportedIds { get; set; } = [];
    public List<ImportItemRejectionDto> Rejections { get; set; } = [];
}

public class GenerateQuestionsRequestDto
{
    [Range(1, 4)]
    public int HskLevel { get; set; } = 1;

    public string Skill { get; set; } = "vocabulary";

    public string Type { get; set; } = "multiple-choice";

    public string Difficulty { get; set; } = "MEDIUM";

    [Range(1, 30)]
    public int Count { get; set; } = 10;

    public Guid? LessonId { get; set; }
    public Guid? GrammarPointId { get; set; }
    public bool DryRun { get; set; } = false;
}

public class GenerateQuestionsResultDto
{
    public bool DryRun { get; set; }
    public int RequestedCount { get; set; }
    public int GeneratedCount { get; set; }
    public int DuplicateSkippedCount { get; set; }
    public int ValidationRejectedCount { get; set; }
    public string GeneratorMode { get; set; } = "DETERMINISTIC_SYLLABUS";
    public List<QuestionBankItemDto> PreviewItems { get; set; } = [];
}

public class ReviewQuestionRequestDto
{
    [Required]
    public string Decision { get; set; } = "APPROVED"; // APPROVED | REJECTED | PENDING_REVIEW
    public string? ReviewNotes { get; set; }
    public bool PublishImmediately { get; set; } = false;
}

public class BatchReviewQuestionsRequestDto
{
    [Required]
    public List<Guid> QuestionIds { get; set; } = [];
    [Required]
    public string Decision { get; set; } = "APPROVED";
    public string? ReviewNotes { get; set; }
    public bool PublishImmediately { get; set; } = false;
}

public class BatchActionResultDto
{
    public int RequestedCount { get; set; }
    public int UpdatedCount { get; set; }
    public int SkippedCount { get; set; }
    public List<string> Errors { get; set; } = [];
}

public class BulkAdministrativeApprovalRequestDto
{
    [Range(1, 4)]
    public int MinHskLevel { get; set; } = 1;

    [Range(1, 4)]
    public int MaxHskLevel { get; set; } = 4;

    [StringLength(120)]
    public string Scope { get; set; } = "BULK_HSK14_PROJECT_OWNER_ADMIN_APPROVAL";

    [StringLength(120)]
    public string Source { get; set; } = "PROJECT_OWNER_BULK_ADMIN_DECISION";

    [StringLength(1000)]
    public string Notes { get; set; } =
        "Project owner bulk administrative approval for HSK 1-4 bank. Questions remain DRAFT and require human academic review before PUBLISHED.";

    public bool IncludeBaselinePublished { get; set; } = true;
    public bool DryRun { get; set; } = true;
}

public class BulkAdministrativeApprovalResultDto
{
    public bool DryRun { get; set; }
    public int NewlyAdminApprovedDraftCount { get; set; }
    public int BaselinePublishedMarkedCount { get; set; }
    public int TotalAdminApprovedHsk14Count { get; set; }
    public int UnapprovedActiveHsk14Count { get; set; }
    public int RejectedPreservedCount { get; set; }
    public int PublishedCount { get; set; }
    public int NewHumanAcademicSignOffCount { get; set; }
    public DateTime ExecutedAt { get; set; }
    public string Notes { get; set; } = string.Empty;
}

// =========================================================================
// Student Practice Sessions & Adaptive Learning DTOs (NO ANSWER LEAK)
// =========================================================================

public class CreatePracticeSessionRequestDto
{
    public int? HskLevel { get; set; }
    public string? Skill { get; set; }
    public string? Difficulty { get; set; }
    public string? Type { get; set; }
    [Range(1, 30)]
    public int QuestionCount { get; set; } = 10;
    public string Mode { get; set; } = "random"; // random, weakness, mistake-review, skill, hsk-filter
    public bool PrioritizeWeakness { get; set; } = false;
}

public class PracticeQuestionSelectionReasonDto
{
    public string ReasonCode { get; set; } = "GENERAL_PRACTICE";
    public string ReasonLabel { get; set; } = "Ôn tập tổng hợp theo cấu hình";
}

/// <summary>
/// Public/student practice question payload.
/// Intentionally omits CorrectOptionIndex, CorrectAnswer, and Explanation before grading!
/// </summary>
public class StudentPracticeQuestionDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = "multiple-choice";
    public string Skill { get; set; } = "reading";
    public int HskLevel { get; set; }
    public string Difficulty { get; set; } = "MEDIUM";
    public string Title { get; set; } = string.Empty;
    public string Instruction { get; set; } = string.Empty;
    public string? PromptHanzi { get; set; }
    public string? PromptPinyin { get; set; }
    public string? PromptVietnamese { get; set; }
    public string? AudioUrl { get; set; }
    public List<string> Options { get; set; } = [];
    public string? OptionsJson { get; set; }
    public int XpReward { get; set; } = 10;
    public Guid? LessonId { get; set; }
    public Guid? GrammarPointId { get; set; }
    public string? KnowledgePointId { get; set; }
    public string? SelectionReasonCode { get; set; }
    public string? SelectionReasonLabel { get; set; }
}

public class PracticeSessionDto
{
    public Guid SessionId { get; set; }
    public int? HskLevel { get; set; }
    public string? Skill { get; set; }
    public string? Difficulty { get; set; }
    public string Mode { get; set; } = "random";
    public string Status { get; set; } = "IN_PROGRESS";
    public int TotalQuestions { get; set; }
    public int CorrectCount { get; set; }
    public int XpAwarded { get; set; }
    public double Accuracy { get; set; }
    public int TimeSpentSeconds { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<StudentPracticeQuestionDto> Questions { get; set; } = [];
}

public class SubmitPracticeAnswerDto
{
    public Guid QuestionId { get; set; }
    public int? SelectedOption { get; set; }
    public List<string>? OrderedTokens { get; set; }
    public List<string>? MatchedPairs { get; set; }
    public string? TextAnswer { get; set; }
}

public class SubmitPracticeSessionRequestDto
{
    public List<SubmitPracticeAnswerDto> Answers { get; set; } = [];
    public int TimeSpentSeconds { get; set; } = 60;
}

public class PracticeQuestionReviewItemDto
{
    public Guid QuestionId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Skill { get; set; } = string.Empty;
    public int HskLevel { get; set; }
    public string Difficulty { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public string GivenAnswer { get; set; } = string.Empty;
    public string? CorrectAnswer { get; set; }
    public int? CorrectOptionIndex { get; set; }
    public string? Explanation { get; set; }
}

public class SubmitPracticeSessionResultDto
{
    public Guid SessionId { get; set; }
    public string Status { get; set; } = "COMPLETED";
    public int TotalQuestions { get; set; }
    public int CorrectCount { get; set; }
    public double Accuracy { get; set; }
    public int XpAwarded { get; set; }
    public bool AlreadyCompleted { get; set; }
    public int TimeSpentSeconds { get; set; }
    public DateTime CompletedAt { get; set; }
    public List<PracticeQuestionReviewItemDto> QuestionResults { get; set; } = [];
    public List<AdaptiveRecommendationDto> UpdatedWeakAreas { get; set; } = [];
}

public class PracticeSessionHistoryItemDto
{
    public Guid SessionId { get; set; }
    public int? HskLevel { get; set; }
    public string? Skill { get; set; }
    public string? Difficulty { get; set; }
    public string Mode { get; set; } = "random";
    public string Status { get; set; } = "IN_PROGRESS";
    public int TotalQuestions { get; set; }
    public int CorrectCount { get; set; }
    public double Accuracy { get; set; }
    public int XpAwarded { get; set; }
    public int TimeSpentSeconds { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class AdaptiveRecommendationDto
{
    public string Key { get; set; } = string.Empty;
    public string Category { get; set; } = "skill"; // skill | grammar | vocabulary | mistake
    public string Title { get; set; } = string.Empty;
    public int HskLevel { get; set; } = 1;
    public string? RecommendedSkill { get; set; }
    public double Accuracy { get; set; }
    public int TotalAttempts { get; set; }
    public int WrongCount { get; set; }
    public double WeaknessScore { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class ReportQuestionRequestDto
{
    [Required(ErrorMessage = "Vui lòng nhập lý do báo cáo câu hỏi.")]
    [StringLength(300)]
    public string Reason { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Details { get; set; }
}

public class ReportQuestionResultDto
{
    public Guid QuestionId { get; set; }
    public string ReviewStatus { get; set; } = string.Empty;
    public string Tags { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class PracticeStatBucketDto
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int TotalAttempts { get; set; }
    public int CorrectCount { get; set; }
    public double Accuracy { get; set; }
}

public class AdaptiveRecommendationsResponseDto
{
    public int TotalPublishedQuestions { get; set; }
    public Dictionary<int, int> PublishedByHsk { get; set; } = new();
    public Dictionary<string, int> PublishedBySkill { get; set; } = new();
    public Dictionary<string, int> PublishedByDifficulty { get; set; } = new();
    public Dictionary<string, int> PublishedByType { get; set; } = new();
    public List<int> AvailableHskLevels { get; set; } = [];
    public Dictionary<string, List<int>> AvailableHskLevelsByType { get; set; } = new();
    public int MistakeReviewCount { get; set; }
    public List<AdaptiveRecommendationDto> WeakAreas { get; set; } = [];
    public List<PracticeStatBucketDto> SkillStats { get; set; } = [];
    public List<PracticeStatBucketDto> HskStats { get; set; } = [];
    public List<PracticeStatBucketDto> GrammarStats { get; set; } = [];
}

