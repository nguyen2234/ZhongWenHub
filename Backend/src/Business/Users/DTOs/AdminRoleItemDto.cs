namespace ZhongWenHub.Business.Users.DTOs;

public class AdminRoleItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int UserCount { get; set; }
    public bool IsSystemRole { get; set; } = true;
    public List<string> Permissions { get; set; } = new();
}
