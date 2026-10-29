namespace ZhongWenHub.Application.DTOs.Users;

public class AdminUserDetailDto : AdminUserListItemDto
{
    public string? Phone { get; set; }
    public string? Notes { get; set; }
    public string? LockReason { get; set; }
    public string? LockedAt { get; set; }
    public UserLearningSummaryDto LearningSummary { get; set; } = new();
}
