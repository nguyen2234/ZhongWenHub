using ZhongWenHub.Domain.Common;

namespace ZhongWenHub.Domain.Entities;

public class AuthAuditRecord : BaseEntity
{
    public Guid? UserId { get; set; }
    public string? Username { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public bool Success { get; set; }
    public string? Details { get; set; }
}
