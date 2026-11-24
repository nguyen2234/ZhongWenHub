using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;
using ZhongWenHub.Api.Features.Support.DTOs;
using ZhongWenHub.Features.Auth.DTOs;

namespace ZhongWenHub.IntegrationTests;

[Trait("Category", "Integration")]
public class SupportIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public SupportIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<string> GetTokenForUserAsync(string email, string password)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto
        {
            UsernameOrEmail = email,
            Password = password
        });

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        return body!.AccessToken;
    }

    [Fact]
    public async Task SupportStaff_CanQueryTicketsAndMetrics()
    {
        var token = await GetTokenForUserAsync("support@zhongwenhub.edu.vn", "SupportPassword123!");

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/support/tickets");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var tickets = await response.Content.ReadFromJsonAsync<List<SupportTicketDto>>(_jsonOptions);
        Assert.NotNull(tickets);

        using var metricsReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/support/metrics");
        metricsReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var metricsRes = await _client.SendAsync(metricsReq);
        Assert.Equal(HttpStatusCode.OK, metricsRes.StatusCode);

        var metrics = await metricsRes.Content.ReadFromJsonAsync<SupportMetricsDto>(_jsonOptions);
        Assert.NotNull(metrics);
        Assert.True(metrics.Total >= 0);
    }

    [Fact]
    public async Task Student_CanCreateTicket_AndSupportCanManageIt()
    {
        var studentToken = await GetTokenForUserAsync("student@zhongwenhub.edu.vn", "StudentPassword123!");
        var supportToken = await GetTokenForUserAsync("support@zhongwenhub.edu.vn", "SupportPassword123!");

        // Student creates ticket
        var createDto = new CreateSupportTicketDto
        {
            Subject = "Cần trợ giúp bài học HSK 3",
            Description = "Giải thích câu chữ Ba chưa rõ",
            Category = "CONTENT",
            Priority = "HIGH"
        };

        using var createReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/support/tickets")
        {
            Content = JsonContent.Create(createDto)
        };
        createReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);

        var createRes = await _client.SendAsync(createReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);

        var created = await createRes.Content.ReadFromJsonAsync<SupportTicketDto>(_jsonOptions);
        Assert.NotNull(created);
        Assert.NotEmpty(created.TicketNumber);

        // Support adds note/message
        var msgDto = new AddTicketMessageDto
        {
            Content = "Đã tiếp nhận yêu cầu từ học viên",
            IsInternal = true
        };
        using var msgReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/support/tickets/{created.TicketNumber}/messages")
        {
            Content = JsonContent.Create(msgDto)
        };
        msgReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", supportToken);

        var msgRes = await _client.SendAsync(msgReq);
        Assert.Equal(HttpStatusCode.OK, msgRes.StatusCode);

        var updated = await msgRes.Content.ReadFromJsonAsync<SupportTicketDto>(_jsonOptions);
        Assert.NotNull(updated);
        Assert.Contains(updated.Notes, n => n.Content == "Đã tiếp nhận yêu cầu từ học viên");
    }

    [Fact]
    public async Task Student_AccessSupportAdminEndpoints_Returns403Forbidden()
    {
        var studentToken = await GetTokenForUserAsync("student@zhongwenhub.edu.vn", "StudentPassword123!");

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/support/tickets");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
