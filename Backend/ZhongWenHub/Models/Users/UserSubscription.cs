namespace ZhongWenHub.Data.Entities;

public class UserSubscription : BaseEntity
{
    public Guid UserId { get; set; }
    public string Plan { get; set; } = "Free"; // "Free", "Basic", "Premium"
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime? EndDate { get; set; }
    public string Status { get; set; } = "ACTIVE"; // "ACTIVE", "EXPIRED", "CANCELLED"

    // Navigation
    public ApplicationUser User { get; set; } = null!;
}
