using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Data;

public static class DbSeeder
{
    public static Task SeedAsync(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        ILogger logger)
        => DbInitializer.SeedAsync(context, userManager, roleManager, logger);

    public static Task SeedDevelopmentAdminAsync(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        Microsoft.Extensions.Configuration.IConfiguration configuration,
        Microsoft.AspNetCore.Hosting.IWebHostEnvironment environment,
        ILogger logger)
        => DbInitializer.SeedDevelopmentAdminAsync(context, userManager, roleManager, configuration, environment, logger);
}
