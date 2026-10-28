using Microsoft.AspNetCore.Identity;
using ZhongWenHub.Domain.Enums;

namespace ZhongWenHub.Infrastructure.Identity;

public class ApplicationUser : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public UserStatus Status { get; set; } = UserStatus.ACTIVE;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
}
