using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Teacher.DTOs;
using ZhongWenHub.Business.Users;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Entities.Teacher;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.Teacher.Services;

public class TeacherClassService : ITeacherClassService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<TeacherClassService> _logger;
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<Guid, SemaphoreSlim> _classEnrollmentLocks = new();

    public TeacherClassService(
        ApplicationDbContext dbContext,
        ICurrentUserService currentUserService,
        ILogger<TeacherClassService> logger)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    private (Guid UserId, bool IsAdmin) GetCurrentUserInfo()
    {
        if (!_currentUserService.IsAuthenticated || !_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedAccessException("Người dùng chưa được xác thực.");
        }

        var isAdmin = _currentUserService.Roles.Contains(RoleConstants.Admin);
        return (_currentUserService.UserId.Value, isAdmin);
    }

    public async Task<PagedResponse<ClassSummaryDto>> GetClassesAsync(ClassFilterDto filter, CancellationToken cancellationToken = default)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();

        IQueryable<TeachingClass> query = _dbContext.TeachingClasses
            .AsNoTracking()
            .Include(c => c.Course)
            .Include(c => c.Schedules);

        if (!isAdmin)
        {
            query = query.Where(c => c.TeacherId == userId);
        }

        // Status filter
        if (!string.IsNullOrWhiteSpace(filter.Status) && !string.Equals(filter.Status, "ALL", StringComparison.OrdinalIgnoreCase))
        {
            var statusUpper = filter.Status.Trim().ToUpperInvariant();
            query = query.Where(c => c.Status == statusUpper);
        }
        else
        {
            // Default exclude archived unless explicitly requested
            query = query.Where(c => !c.IsArchived);
        }

        // HSK filter
        if (!string.IsNullOrWhiteSpace(filter.HskLevelId) && !string.Equals(filter.HskLevelId, "ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(c => c.HskLevelId == filter.HskLevelId.Trim());
        }

        // LocationType filter
        if (!string.IsNullOrWhiteSpace(filter.LocationType) && !string.Equals(filter.LocationType, "ALL", StringComparison.OrdinalIgnoreCase))
        {
            var locUpper = filter.LocationType.Trim().ToUpperInvariant();
            query = query.Where(c => c.LocationType == locUpper);
        }

        // Search
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var s = filter.Search.Trim().ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(s) || c.Code.ToLower().Contains(s) || c.Description.ToLower().Contains(s));
        }

        var totalItems = await query.CountAsync(cancellationToken);

        // Sorting
        var isAsc = string.Equals(filter.SortDirection, "asc", StringComparison.OrdinalIgnoreCase);
        query = (filter.SortField?.ToLowerInvariant()) switch
        {
            "name" => isAsc ? query.OrderBy(c => c.Name) : query.OrderByDescending(c => c.Name),
            "code" => isAsc ? query.OrderBy(c => c.Code) : query.OrderByDescending(c => c.Code),
            "status" => isAsc ? query.OrderBy(c => c.Status) : query.OrderByDescending(c => c.Status),
            "capacity" => isAsc ? query.OrderBy(c => c.Capacity) : query.OrderByDescending(c => c.Capacity),
            _ => isAsc ? query.OrderBy(c => c.StartDate) : query.OrderByDescending(c => c.StartDate),
        };

        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize < 1 ? 10 : (filter.PageSize > 100 ? 100 : filter.PageSize);

        var pagedClasses = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var classIds = pagedClasses.Select(c => c.Id).ToList();

        // Count active members per class dynamically
        var memberCounts = await _dbContext.TeachingClassMembers
            .AsNoTracking()
            .Where(m => classIds.Contains(m.ClassId) && m.Status == "ACTIVE")
            .GroupBy(m => m.ClassId)
            .Select(g => new { ClassId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ClassId, x => x.Count, cancellationToken);

        var dtos = pagedClasses.Select(c =>
        {
            var activeCount = memberCounts.GetValueOrDefault(c.Id, 0);
            return MapToSummaryDto(c, activeCount);
        }).ToList();

        return new PagedResponse<ClassSummaryDto>(dtos, totalItems, page, pageSize);
    }

    public async Task<ClassDetailDto> GetClassByIdAsync(Guid classId, CancellationToken cancellationToken = default)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();

        var classEntity = await _dbContext.TeachingClasses
            .AsNoTracking()
            .Include(c => c.Teacher)
            .Include(c => c.Course)
            .Include(c => c.Schedules)
            .FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);

        if (classEntity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy lớp học với mã định danh '{classId}'.");
        }

        if (!isAdmin && classEntity.TeacherId != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập thông tin lớp học này.");
        }

        var members = await _dbContext.TeachingClassMembers
            .AsNoTracking()
            .Where(m => m.ClassId == classId)
            .ToListAsync(cancellationToken);

        var totalMembers = members.Count;
        var activeMembers = members.Count(m => m.Status == "ACTIVE");
        var pausedMembers = members.Count(m => m.Status == "PAUSED");
        var droppedMembers = members.Count(m => m.Status == "DROPPED");

        var avgAttendance = activeMembers > 0
            ? members.Where(m => m.Status == "ACTIVE").Average(m => m.AttendanceRate)
            : 100.0;

        var (hskName, hskColor) = ResolveHskInfo(classEntity.HskLevelId);

        return new ClassDetailDto
        {
            ClassInfo = MapToTeachingClassDto(classEntity),
            HskLevelName = hskName,
            HskLevelColor = hskColor,
            CourseName = classEntity.Course?.Title,
            DerivedEnrollmentCount = activeMembers,
            DerivedAttendanceAverage = Math.Round(avgAttendance, 1),
            Schedules = classEntity.Schedules.Select(MapToScheduleDto).ToList(),
            MembersSummary = new ClassMembersSummaryDto
            {
                Total = totalMembers,
                Active = activeMembers,
                Paused = pausedMembers,
                Dropped = droppedMembers
            }
        };
    }

    public async Task<TeachingClassDto> CreateClassAsync(CreateTeachingClassDto dto, CancellationToken cancellationToken = default)
    {
        var (userId, _) = GetCurrentUserInfo();

        var normalizedCode = dto.Code.Trim();
        var codeExists = await _dbContext.TeachingClasses
            .AnyAsync(c => c.Code.ToLower() == normalizedCode.ToLower(), cancellationToken);

        if (codeExists)
        {
            throw new InvalidOperationException($"Mã lớp học '{dto.Code}' đã tồn tại trong hệ thống.");
        }

        ValidateSchedules(dto.Schedules);

        var classEntity = new TeachingClass
        {
            Id = Guid.NewGuid(),
            TeacherId = userId,
            Name = dto.Name.Trim(),
            Code = normalizedCode,
            Description = dto.Description?.Trim() ?? string.Empty,
            HskLevelId = dto.HskLevelId.Trim(),
            CourseId = dto.CourseId,
            Status = "UPCOMING",
            Capacity = dto.Capacity,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            LocationType = dto.LocationType.Trim().ToUpperInvariant(),
            MeetingUrl = string.IsNullOrWhiteSpace(dto.MeetingUrl) ? null : dto.MeetingUrl.Trim(),
            RoomLocation = string.IsNullOrWhiteSpace(dto.RoomLocation) ? null : dto.RoomLocation.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (dto.Schedules != null && dto.Schedules.Count > 0)
        {
            foreach (var s in dto.Schedules)
            {
                classEntity.Schedules.Add(new TeachingClassSchedule
                {
                    Id = Guid.NewGuid(),
                    ClassId = classEntity.Id,
                    DayOfWeek = s.DayOfWeek.Trim().ToUpperInvariant(),
                    StartTime = s.StartTime.Trim(),
                    EndTime = s.EndTime.Trim(),
                    Timezone = string.IsNullOrWhiteSpace(s.Timezone) ? "Asia/Ho_Chi_Minh" : s.Timezone.Trim(),
                    LocationType = string.IsNullOrWhiteSpace(s.LocationType) ? classEntity.LocationType : s.LocationType.Trim().ToUpperInvariant(),
                    MeetingUrl = string.IsNullOrWhiteSpace(s.MeetingUrl) ? classEntity.MeetingUrl : s.MeetingUrl.Trim(),
                    RoomLocation = string.IsNullOrWhiteSpace(s.RoomLocation) ? classEntity.RoomLocation : s.RoomLocation.Trim(),
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        _dbContext.TeachingClasses.Add(classEntity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Giáo viên {TeacherId} đã tạo thành công lớp học {ClassId} ({ClassCode})", userId, classEntity.Id, classEntity.Code);

        // Load teacher name for DTO without mutating entity tracking graph
        var teacherUser = await _dbContext.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.DisplayName, u.UserName })
            .FirstOrDefaultAsync(cancellationToken);
        var teacherName = string.IsNullOrWhiteSpace(teacherUser?.DisplayName)
            ? (teacherUser?.UserName ?? "Giáo viên")
            : teacherUser.DisplayName;

        return MapToTeachingClassDto(classEntity, teacherName);
    }

    public async Task<TeachingClassDto> UpdateClassAsync(Guid classId, UpdateTeachingClassDto dto, CancellationToken cancellationToken = default)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();

        var classEntity = await _dbContext.TeachingClasses
            .Include(c => c.Teacher)
            .Include(c => c.Course)
            .Include(c => c.Schedules)
            .FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);

        if (classEntity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy lớp học với mã định danh '{classId}'.");
        }

        if (!isAdmin && classEntity.TeacherId != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa thông tin lớp học này.");
        }

        classEntity.Name = dto.Name.Trim();
        classEntity.Description = dto.Description?.Trim() ?? string.Empty;
        classEntity.HskLevelId = dto.HskLevelId.Trim();
        classEntity.CourseId = dto.CourseId;
        classEntity.Capacity = dto.Capacity;
        classEntity.StartDate = dto.StartDate;
        classEntity.EndDate = dto.EndDate;
        classEntity.LocationType = dto.LocationType.Trim().ToUpperInvariant();
        classEntity.MeetingUrl = string.IsNullOrWhiteSpace(dto.MeetingUrl) ? null : dto.MeetingUrl.Trim();
        classEntity.RoomLocation = string.IsNullOrWhiteSpace(dto.RoomLocation) ? null : dto.RoomLocation.Trim();
        classEntity.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(dto.Status))
        {
            classEntity.Status = dto.Status.Trim().ToUpperInvariant();
        }

        if (dto.Schedules != null)
        {
            ValidateSchedules(dto.Schedules);

            await RemoveSchedulesAsync(classEntity, cancellationToken);

            foreach (var s in dto.Schedules)
            {
                _dbContext.TeachingClassSchedules.Add(new TeachingClassSchedule
                {
                    Id = Guid.NewGuid(),
                    ClassId = classEntity.Id,
                    DayOfWeek = s.DayOfWeek.Trim().ToUpperInvariant(),
                    StartTime = s.StartTime.Trim(),
                    EndTime = s.EndTime.Trim(),
                    Timezone = string.IsNullOrWhiteSpace(s.Timezone) ? "Asia/Ho_Chi_Minh" : s.Timezone.Trim(),
                    LocationType = string.IsNullOrWhiteSpace(s.LocationType) ? classEntity.LocationType : s.LocationType.Trim().ToUpperInvariant(),
                    MeetingUrl = string.IsNullOrWhiteSpace(s.MeetingUrl) ? classEntity.MeetingUrl : s.MeetingUrl.Trim(),
                    RoomLocation = string.IsNullOrWhiteSpace(s.RoomLocation) ? classEntity.RoomLocation : s.RoomLocation.Trim(),
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Lớp học {ClassId} ({ClassCode}) đã được cập nhật thành công.", classEntity.Id, classEntity.Code);

        return MapToTeachingClassDto(classEntity);
    }

    public async Task<bool> ArchiveClassAsync(Guid classId, CancellationToken cancellationToken = default)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();

        var classEntity = await _dbContext.TeachingClasses.FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);
        if (classEntity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy lớp học với mã định danh '{classId}'.");
        }

        if (!isAdmin && classEntity.TeacherId != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền lưu trữ lớp học này.");
        }

        classEntity.Status = "ARCHIVED";
        classEntity.IsArchived = true;
        classEntity.ArchivedAt = DateTime.UtcNow;
        classEntity.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Lớp học {ClassId} ({ClassCode}) đã được chuyển sang trạng thái lưu trữ (ARCHIVED).", classEntity.Id, classEntity.Code);

        return true;
    }

    public async Task<IReadOnlyList<ClassMemberViewDto>> GetClassMembersAsync(Guid classId, string? search = null, string? statusFilter = null, CancellationToken cancellationToken = default)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();

        var classEntity = await _dbContext.TeachingClasses
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);

        if (classEntity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy lớp học với mã định danh '{classId}'.");
        }

        if (!isAdmin && classEntity.TeacherId != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền xem danh sách thành viên lớp học này.");
        }

        IQueryable<TeachingClassMember> query = _dbContext.TeachingClassMembers
            .AsNoTracking()
            .Include(m => m.Student)
            .Where(m => m.ClassId == classId);

        if (!string.IsNullOrWhiteSpace(statusFilter) && !string.Equals(statusFilter, "ALL", StringComparison.OrdinalIgnoreCase))
        {
            var sUpper = statusFilter.Trim().ToUpperInvariant();
            query = query.Where(m => m.Status == sUpper);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(m =>
                (m.Student.DisplayName != null && m.Student.DisplayName.ToLower().Contains(s)) ||
                (m.Student.Email != null && m.Student.Email.ToLower().Contains(s)) ||
                (m.Student.UserName != null && m.Student.UserName.ToLower().Contains(s)));
        }

        var members = await query
            .OrderByDescending(m => m.EnrolledAt)
            .ToListAsync(cancellationToken);

        return members.Select(m => new ClassMemberViewDto
        {
            Id = m.Id,
            ClassId = m.ClassId,
            StudentId = m.StudentId,
            StudentName = string.IsNullOrWhiteSpace(m.Student.DisplayName) ? (m.Student.UserName ?? "Học viên") : m.Student.DisplayName,
            StudentEmail = m.Student.Email ?? string.Empty,
            StudentAvatarUrl = m.Student.AvatarUrl,
            EnrolledAt = m.EnrolledAt,
            Status = m.Status,
            AttendanceRate = m.AttendanceRate,
            CompletedAssignmentsCount = m.CompletedAssignmentsCount,
            Notes = m.Notes
        }).ToList();
    }

    public async Task<ClassMemberViewDto> AddMemberAsync(Guid classId, AddClassMemberDto dto, CancellationToken cancellationToken = default)
    {
        var classLock = _classEnrollmentLocks.GetOrAdd(classId, _ => new SemaphoreSlim(1, 1));
        await classLock.WaitAsync(cancellationToken);
        try
        {
            var strategy = _dbContext.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                var isRelational = false;
                try { isRelational = _dbContext.Database.IsRelational(); } catch { }

                await using var transaction = isRelational
                    ? await _dbContext.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable, cancellationToken)
                    : null;

                try
                {
                    var (userId, isAdmin) = GetCurrentUserInfo();

                    var classEntity = await _dbContext.TeachingClasses.FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);
                    if (classEntity == null)
                    {
                        throw new KeyNotFoundException($"Không tìm thấy lớp học với mã định danh '{classId}'.");
                    }

                    if (!isAdmin && classEntity.TeacherId != userId)
                    {
                        throw new UnauthorizedAccessException("Bạn không có quyền quản lý thành viên lớp học này.");
                    }

                    // Check class status: do not allow enrollment into ARCHIVED or COMPLETED classes
                    if (classEntity.IsArchived || string.Equals(classEntity.Status, "ARCHIVED", StringComparison.OrdinalIgnoreCase) || string.Equals(classEntity.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                    {
                        throw new InvalidOperationException("Không thể ghi danh vào lớp học đã kết thúc hoặc đã lưu trữ.");
                    }

                    // Capacity check inside serialized critical section
                    var activeCount = await _dbContext.TeachingClassMembers
                        .CountAsync(m => m.ClassId == classId && m.Status == "ACTIVE", cancellationToken);

                    if (activeCount >= classEntity.Capacity)
                    {
                        throw new InvalidOperationException($"Lớp học đã đạt sĩ số tối đa ({classEntity.Capacity} học viên).");
                    }

                    // Find student account
                    var identifier = dto.StudentIdentifier.Trim();
                    Guid? parsedGuid = Guid.TryParse(identifier, out var g) ? g : null;

                    var student = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u =>
                        (parsedGuid.HasValue && u.Id == parsedGuid.Value) ||
                        (u.Email != null && u.Email.ToLower() == identifier.ToLower()) ||
                        (u.UserName != null && u.UserName.ToLower() == identifier.ToLower()), cancellationToken);

                    if (student == null)
                    {
                        throw new KeyNotFoundException($"Không tìm thấy tài khoản học viên với thông tin '{dto.StudentIdentifier}'.");
                    }

                    // Role verification: Only accounts with STUDENT role can be enrolled
                    var isStudent = await (from ur in _dbContext.UserRoles
                                           join r in _dbContext.Roles on ur.RoleId equals r.Id
                                           where ur.UserId == student.Id && (r.NormalizedName == "STUDENT" || r.Name == "STUDENT")
                                           select ur).AnyAsync(cancellationToken);

                    if (!isStudent)
                    {
                        throw new InvalidOperationException($"Tài khoản '{student.UserName}' không phải là học viên (yêu cầu vai trò STUDENT).");
                    }

                    // Check duplicate enrollment
                    var existingMember = await _dbContext.TeachingClassMembers
                        .FirstOrDefaultAsync(m => m.ClassId == classId && m.StudentId == student.Id, cancellationToken);

                    if (existingMember != null)
                    {
                        if (existingMember.Status == "ACTIVE")
                        {
                            throw new InvalidOperationException($"Học viên '{student.DisplayName ?? student.UserName}' đã là thành viên chính thức của lớp học.");
                        }

                        // Reactivate dropped or paused member
                        existingMember.Status = "ACTIVE";
                        existingMember.EnrolledAt = DateTime.UtcNow;
                        if (!string.IsNullOrWhiteSpace(dto.Notes))
                        {
                            existingMember.Notes = dto.Notes.Trim();
                        }

                        await _dbContext.SaveChangesAsync(cancellationToken);
                        if (transaction != null) await transaction.CommitAsync(cancellationToken);
                        _logger.LogInformation("Kích hoạt lại học viên {StudentId} vào lớp {ClassId}", student.Id, classId);

                        return new ClassMemberViewDto
                        {
                            Id = existingMember.Id,
                            ClassId = existingMember.ClassId,
                            StudentId = existingMember.StudentId,
                            StudentName = string.IsNullOrWhiteSpace(student.DisplayName) ? (student.UserName ?? "Học viên") : student.DisplayName,
                            StudentEmail = student.Email ?? string.Empty,
                            StudentAvatarUrl = student.AvatarUrl,
                            EnrolledAt = existingMember.EnrolledAt,
                            Status = existingMember.Status,
                            AttendanceRate = existingMember.AttendanceRate,
                            CompletedAssignmentsCount = existingMember.CompletedAssignmentsCount,
                            Notes = existingMember.Notes
                        };
                    }

                    var newMember = new TeachingClassMember
                    {
                        Id = Guid.NewGuid(),
                        ClassId = classId,
                        StudentId = student.Id,
                        EnrolledAt = DateTime.UtcNow,
                        Status = "ACTIVE",
                        AttendanceRate = 100.0,
                        CompletedAssignmentsCount = 0,
                        Notes = dto.Notes?.Trim()
                    };

                    _dbContext.TeachingClassMembers.Add(newMember);
                    await _dbContext.SaveChangesAsync(cancellationToken);
                    if (transaction != null) await transaction.CommitAsync(cancellationToken);

                    _logger.LogInformation("Thêm thành công học viên {StudentId} vào lớp {ClassId}", student.Id, classId);

                    return new ClassMemberViewDto
                    {
                        Id = newMember.Id,
                        ClassId = newMember.ClassId,
                        StudentId = newMember.StudentId,
                        StudentName = string.IsNullOrWhiteSpace(student.DisplayName) ? (student.UserName ?? "Học viên") : student.DisplayName,
                        StudentEmail = student.Email ?? string.Empty,
                        StudentAvatarUrl = student.AvatarUrl,
                        EnrolledAt = newMember.EnrolledAt,
                        Status = newMember.Status,
                        AttendanceRate = newMember.AttendanceRate,
                        CompletedAssignmentsCount = newMember.CompletedAssignmentsCount,
                        Notes = newMember.Notes
                    };
                }
                catch
                {
                    if (transaction != null) await transaction.RollbackAsync(cancellationToken);
                    throw;
                }
            });
        }
        finally
        {
            classLock.Release();
        }
    }

    public async Task<bool> RemoveMemberAsync(Guid classId, Guid studentId, CancellationToken cancellationToken = default)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();

        var classEntity = await _dbContext.TeachingClasses.FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);
        if (classEntity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy lớp học với mã định danh '{classId}'.");
        }

        if (!isAdmin && classEntity.TeacherId != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền quản lý thành viên lớp học này.");
        }

        var member = await _dbContext.TeachingClassMembers
            .FirstOrDefaultAsync(m => m.ClassId == classId && m.StudentId == studentId, cancellationToken);

        if (member == null)
        {
            throw new KeyNotFoundException("Không tìm thấy học viên tương ứng trong lớp học này.");
        }

        _dbContext.TeachingClassMembers.Remove(member);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Đã xóa học viên {StudentId} khỏi lớp {ClassId}", studentId, classId);
        return true;
    }

    public async Task<IReadOnlyList<ClassScheduleDto>> GetClassSchedulesAsync(Guid classId, CancellationToken cancellationToken = default)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();

        var classEntity = await _dbContext.TeachingClasses
            .AsNoTracking()
            .Include(c => c.Schedules)
            .FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);

        if (classEntity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy lớp học với mã định danh '{classId}'.");
        }

        if (!isAdmin && classEntity.TeacherId != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền xem thời khóa biểu lớp học này.");
        }

        return classEntity.Schedules.Select(MapToScheduleDto).ToList();
    }

    public async Task<IReadOnlyList<ClassScheduleDto>> UpdateClassSchedulesAsync(Guid classId, List<ClassScheduleDto> schedules, CancellationToken cancellationToken = default)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();

        var classEntity = await _dbContext.TeachingClasses
            .Include(c => c.Schedules)
            .FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);

        if (classEntity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy lớp học với mã định danh '{classId}'.");
        }

        if (!isAdmin && classEntity.TeacherId != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền cập nhật lịch học lớp này.");
        }

        ValidateSchedules(schedules);

        await RemoveSchedulesAsync(classEntity, cancellationToken);

        if (schedules != null)
        {
            foreach (var s in schedules)
            {
                _dbContext.TeachingClassSchedules.Add(new TeachingClassSchedule
                {
                    Id = Guid.NewGuid(),
                    ClassId = classEntity.Id,
                    DayOfWeek = s.DayOfWeek.Trim().ToUpperInvariant(),
                    StartTime = s.StartTime.Trim(),
                    EndTime = s.EndTime.Trim(),
                    Timezone = string.IsNullOrWhiteSpace(s.Timezone) ? "Asia/Ho_Chi_Minh" : s.Timezone.Trim(),
                    LocationType = string.IsNullOrWhiteSpace(s.LocationType) ? classEntity.LocationType : s.LocationType.Trim().ToUpperInvariant(),
                    MeetingUrl = string.IsNullOrWhiteSpace(s.MeetingUrl) ? classEntity.MeetingUrl : s.MeetingUrl.Trim(),
                    RoomLocation = string.IsNullOrWhiteSpace(s.RoomLocation) ? classEntity.RoomLocation : s.RoomLocation.Trim(),
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        classEntity.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Đã cập nhật {Count} buổi học cho lớp {ClassId}", classEntity.Schedules.Count, classId);
        return classEntity.Schedules.Select(MapToScheduleDto).ToList();
    }

    private async Task RemoveSchedulesAsync(TeachingClass classEntity, CancellationToken cancellationToken)
    {
        var scheduleIds = classEntity.Schedules.Select(schedule => schedule.Id).ToList();
        if (scheduleIds.Count == 0) return;

        await _dbContext.TeachingClassAttendances
            .Where(attendance => attendance.ScheduleId.HasValue && scheduleIds.Contains(attendance.ScheduleId.Value))
            .LoadAsync(cancellationToken);
        _dbContext.TeachingClassSchedules.RemoveRange(classEntity.Schedules);
        classEntity.Schedules.Clear();
    }

    public async Task<TeacherDashboardDto> GetDashboardAsync(CancellationToken cancellationToken = default)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();

        var teacherUser = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        var teacherName = string.IsNullOrWhiteSpace(teacherUser?.DisplayName) ? (teacherUser?.UserName ?? "Giáo viên") : teacherUser.DisplayName;
        var teacherEmail = teacherUser?.Email ?? string.Empty;

        // Query active classes
        IQueryable<TeachingClass> classQuery = _dbContext.TeachingClasses
            .AsNoTracking()
            .Include(c => c.Course)
            .Include(c => c.Schedules)
            .Where(c => !c.IsArchived && c.Status == "ACTIVE");

        if (!isAdmin)
        {
            classQuery = classQuery.Where(c => c.TeacherId == userId);
        }

        var activeClasses = await classQuery.ToListAsync(cancellationToken);
        var activeClassIds = activeClasses.Select(c => c.Id).ToList();

        // Count enrolled students across active classes
        var memberCounts = await _dbContext.TeachingClassMembers
            .AsNoTracking()
            .Where(m => activeClassIds.Contains(m.ClassId) && m.Status == "ACTIVE")
            .GroupBy(m => m.ClassId)
            .Select(g => new { ClassId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ClassId, x => x.Count, cancellationToken);

        var totalEnrolledStudents = memberCounts.Values.Sum();

        // Calculate weekly teaching hours
        double weeklyHours = 0;
        foreach (var cls in activeClasses)
        {
            foreach (var sch in cls.Schedules)
            {
                if (TimeSpan.TryParse(sch.StartTime, out var startTs) && TimeSpan.TryParse(sch.EndTime, out var endTs))
                {
                    var diff = (endTs - startTs).TotalHours;
                    if (diff > 0) weeklyHours += diff;
                }
            }
        }

        // Build upcoming sessions
        var upcomingSessions = BuildUpcomingSessions(activeClasses, memberCounts);

        // Active class summaries
        var activeSummaries = activeClasses.Select(c => MapToSummaryDto(c, memberCounts.GetValueOrDefault(c.Id, 0))).ToList();

        // Default quick actions
        var quickActions = new List<TeacherQuickActionDto>
        {
            new() { Id = "qa-create-class", Label = "Tạo lớp học mới", Description = "Mở khóa học mới theo chuẩn HSK", Path = "/management/teacher/classes?action=create", IconName = "classes" },
            new() { Id = "qa-curriculum", Label = "Giáo trình giảng dạy", Description = "Xem bài học, từ vựng và ngữ pháp", Path = "/management/content/courses", IconName = "curriculum" },
            new() { Id = "qa-questions", Label = "Ngân hàng đề thi", Description = "Soạn câu hỏi và tạo đề luyện tập", Path = "/management/questions", IconName = "questions" },
            new() { Id = "qa-submissions", Label = "Chấm bài tập về nhà", Description = "Xem bài nộp của học viên", Path = "/management/teacher/assignments", IconName = "submissions" }
        };

        // Query pending submissions
        IQueryable<StudentAssignmentSubmission> pendingQuery = _dbContext.StudentAssignmentSubmissions
            .AsNoTracking()
            .Include(s => s.Student)
            .Include(s => s.Assignment)
            .Include(s => s.TeachingClass)
            .Where(s => s.Status == "SUBMITTED" || s.Status == "GRADING");

        if (!isAdmin)
        {
            pendingQuery = pendingQuery.Where(s => s.Assignment.TeacherId == userId);
        }

        var pendingCount = await pendingQuery.CountAsync(cancellationToken);
        var pendingList = await pendingQuery
            .OrderByDescending(s => s.SubmittedAt ?? s.CreatedAt)
            .Take(5)
            .ToListAsync(cancellationToken);

        var pendingSubmissions = pendingList.Select(s =>
        {
            var studentName = string.IsNullOrWhiteSpace(s.Student?.DisplayName)
                ? (s.Student?.UserName ?? "Học viên")
                : s.Student.DisplayName;

            return new DemoSubmissionItemDto
            {
                Id = s.Id.ToString(),
                AssignmentTitle = s.Assignment.Title,
                ClassId = s.ClassId.ToString(),
                ClassName = s.TeachingClass?.Name ?? "Lớp học",
                StudentId = s.StudentId.ToString(),
                StudentName = studentName,
                StudentAvatarUrl = s.Student?.AvatarUrl,
                SubmittedAt = (s.SubmittedAt ?? s.CreatedAt).ToString("yyyy-MM-dd HH:mm"),
                SubmittedTimeAgo = FormatTimeAgo(s.SubmittedAt ?? s.CreatedAt),
                Status = s.Status,
                Score = s.Score
            };
        }).ToList();

        var recentActivities = pendingList.Select(s => new RecentClassActivityDto
        {
            Id = $"act-sub-{s.Id}",
            Timestamp = (s.SubmittedAt ?? s.CreatedAt).ToString("yyyy-MM-dd HH:mm"),
            TimeAgo = FormatTimeAgo(s.SubmittedAt ?? s.CreatedAt),
            Type = "SUBMISSION",
            Title = "Bài nộp mới",
            Description = $"{(string.IsNullOrWhiteSpace(s.Student?.DisplayName) ? (s.Student?.UserName ?? "Học viên") : s.Student.DisplayName)} đã nộp bài '{s.Assignment.Title}'",
            ClassId = s.ClassId.ToString()
        }).ToList();

        return new TeacherDashboardDto
        {
            TeacherId = userId,
            TeacherName = teacherName,
            TeacherEmail = teacherEmail,
            Metrics = new TeacherKpiMetricsDto
            {
                ActiveClassesCount = activeClasses.Count,
                TotalEnrolledStudents = totalEnrolledStudents,
                PendingSubmissionsCount = pendingCount,
                WeeklyTeachingHours = Math.Round(weeklyHours, 1)
            },
            UpcomingSessions = upcomingSessions,
            ActiveClasses = activeSummaries,
            PendingSubmissions = pendingSubmissions,
            RecentActivities = recentActivities,
            QuickActions = quickActions
        };
    }

    public async Task<TeacherClassStatsDto> GetClassStatsAsync(CancellationToken cancellationToken = default)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();

        IQueryable<TeachingClass> baseQuery = _dbContext.TeachingClasses.AsNoTracking();
        if (!isAdmin)
        {
            baseQuery = baseQuery.Where(c => c.TeacherId == userId);
        }

        var totalClasses = await baseQuery.CountAsync(cancellationToken);
        var activeCount = await baseQuery.CountAsync(c => c.Status == "ACTIVE" && !c.IsArchived, cancellationToken);
        var upcomingCount = await baseQuery.CountAsync(c => c.Status == "UPCOMING" && !c.IsArchived, cancellationToken);
        var archivedCount = await baseQuery.CountAsync(c => c.IsArchived || c.Status == "ARCHIVED", cancellationToken);

        var classIds = baseQuery.Select(c => c.Id);
        var totalStudents = await _dbContext.TeachingClassMembers
            .AsNoTracking()
            .Where(m => classIds.Contains(m.ClassId) && m.Status == "ACTIVE")
            .CountAsync(cancellationToken);

        return new TeacherClassStatsDto
        {
            TotalClasses = totalClasses,
            ActiveCount = activeCount,
            UpcomingCount = upcomingCount,
            ArchivedCount = archivedCount,
            TotalStudents = totalStudents
        };
    }

    public async Task<IReadOnlyList<StudentEnrolledClassDto>> GetMyEnrolledClassesAsync(CancellationToken cancellationToken = default)
    {
        if (!_currentUserService.IsAuthenticated || !_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedAccessException("Người dùng chưa được xác thực.");
        }

        var studentId = _currentUserService.UserId.Value;

        var enrolled = await _dbContext.TeachingClassMembers
            .AsNoTracking()
            .Include(m => m.TeachingClass)
                .ThenInclude(c => c.Teacher)
            .Where(m => m.StudentId == studentId && m.Status == "ACTIVE" && !m.TeachingClass.IsArchived)
            .OrderByDescending(m => m.EnrolledAt)
            .Select(m => new StudentEnrolledClassDto
            {
                Id = m.TeachingClass.Id,
                Name = m.TeachingClass.Name,
                Code = m.TeachingClass.Code,
                HskLevelId = m.TeachingClass.HskLevelId,
                TeacherName = m.TeachingClass.Teacher != null
                    ? (string.IsNullOrWhiteSpace(m.TeachingClass.Teacher.DisplayName) ? (m.TeachingClass.Teacher.UserName ?? "Giáo viên") : m.TeachingClass.Teacher.DisplayName)
                    : "Giáo viên",
                StartDate = m.TeachingClass.StartDate,
                LocationType = m.TeachingClass.LocationType,
                Status = m.TeachingClass.Status,
                EnrolledAt = m.EnrolledAt
            })
            .ToListAsync(cancellationToken);

        return enrolled;
    }

    public async Task<ClassCurriculumDto> GetClassCurriculumAsync(Guid classId, CancellationToken cancellationToken = default)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        var cls = await _dbContext.TeachingClasses
            .AsNoTracking()
            .Include(c => c.Course)
            .FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);

        if (cls == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy lớp học với mã '{classId}'.");
        }

        if (!isAdmin && cls.TeacherId != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền xem giáo trình của lớp học này.");
        }

        var result = new ClassCurriculumDto
        {
            ClassId = cls.Id,
            ClassName = cls.Name,
            CourseId = cls.CourseId,
            CourseTitle = cls.Course?.Title,
            HskLevelId = cls.HskLevelId,
            Units = new List<ClassCurriculumUnitDto>()
        };

        if (cls.CourseId.HasValue)
        {
            var units = await _dbContext.Units
                .AsNoTracking()
                .Include(u => u.Lessons.OrderBy(l => l.LessonNumber))
                .Where(u => u.CourseId == cls.CourseId.Value)
                .OrderBy(u => u.UnitNumber)
                .ToListAsync(cancellationToken);

            result.Units = units.Select(u => new ClassCurriculumUnitDto
            {
                Id = u.Id,
                UnitNumber = u.UnitNumber,
                Title = string.IsNullOrWhiteSpace(u.TitleVi) ? u.TitleZh : $"{u.TitleZh} - {u.TitleVi}",
                Lessons = u.Lessons.Select(l => new ClassCurriculumLessonDto
                {
                    Id = l.Id,
                    LessonNumber = l.LessonNumber,
                    Title = l.TitleZh,
                    PinyinTitle = l.Pinyin ?? string.Empty,
                    VietnameseTitle = l.TitleVi,
                    IsPublished = l.Status == "PUBLISHED"
                }).ToList()
            }).ToList();
        }

        return result;
    }

    public async Task<bool> SetClassCurriculumAsync(Guid classId, SetClassCurriculumDto dto, CancellationToken cancellationToken = default)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        var cls = await _dbContext.TeachingClasses
            .FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);

        if (cls == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy lớp học với mã '{classId}'.");
        }

        if (!isAdmin && cls.TeacherId != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền cập nhật giáo trình của lớp học này.");
        }

        var courseExists = await _dbContext.Courses
            .AnyAsync(c => c.Id == dto.CourseId, cancellationToken);

        if (!courseExists)
        {
            throw new KeyNotFoundException($"Không tìm thấy khóa học với mã '{dto.CourseId}'.");
        }

        cls.CourseId = dto.CourseId;
        cls.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<ClassPerformanceDto> GetClassPerformanceAsync(Guid classId, CancellationToken cancellationToken = default)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        var cls = await _dbContext.TeachingClasses
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);

        if (cls == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy lớp học với mã '{classId}'.");
        }

        if (!isAdmin && cls.TeacherId != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền xem thống kê của lớp học này.");
        }

        var members = await _dbContext.TeachingClassMembers
            .AsNoTracking()
            .Include(m => m.Student)
            .Where(m => m.ClassId == classId && m.Status == "ACTIVE")
            .ToListAsync(cancellationToken);

        var totalStudents = members.Count;
        var avgAttendance = totalStudents > 0 ? members.Average(m => m.AttendanceRate) : 0.0;

        var targetAssignmentIds = await _dbContext.AssignmentTargets
            .AsNoTracking()
            .Where(t => t.ClassId == classId)
            .Select(t => t.AssignmentId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var totalAssignmentsAssigned = targetAssignmentIds.Count;

        var studentIds = members.Select(m => m.StudentId).ToList();
        var submissions = await _dbContext.StudentAssignmentSubmissions
            .AsNoTracking()
            .Where(s => targetAssignmentIds.Contains(s.AssignmentId) && studentIds.Contains(s.StudentId))
            .ToListAsync(cancellationToken);

        var studentSubmissions = submissions
            .GroupBy(s => s.StudentId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var studentSummaries = new List<StudentPerformanceSummaryDto>();
        var allScores = new List<double>();
        var gradeDist = new GradeDistributionDto();

        foreach (var member in members)
        {
            studentSubmissions.TryGetValue(member.StudentId, out var subList);
            subList ??= new List<StudentAssignmentSubmission>();

            var completedCount = subList
                .Where(s => s.Status == "SUBMITTED" || s.Status == "GRADED")
                .Select(s => s.AssignmentId)
                .Distinct()
                .Count();

            var validScores = subList
                .Where(s => s.Status == "SUBMITTED" || s.Status == "GRADED")
                .GroupBy(s => s.AssignmentId)
                .Select(g => g.OrderByDescending(s => s.AttemptNumber).First().Score)
                .ToList();

            var avgScore = validScores.Count > 0 ? Math.Round(validScores.Average(), 1) : 0.0;
            if (validScores.Count > 0)
            {
                allScores.Add(avgScore);
                if (avgScore >= 85) gradeDist.ExcellentCount++;
                else if (avgScore >= 70) gradeDist.GoodCount++;
                else if (avgScore >= 50) gradeDist.AverageCount++;
                else gradeDist.PoorCount++;
            }

            var studentName = string.IsNullOrWhiteSpace(member.Student?.DisplayName)
                ? (member.Student?.UserName ?? "Học viên")
                : member.Student.DisplayName;

            studentSummaries.Add(new StudentPerformanceSummaryDto
            {
                StudentId = member.StudentId,
                StudentName = studentName,
                StudentEmail = member.Student?.Email ?? string.Empty,
                StudentAvatarUrl = member.Student?.AvatarUrl,
                AttendanceRate = Math.Round(member.AttendanceRate, 1),
                AssignmentsCompleted = completedCount,
                TotalAssignments = totalAssignmentsAssigned,
                AverageScore = avgScore,
                Status = member.Status
            });
        }

        var avgAssignmentScore = allScores.Count > 0 ? Math.Round(allScores.Average(), 1) : 0.0;
        var totalPossibleSubmissions = totalStudents * totalAssignmentsAssigned;
        var totalActualCompleted = studentSummaries.Sum(s => s.AssignmentsCompleted);
        var submissionRate = totalPossibleSubmissions > 0
            ? Math.Round((double)totalActualCompleted / totalPossibleSubmissions * 100.0, 1)
            : 0.0;

        return new ClassPerformanceDto
        {
            ClassId = cls.Id,
            ClassName = cls.Name,
            ClassCode = cls.Code,
            TotalStudents = totalStudents,
            AverageAttendanceRate = Math.Round(avgAttendance, 1),
            TotalAssignmentsAssigned = totalAssignmentsAssigned,
            AverageAssignmentScore = avgAssignmentScore,
            SubmissionRate = submissionRate,
            GradeDistribution = gradeDist,
            StudentSummaries = studentSummaries.OrderByDescending(s => s.AverageScore).ToList()
        };
    }

    private static string FormatTimeAgo(DateTime dt)
    {
        var diff = DateTime.UtcNow - dt;
        if (diff.TotalMinutes < 1) return "Vừa xong";
        if (diff.TotalMinutes < 60) return $"{(int)diff.TotalMinutes} phút trước";
        if (diff.TotalHours < 24) return $"{(int)diff.TotalHours} giờ trước";
        return $"{(int)diff.TotalDays} ngày trước";
    }

    public async Task<StudentEnrolledClassDto?> GetMyEnrolledClassByIdAsync(Guid classId, CancellationToken cancellationToken = default)
    {
        if (!_currentUserService.IsAuthenticated || !_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedAccessException("Người dùng chưa được xác thực.");
        }

        var studentId = _currentUserService.UserId.Value;

        var member = await _dbContext.TeachingClassMembers
            .AsNoTracking()
            .Include(m => m.TeachingClass)
                .ThenInclude(c => c.Teacher)
            .Include(m => m.TeachingClass.Schedules)
            .FirstOrDefaultAsync(m => m.ClassId == classId && m.StudentId == studentId && m.Status == "ACTIVE" && !m.TeachingClass.IsArchived, cancellationToken);

        if (member == null || member.TeachingClass == null)
        {
            return null;
        }

        var c = member.TeachingClass;
        var schedulesSummary = "Chưa xếp lịch";
        if (c.Schedules != null && c.Schedules.Count > 0)
        {
            var orderedSchedules = c.Schedules.OrderBy(s => s.DayOfWeek).ToList();
            var days = string.Join(", ", orderedSchedules.Select(s => FormatDayShort(s.DayOfWeek)));
            var first = orderedSchedules[0];
            schedulesSummary = $"{days} ({first.StartTime} - {first.EndTime})";
        }

        return new StudentEnrolledClassDto
        {
            Id = c.Id,
            Name = c.Name,
            Code = c.Code,
            HskLevelId = c.HskLevelId,
            TeacherName = c.Teacher != null
                ? (string.IsNullOrWhiteSpace(c.Teacher.DisplayName) ? (c.Teacher.UserName ?? "Giáo viên") : c.Teacher.DisplayName)
                : "Giáo viên",
            StartDate = c.StartDate,
            LocationType = c.LocationType,
            Status = c.Status,
            SchedulesSummary = schedulesSummary,
            EnrolledAt = member.EnrolledAt
        };
    }

    private static DayOfWeek ParseDayOfWeek(string day)
    {
        return day.ToUpperInvariant() switch
        {
            "MONDAY" => DayOfWeek.Monday,
            "TUESDAY" => DayOfWeek.Tuesday,
            "WEDNESDAY" => DayOfWeek.Wednesday,
            "THURSDAY" => DayOfWeek.Thursday,
            "FRIDAY" => DayOfWeek.Friday,
            "SATURDAY" => DayOfWeek.Saturday,
            "SUNDAY" => DayOfWeek.Sunday,
            _ => DayOfWeek.Monday
        };
    }

    private List<UpcomingTeachingSessionDto> BuildUpcomingSessions(List<TeachingClass> activeClasses, Dictionary<Guid, int> memberCounts)
    {
        var list = new List<(DateTime StartDateTime, UpcomingTeachingSessionDto Dto)>();

        TimeZoneInfo tz;
        try
        {
            tz = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
        }
        catch
        {
            try
            {
                tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
            }
            catch
            {
                tz = TimeZoneInfo.Local;
            }
        }
        var localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);

        foreach (var cls in activeClasses)
        {
            var (hskName, hskColor) = ResolveHskInfo(cls.HskLevelId);
            var studentCount = memberCounts.GetValueOrDefault(cls.Id, 0);

            foreach (var sch in cls.Schedules)
            {
                if (!TimeSpan.TryParse(sch.StartTime, out var startTs) || !TimeSpan.TryParse(sch.EndTime, out var endTs))
                {
                    continue;
                }

                var targetDay = ParseDayOfWeek(sch.DayOfWeek);
                int daysAhead = ((int)targetDay - (int)localNow.DayOfWeek + 7) % 7;

                if (daysAhead == 0 && localNow.TimeOfDay > endTs)
                {
                    daysAhead = 7;
                }

                var sessionDate = localNow.Date.AddDays(daysAhead);
                var sessionStartDateTime = sessionDate.Add(startTs);
                bool isToday = (sessionDate == localNow.Date);
                bool isTomorrow = (sessionDate == localNow.Date.AddDays(1));

                string dayText = isToday ? "Hôm nay" : (isTomorrow ? "Ngày mai" : FormatDayOfWeek(sch.DayOfWeek, false));

                var dto = new UpcomingTeachingSessionDto
                {
                    Id = $"session-{sch.Id}",
                    ClassId = cls.Id,
                    ClassName = cls.Name,
                    ClassCode = cls.Code,
                    HskLevelName = hskName,
                    HskLevelColor = hskColor,
                    DayOfWeekText = dayText,
                    DateFormatted = sessionDate.ToString("dd/MM/yyyy"),
                    TimeRange = $"{sch.StartTime} – {sch.EndTime}",
                    LocationType = sch.LocationType,
                    MeetingUrl = sch.MeetingUrl ?? cls.MeetingUrl,
                    RoomLocation = sch.RoomLocation ?? cls.RoomLocation,
                    EnrolledStudentsCount = studentCount,
                    LessonTopicPreview = $"Lớp {cls.Code}: Giảng dạy chuẩn {hskName}",
                    IsToday = isToday
                };

                list.Add((sessionStartDateTime, dto));
            }
        }

        return list.OrderBy(x => x.StartDateTime).Take(5).Select(x => x.Dto).ToList();
    }

    private static readonly Regex TimeFormatRegex = new(@"^([01][0-9]|2[0-3]):[0-5][0-9]$", RegexOptions.Compiled);
    private static readonly HashSet<string> ValidDaysOfWeek = new(StringComparer.OrdinalIgnoreCase)
    {
        "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"
    };

    private static void ValidateSchedules(IEnumerable<ClassScheduleDto>? schedules)
    {
        if (schedules == null) return;
        var scheduleList = schedules.ToList();
        if (scheduleList.Count == 0) return;

        foreach (var s in scheduleList)
        {
            if (string.IsNullOrWhiteSpace(s.DayOfWeek) || !ValidDaysOfWeek.Contains(s.DayOfWeek.Trim()))
            {
                throw new ArgumentException($"Ngày trong tuần '{s.DayOfWeek}' không hợp lệ (yêu cầu từ MONDAY đến SUNDAY).");
            }

            if (string.IsNullOrWhiteSpace(s.StartTime) || !TimeFormatRegex.IsMatch(s.StartTime.Trim()))
            {
                throw new ArgumentException($"Định dạng giờ bắt đầu '{s.StartTime}' không hợp lệ (yêu cầu định dạng HH:mm, ví dụ 19:00).");
            }

            if (string.IsNullOrWhiteSpace(s.EndTime) || !TimeFormatRegex.IsMatch(s.EndTime.Trim()))
            {
                throw new ArgumentException($"Định dạng giờ kết thúc '{s.EndTime}' không hợp lệ (yêu cầu định dạng HH:mm, ví dụ 20:30).");
            }

            var startTs = TimeSpan.Parse(s.StartTime.Trim());
            var endTs = TimeSpan.Parse(s.EndTime.Trim());

            if (startTs >= endTs)
            {
                throw new ArgumentException($"Khung giờ không hợp lệ ({s.StartTime} - {s.EndTime}): Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
            }
        }

        // Overlap detection on same day
        var dayGroups = scheduleList.GroupBy(s => s.DayOfWeek.Trim().ToUpperInvariant());
        foreach (var group in dayGroups)
        {
            var sorted = group.OrderBy(s => TimeSpan.Parse(s.StartTime.Trim())).ToList();
            for (int i = 0; i < sorted.Count - 1; i++)
            {
                var curEnd = TimeSpan.Parse(sorted[i].EndTime.Trim());
                var nextStart = TimeSpan.Parse(sorted[i + 1].StartTime.Trim());

                // Overlap occurs strictly when curEnd > nextStart
                if (curEnd > nextStart)
                {
                    throw new ArgumentException($"Khung giờ học trên cùng ngày {group.Key} bị trùng lặp: Buổi học {sorted[i].StartTime}–{sorted[i].EndTime} đè lên buổi học {sorted[i + 1].StartTime}–{sorted[i + 1].EndTime}.");
                }
            }
        }
    }

    private static (string Name, string Color) ResolveHskInfo(string hskLevelId)
    {
        return hskLevelId switch
        {
            "level-hsk-1" => ("HSK 1", "#059669"),
            "level-hsk-2" => ("HSK 2", "#0284c7"),
            "level-hsk-3" => ("HSK 3", "#4338ca"),
            "level-hsk-4" => ("HSK 4", "#7c3aed"),
            "level-hsk-5" => ("HSK 5", "#db2777"),
            "level-hsk-6" => ("HSK 6", "#dc2626"),
            "level-hsk-79" => ("HSK 7-9", "#b45309"),
            _ => (hskLevelId, "#4338ca")
        };
    }

    private static string FormatDayOfWeek(string dayOfWeek, bool isToday)
    {
        if (isToday) return "Hôm nay";
        return dayOfWeek.ToUpperInvariant() switch
        {
            "MONDAY" => "Thứ Hai",
            "TUESDAY" => "Thứ Ba",
            "WEDNESDAY" => "Thứ Tư",
            "THURSDAY" => "Thứ Năm",
            "FRIDAY" => "Thứ Sáu",
            "SATURDAY" => "Thứ Bảy",
            "SUNDAY" => "Chủ Nhật",
            _ => dayOfWeek
        };
    }

    private static string FormatDayShort(string dayOfWeek)
    {
        return dayOfWeek.ToUpperInvariant() switch
        {
            "MONDAY" => "T2",
            "TUESDAY" => "T3",
            "WEDNESDAY" => "T4",
            "THURSDAY" => "T5",
            "FRIDAY" => "T6",
            "SATURDAY" => "T7",
            "SUNDAY" => "CN",
            _ => dayOfWeek
        };
    }

    private static ClassSummaryDto MapToSummaryDto(TeachingClass c, int activeEnrollment)
    {
        var (hskName, hskColor) = ResolveHskInfo(c.HskLevelId);

        var schedulesSummary = "Chưa xếp lịch";
        string? nextSession = null;

        if (c.Schedules != null && c.Schedules.Count > 0)
        {
            var orderedSchedules = c.Schedules.OrderBy(s => s.DayOfWeek).ToList();
            var days = string.Join(", ", orderedSchedules.Select(s => FormatDayShort(s.DayOfWeek)));
            var first = orderedSchedules[0];
            schedulesSummary = $"{days} ({first.StartTime} - {first.EndTime})";
            nextSession = $"{FormatDayOfWeek(first.DayOfWeek, false)}, {first.StartTime}";
        }

        return new ClassSummaryDto
        {
            Id = c.Id,
            Name = c.Name,
            Code = c.Code,
            Description = c.Description,
            HskLevelId = c.HskLevelId,
            HskLevelName = hskName,
            HskLevelColor = hskColor,
            CourseId = c.CourseId,
            CourseName = c.Course?.Title,
            Status = c.Status,
            Capacity = c.Capacity,
            DerivedEnrollmentCount = activeEnrollment,
            StartDate = c.StartDate,
            EndDate = c.EndDate,
            LocationType = c.LocationType,
            MeetingUrl = c.MeetingUrl,
            RoomLocation = c.RoomLocation,
            SchedulesSummary = schedulesSummary,
            NextSessionText = nextSession
        };
    }

    private static TeachingClassDto MapToTeachingClassDto(TeachingClass c, string? overrideTeacherName = null)
    {
        var teacherName = overrideTeacherName ?? (string.IsNullOrWhiteSpace(c.Teacher?.DisplayName)
            ? (c.Teacher?.UserName ?? "Giáo viên")
            : c.Teacher.DisplayName);

        return new TeachingClassDto
        {
            Id = c.Id,
            TeacherId = c.TeacherId,
            TeacherName = teacherName,
            Name = c.Name,
            Code = c.Code,
            Description = c.Description,
            HskLevelId = c.HskLevelId,
            CourseId = c.CourseId,
            CourseName = c.Course?.Title,
            Status = c.Status,
            Capacity = c.Capacity,
            StartDate = c.StartDate,
            EndDate = c.EndDate,
            LocationType = c.LocationType,
            MeetingUrl = c.MeetingUrl,
            RoomLocation = c.RoomLocation,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        };
    }

    private static ClassScheduleDto MapToScheduleDto(TeachingClassSchedule s)
    {
        return new ClassScheduleDto
        {
            Id = s.Id,
            DayOfWeek = s.DayOfWeek,
            StartTime = s.StartTime,
            EndTime = s.EndTime,
            Timezone = s.Timezone,
            LocationType = s.LocationType,
            MeetingUrl = s.MeetingUrl,
            RoomLocation = s.RoomLocation
        };
    }
}
