namespace ZhongWenHub.Application.DTOs.Users;

public class AdminUserListItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string HskLevel { get; set; } = "HSK 1";
    public string Status { get; set; } = "ACTIVE";
    public List<string> Roles { get; set; } = new();
    public double ProgressPercentage { get; set; } = 0;
    public string JoinedAt { get; set; } = string.Empty;
    public string JoinedDateRaw { get; set; } = string.Empty;
    public string LastActiveAt { get; set; } = string.Empty;
    public string LastActiveDateRaw { get; set; } = string.Empty;
}
