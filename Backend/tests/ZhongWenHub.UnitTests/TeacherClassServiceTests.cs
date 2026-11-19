using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using ZhongWenHub.Business.Teacher.DTOs;
using ZhongWenHub.Business.Teacher.Services;
using ZhongWenHub.Business.Users;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Entities;
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
}
