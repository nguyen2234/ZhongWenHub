using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ZhongWenHub.Data.Persistence;
using ZhongWenHub.Api.Features.Support.DTOs;
using ZhongWenHub.Models.Support;

namespace ZhongWenHub.Api.Features.Support.Services;

public class SupportTicketService : ISupportTicketService
{
    private readonly ApplicationDbContext _db;

    public SupportTicketService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<SupportTicketDto>> GetTicketsAsync(TicketFiltersDto filters, CancellationToken cancellationToken = default)
    {
        var query = _db.SupportTickets
            .AsNoTracking()
            .Include(t => t.Messages)
            .Include(t => t.History)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filters.Status) && !string.Equals(filters.Status, "ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(t => t.Status == filters.Status);
        }

        if (!string.IsNullOrWhiteSpace(filters.Priority) && !string.Equals(filters.Priority, "ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(t => t.Priority == filters.Priority);
        }

        if (!string.IsNullOrWhiteSpace(filters.Category) && !string.Equals(filters.Category, "ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(t => t.Category == filters.Category);
        }

        if (!string.IsNullOrWhiteSpace(filters.Assignee) && !string.Equals(filters.Assignee, "ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(t => t.AssigneeName.Contains(filters.Assignee));
        }

        if (!string.IsNullOrWhiteSpace(filters.Search))
        {
            var s = filters.Search.Trim().ToLower();
            query = query.Where(t =>
                t.TicketNumber.ToLower().Contains(s) ||
                t.Subject.ToLower().Contains(s) ||
                t.Description.ToLower().Contains(s) ||
                t.ReporterName.ToLower().Contains(s) ||
                t.ReporterEmail.ToLower().Contains(s) ||
                t.AssigneeName.ToLower().Contains(s));
        }

        var tickets = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((filters.Page - 1) * filters.PageSize)
            .Take(filters.PageSize)
            .ToListAsync(cancellationToken);

        return tickets.Select(MapToDto).ToList();
    }

    public async Task<SupportTicketDto?> GetTicketByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        var ticket = await FindTicketEntityAsync(id, cancellationToken);
        return ticket == null ? null : MapToDto(ticket);
    }

    public async Task<SupportTicketDto> CreateTicketAsync(
        Guid reporterId,
        string reporterName,
        string reporterEmail,
        string reporterRole,
        CreateSupportTicketDto dto,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var ticketNumber = $"TICK-{now:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";

        var ticket = new SupportTicket
        {
            Id = Guid.NewGuid(),
            TicketNumber = ticketNumber,
            ReporterId = reporterId,
            ReporterName = reporterName,
            ReporterEmail = reporterEmail,
            ReporterRole = string.IsNullOrWhiteSpace(reporterRole) ? "STUDENT" : reporterRole,
            Subject = dto.Subject,
            Description = dto.Description,
            Category = dto.Category,
            Priority = dto.Priority,
            Status = "NEW",
            AssigneeName = "Chưa phân công",
            ContextModule = dto.ContextModule,
            ContextUrl = dto.ContextUrl,
            SlaDeadline = now.AddHours(24),
            IsOverdue = false,
            CreatedAt = now,
            UpdatedAt = now
        };

        var hist = new SupportTicketHistory
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            ActorId = reporterId,
            ActorName = reporterName,
            ActorRole = reporterRole,
            Action = "Tạo vé hỗ trợ.",
            Timestamp = now,
            CreatedAt = now
        };

        _db.SupportTickets.Add(ticket);
        _db.SupportTicketHistories.Add(hist);
        await _db.SaveChangesAsync(cancellationToken);

        return MapToDto(ticket);
    }

    public async Task<SupportTicketDto> UpdateStatusAsync(
        string id,
        UpdateTicketStatusDto dto,
        Guid actorId,
        string actorName,
        string actorRole,
        CancellationToken cancellationToken = default)
    {
        var ticket = await FindTicketEntityAsync(id, cancellationToken);
        if (ticket == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy vé hỗ trợ: {id}");
        }

        var now = DateTime.UtcNow;
        ticket.Status = dto.Status;
        ticket.UpdatedAt = now;

        if (string.Equals(dto.Status, "RESOLVED", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(dto.Status, "CLOSED", StringComparison.OrdinalIgnoreCase))
        {
            ticket.ClosedAt = now;
        }

        var actionText = $"Chuyển trạng thái sang [{dto.Status}].";
        if (!string.IsNullOrWhiteSpace(dto.Note))
        {
            actionText += $" Ghi chú: {dto.Note}";
            var noteMsg = new SupportTicketMessage
            {
                Id = Guid.NewGuid(),
                TicketId = ticket.Id,
                SenderId = actorId,
                SenderName = actorName,
                SenderRole = actorRole,
                Message = dto.Note,
                IsInternal = true,
                CreatedAt = now
            };
            _db.SupportTicketMessages.Add(noteMsg);
        }

        var hist = new SupportTicketHistory
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            ActorId = actorId,
            ActorName = actorName,
            ActorRole = actorRole,
            Action = actionText,
            Timestamp = now,
            CreatedAt = now
        };
        _db.SupportTicketHistories.Add(hist);

        await _db.SaveChangesAsync(cancellationToken);
        return MapToDto(ticket);
    }

    public async Task<SupportTicketDto> AssignTicketAsync(
        string id,
        AssignTicketDto dto,
        Guid actorId,
        string actorName,
        string actorRole,
        CancellationToken cancellationToken = default)
    {
        var ticket = await FindTicketEntityAsync(id, cancellationToken);
        if (ticket == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy vé hỗ trợ: {id}");
        }

        var now = DateTime.UtcNow;
        ticket.AssigneeId = dto.AssigneeId;
        ticket.AssigneeName = dto.AssigneeName;
        if (ticket.Status == "NEW")
        {
            ticket.Status = "IN_PROGRESS";
        }
        ticket.UpdatedAt = now;

        var hist = new SupportTicketHistory
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            ActorId = actorId,
            ActorName = actorName,
            ActorRole = actorRole,
            Action = $"Phân công xử lý vé cho: {dto.AssigneeName}.",
            Timestamp = now,
            CreatedAt = now
        };
        _db.SupportTicketHistories.Add(hist);

        await _db.SaveChangesAsync(cancellationToken);
        return MapToDto(ticket);
    }

    public async Task<SupportTicketDto> AddMessageAsync(
        string id,
        AddTicketMessageDto dto,
        Guid senderId,
        string senderName,
        string senderRole,
        CancellationToken cancellationToken = default)
    {
        var ticket = await FindTicketEntityAsync(id, cancellationToken);
        if (ticket == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy vé hỗ trợ: {id}");
        }

        var now = DateTime.UtcNow;
        ticket.UpdatedAt = now;

        var msg = new SupportTicketMessage
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            SenderId = senderId,
            SenderName = senderName,
            SenderRole = senderRole,
            Message = dto.Content,
            IsInternal = dto.IsInternal,
            CreatedAt = now
        };
        _db.SupportTicketMessages.Add(msg);

        var hist = new SupportTicketHistory
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            ActorId = senderId,
            ActorName = senderName,
            ActorRole = senderRole,
            Action = dto.IsInternal ? "Thêm ghi chú nội bộ CSKH." : "Gửi phản hồi trao đổi tới học viên.",
            Timestamp = now,
            CreatedAt = now
        };
        _db.SupportTicketHistories.Add(hist);

        await _db.SaveChangesAsync(cancellationToken);
        return MapToDto(ticket);
    }

    public async Task<SupportTicketDto> EscalateToContentIssueAsync(
        string id,
        EscalateContentIssueDto dto,
        Guid actorId,
        string actorName,
        string actorRole,
        CancellationToken cancellationToken = default)
    {
        var ticket = await FindTicketEntityAsync(id, cancellationToken);
        if (ticket == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy vé hỗ trợ: {id}");
        }

        var now = DateTime.UtcNow;
        var contentIssueId = $"ISS-{now:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";
        ticket.ContentIssueId = contentIssueId;
        ticket.Status = "IN_PROGRESS";
        ticket.UpdatedAt = now;

        var noteContent = $"Đã chuyển tiếp lỗi học liệu sang Content Manager mã [{contentIssueId}]. Tiêu đề: \"{dto.Title}\".";
        var msg = new SupportTicketMessage
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            SenderId = actorId,
            SenderName = actorName,
            SenderRole = actorRole,
            Message = noteContent,
            IsInternal = true,
            CreatedAt = now
        };
        _db.SupportTicketMessages.Add(msg);

        var hist = new SupportTicketHistory
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            ActorId = actorId,
            ActorName = actorName,
            ActorRole = actorRole,
            Action = $"Chuyển tiếp báo cáo lỗi sang ban Quản lý học liệu (Mã: {contentIssueId}).",
            Timestamp = now,
            CreatedAt = now
        };
        _db.SupportTicketHistories.Add(hist);

        await _db.SaveChangesAsync(cancellationToken);
        return MapToDto(ticket);
    }

    public async Task<SupportMetricsDto> GetMetricsAsync(CancellationToken cancellationToken = default)
    {
        var tickets = await _db.SupportTickets.AsNoTracking().ToListAsync(cancellationToken);
        var total = tickets.Count;
        var newCount = tickets.Count(t => t.Status == "NEW");
        var inProgress = tickets.Count(t => t.Status == "IN_PROGRESS" || t.Status == "WAITING_STUDENT");
        var resolved = tickets.Count(t => t.Status == "RESOLVED" || t.Status == "CLOSED");
        var urgent = tickets.Count(t => t.Priority == "URGENT");
        var slaOverdue = tickets.Count(t => t.IsOverdue && t.Status != "RESOLVED" && t.Status != "CLOSED");

        return new SupportMetricsDto
        {
            Total = total,
            NewCount = newCount,
            InProgress = inProgress,
            Resolved = resolved,
            Urgent = urgent,
            SlaOverdue = slaOverdue,
            AvgResolutionHours = 3.5,
            SatisfactionRate = 98.2
        };
    }

    private async Task<SupportTicket?> FindTicketEntityAsync(string id, CancellationToken cancellationToken)
    {
        var query = _db.SupportTickets
            .Include(t => t.Messages)
            .Include(t => t.History);

        if (Guid.TryParse(id, out var guid))
        {
            return await query.FirstOrDefaultAsync(t => t.Id == guid, cancellationToken);
        }

        return await query.FirstOrDefaultAsync(t => t.TicketNumber == id, cancellationToken);
    }

    private static SupportTicketDto MapToDto(SupportTicket ticket)
    {
        return new SupportTicketDto
        {
            Id = ticket.TicketNumber,
            TicketId = ticket.Id,
            TicketNumber = ticket.TicketNumber,
            StudentId = ticket.ReporterId.ToString(),
            StudentName = ticket.ReporterName,
            StudentEmail = ticket.ReporterEmail,
            Subject = ticket.Subject,
            Description = ticket.Description,
            Category = ticket.Category,
            Priority = ticket.Priority,
            Status = ticket.Status,
            AssigneeId = ticket.AssigneeId?.ToString(),
            AssigneeName = ticket.AssigneeName,
            ContextModule = ticket.ContextModule,
            ContextUrl = ticket.ContextUrl,
            ContentIssueId = ticket.ContentIssueId,
            SlaDeadline = ticket.SlaDeadline,
            IsOverdue = ticket.IsOverdue,
            CreatedAt = ticket.CreatedAt,
            UpdatedAt = ticket.UpdatedAt,
            Notes = (ticket.Messages ?? new List<SupportTicketMessage>())
                .OrderBy(m => m.CreatedAt)
                .Select(m => new TicketNoteDto
                {
                    Id = m.Id.ToString(),
                    Author = m.SenderName,
                    Content = m.Message,
                    CreatedAt = m.CreatedAt,
                    IsInternal = m.IsInternal
                }).ToList(),
            History = (ticket.History ?? new List<SupportTicketHistory>())
                .OrderBy(h => h.Timestamp)
                .Select(h => new TicketActivityDto
                {
                    Id = h.Id.ToString(),
                    ActorName = h.ActorName,
                    ActorRole = h.ActorRole,
                    Action = h.Action,
                    Timestamp = h.Timestamp
                }).ToList()
        };
    }
}
