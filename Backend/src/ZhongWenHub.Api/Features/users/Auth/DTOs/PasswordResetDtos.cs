using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Business.Authentication.DTOs;

public class ForgotPasswordRequestDto
{
    [Required(ErrorMessage = "Email không được để trống.")]
    [EmailAddress(ErrorMessage = "Định dạng email không hợp lệ.")]
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequestDto
{
    [Required(ErrorMessage = "Email không được để trống.")]
    [EmailAddress(ErrorMessage = "Định dạng email không hợp lệ.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mã xác thực token không được để trống.")]
    public string Token { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu mới không được để trống.")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu phải có từ 6 đến 100 ký tự.")]
    public string NewPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu xác nhận không được để trống.")]
    [Compare("NewPassword", ErrorMessage = "Mật khẩu xác nhận không khớp.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}
