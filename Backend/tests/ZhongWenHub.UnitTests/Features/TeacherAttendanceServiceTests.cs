using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using ZhongWenHub.Features.Teacher.DTOs;
using ZhongWenHub.Features.Teacher.Services;
using ZhongWenHub.Features.Admin.Users;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Entities.Teacher;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.UnitTests;

public class TeacherAttendanceServiceTests
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
    public async Task GetClassAttendanceAsync_Unauthenticated_ThrowsUnauthorizedAccessException()
    {
        using var dbContext = CreateInMemoryDbContext();
        var currentUserService = new FakeCurrentUserService { IsAuthenticated = false, UserId = null };
        var service = new TeacherAttendanceService(dbContext, currentUserService, NullLogger<TeacherAttendanceService>.Instance);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.GetClassAttendanceAsync(Guid.NewGuid(), null));
    }

    [Fact]
    public async Task GetClassAttendanceAsync_TeacherNotOwner_ThrowsUnauthorizedAccessException()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacher1Id = Guid.NewGuid();
        var teacher2Id = Guid.NewGuid();

        var cls = new TeachingClass
        {
            Id = Guid.NewGuid(),
            Name = "HSK 1 Lớp A",
            Code = "HSK1-A",
            TeacherId = teacher1Id,
            Capacity = 20
        };
        dbContext.TeachingClasses.Add(cls);
        await dbContext.SaveChangesAsync();

        var currentUserService = new FakeCurrentUserService { UserId = teacher2Id };
        var service = new TeacherAttendanceService(dbContext, currentUserService, NullLogger<TeacherAttendanceService>.Instance);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.GetClassAttendanceAsync(cls.Id, null));
    }

    [Fact]
    public async Task RecordClassAttendanceAsync_ValidRecords_SavesAndCalculatesRates()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var student1Id = Guid.NewGuid();
        var student2Id = Guid.NewGuid();

        var student1 = new ApplicationUser { Id = student1Id, UserName = "student1", DisplayName = "Học viên 1", Email = "s1@hub.vn" };
        var student2 = new ApplicationUser { Id = student2Id, UserName = "student2", DisplayName = "Học viên 2", Email = "s2@hub.vn" };
        dbContext.Users.AddRange(student1, student2);

        var cls = new TeachingClass
        {
            Id = Guid.NewGuid(),
            Name = "HSK 2 Buổi tối",
            Code = "HSK2-EVENING",
            TeacherId = teacherId,
            Capacity = 25
        };
        dbContext.TeachingClasses.Add(cls);

        var member1 = new TeachingClassMember
        {
            Id = Guid.NewGuid(),
            ClassId = cls.Id,
            StudentId = student1Id,
            Status = "ACTIVE",
            AttendanceRate = 100.0
        };
        var member2 = new TeachingClassMember
        {
            Id = Guid.NewGuid(),
            ClassId = cls.Id,
            StudentId = student2Id,
            Status = "ACTIVE",
            AttendanceRate = 100.0
        };
        dbContext.TeachingClassMembers.AddRange(member1, member2);
        await dbContext.SaveChangesAsync();

        var currentUserService = new FakeCurrentUserService { UserId = teacherId };
        var service = new TeacherAttendanceService(dbContext, currentUserService, NullLogger<TeacherAttendanceService>.Instance);

        var today = DateTime.UtcNow.Date;
        var dto = new RecordClassAttendanceDto
        {
            AttendanceDate = today,
            Records = new List<RecordAttendanceItemDto>
            {
                new() { StudentId = student1Id, Status = "PRESENT", Notes = "Đúng giờ" },
                new() { StudentId = student2Id, Status = "ABSENT", Notes = "Vắng không phép" }
            }
        };

        var results = await service.RecordClassAttendanceAsync(cls.Id, dto);

        Assert.Equal(2, results.Count);
        var s1Result = results.First(r => r.StudentId == student1Id);
        var s2Result = results.First(r => r.StudentId == student2Id);
        Assert.Equal("PRESENT", s1Result.Status);
        Assert.Equal("ABSENT", s2Result.Status);

        // Verify member attendance rate was recalculated
        var updatedM1 = await dbContext.TeachingClassMembers.FirstAsync(m => m.Id == member1.Id);
        var updatedM2 = await dbContext.TeachingClassMembers.FirstAsync(m => m.Id == member2.Id);

        Assert.Equal(100.0, updatedM1.AttendanceRate);
        Assert.Equal(0.0, updatedM2.AttendanceRate);
    }

    [Fact]
    public async Task GetClassAttendanceSummaryAsync_CalculatesSummaryStatsCorrectly()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var studentId = Guid.NewGuid();

        var student = new ApplicationUser { Id = studentId, UserName = "student1", DisplayName = "Nguyễn Văn A", Email = "a@hub.vn" };
        dbContext.Users.Add(student);

        var cls = new TeachingClass
        {
            Id = Guid.NewGuid(),
            Name = "HSK 3 Cấp tốc",
            Code = "HSK3-FAST",
            TeacherId = teacherId,
            Capacity = 15
        };
        dbContext.TeachingClasses.Add(cls);

        var member = new TeachingClassMember
        {
            Id = Guid.NewGuid(),
            ClassId = cls.Id,
            StudentId = studentId,
            Status = "ACTIVE",
            AttendanceRate = 50.0
        };
        dbContext.TeachingClassMembers.Add(member);

        var date1 = DateTime.UtcNow.Date.AddDays(-2);
        var date2 = DateTime.UtcNow.Date.AddDays(-1);

        dbContext.TeachingClassAttendances.AddRange(
            new TeachingClassAttendance
            {
                Id = Guid.NewGuid(),
                ClassId = cls.Id,
                StudentId = studentId,
                AttendanceDate = date1,
                Status = "PRESENT"
            },
            new TeachingClassAttendance
            {
                Id = Guid.NewGuid(),
                ClassId = cls.Id,
                StudentId = studentId,
                AttendanceDate = date2,
                Status = "ABSENT"
            }
        );
        await dbContext.SaveChangesAsync();

        var currentUserService = new FakeCurrentUserService { UserId = teacherId };
        var service = new TeacherAttendanceService(dbContext, currentUserService, NullLogger<TeacherAttendanceService>.Instance);

        var summary = await service.GetClassAttendanceSummaryAsync(cls.Id);

        Assert.NotNull(summary);
        Assert.Equal(cls.Id, summary.ClassId);
        Assert.Equal(2, summary.TotalSessionsHeld);
        Assert.Single(summary.Students);
        var sSummary = summary.Students[0];
        Assert.Equal(studentId, sSummary.StudentId);
        Assert.Equal(1, sSummary.PresentCount);
        Assert.Equal(1, sSummary.AbsentCount);
        Assert.Equal(50.0, sSummary.AttendanceRate);
    }
}
