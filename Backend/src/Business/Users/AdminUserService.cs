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
    public const string SoleAdminEmail = "admin@gmail.com";

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

    public async Task<AdminDashboardStatsDto> GetDashboardStatsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var thirtyDaysAgo = now.AddDays(-30);

        var studentRole = await _roleManager.FindByNameAsync(RoleConstants.Student);
        var teacherRole = await _roleManager.FindByNameAsync(RoleConstants.Teacher);
        var staffRoleNames = new[] { RoleConstants.Admin, RoleConstants.ContentManager, RoleConstants.Support };
        var staffRoleIds = await _roleManager.Roles
            .Where(r => staffRoleNames.Contains(r.Name))
            .Select(r => r.Id)
            .ToListAsync(cancellationToken);

        var totalStudents = studentRole != null
            ? await (from ur in _dbContext.UserRoles
                     join u in _dbContext.Users on ur.UserId equals u.Id
                     where ur.RoleId == studentRole.Id && !u.IsDeleted
                     select ur.UserId).CountAsync(cancellationToken)
            : 0;

        var totalTeachers = teacherRole != null
            ? await (from ur in _dbContext.UserRoles
                     join u in _dbContext.Users on ur.UserId equals u.Id
                     where ur.RoleId == teacherRole.Id && !u.IsDeleted
                     select ur.UserId).CountAsync(cancellationToken)
            : 0;

        var totalStaff = await (from ur in _dbContext.UserRoles
                                join u in _dbContext.Users on ur.UserId equals u.Id
                                where staffRoleIds.Contains(ur.RoleId) && !u.IsDeleted
                                select ur.UserId)
                               .Distinct()
                               .CountAsync(cancellationToken);

        var totalActive = await _userManager.Users.AsNoTracking().CountAsync(u => !u.IsDeleted && u.Status == UserStatus.ACTIVE, cancellationToken);
        var totalLocked = await _userManager.Users.AsNoTracking().CountAsync(u => !u.IsDeleted && (u.Status == UserStatus.LOCKED || u.Status == UserStatus.SUSPENDED), cancellationToken);
        var new30d = await _userManager.Users.AsNoTracking().CountAsync(u => !u.IsDeleted && u.CreatedAt >= thirtyDaysAgo, cancellationToken);

        return new AdminDashboardStatsDto
        {
            TotalStudents = totalStudents,
            TotalTeachers = totalTeachers,
            TotalStaff = totalStaff,
            TotalCourses = await _dbContext.Courses.CountAsync(cancellationToken),
            TotalClasses = null,
            PendingSupportTickets = null,
            ActiveUsers = totalActive,
            LockedUsers = totalLocked,
            NewUsers30d = new30d
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

        var isActorAdmin = await IsActorAdminAsync(currentUserId);
        if (!isActorAdmin)
        {
            return (false, null, "Bạn không có quyền tạo tài khoản.", 403);
        }

        var targetRoles = dto.Roles != null && dto.Roles.Count > 0
            ? dto.Roles
            : new List<string> { RoleConstants.Student };

        if (targetRoles.Contains(RoleConstants.Admin))
        {
            await RecordAuditAsync(currentUserId, null, "PRIVILEGE_ESCALATION_BLOCKED", ipAddress, null, false,
                $"Cố gắng tạo thêm tài khoản với vai trò ADMIN ({email}).", cancellationToken);
            return (false, null, "Hệ thống chỉ duy trì một tài khoản Quản trị viên duy nhất (admin@gmail.com). Không thể tạo thêm tài khoản với vai trò ADMIN.", 403);
        }

        if (targetRoles.Contains("SUPER_ADMIN", StringComparer.OrdinalIgnoreCase))
        {
            return (false, null, "Vai trò SUPER_ADMIN không còn tồn tại trên hệ thống.", 400);
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

        var isActorAdmin = await IsActorAdminAsync(currentUserId);
        if (!isActorAdmin)
        {
            return (false, null, "Bạn không có quyền chỉnh sửa người dùng.", 403);
        }

        var isSoleAdmin = string.Equals(user.Email, SoleAdminEmail, StringComparison.OrdinalIgnoreCase);

        // Email duplicate check
        var newEmail = dto.Email.Trim().ToLower();
        if (isSoleAdmin && !string.Equals(user.Email, newEmail, StringComparison.OrdinalIgnoreCase))
        {
            return (false, null, "Không thể thay đổi địa chỉ email của tài khoản quản trị viên duy nhất (admin@gmail.com).", 400);
        }

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

        if (dto.Roles != null && dto.Roles.Count > 0)
        {
            var (roleSuccess, _, roleError, roleStatus) = await UpdateRolesAsync(id, dto.Roles, currentUserId, ipAddress, cancellationToken);
            if (!roleSuccess)
            {
                return (false, null, roleError, roleStatus);
            }
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

        // Security check 0: Cannot lock own account
        if (user.Id == currentUserId)
        {
            return (false, null, "Không thể tự khóa tài khoản quản trị của chính mình.", 400);
        }

        var isActorAdmin = await IsActorAdminAsync(currentUserId);
        if (!isActorAdmin)
        {
            return (false, null, "Bạn không có quyền khóa tài khoản.", 403);
        }

        // Security check 1: Cannot lock the sole admin account
        if (string.Equals(user.Email, SoleAdminEmail, StringComparison.OrdinalIgnoreCase))
        {
            await RecordAuditAsync(currentUserId, null, "ADMIN_PROTECTION_BLOCKED", ipAddress, null, false,
                $"Cố gắng khóa tài khoản quản trị viên duy nhất ({SoleAdminEmail}).", cancellationToken);
            return (false, null, "Không thể khóa tài khoản quản trị viên duy nhất trong hệ thống (admin@gmail.com).", 400);
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

        var isActorAdmin = await IsActorAdminAsync(currentUserId);
        if (!isActorAdmin)
        {
            return (false, null, "Bạn không có quyền mở khóa tài khoản.", 403);
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

        var isActorAdmin = await IsActorAdminAsync(currentUserId);
        if (!isActorAdmin)
        {
            return (false, null, "Bạn không có quyền phân quyền tài khoản.", 403);
        }

        var isSoleAdmin = string.Equals(user.Email, SoleAdminEmail, StringComparison.OrdinalIgnoreCase);

        // Security check 1: Cannot remove ADMIN from sole admin
        if (isSoleAdmin && !newRoles.Contains(RoleConstants.Admin))
        {
            return (false, null, "Không thể gỡ bỏ vai trò ADMIN của tài khoản quản trị viên duy nhất (admin@gmail.com).", 400);
        }

        // Security check 2: Cannot grant ADMIN to any other account
        if (!isSoleAdmin && newRoles.Contains(RoleConstants.Admin))
        {
            await RecordAuditAsync(currentUserId, null, "PRIVILEGE_ESCALATION_BLOCKED", ipAddress, null, false,
                $"Cố gắng cấp vai trò ADMIN cho {user.Email}.", cancellationToken);
            return (false, null, "Hệ thống chỉ duy trì một tài khoản Quản trị viên duy nhất (admin@gmail.com). Không thể cấp vai trò ADMIN cho tài khoản khác.", 403);
        }

        // Security check 3: User cannot modify their own roles (self privilege escalation) unless is Sole Admin
        if (id == currentUserId && !isSoleAdmin)
        {
            await RecordAuditAsync(currentUserId, null, "PRIVILEGE_ESCALATION_BLOCKED", ipAddress, null, false,
                "Người dùng cố gắng tự thay đổi vai trò của chính mình.", cancellationToken);
            return (false, null, "Bạn không thể tự thay đổi vai trò của chính mình.", 403);
        }

        if (newRoles.Contains("SUPER_ADMIN", StringComparer.OrdinalIgnoreCase))
        {
            return (false, null, "Vai trò SUPER_ADMIN không còn tồn tại trên hệ thống.", 400);
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

    public async Task<(bool Success, string? ErrorMessage, int StatusCode)> DeleteUserAsync(
        Guid id,
        Guid currentUserId,
        string? ipAddress,
        CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null || user.IsDeleted)
        {
            return (false, "Không tìm thấy người dùng.", 404);
        }

        // Security check: cannot delete own account
        if (user.Id == currentUserId)
        {
            return (false, "Không thể tự xóa hoặc vô hiệu hóa tài khoản quản trị của chính mình.", 400);
        }

        var isActorAdmin = await IsActorAdminAsync(currentUserId);
        if (!isActorAdmin)
        {
            return (false, "Bạn không có quyền thực hiện thao tác này.", 403);
        }

        // Security check: Cannot delete the sole admin account
        if (string.Equals(user.Email, SoleAdminEmail, StringComparison.OrdinalIgnoreCase))
        {
            await RecordAuditAsync(currentUserId, null, "ADMIN_PROTECTION_BLOCKED", ipAddress, null, false,
                $"Cố gắng xóa tài khoản quản trị viên duy nhất ({SoleAdminEmail}).", cancellationToken);
            return (false, "Không thể xóa hoặc vô hiệu hóa tài khoản quản trị viên duy nhất trong hệ thống (admin@gmail.com).", 400);
        }

        // Soft delete: marks user as deleted, sets status to SUSPENDED
        user.IsDeleted = true;
        user.Status = UserStatus.SUSPENDED;
        user.UpdatedAt = DateTime.UtcNow;

        await _userManager.UpdateAsync(user);

        // Revoke all active refresh tokens immediately
        var activeTokens = await _dbContext.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null && rt.ExpiresAt > DateTime.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.Revoke(ipAddress, "Tài khoản bị xóa / vô hiệu hóa bởi Quản trị viên.");
        }

        await RecordAuditAsync(currentUserId, null, "USER_DELETED", ipAddress, null, true,
            $"Vô hiệu hóa / xóa mềm tài khoản {user.Email}", cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return (true, null, 200);
    }

    public async Task<List<AdminRoleItemDto>> GetRolesSummaryAsync(CancellationToken cancellationToken = default)
    {
        var dbRoles = await _dbContext.Roles.AsNoTracking().ToListAsync(cancellationToken);

        var userCountsByRole = await (
            from ur in _dbContext.UserRoles
            join u in _dbContext.Users on ur.UserId equals u.Id
            where !u.IsDeleted
            group ur by ur.RoleId into g
            select new { RoleId = g.Key, Count = g.Count() }
        ).ToDictionaryAsync(x => x.RoleId, x => x.Count, cancellationToken);

        var result = new List<AdminRoleItemDto>();
        foreach (var role in dbRoles)
        {
            var count = userCountsByRole.TryGetValue(role.Id, out var c) ? c : 0;
            var permissions = GetDefaultPermissionsForRole(role.Name ?? string.Empty);

            result.Add(new AdminRoleItemDto
            {
                Id = role.Id.ToString(),
                Name = role.Name ?? string.Empty,
                Description = role.Description ?? string.Empty,
                UserCount = count,
                IsSystemRole = true,
                Permissions = permissions
            });
        }

        // Order by known hierarchy: SUPER_ADMIN, ADMIN, CONTENT_MANAGER, TEACHER, SUPPORT, STUDENT
        var order = new List<string>
        {
            RoleConstants.Admin,
            RoleConstants.ContentManager,
            RoleConstants.Teacher,
            RoleConstants.Support,
            RoleConstants.Student
        };

        return result
            .OrderBy(r => {
                var idx = order.IndexOf(r.Name);
                return idx >= 0 ? idx : 99;
            })
            .ToList();
    }

    public async Task<(bool Success, string? ErrorMessage, int StatusCode)> UpdateRoleDescriptionAsync(
        string roleName,
        string newDescription,
        Guid currentUserId,
        string? ipAddress,
        CancellationToken cancellationToken = default)
    {
        var role = await _roleManager.FindByNameAsync(roleName);
        if (role == null)
        {
            return (false, $"Không tìm thấy vai trò '{roleName}'.", 404);
        }

        var isActorAdmin = await IsActorAdminAsync(currentUserId);
        if (!isActorAdmin)
        {
            return (false, "Bạn không có quyền chỉnh sửa thông tin vai trò.", 403);
        }

        if (string.Equals(role.Name, "SUPER_ADMIN", StringComparison.OrdinalIgnoreCase))
        {
            return (false, "Vai trò SUPER_ADMIN không còn tồn tại trên hệ thống.", 400);
        }

        role.Description = newDescription.Trim();
        var updateResult = await _roleManager.UpdateAsync(role);
        if (!updateResult.Succeeded)
        {
            return (false, "Không thể cập nhật mô tả vai trò.", 400);
        }

        await RecordAuditAsync(currentUserId, null, "ROLE_DESCRIPTION_UPDATED", ipAddress, null, true,
            $"Cập nhật mô tả vai trò {role.Name}: {role.Description}", cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return (true, null, 200);
    }

    private static List<string> GetDefaultPermissionsForRole(string roleName)
    {
        return roleName.ToUpperInvariant() switch
        {
            "ADMIN" => new List<string>
            {
                "USER_VIEW", "USER_CREATE", "USER_UPDATE", "USER_LOCK", "USER_DELETE", "USER_EXPORT",
                "ROLE_VIEW", "ROLE_ASSIGN", "ROLE_UPDATE",
                "CONTENT_VIEW", "CONTENT_CREATE", "CONTENT_UPDATE", "CONTENT_APPROVE", "CONTENT_PUBLISH", "CONTENT_ARCHIVE", "CONTENT_RESTORE",
                "QUESTION_BANK_VIEW", "QUESTION_BANK_CREATE", "QUESTION_BANK_UPDATE",
                "ASSIGNMENT_VIEW", "ASSIGNMENT_CREATE", "ASSIGNMENT_GRADE",
                "TEACHER_VIEW", "TEACHER_ASSIGN", "TEACHER_EVALUATE",
                "SUPPORT_STAFF_VIEW", "SUPPORT_STAFF_ASSIGN",
                "TICKET_VIEW", "TICKET_ASSIGN", "TICKET_REPLY", "TICKET_CLOSE",
                "CONTENT_ISSUE_VIEW", "CONTENT_ISSUE_ASSIGN", "CONTENT_ISSUE_RESOLVE",
                "SYSTEM_CONFIG_VIEW", "SYSTEM_CONFIG_UPDATE",
                "AUDIT_LOG_VIEW", "CONTENT_AUDIT_VIEW", "REPORT_VIEW", "CONTENT_REPORT_VIEW"
            },
            "TEACHER" => new List<string>
            {
                "TEACHER_VIEW", "CONTENT_VIEW", "CONTENT_CREATE", "CONTENT_UPDATE",
                "QUESTION_BANK_VIEW", "QUESTION_BANK_CREATE", "QUESTION_BANK_UPDATE",
                "ASSIGNMENT_VIEW", "ASSIGNMENT_CREATE", "ASSIGNMENT_GRADE", "REPORT_VIEW"
            },
            "CONTENT_MANAGER" => new List<string>
            {
                "CONTENT_VIEW", "CONTENT_CREATE", "CONTENT_UPDATE", "CONTENT_APPROVE", "CONTENT_PUBLISH", "CONTENT_ARCHIVE", "CONTENT_RESTORE",
                "QUESTION_BANK_VIEW", "QUESTION_BANK_CREATE", "QUESTION_BANK_UPDATE",
                "CONTENT_ISSUE_VIEW", "CONTENT_ISSUE_ASSIGN", "CONTENT_ISSUE_RESOLVE",
                "CONTENT_AUDIT_VIEW", "CONTENT_REPORT_VIEW"
            },
            "SUPPORT" => new List<string>
            {
                "USER_VIEW", "SUPPORT_STAFF_VIEW", "TICKET_VIEW", "TICKET_ASSIGN", "TICKET_REPLY", "TICKET_CLOSE", "REPORT_VIEW"
            },
            "STUDENT" => new List<string>
            {
                "CONTENT_VIEW", "ASSIGNMENT_VIEW"
            },
            _ => new List<string>()
        };
    }

    private async Task<bool> IsActorAdminAsync(Guid actorId)
    {
        var actor = await _userManager.FindByIdAsync(actorId.ToString());
        if (actor == null) return false;

        return await _userManager.IsInRoleAsync(actor, RoleConstants.Admin);
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
