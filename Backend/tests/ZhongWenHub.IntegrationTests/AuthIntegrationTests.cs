using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ZhongWenHub.Application.DTOs.Auth;
using ZhongWenHub.Application.DTOs.Common;

namespace ZhongWenHub.IntegrationTests;

public class AuthIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public AuthIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateNoCookieClient();
    }

    [Fact]
    public async Task Login_WithValidCredentials_Returns200WithJwtAndSetsHttpOnlyCookie()
    {
        var loginRequest = new LoginRequestDto
        {
            UsernameOrEmail = "student@zhongwenhub.edu.vn",
            Password = "StudentPassword123!"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        Assert.NotNull(body);
        Assert.NotEmpty(body.AccessToken);
        Assert.Equal("Bearer", body.TokenType);
        Assert.NotNull(body.User);
        Assert.Equal("student@zhongwenhub.edu.vn", body.User.Email);
        Assert.Contains("STUDENT", body.User.Roles);

        // Verify HttpOnly cookie
        Assert.True(response.Headers.Contains("Set-Cookie"));
        var cookies = response.Headers.GetValues("Set-Cookie");
        Assert.Contains(cookies, c => c.Contains("refreshToken=") && c.Contains("httponly", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Login_WithInvalidPassword_Returns401ProblemDetails()
    {
        var loginRequest = new LoginRequestDto
        {
            UsernameOrEmail = "student@zhongwenhub.edu.vn",
            Password = "WrongPassword123!"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ApiProblemDetailsDto>(_jsonOptions);
        Assert.NotNull(problem);
        Assert.Equal(401, problem.Status);
        Assert.NotEmpty(problem.Title);
    }

    [Fact]
    public async Task GetCurrentUser_WithBearerToken_Returns200WithProfile()
    {
        // Login first
        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto
        {
            UsernameOrEmail = "teacher@zhongwenhub.edu.vn",
            Password = "TeacherPassword123!"
        });
        var authData = await loginResponse.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        Assert.NotNull(authData);

        // Call /me
        using var meRequest = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/me");
        meRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", authData.AccessToken);

        var meResponse = await _client.SendAsync(meRequest);

        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);
        var user = await meResponse.Content.ReadFromJsonAsync<UserDto>(_jsonOptions);
        Assert.NotNull(user);
        Assert.Equal("teacher@zhongwenhub.edu.vn", user.Email);
        Assert.Contains("TEACHER", user.Roles);
    }

    [Fact]
    public async Task GetCurrentUser_WithoutToken_Returns401ProblemDetails()
    {
        using var meRequest = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/me");
        var meResponse = await _client.SendAsync(meRequest);

        Assert.Equal(HttpStatusCode.Unauthorized, meResponse.StatusCode);
        var problem = await meResponse.Content.ReadFromJsonAsync<ApiProblemDetailsDto>(_jsonOptions);
        Assert.NotNull(problem);
        Assert.Equal(401, problem.Status);
    }

    [Fact]
    public async Task RefreshToken_RotationAndReuseDetection_WorksAsExpected()
    {
        // 1. Initial login
        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto
        {
            UsernameOrEmail = "student@zhongwenhub.edu.vn",
            Password = "StudentPassword123!"
        });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var cookieHeader = loginResponse.Headers.GetValues("Set-Cookie").First(c => c.Contains("refreshToken="));
        var rawCookieToken = ExtractRefreshTokenFromCookie(cookieHeader);
        Assert.NotEmpty(rawCookieToken);

        // 2. Perform refresh using the cookie
        using var refreshRequest = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        refreshRequest.Headers.Add("Cookie", $"refreshToken={rawCookieToken}");

        var refreshResponse = await _client.SendAsync(refreshRequest);
        Assert.Equal(HttpStatusCode.OK, refreshResponse.StatusCode);

        var newAuth = await refreshResponse.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        Assert.NotNull(newAuth);
        Assert.NotEmpty(newAuth.AccessToken);

        var newCookieHeader = refreshResponse.Headers.GetValues("Set-Cookie").First(c => c.Contains("refreshToken="));
        var newCookieToken = ExtractRefreshTokenFromCookie(newCookieHeader);
        Assert.NotEqual(rawCookieToken, newCookieToken);

        // 3. Reuse Attack Test: replay old rawCookieToken
        using var attackRequest = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        attackRequest.Headers.Add("Cookie", $"refreshToken={rawCookieToken}");

        var attackResponse = await _client.SendAsync(attackRequest);
        Assert.Equal(HttpStatusCode.Unauthorized, attackResponse.StatusCode);

        var problem = await attackResponse.Content.ReadFromJsonAsync<ApiProblemDetailsDto>(_jsonOptions);
        Assert.NotNull(problem);
        Assert.Equal(401, problem.Status);
        Assert.Contains("tấn công", problem.Detail, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Logout_RevokesTokenAndClearsCookie()
    {
        // Login
        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto
        {
            UsernameOrEmail = "support@zhongwenhub.edu.vn",
            Password = "SupportPassword123!"
        });
        var cookieHeader = loginResponse.Headers.GetValues("Set-Cookie").First(c => c.Contains("refreshToken="));
        var rawCookieToken = ExtractRefreshTokenFromCookie(cookieHeader);

        // Logout
        using var logoutRequest = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/logout");
        logoutRequest.Headers.Add("Cookie", $"refreshToken={rawCookieToken}");

        var logoutResponse = await _client.SendAsync(logoutRequest);
        Assert.Equal(HttpStatusCode.OK, logoutResponse.StatusCode);

        // Confirm token is revoked by attempting to refresh
        using var refreshRequest = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        refreshRequest.Headers.Add("Cookie", $"refreshToken={rawCookieToken}");

        var refreshResponse = await _client.SendAsync(refreshRequest);
        Assert.Equal(HttpStatusCode.Unauthorized, refreshResponse.StatusCode);
    }

    private static string ExtractRefreshTokenFromCookie(string cookieHeader)
    {
        var part = cookieHeader.Split(';').FirstOrDefault(p => p.Trim().StartsWith("refreshToken="));
        return part?.Split('=')[1].Trim() ?? string.Empty;
    }
}
