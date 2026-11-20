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
    public async Task TamperedOrExpiredJwtToken_Returns401Unauthorized()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature");

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
    public async Task CrossStudent_AccessUnownedAiConversation_Returns404NotFound()
    {
        var studentToken = await GetTokenForUserAsync("student@zhongwenhub.edu.vn", "StudentPassword123!");
        var foreignSessionId = Guid.NewGuid();

        // Student attempts to GET unowned/non-existent AI conversation session -> 404 Not Found (no IDOR / data leak)
        using var getReq = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/ai/conversations/{foreignSessionId}");
        getReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var getRes = await _client.SendAsync(getReq);
        Assert.Equal(HttpStatusCode.NotFound, getRes.StatusCode);
    }
}
