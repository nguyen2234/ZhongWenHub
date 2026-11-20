using System;
using System.Collections.Generic;

namespace ZhongWenHub.Data.Entities.Content;

public class ContentIssueEntity : BaseEntity
{
    public string IssueCode { get; set; } = string.Empty; // e.g. ISS-202611-0001
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string IssueType { get; set; } = "OTHER"; // WRONG_MEANING, WRONG_PINYIN, WRONG_ANSWER, AUDIO_ERROR, DISPLAY_ERROR, OTHER
    public string Priority { get; set; } = "MEDIUM"; // URGENT, HIGH, MEDIUM, LOW
    public string TargetContentId { get; set; } = string.Empty;
    public string TargetContentType { get; set; } = "CURRICULUM_LESSON"; // HSK_CHARACTER, CURRICULUM_LESSON, GRAMMAR_POINT, EXERCISE_QUESTION
    public string TargetContentTitle { get; set; } = string.Empty;
    public string TargetContentRoute { get; set; } = string.Empty;
    public string ReportedBy { get; set; } = string.Empty;
    public Guid? SupportTicketId { get; set; }
    public string SupportStaffName { get; set; } = string.Empty;
    public Guid? ContentManagerId { get; set; }
    public string? ContentManagerName { get; set; }
    public string Status { get; set; } = "NEW"; // NEW, TRIAGED, IN_PROGRESS, RESOLVED, CLOSED, REOPENED
    public DateTime? ResolvedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public string? ResolutionNotes { get; set; }
    public string? FeedbackToSupport { get; set; }

    public ICollection<ContentIssueActivityEntity> Activities { get; set; } = new List<ContentIssueActivityEntity>();
}
