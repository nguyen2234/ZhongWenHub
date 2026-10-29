using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ZhongWenHub.Application.DTOs.Auth;
using ZhongWenHub.Application.DTOs.Common;
using ZhongWenHub.Application.DTOs.Users;

namespace ZhongWenHub.IntegrationTests;

public class AdminUsersIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public AdminUsersIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> GetAdminTokenAsync()
    {
        var loginReq = new LoginRequestDto
        {
            UsernameOrEmail = "admin@zhongwenhub.edu.vn",
            Password = "AdminPassword123!"
        };
        var res = await _client.PostAsJsonAsync("/api/v1/auth/login", loginReq);
        var body = await res.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        return body!.AccessToken;
    }

    private async Task<string> GetStudentTokenAsync()
    {
        var loginReq = new LoginRequestDto
        {
            UsernameOrEmail = "student@zhongwenhub.edu.vn",
            Password = "StudentPassword123!"
        };
        var res = await _client.PostAsJsonAsync("/api/v1/auth/login", loginReq);
        var body = await res.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        return body!.AccessToken;
    }

    [Fact]
    public async Task GetUsers_AsAdmin_Returns200WithPagedUsers()
    {
        var token = await GetAdminTokenAsync();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/users?page=1&pageSize=10");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var pagedUsers = await response.Content.ReadFromJsonAsync<PagedResponse<AdminUserListItemDto>>(_jsonOptions);
        Assert.NotNull(pagedUsers);
        Assert.NotEmpty(pagedUsers.Items);
        Assert.True(pagedUsers.TotalItems > 0);
    }

    [Fact]
    public async Task GetKpis_AsAdmin_Returns200WithKpiSummary()
    {
        var token = await GetAdminTokenAsync();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/users/kpis");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var kpis = await response.Content.ReadFromJsonAsync<AdminUserKpisDto>(_jsonOptions);
        Assert.NotNull(kpis);
        Assert.True(kpis.TotalLearners > 0);
    }

    [Fact]
    public async Task GetUsers_AsStudent_Returns403Forbidden()
    {
        var token = await GetStudentTokenAsync();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/users");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetUsers_WithoutToken_Returns401Unauthorized()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/users");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task LockAndUnlockUser_AsAdmin_UpdatesStatusAndPreventsLogin()
    {
        var token = await GetAdminTokenAsync();

        // 1. Get student user
        var listReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/users?search=student@example.com");
        listReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var listRes = await _client.SendAsync(listReq);
        var listBody = await listRes.Content.ReadFromJsonAsync<PagedResponse<AdminUserListItemDto>>(_jsonOptions);
        var student = listBody!.Items.FirstOrDefault(u => u.Email == "student@example.com");
        Assert.NotNull(student);

        // 2. Lock student
        var lockReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/admin/users/{student.Id}/lock")
        {
            Content = JsonContent.Create(new LockUserRequestDto { Reason = "Integration test lock" })
        };
        lockReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var lockRes = await _client.SendAsync(lockReq);
        Assert.Equal(HttpStatusCode.OK, lockRes.StatusCode);
        var lockedDetail = await lockRes.Content.ReadFromJsonAsync<AdminUserDetailDto>(_jsonOptions);
        Assert.Equal("LOCKED", lockedDetail!.Status);
        Assert.Equal("Integration test lock", lockedDetail.LockReason);

        // 3. Try to login with locked student - must receive 403 Forbidden
        var loginAttempt = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto
        {
            UsernameOrEmail = "student@example.com",
            Password = "ExamplePassword123!"
        });
        Assert.Equal(HttpStatusCode.Forbidden, loginAttempt.StatusCode);

        // 4. Unlock student
        var unlockReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/admin/users/{student.Id}/unlock");
        unlockReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var unlockRes = await _client.SendAsync(unlockReq);
        Assert.Equal(HttpStatusCode.OK, unlockRes.StatusCode);
        var unlockedDetail = await unlockRes.Content.ReadFromJsonAsync<AdminUserDetailDto>(_jsonOptions);
        Assert.Equal("ACTIVE", unlockedDetail!.Status);
        Assert.Null(unlockedDetail.LockReason);
    }

    [Fact]
    public async Task Admin_AttemptingToElevateToSuperAdmin_Returns403Forbidden()
    {
        var token = await GetAdminTokenAsync();

        // Get student user
        var listReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/users?search=student@zhongwenhub.edu.vn");
        listReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var listRes = await _client.SendAsync(listReq);
        var listBody = await listRes.Content.ReadFromJsonAsync<PagedResponse<AdminUserListItemDto>>(_jsonOptions);
        var student = listBody!.Items.First();

        // Try to assign SUPER_ADMIN
        var rolesReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/admin/users/{student.Id}/roles")
        {
            Content = JsonContent.Create(new UpdateUserRolesDto { Roles = new List<string> { "SUPER_ADMIN", "STUDENT" } })
        };
        rolesReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.SendAsync(rolesReq);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Admin_AttemptingToLockSuperAdmin_Returns403Forbidden()
    {
        var token = await GetAdminTokenAsync();

        // Find super admin
        var listReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/users?search=superadmin@zhongwenhub.edu.vn");
        listReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var listRes = await _client.SendAsync(listReq);
        var listBody = await listRes.Content.ReadFromJsonAsync<PagedResponse<AdminUserListItemDto>>(_jsonOptions);
        var superAdmin = listBody!.Items.First();

        var lockReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/admin/users/{superAdmin.Id}/lock")
        {
            Content = JsonContent.Create(new LockUserRequestDto { Reason = "Malicious admin attempt" })
        };
        lockReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.SendAsync(lockReq);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
