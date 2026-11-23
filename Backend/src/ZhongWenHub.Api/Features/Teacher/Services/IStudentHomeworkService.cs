using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Business.Teacher.DTOs;

namespace ZhongWenHub.Business.Teacher.Services;

public interface IStudentHomeworkService
{
    Task<IReadOnlyList<StudentHomeworkSummaryDto>> GetMyHomeworkListAsync(string? status = null, CancellationToken cancellationToken = default);
    Task<StudentAssignmentTakingDto> StartHomeworkAttemptAsync(Guid assignmentId, CancellationToken cancellationToken = default);
    Task<StudentHomeworkResultDto> SubmitHomeworkAsync(Guid submissionId, SubmitHomeworkDto dto, CancellationToken cancellationToken = default);
    Task<StudentHomeworkResultDto> GetHomeworkResultAsync(Guid submissionId, CancellationToken cancellationToken = default);
}
