using System;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Business.AILearning.DTOs;

namespace ZhongWenHub.Business.AILearning.Services.Diagnostic;

public interface IDiagnosticAssessmentService
{
    Task<DiagnosticSessionStartDto> StartSessionAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<DiagnosticResultDto> SubmitAssessmentAsync(Guid userId, DiagnosticSubmissionDto submission, CancellationToken cancellationToken = default);

    Task<DiagnosticResultDto?> GetLatestResultAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<bool> ApplyConfirmedTargetHskAsync(Guid userId, int confirmedHskLevel, CancellationToken cancellationToken = default);
}
