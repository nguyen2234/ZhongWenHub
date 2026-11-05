using System;

namespace ZhongWenHub.Data.Entities.Learning;

public class StudentXpTransaction : BaseEntity
{
    public Guid UserId { get; set; }
    public string EventId { get; set; } = string.Empty;
    public int Amount { get; set; }
    public string Source { get; set; } = string.Empty; // LESSON_COMPLETION, PRACTICE_SESSION, SRS_SESSION, MANUAL
    public string? Description { get; set; }

    public virtual ApplicationUser? User { get; set; }
}
