using Microsoft.EntityFrameworkCore;
using ZhongWenHub.Domain.Entities;

namespace ZhongWenHub.Application.Abstractions;

public interface IApplicationDbContext
{
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<AuthAuditRecord> AuthAuditRecords { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
