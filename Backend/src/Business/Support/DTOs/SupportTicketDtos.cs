using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Business.Support.DTOs;

public class CreateTicketRequestDto
{
    [Required(ErrorMessage = "Tiêu đề không được để trống")]
    [MaxLength(250, ErrorMessage = "Tiêu đề tối đa 250 ký tự")]
    public string Subject { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mô tả sự cố không được để trống")]
    [MaxLength(4000, ErrorMessage = "Mô tả tối đa 4000 ký tự")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Danh mục không được để trống")]
    public string Category { get; set; } = "OTHER"; // CONTENT, TECHNICAL, ACCOUNT, BILLING, OTHER

    public string Priority { get; set; } = "MEDIUM"; // URGENT, HIGH, MEDIUM, LOW

    public string? ContextModule { get; set; }
    public string? ContextUrl { get; set; }
}

public class AddTicketMessageRequestDto
{
    [Required(ErrorMessage = "Nội dung phản hồi không được để trống")]
    [MaxLength(4000, ErrorMessage = "Nội dung phản hồi tối đa 4000 ký tự")]
    public string Message { get; set; } = string.Empty;

    public bool IsInternal { get; set; } = false; // Only Support/Admin can send internal notes
}

public class AssignTicketRequestDto
{
    [Required(ErrorMessage = "AssigneeId không được để trống")]
    public Guid AssigneeId { get; set; }
}

public class UpdateTicketStatusRequestDto
{
    [Required(ErrorMessage = "Trạng thái mới không được để trống")]
    public string Status { get; set; } = string.Empty; // NEW, IN_PROGRESS, WAITING_STUDENT, RESOLVED, CLOSED
    public string? Note { get; set; }
}

public class EscalateContentIssueRequestDto
{
    [Required(ErrorMessage = "Ghi chú chuyển tiếp không được để trống")]
    public string Note { get; set; } = string.Empty;
}

public class SupportStaffDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class TicketMessageDto
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public Guid SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string SenderRole { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsInternal { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TicketActivityDto
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public string ActorRole { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public class TicketDetailDto
{
    public Guid Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public Guid ReporterId { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public string ReporterEmail { get; set; } = string.Empty;
    public string ReporterRole { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid? AssigneeId { get; set; }
    public string AssigneeName { get; set; } = string.Empty;
    public string? ContextModule { get; set; }
    public string? ContextUrl { get; set; }
    public string? ContentIssueId { get; set; }
    public DateTime SlaDeadline { get; set; }
    public bool IsOverdue { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public List<TicketMessageDto> Messages { get; set; } = new();
    public List<TicketActivityDto> History { get; set; } = new();
}

public class TicketSummaryDto
{
    public Guid Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public Guid ReporterId { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public string ReporterEmail { get; set; } = string.Empty;
    public string ReporterRole { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid? AssigneeId { get; set; }
    public string AssigneeName { get; set; } = string.Empty;
    public string? ContentIssueId { get; set; }
    public DateTime SlaDeadline { get; set; }
    public bool IsOverdue { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int MessageCount { get; set; }
}

public class TicketFilterDto
{
    public string? Search { get; set; }
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public string? Category { get; set; }
    public string? Assignee { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
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
