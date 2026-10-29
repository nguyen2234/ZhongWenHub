using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ZhongWenHub.Business.Authentication.DTOs;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.Authentication;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _dbContext;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly JwtSettings _jwtSettings;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext dbContext,
        IJwtTokenService jwtTokenService,
        IOptions<JwtSettings> jwtOptions,
        ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
        _jwtSettings = jwtOptions.Value;
        _logger = logger;
    }

    public async Task<AuthResultDto> LoginAsync(LoginRequestDto request, string? ipAddress, string? userAgent, CancellationToken cancellationToken = default)
    {
        var identifier = request.UsernameOrEmail.Trim();

        var user = await _userManager.FindByEmailAsync(identifier)
                   ?? await _userManager.FindByNameAsync(identifier);

        if (user == null || user.IsDeleted)
        {
            await RecordAuditAsync(null, identifier, "LOGIN_FAILED", ipAddress, userAgent, false, "Tài khoản không tồn tại.", cancellationToken);
            return AuthResultDto.Failed(401, "Xác thực thất bại", "Tài khoản hoặc mật khẩu không chính xác.");
        }

        if (await _userManager.IsLockedOutAsync(user))
        {
            var lockoutEnd = await _userManager.GetLockoutEndDateAsync(user);
            await RecordAuditAsync(user.Id, user.UserName, "LOGIN_LOCKED", ipAddress, userAgent, false, $"Tài khoản bị tạm khóa đến {lockoutEnd}.", cancellationToken);
            return AuthResultDto.Failed(403, "Tài khoản bị khóa", "Tài khoản của bạn đã bị khóa tạm thời do nhập sai quá nhiều lần. Vui lòng thử lại sau.");
        }

        if (user.Status != UserStatus.ACTIVE)
        {
            var statusTitle = (user.Status == UserStatus.LOCKED || user.Status == UserStatus.SUSPENDED)
                ? "Tài khoản bị khóa"
                : "Tài khoản không khả dụng";
            var reason = !string.IsNullOrWhiteSpace(user.LockReason)
                ? $" Lý do: {user.LockReason}"
                : string.Empty;
            var statusDetail = (user.Status == UserStatus.LOCKED || user.Status == UserStatus.SUSPENDED)
                ? $"Tài khoản của bạn đã bị khóa.{reason} Vui lòng liên hệ quản trị viên để được hỗ trợ."
                : $"Tài khoản đang ở trạng thái {user.Status}, không thể đăng nhập.";

            await RecordAuditAsync(user.Id, user.UserName, "LOGIN_INACTIVE", ipAddress, userAgent, false, $"Trạng thái tài khoản: {user.Status}.{reason}", cancellationToken);
            return AuthResultDto.Failed(403, statusTitle, statusDetail);
        }

        var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
        {
            await _userManager.AccessFailedAsync(user);
            await RecordAuditAsync(user.Id, user.UserName, "LOGIN_FAILED", ipAddress, userAgent, false, "Sai mật khẩu.", cancellationToken);
            return AuthResultDto.Failed(401, "Xác thực thất bại", "Tài khoản hoặc mật khẩu không chính xác.");
        }

        try
        {
            await _userManager.ResetAccessFailedCountAsync(user);
            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);
        }
        catch (DbUpdateConcurrencyException)
        {
            // Concurrent login from multiple clients for the same user account; non-critical metadata update
        }

        var roles = await _userManager.GetRolesAsync(user);
        var userDto = MapToUserDto(user, roles);

        var accessToken = _jwtTokenService.GenerateAccessToken(userDto, roles);
        var (rawRefreshToken, tokenHash, expiresAt) = _jwtTokenService.GenerateRefreshToken(request.RememberMe);

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = expiresAt,
            CreatedByIp = ipAddress
        };

        _dbContext.RefreshTokens.Add(refreshToken);
        await RecordAuditAsync(user.Id, user.UserName, "LOGIN_SUCCESS", ipAddress, userAgent, true, "Đăng nhập thành công.", cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var loginResponse = new LoginResponseDto
        {
            AccessToken = accessToken,
            ExpiresIn = _jwtSettings.AccessTokenExpirationMinutes * 60,
            TokenType = "Bearer",
            User = userDto,
            RefreshTokenExpiry = expiresAt
        };

        return AuthResultDto.Succeeded(loginResponse, rawRefreshToken, expiresAt);
    }

    public async Task<AuthResultDto> RefreshTokenAsync(string rawRefreshToken, string? ipAddress, string? userAgent, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken))
        {
            return AuthResultDto.Failed(400, "Yêu cầu không hợp lệ", "Refresh token không được để trống.");
        }

        var tokenHash = _jwtTokenService.HashToken(rawRefreshToken);
        var existingToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, cancellationToken);

        if (existingToken == null)
        {
            await RecordAuditAsync(null, null, "REFRESH_FAILED_NOT_FOUND", ipAddress, userAgent, false, "Token không tồn tại.", cancellationToken);
            return AuthResultDto.Failed(401, "Token không hợp lệ", "Phiên đăng nhập không tồn tại hoặc đã bị hủy.");
        }

        // Reuse detection: If token was already revoked, someone is reusing it!
        if (existingToken.IsRevoked)
        {
            _logger.LogWarning("Phát hiện Token Reuse Attack cho UserId {UserId} từ IP {IpAddress}", existingToken.UserId, ipAddress);

            // Revoke ALL active tokens of this user for security
            var activeTokens = await _dbContext.RefreshTokens
                .Where(rt => rt.UserId == existingToken.UserId && rt.RevokedAt == null && rt.ExpiresAt > DateTime.UtcNow)
                .ToListAsync(cancellationToken);

            foreach (var token in activeTokens)
            {
                token.Revoke(ipAddress, "Thu hồi khẩn cấp do phát hiện Reuse Attack");
            }

            await RecordAuditAsync(existingToken.UserId, null, "REFRESH_REUSE_DETECTED", ipAddress, userAgent, false,
                $"Phát hiện token reuse. Đã thu hồi toàn bộ {activeTokens.Count} phiên đang hoạt động.", cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return AuthResultDto.Failed(401, "Cảnh báo bảo mật", "Phát hiện dấu hiệu tấn công sử dụng lại token. Toàn bộ phiên làm việc của bạn đã bị đăng xuất vì lý do bảo mật.");
        }

        if (existingToken.IsExpired)
        {
            await RecordAuditAsync(existingToken.UserId, null, "REFRESH_EXPIRED", ipAddress, userAgent, false, "Token đã hết hạn.", cancellationToken);
            return AuthResultDto.Failed(401, "Token hết hạn", "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
        }

        var user = await _userManager.FindByIdAsync(existingToken.UserId.ToString());
        if (user == null || user.IsDeleted || user.Status != UserStatus.ACTIVE)
        {
            existingToken.Revoke(ipAddress, "Người dùng không còn khả dụng");
            await _dbContext.SaveChangesAsync(cancellationToken);
            return AuthResultDto.Failed(403, "Tài khoản không khả dụng", "Tài khoản người dùng đã bị khóa hoặc không tồn tại.");
        }

        // Token rotation
        var (newRawToken, newTokenHash, newExpiresAt) = _jwtTokenService.GenerateRefreshToken();
        existingToken.Revoke(ipAddress, "Đã xoay vòng token (Rotated)", newTokenHash);

        var newRefreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = newTokenHash,
            ExpiresAt = newExpiresAt,
            CreatedByIp = ipAddress
        };

        _dbContext.RefreshTokens.Add(newRefreshToken);

        var roles = await _userManager.GetRolesAsync(user);
        var userDto = MapToUserDto(user, roles);
        var accessToken = _jwtTokenService.GenerateAccessToken(userDto, roles);

        await RecordAuditAsync(user.Id, user.UserName, "REFRESH_SUCCESS", ipAddress, userAgent, true, "Gia hạn token thành công.", cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var loginResponse = new LoginResponseDto
        {
            AccessToken = accessToken,
            ExpiresIn = _jwtSettings.AccessTokenExpirationMinutes * 60,
            TokenType = "Bearer",
            User = userDto,
            RefreshTokenExpiry = newExpiresAt
        };

        return AuthResultDto.Succeeded(loginResponse, newRawToken, newExpiresAt);
    }

    public async Task<bool> RevokeRefreshTokenAsync(string rawRefreshToken, string? ipAddress, string reason = "User logged out", CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken))
        {
            return false;
        }

        var tokenHash = _jwtTokenService.HashToken(rawRefreshToken);
        var token = await _dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, cancellationToken);

        if (token == null || !token.IsActive)
        {
            return false;
        }

        token.Revoke(ipAddress, reason);
        await RecordAuditAsync(token.UserId, null, "LOGOUT", ipAddress, null, true, reason, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<UserDto?> GetCurrentUserProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null || user.IsDeleted)
        {
            return null;
        }

        var roles = await _userManager.GetRolesAsync(user);
        return MapToUserDto(user, roles);
    }

    private static UserDto MapToUserDto(ApplicationUser user, IEnumerable<string> roles)
    {
        return new UserDto
        {
            Id = user.Id.ToString(),
            Username = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            DisplayName = user.DisplayName,
            AvatarUrl = user.AvatarUrl,
            Roles = roles.ToList(),
            Status = user.Status.ToString(),
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            LastLoginAt = user.LastLoginAt
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
