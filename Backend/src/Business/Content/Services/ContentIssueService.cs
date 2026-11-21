using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Business.Content.DTOs;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Entities.Support;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.Content.Services;

public class ContentIssueService : IContentIssueService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<ContentIssueService> _logger;

    public ContentIssueService(ApplicationDbContext dbContext, ILogger<ContentIssueService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<List<ContentIssueDto>> GetIssuesAsync(ContentIssueFilterDto filter, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.ContentIssues
            .Include(i => i.Activities)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Status) && filter.Status != "ALL")
        {
            query = query.Where(i => i.Status == filter.Status);
        }

        if (!string.IsNullOrWhiteSpace(filter.Priority) && filter.Priority != "ALL")
        {
            query = query.Where(i => i.Priority == filter.Priority);
        }

        if (!string.IsNullOrWhiteSpace(filter.IssueType) && filter.IssueType != "ALL")
        {
            query = query.Where(i => i.IssueType == filter.IssueType);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var q = filter.Search.Trim().ToLower();
            query = query.Where(i =>
                i.IssueCode.ToLower().Contains(q) ||
                i.Title.ToLower().Contains(q) ||
                i.Description.ToLower().Contains(q) ||
                i.TargetContentTitle.ToLower().Contains(q) ||
                i.ReportedBy.ToLower().Contains(q));
        }

        var list = await query
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);

        return list.Select(MapToDto).ToList();
    }

    public async Task<ContentIssueDto?> GetIssueByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.ContentIssues
            .Include(i => i.Activities)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

        return entity == null ? null : MapToDto(entity);
    }

    public async Task<ContentIssueDto> CreateIssueAsync(CreateContentIssueDto dto, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var issueCount = await _dbContext.ContentIssues.CountAsync(cancellationToken) + 1;
        var code = $"ISS-{now:yyyyMM}-{issueCount:D4}";

        var issue = new ContentIssueEntity
        {
            Id = Guid.NewGuid(),
            IssueCode = code,
            Title = dto.Title.Trim(),
            Description = dto.Description.Trim(),
            IssueType = dto.IssueType,
            Priority = dto.Priority,
            TargetContentId = dto.TargetContentId,
            TargetContentType = dto.TargetContentType,
            TargetContentTitle = dto.TargetContentTitle,
            TargetContentRoute = dto.TargetContentRoute ?? $"/management/content-manager/issues",
            ReportedBy = dto.ReportedBy,
            SupportTicketId = dto.SupportTicketId,
            SupportStaffName = dto.SupportStaffName ?? "Hệ thống tiếp nhận",
            Status = "NEW",
            CreatedAt = now,
            UpdatedAt = now
        };

        var activity = new ContentIssueActivityEntity
        {
            Id = Guid.NewGuid(),
            ContentIssueId = issue.Id,
            ActorName = issue.SupportStaffName,
            ActorRole = "SUPPORT",
            Action = $"Tiếp nhận phản ánh từ học viên '{dto.ReportedBy}' và tạo báo cáo lỗi học liệu ({code}).",
            CreatedAt = now,
            UpdatedAt = now
        };
        _dbContext.ContentIssueActivities.Add(activity);
        issue.Activities.Add(activity);

        _dbContext.ContentIssues.Add(issue);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created new Content Issue {IssueCode}", issue.IssueCode);
        return MapToDto(issue);
    }

    public async Task<ContentIssueDto> AssignToContentManagerAsync(Guid id, Guid contentManagerId, string contentManagerName, CancellationToken cancellationToken = default)
    {
        var issue = await _dbContext.ContentIssues
            .Include(i => i.Activities)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

        if (issue == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy báo cáo lỗi học liệu với ID: {id}");
        }

        var now = DateTime.UtcNow;
        issue.ContentManagerId = contentManagerId;
        issue.ContentManagerName = contentManagerName;
        issue.Status = issue.Status == "NEW" ? "TRIAGED" : issue.Status;
        issue.UpdatedAt = now;

        var activity = new ContentIssueActivityEntity
        {
            Id = Guid.NewGuid(),
            ContentIssueId = issue.Id,
            ActorName = contentManagerName,
            ActorRole = "CONTENT_MANAGER",
            Action = $"Tiếp nhận phụ trách xử lý báo cáo lỗi: {contentManagerName}.",
            CreatedAt = now,
            UpdatedAt = now
        };
        _dbContext.ContentIssueActivities.Add(activity);
        issue.Activities.Add(activity);

        await _dbContext.SaveChangesAsync(cancellationToken);
        return MapToDto(issue);
    }

    public async Task<ContentIssueDto> ResolveIssueAsync(Guid id, ResolveContentIssueDto dto, string actorName, CancellationToken cancellationToken = default)
    {
        var issue = await _dbContext.ContentIssues
            .Include(i => i.Activities)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

        if (issue == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy báo cáo lỗi học liệu với ID: {id}");
        }

        var now = DateTime.UtcNow;
        issue.Status = "RESOLVED";
        issue.ResolutionNotes = dto.Notes;
        issue.FeedbackToSupport = dto.Feedback;
        issue.ResolvedAt = now;
        issue.UpdatedAt = now;

        var activity = new ContentIssueActivityEntity
        {
            Id = Guid.NewGuid(),
            ContentIssueId = issue.Id,
            ActorName = actorName,
            ActorRole = "CONTENT_MANAGER",
            Action = $"Đã xử lý xong lỗi học liệu. Ghi chú: {dto.Notes}",
            Message = dto.Feedback,
            CreatedAt = now,
            UpdatedAt = now
        };
        _dbContext.ContentIssueActivities.Add(activity);
        issue.Activities.Add(activity);

        // Cross-portal SQL Sync: Update linked Support Ticket in SQL Server
        if (issue.SupportTicketId.HasValue)
        {
            var ticket = await _dbContext.SupportTickets
                .Include(t => t.Messages)
                .Include(t => t.History)
                .FirstOrDefaultAsync(t => t.Id == issue.SupportTicketId.Value, cancellationToken);

            if (ticket != null)
            {
                ticket.Status = "RESOLVED";
                ticket.UpdatedAt = now;

                var msg = new SupportTicketMessageEntity
                {
                    Id = Guid.NewGuid(),
                    TicketId = ticket.Id,
                    SenderName = actorName,
                    SenderRole = "CONTENT_MANAGER",
                    Message = $"Ban Quản lý học liệu đã khắc phục lỗi [{issue.IssueCode}]: {dto.Notes}. Phản hồi: {dto.Feedback}",
                    IsInternal = false,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                _dbContext.SupportTicketMessages.Add(msg);
                ticket.Messages.Add(msg);

                var history = new SupportTicketHistoryEntity
                {
                    Id = Guid.NewGuid(),
                    TicketId = ticket.Id,
                    ActorName = actorName,
                    ActorRole = "CONTENT_MANAGER",
                    Action = $"Lỗi học liệu [{issue.IssueCode}] đã được Content Manager giải quyết thành công.",
                    Timestamp = now,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                _dbContext.SupportTicketHistories.Add(history);
                ticket.History.Add(history);
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Resolved Content Issue {IssueCode} and synchronized with Support Ticket", issue.IssueCode);
        return MapToDto(issue);
    }

    public async Task<ContentIssueDto> ReopenIssueAsync(Guid id, ReopenContentIssueDto dto, string actorName, CancellationToken cancellationToken = default)
    {
        var issue = await _dbContext.ContentIssues
            .Include(i => i.Activities)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

        if (issue == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy báo cáo lỗi học liệu với ID: {id}");
        }

        var now = DateTime.UtcNow;
        issue.Status = "REOPENED";
        issue.UpdatedAt = now;

        var activity = new ContentIssueActivityEntity
        {
            Id = Guid.NewGuid(),
            ContentIssueId = issue.Id,
            ActorName = actorName,
            ActorRole = "SUPPORT",
            Action = $"Mở lại báo cáo lỗi. Lý do: {dto.Reason}",
            CreatedAt = now,
            UpdatedAt = now
        };
        _dbContext.ContentIssueActivities.Add(activity);
        issue.Activities.Add(activity);

        await _dbContext.SaveChangesAsync(cancellationToken);
        return MapToDto(issue);
    }

    public async Task<ContentIssueDto> CloseIssueAsync(Guid id, string actorName, CancellationToken cancellationToken = default)
    {
        var issue = await _dbContext.ContentIssues
            .Include(i => i.Activities)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

        if (issue == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy báo cáo lỗi học liệu với ID: {id}");
        }

        var now = DateTime.UtcNow;
        issue.Status = "CLOSED";
        issue.ClosedAt = now;
        issue.UpdatedAt = now;

        var activity = new ContentIssueActivityEntity
        {
            Id = Guid.NewGuid(),
            ContentIssueId = issue.Id,
            ActorName = actorName,
            ActorRole = "SUPPORT",
            Action = "Đóng hoàn toàn báo cáo lỗi sau khi xác nhận xử lý thành công.",
            CreatedAt = now,
            UpdatedAt = now
        };
        _dbContext.ContentIssueActivities.Add(activity);
        issue.Activities.Add(activity);

        // Sync with Support Ticket
        if (issue.SupportTicketId.HasValue)
        {
            var ticket = await _dbContext.SupportTickets.FirstOrDefaultAsync(t => t.Id == issue.SupportTicketId.Value, cancellationToken);
            if (ticket != null)
            {
                ticket.Status = "CLOSED";
                ticket.ClosedAt = now;
                ticket.UpdatedAt = now;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return MapToDto(issue);
    }

    private static ContentIssueDto MapToDto(ContentIssueEntity entity)
    {
        return new ContentIssueDto
        {
            Id = entity.Id,
            IssueCode = entity.IssueCode,
            Title = entity.Title,
            Description = entity.Description,
            IssueType = entity.IssueType,
            Priority = entity.Priority,
            TargetContentId = entity.TargetContentId,
            TargetContentType = entity.TargetContentType,
            TargetContentTitle = entity.TargetContentTitle,
            TargetContentRoute = entity.TargetContentRoute,
            ReportedBy = entity.ReportedBy,
            SupportTicketId = entity.SupportTicketId,
            SupportStaffName = entity.SupportStaffName,
            ContentManagerId = entity.ContentManagerId,
            ContentManagerName = entity.ContentManagerName,
            Status = entity.Status,
            ResolvedAt = entity.ResolvedAt,
            ClosedAt = entity.ClosedAt,
            ResolutionNotes = entity.ResolutionNotes,
            FeedbackToSupport = entity.FeedbackToSupport,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt ?? entity.CreatedAt,
            History = entity.Activities
                .OrderBy(a => a.CreatedAt)
                .Select(a => new ContentIssueActivityDto
                {
                    Id = a.Id,
                    ActorName = a.ActorName,
                    ActorRole = a.ActorRole,
                    Action = a.Action,
                    Message = a.Message,
                    Timestamp = a.CreatedAt
                })
                .ToList()
        };
    }
}
