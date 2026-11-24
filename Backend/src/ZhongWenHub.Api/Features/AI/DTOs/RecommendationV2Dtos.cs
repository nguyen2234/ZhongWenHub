using System;
using System.Collections.Generic;

namespace ZhongWenHub.Features.AI.DTOs;

public class PersonalizedLearningPlanV2Dto
{
    public Guid UserId { get; set; }
    public string AssessmentStatus { get; set; } = "NOT_ASSESSED";
    public int CurrentHskLevel { get; set; } = 1;
    public int? EstimatedHskLevel { get; set; }
    public int AvailableMinutes { get; set; } = 20;
    public double ConfidenceScore { get; set; } = 0.0;
    public double OverallMasteryPercent { get; set; } = 0.0;
    public int DueSrsCount { get; set; } = 0;
    public int MasteredWordsCount { get; set; } = 0;
    public string? InProgressLessonId { get; set; }
    public int StreakDays { get; set; } = 0;
    public List<RecommendationItemV2Dto> Recommendations { get; set; } = new();
    public string? AiCoachingExplanationVi { get; set; }
    public string? AiFocusTipVi { get; set; }
    public bool UsedLlmExplanation { get; set; } = false;
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

public class RecommendationItemV2Dto
{
    public string Id { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // srs-due, weak-skill, resume-lesson, next-lesson, ai-conversation, diagnostic-test
    public string Title { get; set; } = string.Empty;
    public int Priority { get; set; } = 1;
    public double UtilityScore { get; set; } = 0.0; // Multi-factor calculated score in [0.0, 1.0]
    public string Reason { get; set; } = string.Empty;
    public string PedagogicalGoalVi { get; set; } = string.Empty;
    public Dictionary<string, object> EvidenceData { get; set; } = new();
    public int EstimatedMinutes { get; set; } = 10;
    public string DestinationRoute { get; set; } = string.Empty;
    public string Badge { get; set; } = string.Empty;
    public string ActionLabel { get; set; } = "Bắt đầu ngay";
}

