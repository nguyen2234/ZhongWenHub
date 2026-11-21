using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;
using ZhongWenHub.Business.Admin.DTOs;
using ZhongWenHub.Business.Admin.Services;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Content.DTOs;
using ZhongWenHub.Business.Support.DTOs;
using ZhongWenHub.Business.Users.DTOs;
using ZhongWenHub.Data.Constants;

namespace ZhongWenHub.IntegrationTests;

[Collection("IntegrationTests")]
public class SupportTicketsAndAiProvidersIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public SupportTicketsAndAiProvidersIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> LoginAndGetTokenAsync(string email, string password)
    {
        var loginPayload = new { usernameOrEmail = email, password = password };
        var res = await _client.PostAsJsonAsync("/api/v1/auth/login", loginPayload);
        res.EnsureSuccessStatusCode();

        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("accessToken").GetString()!;
    }

    [Fact]
    public async Task SupportTickets_CreateAndQueryMyReports_Succeeds()
    {
        // 1. Login as Student
        var studentToken = await LoginAndGetTokenAsync("student@zhongwenhub.edu.vn", "StudentPassword123!");
        using var studentRequest = new HttpRequestMessage(HttpMethod.Post, "/api/v1/support/tickets");
        studentRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        studentRequest.Content = JsonContent.Create(new CreateTicketRequestDto
        {
            Subject = "Lỗi phát âm bài 3 HSK 2",
            Description = "Âm thanh câu số 4 không phát được khi bấm nút loa.",
            Category = "CONTENT",
            Priority = "HIGH",
            ContextModule = "LESSON_AUDIO",
            ContextUrl = "/lesson/hsk2-les-03"
        });

        var createRes = await _client.SendAsync(studentRequest);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);

        var createdTicket = await createRes.Content.ReadFromJsonAsync<TicketDetailDto>();
        Assert.NotNull(createdTicket);
        Assert.StartsWith("TICK-", createdTicket.TicketNumber);
        Assert.Equal("Lỗi phát âm bài 3 HSK 2", createdTicket.Subject);
        Assert.Equal("CONTENT", createdTicket.Category);
        Assert.Equal("HIGH", createdTicket.Priority);
        Assert.Equal("NEW", createdTicket.Status);
        Assert.False(createdTicket.IsOverdue);

        // 2. Query My Reports
        using var myReportsReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/support/tickets/my-reports");
        myReportsReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var myReportsRes = await _client.SendAsync(myReportsReq);
        Assert.Equal(HttpStatusCode.OK, myReportsRes.StatusCode);

        var myReports = await myReportsRes.Content.ReadFromJsonAsync<PagedResponse<TicketSummaryDto>>();
        Assert.NotNull(myReports);
        Assert.Contains(myReports.Items, t => t.Id == createdTicket.Id);
    }

    [Fact]
    public async Task SupportTickets_IdorGuard_BlocksOtherStudentsFromViewingOrReplying()
    {
        // 1. Student creates ticket
        var studentToken = await LoginAndGetTokenAsync("student@zhongwenhub.edu.vn", "StudentPassword123!");
        using var createReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/support/tickets");
        createReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        createReq.Content = JsonContent.Create(new CreateTicketRequestDto
        {
            Subject = "Vấn đề tài khoản bí mật của Student",
            Description = "Chi tiết riêng tư không được chia sẻ.",
            Category = "ACCOUNT",
            Priority = "MEDIUM"
        });
        var createRes = await _client.SendAsync(createReq);
        var ticket = await createRes.Content.ReadFromJsonAsync<TicketDetailDto>();
        Assert.NotNull(ticket);

        // 2. Teacher (non-staff, different user) attempts to view ticket -> 403 Forbidden
        var teacherToken = await LoginAndGetTokenAsync("teacher@zhongwenhub.edu.vn", "TeacherPassword123!");
        using var viewReq = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/support/tickets/{ticket.Id}");
        viewReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", teacherToken);
        var viewRes = await _client.SendAsync(viewReq);
        Assert.Equal(HttpStatusCode.Forbidden, viewRes.StatusCode);

        // 3. Teacher attempts to post message to student's ticket -> 403 Forbidden
        using var replyReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/support/tickets/{ticket.Id}/messages");
        replyReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", teacherToken);
        replyReq.Content = JsonContent.Create(new AddTicketMessageRequestDto
        {
            Message = "Bình luận can thiệp trái phép"
        });
        var replyRes = await _client.SendAsync(replyReq);
        Assert.Equal(HttpStatusCode.Forbidden, replyRes.StatusCode);
    }

    [Fact]
    public async Task SupportTickets_StaffWorkflow_CanAssignResolveAndEscalate()
    {
        // 1. Student creates ticket
        var studentToken = await LoginAndGetTokenAsync("student@zhongwenhub.edu.vn", "StudentPassword123!");
        using var createReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/support/tickets");
        createReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        createReq.Content = JsonContent.Create(new CreateTicketRequestDto
        {
            Subject = "Lỗi dịch nghĩa HSK 3 bài 8",
            Description = "Dịch nghĩa sai từ quả chuối thành quả lê.",
            Category = "CONTENT",
            Priority = "URGENT"
        });
        var createRes = await _client.SendAsync(createReq);
        var ticket = await createRes.Content.ReadFromJsonAsync<TicketDetailDto>();
        Assert.NotNull(ticket);

        // 2. Support staff queries all tickets and views detail
        var supportToken = await LoginAndGetTokenAsync("support@zhongwenhub.edu.vn", "SupportPassword123!");
        using var listReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/support/tickets?status=NEW");
        listReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", supportToken);
        var listRes = await _client.SendAsync(listReq);
        Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);

        // 3. Support staff replies and adds internal note
        using var staffReplyReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/support/tickets/{ticket.Id}/messages");
        staffReplyReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", supportToken);
        staffReplyReq.Content = JsonContent.Create(new AddTicketMessageRequestDto
        {
            Message = "Ghi chú nội bộ: đã kiểm tra từ điển, lỗi do nguồn HSK nhập liệu.",
            IsInternal = true
        });
        var staffReplyRes = await _client.SendAsync(staffReplyReq);
        if (staffReplyRes.StatusCode != HttpStatusCode.Created)
        {
            var err = await staffReplyRes.Content.ReadAsStringAsync();
            throw new Exception($"Staff reply failed with {staffReplyRes.StatusCode}: {err}");
        }
        Assert.Equal(HttpStatusCode.Created, staffReplyRes.StatusCode);

        // 4. Student views detail -> Internal note is hidden!
        using var studentViewReq = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/support/tickets/{ticket.Id}");
        studentViewReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var studentViewRes = await _client.SendAsync(studentViewReq);
        var studentViewTicket = await studentViewRes.Content.ReadFromJsonAsync<TicketDetailDto>();
        Assert.NotNull(studentViewTicket);
        Assert.DoesNotContain(studentViewTicket.Messages, m => m.IsInternal);

        // 5. Support escalates to Content Manager
        using var escReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/support/tickets/{ticket.Id}/escalate-content");
        escReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", supportToken);
        escReq.Content = JsonContent.Create(new EscalateContentIssueRequestDto
        {
            Note = "Chuyển tiếp kiểm duyệt nội dung HSK 3 bài 8."
        });
        var escRes = await _client.SendAsync(escReq);
        Assert.Equal(HttpStatusCode.OK, escRes.StatusCode);
        var escTicket = await escRes.Content.ReadFromJsonAsync<TicketDetailDto>();
        Assert.NotNull(escTicket);
        Assert.NotNull(escTicket.ContentIssueId);
        Assert.StartsWith("ISS-", escTicket.ContentIssueId);

        // 6. Support updates status to RESOLVED
        using var statusReq = new HttpRequestMessage(HttpMethod.Patch, $"/api/v1/support/tickets/{ticket.Id}/status");
        statusReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", supportToken);
        statusReq.Content = JsonContent.Create(new UpdateTicketStatusRequestDto
        {
            Status = "RESOLVED",
            Note = "Đã chỉnh sửa nội dung bài học xong."
        });
        var statusRes = await _client.SendAsync(statusReq);
        Assert.Equal(HttpStatusCode.OK, statusRes.StatusCode);

        // 7. Student can reopen resolved ticket
        using var reopenReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/support/tickets/{ticket.Id}/reopen");
        reopenReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var reopenRes = await _client.SendAsync(reopenReq);
        Assert.Equal(HttpStatusCode.OK, reopenRes.StatusCode);
        var reopenedTicket = await reopenRes.Content.ReadFromJsonAsync<TicketDetailDto>();
        Assert.NotNull(reopenedTicket);
        Assert.Equal("IN_PROGRESS", reopenedTicket.Status);
    }

    [Fact]
    public async Task AiProviders_AdminOnlyAndSsrfGuard_Enforced()
    {
        var adminToken = await LoginAndGetTokenAsync("admin@gmail.com", "admin");

        // 1. Admin gets providers list
        using var listReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/operations/ai-providers");
        listReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var listRes = await _client.SendAsync(listReq);
        Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);
        var providers = await listRes.Content.ReadFromJsonAsync<List<AiProviderConfigDto>>();
        Assert.NotNull(providers);
        Assert.NotEmpty(providers);
        Assert.Contains(providers, p => p.ProviderCode == "gemini");
        Assert.All(providers, p => Assert.Contains("****", p.MaskedApiKey)); // Never raw key

        // 2. Non-admin is blocked with 403
        var studentToken = await LoginAndGetTokenAsync("student@zhongwenhub.edu.vn", "StudentPassword123!");
        using var studentReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/operations/ai-providers");
        studentReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var studentRes = await _client.SendAsync(studentReq);
        Assert.Equal(HttpStatusCode.Forbidden, studentRes.StatusCode);

        // 3. SSRF guard rejects link-local metadata address
        using var ssrfReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/admin/operations/ai-providers");
        ssrfReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        ssrfReq.Content = JsonContent.Create(new CreateAiProviderDto
        {
            ProviderCode = "malicious-internal",
            DisplayName = "SSRF Probe",
            BaseUrl = "https://169.254.169.254/latest/meta-data",
            ApiKey = "secret12345678"
        });
        var ssrfRes = await _client.SendAsync(ssrfReq);
        Assert.Equal(HttpStatusCode.BadRequest, ssrfRes.StatusCode);

        // 4. Admin creates valid custom provider
        var customCode = "custom-" + Guid.NewGuid().ToString("N")[..6];
        using var createReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/admin/operations/ai-providers");
        createReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        createReq.Content = JsonContent.Create(new CreateAiProviderDto
        {
            ProviderCode = customCode,
            DisplayName = "Custom Pedagogical Model",
            BaseUrl = "https://generativelanguage.googleapis.com",
            ModelNames = new List<string> { "custom-model-v1" },
            ApiKey = "AIzaSyCustomKeyValid123456",
            MonthlyBudgetUsd = 200.00m,
            RateLimitPerMinute = 100
        });
        var createRes = await _client.SendAsync(createReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var created = await createRes.Content.ReadFromJsonAsync<AiProviderConfigDto>();
        Assert.NotNull(created);
        Assert.Equal(customCode, created.ProviderCode);
        Assert.Contains("****", created.MaskedApiKey);

        // 5. Admin toggles provider
        using var toggleReq = new HttpRequestMessage(HttpMethod.Patch, $"/api/v1/admin/operations/ai-providers/{created.Id}/toggle");
        toggleReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        toggleReq.Content = JsonContent.Create(new ToggleAiProviderDto { IsEnabled = false });
        var toggleRes = await _client.SendAsync(toggleReq);
        Assert.Equal(HttpStatusCode.OK, toggleRes.StatusCode);
        var toggled = await toggleRes.Content.ReadFromJsonAsync<AiProviderConfigDto>();
        Assert.NotNull(toggled);
        Assert.False(toggled.IsEnabled);
    }

    [Fact]
    public async Task ApiRegistry_AdminCanRetrieveInventory_ReturnsNonEmptyRoutes()
    {
        var adminToken = await LoginAndGetTokenAsync("admin@gmail.com", "admin");

        using var req = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/operations/api-registry");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var res = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        var registry = await res.Content.ReadFromJsonAsync<List<ApiRegistryItemDto>>();
        Assert.NotNull(registry);
        Assert.NotEmpty(registry);
        Assert.Contains(registry, r => r.RoutePath.Contains("support/tickets"));
        Assert.Contains(registry, r => r.RoutePath.Contains("admin/users"));
    }

    [Fact]
    public async Task ContentIssues_FullCrossPortalFlow_StudentToSupportToContentManager_PersistedInSql()
    {
        // 1. Student creates support ticket
        var studentToken = await LoginAndGetTokenAsync("student@zhongwenhub.edu.vn", "StudentPassword123!");
        using var createTicketReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/support/tickets");
        createTicketReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        createTicketReq.Content = JsonContent.Create(new CreateTicketRequestDto
        {
            Subject = "Sai pinyin bài 12 HSK 3",
            Description = "Từ '银行' pinyin ghi là yíngháng nhưng hệ thống đọc là yínxíng.",
            Category = "CONTENT",
            Priority = "HIGH",
            ContextModule = "CURRICULUM_LESSON",
            ContextUrl = "/lesson/hsk3-les-12"
        });
        var createTicketRes = await _client.SendAsync(createTicketReq);
        Assert.Equal(HttpStatusCode.Created, createTicketRes.StatusCode);
        var ticket = await createTicketRes.Content.ReadFromJsonAsync<TicketDetailDto>();
        Assert.NotNull(ticket);

        // 2. Support Staff escalates to Content Manager
        var supportToken = await LoginAndGetTokenAsync("support@zhongwenhub.edu.vn", "SupportPassword123!");
        using var escReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/support/tickets/{ticket.Id}/escalate-content");
        escReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", supportToken);
        escReq.Content = JsonContent.Create(new EscalateContentIssueRequestDto
        {
            Note = "Chuyển tiếp lỗi đa âm yíngháng sang ban học liệu kiểm tra."
        });
        var escRes = await _client.SendAsync(escReq);
        Assert.Equal(HttpStatusCode.OK, escRes.StatusCode);
        var escTicket = await escRes.Content.ReadFromJsonAsync<TicketDetailDto>();
        Assert.NotNull(escTicket);
        Assert.NotNull(escTicket.ContentIssueId);
        Assert.StartsWith("ISS-", escTicket.ContentIssueId);

        // 3. Content Manager (Admin) retrieves issues list from SQL Server
        var adminToken = await LoginAndGetTokenAsync("admin@gmail.com", "admin");
        using var getIssuesReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/content-manager/issues");
        getIssuesReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var getIssuesRes = await _client.SendAsync(getIssuesReq);
        Assert.Equal(HttpStatusCode.OK, getIssuesRes.StatusCode);
        var issues = await getIssuesRes.Content.ReadFromJsonAsync<List<ContentIssueDto>>();
        Assert.NotNull(issues);
        var matchedIssue = issues.FirstOrDefault(i => i.IssueCode == escTicket.ContentIssueId);
        Assert.NotNull(matchedIssue);
        Assert.Equal("NEW", matchedIssue.Status);
        Assert.Equal(ticket.Id, matchedIssue.SupportTicketId);

        // 4. Content Manager assigns to themselves
        using var assignReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/content-manager/issues/{matchedIssue.Id}/assign");
        assignReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        assignReq.Content = JsonContent.Create(new AssignContentIssueDto { ContentManagerName = "Nguyễn Văn Minh (Content Manager)" });
        var assignRes = await _client.SendAsync(assignReq);
        if (assignRes.StatusCode != HttpStatusCode.OK)
        {
            var err = await assignRes.Content.ReadAsStringAsync();
            throw new Exception($"Assign failed with {assignRes.StatusCode}: {err}");
        }
        Assert.Equal(HttpStatusCode.OK, assignRes.StatusCode);
        var assignedIssue = await assignRes.Content.ReadFromJsonAsync<ContentIssueDto>();
        Assert.NotNull(assignedIssue);
        Assert.Equal("TRIAGED", assignedIssue.Status);

        // 5. Content Manager resolves issue with notes and feedback
        using var resolveReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/content-manager/issues/{matchedIssue.Id}/resolve");
        resolveReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        resolveReq.Content = JsonContent.Create(new ResolveContentIssueDto
        {
            Notes = "Đã sửa pinyin thành yínháng chuẩn đa âm và cập nhật file audio tương ứng.",
            Feedback = "Cảm ơn bạn đã phản ánh, dữ liệu từ vựng bài 12 đã được cập nhật thành công."
        });
        var resolveRes = await _client.SendAsync(resolveReq);
        Assert.Equal(HttpStatusCode.OK, resolveRes.StatusCode);
        var resolvedIssue = await resolveRes.Content.ReadFromJsonAsync<ContentIssueDto>();
        Assert.NotNull(resolvedIssue);
        Assert.Equal("RESOLVED", resolvedIssue.Status);

        // 6. Student checks their ticket -> It is RESOLVED and contains Content Manager resolution message!
        using var checkTicketReq = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/support/tickets/{ticket.Id}");
        checkTicketReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var checkTicketRes = await _client.SendAsync(checkTicketReq);
        Assert.Equal(HttpStatusCode.OK, checkTicketRes.StatusCode);
        var updatedTicket = await checkTicketRes.Content.ReadFromJsonAsync<TicketDetailDto>();
        Assert.NotNull(updatedTicket);
        Assert.Equal("RESOLVED", updatedTicket.Status);
        Assert.Contains(updatedTicket.Messages, m => m.Message.Contains("Ban Quản lý học liệu đã khắc phục lỗi"));
    }

    [Fact]
    public async Task Admin_UpdateRolePermissions_PersistedInSql()
    {
        var adminToken = await LoginAndGetTokenAsync("admin@gmail.com", "admin");

        // 1. Get initial roles
        using var getRolesReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/users/roles");
        getRolesReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var getRolesRes = await _client.SendAsync(getRolesReq);
        Assert.Equal(HttpStatusCode.OK, getRolesRes.StatusCode);
        var roles = await getRolesRes.Content.ReadFromJsonAsync<List<AdminRoleItemDto>>();
        Assert.NotNull(roles);
        var teacherRole = roles.FirstOrDefault(r => r.Name == RoleConstants.Teacher);
        Assert.NotNull(teacherRole);

        // 2. Update TEACHER role permissions
        var newPermissions = new List<string>
        {
            "class:create", "class:manage", "assignment:grade", "attendance:record", "teacher:analytics"
        };
        using var updatePermsReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/admin/users/roles/{RoleConstants.Teacher}/permissions");
        updatePermsReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        updatePermsReq.Content = JsonContent.Create(new UpdateRolePermissionsDto { Permissions = newPermissions });
        var updatePermsRes = await _client.SendAsync(updatePermsReq);
        Assert.Equal(HttpStatusCode.OK, updatePermsRes.StatusCode);

        // 3. Retrieve roles again and confirm updated permissions
        using var verifyRolesReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/users/roles");
        verifyRolesReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var verifyRolesRes = await _client.SendAsync(verifyRolesReq);
        Assert.Equal(HttpStatusCode.OK, verifyRolesRes.StatusCode);
        var verifiedRoles = await verifyRolesRes.Content.ReadFromJsonAsync<List<AdminRoleItemDto>>();
        Assert.NotNull(verifiedRoles);
        var verifiedTeacherRole = verifiedRoles.FirstOrDefault(r => r.Name == RoleConstants.Teacher);
        Assert.NotNull(verifiedTeacherRole);
        Assert.All(newPermissions, p => Assert.Contains(p, verifiedTeacherRole.Permissions));
    }

    [Fact]
    public async Task ContentManager_CannotAccess_SupportGlobalInbox_Returns403()
    {
        var cmToken = await LoginAndGetTokenAsync("contentmanager@zhongwenhub.edu.vn", "ContentManager123!");
        using var req = new HttpRequestMessage(HttpMethod.Get, "/api/v1/support/tickets?page=1&pageSize=10");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", cmToken);
        var res = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task Support_CannotAssignOrResolve_ContentIssues_Returns403()
    {
        var supportToken = await LoginAndGetTokenAsync("support@zhongwenhub.edu.vn", "SupportPassword123!");
        var dummyId = Guid.NewGuid();

        // 1. Assign attempt
        using var assignReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/content-manager/issues/{dummyId}/assign");
        assignReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", supportToken);
        assignReq.Content = JsonContent.Create(new AssignContentIssueDto { ContentManagerName = "Support Staff" });
        var assignRes = await _client.SendAsync(assignReq);
        Assert.Equal(HttpStatusCode.Forbidden, assignRes.StatusCode);

        // 2. Resolve attempt
        using var resolveReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/content-manager/issues/{dummyId}/resolve");
        resolveReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", supportToken);
        resolveReq.Content = JsonContent.Create(new ResolveContentIssueDto { Notes = "Note", Feedback = "Feedback" });
        var resolveRes = await _client.SendAsync(resolveReq);
        Assert.Equal(HttpStatusCode.Forbidden, resolveRes.StatusCode);
    }

    [Fact]
    public async Task Admin_CannotRevokeCriticalPermissions_Returns400()
    {
        var adminToken = await LoginAndGetTokenAsync("admin@gmail.com", "admin");

        // Attempt to remove ADMIN_ACCESS and USER_ROLE_ASSIGN from ADMIN role
        using var req = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/admin/users/roles/{RoleConstants.Admin}/permissions");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        req.Content = JsonContent.Create(new UpdateRolePermissionsDto
        {
            Permissions = new List<string> { "USER_VIEW" } // Missing ADMIN_ACCESS and USER_ROLE_ASSIGN
        });

        var res = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task ContentIssues_DualRouting_BothEndpointsWork()
    {
        var adminToken = await LoginAndGetTokenAsync("admin@gmail.com", "admin");

        // 1. Primary route: /api/v1/content-manager/issues
        using var req1 = new HttpRequestMessage(HttpMethod.Get, "/api/v1/content-manager/issues");
        req1.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var res1 = await _client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.OK, res1.StatusCode);

        // 2. Secondary alias route: /api/v1/content/issues
        using var req2 = new HttpRequestMessage(HttpMethod.Get, "/api/v1/content/issues");
        req2.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var res2 = await _client.SendAsync(req2);
        Assert.Equal(HttpStatusCode.OK, res2.StatusCode);
    }

    [Fact]
    public async Task SupportTicket_AssignWithRealStaffGuid_AndRetrieveWithCanonicalGuid()
    {
        // 1. Student creates ticket
        var studentToken = await LoginAndGetTokenAsync("student@zhongwenhub.edu.vn", "StudentPassword123!");
        using var createReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/support/tickets");
        createReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        createReq.Content = JsonContent.Create(new CreateTicketRequestDto
        {
            Subject = "Kiểm tra gán nhân viên bằng GUID",
            Description = "Mô tả kiểm thử gán nhân sự hỗ trợ chính xác theo Guid",
            Category = "TECHNICAL",
            Priority = "MEDIUM"
        });
        var createRes = await _client.SendAsync(createReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var created = await createRes.Content.ReadFromJsonAsync<TicketDetailDto>();
        Assert.NotNull(created);
        Assert.NotEqual(Guid.Empty, created.Id);
        Assert.False(string.IsNullOrWhiteSpace(created.TicketNumber));

        // 2. Support assigns ticket to real staff user
        var supportToken = await LoginAndGetTokenAsync("support@zhongwenhub.edu.vn", "SupportPassword123!");
        var realStaffGuid = Guid.Parse("2f0e465e-4c87-4729-9043-e1280a38a181");
        using var assignReq = new HttpRequestMessage(HttpMethod.Patch, $"/api/v1/support/tickets/{created.Id}/assign");
        assignReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", supportToken);
        assignReq.Content = JsonContent.Create(new AssignTicketRequestDto { AssigneeId = realStaffGuid });
        var assignRes = await _client.SendAsync(assignReq);
        Assert.Equal(HttpStatusCode.OK, assignRes.StatusCode);
        var assigned = await assignRes.Content.ReadFromJsonAsync<TicketDetailDto>();
        Assert.NotNull(assigned);
        Assert.Equal(realStaffGuid, assigned.AssigneeId);

        // 3. Support retrieves ticket by canonical GUID
        using var getReq = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/support/tickets/{created.Id}");
        getReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", supportToken);
        var getRes = await _client.SendAsync(getReq);
        Assert.Equal(HttpStatusCode.OK, getRes.StatusCode);
        var retrieved = await getRes.Content.ReadFromJsonAsync<TicketDetailDto>();
        Assert.NotNull(retrieved);
        Assert.Equal(created.Id, retrieved.Id);
        Assert.Equal(created.TicketNumber, retrieved.TicketNumber);
        Assert.Equal(realStaffGuid, retrieved.AssigneeId);
    }

    [Fact]
    public void AiProvider_AesGcm_Encryption_And_TamperProof()
    {
        var secret = "MyMasterSecretKeyForAesGcmTesting123!";
        var rawKey = "AIzaSySecretApiKeyForGeminiTesting987";

        // 1. Encrypt produces v2: format
        var encrypted = AiProviderConfigService.EncryptSecret(rawKey, secret);
        Assert.StartsWith("v2:", encrypted);

        // 2. Decrypt restores raw key
        var decrypted = AiProviderConfigService.DecryptSecret(encrypted, secret);
        Assert.Equal(rawKey, decrypted);

        // 3. Tamper detection: modifying tag or ciphertext causes failure
        var parts = encrypted.Split(':');
        var tamperedCipherBytes = Convert.FromBase64String(parts[3]);
        tamperedCipherBytes[0] ^= 0xFF; // Flip bit
        var tamperedEncrypted = $"{parts[0]}:{parts[1]}:{parts[2]}:{Convert.ToBase64String(tamperedCipherBytes)}";
        Assert.ThrowsAny<CryptographicException>(() => AiProviderConfigService.DecryptSecret(tamperedEncrypted, secret));

        // 4. Backward compatibility: v1: format is still decryptable
        using var aes = Aes.Create();
        aes.Key = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(secret));
        aes.GenerateIV();
        using var enc = aes.CreateEncryptor(aes.Key, aes.IV);
        var pBytes = System.Text.Encoding.UTF8.GetBytes(rawKey);
        var cBytes = enc.TransformFinalBlock(pBytes, 0, pBytes.Length);
        var v1Payload = $"v1:{Convert.ToBase64String(aes.IV)}:{Convert.ToBase64String(cBytes)}";

        var v1Decrypted = AiProviderConfigService.DecryptSecret(v1Payload, secret);
        Assert.Equal(rawKey, v1Decrypted);
    }
}
