using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Application.DTOs.Auth;

public class LoginRequestDto
{
    [Required(ErrorMessage = "Tên đăng nhập hoặc email không được để trống.")]
    public string UsernameOrEmail { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu không được để trống.")]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; } = false;
}
