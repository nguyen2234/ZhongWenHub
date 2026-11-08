using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ZhongWenHub.Business.Authentication.DTOs;
using ZhongWenHub.Business.Content.DTOs;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Persistence;
using Xunit;

namespace ZhongWenHub.IntegrationTests;

public class LessonReleaseGateIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public LessonReleaseGateIntegrationTests(CustomWebApplicationFactory factory)
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

    private async Task<string> GetContentManagerTokenAsync()
    {
        var loginReq = new LoginRequestDto
        {
            UsernameOrEmail = "contentmanager@zhongwenhub.edu.vn",
            Password = "ContentManager123!"
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
    public async Task Student_AttemptToPublishLesson_ReturnsForbidden()
    {
        var studentToken = await GetStudentTokenAsync();
        var testLessonId = Guid.NewGuid();

        var req = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/lessons/{testLessonId}/status")
        {
            Content = JsonContent.Create(new UpdateContentStatusDto { Status = "PUBLISHED" })
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);

        var res = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task Anonymous_AttemptToAccessReleaseReadinessOrStatus_ReturnsUnauthorized()
    {
        var testLessonId = Guid.NewGuid();

        // 1. Release readiness without auth
        var resReadiness = await _client.GetAsync($"/api/v1/content/lessons/{testLessonId}/release-readiness");
        Assert.Equal(HttpStatusCode.Unauthorized, resReadiness.StatusCode);

        // 2. Status update without auth
        var resStatus = await _client.PutAsJsonAsync($"/api/v1/content/lessons/{testLessonId}/status", new UpdateContentStatusDto { Status = "PUBLISHED" });
        Assert.Equal(HttpStatusCode.Unauthorized, resStatus.StatusCode);
    }

    [Fact]
    public async Task Lesson_NonExistentId_ReturnsNotFound_WithConsistentCode()
    {
        var adminToken = await GetAdminTokenAsync();
        var nonExistentId = Guid.NewGuid();

        // 1. Check readiness
        var reqReadiness = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/content/lessons/{nonExistentId}/release-readiness");
        reqReadiness.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var resReadiness = await _client.SendAsync(reqReadiness);
        Assert.Equal(HttpStatusCode.NotFound, resReadiness.StatusCode);

        var readinessError = await resReadiness.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions);
        Assert.Equal("LESSON_NOT_FOUND", readinessError.GetProperty("code").GetString());

        // 2. Status update
        var reqStatus = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/lessons/{nonExistentId}/status")
        {
            Content = JsonContent.Create(new UpdateContentStatusDto { Status = "DRAFT" })
        };
        reqStatus.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var resStatus = await _client.SendAsync(reqStatus);
        Assert.Equal(HttpStatusCode.NotFound, resStatus.StatusCode);

        var statusError = await resStatus.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions);
        Assert.Equal("LESSON_NOT_FOUND", statusError.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Lesson_InvalidStatus_ReturnsBadRequest_WithConsistentCode()
    {
        var adminToken = await GetAdminTokenAsync();
        Guid testLessonId = Guid.NewGuid();
        Guid testCourseId = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var course = new CourseEntity
            {
                Id = testCourseId,
                Title = "Khoá học kiểm thử " + Guid.NewGuid().ToString("N")[..6],
                HskLevel = 1,
                Code = "TEST-COURSE-" + Guid.NewGuid().ToString("N")[..4],
                Status = "DRAFT"
            };
            var lesson = new LessonEntity
            {
                Id = testLessonId,
                CourseId = testCourseId,
                LessonNumber = 99,
                TitleZh = "非标准状态",
                TitleVi = "Trạng thái không chuẩn",
                Status = "DRAFT"
            };
            db.Courses.Add(course);
            db.Lessons.Add(lesson);
            await db.SaveChangesAsync();
        }

        try
        {
            var req = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/lessons/{testLessonId}/status")
            {
                Content = JsonContent.Create(new UpdateContentStatusDto { Status = "INVALID_STATUS_XYZ" })
            };
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

            var res = await _client.SendAsync(req);
            Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);

            var err = await res.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions);
            Assert.Equal("INVALID_STATUS", err.GetProperty("code").GetString());
        }
        finally
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var l = await db.Lessons.FindAsync(testLessonId);
            if (l != null) db.Lessons.Remove(l);
            var c = await db.Courses.FindAsync(testCourseId);
            if (c != null) db.Courses.Remove(c);
            await db.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task ProductionLesson_Draft_CannotDirectlyTransitionToPublished_WithoutPendingReview()
    {
        var adminToken = await GetAdminTokenAsync();
        Guid testLessonId = Guid.NewGuid();
        Guid testCourseId = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var course = new CourseEntity
            {
                Id = testCourseId,
                Title = "Khoá học thực tế " + Guid.NewGuid().ToString("N")[..6],
                HskLevel = 1,
                Code = "TEST-COURSE-" + Guid.NewGuid().ToString("N")[..4],
                Status = "DRAFT"
            };
            var lesson = new LessonEntity
            {
                Id = testLessonId,
                CourseId = testCourseId,
                LessonNumber = 98,
                TitleZh = "标准工作流课程",
                TitleVi = "Bài học chuẩn luồng phát hành",
                Status = "DRAFT",
                DialogueJson = "{\"lines\":[{\"speaker\":\"A\",\"hanzi\":\"你好\",\"pinyin\":\"nǐ hǎo\",\"meaningVi\":\"Chào bạn\"},{\"speaker\":\"B\",\"hanzi\":\"你好\",\"pinyin\":\"nǐ hǎo\",\"meaningVi\":\"Chào bạn\"}]}",
                ListeningJson = "[{\"id\":\"1\",\"transcriptZh\":\"你好\",\"transcriptPinyin\":\"nǐ hǎo\",\"transcriptVi\":\"Chào bạn\"}]"
            };
            db.Courses.Add(course);
            db.Lessons.Add(lesson);
            await db.SaveChangesAsync();
        }

        try
        {
            // Attempt to directly publish while in DRAFT
            var req = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/lessons/{testLessonId}/status")
            {
                Content = JsonContent.Create(new UpdateContentStatusDto { Status = "PUBLISHED" })
            };
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

            var res = await _client.SendAsync(req);
            Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);

            var err = await res.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions);
            Assert.Equal("RELEASE_GATE_VALIDATION_FAILED", err.GetProperty("code").GetString());
            Assert.Contains("PENDING_REVIEW", err.GetProperty("message").GetString());
        }
        finally
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var l = await db.Lessons.FindAsync(testLessonId);
            if (l != null) db.Lessons.Remove(l);
            var c = await db.Courses.FindAsync(testCourseId);
            if (c != null) db.Courses.Remove(c);
            await db.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task Lesson_Workflow_Draft_To_PendingReview_Succeeds()
    {
        var cmToken = await GetContentManagerTokenAsync();
        Guid testLessonId = Guid.NewGuid();
        Guid testCourseId = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var course = new CourseEntity
            {
                Id = testCourseId,
                Title = "Khoá học " + Guid.NewGuid().ToString("N")[..6],
                HskLevel = 1,
                Code = "TEST-COURSE-" + Guid.NewGuid().ToString("N")[..4],
                Status = "DRAFT"
            };
            var lesson = new LessonEntity
            {
                Id = testLessonId,
                CourseId = testCourseId,
                LessonNumber = 97,
                TitleZh = "提交审批测试",
                TitleVi = "Thử nghiệm gửi kiểm duyệt",
                Status = "DRAFT"
            };
            db.Courses.Add(course);
            db.Lessons.Add(lesson);
            await db.SaveChangesAsync();
        }

        try
        {
            // Transition from DRAFT to PENDING_REVIEW
            var req = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/lessons/{testLessonId}/status")
            {
                Content = JsonContent.Create(new UpdateContentStatusDto { Status = "PENDING_REVIEW" })
            };
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", cmToken);

            var res = await _client.SendAsync(req);
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);

            var updated = await res.Content.ReadFromJsonAsync<LessonDto>(_jsonOptions);
            Assert.NotNull(updated);
            Assert.Equal("PENDING_REVIEW", updated.Status);
        }
        finally
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var l = await db.Lessons.FindAsync(testLessonId);
            if (l != null) db.Lessons.Remove(l);
            var c = await db.Courses.FindAsync(testCourseId);
            if (c != null) db.Courses.Remove(c);
            await db.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task Lesson_MissingExercisesOrVocab_PublishAttempt_RejectedWithBlockers()
    {
        var adminToken = await GetAdminTokenAsync();
        Guid testLessonId = Guid.NewGuid();
        Guid testCourseId = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var course = new CourseEntity
            {
                Id = testCourseId,
                Title = "Khoá học thiếu học liệu " + Guid.NewGuid().ToString("N")[..6],
                HskLevel = 1,
                Code = "TEST-COURSE-" + Guid.NewGuid().ToString("N")[..4],
                Status = "DRAFT"
            };
            var lesson = new LessonEntity
            {
                Id = testLessonId,
                CourseId = testCourseId,
                LessonNumber = 96,
                TitleZh = "缺少词汇习题",
                TitleVi = "Thiếu từ vựng và bài tập",
                Status = "PENDING_REVIEW",
                DialogueJson = "{\"lines\":[{\"speaker\":\"A\",\"hanzi\":\"你好\",\"pinyin\":\"nǐ hǎo\",\"meaningVi\":\"Chào bạn\"},{\"speaker\":\"B\",\"hanzi\":\"你好\",\"pinyin\":\"nǐ hǎo\",\"meaningVi\":\"Chào bạn\"}]}",
                ListeningJson = "[{\"id\":\"1\",\"transcriptZh\":\"你好\",\"transcriptPinyin\":\"nǐ hǎo\",\"transcriptVi\":\"Chào bạn\"}]"
            };
            db.Courses.Add(course);
            db.Lessons.Add(lesson);
            await db.SaveChangesAsync();
        }

        try
        {
            var req = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/lessons/{testLessonId}/status")
            {
                Content = JsonContent.Create(new UpdateContentStatusDto { Status = "PUBLISHED" })
            };
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

            var res = await _client.SendAsync(req);
            Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);

            var err = await res.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions);
            Assert.Equal("RELEASE_GATE_VALIDATION_FAILED", err.GetProperty("code").GetString());
            var msg = err.GetProperty("message").GetString() ?? "";
            Assert.Contains("từ vựng", msg);
        }
        finally
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var l = await db.Lessons.FindAsync(testLessonId);
            if (l != null) db.Lessons.Remove(l);
            var c = await db.Courses.FindAsync(testCourseId);
            if (c != null) db.Courses.Remove(c);
            await db.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task Lesson_WithLeakedHanziInPinyinOrVi_PublishAttempt_RejectedImmediately()
    {
        var adminToken = await GetAdminTokenAsync();
        Guid testLessonId = Guid.NewGuid();
        Guid testCourseId = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var course = new CourseEntity
            {
                Id = testCourseId,
                Title = "Khoá học rò rỉ Hán tự " + Guid.NewGuid().ToString("N")[..6],
                HskLevel = 1,
                Code = "TEST-COURSE-" + Guid.NewGuid().ToString("N")[..4],
                Status = "DRAFT"
            };
            var lesson = new LessonEntity
            {
                Id = testLessonId,
                CourseId = testCourseId,
                LessonNumber = 95,
                TitleZh = "包含汉字残留",
                TitleVi = "Chứa chữ Hán rò rỉ",
                Status = "PENDING_REVIEW",
                // Leaked Hanzi inside pinyin
                DialogueJson = "{\"lines\":[{\"speaker\":\"A\",\"hanzi\":\"你好\",\"pinyin\":\"nǐ hǎo 你好\",\"meaningVi\":\"Chào bạn\"},{\"speaker\":\"B\",\"hanzi\":\"你好\",\"pinyin\":\"nǐ hǎo\",\"meaningVi\":\"Chào bạn\"}]}",
                ListeningJson = "[{\"id\":\"1\",\"transcriptZh\":\"你好\",\"transcriptPinyin\":\"nǐ hǎo\",\"transcriptVi\":\"Chào bạn\"}]"
            };
            db.Courses.Add(course);
            db.Lessons.Add(lesson);
            await db.SaveChangesAsync();
        }

        try
        {
            var req = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/lessons/{testLessonId}/status")
            {
                Content = JsonContent.Create(new UpdateContentStatusDto { Status = "PUBLISHED" })
            };
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

            var res = await _client.SendAsync(req);
            Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);

            var err = await res.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions);
            Assert.Equal("RELEASE_GATE_VALIDATION_FAILED", err.GetProperty("code").GetString());
            var msg = err.GetProperty("message").GetString() ?? "";
            Assert.Contains("ký tự Hán", msg);
        }
        finally
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var l = await db.Lessons.FindAsync(testLessonId);
            if (l != null) db.Lessons.Remove(l);
            var c = await db.Courses.FindAsync(testCourseId);
            if (c != null) db.Courses.Remove(c);
            await db.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task DatabaseEnvironment_Endpoint_ReturnsValidDatabaseInfo()
    {
        var res = await _client.GetAsync("/api/v1/system/database-environment");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        var json = await res.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions);
        var dbName = json.GetProperty("databaseName").GetString();
        var isTest = json.GetProperty("isTestDatabase").GetBoolean();

        Assert.NotNull(dbName);
        Assert.Contains("Test", dbName, StringComparison.OrdinalIgnoreCase);
        Assert.True(isTest);
    }

    [Fact]
    public async Task ReviewLesson_Success_RecordsAuditTrailCorrectly()
    {
        var adminToken = await GetAdminTokenAsync();
        Guid testLessonId = Guid.NewGuid();
        Guid testCourseId = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var course = new CourseEntity
            {
                Id = testCourseId,
                Code = "TEST-AUDIT-" + Guid.NewGuid().ToString("N")[..4],
                Title = "Khoá học Audit " + Guid.NewGuid().ToString("N")[..6],
                HskLevel = 1,
                Status = "DRAFT"
            };
            var lesson = new LessonEntity
            {
                Id = testLessonId,
                CourseId = testCourseId,
                LessonNumber = 94,
                TitleZh = "测试审核追踪",
                TitleVi = "Kiểm tra audit trail",
                Status = "PENDING_REVIEW"
            };
            db.Courses.Add(course);
            db.Lessons.Add(lesson);
            await db.SaveChangesAsync();
        }

        try
        {
            var req = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/lessons/{testLessonId}/review")
            {
                Content = JsonContent.Create(new ReviewContentDto
                {
                    Status = "PUBLISHED",
                    ReviewNotes = "Phê duyệt phát hành chính thức sau khi thẩm định"
                })
            };
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

            var res = await _client.SendAsync(req);
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);

            var updated = await res.Content.ReadFromJsonAsync<LessonDto>(_jsonOptions);
            Assert.NotNull(updated);
            Assert.Equal("PUBLISHED", updated.Status);
            Assert.Equal("Phê duyệt phát hành chính thức sau khi thẩm định", updated.ReviewNotes);
            Assert.NotNull(updated.ReviewedByUserId);
            Assert.NotNull(updated.ReviewedAt);

            // Double check in database directly
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var dbLesson = await db.Lessons.FindAsync(testLessonId);
                Assert.NotNull(dbLesson);
                Assert.Equal("PUBLISHED", dbLesson.Status);
                Assert.NotNull(dbLesson.ReviewedByUserId);
                Assert.NotNull(dbLesson.ReviewedAt);
                Assert.Equal("Phê duyệt phát hành chính thức sau khi thẩm định", dbLesson.ReviewNotes);
            }
        }
        finally
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var l = await db.Lessons.FindAsync(testLessonId);
            if (l != null) db.Lessons.Remove(l);
            var c = await db.Courses.FindAsync(testCourseId);
            if (c != null) db.Courses.Remove(c);
            await db.SaveChangesAsync();
        }
    }
}
