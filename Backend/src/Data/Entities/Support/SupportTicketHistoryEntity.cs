using System;

namespace ZhongWenHub.Data.Entities.Support;

public class SupportTicketHistoryEntity : BaseEntity
{
    public Guid TicketId { get; set; }
    public SupportTicketEntity? Ticket { get; set; }
    public Guid ActorId { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public string ActorRole { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
