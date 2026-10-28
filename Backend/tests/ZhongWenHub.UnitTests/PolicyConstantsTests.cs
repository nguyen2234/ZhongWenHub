using ZhongWenHub.Domain.Constants;

namespace ZhongWenHub.UnitTests;

public class PolicyConstantsTests
{
    [Fact]
    public void AllRoles_ContainsExpectedSixRoles()
    {
        Assert.Equal(6, RoleConstants.AllRoles.Count);
        Assert.Contains(RoleConstants.SuperAdmin, RoleConstants.AllRoles);
        Assert.Contains(RoleConstants.Admin, RoleConstants.AllRoles);
        Assert.Contains(RoleConstants.ContentManager, RoleConstants.AllRoles);
        Assert.Contains(RoleConstants.Teacher, RoleConstants.AllRoles);
        Assert.Contains(RoleConstants.Support, RoleConstants.AllRoles);
        Assert.Contains(RoleConstants.Student, RoleConstants.AllRoles);
    }

    [Fact]
    public void PolicyConstants_DefinesRequiredSevenPolicies()
    {
        Assert.Equal("AdminAccess", PolicyConstants.AdminAccess);
        Assert.Equal("ContentManagementAccess", PolicyConstants.ContentManagementAccess);
        Assert.Equal("TeacherAccess", PolicyConstants.TeacherAccess);
        Assert.Equal("SupportAccess", PolicyConstants.SupportAccess);
        Assert.Equal("StudentAccess", PolicyConstants.StudentAccess);
        Assert.Equal("SystemSettingsManage", PolicyConstants.SystemSettingsManage);
        Assert.Equal("UserManagementAccess", PolicyConstants.UserManagementAccess);
    }
}
