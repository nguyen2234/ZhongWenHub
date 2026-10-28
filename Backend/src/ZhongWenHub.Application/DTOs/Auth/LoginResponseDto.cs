namespace ZhongWenHub.Application.DTOs.Auth;

public class LoginResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public int ExpiresIn { get; set; }
    public string TokenType { get; set; } = "Bearer";
    public UserDto User { get; set; } = new();
    public DateTime? RefreshTokenExpiry { get; set; }
}
