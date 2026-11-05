using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Users.DTOs;

namespace ZhongWenHub.Business.Users;

public interface IAdminUserService
{
    Task<PagedResponse<AdminUserListItemDto>> GetUsersAsync(AdminUserFilterDto filter, CancellationToken cancellationToken = default);

    Task<AdminUserKpisDto> GetKpisAsync(CancellationToken cancellationToken = default);

    Task<AdminDashboardStatsDto> GetDashboardStatsAsync(CancellationToken cancellationToken = default);

    Task<AdminUserDetailDto?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<(bool Success, AdminUserDetailDto? User, string? ErrorMessage, int StatusCode)> CreateUserAsync(
        CreateAdminUserDto dto,
        Guid currentUserId,
        string? ipAddress,
        CancellationToken cancellationToken = default);

    Task<(bool Success, AdminUserDetailDto? User, string? ErrorMessage, int StatusCode)> UpdateUserAsync(
        Guid id,
        UpdateAdminUserDto dto,
        Guid currentUserId,
        string? ipAddress,
        CancellationToken cancellationToken = default);

    Task<(bool Success, AdminUserDetailDto? User, string? ErrorMessage, int StatusCode)> LockUserAsync(
        Guid id,
        string? reason,
        Guid currentUserId,
        string? ipAddress,
        CancellationToken cancellationToken = default);

    Task<(bool Success, AdminUserDetailDto? User, string? ErrorMessage, int StatusCode)> UnlockUserAsync(
        Guid id,
        Guid currentUserId,
        string? ipAddress,
        CancellationToken cancellationToken = default);

    Task<(bool Success, AdminUserDetailDto? User, string? ErrorMessage, int StatusCode)> UpdateStatusAsync(
        Guid id,
        string status,
        string? reason,
        Guid currentUserId,
        string? ipAddress,
        CancellationToken cancellationToken = default);

    Task<(bool Success, AdminUserDetailDto? User, string? ErrorMessage, int StatusCode)> UpdateRolesAsync(
        Guid id,
        List<string> newRoles,
        Guid currentUserId,
        string? ipAddress,
        CancellationToken cancellationToken = default);

    Task<(bool Success, string? ErrorMessage, int StatusCode)> DeleteUserAsync(
        Guid id,
        Guid currentUserId,
        string? ipAddress,
        CancellationToken cancellationToken = default);

    Task<List<AdminRoleItemDto>> GetRolesSummaryAsync(CancellationToken cancellationToken = default);

    Task<(bool Success, string? ErrorMessage, int StatusCode)> UpdateRoleDescriptionAsync(
        string roleName,
        string newDescription,
        Guid currentUserId,
        string? ipAddress,
        CancellationToken cancellationToken = default);

    Task<(bool Success, string? ErrorMessage, int StatusCode)> ResetPasswordAsync(
        Guid id,
        ResetUserPasswordDto dto,
        Guid currentUserId,
        string? ipAddress,
        CancellationToken cancellationToken = default);

    Task<(bool Success, AdminUserDetailDto? User, string? ErrorMessage, int StatusCode)> AdjustWalletBalanceAsync(
        Guid id,
        AdjustWalletBalanceDto dto,
        Guid currentUserId,
        string? ipAddress,
        CancellationToken cancellationToken = default);

    Task<(bool Success, AdminUserDetailDto? User, string? ErrorMessage, int StatusCode)> UpdateSubscriptionPlanAsync(
        Guid id,
        UpdateSubscriptionPlanDto dto,
        Guid currentUserId,
        string? ipAddress,
        CancellationToken cancellationToken = default);
}
