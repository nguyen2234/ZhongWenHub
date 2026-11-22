using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Business.Authentication.DTOs;

public class UpdateProfileRequestDto
{
    [Required(ErrorMessage = "Họ và tên không được để trống.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Họ và tên phải từ 2 đến 100 ký tự.")]
    public string DisplayName { get; set; } = string.Empty;

    public string? AvatarUrl { get; set; }
}
