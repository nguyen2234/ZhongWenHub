using System;
using System.Collections.Generic;

namespace ZhongWenHub.Business.Content.DTOs;

public class ContentIssueDto
{
    public Guid Id { get; set; }
    public string IssueCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string IssueType { get; set; } = "OTHER";
    public string Priority { get; set; } = "MEDIUM";
    public string TargetContentId { get; set; } = string.Empty;
    public string TargetContentType { get; set; } = string.Empty;
    public string TargetContentTitle { get; set; } = string.Empty;
    public string TargetContentRoute { get; set; } = string.Empty;
    public string ReportedBy { get; set; } = string.Empty;
    public Guid? SupportTicketId { get; set; }
    public string SupportStaffName { get; set; } = string.Empty;
    public Guid? ContentManagerId { get; set; }
    public string? ContentManagerName { get; set; }
    public string Status { get; set; } = "NEW";
    public DateTime? ResolvedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public string? ResolutionNotes { get; set; }
    public string? FeedbackToSupport { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<ContentIssueActivityDto> History { get; set; } = new();
}

public class ContentIssueActivityDto
{
    public Guid Id { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public string ActorRole { get; set; } = "SUPPORT";
    public string Action { get; set; } = string.Empty;
    public string? Message { get; set; }
    public DateTime Timestamp { get; set; }
}

public class CreateContentIssueDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string IssueType { get; set; } = "OTHER";
    public string Priority { get; set; } = "MEDIUM";
    public string TargetContentId { get; set; } = string.Empty;
    public string TargetContentType { get; set; } = "CURRICULUM_LESSON";
    public string TargetContentTitle { get; set; } = string.Empty;
    public string? TargetContentRoute { get; set; }
    public string ReportedBy { get; set; } = string.Empty;
    public Guid? SupportTicketId { get; set; }
    public string? SupportStaffName { get; set; }
}

public class AssignContentIssueDto
{
    public string? ContentManagerName { get; set; }
}

public class ResolveContentIssueDto
{
    public string Notes { get; set; } = string.Empty;
    public string Feedback { get; set; } = string.Empty;
}

public class ReopenContentIssueDto
{
    public string Reason { get; set; } = string.Empty;
}

public class ContentIssueFilterDto
{
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public string? IssueType { get; set; }
    public string? Search { get; set; }
}
