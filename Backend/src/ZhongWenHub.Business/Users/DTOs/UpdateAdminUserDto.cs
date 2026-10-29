using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Business.Users.DTOs;

public class UpdateAdminUserDto
{
    [Required(ErrorMessage = "Họ và tên không được để trống.")]
    [StringLength(100, ErrorMessage = "Họ và tên tối đa 100 ký tự.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email không được để trống.")]
    [EmailAddress(ErrorMessage = "Địa chỉ email không đúng định dạng.")]
    public string Email { get; set; } = string.Empty;

    public string? HskLevel { get; set; }

    public string? Status { get; set; }

    public string? Notes { get; set; }

    public string? Phone { get; set; }
}
