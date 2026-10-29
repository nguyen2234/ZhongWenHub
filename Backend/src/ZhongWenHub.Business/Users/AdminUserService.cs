using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Users.DTOs;


using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.Users;

public class AdminUserService : IAdminUserService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<AdminUserService> _logger;

    public AdminUserService(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        ApplicationDbContext dbContext,
        ILogger<AdminUserService> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<PagedResponse<AdminUserListItemDto>> GetUsersAsync(AdminUserFilterDto filter, CancellationToken cancellationToken = default)
    {
        var query = _userManager.Users.AsNoTracking().Where(u => !u.IsDeleted);

        // 1. Search (Name, Email, or Username)
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(u =>
                u.DisplayName.ToLower().Contains(search) ||
                (u.Email != null && u.Email.ToLower().Contains(search)) ||
                (u.UserName != null && u.UserName.ToLower().Contains(search)));
        }

        // 2. Status filter
        if (!string.IsNullOrWhiteSpace(filter.Status) && !filter.Status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            if (Enum.TryParse<UserStatus>(filter.Status, true, out var parsedStatus))
            {
                query = query.Where(u => u.Status == parsedStatus);
            }
        }

        // 3. HSK Level filter
        if (!string.IsNullOrWhiteSpace(filter.HskLevel) && !filter.HskLevel.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(u => u.CurrentHskLevel == filter.HskLevel);
        }

        // 4. Role filter
        if (!string.IsNullOrWhiteSpace(filter.Role) && !filter.Role.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var role = await _roleManager.FindByNameAsync(filter.Role);
            if (role != null)
            {
                var userIdsInRole = _dbContext.UserRoles
                    .Where(ur => ur.RoleId == role.Id)
                    .Select(ur => ur.UserId);
                query = query.Where(u => userIdsInRole.Contains(u.Id));
            }
        }

        // 5. Sorting
        var isAsc = string.Equals(filter.SortDirection, "asc", StringComparison.OrdinalIgnoreCase);
        query = (filter.SortBy?.ToLower()) switch
        {
            "name" => isAsc ? query.OrderBy(u => u.DisplayName) : query.OrderByDescending(u => u.DisplayName),
            "lastactive" => isAsc ? query.OrderBy(u => u.LastLoginAt ?? u.CreatedAt) : query.OrderByDescending(u => u.LastLoginAt ?? u.CreatedAt),
            "hsklevel" => isAsc ? query.OrderBy(u => u.CurrentHskLevel) : query.OrderByDescending(u => u.CurrentHskLevel),
            _ => isAsc ? query.OrderBy(u => u.CreatedAt) : query.OrderByDescending(u => u.CreatedAt),
        };

        var totalItems = await query.CountAsync(cancellationToken);
        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var users = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        // Fetch roles for the users in current page
        var userIds = users.Select(u => u.Id).ToList();
        var userRolesMap = await (
            from ur in _dbContext.UserRoles
            join r in _dbContext.Roles on ur.RoleId equals r.Id
            where userIds.Contains(ur.UserId)
            select new { ur.UserId, RoleName = r.Name }
        ).ToListAsync(cancellationToken);

        var rolesGrouped = userRolesMap
            .GroupBy(x => x.UserId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.RoleName!).ToList());

        var items = users.Select(u =>
        {
            var userRoles = rolesGrouped.TryGetValue(u.Id, out var rList) ? rList : new List<string>();
            return MapToListItem(u, userRoles);
        }).ToList();

        return new PagedResponse<AdminUserListItemDto>(items, totalItems, page, pageSize);
    }

    public async Task<AdminUserKpisDto> GetKpisAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var thirtyDaysAgo = now.AddDays(-30);

        var query = _userManager.Users.AsNoTracking().Where(u => !u.IsDeleted);

        var total = await query.CountAsync(cancellationToken);
        var active = await query.CountAsync(u => u.Status == UserStatus.ACTIVE, cancellationToken);
        var locked = await query.CountAsync(u => u.Status == UserStatus.LOCKED || u.Status == UserStatus.SUSPENDED, cancellationToken);
        var new30d = await query.CountAsync(u => u.CreatedAt >= thirtyDaysAgo, cancellationToken);

        return new AdminUserKpisDto
        {
            TotalLearners = total,
            ActiveLearners = active,
            LockedLearners = locked,
            NewLearners30d = new30d
        };
    }

    public async Task<AdminUserDetailDto?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null || user.IsDeleted)
        {
            return null;
        }

        var roles = await _userManager.GetRolesAsync(user);
        return MapToDetail(user, roles);
    }

    public async Task<(bool Success, AdminUserDetailDto? User, string? ErrorMessage, int StatusCode)> CreateUserAsync(
        CreateAdminUserDto dto,
        Guid currentUserId,
        string? ipAddress,
        CancellationToken cancellationToken = default)
    {
        var email = dto.Email.Trim().ToLower();
        var existing = await _userManager.FindByEmailAsync(email);
        if (existing != null && !existing.IsDeleted)
        {
            return (false, null, "Email này đã được sử dụng bởi người dùng khác.", 409);
        }

        var (isActorSuperAdmin, isActorAdmin) = await GetActorPrivilegesAsync(currentUserId);
        if (!isActorSuperAdmin && !isActorAdmin)
        {
            return (false, null, "Bạn không có quyền tạo tài khoản quản trị.", 403);
        }

        var targetRoles = dto.Roles != null && dto.Roles.Count > 0
            ? dto.Roles
            : new List<string> { RoleConstants.Student };

        // Privilege escalation check: only SUPER_ADMIN can create SUPER_ADMIN
        if (targetRoles.Contains(RoleConstants.SuperAdmin) && !isActorSuperAdmin)
        {
            await RecordAuditAsync(currentUserId, null, "PRIVILEGE_ESCALATION_BLOCKED", ipAddress, null, false,
                "Admin cố gắng tạo tài khoản với quyền SUPER_ADMIN.", cancellationToken);
            return (false, null, "Chỉ Super Admin mới có quyền tạo tài khoản Super Admin.", 403);
        }

        var parsedStatus = UserStatus.ACTIVE;
        if (!string.IsNullOrWhiteSpace(dto.Status) && Enum.TryParse<UserStatus>(dto.Status, true, out var s))
        {
            parsedStatus = s;
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email.Split('@')[0] + "_" + Guid.NewGuid().ToString("N")[..4],
            Email = email,
            EmailConfirmed = true,
            DisplayName = dto.Name.Trim(),
            CurrentHskLevel = dto.InitialHsk ?? "HSK 1",
            Status = parsedStatus,
            Notes = dto.Notes,
            PhoneNumber = dto.Phone,
            CreatedAt = DateTime.UtcNow
        };

        var password = string.IsNullOrWhiteSpace(dto.Password) ? "UserPassword123!" : dto.Password;
        var createResult = await _userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
        {
            var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
            return (false, null, $"Không thể tạo tài khoản: {errors}", 400);
        }

        foreach (var role in targetRoles)
        {
            if (await _roleManager.RoleExistsAsync(role))
            {
                await _userManager.AddToRoleAsync(user, role);
            }
        }

        await RecordAuditAsync(currentUserId, null, "USER_CREATED", ipAddress, null, true,
            $"Tạo tài khoản {user.Email} với vai trò: {string.Join(", ", targetRoles)}", cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var roles = await _userManager.GetRolesAsync(user);
        return (true, MapToDetail(user, roles), null, 201);
    }

    public async Task<(bool Success, AdminUserDetailDto? User, string? ErrorMessage, int StatusCode)> UpdateUserAsync(
        Guid id,
        UpdateAdminUserDto dto,
        Guid currentUserId,
        string? ipAddress,
        CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null || user.IsDeleted)
        {
            return (false, null, "Không tìm thấy người dùng.", 404);
        }

        var (isActorSuperAdmin, isActorAdmin) = await GetActorPrivilegesAsync(currentUserId);
        var targetIsSuperAdmin = await _userManager.IsInRoleAsync(user, RoleConstants.SuperAdmin);

        // Security: Admin cannot modify Super Admin
        if (targetIsSuperAdmin && !isActorSuperAdmin)
        {
            await RecordAuditAsync(currentUserId, null, "PRIVILEGE_ESCALATION_BLOCKED", ipAddress, null, false,
                $"Admin cố gắng chỉnh sửa thông tin của Super Admin {user.Email}.", cancellationToken);
            return (false, null, "Chỉ Super Admin mới có quyền chỉnh sửa tài khoản Super Admin khác.", 403);
        }

        // Email duplicate check
        var newEmail = dto.Email.Trim().ToLower();
        if (!string.Equals(user.Email, newEmail, StringComparison.OrdinalIgnoreCase))
        {
            var existing = await _userManager.FindByEmailAsync(newEmail);
            if (existing != null && existing.Id != user.Id && !existing.IsDeleted)
            {
                return (false, null, "Email này đã được sử dụng bởi người dùng khác.", 409);
            }
            user.Email = newEmail;
            user.UserName = newEmail.Split('@')[0] + "_" + user.Id.ToString("N")[..4];
        }

        user.DisplayName = dto.Name.Trim();
        if (!string.IsNullOrWhiteSpace(dto.HskLevel))
        {
            user.CurrentHskLevel = dto.HskLevel;
        }

        if (!string.IsNullOrWhiteSpace(dto.Status) && Enum.TryParse<UserStatus>(dto.Status, true, out var parsedStatus))
        {
            user.Status = parsedStatus;
        }

        if (dto.Notes != null)
        {
            user.Notes = dto.Notes;
        }

        if (dto.Phone != null)
        {
            user.PhoneNumber = dto.Phone;
        }

        user.UpdatedAt = DateTime.UtcNow;
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            return (false, null, $"Cập nhật thất bại: {errors}", 400);
        }

        await RecordAuditAsync(currentUserId, null, "USER_UPDATED", ipAddress, null, true,
            $"Cập nhật thông tin người dùng {user.Email}", cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var roles = await _userManager.GetRolesAsync(user);
        return (true, MapToDetail(user, roles), null, 200);
    }

    public async Task<(bool Success, AdminUserDetailDto? User, string? ErrorMessage, int StatusCode)> LockUserAsync(
        Guid id,
        string? reason,
        Guid currentUserId,
        string? ipAddress,
        CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null || user.IsDeleted)
        {
            return (false, null, "Không tìm thấy người dùng.", 404);
        }

        var (isActorSuperAdmin, isActorAdmin) = await GetActorPrivilegesAsync(currentUserId);
        var targetIsSuperAdmin = await _userManager.IsInRoleAsync(user, RoleConstants.SuperAdmin);

        // Security check 1: Admin cannot lock Super Admin
        if (targetIsSuperAdmin && !isActorSuperAdmin)
        {
            await RecordAuditAsync(currentUserId, null, "PRIVILEGE_ESCALATION_BLOCKED", ipAddress, null, false,
                $"Admin cố gắng khóa tài khoản Super Admin {user.Email}.", cancellationToken);
            return (false, null, "Chỉ Super Admin mới có quyền khóa tài khoản Super Admin.", 403);
        }

        // Security check 2: Cannot lock the last Super Admin
        if (targetIsSuperAdmin)
        {
            var superAdminRole = await _roleManager.FindByNameAsync(RoleConstants.SuperAdmin);
            if (superAdminRole != null)
            {
                var activeSuperAdminCount = await (
                    from ur in _dbContext.UserRoles
                    join u in _dbContext.Users on ur.UserId equals u.Id
                    where ur.RoleId == superAdminRole.Id && !u.IsDeleted && u.Status == UserStatus.ACTIVE
                    select u.Id
                ).CountAsync(cancellationToken);

                if (activeSuperAdminCount <= 1)
                {
                    return (false, null, "Không thể khóa Super Admin đang hoạt động duy nhất trong hệ thống.", 400);
                }
            }
        }

        user.Status = UserStatus.LOCKED;
        user.LockReason = !string.IsNullOrWhiteSpace(reason) ? reason : "Tài khoản bị khóa bởi Quản trị viên.";
        user.LockedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        await _userManager.UpdateAsync(user);

        // Revoke all active refresh tokens of the locked user immediately
        var activeTokens = await _dbContext.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null && rt.ExpiresAt > DateTime.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.Revoke(ipAddress, $"Tài khoản bị khóa: {user.LockReason}");
        }

        await RecordAuditAsync(currentUserId, null, "USER_LOCKED", ipAddress, null, true,
            $"Khóa tài khoản {user.Email}. Lý do: {user.LockReason}", cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var roles = await _userManager.GetRolesAsync(user);
        return (true, MapToDetail(user, roles), null, 200);
    }

    public async Task<(bool Success, AdminUserDetailDto? User, string? ErrorMessage, int StatusCode)> UnlockUserAsync(
        Guid id,
        Guid currentUserId,
        string? ipAddress,
        CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null || user.IsDeleted)
        {
            return (false, null, "Không tìm thấy người dùng.", 404);
        }

        var (isActorSuperAdmin, isActorAdmin) = await GetActorPrivilegesAsync(currentUserId);
        var targetIsSuperAdmin = await _userManager.IsInRoleAsync(user, RoleConstants.SuperAdmin);

        if (targetIsSuperAdmin && !isActorSuperAdmin)
        {
            return (false, null, "Chỉ Super Admin mới có quyền mở khóa tài khoản Super Admin.", 403);
        }

        user.Status = UserStatus.ACTIVE;
        user.LockReason = null;
        user.LockedAt = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _userManager.UpdateAsync(user);

        await RecordAuditAsync(currentUserId, null, "USER_UNLOCKED", ipAddress, null, true,
            $"Mở khóa tài khoản {user.Email}", cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var roles = await _userManager.GetRolesAsync(user);
        return (true, MapToDetail(user, roles), null, 200);
    }

    public async Task<(bool Success, AdminUserDetailDto? User, string? ErrorMessage, int StatusCode)> UpdateStatusAsync(
        Guid id,
        string status,
        string? reason,
        Guid currentUserId,
        string? ipAddress,
        CancellationToken cancellationToken = default)
    {
        if (string.Equals(status, "LOCKED", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, "SUSPENDED", StringComparison.OrdinalIgnoreCase))
        {
            return await LockUserAsync(id, reason, currentUserId, ipAddress, cancellationToken);
        }

        if (string.Equals(status, "ACTIVE", StringComparison.OrdinalIgnoreCase))
        {
            return await UnlockUserAsync(id, currentUserId, ipAddress, cancellationToken);
        }

        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null || user.IsDeleted)
        {
            return (false, null, "Không tìm thấy người dùng.", 404);
        }

        if (Enum.TryParse<UserStatus>(status, true, out var newStatus))
        {
            user.Status = newStatus;
            user.UpdatedAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            await RecordAuditAsync(currentUserId, null, "USER_STATUS_CHANGED", ipAddress, null, true,
                $"Thay đổi trạng thái tài khoản {user.Email} sang {newStatus}", cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);

            var roles = await _userManager.GetRolesAsync(user);
            return (true, MapToDetail(user, roles), null, 200);
        }

        return (false, null, $"Trạng thái {status} không hợp lệ.", 400);
    }

    public async Task<(bool Success, AdminUserDetailDto? User, string? ErrorMessage, int StatusCode)> UpdateRolesAsync(
        Guid id,
        List<string> newRoles,
        Guid currentUserId,
        string? ipAddress,
        CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null || user.IsDeleted)
        {
            return (false, null, "Không tìm thấy người dùng.", 404);
        }

        var (isActorSuperAdmin, isActorAdmin) = await GetActorPrivilegesAsync(currentUserId);
        var targetIsSuperAdmin = await _userManager.IsInRoleAsync(user, RoleConstants.SuperAdmin);

        // Security check 1: Admin cannot modify Super Admin roles
        if (targetIsSuperAdmin && !isActorSuperAdmin)
        {
            await RecordAuditAsync(currentUserId, null, "PRIVILEGE_ESCALATION_BLOCKED", ipAddress, null, false,
                $"Admin cố gắng thay đổi vai trò của Super Admin {user.Email}.", cancellationToken);
            return (false, null, "Chỉ Super Admin mới có quyền thay đổi vai trò của Super Admin.", 403);
        }

        // Security check 2: Admin cannot grant Super Admin role to anyone
        if (newRoles.Contains(RoleConstants.SuperAdmin) && !isActorSuperAdmin)
        {
            await RecordAuditAsync(currentUserId, null, "PRIVILEGE_ESCALATION_BLOCKED", ipAddress, null, false,
                $"Admin cố gắng tự cấp hoặc gán quyền SUPER_ADMIN cho {user.Email}.", cancellationToken);
            return (false, null, "Chỉ Super Admin mới có quyền phân quyền SUPER_ADMIN.", 403);
        }

        // Security check 3: User cannot modify their own roles (self privilege escalation)
        if (id == currentUserId && !isActorSuperAdmin)
        {
            await RecordAuditAsync(currentUserId, null, "PRIVILEGE_ESCALATION_BLOCKED", ipAddress, null, false,
                "Người dùng cố gắng tự thay đổi vai trò của chính mình.", cancellationToken);
            return (false, null, "Bạn không thể tự thay đổi vai trò của chính mình.", 403);
        }

        // Security check 4: Cannot remove the last Super Admin
        if (targetIsSuperAdmin && !newRoles.Contains(RoleConstants.SuperAdmin))
        {
            var superAdminRole = await _roleManager.FindByNameAsync(RoleConstants.SuperAdmin);
            if (superAdminRole != null)
            {
                var activeSuperAdminCount = await (
                    from ur in _dbContext.UserRoles
                    join u in _dbContext.Users on ur.UserId equals u.Id
                    where ur.RoleId == superAdminRole.Id && !u.IsDeleted && u.Status == UserStatus.ACTIVE
                    select u.Id
                ).CountAsync(cancellationToken);

                if (activeSuperAdminCount <= 1)
                {
                    return (false, null, "Không thể gỡ bỏ vai trò Super Admin duy nhất trong hệ thống.", 400);
                }
            }
        }

        // Validate all new roles exist
        foreach (var r in newRoles)
        {
            if (!await _roleManager.RoleExistsAsync(r))
            {
                return (false, null, $"Vai trò '{r}' không tồn tại trong hệ thống.", 400);
            }
        }

        var currentRoles = await _userManager.GetRolesAsync(user);
        var rolesToRemove = currentRoles.Except(newRoles).ToList();
        var rolesToAdd = newRoles.Except(currentRoles).ToList();

        if (rolesToRemove.Count > 0)
        {
            await _userManager.RemoveFromRolesAsync(user, rolesToRemove);
        }

        if (rolesToAdd.Count > 0)
        {
            await _userManager.AddToRolesAsync(user, rolesToAdd);
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        await RecordAuditAsync(currentUserId, null, "USER_ROLES_UPDATED", ipAddress, null, true,
            $"Cập nhật vai trò {user.Email}: thêm [{string.Join(", ", rolesToAdd)}], xóa [{string.Join(", ", rolesToRemove)}]", cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var updatedRoles = await _userManager.GetRolesAsync(user);
        return (true, MapToDetail(user, updatedRoles), null, 200);
    }

    private async Task<(bool isSuperAdmin, bool isAdmin)> GetActorPrivilegesAsync(Guid actorId)
    {
        var actor = await _userManager.FindByIdAsync(actorId.ToString());
        if (actor == null) return (false, false);

        var isSuperAdmin = await _userManager.IsInRoleAsync(actor, RoleConstants.SuperAdmin);
        var isAdmin = isSuperAdmin || await _userManager.IsInRoleAsync(actor, RoleConstants.Admin);

        return (isSuperAdmin, isAdmin);
    }

    private static AdminUserListItemDto MapToListItem(ApplicationUser u, List<string> roles)
    {
        var joinedDate = u.CreatedAt.ToString("dd/MM/yyyy");
        var lastActive = u.LastLoginAt.HasValue
            ? u.LastLoginAt.Value.ToString("dd/MM/yyyy HH:mm")
            : "Vừa mới tạo";

        return new AdminUserListItemDto
        {
            Id = u.Id.ToString(),
            Name = u.DisplayName,
            Email = u.Email ?? string.Empty,
            AvatarUrl = u.AvatarUrl,
            HskLevel = u.CurrentHskLevel ?? "HSK 1",
            Status = u.Status.ToString(),
            Roles = roles,
            ProgressPercentage = 0,
            JoinedAt = joinedDate,
            JoinedDateRaw = u.CreatedAt.ToString("yyyy-MM-dd"),
            LastActiveAt = lastActive,
            LastActiveDateRaw = (u.LastLoginAt ?? u.CreatedAt).ToString("o")
        };
    }

    private static AdminUserDetailDto MapToDetail(ApplicationUser u, IEnumerable<string> roles)
    {
        var joinedDate = u.CreatedAt.ToString("dd/MM/yyyy");
        var lastActive = u.LastLoginAt.HasValue
            ? u.LastLoginAt.Value.ToString("dd/MM/yyyy HH:mm")
            : "Vừa mới tạo";

        return new AdminUserDetailDto
        {
            Id = u.Id.ToString(),
            Name = u.DisplayName,
            Email = u.Email ?? string.Empty,
            AvatarUrl = u.AvatarUrl,
            HskLevel = u.CurrentHskLevel ?? "HSK 1",
            Status = u.Status.ToString(),
            Roles = roles.ToList(),
            ProgressPercentage = 0,
            JoinedAt = joinedDate,
            JoinedDateRaw = u.CreatedAt.ToString("yyyy-MM-dd"),
            LastActiveAt = lastActive,
            LastActiveDateRaw = (u.LastLoginAt ?? u.CreatedAt).ToString("o"),
            Phone = u.PhoneNumber,
            Notes = u.Notes,
            LockReason = u.LockReason,
            LockedAt = u.LockedAt?.ToString("dd/MM/yyyy HH:mm"),
            LearningSummary = new UserLearningSummaryDto
            {
                CurrentHsk = u.CurrentHskLevel ?? "HSK 1",
                TotalXp = 0,
                StreakDays = 0,
                CompletedLessons = 0,
                TotalLessons = 35,
                ProgressPercentage = 0,
                VocabularyMastered = 0,
                SrsReviewDue = 0,
                LastStudySession = u.LastLoginAt.HasValue ? u.LastLoginAt.Value.ToString("dd/MM/yyyy") : "Chưa có hoạt động học tập"
            }
        };
    }

    private async Task RecordAuditAsync(
        Guid? userId,
        string? username,
        string action,
        string? ipAddress,
        string? userAgent,
        bool success,
        string? details,
        CancellationToken cancellationToken)
    {
        try
        {
            var audit = new AuthAuditRecord
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Username = username,
                Action = action,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                Success = success,
                Details = details,
                CreatedAt = DateTime.UtcNow
            };

            await _dbContext.AuthAuditRecords.AddAsync(audit, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi ghi AuthAuditRecord cho action {Action}", action);
        }
    }
}
