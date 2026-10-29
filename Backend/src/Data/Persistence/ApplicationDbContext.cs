using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ZhongWenHub.Data.Entities;

namespace ZhongWenHub.Data.Persistence;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid,
    IdentityUserClaim<Guid>, IdentityUserRole<Guid>, IdentityUserLogin<Guid>,
    IdentityRoleClaim<Guid>, IdentityUserToken<Guid>>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AuthAuditRecord> AuthAuditRecords => Set<AuthAuditRecord>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Customize Identity Table Names for PostgreSQL
        builder.Entity<ApplicationUser>(b =>
        {
            b.ToTable("users");
            b.Property(u => u.DisplayName).HasMaxLength(100).IsRequired();
            b.Property(u => u.AvatarUrl).HasColumnType("text");
            b.Property(u => u.Status)
                .HasConversion(
                    v => v.ToString(),
                    v => Enum.Parse<UserStatus>(v))
                .HasMaxLength(30)
                .IsRequired();
            b.Property(u => u.LockReason).HasMaxLength(500);
            b.Property(u => u.LockedAt).HasColumnType("timestamptz");
            b.Property(u => u.Notes).HasMaxLength(1000);
            b.Property(u => u.CurrentHskLevel).HasMaxLength(20).HasDefaultValue("HSK 1");
            b.Property(u => u.CreatedAt).HasColumnType("timestamptz").IsRequired();
            b.Property(u => u.UpdatedAt).HasColumnType("timestamptz");
            b.Property(u => u.LastLoginAt).HasColumnType("timestamptz");
            b.Property(u => u.DeletedAt).HasColumnType("timestamptz");
            b.Property(u => u.IsDeleted).HasDefaultValue(false);

            b.HasQueryFilter(u => !u.IsDeleted);
        });

        builder.Entity<ApplicationRole>(b =>
        {
            b.ToTable("roles");
            b.Property(r => r.Description).HasMaxLength(255);
        });

        builder.Entity<IdentityUserRole<Guid>>(b =>
        {
            b.ToTable("user_roles");
        });

        builder.Entity<IdentityUserClaim<Guid>>(b =>
        {
            b.ToTable("user_claims");
        });

        builder.Entity<IdentityUserLogin<Guid>>(b =>
        {
            b.ToTable("user_logins");
        });

        builder.Entity<IdentityRoleClaim<Guid>>(b =>
        {
            b.ToTable("role_claims");
        });

        builder.Entity<IdentityUserToken<Guid>>(b =>
        {
            b.ToTable("user_tokens");
        });

        // RefreshTokens Configuration
        builder.Entity<RefreshToken>(b =>
        {
            b.ToTable("refresh_tokens");
            b.HasKey(rt => rt.Id);
            b.Property(rt => rt.TokenHash).HasMaxLength(128).IsRequired();
            b.Property(rt => rt.CreatedAt).HasColumnType("timestamptz").IsRequired();
            b.Property(rt => rt.ExpiresAt).HasColumnType("timestamptz").IsRequired();
            b.Property(rt => rt.RevokedAt).HasColumnType("timestamptz");
            b.Property(rt => rt.UpdatedAt).HasColumnType("timestamptz");
            b.Property(rt => rt.CreatedByIp).HasMaxLength(50);
            b.Property(rt => rt.RevokedByIp).HasMaxLength(50);
            b.Property(rt => rt.RevocationReason).HasMaxLength(255);
            b.Property(rt => rt.ReplacedByTokenHash).HasMaxLength(128);

            b.HasIndex(rt => rt.TokenHash).HasDatabaseName("idx_refresh_tokens_hash");
            b.HasIndex(rt => rt.UserId).HasDatabaseName("idx_refresh_tokens_user_id");
            b.HasIndex(rt => new { rt.UserId, rt.ExpiresAt }).HasDatabaseName("idx_refresh_tokens_user_expiry");
        });

        // AuthAuditRecord Configuration
        builder.Entity<AuthAuditRecord>(b =>
        {
            b.ToTable("auth_audit_records");
            b.HasKey(a => a.Id);
            b.Property(a => a.Action).HasMaxLength(50).IsRequired();
            b.Property(a => a.Username).HasMaxLength(100);
            b.Property(a => a.IpAddress).HasMaxLength(50);
            b.Property(a => a.UserAgent).HasMaxLength(500);
            b.Property(a => a.Details).HasMaxLength(1000);
            b.Property(a => a.CreatedAt).HasColumnType("timestamptz").IsRequired();
            b.Property(a => a.UpdatedAt).HasColumnType("timestamptz");

            b.HasIndex(a => a.UserId).HasDatabaseName("idx_audit_records_user_id");
            b.HasIndex(a => a.CreatedAt).HasDatabaseName("idx_audit_records_created_at");
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        foreach (var entry in ChangeTracker.Entries<ApplicationUser>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
