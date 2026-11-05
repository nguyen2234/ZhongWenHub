using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Entities.Content;

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
                { RoleConstants.Admin, "Quản trị viên toàn quyền hệ thống" },
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
                    Email: "demo@zhongwenhub.edu.vn",
                    Username: "demostudent",
                    DisplayName: "Học Viên Trải Nghiệm",
                    Role: RoleConstants.Student,
                    Password: "DemoPassword123!"
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

            // Seed Content (Courses, Lessons, Vocabulary, Grammar, Exercises)
            await SeedContentAsync(context, logger);
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

    private static async Task SeedContentAsync(ApplicationDbContext context, ILogger logger)
    {
        var hsk1CourseId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var hsk2CourseId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var hsk3CourseId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var hsk4CourseId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        var hsk5CourseId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        var hsk6CourseId = Guid.Parse("66666666-6666-6666-6666-666666666666");

        var unit1Id = Guid.Parse("bbbbbbbb-1111-1111-1111-111111111111");
        var unit2Id = Guid.Parse("bbbbbbbb-2222-2222-2222-222222222222");

        if (await context.Courses.AnyAsync())
        {
            if (!await context.Units.AnyAsync())
            {
                var initialUnits = new List<UnitEntity>
                {
                    new()
                    {
                        Id = unit1Id,
                        CourseId = hsk1CourseId,
                        UnitNumber = 1,
                        TitleZh = "问候与认识",
                        TitleVi = "Chào hỏi & Làm quen",
                        Description = "Các mẫu câu chào hỏi căn bản, giới thiệu bản thân và xưng hô lịch sự.",
                        OrderIndex = 1,
                        Status = "PUBLISHED"
                    },
                    new()
                    {
                        Id = unit2Id,
                        CourseId = hsk1CourseId,
                        UnitNumber = 2,
                        TitleZh = "家庭与朋友",
                        TitleVi = "Gia đình & Bạn bè",
                        Description = "Giới thiệu thành viên trong gia đình, tuổi tác và nghề nghiệp.",
                        OrderIndex = 2,
                        Status = "PUBLISHED"
                    }
                };
                await context.Units.AddRangeAsync(initialUnits);
                await context.SaveChangesAsync();

                var l1 = await context.Lessons.FindAsync(Guid.Parse("aaaaaaaa-1111-1111-1111-111111111111"));
                if (l1 != null) l1.UnitId = unit1Id;
                var l2 = await context.Lessons.FindAsync(Guid.Parse("aaaaaaaa-2222-2222-2222-222222222222"));
                if (l2 != null) l2.UnitId = unit1Id;
                var l3 = await context.Lessons.FindAsync(Guid.Parse("aaaaaaaa-3333-3333-3333-333333333333"));
                if (l3 != null) l3.UnitId = unit2Id;
                var l4 = await context.Lessons.FindAsync(Guid.Parse("aaaaaaaa-4444-4444-4444-444444444444"));
                if (l4 != null) l4.UnitId = unit2Id;
                await context.SaveChangesAsync();
                logger.LogInformation("Linked existing lessons to newly seeded Units in SQL Server.");
            }
            return;
        }

        var courses = new List<CourseEntity>
        {
            new() { Id = hsk1CourseId, Code = "HSK1", Title = "Giáo trình Chuẩn HSK 1", Description = "Khóa học HSK 1 nền tảng dành cho người mới bắt đầu học tiếng Trung.", HskLevel = 1, OrderIndex = 1, Status = "PUBLISHED" },
            new() { Id = hsk2CourseId, Code = "HSK2", Title = "Giáo trình Chuẩn HSK 2", Description = "Khóa học HSK 2 sơ cấp củng cố ngữ pháp và mở rộng 300 từ vựng.", HskLevel = 2, OrderIndex = 2, Status = "PUBLISHED" },
            new() { Id = hsk3CourseId, Code = "HSK3", Title = "Giáo trình Chuẩn HSK 3", Description = "Khóa học HSK 3 trung cấp giao tiếp thực tế và 600 từ vựng cốt lõi.", HskLevel = 3, OrderIndex = 3, Status = "PUBLISHED" },
            new() { Id = hsk4CourseId, Code = "HSK4", Title = "Giáo trình Chuẩn HSK 4", Description = "Khóa học HSK 4 bán cao cấp thảo luận các chủ đề xã hội và công việc.", HskLevel = 4, OrderIndex = 4, Status = "PUBLISHED" },
            new() { Id = hsk5CourseId, Code = "HSK5", Title = "Giáo trình Chuẩn HSK 5", Description = "Khóa học HSK 5 cao cấp đọc hiểu báo chí và xem phim Trung Quốc.", HskLevel = 5, OrderIndex = 5, Status = "PUBLISHED" },
            new() { Id = hsk6CourseId, Code = "HSK6", Title = "Giáo trình Chuẩn HSK 6", Description = "Khóa học HSK 6 tinh thông tiếng Trung học thuật và dịch thuật chuyên sâu.", HskLevel = 6, OrderIndex = 6, Status = "PUBLISHED" },
        };

        await context.Courses.AddRangeAsync(courses);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded 6 standard HSK courses into SQL Server.");

        var les1Id = Guid.Parse("aaaaaaaa-1111-1111-1111-111111111111");
        var les2Id = Guid.Parse("aaaaaaaa-2222-2222-2222-222222222222");
        var les3Id = Guid.Parse("aaaaaaaa-3333-3333-3333-333333333333");
        var lesDraftId = Guid.Parse("aaaaaaaa-4444-4444-4444-444444444444");

        if (!await context.Units.AnyAsync())
        {
            var units = new List<UnitEntity>
            {
                new()
                {
                    Id = unit1Id,
                    CourseId = hsk1CourseId,
                    UnitNumber = 1,
                    TitleZh = "问候与认识",
                    TitleVi = "Chào hỏi & Làm quen",
                    Description = "Các mẫu câu chào hỏi căn bản, giới thiệu bản thân và xưng hô lịch sự.",
                    OrderIndex = 1,
                    Status = "PUBLISHED"
                },
                new()
                {
                    Id = unit2Id,
                    CourseId = hsk1CourseId,
                    UnitNumber = 2,
                    TitleZh = "家庭与朋友",
                    TitleVi = "Gia đình & Bạn bè",
                    Description = "Giới thiệu thành viên trong gia đình, tuổi tác và nghề nghiệp.",
                    OrderIndex = 2,
                    Status = "PUBLISHED"
                }
            };
            await context.Units.AddRangeAsync(units);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded initial units for HSK 1 into SQL Server.");
        }

        var lessons = new List<LessonEntity>
        {
            new() { Id = les1Id, CourseId = hsk1CourseId, UnitId = unit1Id, LessonNumber = 1, TitleZh = "你好", TitleVi = "Chào bạn", Pinyin = "Nǐ hǎo", Summary = "Học cách chào hỏi cơ bản trong tiếng Trung và giới thiệu bản thân.", DurationMinutes = 20, XpReward = 50, OrderIndex = 1, Status = "PUBLISHED" },
            new() { Id = les2Id, CourseId = hsk1CourseId, UnitId = unit1Id, LessonNumber = 2, TitleZh = "谢谢你", TitleVi = "Cảm ơn bạn", Pinyin = "Xièxie nǐ", Summary = "Học cách nói lời cảm ơn, xin lỗi và đáp lại một cách lịch sự.", DurationMinutes = 25, XpReward = 50, OrderIndex = 2, Status = "PUBLISHED" },
            new() { Id = les3Id, CourseId = hsk1CourseId, UnitId = unit2Id, LessonNumber = 3, TitleZh = "你叫什么名字", TitleVi = "Bạn tên là gì", Pinyin = "Nǐ jiào shénme míngzi", Summary = "Học cách hỏi và trả lời về họ tên, quốc tịch trong giao tiếp.", DurationMinutes = 30, XpReward = 60, OrderIndex = 3, Status = "PUBLISHED" },
            new() { Id = lesDraftId, CourseId = hsk1CourseId, UnitId = unit2Id, LessonNumber = 4, TitleZh = "他是我的汉语老师", TitleVi = "Thầy ấy là giáo viên tiếng Trung của tôi (Bản thảo)", Pinyin = "Tā shì wǒ de hànyǔ lǎoshī", Summary = "Bài học đang được biên soạn bởi Content Manager, học viên chưa thể thấy.", DurationMinutes = 35, XpReward = 60, OrderIndex = 4, Status = "DRAFT" },
        };

        await context.Lessons.AddRangeAsync(lessons);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded initial lessons for HSK 1 into SQL Server.");

        var vocabularies = new List<VocabularyEntity>
        {
            new() { Id = Guid.NewGuid(), HskLevel = 1, Hanzi = "你", Pinyin = "nǐ", MeaningVi = "bạn, anh, chị (ngôi thứ 2 số ít)", PartOfSpeech = "Đại từ", Status = "PUBLISHED", LessonId = les1Id, ExamplesJson = "[{\"zh\":\"你好！\",\"pinyin\":\"Nǐ hǎo!\",\"meaningVi\":\"Chào bạn!\"}]" },
            new() { Id = Guid.NewGuid(), HskLevel = 1, Hanzi = "好", Pinyin = "hǎo", MeaningVi = "tốt, đẹp, khỏe, được", PartOfSpeech = "Tính từ", Status = "PUBLISHED", LessonId = les1Id, ExamplesJson = "[{\"zh\":\"很好。\",\"pinyin\":\"Hěn hǎo.\",\"meaningVi\":\"Rất tốt.\"}]" },
            new() { Id = Guid.NewGuid(), HskLevel = 1, Hanzi = "您", Pinyin = "nín", MeaningVi = "ngài, ông (kính ngữ của 你)", PartOfSpeech = "Đại từ", Status = "PUBLISHED", LessonId = les1Id, ExamplesJson = "[{\"zh\":\"您好！\",\"pinyin\":\"Nín hǎo!\",\"meaningVi\":\"Kính chào ngài!\"}]" },
            new() { Id = Guid.NewGuid(), HskLevel = 1, Hanzi = "谢谢", Pinyin = "xièxie", MeaningVi = "cảm ơn", PartOfSpeech = "Động từ", Status = "PUBLISHED", LessonId = les2Id, ExamplesJson = "[{\"zh\":\"谢谢你！\",\"pinyin\":\"Xièxie nǐ!\",\"meaningVi\":\"Cảm ơn bạn!\"}]" },
            new() { Id = Guid.NewGuid(), HskLevel = 1, Hanzi = "不客气", Pinyin = "bú kèqi", MeaningVi = "đừng khách sáo, không có gì", PartOfSpeech = "Cụm từ", Status = "PUBLISHED", LessonId = les2Id, ExamplesJson = "[{\"zh\":\"不客气，请进。\",\"pinyin\":\"Bú kèqi, qǐng jìn.\",\"meaningVi\":\"Không có gì, mời vào.\"}]" },
            new() { Id = Guid.NewGuid(), HskLevel = 1, Hanzi = "对不起", Pinyin = "duìbuqǐ", MeaningVi = "xin lỗi", PartOfSpeech = "Cụm từ", Status = "PUBLISHED", LessonId = les2Id, ExamplesJson = "[{\"zh\":\"对不起，我迟到了。\",\"pinyin\":\"Duìbuqǐ, wǒ chídào le.\",\"meaningVi\":\"Xin lỗi, tôi đến muộn.\"}]" },
            new() { Id = Guid.NewGuid(), HskLevel = 1, Hanzi = "叫", Pinyin = "jiào", MeaningVi = "tên là, gọi là", PartOfSpeech = "Động từ", Status = "PUBLISHED", LessonId = les3Id, ExamplesJson = "[{\"zh\":\"我叫李明。\",\"pinyin\":\"Wǒ jiào Lǐ Míng.\",\"meaningVi\":\"Tôi tên là Lý Minh.\"}]" },
            new() { Id = Guid.NewGuid(), HskLevel = 1, Hanzi = "什么", Pinyin = "shénme", MeaningVi = "cái gì, gì", PartOfSpeech = "Đại từ", Status = "PUBLISHED", LessonId = les3Id, ExamplesJson = "[{\"zh\":\"这是什么？\",\"pinyin\":\"Zhè shì shénme?\",\"meaningVi\":\"Đây là cái gì?\"}]" },
            new() { Id = Guid.NewGuid(), HskLevel = 1, Hanzi = "名字", Pinyin = "míngzi", MeaningVi = "tên, họ tên", PartOfSpeech = "Danh từ", Status = "PUBLISHED", LessonId = les3Id, ExamplesJson = "[{\"zh\":\"你叫什么名字？\",\"pinyin\":\"Nǐ jiào shénme míngzi?\",\"meaningVi\":\"Bạn tên là gì?\"}]" },
        };

        await context.Vocabularies.AddRangeAsync(vocabularies);

        var grammar1Id = Guid.NewGuid();
        var grammar2Id = Guid.NewGuid();
        var grammarPoints = new List<GrammarPointEntity>
        {
            new() {
                Id = grammar1Id,
                Code = "GR-HSK1-01",
                Title = "Câu chào hỏi cơ bản",
                PinyinTitle = "Jīchǔ wènhòu jù",
                HskLevel = 1,
                Category = "cơ bản",
                StructureFormula = "Đại từ nhân xưng + 好",
                Explanation = "Trong tiếng Trung, mẫu câu chào hỏi thông dụng nhất là ghép đại từ xưng hô với tính từ 好 (hảo - tốt). Ví dụ: 你好 (Chào bạn), 老师好 (Chào thầy/cô).",
                Difficulty = "Dễ",
                ExamplesJson = "[{\"zh\":\"你好！\",\"pinyin\":\"Nǐ hǎo!\",\"meaningVi\":\"Chào bạn!\"},{\"zh\":\"老师好！\",\"pinyin\":\"Lǎoshī hǎo!\",\"meaningVi\":\"Em chào thầy giáo!\"}]",
                Status = "PUBLISHED",
                LessonId = les1Id
            },
            new() {
                Id = grammar2Id,
                Code = "GR-HSK1-02",
                Title = "Đại từ nghi vấn 什么 (Cái gì)",
                PinyinTitle = "Yíwèn dàicí \"shénme\"",
                HskLevel = 1,
                Category = "cơ bản",
                StructureFormula = "Động từ + 什么 (+ Danh từ)?",
                Explanation = "Đại từ 什么 dùng để đặt câu hỏi về đồ vật, tên gọi hoặc sự việc. Trật tự từ trong câu hỏi tiếng Trung giữ nguyên như câu trần thuật.",
                Difficulty = "Dễ",
                ExamplesJson = "[{\"zh\":\"你叫什么名字？\",\"pinyin\":\"Nǐ jiào shénme míngzi?\",\"meaningVi\":\"Bạn tên là gì?\"},{\"zh\":\"这是什么书？\",\"pinyin\":\"Zhè shì shénme shū?\",\"meaningVi\":\"Đây là sách gì?\"}]",
                Status = "PUBLISHED",
                LessonId = les3Id
            }
        };

        await context.GrammarPoints.AddRangeAsync(grammarPoints);

        var exercises = new List<ExerciseEntity>
        {
            new() {
                Id = Guid.NewGuid(),
                Type = "multiple-choice",
                Skill = "reading",
                HskLevel = 1,
                Title = "Chọn lời chào thích hợp",
                Instruction = "Chọn lời chào lịch sự thích hợp khi gặp người lớn tuổi hoặc thầy cô:",
                PromptHanzi = "遇见老师，应该说什么？",
                PromptPinyin = "Yùjiàn lǎoshī, yīnggāi shuō shénme?",
                PromptVietnamese = "Gặp thầy giáo, nên nói câu gì?",
                OptionsJson = "[\"你好\",\"您好\",\"再见\",\"对不起\"]",
                CorrectOptionIndex = 1,
                CorrectAnswer = "您好",
                Explanation = "Khi chào người lớn tuổi hoặc thầy cô, nên dùng 您好 (kính ngữ của 你) để thể hiện sự lễ phép.",
                XpReward = 15,
                Status = "PUBLISHED",
                LessonId = les1Id,
                GrammarPointId = grammar1Id
            },
            new() {
                Id = Guid.NewGuid(),
                Type = "fill-blank",
                Skill = "writing",
                HskLevel = 1,
                Title = "Điền từ hỏi tên",
                Instruction = "Điền đại từ nghi vấn thích hợp vào chỗ trống:",
                PromptHanzi = "你叫______名字？",
                PromptPinyin = "Nǐ jiào ______ míngzi?",
                PromptVietnamese = "Bạn tên là gì?",
                CorrectAnswer = "什么",
                Explanation = "Cụm từ cố định để hỏi tên là: 你叫什么名字 (Bạn tên là gì).",
                XpReward = 15,
                Status = "PUBLISHED",
                LessonId = les3Id,
                GrammarPointId = grammar2Id
            }
        };

        await context.Exercises.AddRangeAsync(exercises);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded vocabularies, grammar points, and exercises for HSK 1.");
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
