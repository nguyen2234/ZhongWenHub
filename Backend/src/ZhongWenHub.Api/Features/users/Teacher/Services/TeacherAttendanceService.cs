using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Business.Authorization;
using ZhongWenHub.Business.Teacher.DTOs;
using ZhongWenHub.Business.Users;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Entities.Teacher;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.Teacher.Services;

public class TeacherAttendanceService : ITeacherAttendanceService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<TeacherAttendanceService> _logger;

    public TeacherAttendanceService(
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        ILogger<TeacherAttendanceService> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    private async Task<TeachingClass> GetAuthorizedClassAsync(Guid classId, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (!currentUserId.HasValue)
        {
            throw new UnauthorizedAccessException("Người dùng chưa được xác thực.");
        }

        var cls = await _context.TeachingClasses
            .FirstOrDefaultAsync(c => c.Id == classId && !c.IsArchived, cancellationToken);

        if (cls == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy lớp học với mã {classId}");
        }

        var isAdmin = _currentUserService.Roles.Contains(RoleConstants.Admin);
        if (!isAdmin && cls.TeacherId != currentUserId.Value)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền quản lý điểm danh của lớp học này.");
        }

        return cls;
    }

    public async Task<IReadOnlyList<ClassAttendanceRecordDto>> GetClassAttendanceAsync(
        Guid classId,
        DateTime? date,
        CancellationToken cancellationToken = default)
    {
        await GetAuthorizedClassAsync(classId, cancellationToken);

        var query = _context.TeachingClassAttendances
            .Include(a => a.Student)
            .Where(a => a.ClassId == classId);

        if (date.HasValue)
        {
            var targetDate = date.Value.Date;
            query = query.Where(a => a.AttendanceDate.Date == targetDate);
        }

        var list = await query
            .OrderBy(a => a.AttendanceDate)
            .ThenBy(a => a.Student.DisplayName)
            .Select(a => new ClassAttendanceRecordDto
            {
                Id = a.Id,
                ClassId = a.ClassId,
                ScheduleId = a.ScheduleId,
                StudentId = a.StudentId,
                StudentName = a.Student.DisplayName,
                StudentEmail = a.Student.Email ?? string.Empty,
                StudentAvatarUrl = a.Student.AvatarUrl,
                AttendanceDate = a.AttendanceDate,
                Status = a.Status,
                Notes = a.Notes,
                RecordedByTeacherId = a.RecordedByTeacherId,
                CreatedAt = a.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        return list;
    }

    public async Task<IReadOnlyList<ClassAttendanceRecordDto>> RecordClassAttendanceAsync(
        Guid classId,
        RecordClassAttendanceDto dto,
        CancellationToken cancellationToken = default)
    {
        var cls = await GetAuthorizedClassAsync(classId, cancellationToken);
        var currentUserId = _currentUserService.UserId!.Value;
        var attendanceDate = dto.AttendanceDate.Date;

        // Verify all students are active members of the class
        var memberStudentIds = await _context.TeachingClassMembers
            .Where(m => m.ClassId == classId && m.Status == "ACTIVE")
            .Select(m => m.StudentId)
            .ToListAsync(cancellationToken);

        var memberSet = new HashSet<Guid>(memberStudentIds);

        // Fetch existing attendance records for this class and date
        var existingRecords = await _context.TeachingClassAttendances
            .Where(a => a.ClassId == classId && a.AttendanceDate.Date == attendanceDate)
            .ToListAsync(cancellationToken);

        var existingMap = existingRecords.ToDictionary(a => a.StudentId, a => a);
        var validStatuses = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "PRESENT", "ABSENT", "LATE", "EXCUSED" };

        foreach (var item in dto.Records)
        {
            if (!memberSet.Contains(item.StudentId))
            {
                continue; // Skip students not in class
            }

            var status = item.Status.ToUpperInvariant();
            if (!validStatuses.Contains(status))
            {
                status = "PRESENT";
            }

            if (existingMap.TryGetValue(item.StudentId, out var existing))
            {
                existing.Status = status;
                existing.Notes = item.Notes;
                existing.ScheduleId = dto.ScheduleId;
                existing.RecordedByTeacherId = currentUserId;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                var newRecord = new TeachingClassAttendance
                {
                    ClassId = classId,
                    ScheduleId = dto.ScheduleId,
                    StudentId = item.StudentId,
                    AttendanceDate = attendanceDate,
                    Status = status,
                    Notes = item.Notes,
                    RecordedByTeacherId = currentUserId,
                };
                _context.TeachingClassAttendances.Add(newRecord);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Recalculate AttendanceRate for all members of this class
        await RecalculateClassAttendanceRatesAsync(classId, cancellationToken);

        return await GetClassAttendanceAsync(classId, attendanceDate, cancellationToken);
    }

    public async Task<ClassAttendanceSummaryDto> GetClassAttendanceSummaryAsync(
        Guid classId,
        CancellationToken cancellationToken = default)
    {
        var cls = await GetAuthorizedClassAsync(classId, cancellationToken);

        var members = await _context.TeachingClassMembers
            .Include(m => m.Student)
            .Where(m => m.ClassId == classId && m.Status == "ACTIVE")
            .ToListAsync(cancellationToken);

        var attendances = await _context.TeachingClassAttendances
            .Where(a => a.ClassId == classId)
            .ToListAsync(cancellationToken);

        var totalSessions = attendances.Select(a => a.AttendanceDate.Date).Distinct().Count();

        var studentSummaries = new List<StudentAttendanceSummaryDto>();
        double totalRates = 0;

        foreach (var m in members)
        {
            var studentAtt = attendances.Where(a => a.StudentId == m.StudentId).ToList();
            var present = studentAtt.Count(a => a.Status.Equals("PRESENT", StringComparison.OrdinalIgnoreCase));
            var late = studentAtt.Count(a => a.Status.Equals("LATE", StringComparison.OrdinalIgnoreCase));
            var absent = studentAtt.Count(a => a.Status.Equals("ABSENT", StringComparison.OrdinalIgnoreCase));
            var excused = studentAtt.Count(a => a.Status.Equals("EXCUSED", StringComparison.OrdinalIgnoreCase));
            var total = studentAtt.Count;

            var rate = total > 0
                ? Math.Round(((present + late * 0.8 + excused) / total) * 100.0, 1)
                : 100.0;

            studentSummaries.Add(new StudentAttendanceSummaryDto
            {
                StudentId = m.StudentId,
                StudentName = m.Student?.DisplayName ?? "Học viên",
                StudentEmail = m.Student?.Email ?? string.Empty,
                StudentAvatarUrl = m.Student?.AvatarUrl,
                TotalSessions = total,
                PresentCount = present,
                LateCount = late,
                AbsentCount = absent,
                ExcusedCount = excused,
                AttendanceRate = rate,
            });

            totalRates += rate;
        }

        var avgRate = studentSummaries.Count > 0 ? Math.Round(totalRates / studentSummaries.Count, 1) : 100.0;

        return new ClassAttendanceSummaryDto
        {
            ClassId = classId,
            ClassName = cls.Name,
            TotalSessionsHeld = totalSessions,
            AverageAttendanceRate = avgRate,
            Students = studentSummaries.OrderByDescending(s => s.AttendanceRate).ToList(),
        };
    }

    private async Task RecalculateClassAttendanceRatesAsync(Guid classId, CancellationToken cancellationToken)
    {
        var members = await _context.TeachingClassMembers
            .Where(m => m.ClassId == classId)
            .ToListAsync(cancellationToken);

        var attendances = await _context.TeachingClassAttendances
            .Where(a => a.ClassId == classId)
            .ToListAsync(cancellationToken);

        foreach (var m in members)
        {
            var studentAtt = attendances.Where(a => a.StudentId == m.StudentId).ToList();
            if (studentAtt.Count > 0)
            {
                var present = studentAtt.Count(a => a.Status.Equals("PRESENT", StringComparison.OrdinalIgnoreCase));
                var late = studentAtt.Count(a => a.Status.Equals("LATE", StringComparison.OrdinalIgnoreCase));
                var excused = studentAtt.Count(a => a.Status.Equals("EXCUSED", StringComparison.OrdinalIgnoreCase));
                m.AttendanceRate = Math.Round(((present + late * 0.8 + excused) / studentAtt.Count) * 100.0, 1);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
