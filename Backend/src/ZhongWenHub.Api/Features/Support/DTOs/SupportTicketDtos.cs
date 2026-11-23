using System;
using System.Collections.Generic;

namespace ZhongWenHub.Api.Features.Support.DTOs;

public class SupportTicketDto
{
    public string Id { get; set; } = string.Empty;
    public Guid TicketId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? AssigneeId { get; set; }
    public string AssigneeName { get; set; } = string.Empty;
    public string? ContextModule { get; set; }
    public string? ContextUrl { get; set; }
    public string? ContentIssueId { get; set; }
    public DateTime SlaDeadline { get; set; }
    public bool IsOverdue { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<TicketNoteDto> Notes { get; set; } = new();
    public List<TicketActivityDto> History { get; set; } = new();
}

public class TicketNoteDto
{
    public string Id { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsInternal { get; set; }
}

public class TicketActivityDto
{
    public string Id { get; set; } = string.Empty;
    public string ActorName { get; set; } = string.Empty;
    public string ActorRole { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public class TicketFiltersDto
{
    public string? Search { get; set; }
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public string? Category { get; set; }
    public string? Assignee { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public class CreateSupportTicketDto
{
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = "OTHER";
    public string Priority { get; set; } = "MEDIUM";
    public string? ContextModule { get; set; }
    public string? ContextUrl { get; set; }
}

public class UpdateTicketStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
}

public class AssignTicketDto
{
    public Guid? AssigneeId { get; set; }
    public string AssigneeName { get; set; } = string.Empty;
}

public class AddTicketMessageDto
{
    public string Content { get; set; } = string.Empty;
    public bool IsInternal { get; set; } = true;
}

public class EscalateContentIssueDto
{
    public string TargetContentId { get; set; } = string.Empty;
    public string TargetContentType { get; set; } = string.Empty;
    public string TargetContentTitle { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string IssueType { get; set; } = string.Empty;
    public string Priority { get; set; } = "HIGH";
    public string ReportedBy { get; set; } = string.Empty;
    public string? SupportStaffName { get; set; }
}

public class SupportMetricsDto
{
    public int Total { get; set; }
    public int NewCount { get; set; }
    public int InProgress { get; set; }
    public int Resolved { get; set; }
    public int Urgent { get; set; }
    public int SlaOverdue { get; set; }
    public double AvgResolutionHours { get; set; }
    public double SatisfactionRate { get; set; }
}
