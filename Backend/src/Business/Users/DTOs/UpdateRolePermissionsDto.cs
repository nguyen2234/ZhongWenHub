using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Business.Users.DTOs;

public class UpdateRolePermissionsDto
{
    [Required(ErrorMessage = "Danh sách quyền không được để trống.")]
    public List<string> Permissions { get; set; } = new();
}
