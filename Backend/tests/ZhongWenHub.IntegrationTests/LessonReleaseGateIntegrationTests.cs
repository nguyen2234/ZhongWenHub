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
            var errStr = await res.Content.ReadAsStringAsync();
            Assert.True(res.StatusCode == HttpStatusCode.OK, errStr);

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
        Guid testVocabId = Guid.NewGuid();
        Guid testGrammarId = Guid.NewGuid();
        Guid testExerciseId = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cmUser = await db.Users.FirstAsync(u => u.Email == "contentmanager@zhongwenhub.edu.vn");

            var course = new CourseEntity
            {
                Id = testCourseId,
                Code = "TEST-AUDIT-" + Guid.NewGuid().ToString("N")[..4],
                Title = "Khoá học Audit " + Guid.NewGuid().ToString("N")[..6],
                HskLevel = 1,
                Status = "PUBLISHED"
            };

            var lesson = new LessonEntity
            {
                Id = testLessonId,
                CourseId = testCourseId,
                LessonNumber = 94,
                TitleZh = "完整测试课",
                TitleVi = "Bài học đầy đủ điều kiện",
                Status = "PENDING_REVIEW",
                UpdatedByUserId = cmUser.Id, // Authored by Content Manager, reviewed by Admin
                DialogueJson = "{\"lines\":[{\"speaker\":\"A\",\"hanzi\":\"你好\",\"pinyin\":\"nǐ hǎo\",\"meaningVi\":\"Chào bạn\"},{\"speaker\":\"B\",\"hanzi\":\"你好\",\"pinyin\":\"nǐ hǎo\",\"meaningVi\":\"Chào bạn\"}]}",
                ListeningJson = "[{\"id\":\"1\",\"transcriptZh\":\"你好\",\"transcriptPinyin\":\"nǐ hǎo\",\"transcriptVi\":\"Chào bạn\"}]"
            };

            var vocabList = new List<VocabularyEntity>();
            for (int vi = 1; vi <= 5; vi++)
            {
                vocabList.Add(new VocabularyEntity
                {
                    Id = Guid.NewGuid(),
                    LessonId = testLessonId,
                    HskLevel = 1,
                    Hanzi = "字" + vi,
                    Pinyin = "zi" + vi,
                    MeaningVi = "Nghĩa " + vi,
                    Status = "PUBLISHED"
                });
            }

            var grammar = new GrammarPointEntity
            {
                Id = testGrammarId,
                LessonId = testLessonId,
                HskLevel = 1,
                Code = "HSK1-AUDIT-TEST",
                Title = "Ngữ pháp chào hỏi",
                PinyinTitle = "Wenhou",
                StructureFormula = "A + B",
                Explanation = "Giải thích chào hỏi",
                Status = "PUBLISHED"
            };

            var exercise = new ExerciseEntity
            {
                Id = testExerciseId,
                LessonId = testLessonId,
                HskLevel = 1,
                Type = "multiple-choice",
                Title = "Nǐ hǎo nghĩa là gì?",
                Instruction = "Chọn đáp án đúng",
                OptionsJson = "[\"Chào bạn\", \"Tạm biệt\", \"Cảm ơn\", \"Không có chi\"]",
                CorrectAnswer = "Chào bạn",
                Explanation = "Nǐ hǎo là xin chào",
                Status = "PUBLISHED"
            };

            db.Courses.Add(course);
            db.Lessons.Add(lesson);
            db.Vocabularies.AddRange(vocabList);
            db.GrammarPoints.Add(grammar);
            db.Exercises.Add(exercise);
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
            var errStr = await res.Content.ReadAsStringAsync();
            Assert.True(res.StatusCode == HttpStatusCode.OK, errStr);

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
            var ex = await db.Exercises.FindAsync(testExerciseId);
            if (ex != null) db.Exercises.Remove(ex);
            var g = await db.GrammarPoints.FindAsync(testGrammarId);
            if (g != null) db.GrammarPoints.Remove(g);
            var vocabs = await db.Vocabularies.Where(v => v.LessonId == testLessonId).ToListAsync();
            db.Vocabularies.RemoveRange(vocabs);
            var l = await db.Lessons.FindAsync(testLessonId);
            if (l != null) db.Lessons.Remove(l);
            var c = await db.Courses.FindAsync(testCourseId);
            if (c != null) db.Courses.Remove(c);
            await db.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task Regression_LessonTitleStartingWithCeShi_CannotBypassReleaseGate()
    {
        var testCourseId = Guid.NewGuid();
        var testLessonId = Guid.NewGuid();
        var adminToken = await GetAdminTokenAsync();

        try
        {
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                db.Courses.Add(new CourseEntity
                {
                    Id = testCourseId,
                    Title = "Test Course CeShi Bypass",
                    Code = "TEST-CESHI-BYPASS",
                    HskLevel = 1,
                    Status = "PUBLISHED"
                });

                db.Lessons.Add(new LessonEntity
                {
                    Id = testLessonId,
                    CourseId = testCourseId,
                    LessonNumber = 88,
                    TitleZh = "测试 Bypass Release Gate Title",
                    TitleVi = "Bài kiểm thử bypass",
                    Status = "DRAFT",
                    DialogueJson = "[]",
                    ListeningJson = "[]"
                });
                await db.SaveChangesAsync();
            }

            var reviewReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/lessons/{testLessonId}/review");
            reviewReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
            reviewReq.Content = JsonContent.Create(new ReviewContentDto
            {
                Status = "PUBLISHED",
                ReviewNotes = "Cố gắng bypass bằng tiền tố 测试"
            }, options: _jsonOptions);

            var res = await _client.SendAsync(reviewReq);
            Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);

            var errBody = await res.Content.ReadAsStringAsync();
            Assert.Contains("PENDING_REVIEW", errBody);
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
    public async Task Regression_CreateLesson_DirectlyWithPublishedStatus_IsRejected()
    {
        var testCourseId = Guid.NewGuid();
        var adminToken = await GetAdminTokenAsync();

        try
        {
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                db.Courses.Add(new CourseEntity
                {
                    Id = testCourseId,
                    Title = "Course For Direct Publish Test",
                    Code = "TEST-DIRECT-PUB",
                    HskLevel = 1,
                    Status = "PUBLISHED"
                });
                await db.SaveChangesAsync();
            }

            var createReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/content/lessons");
            createReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
            createReq.Content = JsonContent.Create(new CreateLessonDto
            {
                CourseId = testCourseId,
                LessonNumber = 99,
                TitleZh = "Direct Published Lesson",
                TitleVi = "Bài học tạo trực tiếp published",
                Status = "PUBLISHED",
                DialogueJson = "[]",
                ListeningJson = "[]"
            }, options: _jsonOptions);

            var res = await _client.SendAsync(createReq);
            Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);

            var errBody = await res.Content.ReadAsStringAsync();
            Assert.Contains("RELEASE_GATE_VIOLATION", errBody);
        }
        finally
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var c = await db.Courses.FindAsync(testCourseId);
            if (c != null) db.Courses.Remove(c);
            await db.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task Regression_UpdateLesson_DirectlyWithPublishedStatus_OnDraftLesson_IsRejected()
    {
        var testCourseId = Guid.NewGuid();
        var testLessonId = Guid.NewGuid();
        var adminToken = await GetAdminTokenAsync();

        try
        {
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                db.Courses.Add(new CourseEntity
                {
                    Id = testCourseId,
                    Title = "Course For Update Publish Test",
                    Code = "TEST-UPDATE-PUB",
                    HskLevel = 1,
                    Status = "PUBLISHED"
                });

                db.Lessons.Add(new LessonEntity
                {
                    Id = testLessonId,
                    CourseId = testCourseId,
                    LessonNumber = 77,
                    TitleZh = "Draft Lesson For Update Test",
                    TitleVi = "Bài học nháp thử nghiệm PUT",
                    Status = "DRAFT",
                    DialogueJson = "[]",
                    ListeningJson = "[]"
                });
                await db.SaveChangesAsync();
            }

            var updateReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/lessons/{testLessonId}");
            updateReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
            updateReq.Content = JsonContent.Create(new UpdateLessonDto
            {
                LessonNumber = 77,
                TitleZh = "Draft Lesson For Update Test",
                TitleVi = "Bài học nháp thử nghiệm PUT",
                Status = "PUBLISHED"
            }, options: _jsonOptions);

            var res = await _client.SendAsync(updateReq);
            Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);

            var errBody = await res.Content.ReadAsStringAsync();
            Assert.Contains("RELEASE_GATE_VIOLATION", errBody);
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
    public async Task Regression_ContentManager_CannotSelfApprove_SegregationOfDuties()
    {
        var testCourseId = Guid.NewGuid();
        var testLessonId = Guid.NewGuid();
        var cmToken = await GetContentManagerTokenAsync();

        Guid cmUserId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cmUser = await db.Users.FirstAsync(u => u.Email == "contentmanager@zhongwenhub.edu.vn");
            cmUserId = cmUser.Id;
        }

        try
        {
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                db.Courses.Add(new CourseEntity
                {
                    Id = testCourseId,
                    Title = "Course For SoD Test",
                    Code = "TEST-SOD-PUB",
                    HskLevel = 1,
                    Status = "PUBLISHED"
                });

                // Author of this lesson is the Content Manager
                db.Lessons.Add(new LessonEntity
                {
                    Id = testLessonId,
                    CourseId = testCourseId,
                    LessonNumber = 66,
                    TitleZh = "Lesson Authored by CM",
                    TitleVi = "Bài học do CM biên soạn",
                    Status = "PENDING_REVIEW",
                    UpdatedByUserId = cmUserId,
                    DialogueJson = "[]",
                    ListeningJson = "[]"
                });
                await db.SaveChangesAsync();
            }

            // The SAME Content Manager attempts to approve their own lesson
            var selfApproveReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/lessons/{testLessonId}/review");
            selfApproveReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", cmToken);
            selfApproveReq.Content = JsonContent.Create(new ReviewContentDto
            {
                Status = "PUBLISHED",
                ReviewNotes = "Tác giả tự duyệt bài học của chính mình"
            }, options: _jsonOptions);

            var res = await _client.SendAsync(selfApproveReq);
            Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);

            var errBody = await res.Content.ReadAsStringAsync();
            Assert.Contains("Segregation of Duties", errBody);
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
