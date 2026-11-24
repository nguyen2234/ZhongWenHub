using System;
using System.Collections.Generic;

namespace ZhongWenHub.Features.AI.DTOs;

public class DiagnosticQuestionDto
{
    public string Id { get; set; } = string.Empty;
    public int HskLevel { get; set; } = 1;
    public string SkillCategory { get; set; } = "grammar";
    public string TopicTitle { get; set; } = string.Empty;
    public string PromptZh { get; set; } = string.Empty;
    public string? PromptPinyin { get; set; }
    public string? PromptVi { get; set; }
    public List<string> Options { get; set; } = new();
}

public class DiagnosticSessionStartDto
{
    public Guid SessionId { get; set; }
    public string AssessmentType { get; set; } = "HSK_PLACEMENT_SCREENING";
    public int TotalQuestions { get; set; }
    public int MaxDurationMinutes { get; set; } = 60;
    public List<DiagnosticQuestionDto> Questions { get; set; } = new();
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
}

public class DiagnosticAnswerSubmissionDto
{
    public string QuestionId { get; set; } = string.Empty;
    public int SelectedIndex { get; set; } = -1;
    public string? UserAnswer { get; set; }
}

public class DiagnosticSubmissionDto
{
    public Guid SessionId { get; set; }
    public List<DiagnosticAnswerSubmissionDto> Answers { get; set; } = new();
    public int TimeSpentSeconds { get; set; }
}

public class DiagnosticQuestionResultDto
{
    public string QuestionId { get; set; } = string.Empty;
    public int HskLevel { get; set; }
    public string SkillCategory { get; set; } = string.Empty;
    public string TopicTitle { get; set; } = string.Empty;
    public string PromptZh { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
    public int UserSelectedIndex { get; set; }
    public int CorrectIndex { get; set; }
    public bool IsCorrect { get; set; }
    public string ExplanationVi { get; set; } = string.Empty;
}

public class DiagnosticResultDto
{
    public Guid SessionId { get; set; }
    public string AssessmentType { get; set; } = "HSK_PLACEMENT_SCREENING";
    public int EstimatedHskLevel { get; set; }
    public double ConfidenceScore { get; set; }
    public int TotalQuestions { get; set; }
    public int CorrectCount { get; set; }
    public double AccuracyPercent { get; set; }
    public int TimeSpentSeconds { get; set; }
    public string AssessmentSummaryVi { get; set; } = string.Empty;
    public string AssessmentLimitationsVi { get; set; } = string.Empty;
    public Dictionary<string, double> SkillAccuracyPercent { get; set; } = new();
    public Dictionary<int, double> HskLevelAccuracyPercent { get; set; } = new();
    public List<DiagnosticQuestionResultDto> DetailedQuestions { get; set; } = new();
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}

public class ConfirmTargetHskDto
{
    public int TargetHskLevel { get; set; }
}

public class SessionQuestionSnapshotItem
{
    public string QuestionId { get; set; } = string.Empty;
    public int HskLevel { get; set; }
    public string SkillCategory { get; set; } = string.Empty;
    public string TopicTitle { get; set; } = string.Empty;
    public string PromptZh { get; set; } = string.Empty;
    public string? PromptPinyin { get; set; }
    public string? PromptVi { get; set; }
    public List<string> Options { get; set; } = new();
    public int CorrectIndex { get; set; }
    public string ExplanationVi { get; set; } = string.Empty;
}
