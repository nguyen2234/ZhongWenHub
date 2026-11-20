using System;

namespace ZhongWenHub.Data.Entities.Support;

public class SupportTicketMessageEntity : BaseEntity
{
    public Guid TicketId { get; set; }
    public SupportTicketEntity? Ticket { get; set; }
    public Guid SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string SenderRole { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsInternal { get; set; } // Staff-only internal note if true
}
