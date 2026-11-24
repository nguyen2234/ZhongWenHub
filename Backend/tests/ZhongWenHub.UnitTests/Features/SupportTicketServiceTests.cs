using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ZhongWenHub.Data.Persistence;
using ZhongWenHub.Api.Features.Support.DTOs;
using ZhongWenHub.Models.Support;
using ZhongWenHub.Api.Features.Support.Services;

namespace ZhongWenHub.Tests.Features;

public class SupportTicketServiceTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task CreateTicketAsync_PersistsTicketAndCreatesHistory()
    {
        using var db = CreateInMemoryDbContext();
        var service = new SupportTicketService(db);

        var reporterId = Guid.NewGuid();
        var dto = new CreateSupportTicketDto
        {
            Subject = "Test Subject",
            Description = "Test Description",
            Category = "CONTENT",
            Priority = "HIGH"
        };

        var result = await service.CreateTicketAsync(reporterId, "Test Student", "student@test.com", "STUDENT", dto);

        Assert.NotNull(result);
        Assert.StartsWith("TICK-", result.TicketNumber);
        Assert.Equal("Test Subject", result.Subject);
        Assert.Equal("NEW", result.Status);
        Assert.Single(result.History);
        Assert.Equal("Tạo vé hỗ trợ.", result.History[0].Action);
    }

    [Fact]
    public async Task UpdateStatusAsync_ChangesStatusAndAddsHistoryAndMessage()
    {
        using var db = CreateInMemoryDbContext();
        var service = new SupportTicketService(db);

        var reporterId = Guid.NewGuid();
        var created = await service.CreateTicketAsync(reporterId, "Student", "s@test.com", "STUDENT", new CreateSupportTicketDto
        {
            Subject = "Need help",
            Description = "Details",
            Category = "ACCOUNT"
        });

        var actorId = Guid.NewGuid();
        var updateDto = new UpdateTicketStatusDto
        {
            Status = "IN_PROGRESS",
            Note = "Support is looking into this."
        };

        var updated = await service.UpdateStatusAsync(created.TicketNumber, updateDto, actorId, "Support Agent", "SUPPORT");

        Assert.Equal("IN_PROGRESS", updated.Status);
        Assert.Single(updated.Notes);
        Assert.Equal("Support is looking into this.", updated.Notes[0].Content);
        Assert.Equal(2, updated.History.Count);
    }

    [Fact]
    public async Task AssignTicketAsync_UpdatesAssigneeAndStatus()
    {
        using var db = CreateInMemoryDbContext();
        var service = new SupportTicketService(db);

        var created = await service.CreateTicketAsync(Guid.NewGuid(), "Student", "s@test.com", "STUDENT", new CreateSupportTicketDto
        {
            Subject = "Billing inquiry",
            Description = "Invoice issue",
            Category = "BILLING"
        });

        var assigneeId = Guid.NewGuid();
        var assignDto = new AssignTicketDto
        {
            AssigneeId = assigneeId,
            AssigneeName = "Tran Thuy Trang"
        };

        var assigned = await service.AssignTicketAsync(created.TicketNumber, assignDto, Guid.NewGuid(), "Admin", "ADMIN");

        Assert.Equal("Tran Thuy Trang", assigned.AssigneeName);
        Assert.Equal("IN_PROGRESS", assigned.Status);
        Assert.Contains(assigned.History, h => h.Action.Contains("Tran Thuy Trang"));
    }

    [Fact]
    public async Task EscalateToContentIssueAsync_GeneratesContentIssueId()
    {
        using var db = CreateInMemoryDbContext();
        var service = new SupportTicketService(db);

        var created = await service.CreateTicketAsync(Guid.NewGuid(), "Student", "s@test.com", "STUDENT", new CreateSupportTicketDto
        {
            Subject = "Grammar error in Lesson 3",
            Description = "Typo in sentence",
            Category = "CONTENT"
        });

        var escalateDto = new EscalateContentIssueDto
        {
            TargetContentId = "lesson-3",
            TargetContentType = "LESSON",
            TargetContentTitle = "HSK 3 Lesson 3",
            Title = "Typo in sentence 4",
            Description = "Grammar point Ba sentence is wrong",
            IssueType = "GRAMMAR_ERROR",
            Priority = "URGENT",
            ReportedBy = "Student"
        };

        var escalated = await service.EscalateToContentIssueAsync(created.TicketNumber, escalateDto, Guid.NewGuid(), "Support Agent", "SUPPORT");

        Assert.NotNull(escalated.ContentIssueId);
        Assert.StartsWith("ISS-", escalated.ContentIssueId);
        Assert.Single(escalated.Notes);
        Assert.Contains("Đã chuyển tiếp lỗi học liệu", escalated.Notes[0].Content);
    }

    [Fact]
    public async Task GetMetricsAsync_ReturnsAccurateCounts()
    {
        using var db = CreateInMemoryDbContext();
        var service = new SupportTicketService(db);

        await service.CreateTicketAsync(Guid.NewGuid(), "S1", "s1@test.com", "STUDENT", new CreateSupportTicketDto
        {
            Subject = "T1",
            Description = "D1",
            Priority = "URGENT"
        });

        var t2 = await service.CreateTicketAsync(Guid.NewGuid(), "S2", "s2@test.com", "STUDENT", new CreateSupportTicketDto
        {
            Subject = "T2",
            Description = "D2",
            Priority = "LOW"
        });

        await service.UpdateStatusAsync(t2.TicketNumber, new UpdateTicketStatusDto { Status = "RESOLVED" }, Guid.NewGuid(), "Staff", "SUPPORT");

        var metrics = await service.GetMetricsAsync();

        Assert.Equal(2, metrics.Total);
        Assert.Equal(1, metrics.NewCount);
        Assert.Equal(1, metrics.Resolved);
        Assert.Equal(1, metrics.Urgent);
    }
}
