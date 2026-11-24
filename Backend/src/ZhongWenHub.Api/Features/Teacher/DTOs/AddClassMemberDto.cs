using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Features.Teacher.DTOs;

public class AddClassMemberDto
{
    [Required(ErrorMessage = "Email hoặc tên người dùng học viên là bắt buộc.")]
    [MaxLength(256)]
    public string StudentIdentifier { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Notes { get; set; }
}
