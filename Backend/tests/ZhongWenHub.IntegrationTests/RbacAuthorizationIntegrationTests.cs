using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ZhongWenHub.Business.Authentication.DTOs;
using ZhongWenHub.Business.Common.DTOs;

namespace ZhongWenHub.IntegrationTests;

public class RbacAuthorizationIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public RbacAuthorizationIntegrationTests(CustomWebApplicationFactory factory)
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
    public async Task Student_AccessAdminEndpoint_Returns403ForbiddenProblemDetails()
    {
        var token = await GetTokenForUserAsync("student@zhongwenhub.edu.vn", "StudentPassword123!");

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/system/admin-test");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ApiProblemDetailsDto>(_jsonOptions);
        Assert.NotNull(problem);
        Assert.Equal(403, problem.Status);
    }

    [Fact]
    public async Task Admin_AccessAdminEndpoint_Returns200Ok()
    {
        var token = await GetTokenForUserAsync("admin@zhongwenhub.edu.vn", "AdminPassword123!");

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/system/admin-test");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Admin_AccessSuperAdminEndpoint_Returns403Forbidden()
    {
        var token = await GetTokenForUserAsync("admin@zhongwenhub.edu.vn", "AdminPassword123!");

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/system/superadmin-test");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task SuperAdmin_AccessSuperAdminEndpoint_Returns200Ok()
    {
        var token = await GetTokenForUserAsync("superadmin@zhongwenhub.edu.vn", "SuperAdmin123!");

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/system/superadmin-test");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ContentManager_AccessContentManagerEndpoint_Returns200Ok()
    {
        var token = await GetTokenForUserAsync("contentmanager@zhongwenhub.edu.vn", "ContentManager123!");

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/system/content-manager-test");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Teacher_AccessTeacherEndpoint_Returns200Ok()
    {
        var token = await GetTokenForUserAsync("teacher@zhongwenhub.edu.vn", "TeacherPassword123!");

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/system/teacher-test");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Support_AccessSupportEndpoint_Returns200Ok()
    {
        var token = await GetTokenForUserAsync("support@zhongwenhub.edu.vn", "SupportPassword123!");

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/system/support-test");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
