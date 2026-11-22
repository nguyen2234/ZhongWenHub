namespace ZhongWenHub.Data.Entities;

public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? ReplacedByTokenHash { get; set; }
    public string? CreatedByIp { get; set; }
    public string? RevokedByIp { get; set; }
    public string? RevocationReason { get; set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsRevoked => RevokedAt != null;
    public bool IsActive => !IsRevoked && !IsExpired;

    public void Revoke(string? ipAddress, string? reason = null, string? replacedBy = null)
    {
        RevokedAt = DateTime.UtcNow;
        RevokedByIp = ipAddress;
        RevocationReason = reason;
        ReplacedByTokenHash = replacedBy;
        UpdatedAt = DateTime.UtcNow;
    }
}
