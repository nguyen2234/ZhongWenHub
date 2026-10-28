namespace ZhongWenHub.Application.DTOs.Auth;

public class RefreshTokenRequestDto
{
    public string? RefreshToken { get; set; }
}

public class AuthResultDto
{
    public bool Success { get; set; }
    public LoginResponseDto? LoginResponse { get; set; }
    public string? RawRefreshToken { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }
    public string? ErrorTitle { get; set; }
    public string? ErrorDetail { get; set; }
    public int StatusCode { get; set; } = 200;
    public Dictionary<string, string[]>? ValidationErrors { get; set; }

    public static AuthResultDto Succeeded(LoginResponseDto loginResponse, string rawRefreshToken, DateTime refreshTokenExpiresAt)
    {
        return new AuthResultDto
        {
            Success = true,
            LoginResponse = loginResponse,
            RawRefreshToken = rawRefreshToken,
            RefreshTokenExpiresAt = refreshTokenExpiresAt,
            StatusCode = 200
        };
    }

    public static AuthResultDto Failed(int statusCode, string title, string detail, Dictionary<string, string[]>? validationErrors = null)
    {
        return new AuthResultDto
        {
            Success = false,
            StatusCode = statusCode,
            ErrorTitle = title,
            ErrorDetail = detail,
            ValidationErrors = validationErrors
        };
    }
}
