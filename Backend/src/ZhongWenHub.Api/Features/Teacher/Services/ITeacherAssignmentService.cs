using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Common.DTOs;
using ZhongWenHub.Features.Teacher.DTOs;

namespace ZhongWenHub.Features.Teacher.Services;

public interface ITeacherAssignmentService
{
    Task<PagedResponse<AssignmentSummaryDto>> GetAssignmentsAsync(AssignmentFilterDto filter, CancellationToken cancellationToken = default);
    Task<AssignmentDetailDto> GetAssignmentByIdAsync(Guid assignmentId, CancellationToken cancellationToken = default);
    Task<AssignmentDetailDto> CreateAssignmentAsync(CreateAssignmentDto dto, CancellationToken cancellationToken = default);
    Task<AssignmentDetailDto> UpdateAssignmentAsync(Guid assignmentId, UpdateAssignmentDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteAssignmentAsync(Guid assignmentId, CancellationToken cancellationToken = default);
    Task<AssignmentDetailDto> PublishAssignmentAsync(Guid assignmentId, CancellationToken cancellationToken = default);
    Task<AssignmentDetailDto> CloseAssignmentAsync(Guid assignmentId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TeacherSubmissionItemDto>> GetSubmissionsAsync(Guid assignmentId, string? status = null, CancellationToken cancellationToken = default);
    Task<TeacherSubmissionDetailDto> GetSubmissionDetailAsync(Guid submissionId, CancellationToken cancellationToken = default);
    Task<TeacherSubmissionDetailDto> GradeSubmissionAsync(Guid submissionId, GradeSubmissionDto dto, CancellationToken cancellationToken = default);
}
