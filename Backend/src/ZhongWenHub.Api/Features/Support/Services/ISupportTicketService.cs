using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Api.Features.Support.DTOs;

namespace ZhongWenHub.Api.Features.Support.Services;

public interface ISupportTicketService
{
    Task<List<SupportTicketDto>> GetTicketsAsync(TicketFiltersDto filters, CancellationToken cancellationToken = default);
    Task<SupportTicketDto?> GetTicketByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<SupportTicketDto> CreateTicketAsync(Guid reporterId, string reporterName, string reporterEmail, string reporterRole, CreateSupportTicketDto dto, CancellationToken cancellationToken = default);
    Task<SupportTicketDto> UpdateStatusAsync(string id, UpdateTicketStatusDto dto, Guid actorId, string actorName, string actorRole, CancellationToken cancellationToken = default);
    Task<SupportTicketDto> AssignTicketAsync(string id, AssignTicketDto dto, Guid actorId, string actorName, string actorRole, CancellationToken cancellationToken = default);
    Task<SupportTicketDto> AddMessageAsync(string id, AddTicketMessageDto dto, Guid senderId, string senderName, string senderRole, CancellationToken cancellationToken = default);
    Task<SupportTicketDto> EscalateToContentIssueAsync(string id, EscalateContentIssueDto dto, Guid actorId, string actorName, string actorRole, CancellationToken cancellationToken = default);
    Task<SupportMetricsDto> GetMetricsAsync(CancellationToken cancellationToken = default);
}
