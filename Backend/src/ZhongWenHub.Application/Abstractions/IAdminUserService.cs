using ZhongWenHub.Application.DTOs.Common;
using ZhongWenHub.Application.DTOs.Users;

namespace ZhongWenHub.Application.Abstractions;

public interface IAdminUserService
{
    Task<PagedResponse<AdminUserListItemDto>> GetUsersAsync(AdminUserFilterDto filter, CancellationToken cancellationToken = default);

    Task<AdminUserKpisDto> GetKpisAsync(CancellationToken cancellationToken = default);

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
}
