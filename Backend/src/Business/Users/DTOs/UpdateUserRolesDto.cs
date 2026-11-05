using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Business.Users.DTOs;

public class UpdateUserRolesDto
{
    [Required(ErrorMessage = "Danh sách vai trò không được để trống.")]
    public List<string> Roles { get; set; } = new();
}
