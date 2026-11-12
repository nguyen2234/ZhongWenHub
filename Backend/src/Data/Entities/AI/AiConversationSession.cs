using System;
using System.Collections.Generic;

namespace ZhongWenHub.Data.Entities.AI;

public class AiConversationSession : BaseEntity
{
    public Guid UserId { get; set; }
    public string SessionType { get; set; } = "CONVERSATION"; // TUTOR, CONVERSATION
    public int HskLevel { get; set; } = 1;
    public string ScenarioCode { get; set; } = "daily-greeting";
    public string ScenarioTitle { get; set; } = string.Empty;
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, COMPLETED
    public bool ShowPinyin { get; set; } = true;
    public bool ShowVietnamese { get; set; } = false;
    public int MessageCount { get; set; } = 0;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EndedAt { get; set; }
    public string? SummaryVi { get; set; }

    public virtual ApplicationUser? User { get; set; }
    public virtual ICollection<AiMessage> Messages { get; set; } = new List<AiMessage>();
}
