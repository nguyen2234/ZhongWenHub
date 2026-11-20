using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using ZhongWenHub.Business.Authentication.DTOs;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Users.DTOs;

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
            UsernameOrEmail = "admin@gmail.com",
            Password = "admin"
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
    public async Task Admin_AttemptingToElevateAnotherUserToAdmin_Returns403Forbidden()
    {
        var token = await GetAdminTokenAsync();

        // Get student user
        var listReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/users?search=student@zhongwenhub.edu.vn");
        listReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var listRes = await _client.SendAsync(listReq);
        var listBody = await listRes.Content.ReadFromJsonAsync<PagedResponse<AdminUserListItemDto>>(_jsonOptions);
        var student = listBody!.Items.First();

        // Try to assign ADMIN
        var rolesReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/admin/users/{student.Id}/roles")
        {
            Content = JsonContent.Create(new UpdateUserRolesDto { Roles = new List<string> { "ADMIN", "STUDENT" } })
        };
        rolesReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.SendAsync(rolesReq);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Admin_AttemptingToLockSoleAdmin_Returns400BadRequest()
    {
        var token = await GetAdminTokenAsync();

        // Find sole admin
        var listReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/users?search=admin@gmail.com");
        listReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var listRes = await _client.SendAsync(listReq);
        var listBody = await listRes.Content.ReadFromJsonAsync<PagedResponse<AdminUserListItemDto>>(_jsonOptions);
        var soleAdmin = listBody!.Items.First();

        var lockReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/admin/users/{soleAdmin.Id}/lock")
        {
            Content = JsonContent.Create(new LockUserRequestDto { Reason = "Attempt to lock sole admin" })
        };
        lockReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.SendAsync(lockReq);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task LockedUser_OldAccessTokenAndRefreshToken_AreImmediatelyInvalidated()
    {
        var adminToken = await GetAdminTokenAsync();

        // 1. Login as student to acquire active access token & refresh token
        var studentLoginReq = new LoginRequestDto
        {
            UsernameOrEmail = "student@zhongwenhub.edu.vn",
            Password = "StudentPassword123!"
        };
        var studentLoginRes = await _client.PostAsJsonAsync("/api/v1/auth/login", studentLoginReq);
        Assert.Equal(HttpStatusCode.OK, studentLoginRes.StatusCode);
        var studentAuth = await studentLoginRes.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        Assert.NotNull(studentAuth);
        var oldAccessToken = studentAuth.AccessToken;
        string? oldRefreshToken = null;
        if (studentLoginRes.Headers.TryGetValues("Set-Cookie", out var cookies1))
        {
            var cookieStr = cookies1.FirstOrDefault(c => c.StartsWith("refreshToken="));
            oldRefreshToken = cookieStr?.Split(';')[0].Replace("refreshToken=", "");
        }

        // Verify old access token works right now
        var meReq1 = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/me");
        meReq1.Headers.Authorization = new AuthenticationHeaderValue("Bearer", oldAccessToken);
        var meRes1 = await _client.SendAsync(meReq1);
        Assert.Equal(HttpStatusCode.OK, meRes1.StatusCode);

        // 2. Admin locks the student user
        var listReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/users?search=student@zhongwenhub.edu.vn");
        listReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var listRes = await _client.SendAsync(listReq);
        var listBody = await listRes.Content.ReadFromJsonAsync<PagedResponse<AdminUserListItemDto>>(_jsonOptions);
        var studentUser = listBody!.Items.First(u => u.Email == "student@zhongwenhub.edu.vn");

        var lockReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/admin/users/{studentUser.Id}/lock")
        {
            Content = JsonContent.Create(new LockUserRequestDto { Reason = "Security gate: token invalidation test" })
        };
        lockReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var lockRes = await _client.SendAsync(lockReq);
        Assert.Equal(HttpStatusCode.OK, lockRes.StatusCode);

        try
        {
            // 3. Call protected endpoint with OLD access token - MUST BE REJECTED (401 Unauthorized)
            var meReq2 = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/me");
            meReq2.Headers.Authorization = new AuthenticationHeaderValue("Bearer", oldAccessToken);
            var meRes2 = await _client.SendAsync(meReq2);
            Assert.Equal(HttpStatusCode.Unauthorized, meRes2.StatusCode);

            // 4. Try to restore session via OLD refresh token - MUST BE REJECTED
            var refreshReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh-token")
            {
                Content = JsonContent.Create(new RefreshTokenRequestDto { RefreshToken = oldRefreshToken })
            };
            var refreshRes = await _client.SendAsync(refreshReq);
            Assert.True(refreshRes.StatusCode == HttpStatusCode.Unauthorized || refreshRes.StatusCode == HttpStatusCode.Forbidden);
        }
        finally
        {
            // 5. Unlock user so other tests remain unaffected
            var unlockReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/admin/users/{studentUser.Id}/unlock");
            unlockReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
            await _client.SendAsync(unlockReq);
        }
    }

    [Fact]
    public async Task RoleRemoval_OldAccessToken_IsImmediatelyInvalidated()
    {
        // 1. Seed or prepare a user with elevated role (CONTENT_MANAGER)
        using (var scope = _factory.Services.CreateScope())
        {
            var userMgr = scope.ServiceProvider.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<ZhongWenHub.Data.Entities.ApplicationUser>>();
            var user = await userMgr.FindByEmailAsync("content_mgr_test@zhongwenhub.edu.vn");
            if (user == null)
            {
                user = new ZhongWenHub.Data.Entities.ApplicationUser
                {
                    Id = Guid.NewGuid(),
                    UserName = "content_mgr_test@zhongwenhub.edu.vn",
                    Email = "content_mgr_test@zhongwenhub.edu.vn",
                    DisplayName = "Test Content Manager",
                    Status = ZhongWenHub.Data.Entities.UserStatus.ACTIVE,
                    EmailConfirmed = true
                };
                await userMgr.CreateAsync(user, "Demo@2026!ZhongWen");
                await userMgr.AddToRoleAsync(user, ZhongWenHub.Data.Constants.RoleConstants.ContentManager);
            }
            else
            {
                if (!await userMgr.IsInRoleAsync(user, ZhongWenHub.Data.Constants.RoleConstants.ContentManager))
                {
                    await userMgr.AddToRoleAsync(user, ZhongWenHub.Data.Constants.RoleConstants.ContentManager);
                }
            }
        }

        // 2. Login as the content manager with dedicated no-cookie client
        var cmClient = _factory.CreateNoCookieClient();
        var loginRes = await cmClient.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto
        {
            UsernameOrEmail = "content_mgr_test@zhongwenhub.edu.vn",
            Password = "Demo@2026!ZhongWen"
        });
        Assert.Equal(HttpStatusCode.OK, loginRes.StatusCode);
        var auth = await loginRes.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        var oldAccessToken = auth!.AccessToken;
        string? oldRefreshToken = null;
        if (loginRes.Headers.TryGetValues("Set-Cookie", out var cookies))
        {
            var cookieStr = cookies.FirstOrDefault(c => c.StartsWith("refreshToken="));
            oldRefreshToken = cookieStr?.Split(';')[0].Replace("refreshToken=", "");
        }

        // Verify old access token works on Content privileged endpoint
        var privReq1 = new HttpRequestMessage(HttpMethod.Get, "/api/v1/question-bank?page=1&pageSize=5");
        privReq1.Headers.Authorization = new AuthenticationHeaderValue("Bearer", oldAccessToken);
        var privRes1 = await cmClient.SendAsync(privReq1);
        Assert.True(privRes1.StatusCode == HttpStatusCode.OK, $"Expected OK but got {privRes1.StatusCode}");

        // 3. Admin removes CONTENT_MANAGER role via API
        var adminToken = await GetAdminTokenAsync();
        var listReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/users?search=content_mgr_test@zhongwenhub.edu.vn");
        listReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var listRes = await _client.SendAsync(listReq);
        var listBody = await listRes.Content.ReadFromJsonAsync<PagedResponse<AdminUserListItemDto>>(_jsonOptions);
        var targetUser = listBody!.Items.First();

        var updateRoleReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/admin/users/{targetUser.Id}/roles")
        {
            Content = JsonContent.Create(new UpdateUserRolesDto { Roles = new List<string> { ZhongWenHub.Data.Constants.RoleConstants.Student } })
        };
        updateRoleReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var updateRoleRes = await _client.SendAsync(updateRoleReq);
        Assert.Equal(HttpStatusCode.OK, updateRoleRes.StatusCode);

        // 4. Try to access privileged endpoint with OLD access token - MUST BE REJECTED (401 Unauthorized because security stamp changed)
        var privReq2 = new HttpRequestMessage(HttpMethod.Get, "/api/v1/question-bank?page=1&pageSize=5");
        privReq2.Headers.Authorization = new AuthenticationHeaderValue("Bearer", oldAccessToken);
        var privRes2 = await cmClient.SendAsync(privReq2);
        Assert.True(privRes2.StatusCode == HttpStatusCode.Unauthorized || privRes2.StatusCode == HttpStatusCode.Forbidden);

        // 5. Old refresh token cannot restore role
        var refreshReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh-token")
        {
            Content = JsonContent.Create(new RefreshTokenRequestDto { RefreshToken = oldRefreshToken })
        };
        var refreshRes = await cmClient.SendAsync(refreshReq);
        Assert.Equal(HttpStatusCode.Unauthorized, refreshRes.StatusCode);
    }
}
