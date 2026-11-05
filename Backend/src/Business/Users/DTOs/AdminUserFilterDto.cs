namespace ZhongWenHub.Business.Users.DTOs;

public class AdminUserFilterDto
{
    public string? Search { get; set; }
    public string? Status { get; set; } = "ALL";
    public string? HskLevel { get; set; } = "ALL";
    public string? Role { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; } = "joinedDate";
    public string? SortDirection { get; set; } = "desc";
}
