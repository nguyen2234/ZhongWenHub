using Microsoft.AspNetCore.Identity;

namespace ZhongWenHub.Data.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public UserStatus Status { get; set; } = UserStatus.ACTIVE;
    public string? LockReason { get; set; }
    public DateTime? LockedAt { get; set; }
    public string? Notes { get; set; }
    public string? CurrentHskLevel { get; set; } = "HSK 1";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
}
