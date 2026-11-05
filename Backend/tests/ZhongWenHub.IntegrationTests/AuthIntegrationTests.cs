using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ZhongWenHub.Business.Authentication.DTOs;
using ZhongWenHub.Business.Common.DTOs;

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

    [Fact]
    public async Task Register_WithValidStudentData_Returns201CreatedAndSavesToDatabase()
    {
        var uniqueEmail = $"newstudent_{Guid.NewGuid():N}@zhongwenhub.edu.vn";
        var registerRequest = new RegisterRequestDto
        {
            FullName = "Nguyễn Văn Học Viên Mới",
            Email = uniqueEmail,
            Username = $"student_{Guid.NewGuid():N}"[..18],
            Password = "StudentNewPass123!",
            ConfirmPassword = "StudentNewPass123!"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        Assert.NotNull(body);
        Assert.NotEmpty(body.AccessToken);
        Assert.Equal("Bearer", body.TokenType);
        Assert.NotNull(body.User);
        Assert.Equal(uniqueEmail, body.User.Email);
        Assert.Equal("Nguyễn Văn Học Viên Mới", body.User.DisplayName);
        Assert.Contains("STUDENT", body.User.Roles);

        // Verify HttpOnly cookie is set
        Assert.True(response.Headers.Contains("Set-Cookie"));
        var cookies = response.Headers.GetValues("Set-Cookie");
        Assert.Contains(cookies, c => c.Contains("refreshToken=") && c.Contains("httponly", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Register_WithExistingEmail_Returns409Conflict()
    {
        var registerRequest = new RegisterRequestDto
        {
            FullName = "Trùng Email",
            Email = "student@zhongwenhub.edu.vn", // Existing seeded student email
            Password = "StudentNewPass123!",
            ConfirmPassword = "StudentNewPass123!"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ApiProblemDetailsDto>(_jsonOptions);
        Assert.NotNull(problem);
        Assert.Equal(409, problem.Status);
        Assert.Contains("Email", problem.Title);
    }

    [Fact]
    public async Task Register_WithPasswordMismatch_Returns400BadRequest()
    {
        var registerRequest = new RegisterRequestDto
        {
            FullName = "Mật khẩu lệch",
            Email = $"mismatch_{Guid.NewGuid():N}@zhongwenhub.edu.vn",
            Password = "Password123!",
            ConfirmPassword = "DifferentPassword123!"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCurrentUser_WithValidDisplayName_Returns200AndUpdatesUser()
    {
        // 1. Login as student
        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto
        {
            UsernameOrEmail = "student@zhongwenhub.edu.vn",
            Password = "StudentPassword123!"
        });
        loginResponse.EnsureSuccessStatusCode();
        var loginBody = await loginResponse.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        var token = loginBody!.AccessToken;

        // 2. Update profile
        var updateDto = new UpdateProfileRequestDto
        {
            DisplayName = "Nguyễn Học Viên Mới"
        };

        using var request = new HttpRequestMessage(HttpMethod.Put, "/api/v1/auth/me")
        {
            Content = JsonContent.Create(updateDto)
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var updateResponse = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var updatedUser = await updateResponse.Content.ReadFromJsonAsync<UserDto>(_jsonOptions);
        Assert.NotNull(updatedUser);
        Assert.Equal("Nguyễn Học Viên Mới", updatedUser.DisplayName);

        // 3. Verify GET /me returns the updated name
        using var getReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/me");
        getReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var getRes = await _client.SendAsync(getReq);
        Assert.Equal(HttpStatusCode.OK, getRes.StatusCode);
        var verifyUser = await getRes.Content.ReadFromJsonAsync<UserDto>(_jsonOptions);
        Assert.NotNull(verifyUser);
        Assert.Equal("Nguyễn Học Viên Mới", verifyUser.DisplayName);
    }

    [Fact]
    public async Task DevAdmin_LoginWithAdminGmail_Returns200AndAdminRole()
    {
        var loginRequest = new LoginRequestDto
        {
            UsernameOrEmail = "admin@gmail.com",
            Password = "admin"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        Assert.NotNull(body);
        Assert.NotEmpty(body.AccessToken);
        Assert.NotNull(body.User);
        Assert.Equal("admin@gmail.com", body.User.Email);
        Assert.Contains("ADMIN", body.User.Roles);

        // Access Admin Users API
        using var adminReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/users");
        adminReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", body.AccessToken);
        var adminRes = await _client.SendAsync(adminReq);
        Assert.Equal(HttpStatusCode.OK, adminRes.StatusCode);
    }

    [Fact]
    public async Task DevAdmin_LoginWithWrongPassword_Returns401Unauthorized()
    {
        var loginRequest = new LoginRequestDto
        {
            UsernameOrEmail = "admin@gmail.com",
            Password = "WrongPassword999!"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Admin_RepeatedWrongPasswords_IsNotLockedOutAndCanLoginWithCorrectPassword()
    {
        var adminEmail = "admin@gmail.com";
        var wrongPass = "WrongPassword999!";
        var correctPass = "admin";

        // Attempt 6 consecutive wrong password logins
        for (int i = 0; i < 6; i++)
        {
            var wrongResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto
            {
                UsernameOrEmail = adminEmail,
                Password = wrongPass
            });
            Assert.Equal(HttpStatusCode.Unauthorized, wrongResponse.StatusCode);
        }

        // 7th attempt with CORRECT password must succeed (Admin is exempt from automatic lockout)
        var correctResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto
        {
            UsernameOrEmail = adminEmail,
            Password = correctPass
        });

        Assert.Equal(HttpStatusCode.OK, correctResponse.StatusCode);
        var body = await correctResponse.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        Assert.NotNull(body);
        Assert.NotEmpty(body.AccessToken);
        Assert.Contains("ADMIN", body.User.Roles);
    }

    [Fact]
    public async Task Student_AfterFiveFailedAttempts_IsLockedOut()
    {
        var studentEmail = $"student_lockout_{Guid.NewGuid():N}@zhongwenhub.edu.vn";
        var password = "StudentValidPassword123!";

        // Register new student
        var regRes = await _client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequestDto
        {
            Email = studentEmail,
            FullName = "Student Lockout Tester",
            Password = password,
            ConfirmPassword = password
        });
        Assert.Equal(HttpStatusCode.Created, regRes.StatusCode);

        // Fail 5 times
        for (int i = 0; i < 5; i++)
        {
            var wrongRes = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto
            {
                UsernameOrEmail = studentEmail,
                Password = "WrongPassword999!"
            });
            Assert.Equal(HttpStatusCode.Unauthorized, wrongRes.StatusCode);
        }

        // 6th attempt should be blocked with 403 Forbidden (Lockout triggered)
        var lockedRes = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto
        {
            UsernameOrEmail = studentEmail,
            Password = password
        });

        Assert.Equal(HttpStatusCode.Forbidden, lockedRes.StatusCode);
        var problem = await lockedRes.Content.ReadFromJsonAsync<ApiProblemDetailsDto>(_jsonOptions);
        Assert.NotNull(problem);
        Assert.Equal("Tài khoản bị khóa", problem.Title);
    }

    [Fact]
    public async Task ManuallyLockedUser_Returns403Forbidden()
    {
        // Login as admin to lock a user
        var adminLoginRes = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto
        {
            UsernameOrEmail = "admin@gmail.com",
            Password = "admin"
        });
        var adminAuth = await adminLoginRes.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        Assert.NotNull(adminAuth);

        // Create a new user
        var targetEmail = $"target_user_{Guid.NewGuid():N}@zhongwenhub.edu.vn";
        var targetPass = "TargetPass123!";
        using var createReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/admin/users")
        {
            Content = JsonContent.Create(new
            {
                Name = "Target User",
                Email = targetEmail,
                Password = targetPass,
                Roles = new[] { "STUDENT" },
                Status = "ACTIVE"
            })
        };
        createReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminAuth.AccessToken);
        var createRes = await _client.SendAsync(createReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var createdUser = await createRes.Content.ReadFromJsonAsync<UserDto>(_jsonOptions);
        Assert.NotNull(createdUser);

        // Lock the user manually via POST /api/v1/admin/users/{id}/lock
        using var lockReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/admin/users/{createdUser.Id}/lock")
        {
            Content = JsonContent.Create(new { Reason = "Vi phạm chính sách" })
        };
        lockReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminAuth.AccessToken);
        var lockRes = await _client.SendAsync(lockReq);
        Assert.Equal(HttpStatusCode.OK, lockRes.StatusCode);

        // Attempt login with correct password -> must be forbidden 403
        var loginRes = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto
        {
            UsernameOrEmail = targetEmail,
            Password = targetPass
        });

        Assert.Equal(HttpStatusCode.Forbidden, loginRes.StatusCode);
    }

    private static string ExtractRefreshTokenFromCookie(string cookieHeader)
    {
        var part = cookieHeader.Split(';').FirstOrDefault(p => p.Trim().StartsWith("refreshToken="));
        return part?.Split('=')[1].Trim() ?? string.Empty;
    }
}
