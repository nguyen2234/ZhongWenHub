using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Tokens;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Business.Authentication.DTOs;
using ZhongWenHub.Business.Common.DTOs;

namespace ZhongWenHub.IntegrationTests;

public class RbacAuthorizationIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public RbacAuthorizationIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private HttpClient CreateMockAiClient()
    {
        var customFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IAIProvider>();
                services.AddSingleton<IAIProvider, MockAIProvider>();
            });
        });

        return customFactory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = false
        });
    }

    private async Task<string> GetTokenForUserAsync(string email, string password, HttpClient? client = null)
    {
        var httpClient = client ?? _client;
        var response = await httpClient.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto
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
        var token = await GetTokenForUserAsync("admin@gmail.com", "admin");

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/system/admin-test");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Admin_AccessSystemSettingsManageEndpoint_Returns200Ok()
    {
        var token = await GetTokenForUserAsync("admin@gmail.com", "admin");

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/system/superadmin-test");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Student_AccessSystemSettingsManageEndpoint_Returns403Forbidden()
    {
        var token = await GetTokenForUserAsync("student@zhongwenhub.edu.vn", "StudentPassword123!");

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/system/superadmin-test");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
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

    [Fact]
    public async Task Anonymous_AccessProtectedEndpoints_Returns401Unauthorized()
    {
        var endpoints = new[]
        {
            "/api/v1/student/homework",
            "/api/v1/ai/conversations",
            "/api/v1/learning/me",
            "/api/v1/teacher/classes",
            "/api/v1/admin/users",
            "/api/v1/content/grammar/stats",
            "/api/v1/content/exercises/stats",
            "/api/v1/content/characters/stats",
            "/api/v1/question-bank/practice-history",
        };

        foreach (var endpoint in endpoints)
        {
            var response = await _client.GetAsync(endpoint);
            Assert.True(
                response.StatusCode == HttpStatusCode.Unauthorized,
                $"Expected 401 Unauthorized for anonymous request to '{endpoint}', but received {response.StatusCode}.");
        }
    }

    [Fact]
    public async Task Student_AccessContentStats_Returns403Forbidden()
    {
        var studentToken = await GetTokenForUserAsync("student@zhongwenhub.edu.vn", "StudentPassword123!");

        var statsEndpoints = new[]
        {
            "/api/v1/content/grammar/stats",
            "/api/v1/content/exercises/stats",
            "/api/v1/content/characters/stats",
        };

        foreach (var endpoint in statsEndpoints)
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);

            var response = await _client.SendAsync(request);
            Assert.True(
                response.StatusCode == HttpStatusCode.Forbidden,
                $"Expected 403 Forbidden for Student accessing '{endpoint}', but received {response.StatusCode}.");
        }
    }

    [Fact]
    public async Task TamperedJwtToken_InvalidSignature_Returns401Unauthorized()
    {
        var validToken = await GetTokenForUserAsync("student@zhongwenhub.edu.vn", "StudentPassword123!");
        var parts = validToken.Split('.');
        Assert.Equal(3, parts.Length);

        // Tamper signature portion
        var tamperedSignature = parts[2].StartsWith("X") ? "Y" + parts[2].Substring(1) : "X" + parts[2].Substring(1);
        var tamperedToken = $"{parts[0]}.{parts[1]}.{tamperedSignature}";

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tamperedToken);

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ExpiredJwtToken_WithValidSignature_Returns401Unauthorized()
    {
        // Generate a token with a cryptographically valid HMAC-SHA256 signature using the test secret,
        // but with an expiration timestamp explicitly set in the past.
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("ZhongWenHub_IntegrationTest_Super_Secret_Key_32_Bytes_Long_2026!"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Sub, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Email, "student@zhongwenhub.edu.vn"),
            new Claim(ClaimTypes.Role, "STUDENT"),
            new Claim("role", "STUDENT")
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            IssuedAt = DateTime.UtcNow.AddMinutes(-60),
            NotBefore = DateTime.UtcNow.AddMinutes(-60),
            Expires = DateTime.UtcNow.AddMinutes(-30), // Expired 30 minutes ago
            Issuer = "ZhongWenHub",
            Audience = "ZhongWenHub-Client",
            SigningCredentials = creds
        };

        var handler = new JwtSecurityTokenHandler();
        var expiredToken = handler.WriteToken(handler.CreateToken(tokenDescriptor));

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", expiredToken);

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CrossStudent_AccessAnotherStudentPracticeSession_Returns404NotFound()
    {
        // 1. Student 1 logs in and creates a practice session
        var student1Token = await GetTokenForUserAsync("student@zhongwenhub.edu.vn", "StudentPassword123!");

        using var createReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/question-bank/practice-sessions");
        createReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", student1Token);
        createReq.Content = JsonContent.Create(new
        {
            HskLevel = 1,
            QuestionCount = 5,
            Mode = "random"
        });

        var createRes = await _client.SendAsync(createReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);

        using var doc = await JsonDocument.ParseAsync(await createRes.Content.ReadAsStreamAsync());
        var sessionId = doc.RootElement.GetProperty("sessionId").GetGuid();

        // 2. Student 2 registers and logs in
        var student2Email = $"student2_idor_{Guid.NewGuid():N}@zhongwenhub.edu.vn";
        var password = "Student2Password123!";
        var regRes = await _client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequestDto
        {
            Email = student2Email,
            FullName = "Student 2 IDOR Tester",
            Password = password,
            ConfirmPassword = password
        });
        Assert.Equal(HttpStatusCode.Created, regRes.StatusCode);

        var student2Token = await GetTokenForUserAsync(student2Email, password);

        // 3. Student 2 tries to GET Student 1's practice session -> 404 Not Found (resource isolation)
        using var getReq = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/question-bank/practice-sessions/{sessionId}");
        getReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", student2Token);
        var getRes = await _client.SendAsync(getReq);
        Assert.Equal(HttpStatusCode.NotFound, getRes.StatusCode);

        // 4. Student 2 tries to POST submit to Student 1's practice session -> 404 Not Found
        using var submitReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/question-bank/practice-sessions/{sessionId}/submit");
        submitReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", student2Token);
        submitReq.Content = JsonContent.Create(new
        {
            Answers = new object[] { }
        });
        var submitRes = await _client.SendAsync(submitReq);
        Assert.Equal(HttpStatusCode.NotFound, submitRes.StatusCode);
    }

    [Fact]
    public async Task CrossStudent_CannotAccessOrModifyAnotherStudentAiConversation()
    {
        var aiClient = CreateMockAiClient();

        // 1. Student A logs in and starts a genuine AI conversation session
        var studentAToken = await GetTokenForUserAsync("student@zhongwenhub.edu.vn", "StudentPassword123!", aiClient);

        using var startReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/ai/conversations/start");
        startReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentAToken);
        startReq.Content = JsonContent.Create(new StartConversationRequestDto
        {
            HskLevel = 1,
            ScenarioCode = "daily-greeting",
            ShowPinyin = true,
            ShowVietnamese = false
        });

        var startRes = await aiClient.SendAsync(startReq);
        Assert.Equal(HttpStatusCode.OK, startRes.StatusCode);

        var started = await startRes.Content.ReadFromJsonAsync<AiConversationSessionDto>(_jsonOptions);
        Assert.NotNull(started);
        var conversationId = started!.Id;

        // 2. Student A can successfully read their own conversation (200 OK)
        using var ownGetReq = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/ai/conversations/{conversationId}");
        ownGetReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentAToken);
        var ownGetRes = await aiClient.SendAsync(ownGetReq);
        Assert.Equal(HttpStatusCode.OK, ownGetRes.StatusCode);

        // 3. Register and authenticate a distinct Student B
        var studentBEmail = $"studentB_ai_idor_{Guid.NewGuid():N}@zhongwenhub.edu.vn";
        var password = "StudentBPassword123!";
        var regRes = await _client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequestDto
        {
            Email = studentBEmail,
            FullName = "Student B IDOR Verifier",
            Password = password,
            ConfirmPassword = password
        });
        Assert.Equal(HttpStatusCode.Created, regRes.StatusCode);

        var studentBToken = await GetTokenForUserAsync(studentBEmail, password, aiClient);

        // 4. Student B tries to READ Student A's conversation -> 404 Not Found (Zero data leakage)
        using var readReq = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/ai/conversations/{conversationId}");
        readReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentBToken);
        var readRes = await aiClient.SendAsync(readReq);
        Assert.Equal(HttpStatusCode.NotFound, readRes.StatusCode);

        // 5. Student B tries to MODIFY (send message to) Student A's conversation -> 404 Not Found
        using var msgReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/ai/conversations/{conversationId}/messages");
        msgReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentBToken);
        msgReq.Content = JsonContent.Create(new SendConversationMessageRequestDto
        {
            Message = "Unauthorized message from Student B",
            RequestVietnamese = false
        });
        var msgRes = await aiClient.SendAsync(msgReq);
        Assert.Equal(HttpStatusCode.NotFound, msgRes.StatusCode);

        // 6. Student B tries to END Student A's conversation -> 404 Not Found
        using var endReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/ai/conversations/{conversationId}/end");
        endReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentBToken);
        var endRes = await aiClient.SendAsync(endReq);
        Assert.Equal(HttpStatusCode.NotFound, endRes.StatusCode);
    }
}
