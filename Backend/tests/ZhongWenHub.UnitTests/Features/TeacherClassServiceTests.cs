using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using ZhongWenHub.Business.Teacher.DTOs;
using ZhongWenHub.Business.Teacher.Services;
using ZhongWenHub.Business.Users;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Entities.Teacher;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.UnitTests;

public class TeacherClassServiceTests
{
    private class FakeCurrentUserService : ICurrentUserService
    {
        public Guid? UserId { get; set; } = null;
        public string? Username { get; set; } = "test-teacher";
        public string? Email { get; set; } = "teacher@zhongwenhub.edu.vn";
        public bool IsAuthenticated { get; set; } = true;
        public IReadOnlyList<string> Roles { get; set; } = new List<string> { RoleConstants.Teacher };
    }

    private static ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private static async Task EnsureStudentRoleAsync(ApplicationDbContext dbContext, params ApplicationUser[] students)
    {
        var role = await dbContext.Roles.FirstOrDefaultAsync(r => r.NormalizedName == "STUDENT" || r.Name == "STUDENT");
        if (role == null)
        {
            role = new ApplicationRole("STUDENT")
            {
                Id = Guid.NewGuid(),
                NormalizedName = "STUDENT"
            };
            dbContext.Roles.Add(role);
            await dbContext.SaveChangesAsync();
        }

        foreach (var student in students)
        {
            var hasRole = await dbContext.UserRoles.AnyAsync(ur => ur.UserId == student.Id && ur.RoleId == role.Id);
            if (!hasRole)
            {
                dbContext.UserRoles.Add(new IdentityUserRole<Guid>
                {
                    UserId = student.Id,
                    RoleId = role.Id
                });
            }
        }
        await dbContext.SaveChangesAsync();
    }

    [Fact]
    public async Task GetClassesAsync_UnauthenticatedUser_ThrowsUnauthorizedAccessException()
    {
        using var dbContext = CreateInMemoryDbContext();
        var fakeUser = new FakeCurrentUserService { IsAuthenticated = false, UserId = null };
        var service = new TeacherClassService(dbContext, fakeUser, NullLogger<TeacherClassService>.Instance);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.GetClassesAsync(new ClassFilterDto()));
    }

    [Fact]
    public async Task CreateClassAsync_ValidDto_CreatesClassWithTeacherIdAndSchedules()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var fakeUser = new FakeCurrentUserService { UserId = teacherId, Roles = new[] { RoleConstants.Teacher } };
        var service = new TeacherClassService(dbContext, fakeUser, NullLogger<TeacherClassService>.Instance);

        var dto = new CreateTeachingClassDto
        {
            Name = "HSK 3 Giao Tiếp K24",
            Code = "CLS-HSK3-024",
            Description = "Khóa học đàm thoại thực hành",
            HskLevelId = "level-hsk-3",
            Capacity = 25,
            StartDate = DateTime.UtcNow.AddDays(7),
            LocationType = "ONLINE",
            MeetingUrl = "https://meet.google.com/abc-defg-hij",
            Schedules = new List<ClassScheduleDto>
            {
                new() { DayOfWeek = "MONDAY", StartTime = "19:00", EndTime = "20:30" },
                new() { DayOfWeek = "WEDNESDAY", StartTime = "19:00", EndTime = "20:30" }
            }
        };

        var result = await service.CreateClassAsync(dto);

        Assert.NotNull(result);
        Assert.Equal(teacherId, result.TeacherId);
        Assert.Equal("CLS-HSK3-024", result.Code);
        Assert.Equal("UPCOMING", result.Status);

        var entity = await dbContext.TeachingClasses.Include(c => c.Schedules).FirstOrDefaultAsync(c => c.Id == result.Id);
        Assert.NotNull(entity);
        Assert.Equal(2, entity.Schedules.Count);
    }

    [Fact]
    public async Task UpdateClassSchedulesAsync_LeavesAttendanceWhenReplacingItsSchedule()
    {
        await using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var service = new TeacherClassService(
            dbContext, new FakeCurrentUserService { UserId = teacherId }, NullLogger<TeacherClassService>.Instance);
        var created = await service.CreateClassAsync(new CreateTeachingClassDto
        {
            Name = "Lớp kiểm thử",
            Code = "CLS-ATTENDANCE",
            HskLevelId = "level-hsk-1",
            Capacity = 10,
            StartDate = DateTime.UtcNow,
            Schedules = [new() { DayOfWeek = "MONDAY", StartTime = "19:00", EndTime = "20:30" }],
        });
        var original = await dbContext.TeachingClassSchedules.SingleAsync();
        var attendance = new TeachingClassAttendance
        {
            ClassId = created.Id,
            ScheduleId = original.Id,
            StudentId = Guid.NewGuid(),
            RecordedByTeacherId = teacherId,
            AttendanceDate = DateTime.UtcNow.Date,
        };
        dbContext.TeachingClassAttendances.Add(attendance);
        await dbContext.SaveChangesAsync();
        dbContext.ChangeTracker.Clear();

        await service.UpdateClassSchedulesAsync(created.Id,
            [new() { DayOfWeek = "FRIDAY", StartTime = "19:00", EndTime = "20:30" }]);

        Assert.Equal("FRIDAY", (await dbContext.TeachingClassSchedules.SingleAsync()).DayOfWeek);
        var retained = await dbContext.TeachingClassAttendances.SingleAsync();
        Assert.Equal(attendance.Id, retained.Id);
        Assert.Null(retained.ScheduleId);
    }

    [Fact]
    public async Task CreateClassAsync_DuplicateCode_ThrowsInvalidOperationException()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var fakeUser = new FakeCurrentUserService { UserId = teacherId };
        var service = new TeacherClassService(dbContext, fakeUser, NullLogger<TeacherClassService>.Instance);

        var dto1 = new CreateTeachingClassDto
        {
            Name = "Lớp 1",
            Code = "CLS-DUP-01",
            HskLevelId = "level-hsk-1",
            Capacity = 20,
            StartDate = DateTime.UtcNow
        };
        await service.CreateClassAsync(dto1);

        var dto2 = new CreateTeachingClassDto
        {
            Name = "Lớp 2",
            Code = "cls-dup-01", // case-insensitive duplicate
            HskLevelId = "level-hsk-2",
            Capacity = 20,
            StartDate = DateTime.UtcNow
        };

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateClassAsync(dto2));
        Assert.Contains("đã tồn tại", ex.Message);
    }

    [Fact]
    public async Task CreateClassAsync_InvalidScheduleTimeRange_ThrowsArgumentException()
    {
        using var dbContext = CreateInMemoryDbContext();
        var fakeUser = new FakeCurrentUserService { UserId = Guid.NewGuid() };
        var service = new TeacherClassService(dbContext, fakeUser, NullLogger<TeacherClassService>.Instance);

        var dto = new CreateTeachingClassDto
        {
            Name = "Lớp Lỗi Giờ",
            Code = "CLS-ERR-01",
            HskLevelId = "level-hsk-1",
            Capacity = 20,
            StartDate = DateTime.UtcNow,
            Schedules = new List<ClassScheduleDto>
            {
                new() { DayOfWeek = "MONDAY", StartTime = "20:30", EndTime = "19:00" } // Invalid: start >= end
            }
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateClassAsync(dto));
        Assert.Contains("Khung giờ không hợp lệ", ex.Message);
    }

    [Fact]
    public async Task TeacherOwnership_TeacherCannotAccessOrModifyAnotherTeachersClass()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacher1Id = Guid.NewGuid();
        var teacher2Id = Guid.NewGuid();

        dbContext.Users.AddRange(
            new ApplicationUser { Id = teacher1Id, UserName = "teacher1", DisplayName = "Thầy 1", Email = "t1@mail.com" },
            new ApplicationUser { Id = teacher2Id, UserName = "teacher2", DisplayName = "Thầy 2", Email = "t2@mail.com" }
        );
        await dbContext.SaveChangesAsync();

        var fakeUser = new FakeCurrentUserService { UserId = teacher1Id, Roles = new[] { RoleConstants.Teacher } };
        var service1 = new TeacherClassService(dbContext, fakeUser, NullLogger<TeacherClassService>.Instance);

        var created = await service1.CreateClassAsync(new CreateTeachingClassDto
        {
            Name = "Lớp Của Thầy 1",
            Code = "CLS-T1-01",
            HskLevelId = "level-hsk-3",
            Capacity = 20,
            StartDate = DateTime.UtcNow
        });

        // Switch to Teacher 2
        fakeUser.UserId = teacher2Id;
        var service2 = new TeacherClassService(dbContext, fakeUser, NullLogger<TeacherClassService>.Instance);

        // Teacher 2 should NOT be able to view details
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service2.GetClassByIdAsync(created.Id));

        // Teacher 2 should NOT be able to update
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service2.UpdateClassAsync(created.Id, new UpdateTeachingClassDto { Name = "Hacked", HskLevelId = "level-hsk-1" }));

        // Teacher 2 should NOT be able to archive
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service2.ArchiveClassAsync(created.Id));

        // Teacher 2 should NOT see it in their class list
        var classes = await service2.GetClassesAsync(new ClassFilterDto());
        Assert.Empty(classes.Items);

        // Admin CAN view and edit Teacher 1's class
        fakeUser.UserId = Guid.NewGuid();
        fakeUser.Roles = new[] { RoleConstants.Admin };
        var adminService = new TeacherClassService(dbContext, fakeUser, NullLogger<TeacherClassService>.Instance);

        var adminDetail = await adminService.GetClassByIdAsync(created.Id);
        Assert.NotNull(adminDetail);
        Assert.Equal("CLS-T1-01", adminDetail.ClassInfo.Code);
    }

    [Fact]
    public async Task ClassMembers_AddAndRemoveStudent_UpdatesDynamicEnrollmentCorrectly()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var fakeUser = new FakeCurrentUserService { UserId = teacherId, Roles = new[] { RoleConstants.Teacher } };
        var service = new TeacherClassService(dbContext, fakeUser, NullLogger<TeacherClassService>.Instance);

        // Create teacher and student account
        var teacherUser = new ApplicationUser
        {
            Id = teacherId,
            UserName = "teacher_lead",
            Email = "teacher@zhongwenhub.edu.vn",
            DisplayName = "Thầy Trưởng Môn"
        };
        var studentUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "hocvien_nam",
            Email = "nam.le@gmail.com",
            DisplayName = "Lê Hoàng Nam",
            Status = UserStatus.ACTIVE
        };
        dbContext.Users.AddRange(teacherUser, studentUser);
        await dbContext.SaveChangesAsync();
        await EnsureStudentRoleAsync(dbContext, studentUser);

        var createdClass = await service.CreateClassAsync(new CreateTeachingClassDto
        {
            Name = "Lớp HSK 2 Cơ Bản",
            Code = "CLS-HSK2-001",
            HskLevelId = "level-hsk-2",
            Capacity = 2, // low capacity for test
            StartDate = DateTime.UtcNow
        });

        // Add student by email
        var member = await service.AddMemberAsync(createdClass.Id, new AddClassMemberDto
        {
            StudentIdentifier = "nam.le@gmail.com",
            Notes = "Học viên xuất sắc"
        });

        Assert.Equal(studentUser.Id, member.StudentId);
        Assert.Equal("ACTIVE", member.Status);

        // Verify dynamic derived enrollment count
        var detail = await service.GetClassByIdAsync(createdClass.Id);
        Assert.Equal(1, detail.DerivedEnrollmentCount);

        // Prevent duplicate enrollment
        var exDup = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.AddMemberAsync(createdClass.Id, new AddClassMemberDto { StudentIdentifier = "nam.le@gmail.com" }));
        Assert.Contains("đã là thành viên", exDup.Message);

        // Add 2nd student to reach capacity
        var student2 = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "hocvien_nu",
            Email = "thuthao@gmail.com",
            DisplayName = "Trần Thu Thảo"
        };
        dbContext.Users.Add(student2);
        await dbContext.SaveChangesAsync();
        await EnsureStudentRoleAsync(dbContext, student2);

        await service.AddMemberAsync(createdClass.Id, new AddClassMemberDto { StudentIdentifier = "thuthao@gmail.com" });

        // Adding 3rd student should throw capacity overflow
        var student3 = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "hocvien_3",
            Email = "duc.pham@gmail.com",
            DisplayName = "Phạm Đức"
        };
        dbContext.Users.Add(student3);
        await dbContext.SaveChangesAsync();
        await EnsureStudentRoleAsync(dbContext, student3);

        var exCap = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.AddMemberAsync(createdClass.Id, new AddClassMemberDto { StudentIdentifier = "duc.pham@gmail.com" }));
        Assert.Contains("đạt sĩ số tối đa", exCap.Message);

        // Remove 1st student
        var removed = await service.RemoveMemberAsync(createdClass.Id, studentUser.Id);
        Assert.True(removed);

        // Recheck derived count
        var detailAfter = await service.GetClassByIdAsync(createdClass.Id);
        Assert.Equal(1, detailAfter.DerivedEnrollmentCount);
    }

    [Fact]
    public async Task Dashboard_CalculatesRealKpiMetricsAccurately()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var fakeUser = new FakeCurrentUserService { UserId = teacherId, Roles = new[] { RoleConstants.Teacher } };
        var service = new TeacherClassService(dbContext, fakeUser, NullLogger<TeacherClassService>.Instance);

        // Create 2 classes: 1 ACTIVE and 1 UPCOMING
        var activeClass = await service.CreateClassAsync(new CreateTeachingClassDto
        {
            Name = "Lớp Đang Hoạt Động",
            Code = "CLS-ACT-01",
            HskLevelId = "level-hsk-3",
            Capacity = 30,
            StartDate = DateTime.UtcNow.AddDays(-10),
            Schedules = new List<ClassScheduleDto>
            {
                new() { DayOfWeek = "MONDAY", StartTime = "18:00", EndTime = "20:00" }, // 2 hours
                new() { DayOfWeek = "FRIDAY", StartTime = "18:00", EndTime = "20:00" }   // 2 hours
            }
        });

        // Set status to ACTIVE
        var clsEntity = await dbContext.TeachingClasses.FindAsync(activeClass.Id);
        clsEntity!.Status = "ACTIVE";
        await dbContext.SaveChangesAsync();

        // Upcoming class with 1 hour
        await service.CreateClassAsync(new CreateTeachingClassDto
        {
            Name = "Lớp Sắp Mở",
            Code = "CLS-UPC-01",
            HskLevelId = "level-hsk-1",
            Capacity = 20,
            StartDate = DateTime.UtcNow.AddDays(5),
            Schedules = new List<ClassScheduleDto>
            {
                new() { DayOfWeek = "SUNDAY", StartTime = "09:00", EndTime = "10:30" }
            }
        });

        // Enroll 2 students into active class
        var student1 = new ApplicationUser { Id = Guid.NewGuid(), UserName = "st1", Email = "st1@mail.com" };
        var student2 = new ApplicationUser { Id = Guid.NewGuid(), UserName = "st2", Email = "st2@mail.com" };
        dbContext.Users.AddRange(student1, student2);
        await dbContext.SaveChangesAsync();
        await EnsureStudentRoleAsync(dbContext, student1, student2);

        await service.AddMemberAsync(activeClass.Id, new AddClassMemberDto { StudentIdentifier = "st1@mail.com" });
        await service.AddMemberAsync(activeClass.Id, new AddClassMemberDto { StudentIdentifier = "st2@mail.com" });

        // Query dashboard
        var dashboard = await service.GetDashboardAsync();

        Assert.NotNull(dashboard);
        Assert.Equal(1, dashboard.Metrics.ActiveClassesCount); // Only ACTIVE class counted
        Assert.Equal(2, dashboard.Metrics.TotalEnrolledStudents);
        Assert.Equal(4.0, dashboard.Metrics.WeeklyTeachingHours); // 2 hours + 2 hours
        Assert.NotEmpty(dashboard.UpcomingSessions);
        Assert.Single(dashboard.ActiveClasses);
    }

    [Fact]
    public async Task AddMemberAsync_UserWithoutStudentRole_ThrowsInvalidOperationException()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var fakeUser = new FakeCurrentUserService { UserId = teacherId, Roles = new[] { RoleConstants.Teacher } };
        var service = new TeacherClassService(dbContext, fakeUser, NullLogger<TeacherClassService>.Instance);

        var cls = await service.CreateClassAsync(new CreateTeachingClassDto
        {
            Name = "Lớp Kiểm Tra Vai Trò",
            Code = "CLS-ROLE-01",
            HskLevelId = "level-hsk-3",
            Capacity = 20,
            StartDate = DateTime.UtcNow
        });

        var nonStudentUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "teacher_guest",
            Email = "guest@zhongwenhub.edu.vn"
        };
        dbContext.Users.Add(nonStudentUser);
        await dbContext.SaveChangesAsync();

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.AddMemberAsync(cls.Id, new AddClassMemberDto { StudentIdentifier = "guest@zhongwenhub.edu.vn" }));
        Assert.Contains("không phải là học viên", ex.Message);
    }

    [Fact]
    public async Task AddMemberAsync_ArchivedOrCompletedClass_ThrowsInvalidOperationException()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var fakeUser = new FakeCurrentUserService { UserId = teacherId, Roles = new[] { RoleConstants.Teacher } };
        var service = new TeacherClassService(dbContext, fakeUser, NullLogger<TeacherClassService>.Instance);

        var cls = await service.CreateClassAsync(new CreateTeachingClassDto
        {
            Name = "Lớp Lưu Trữ",
            Code = "CLS-ARC-01",
            HskLevelId = "level-hsk-3",
            Capacity = 20,
            StartDate = DateTime.UtcNow
        });

        // Archive the class
        await service.ArchiveClassAsync(cls.Id);

        var student = new ApplicationUser { Id = Guid.NewGuid(), UserName = "std_arc", Email = "std_arc@mail.com" };
        dbContext.Users.Add(student);
        await dbContext.SaveChangesAsync();
        await EnsureStudentRoleAsync(dbContext, student);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.AddMemberAsync(cls.Id, new AddClassMemberDto { StudentIdentifier = "std_arc@mail.com" }));
        Assert.Contains("Không thể ghi danh vào lớp học đã kết thúc hoặc đã lưu trữ", ex.Message);
    }

    [Fact]
    public async Task ValidateSchedules_OverlappingSameDay_ThrowsArgumentException()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var fakeUser = new FakeCurrentUserService { UserId = teacherId, Roles = new[] { RoleConstants.Teacher } };
        var service = new TeacherClassService(dbContext, fakeUser, NullLogger<TeacherClassService>.Instance);

        var dto = new CreateTeachingClassDto
        {
            Name = "Lớp Trùng Giờ",
            Code = "CLS-OVL-01",
            HskLevelId = "level-hsk-3",
            Capacity = 20,
            StartDate = DateTime.UtcNow,
            Schedules = new List<ClassScheduleDto>
            {
                new() { DayOfWeek = "MONDAY", StartTime = "19:00", EndTime = "20:30" },
                new() { DayOfWeek = "MONDAY", StartTime = "20:00", EndTime = "21:00" } // Overlaps 20:00 < 20:30
            }
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateClassAsync(dto));
        Assert.Contains("bị trùng lặp", ex.Message);
    }

    [Fact]
    public async Task ValidateSchedules_AdjacentIntervalsSameDay_Accepted()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var fakeUser = new FakeCurrentUserService { UserId = teacherId, Roles = new[] { RoleConstants.Teacher } };
        var service = new TeacherClassService(dbContext, fakeUser, NullLogger<TeacherClassService>.Instance);

        var dto = new CreateTeachingClassDto
        {
            Name = "Lớp Liền Kề Hợp Lệ",
            Code = "CLS-ADJ-01",
            HskLevelId = "level-hsk-3",
            Capacity = 20,
            StartDate = DateTime.UtcNow,
            Schedules = new List<ClassScheduleDto>
            {
                new() { DayOfWeek = "MONDAY", StartTime = "19:00", EndTime = "20:00" },
                new() { DayOfWeek = "MONDAY", StartTime = "20:00", EndTime = "21:00" } // Adjacent, not overlapping
            }
        };

        var created = await service.CreateClassAsync(dto);
        Assert.NotNull(created);
        var schedules = await service.GetClassSchedulesAsync(created.Id);
        Assert.Equal(2, schedules.Count);
    }

    [Fact]
    public async Task ValidateSchedules_InvalidTimeFormat_ThrowsArgumentException()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var fakeUser = new FakeCurrentUserService { UserId = teacherId, Roles = new[] { RoleConstants.Teacher } };
        var service = new TeacherClassService(dbContext, fakeUser, NullLogger<TeacherClassService>.Instance);

        var dto = new CreateTeachingClassDto
        {
            Name = "Lớp Sai Format",
            Code = "CLS-FMT-01",
            HskLevelId = "level-hsk-3",
            Capacity = 20,
            StartDate = DateTime.UtcNow,
            Schedules = new List<ClassScheduleDto>
            {
                new() { DayOfWeek = "MONDAY", StartTime = "25:00", EndTime = "20:00" }
            }
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateClassAsync(dto));
        Assert.Contains("không hợp lệ", ex.Message);
    }

    [Fact]
    public async Task GetClassStatsAsync_AggregatesCountsCorrectly()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var fakeUser = new FakeCurrentUserService { UserId = teacherId, Roles = new[] { RoleConstants.Teacher } };
        var service = new TeacherClassService(dbContext, fakeUser, NullLogger<TeacherClassService>.Instance);

        // 1. ACTIVE class with 2 students
        var activeClass = await service.CreateClassAsync(new CreateTeachingClassDto
        {
            Name = "Lớp 1",
            Code = "CLS-ST-01",
            HskLevelId = "level-hsk-1",
            Capacity = 20,
            StartDate = DateTime.UtcNow
        });
        var c1 = await dbContext.TeachingClasses.FindAsync(activeClass.Id);
        c1!.Status = "ACTIVE";

        var s1 = new ApplicationUser { Id = Guid.NewGuid(), UserName = "s1", Email = "s1@mail.com" };
        var s2 = new ApplicationUser { Id = Guid.NewGuid(), UserName = "s2", Email = "s2@mail.com" };
        dbContext.Users.AddRange(s1, s2);
        await dbContext.SaveChangesAsync();
        await EnsureStudentRoleAsync(dbContext, s1, s2);
        await service.AddMemberAsync(activeClass.Id, new AddClassMemberDto { StudentIdentifier = "s1@mail.com" });
        await service.AddMemberAsync(activeClass.Id, new AddClassMemberDto { StudentIdentifier = "s2@mail.com" });

        // 2. UPCOMING class
        await service.CreateClassAsync(new CreateTeachingClassDto
        {
            Name = "Lớp 2",
            Code = "CLS-ST-02",
            HskLevelId = "level-hsk-2",
            Capacity = 20,
            StartDate = DateTime.UtcNow.AddDays(10)
        });

        // 3. ARCHIVED class
        var arcClass = await service.CreateClassAsync(new CreateTeachingClassDto
        {
            Name = "Lớp 3",
            Code = "CLS-ST-03",
            HskLevelId = "level-hsk-3",
            Capacity = 20,
            StartDate = DateTime.UtcNow.AddDays(-30)
        });
        await service.ArchiveClassAsync(arcClass.Id);

        var stats = await service.GetClassStatsAsync();

        Assert.Equal(3, stats.TotalClasses);
        Assert.Equal(1, stats.ActiveCount);
        Assert.Equal(1, stats.UpcomingCount);
        Assert.Equal(1, stats.ArchivedCount);
        Assert.Equal(2, stats.TotalStudents);
    }

    [Fact]
    public async Task GetClassesAsync_PaginationLargeDataset_SupportsMoreThan100Classes()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var fakeUser = new FakeCurrentUserService { UserId = teacherId, Roles = new[] { RoleConstants.Teacher } };
        var service = new TeacherClassService(dbContext, fakeUser, NullLogger<TeacherClassService>.Instance);

        var classes = new List<TeachingClass>();
        for (int i = 1; i <= 105; i++)
        {
            classes.Add(new TeachingClass
            {
                Id = Guid.NewGuid(),
                TeacherId = teacherId,
                Name = $"Lớp HSK {i}",
                Code = $"CLS-PAG-{i:D3}",
                HskLevelId = "level-hsk-1",
                Capacity = 30,
                StartDate = DateTime.UtcNow.AddDays(i),
                Status = "UPCOMING",
                LocationType = "ONLINE",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }
        dbContext.TeachingClasses.AddRange(classes);
        await dbContext.SaveChangesAsync();

        // Page 1: pageSize 50
        var p1 = await service.GetClassesAsync(new ClassFilterDto { Page = 1, PageSize = 50 });
        Assert.Equal(105, p1.TotalItems);
        Assert.Equal(50, p1.Items.Count);
        Assert.Equal(3, p1.TotalPages);

        // Page 3: pageSize 50 -> should have 5 items
        var p3 = await service.GetClassesAsync(new ClassFilterDto { Page = 3, PageSize = 50 });
        Assert.Equal(5, p3.Items.Count);
    }

    [Fact]
    public async Task GetMyEnrolledClassesAsync_StudentGetsOnlyEnrolledActiveClasses()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var studentId = Guid.NewGuid();

        var teacherUser = new ApplicationUser { Id = teacherId, UserName = "teacher1", Email = "t1@mail.com", DisplayName = "Cô Giáo" };
        var studentUser = new ApplicationUser { Id = studentId, UserName = "student1", Email = "student1@mail.com" };
        dbContext.Users.AddRange(teacherUser, studentUser);
        await dbContext.SaveChangesAsync();
        await EnsureStudentRoleAsync(dbContext, studentUser);

        var fakeUser = new FakeCurrentUserService { UserId = teacherId, Roles = new[] { RoleConstants.Teacher } };
        var teacherService = new TeacherClassService(dbContext, fakeUser, NullLogger<TeacherClassService>.Instance);

        // Class 1 (enrolled)
        var class1 = await teacherService.CreateClassAsync(new CreateTeachingClassDto
        {
            Name = "Lớp HSK 1 Cho Người Mới",
            Code = "CLS-MY-01",
            HskLevelId = "level-hsk-1",
            Capacity = 20,
            StartDate = DateTime.UtcNow
        });
        var c1 = await dbContext.TeachingClasses.FindAsync(class1.Id);
        c1!.Status = "ACTIVE";
        await dbContext.SaveChangesAsync();
        await teacherService.AddMemberAsync(class1.Id, new AddClassMemberDto { StudentIdentifier = "student1@mail.com" });

        // Class 2 (NOT enrolled)
        await teacherService.CreateClassAsync(new CreateTeachingClassDto
        {
            Name = "Lớp HSK 5 Chuyên Sâu",
            Code = "CLS-MY-02",
            HskLevelId = "level-hsk-5",
            Capacity = 20,
            StartDate = DateTime.UtcNow
        });

        // Query as student
        var fakeStudentUser = new FakeCurrentUserService
        {
            UserId = studentId,
            Roles = new[] { RoleConstants.Student },
            Username = "student1",
            Email = "student1@mail.com"
        };
        var studentService = new TeacherClassService(dbContext, fakeStudentUser, NullLogger<TeacherClassService>.Instance);

        var myClasses = await studentService.GetMyEnrolledClassesAsync();

        Assert.Single(myClasses);
        Assert.Equal("CLS-MY-01", myClasses[0].Code);
        Assert.Equal("Cô Giáo", myClasses[0].TeacherName);
        Assert.Equal("ACTIVE", myClasses[0].Status);
    }

    [Fact]
    public async Task AddMemberAsync_ConcurrentEnrollments_WhenOnlyOneSpotRemains_NeverExceedsCapacity()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var fakeUser = new FakeCurrentUserService { UserId = teacherId, Roles = new[] { RoleConstants.Teacher } };
        var service = new TeacherClassService(dbContext, fakeUser, NullLogger<TeacherClassService>.Instance);

        var cls = await service.CreateClassAsync(new CreateTeachingClassDto
        {
            Name = "Lớp Cạnh Tranh Suất Học",
            Code = "CLS-CONCUR-01",
            HskLevelId = "level-hsk-3",
            Capacity = 1, // Only 1 spot!
            StartDate = DateTime.UtcNow
        });

        var s1 = new ApplicationUser { Id = Guid.NewGuid(), UserName = "std_concur_1", Email = "c1@mail.com" };
        var s2 = new ApplicationUser { Id = Guid.NewGuid(), UserName = "std_concur_2", Email = "c2@mail.com" };
        dbContext.Users.AddRange(s1, s2);
        await dbContext.SaveChangesAsync();
        await EnsureStudentRoleAsync(dbContext, s1, s2);

        // Run both enrollment requests concurrently
        var task1 = Task.Run(async () =>
        {
            try
            {
                await service.AddMemberAsync(cls.Id, new AddClassMemberDto { StudentIdentifier = "c1@mail.com" });
                return true;
            }
            catch (InvalidOperationException)
            {
                return false;
            }
        });

        var task2 = Task.Run(async () =>
        {
            try
            {
                await service.AddMemberAsync(cls.Id, new AddClassMemberDto { StudentIdentifier = "c2@mail.com" });
                return true;
            }
            catch (InvalidOperationException)
            {
                return false;
            }
        });

        var results = await Task.WhenAll(task1, task2);

        // Exactly one should succeed and one should fail
        Assert.Contains(true, results);
        Assert.Contains(false, results);

        var finalCount = await dbContext.TeachingClassMembers.CountAsync(m => m.ClassId == cls.Id && m.Status == "ACTIVE");
        Assert.Equal(1, finalCount); // NEVER exceeds capacity 1
    }

    [Fact]
    public async Task GetMyEnrolledClassByIdAsync_WhenStudentIsEnrolled_ReturnsClassMetadataWithSchedules()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var studentId = Guid.NewGuid();

        var teacherUser = new ApplicationUser { Id = teacherId, UserName = "teacher_linh", DisplayName = "Cô Linh", Email = "linh@test.com" };
        var studentUser = new ApplicationUser { Id = studentId, UserName = "student_an", DisplayName = "Nguyễn Văn An", Email = "an@test.com" };
        dbContext.Users.AddRange(teacherUser, studentUser);
        await dbContext.SaveChangesAsync();
        await EnsureStudentRoleAsync(dbContext, studentUser);

        var teachingClass = new TeachingClass
        {
            Id = Guid.NewGuid(),
            Name = "Lớp HSK 3 Chuẩn",
            Code = "CLS-HSK3-CH01",
            HskLevelId = "level-hsk-3",
            TeacherId = teacherId,
            Status = "ACTIVE",
            Capacity = 20,
            LocationType = "ONLINE",
            StartDate = DateTime.UtcNow,
            Schedules = new List<TeachingClassSchedule>
            {
                new TeachingClassSchedule { Id = Guid.NewGuid(), DayOfWeek = "MONDAY", StartTime = "19:00", EndTime = "20:30" }
            }
        };
        dbContext.TeachingClasses.Add(teachingClass);

        var membership = new TeachingClassMember
        {
            Id = Guid.NewGuid(),
            ClassId = teachingClass.Id,
            StudentId = studentId,
            Status = "ACTIVE",
            EnrolledAt = DateTime.UtcNow
        };
        dbContext.TeachingClassMembers.Add(membership);
        await dbContext.SaveChangesAsync();

        var fakeStudent = new FakeCurrentUserService
        {
            UserId = studentId,
            Roles = new[] { RoleConstants.Student },
            IsAuthenticated = true
        };
        var service = new TeacherClassService(dbContext, fakeStudent, NullLogger<TeacherClassService>.Instance);

        var result = await service.GetMyEnrolledClassByIdAsync(teachingClass.Id);

        Assert.NotNull(result);
        Assert.Equal(teachingClass.Id, result.Id);
        Assert.Equal("Lớp HSK 3 Chuẩn", result.Name);
        Assert.Equal("CLS-HSK3-CH01", result.Code);
        Assert.Equal("Cô Linh", result.TeacherName);
        Assert.Contains("T2", result.SchedulesSummary);
    }

    [Fact]
    public async Task GetMyEnrolledClassByIdAsync_WhenStudentIsNotEnrolled_ReturnsNull()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var studentId = Guid.NewGuid();

        var teachingClass = new TeachingClass
        {
            Id = Guid.NewGuid(),
            Name = "Lớp HSK 4 Nâng Cao",
            Code = "CLS-HSK4-ADV",
            HskLevelId = "level-hsk-4",
            TeacherId = teacherId,
            Status = "ACTIVE",
            Capacity = 25,
            StartDate = DateTime.UtcNow
        };
        dbContext.TeachingClasses.Add(teachingClass);
        await dbContext.SaveChangesAsync();

        var fakeStudent = new FakeCurrentUserService
        {
            UserId = studentId,
            Roles = new[] { RoleConstants.Student },
            IsAuthenticated = true
        };
        var service = new TeacherClassService(dbContext, fakeStudent, NullLogger<TeacherClassService>.Instance);

        var result = await service.GetMyEnrolledClassByIdAsync(teachingClass.Id);

        Assert.Null(result); // Student has no membership in this class
    }

    [Fact]
    public async Task GetMyEnrolledClassByIdAsync_WhenUnauthenticated_ThrowsUnauthorizedAccessException()
    {
        using var dbContext = CreateInMemoryDbContext();
        var unauthUser = new FakeCurrentUserService { IsAuthenticated = false, UserId = null };
        var service = new TeacherClassService(dbContext, unauthUser, NullLogger<TeacherClassService>.Instance);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.GetMyEnrolledClassByIdAsync(Guid.NewGuid()));
    }
}
