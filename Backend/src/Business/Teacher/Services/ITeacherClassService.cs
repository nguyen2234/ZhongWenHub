using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Teacher.DTOs;

namespace ZhongWenHub.Business.Teacher.Services;

public interface ITeacherClassService
{
    Task<PagedResponse<ClassSummaryDto>> GetClassesAsync(ClassFilterDto filter, CancellationToken cancellationToken = default);
    Task<ClassDetailDto> GetClassByIdAsync(Guid classId, CancellationToken cancellationToken = default);
    Task<TeachingClassDto> CreateClassAsync(CreateTeachingClassDto dto, CancellationToken cancellationToken = default);
    Task<TeachingClassDto> UpdateClassAsync(Guid classId, UpdateTeachingClassDto dto, CancellationToken cancellationToken = default);
    Task<bool> ArchiveClassAsync(Guid classId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ClassMemberViewDto>> GetClassMembersAsync(Guid classId, string? search = null, string? statusFilter = null, CancellationToken cancellationToken = default);
    Task<ClassMemberViewDto> AddMemberAsync(Guid classId, AddClassMemberDto dto, CancellationToken cancellationToken = default);
    Task<bool> RemoveMemberAsync(Guid classId, Guid studentId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ClassScheduleDto>> GetClassSchedulesAsync(Guid classId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ClassScheduleDto>> UpdateClassSchedulesAsync(Guid classId, List<ClassScheduleDto> schedules, CancellationToken cancellationToken = default);
    Task<TeacherDashboardDto> GetDashboardAsync(CancellationToken cancellationToken = default);
    Task<TeacherClassStatsDto> GetClassStatsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<StudentEnrolledClassDto>> GetMyEnrolledClassesAsync(CancellationToken cancellationToken = default);
}
