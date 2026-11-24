using System;
using System.Collections.Generic;

namespace ZhongWenHub.Models.Support;

public class SupportTicket
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string TicketNumber { get; set; } = string.Empty;
    public Guid ReporterId { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public string ReporterEmail { get; set; } = string.Empty;
    public string ReporterRole { get; set; } = "STUDENT";
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = "OTHER";
    public string Priority { get; set; } = "MEDIUM";
    public string Status { get; set; } = "NEW";
    public Guid? AssigneeId { get; set; }
    public string AssigneeName { get; set; } = "Chưa phân công";
    public string? ContextModule { get; set; }
    public string? ContextUrl { get; set; }
    public string? ContentIssueId { get; set; }
    public DateTime SlaDeadline { get; set; } = DateTime.UtcNow.AddHours(24);
    public bool IsOverdue { get; set; }
    public DateTime? ClosedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<SupportTicketMessage> Messages { get; set; } = new List<SupportTicketMessage>();
    public ICollection<SupportTicketHistory> History { get; set; } = new List<SupportTicketHistory>();
}
