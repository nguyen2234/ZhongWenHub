using Microsoft.AspNetCore.Identity;

namespace ZhongWenHub.Models.Users;

public class ApplicationRole : IdentityRole<Guid>
{
    public string? Description { get; set; }

    public ApplicationRole() : base()
    {
    }

    public ApplicationRole(string roleName, string? description = null) : base(roleName)
    {
        Description = description;
    }
}
