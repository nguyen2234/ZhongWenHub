using System;
using System.Collections.Generic;

namespace ZhongWenHub.Data.Entities.Support;

public class SupportTicketEntity : BaseEntity
{
    public string TicketNumber { get; set; } = string.Empty; // e.g., TICK-202611-0001
    public Guid ReporterId { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public string ReporterEmail { get; set; } = string.Empty;
    public string ReporterRole { get; set; } = "STUDENT"; // STUDENT, TEACHER, CONTENT_MANAGER, ADMIN, SUPPORT
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = "OTHER"; // CONTENT, TECHNICAL, ACCOUNT, BILLING, OTHER
    public string Priority { get; set; } = "MEDIUM"; // URGENT, HIGH, MEDIUM, LOW
    public string Status { get; set; } = "NEW"; // NEW, IN_PROGRESS, WAITING_STUDENT, RESOLVED, CLOSED
    public Guid? AssigneeId { get; set; }
    public string AssigneeName { get; set; } = "Chưa phân công";
    public string? ContextModule { get; set; }
    public string? ContextUrl { get; set; }
    public string? ContentIssueId { get; set; } // Linked ID in Content Manager (e.g. ISS-1024)
    public DateTime SlaDeadline { get; set; }
    public bool IsOverdue { get; set; }
    public DateTime? ClosedAt { get; set; }

    public ICollection<SupportTicketMessageEntity> Messages { get; set; } = new List<SupportTicketMessageEntity>();
    public ICollection<SupportTicketHistoryEntity> History { get; set; } = new List<SupportTicketHistoryEntity>();
}
