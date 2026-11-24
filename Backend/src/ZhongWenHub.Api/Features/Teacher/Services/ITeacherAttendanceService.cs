using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Features.Teacher.DTOs;

namespace ZhongWenHub.Features.Teacher.Services;

public interface ITeacherAttendanceService
{
    Task<IReadOnlyList<ClassAttendanceRecordDto>> GetClassAttendanceAsync(Guid classId, DateTime? date, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ClassAttendanceRecordDto>> RecordClassAttendanceAsync(Guid classId, RecordClassAttendanceDto dto, CancellationToken cancellationToken = default);
    Task<ClassAttendanceSummaryDto> GetClassAttendanceSummaryAsync(Guid classId, CancellationToken cancellationToken = default);
}
