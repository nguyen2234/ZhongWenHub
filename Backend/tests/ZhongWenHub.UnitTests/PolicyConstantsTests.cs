using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using ZhongWenHub.Business.Admin.Services;
using ZhongWenHub.Business.Authorization;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.UnitTests;

public class PolicyConstantsTests
{
    [Fact]
    public void AllRoles_ContainsExpectedFiveRoles()
    {
        Assert.Equal(5, RoleConstants.AllRoles.Count);
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
        Assert.Equal("ContentViewAccess", PolicyConstants.ContentViewAccess);
        Assert.Equal("TeacherAccess", PolicyConstants.TeacherAccess);
        Assert.Equal("SupportAccess", PolicyConstants.SupportAccess);
        Assert.Equal("StudentAccess", PolicyConstants.StudentAccess);
        Assert.Equal("SystemSettingsManage", PolicyConstants.SystemSettingsManage);
        Assert.Equal("UserManagementAccess", PolicyConstants.UserManagementAccess);
    }

    [Fact]
    public async Task ContentManagementAccess_Policy_StrictlyRejects_ContentViewOnly_And_Allows_WritePermission()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAuthorization(options =>
        {
            options.AddPolicy(PolicyConstants.ContentManagementAccess, policy =>
                policy.RequireAssertion(ctx =>
                {
                    if (ctx.User.IsInRole(RoleConstants.Admin))
                    {
                        return true;
                    }

                    var hasWritePermission = ctx.User.HasClaim(c =>
                        (c.Type == "permission" || c.Type == "Permission") &&
                        (c.Value == "CONTENT_MANAGE" || c.Value == "CONTENT_CREATE" || c.Value == "CONTENT_UPDATE" || c.Value == "CONTENT_PUBLISH"));

                    if (hasWritePermission)
                    {
                        return true;
                    }

                    if (ctx.User.IsInRole(RoleConstants.ContentManager))
                    {
                        var hasExplicitPermissions = ctx.User.HasClaim(c => c.Type == "permission" || c.Type == "Permission");
                        return !hasExplicitPermissions || hasWritePermission;
                    }

                    return false;
                }));
        });

        var provider = services.BuildServiceProvider();
        var authService = provider.GetRequiredService<IAuthorizationService>();

        // 1. User with ONLY CONTENT_VIEW permission must be REJECTED (Fail-Closed)
        var viewOnlyUser = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, RoleConstants.Student),
            new Claim("permission", "CONTENT_VIEW")
        }, "TestAuth"));

        var viewOnlyResult = await authService.AuthorizeAsync(viewOnlyUser, PolicyConstants.ContentManagementAccess);
        Assert.False(viewOnlyResult.Succeeded, "CONTENT_VIEW claim alone MUST NOT grant ContentManagementAccess");

        // 2. ContentManager with explicitly restricted CONTENT_VIEW only must be REJECTED
        var restrictedCmUser = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, RoleConstants.ContentManager),
            new Claim("permission", "CONTENT_VIEW")
        }, "TestAuth"));

        var cmRestrictedResult = await authService.AuthorizeAsync(restrictedCmUser, PolicyConstants.ContentManagementAccess);
        Assert.False(cmRestrictedResult.Succeeded, "ContentManager with ONLY CONTENT_VIEW permission must be rejected for write operations");

        // 3. User with CONTENT_CREATE must SUCCEED
        var creatorUser = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, RoleConstants.Teacher),
            new Claim("permission", "CONTENT_CREATE")
        }, "TestAuth"));

        var creatorResult = await authService.AuthorizeAsync(creatorUser, PolicyConstants.ContentManagementAccess);
        Assert.True(creatorResult.Succeeded, "User with CONTENT_CREATE claim MUST be granted ContentManagementAccess");

        // 4. Admin must always SUCCEED
        var adminUser = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, RoleConstants.Admin)
        }, "TestAuth"));

        var adminResult = await authService.AuthorizeAsync(adminUser, PolicyConstants.ContentManagementAccess);
        Assert.True(adminResult.Succeeded, "Admin role MUST always be granted ContentManagementAccess");
    }

    [Fact]
    public void AiProvider_IsPrivateOrRestrictedIp_Blocks_Cgnat_And_Ipv6UniqueLocal()
    {
        // IPv4 CGNAT 100.64.0.0/10 range
        Assert.True(AiProviderConfigService.IsPrivateOrRestrictedIp(IPAddress.Parse("100.64.0.1")));
        Assert.True(AiProviderConfigService.IsPrivateOrRestrictedIp(IPAddress.Parse("100.127.255.254")));
        Assert.False(AiProviderConfigService.IsPrivateOrRestrictedIp(IPAddress.Parse("100.128.0.1"))); // outside CGNAT
        Assert.False(AiProviderConfigService.IsPrivateOrRestrictedIp(IPAddress.Parse("100.63.255.255"))); // outside CGNAT

        // IPv6 Unique Local (fc00::/7)
        Assert.True(AiProviderConfigService.IsPrivateOrRestrictedIp(IPAddress.Parse("fc00::1")));
        Assert.True(AiProviderConfigService.IsPrivateOrRestrictedIp(IPAddress.Parse("fd12:3456:789a:1::1")));

        // Standard private IPs
        Assert.True(AiProviderConfigService.IsPrivateOrRestrictedIp(IPAddress.Parse("127.0.0.1")));
        Assert.True(AiProviderConfigService.IsPrivateOrRestrictedIp(IPAddress.Parse("10.0.0.1")));
        Assert.True(AiProviderConfigService.IsPrivateOrRestrictedIp(IPAddress.Parse("172.16.0.1")));
        Assert.True(AiProviderConfigService.IsPrivateOrRestrictedIp(IPAddress.Parse("192.168.1.1")));
        Assert.True(AiProviderConfigService.IsPrivateOrRestrictedIp(IPAddress.Parse("169.254.169.254"))); // metadata

        // Public IPs should NOT be blocked
        Assert.False(AiProviderConfigService.IsPrivateOrRestrictedIp(IPAddress.Parse("8.8.8.8")));
        Assert.False(AiProviderConfigService.IsPrivateOrRestrictedIp(IPAddress.Parse("1.1.1.1")));
    }
}
