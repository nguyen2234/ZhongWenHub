using System;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Support.DTOs;

namespace ZhongWenHub.Business.Support.Services;

public interface ISupportTicketService
{
    Task<TicketDetailDto> CreateTicketAsync(CreateTicketRequestDto request, Guid userId, string userName, string userEmail, string userRole, CancellationToken cancellationToken = default);
    Task<PagedResponse<TicketSummaryDto>> GetMyReportsAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<TicketDetailDto?> GetTicketDetailAsync(Guid ticketId, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<TicketMessageDto> AddMessageAsync(Guid ticketId, AddTicketMessageRequestDto request, Guid currentUserId, string currentUserName, string currentUserRole, CancellationToken cancellationToken = default);
    Task<PagedResponse<TicketSummaryDto>> GetAllTicketsAsync(TicketFilterDto filter, CancellationToken cancellationToken = default);
    Task<SupportMetricsDto> GetMetricsAsync(CancellationToken cancellationToken = default);
    Task<TicketDetailDto> AssignTicketAsync(Guid ticketId, AssignTicketRequestDto request, Guid currentUserId, string currentUserName, CancellationToken cancellationToken = default);
    Task<TicketDetailDto> UpdateStatusAsync(Guid ticketId, UpdateTicketStatusRequestDto request, Guid currentUserId, string currentUserName, string currentUserRole, CancellationToken cancellationToken = default);
    Task<TicketDetailDto> EscalateToContentIssueAsync(Guid ticketId, EscalateContentIssueRequestDto request, Guid currentUserId, string currentUserName, CancellationToken cancellationToken = default);
    Task<TicketDetailDto> ReopenTicketAsync(Guid ticketId, Guid currentUserId, string currentUserName, CancellationToken cancellationToken = default);
}
