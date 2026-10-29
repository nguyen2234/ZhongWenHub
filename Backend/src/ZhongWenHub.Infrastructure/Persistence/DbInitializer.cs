using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Domain.Constants;
using ZhongWenHub.Domain.Enums;
using ZhongWenHub.Infrastructure.Identity;

namespace ZhongWenHub.Infrastructure.Persistence;

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
}
