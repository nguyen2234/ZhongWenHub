using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Support.DTOs;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Entities.Support;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.Support.Services;

public class SupportTicketService : ISupportTicketService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<SupportTicketService> _logger;

    public SupportTicketService(ApplicationDbContext dbContext, ILogger<SupportTicketService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<TicketDetailDto> CreateTicketAsync(
        CreateTicketRequestDto request,
        Guid userId,
        string userName,
        string userEmail,
        string userRole,
        CancellationToken cancellationToken = default)
    {
        var category = (request.Category ?? "OTHER").ToUpperInvariant();
        var priority = (request.Priority ?? "MEDIUM").ToUpperInvariant();

        var slaHours = priority switch
        {
            "URGENT" => 4,
            "HIGH" => 12,
            "LOW" => 48,
            _ => 24
        };

        var now = DateTime.UtcNow;
        var todayPrefix = $"TICK-{now:yyyyMMdd}-";
        var countToday = await _dbContext.SupportTickets
            .CountAsync(t => t.TicketNumber.StartsWith(todayPrefix), cancellationToken);
        var ticketNumber = $"{todayPrefix}{(countToday + 1):D4}";

        var ticket = new SupportTicketEntity
        {
            Id = Guid.NewGuid(),
            TicketNumber = ticketNumber,
            ReporterId = userId,
            ReporterName = userName,
            ReporterEmail = userEmail,
            ReporterRole = userRole,
            Subject = request.Subject.Trim(),
            Description = request.Description.Trim(),
            Category = category,
            Priority = priority,
            Status = "NEW",
            AssigneeName = "Chưa phân công",
            ContextModule = request.ContextModule?.Trim(),
            ContextUrl = request.ContextUrl?.Trim(),
            SlaDeadline = now.AddHours(slaHours),
            IsOverdue = false,
            CreatedAt = now,
            UpdatedAt = now
        };

        ticket.History.Add(new SupportTicketHistoryEntity
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            ActorId = userId,
            ActorName = userName,
            ActorRole = userRole,
            Action = $"Tạo báo cáo sự cố qua hệ thống: [{category}] {request.Subject}",
            Timestamp = now
        });

        _dbContext.SupportTickets.Add(ticket);
        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            var failedEntities = string.Join(", ", ex.Entries.Select(e => $"{e.Entity.GetType().Name} (State: {e.State}, ModifiedProps: {string.Join(", ", e.Properties.Where(p => p.IsModified).Select(p => p.Metadata.Name))})"));
            _logger.LogError(ex, "Concurrency exception in AddMessageAsync on entities: {FailedEntities}", failedEntities);
            throw new InvalidOperationException($"Concurrency exception on: {failedEntities}", ex);
        }

        _logger.LogInformation("Support ticket {TicketNumber} created by user {UserId} ({Role})", ticketNumber, userId, userRole);

        return MapToDetailDto(ticket, isStaff: userRole == RoleConstants.Admin || userRole == RoleConstants.Support);
    }

    public async Task<PagedResponse<TicketSummaryDto>> GetMyReportsAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _dbContext.SupportTickets
            .AsNoTracking()
            .Where(t => t.ReporterId == userId)
            .OrderByDescending(t => t.CreatedAt);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TicketSummaryDto
            {
                Id = t.Id,
                TicketNumber = t.TicketNumber,
                ReporterId = t.ReporterId,
                ReporterName = t.ReporterName,
                ReporterEmail = t.ReporterEmail,
                ReporterRole = t.ReporterRole,
                Subject = t.Subject,
                Category = t.Category,
                Priority = t.Priority,
                Status = t.Status,
                AssigneeId = t.AssigneeId,
                AssigneeName = t.AssigneeName,
                ContentIssueId = t.ContentIssueId,
                SlaDeadline = t.SlaDeadline,
                IsOverdue = t.IsOverdue || (t.Status != "RESOLVED" && t.Status != "CLOSED" && t.SlaDeadline < DateTime.UtcNow),
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                MessageCount = t.Messages.Count(m => !m.IsInternal)
            })
            .ToListAsync(cancellationToken);

        return new PagedResponse<TicketSummaryDto>(items, total, page, pageSize);
    }

    public async Task<TicketDetailDto?> GetTicketDetailAsync(
        Guid ticketId,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _dbContext.SupportTickets
            .Include(t => t.Messages)
            .Include(t => t.History)
            .FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);

        if (ticket == null) return null;

        var isStaff = currentUserRole == RoleConstants.Admin || currentUserRole == RoleConstants.Support;
        if (!isStaff && ticket.ReporterId != currentUserId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập chi tiết báo cáo sự cố này.");
        }

        return MapToDetailDto(ticket, isStaff);
    }

    public async Task<TicketMessageDto> AddMessageAsync(
        Guid ticketId,
        AddTicketMessageRequestDto request,
        Guid currentUserId,
        string currentUserName,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _dbContext.SupportTickets
            .Include(t => t.History)
            .FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);

        if (ticket == null)
        {
            throw new KeyNotFoundException("Không tìm thấy báo cáo sự cố yêu cầu.");
        }

        var isStaff = currentUserRole == RoleConstants.Admin || currentUserRole == RoleConstants.Support;
        if (!isStaff && ticket.ReporterId != currentUserId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền gửi phản hồi trong báo cáo sự cố này.");
        }

        var now = DateTime.UtcNow;
        var isInternal = isStaff && request.IsInternal;

        var message = new SupportTicketMessageEntity
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            SenderId = currentUserId,
            SenderName = currentUserName,
            SenderRole = currentUserRole,
            Message = request.Message.Trim(),
            IsInternal = isInternal,
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.SupportTicketMessages.Add(message);

        // If reporter replies to waiting ticket, transition to IN_PROGRESS
        if (!isStaff && ticket.Status == "WAITING_STUDENT")
        {
            ticket.Status = "IN_PROGRESS";
        }
        else if (isStaff && !isInternal && ticket.Status == "NEW")
        {
            ticket.Status = "IN_PROGRESS";
        }

        ticket.UpdatedAt = now;
        _dbContext.SupportTicketHistories.Add(new SupportTicketHistoryEntity
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            ActorId = currentUserId,
            ActorName = currentUserName,
            ActorRole = currentUserRole,
            Action = isInternal ? "Đã thêm ghi chú nội bộ bộ phận hỗ trợ." : "Đã gửi phản hồi hỗ trợ.",
            Timestamp = now
        });

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            var failedEntities = string.Join(", ", ex.Entries.Select(e => $"{e.Entity.GetType().Name} (State: {e.State}, ModifiedProps: {string.Join(", ", e.Properties.Where(p => p.IsModified).Select(p => p.Metadata.Name))})"));
            _logger.LogError(ex, "Concurrency exception in AddMessageAsync on entities: {FailedEntities}", failedEntities);
            throw new InvalidOperationException($"Concurrency exception on: {failedEntities}", ex);
        }

        return new TicketMessageDto
        {
            Id = message.Id,
            TicketId = message.TicketId,
            SenderId = message.SenderId,
            SenderName = message.SenderName,
            SenderRole = message.SenderRole,
            Message = message.Message,
            IsInternal = message.IsInternal,
            CreatedAt = message.CreatedAt
        };
    }

    public async Task<PagedResponse<TicketSummaryDto>> GetAllTicketsAsync(
        TicketFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var query = _dbContext.SupportTickets.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(t =>
                t.TicketNumber.ToLower().Contains(search) ||
                t.Subject.ToLower().Contains(search) ||
                t.ReporterName.ToLower().Contains(search) ||
                t.ReporterEmail.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(filter.Status) && filter.Status != "ALL")
        {
            query = query.Where(t => t.Status == filter.Status);
        }

        if (!string.IsNullOrWhiteSpace(filter.Priority) && filter.Priority != "ALL")
        {
            query = query.Where(t => t.Priority == filter.Priority);
        }

        if (!string.IsNullOrWhiteSpace(filter.Category) && filter.Category != "ALL")
        {
            query = query.Where(t => t.Category == filter.Category);
        }

        if (!string.IsNullOrWhiteSpace(filter.Assignee) && filter.Assignee != "ALL")
        {
            if (Guid.TryParse(filter.Assignee, out var assigneeGuid))
            {
                query = query.Where(t => t.AssigneeId == assigneeGuid);
            }
            else if (filter.Assignee == "UNASSIGNED")
            {
                query = query.Where(t => t.AssigneeId == null);
            }
        }

        query = query.OrderByDescending(t => t.CreatedAt);

        var total = await query.CountAsync(cancellationToken);
        var now = DateTime.UtcNow;

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TicketSummaryDto
            {
                Id = t.Id,
                TicketNumber = t.TicketNumber,
                ReporterId = t.ReporterId,
                ReporterName = t.ReporterName,
                ReporterEmail = t.ReporterEmail,
                ReporterRole = t.ReporterRole,
                Subject = t.Subject,
                Category = t.Category,
                Priority = t.Priority,
                Status = t.Status,
                AssigneeId = t.AssigneeId,
                AssigneeName = t.AssigneeName,
                ContentIssueId = t.ContentIssueId,
                SlaDeadline = t.SlaDeadline,
                IsOverdue = t.IsOverdue || (t.Status != "RESOLVED" && t.Status != "CLOSED" && t.SlaDeadline < now),
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                MessageCount = t.Messages.Count
            })
            .ToListAsync(cancellationToken);

        return new PagedResponse<TicketSummaryDto>(items, total, page, pageSize);
    }

    public async Task<SupportMetricsDto> GetMetricsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var tickets = await _dbContext.SupportTickets.AsNoTracking().ToListAsync(cancellationToken);

        var total = tickets.Count;
        var newCount = tickets.Count(t => t.Status == "NEW");
        var inProgress = tickets.Count(t => t.Status == "IN_PROGRESS" || t.Status == "WAITING_STUDENT");
        var resolved = tickets.Count(t => t.Status == "RESOLVED" || t.Status == "CLOSED");
        var urgent = tickets.Count(t => t.Priority == "URGENT" && t.Status != "RESOLVED" && t.Status != "CLOSED");
        var overdue = tickets.Count(t => (t.IsOverdue || t.SlaDeadline < now) && t.Status != "RESOLVED" && t.Status != "CLOSED");

        var closedTickets = tickets.Where(t => t.ClosedAt.HasValue).ToList();
        var avgResolutionHours = closedTickets.Any()
            ? Math.Round(closedTickets.Average(t => (t.ClosedAt!.Value - t.CreatedAt).TotalHours), 1)
            : 0.0;

        return new SupportMetricsDto
        {
            Total = total,
            NewCount = newCount,
            InProgress = inProgress,
            Resolved = resolved,
            Urgent = urgent,
            SlaOverdue = overdue,
            AvgResolutionHours = avgResolutionHours,
            SatisfactionRate = 96.5
        };
    }

    public async Task<TicketDetailDto> AssignTicketAsync(
        Guid ticketId,
        AssignTicketRequestDto request,
        Guid currentUserId,
        string currentUserName,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _dbContext.SupportTickets
            .Include(t => t.Messages)
            .Include(t => t.History)
            .FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);

        if (ticket == null) throw new KeyNotFoundException("Không tìm thấy báo cáo sự cố yêu cầu.");

        var assignee = await _dbContext.Users.FindAsync(new object[] { request.AssigneeId }, cancellationToken);
        if (assignee == null || assignee.IsDeleted) throw new KeyNotFoundException("Không tìm thấy nhân viên hỗ trợ được chỉ định.");

        var isStaff = await _dbContext.UserRoles.AsNoTracking()
            .AnyAsync(ur => ur.UserId == assignee.Id &&
                           _dbContext.Roles.Any(r => r.Id == ur.RoleId && (r.Name == RoleConstants.Support || r.Name == RoleConstants.Admin)),
                      cancellationToken);

        if (!isStaff)
        {
            throw new InvalidOperationException("Người dùng được chỉ định không phải là nhân viên hỗ trợ hợp lệ hoặc tài khoản đã bị vô hiệu hóa.");
        }

        var now = DateTime.UtcNow;
        ticket.AssigneeId = assignee.Id;
        ticket.AssigneeName = assignee.DisplayName ?? assignee.UserName ?? "Nhân viên hỗ trợ";
        if (ticket.Status == "NEW")
        {
            ticket.Status = "IN_PROGRESS";
        }
        ticket.UpdatedAt = now;

        _dbContext.SupportTicketHistories.Add(new SupportTicketHistoryEntity
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            ActorId = currentUserId,
            ActorName = currentUserName,
            ActorRole = RoleConstants.Support,
            Action = $"Đã phân công vé cho nhân viên {ticket.AssigneeName}.",
            Timestamp = now
        });

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            var failedEntities = string.Join(", ", ex.Entries.Select(e => $"{e.Entity.GetType().Name} (State: {e.State}, ModifiedProps: {string.Join(", ", e.Properties.Where(p => p.IsModified).Select(p => p.Metadata.Name))})"));
            _logger.LogError(ex, "Concurrency exception in AddMessageAsync on entities: {FailedEntities}", failedEntities);
            throw new InvalidOperationException($"Concurrency exception on: {failedEntities}", ex);
        }
        return MapToDetailDto(ticket, isStaff: true);
    }

    public async Task<TicketDetailDto> UpdateStatusAsync(
        Guid ticketId,
        UpdateTicketStatusRequestDto request,
        Guid currentUserId,
        string currentUserName,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _dbContext.SupportTickets
            .Include(t => t.Messages)
            .Include(t => t.History)
            .FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);

        if (ticket == null) throw new KeyNotFoundException("Không tìm thấy báo cáo sự cố yêu cầu.");

        var newStatus = request.Status.ToUpperInvariant();
        var validStatuses = new[] { "NEW", "IN_PROGRESS", "WAITING_STUDENT", "RESOLVED", "CLOSED" };
        if (!validStatuses.Contains(newStatus))
        {
            throw new ArgumentException($"Trạng thái '{request.Status}' không hợp lệ.");
        }

        var now = DateTime.UtcNow;
        var oldStatus = ticket.Status;
        ticket.Status = newStatus;
        ticket.UpdatedAt = now;

        if (newStatus == "RESOLVED" || newStatus == "CLOSED")
        {
            ticket.ClosedAt ??= now;
        }

        var noteMsg = !string.IsNullOrWhiteSpace(request.Note) ? $": {request.Note.Trim()}" : "";
        _dbContext.SupportTicketHistories.Add(new SupportTicketHistoryEntity
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            ActorId = currentUserId,
            ActorName = currentUserName,
            ActorRole = currentUserRole,
            Action = $"Chuyển trạng thái từ {oldStatus} sang {newStatus}{noteMsg}",
            Timestamp = now
        });

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            var failedEntities = string.Join(", ", ex.Entries.Select(e => $"{e.Entity.GetType().Name} (State: {e.State}, ModifiedProps: {string.Join(", ", e.Properties.Where(p => p.IsModified).Select(p => p.Metadata.Name))})"));
            _logger.LogError(ex, "Concurrency exception in AddMessageAsync on entities: {FailedEntities}", failedEntities);
            throw new InvalidOperationException($"Concurrency exception on: {failedEntities}", ex);
        }
        return MapToDetailDto(ticket, isStaff: true);
    }

    public async Task<TicketDetailDto> EscalateToContentIssueAsync(
        Guid ticketId,
        EscalateContentIssueRequestDto request,
        Guid currentUserId,
        string currentUserName,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _dbContext.SupportTickets
            .Include(t => t.Messages)
            .Include(t => t.History)
            .FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);

        if (ticket == null) throw new KeyNotFoundException("Không tìm thấy báo cáo sự cố yêu cầu.");

        var now = DateTime.UtcNow;
        var issueCount = await _dbContext.ContentIssues.CountAsync(cancellationToken) + 1;
        var issueCode = $"ISS-{now:yyyyMM}-{issueCount:D4}";

        var contentIssue = new ContentIssueEntity
        {
            Id = Guid.NewGuid(),
            IssueCode = issueCode,
            Title = ticket.Subject,
            Description = $"{ticket.Description}\n\n[Ghi chú chuyển tiếp từ Support]: {request.Note}",
            IssueType = "OTHER",
            Priority = ticket.Priority,
            TargetContentId = ticket.ContextModule ?? "CONTENT-GENERAL",
            TargetContentType = "CURRICULUM_LESSON",
            TargetContentTitle = ticket.Subject,
            TargetContentRoute = ticket.ContextUrl ?? "/management/content-manager/issues",
            ReportedBy = ticket.ReporterName,
            SupportTicketId = ticket.Id,
            SupportStaffName = currentUserName,
            Status = "NEW",
            CreatedAt = now,
            UpdatedAt = now
        };

        var contentActivity = new ContentIssueActivityEntity
        {
            Id = Guid.NewGuid(),
            ContentIssueId = contentIssue.Id,
            ActorName = currentUserName,
            ActorRole = "SUPPORT",
            Action = $"Tiếp nhận chuyển tiếp từ Ticket #{ticket.TicketNumber}. Ghi chú: {request.Note}",
            CreatedAt = now,
            UpdatedAt = now
        };
        _dbContext.ContentIssueActivities.Add(contentActivity);
        contentIssue.Activities.Add(contentActivity);

        _dbContext.ContentIssues.Add(contentIssue);

        ticket.ContentIssueId = issueCode;
        ticket.Category = "CONTENT";
        ticket.Status = "IN_PROGRESS";
        ticket.UpdatedAt = now;

        _dbContext.SupportTicketHistories.Add(new SupportTicketHistoryEntity
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            ActorId = currentUserId,
            ActorName = currentUserName,
            ActorRole = RoleConstants.Support,
            Action = $"Chuyển tiếp báo cáo sang Bộ phận Quản lý học liệu mã {issueCode}. Ghi chú: {request.Note}",
            Timestamp = now
        });

        _dbContext.SupportTicketMessages.Add(new SupportTicketMessageEntity
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            SenderId = currentUserId,
            SenderName = currentUserName,
            SenderRole = RoleConstants.Support,
            Message = $"[Hệ thống] Vé đã được chuyển tiếp sang ban Quản lý Học liệu & Kiểm duyệt (Mã sự cố: {issueCode}). Nội dung chuyển tiếp: {request.Note}",
            IsInternal = false,
            CreatedAt = now,
            UpdatedAt = now
        });

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            var failedEntities = string.Join(", ", ex.Entries.Select(e => $"{e.Entity.GetType().Name} (State: {e.State}, ModifiedProps: {string.Join(", ", e.Properties.Where(p => p.IsModified).Select(p => p.Metadata.Name))})"));
            _logger.LogError(ex, "Concurrency exception in AddMessageAsync on entities: {FailedEntities}", failedEntities);
            throw new InvalidOperationException($"Concurrency exception on: {failedEntities}", ex);
        }
        return MapToDetailDto(ticket, isStaff: true);
    }

    public async Task<TicketDetailDto> ReopenTicketAsync(
        Guid ticketId,
        Guid currentUserId,
        string currentUserName,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _dbContext.SupportTickets
            .Include(t => t.Messages)
            .Include(t => t.History)
            .FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);

        if (ticket == null) throw new KeyNotFoundException("Không tìm thấy báo cáo sự cố yêu cầu.");

        if (ticket.ReporterId != currentUserId)
        {
            throw new UnauthorizedAccessException("Chỉ người báo cáo mới có quyền mở lại vé sự cố này.");
        }

        var now = DateTime.UtcNow;
        ticket.Status = "IN_PROGRESS";
        ticket.ClosedAt = null;
        ticket.UpdatedAt = now;

        _dbContext.SupportTicketHistories.Add(new SupportTicketHistoryEntity
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            ActorId = currentUserId,
            ActorName = currentUserName,
            ActorRole = ticket.ReporterRole,
            Action = "Người báo cáo mở lại yêu cầu xử lý sự cố.",
            Timestamp = now
        });

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            var failedEntities = string.Join(", ", ex.Entries.Select(e => $"{e.Entity.GetType().Name} (State: {e.State}, ModifiedProps: {string.Join(", ", e.Properties.Where(p => p.IsModified).Select(p => p.Metadata.Name))})"));
            _logger.LogError(ex, "Concurrency exception in AddMessageAsync on entities: {FailedEntities}", failedEntities);
            throw new InvalidOperationException($"Concurrency exception on: {failedEntities}", ex);
        }
        return MapToDetailDto(ticket, isStaff: false);
    }

    private static TicketDetailDto MapToDetailDto(SupportTicketEntity ticket, bool isStaff)
    {
        var messages = ticket.Messages
            .Where(m => isStaff || !m.IsInternal)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new TicketMessageDto
            {
                Id = m.Id,
                TicketId = m.TicketId,
                SenderId = m.SenderId,
                SenderName = m.SenderName,
                SenderRole = m.SenderRole,
                Message = m.Message,
                IsInternal = m.IsInternal,
                CreatedAt = m.CreatedAt
            })
            .ToList();

        var history = ticket.History
            .OrderByDescending(h => h.Timestamp)
            .Select(h => new TicketActivityDto
            {
                Id = h.Id,
                TicketId = h.TicketId,
                ActorName = h.ActorName,
                ActorRole = h.ActorRole,
                Action = h.Action,
                Timestamp = h.Timestamp
            })
            .ToList();

        var now = DateTime.UtcNow;
        var isOverdue = ticket.IsOverdue || (ticket.Status != "RESOLVED" && ticket.Status != "CLOSED" && ticket.SlaDeadline < now);

        return new TicketDetailDto
        {
            Id = ticket.Id,
            TicketNumber = ticket.TicketNumber,
            ReporterId = ticket.ReporterId,
            ReporterName = ticket.ReporterName,
            ReporterEmail = ticket.ReporterEmail,
            ReporterRole = ticket.ReporterRole,
            Subject = ticket.Subject,
            Description = ticket.Description,
            Category = ticket.Category,
            Priority = ticket.Priority,
            Status = ticket.Status,
            AssigneeId = ticket.AssigneeId,
            AssigneeName = ticket.AssigneeName,
            ContextModule = ticket.ContextModule,
            ContextUrl = ticket.ContextUrl,
            ContentIssueId = ticket.ContentIssueId,
            SlaDeadline = ticket.SlaDeadline,
            IsOverdue = isOverdue,
            CreatedAt = ticket.CreatedAt,
            UpdatedAt = ticket.UpdatedAt,
            ClosedAt = ticket.ClosedAt,
            Messages = messages,
            History = history
        };
    }

    public async Task<List<SupportStaffDto>> GetSupportStaffAsync(CancellationToken cancellationToken = default)
    {
        var staffUsers = await _dbContext.Users
            .Where(u => !u.IsDeleted && _dbContext.UserRoles.Any(ur => ur.UserId == u.Id && _dbContext.Roles.Any(r => r.Id == ur.RoleId && (r.Name == RoleConstants.Support || r.Name == RoleConstants.Admin))))
            .OrderBy(u => u.DisplayName ?? u.UserName)
            .Select(u => new SupportStaffDto
            {
                Id = u.Id,
                Name = u.DisplayName ?? u.UserName ?? "Nhân viên hỗ trợ",
                Email = u.Email ?? string.Empty
            })
            .ToListAsync(cancellationToken);

        return staffUsers;
    }
}
