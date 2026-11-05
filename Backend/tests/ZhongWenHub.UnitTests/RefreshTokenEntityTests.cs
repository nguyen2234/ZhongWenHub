using ZhongWenHub.Data.Entities;

namespace ZhongWenHub.UnitTests;

public class RefreshTokenEntityTests
{
    [Fact]
    public void IsActive_WhenNotRevokedAndNotExpired_ReturnsTrue()
    {
        var token = new RefreshToken
        {
            Id = Guid.NewGuid(),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            RevokedAt = null
        };

        Assert.True(token.IsActive);
        Assert.False(token.IsExpired);
        Assert.False(token.IsRevoked);
    }

    [Fact]
    public void IsActive_WhenExpired_ReturnsFalse()
    {
        var token = new RefreshToken
        {
            Id = Guid.NewGuid(),
            ExpiresAt = DateTime.UtcNow.AddMinutes(-5),
            RevokedAt = null
        };

        Assert.False(token.IsActive);
        Assert.True(token.IsExpired);
        Assert.False(token.IsRevoked);
    }

    [Fact]
    public void IsActive_WhenRevoked_ReturnsFalse()
    {
        var token = new RefreshToken
        {
            Id = Guid.NewGuid(),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            RevokedAt = DateTime.UtcNow.AddMinutes(-1)
        };

        Assert.False(token.IsActive);
        Assert.False(token.IsExpired);
        Assert.True(token.IsRevoked);
    }

    [Fact]
    public void Revoke_SetsRevocationProperties()
    {
        var token = new RefreshToken
        {
            Id = Guid.NewGuid(),
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        token.Revoke("127.0.0.1", "Rotated", "new-hash-123");

        Assert.True(token.IsRevoked);
        Assert.False(token.IsActive);
        Assert.NotNull(token.RevokedAt);
        Assert.Equal("127.0.0.1", token.RevokedByIp);
        Assert.Equal("Rotated", token.RevocationReason);
        Assert.Equal("new-hash-123", token.ReplacedByTokenHash);
        Assert.NotNull(token.UpdatedAt);
    }
}
