using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Application.DTOs.Users;

public class CreateAdminUserDto
{
    [Required(ErrorMessage = "Họ và tên không được để trống.")]
    [StringLength(100, ErrorMessage = "Họ và tên tối đa 100 ký tự.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email không được để trống.")]
    [EmailAddress(ErrorMessage = "Địa chỉ email không đúng định dạng.")]
    public string Email { get; set; } = string.Empty;

    public string? InitialHsk { get; set; } = "HSK 1";

    public string? Status { get; set; } = "ACTIVE";

    public string? Notes { get; set; }

    public string? Phone { get; set; }

    public string? Password { get; set; }

    public List<string>? Roles { get; set; }
}
