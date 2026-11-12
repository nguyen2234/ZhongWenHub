using System;
using System.Collections.Generic;

namespace ZhongWenHub.Business.AILearning.DTOs;

// ==================== AI CONVERSATION ====================

public sealed class ConversationScenarioDto
{
    public string Code { get; init; } = string.Empty;
    public int MinHskLevel { get; init; }
    public string TitleVi { get; init; } = string.Empty;
    public string TitleZh { get; init; } = string.Empty;
    public string DescriptionVi { get; init; } = string.Empty;
}

public sealed class StartConversationRequestDto
{
    public int HskLevel { get; set; } = 1;
    public string ScenarioCode { get; set; } = "daily-greeting";
    public bool ShowPinyin { get; set; } = true;
    public bool ShowVietnamese { get; set; } = false;
}

public sealed class SendConversationMessageRequestDto
{
    public string Message { get; set; } = string.Empty;
    public bool RequestVietnamese { get; set; }
    public ConversationAudioInputDto? AudioMetadata { get; set; }
}

/// <summary>
/// Extensibility contract for future STT/TTS integration. V1 processes text only and never claims pronunciation scoring.
/// </summary>
public sealed class ConversationAudioInputDto
{
    public string? InputMode { get; set; } = "text"; // text | stt_transcript
    public string? TranscriptSource { get; set; }
}

public sealed class UpdateConversationPreferencesDto
{
    public bool ShowPinyin { get; set; }
    public bool ShowVietnamese { get; set; }
}

public sealed class ConversationCorrectionDto
{
    public bool HasError { get; init; }
    public string? ErrorCategory { get; init; }
    public string? ExplanationVi { get; init; }
    public string? NaturalSuggestionZh { get; init; }
    public string? NaturalSuggestionPinyin { get; init; }
    public string? NaturalSuggestionVi { get; init; }
}

public sealed class AiConversationMessageDto
{
    public Guid Id { get; init; }
    public string Role { get; init; } = "user";
    public string ContentZh { get; init; } = string.Empty;
    public string? Pinyin { get; init; }
    public string? ContentVi { get; init; }
    public ConversationCorrectionDto? Correction { get; init; }
    public List<string> SuggestedReplies { get; init; } = new();
    public DateTime CreatedAt { get; init; }
}

public sealed class AiConversationSessionDto
{
    public Guid Id { get; init; }
    public int HskLevel { get; init; }
    public string ScenarioCode { get; init; } = string.Empty;
    public string ScenarioTitle { get; init; } = string.Empty;
    public string Status { get; init; } = "ACTIVE";
    public bool ShowPinyin { get; init; }
    public bool ShowVietnamese { get; init; }
    public int MessageCount { get; init; }
    public DateTime StartedAt { get; init; }
    public DateTime? EndedAt { get; init; }
    public string? SummaryVi { get; init; }
    public bool PronunciationEvaluationSupported { get; init; } = false;
    public string SpeechCapabilityNote { get; init; } = "V1 hỗ trợ hội thoại văn bản (sẵn sàng mở rộng STT/TTS, chưa đánh giá phát âm).";
    public List<AiConversationMessageDto> Messages { get; init; } = new();
}

// ==================== AI EXERCISE GENERATOR ====================

public sealed class GenerateAiExercisesRequestDto
{
    public int HskLevel { get; set; } = 1;
    public Guid? LessonId { get; set; }
    public string SourceType { get; set; } = "VOCABULARY"; // VOCABULARY, GRAMMAR, READING, WEAKNESS
    public string ExerciseType { get; set; } = "multiple-choice"; // multiple-choice, fill-blank, sentence-order, meaning-match, pinyin-match, error-correction
    public int Count { get; set; } = 3;
}

public sealed class AiGeneratedExerciseDto
{
    public Guid Id { get; init; }
    public int HskLevel { get; init; }
    public Guid? LessonId { get; init; }
    public string SourceType { get; init; } = string.Empty;
    public string ExerciseType { get; init; } = string.Empty;
    public string OriginTag { get; init; } = "AI_GENERATED";
    public string AcademicStatus { get; init; } = "UNAPPROVED_EXPERIMENTAL";
    public string? SourceReviewNote { get; init; }
    public string PromptZh { get; init; } = string.Empty;
    public string? PromptPinyin { get; init; }
    public string? PromptVi { get; init; }
    public List<string> Options { get; init; } = new();
    public int? CorrectIndex { get; init; }
    public string? CorrectAnswer { get; init; }
    public string ExplanationVi { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}

public sealed class SubmitAiExerciseAttemptDto
{
    public string? UserAnswer { get; set; }
    public int? SelectedIndex { get; set; }
}

public sealed class AiExerciseAttemptResultDto
{
    public Guid AttemptId { get; init; }
    public Guid AiExerciseId { get; init; }
    public bool IsCorrect { get; init; }
    public int? CorrectIndex { get; init; }
    public string? CorrectAnswer { get; init; }
    public string ExplanationVi { get; init; } = string.Empty;
    public string SkillCategory { get; init; } = string.Empty;
    public DateTime AttemptedAt { get; init; }
}

// ==================== AI ERROR ANALYSIS ====================

public sealed class SkillStatisticDto
{
    public string SkillCategory { get; init; } = string.Empty;
    public string LabelVi { get; init; } = string.Empty;
    public int TotalAttempts { get; init; }
    public int CorrectAttempts { get; init; }
    public int IncorrectAttempts { get; init; }
    public double AccuracyPercent { get; init; }
    public bool HasData { get; init; }
    public List<string> WeakTopics { get; init; } = new();
}

public sealed class ErrorAnalysisWeakPointDto
{
    public string TopicTitle { get; init; } = string.Empty;
    public string SkillCategory { get; init; } = string.Empty;
    public int HskLevel { get; init; }
    public int TotalAttempts { get; init; }
    public int IncorrectAttempts { get; init; }
    public double AccuracyPercent { get; init; }
    public string EvidenceVi { get; init; } = string.Empty;
    public string SuggestedActionRoute { get; init; } = "/ai-exercises";
}

public sealed class ErrorAnalysisReportDto
{
    public int TotalAttemptsAnalyzed { get; init; }
    public double OverallAccuracyPercent { get; init; }
    public bool HasAudioEvaluation { get; init; } = false;
    public string AudioEvaluationNote { get; init; } = "Chưa có dữ liệu âm thanh được chấm điểm; hệ thống không suy đoán lỗi phát âm.";
    public List<SkillStatisticDto> Skills { get; init; } = new();
    public List<ErrorAnalysisWeakPointDto> WeakPoints { get; init; } = new();
    public DateTime GeneratedAt { get; init; }
}

// ==================== PERSONALIZED LEARNING ====================

public sealed class LearningRecommendationItemDto
{
    public string Id { get; init; } = string.Empty;
    public int Priority { get; init; }
    public string Category { get; init; } = string.Empty; // srs-due, weak-skill, resume-lesson, next-lesson, ai-conversation
    public string Title { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
    public string ActionLabel { get; init; } = string.Empty;
    public string DestinationRoute { get; init; } = string.Empty;
    public string Badge { get; init; } = string.Empty;
}

public sealed class PersonalizedLearningPlanDto
{
    public int CurrentHskLevel { get; init; }
    public int DailyGoalMinutes { get; init; }
    public int StreakDays { get; init; }
    public int DueSrsWordsCount { get; init; }
    public int MasteredWordsCount { get; init; }
    public int CompletedLessonsCount { get; init; }
    public int TotalStudyMinutesLast7Days { get; init; }
    public int ActiveDaysLast7Days { get; init; }
    public double OverallAccuracyPercent { get; init; }
    public List<LearningRecommendationItemDto> Recommendations { get; init; } = new();
    public string? AiCoachingExplanationVi { get; init; }
    public string? AiFocusTipVi { get; init; }
    public bool UsedLlmExplanation { get; init; }
    public DateTime GeneratedAt { get; init; }
}
