using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Business.Content.DTOs;

namespace ZhongWenHub.Business.Content.Services;

public interface IContentIssueService
{
    Task<List<ContentIssueDto>> GetIssuesAsync(ContentIssueFilterDto filter, CancellationToken cancellationToken = default);
    Task<ContentIssueDto?> GetIssueByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ContentIssueDto> CreateIssueAsync(CreateContentIssueDto dto, CancellationToken cancellationToken = default);
    Task<ContentIssueDto> AssignToContentManagerAsync(Guid id, Guid contentManagerId, string contentManagerName, CancellationToken cancellationToken = default);
    Task<ContentIssueDto> ResolveIssueAsync(Guid id, ResolveContentIssueDto dto, string actorName, CancellationToken cancellationToken = default);
    Task<ContentIssueDto> ReopenIssueAsync(Guid id, ReopenContentIssueDto dto, string actorName, CancellationToken cancellationToken = default);
    Task<ContentIssueDto> CloseIssueAsync(Guid id, string actorName, CancellationToken cancellationToken = default);
}
