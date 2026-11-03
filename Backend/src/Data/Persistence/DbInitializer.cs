using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Entities;

namespace ZhongWenHub.Data.Persistence;

public static class DbInitializer
{
    private static readonly SemaphoreSlim Semaphore = new(1, 1);

    public static async Task SeedAsync(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        ILogger logger)
    {
        await Semaphore.WaitAsync();
        try
        {
            if (context.Database.IsRelational())
            {
                await context.Database.MigrateAsync();
            }

            // Seed Roles
            var rolesWithDescriptions = new Dictionary<string, string>
            {
                { RoleConstants.SuperAdmin, "Quản trị viên tối cao, toàn quyền hệ thống" },
                { RoleConstants.Admin, "Quản trị viên vận hành hệ thống" },
                { RoleConstants.ContentManager, "Quản lý nội dung học liệu HSK, từ vựng, ngữ pháp, video" },
                { RoleConstants.Teacher, "Giáo viên giảng dạy, tạo bài tập, đánh giá" },
                { RoleConstants.Support, "Nhân viên hỗ trợ học viên và xử lý ticket" },
                { RoleConstants.Student, "Học viên học tiếng Trung" }
            };

            foreach (var (roleName, description) in rolesWithDescriptions)
            {
                var roleExists = await roleManager.RoleExistsAsync(roleName);
                if (!roleExists)
                {
                    try
                    {
                        await roleManager.CreateAsync(new ApplicationRole(roleName, description));
                        logger.LogInformation("Seeded role {RoleName}", roleName);
                    }
                    catch (Exception ex)
                    {
                        logger.LogDebug(ex, "Role {RoleName} already exists or was seeded concurrently.", roleName);
                    }
                }
            }

            // Seed Users
            var seedUsers = new[]
            {
                (
                    Email: "superadmin@zhongwenhub.edu.vn",
                    Username: "superadmin",
                    DisplayName: "Hệ Thống Super Admin",
                    Role: RoleConstants.SuperAdmin,
                    Password: "SuperAdmin123!"
                ),
                (
                    Email: "admin@zhongwenhub.edu.vn",
                    Username: "admin",
                    DisplayName: "Quản Trị Viên Vận Hành",
                    Role: RoleConstants.Admin,
                    Password: "AdminPassword123!"
                ),
                (
                    Email: "contentmanager@zhongwenhub.edu.vn",
                    Username: "contentmanager",
                    DisplayName: "Nguyễn Văn Minh (Content Manager)",
                    Role: RoleConstants.ContentManager,
                    Password: "ContentManager123!"
                ),
                (
                    Email: "teacher@zhongwenhub.edu.vn",
                    Username: "teacher",
                    DisplayName: "Lý Mỹ Linh (Teacher)",
                    Role: RoleConstants.Teacher,
                    Password: "TeacherPassword123!"
                ),
                (
                    Email: "support@zhongwenhub.edu.vn",
                    Username: "support",
                    DisplayName: "Trần Thuỳ Trang (Support)",
                    Role: RoleConstants.Support,
                    Password: "SupportPassword123!"
                ),
                (
                    Email: "student@zhongwenhub.edu.vn",
                    Username: "student",
                    DisplayName: "Trần Minh Quân (Student)",
                    Role: RoleConstants.Student,
                    Password: "StudentPassword123!"
                ),
                (
                    Email: "student@example.com",
                    Username: "student_example",
                    DisplayName: "Học Viên Mẫu (Student Example)",
                    Role: RoleConstants.Student,
                    Password: "ExamplePassword123!"
                )
            };

            foreach (var userDef in seedUsers)
            {
                var existingUser = await userManager.FindByEmailAsync(userDef.Email);
                if (existingUser == null)
                {
                    try
                    {
                        var user = new ApplicationUser
                        {
                            Id = Guid.NewGuid(),
                            UserName = userDef.Username,
                            Email = userDef.Email,
                            EmailConfirmed = true,
                            DisplayName = userDef.DisplayName,
                            Status = UserStatus.ACTIVE,
                            CreatedAt = DateTime.UtcNow
                        };

                        var result = await userManager.CreateAsync(user, userDef.Password);
                        if (result.Succeeded)
                        {
                            await userManager.AddToRoleAsync(user, userDef.Role);
                            logger.LogInformation("Seeded user {Email} with role {Role}", userDef.Email, userDef.Role);
                        }
                    }
                    catch (Exception ex)
                    {
                        logger.LogDebug(ex, "User {Email} already exists or was seeded concurrently.", userDef.Email);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error while initializing and seeding database.");
        }
        finally
        {
            Semaphore.Release();
        }
    }

    public static async Task SeedDevelopmentAdminAsync(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        Microsoft.Extensions.Configuration.IConfiguration configuration,
        Microsoft.AspNetCore.Hosting.IWebHostEnvironment environment,
        ILogger logger)
    {
        if (!environment.EnvironmentName.Equals("Development", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        await Semaphore.WaitAsync();
        try
        {
            var adminEmail = Environment.GetEnvironmentVariable("DEV_ADMIN_EMAIL")
                ?? configuration["DevAdmin:Email"]
                ?? "admin@gmail.com";

            var adminPassword = Environment.GetEnvironmentVariable("DEV_ADMIN_PASSWORD")
                ?? configuration["DevAdmin:Password"]
                ?? "admin";

            // Ensure Admin role exists
            if (!await roleManager.RoleExistsAsync(RoleConstants.Admin))
            {
                await roleManager.CreateAsync(new ApplicationRole(RoleConstants.Admin, "Quản trị viên vận hành hệ thống"));
            }

            var existingUser = await userManager.FindByEmailAsync(adminEmail);
            if (existingUser != null)
            {
                logger.LogInformation("Development admin user '{Email}' already exists in SQL Server. Skipping seed.", adminEmail);
                return;
            }

            var adminUser = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
                DisplayName = "Quản Trị Viên (Dev Admin)",
                Status = UserStatus.ACTIVE,
                CreatedAt = DateTime.UtcNow
            };

            // Hash password using Identity PasswordHasher without degrading production password policies
            adminUser.PasswordHash = userManager.PasswordHasher.HashPassword(adminUser, adminPassword);

            var createResult = await userManager.CreateAsync(adminUser);
            if (!createResult.Succeeded)
            {
                var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                logger.LogWarning("Failed to seed development admin user '{Email}': {Errors}", adminEmail, errors);
                return;
            }

            var roleResult = await userManager.AddToRoleAsync(adminUser, RoleConstants.Admin);
            if (roleResult.Succeeded)
            {
                logger.LogInformation("Development admin user '{Email}' successfully seeded into SQL Server with role '{Role}'.", adminEmail, RoleConstants.Admin);
            }
            else
            {
                logger.LogWarning("Failed to assign role '{Role}' to development admin user '{Email}'.", RoleConstants.Admin, adminEmail);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error while seeding development admin user into SQL Server.");
        }
        finally
        {
            Semaphore.Release();
        }
    }
}
