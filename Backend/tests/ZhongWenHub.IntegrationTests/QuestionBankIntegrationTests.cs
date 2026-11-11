using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ZhongWenHub.Business.Authentication.DTOs;
using ZhongWenHub.Business.QuestionBank.DTOs;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Persistence;
using Xunit;

namespace ZhongWenHub.IntegrationTests;

public class QuestionBankIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public QuestionBankIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> LoginAsync(string email, string password)
    {
        var res = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto
        {
            UsernameOrEmail = email,
            Password = password
        });
        res.EnsureSuccessStatusCode();
        var body = await res.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        return body!.AccessToken;
    }

    private Task<string> GetContentManagerTokenAsync()
        => LoginAsync("contentmanager@zhongwenhub.edu.vn", "ContentManager123!");

    private Task<string> GetStudentTokenAsync()
        => LoginAsync("student@zhongwenhub.edu.vn", "StudentPassword123!");

    [Fact]
    public async Task Rbac_EnforcesAuthorizationAcrossCmsAndPracticeEndpoints()
    {
        var unauthCms = await _client.GetAsync("/api/v1/question-bank");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthCms.StatusCode);

        var unauthPractice = await _client.PostAsJsonAsync("/api/v1/question-bank/practice-sessions", new CreatePracticeSessionRequestDto());
        Assert.Equal(HttpStatusCode.Unauthorized, unauthPractice.StatusCode);

        var studentToken = await GetStudentTokenAsync();
        using var studentReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/question-bank");
        studentReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var studentCms = await _client.SendAsync(studentReq);
        Assert.Equal(HttpStatusCode.Forbidden, studentCms.StatusCode);

        var staffToken = await GetContentManagerTokenAsync();
        using var staffReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/question-bank?page=1&pageSize=10");
        staffReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", staffToken);
        var staffCms = await _client.SendAsync(staffReq);
        Assert.Equal(HttpStatusCode.OK, staffCms.StatusCode);
    }

    [Fact]
    public async Task CmsImportGenerateReviewAndPublishGate_WorksAndPreventsAutoPublish()
    {
        var token = await GetContentManagerTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var uniqueTag = Guid.NewGuid().ToString("N")[..8];
        var uniqueHanzi = $"测验词{uniqueTag}";

        try
        {
            // 1. Import valid + invalid items -> valid item enters strictly as DRAFT / PENDING_REVIEW
            var importPayload = new ImportQuestionsRequestDto
            {
                DefaultSourceId = $"integration-test-{uniqueTag}",
                DefaultSourceLicense = "MIT",
                Items =
                [
                    new QuestionImportItemDto
                    {
                        Type = "multiple-choice",
                        Skill = "vocabulary",
                        HskLevel = 1,
                        Difficulty = "EASY",
                        Title = $"Import Valid {uniqueTag}",
                        Instruction = "Chọn nghĩa tiếng Việt đúng nhất.",
                        PromptHanzi = uniqueHanzi,
                        PromptPinyin = "cè yàn",
                        PromptVietnamese = "Kiểm tra pipeline",
                        Options = ["Đáp án chuẩn", "Nhiễu 1", "Nhiễu 2", "Nhiễu 3"],
                        CorrectOptionIndex = 0,
                        CorrectAnswer = "Đáp án chuẩn",
                        Explanation = "Câu kiểm thử import chuẩn hóa NFKC.",
                        Tags = $"hsk1,{uniqueTag}"
                    },
                    new QuestionImportItemDto
                    {
                        Type = "multiple-choice",
                        Skill = "vocabulary",
                        HskLevel = 1,
                        Title = "Invalid Duplicate Options",
                        Instruction = "Chọn đáp án",
                        PromptHanzi = "测试",
                        Options = ["Trùng", "Trùng", "Khác 1", "Khác 2"],
                        CorrectOptionIndex = 0,
                        CorrectAnswer = "Trùng"
                    }
                ]
            };

            var importRes = await _client.PostAsJsonAsync("/api/v1/question-bank/import", importPayload);
            Assert.Equal(HttpStatusCode.OK, importRes.StatusCode);
            var importBody = await importRes.Content.ReadFromJsonAsync<ImportQuestionsResultDto>(_jsonOptions);
            Assert.NotNull(importBody);
            Assert.Equal(1, importBody!.ImportedCount);
            Assert.Equal(1, importBody.RejectedCount);

            var importedId = importBody.ImportedIds.Single();

            // Re-importing same item must be skipped via ContentHash deduplication
            var dupRes = await _client.PostAsJsonAsync("/api/v1/question-bank/import", new ImportQuestionsRequestDto
            {
                Items = [importPayload.Items[0]]
            });
            var dupBody = await dupRes.Content.ReadFromJsonAsync<ImportQuestionsResultDto>(_jsonOptions);
            Assert.Equal(0, dupBody!.ImportedCount);
            Assert.Equal(1, dupBody.DuplicateSkippedCount);

            // Verify imported item is DRAFT + PENDING_REVIEW (never auto-published)
            var fetched = await _client.GetFromJsonAsync<QuestionBankItemDto>($"/api/v1/question-bank/{importedId}", _jsonOptions);
            Assert.Equal("DRAFT", fetched!.Status);
            Assert.Equal("PENDING_REVIEW", fetched.ReviewStatus);

            // 2. Publish gate blocks publishing before approval
            var blockedPublish = await _client.PostAsync($"/api/v1/question-bank/{importedId}/publish", null);
            Assert.Equal(HttpStatusCode.BadRequest, blockedPublish.StatusCode);

            // 3. Approve then Publish succeeds cleanly
            var approveRes = await _client.PostAsJsonAsync($"/api/v1/question-bank/{importedId}/review", new ReviewQuestionRequestDto
            {
                Decision = "APPROVED",
                ReviewNotes = "Verified in integration test",
                PublishImmediately = false
            });
            Assert.Equal(HttpStatusCode.OK, approveRes.StatusCode);

            var publishRes = await _client.PostAsync($"/api/v1/question-bank/{importedId}/publish", null);
            Assert.Equal(HttpStatusCode.OK, publishRes.StatusCode);
            var publishedItem = await publishRes.Content.ReadFromJsonAsync<QuestionBankItemDto>(_jsonOptions);
            Assert.Equal("PUBLISHED", publishedItem!.Status);
            Assert.Equal("APPROVED", publishedItem.ReviewStatus);

            // 4. Generate dry-run verifies generated questions are DRAFT / PENDING_REVIEW
            var genRes = await _client.PostAsJsonAsync("/api/v1/question-bank/generate", new GenerateQuestionsRequestDto
            {
                HskLevel = 1,
                Skill = "vocabulary",
                Type = "multiple-choice",
                Difficulty = "EASY",
                Count = 3,
                DryRun = true
            });
            Assert.Equal(HttpStatusCode.OK, genRes.StatusCode);
            var genBody = await genRes.Content.ReadFromJsonAsync<GenerateQuestionsResultDto>(_jsonOptions);
            Assert.NotNull(genBody);
            Assert.All(genBody!.PreviewItems, p =>
            {
                Assert.Equal("DRAFT", p.Status);
                Assert.Equal("PENDING_REVIEW", p.ReviewStatus);
            });
        }
        finally
        {
            _client.DefaultRequestHeaders.Authorization = null;
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.Exercises
                .Where(e => e.Tags != null && e.Tags.Contains(uniqueTag))
                .ExecuteDeleteAsync();
        }
    }

    [Fact]
    public async Task PracticeSession_DoesNotLeakAnswers_GradesServerSide_AndEnforcesXpIdempotency()
    {
        var token = await GetStudentTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        Guid? createdSessionId = null;

        try
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var student = await db.Users.FirstAsync(u => u.Email == "student@zhongwenhub.edu.vn");
            var profileBefore = await db.StudentLearningProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == student.Id);
            var xpBefore = profileBefore?.XpTotal ?? 0;

            // 1. Create practice session for HSK 1
            var createRes = await _client.PostAsJsonAsync("/api/v1/question-bank/practice-sessions", new CreatePracticeSessionRequestDto
            {
                HskLevel = 1,
                QuestionCount = 5,
                Mode = "weakness",
                PrioritizeWeakness = true
            });
            Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);

            var rawJson = await createRes.Content.ReadAsStringAsync();
            // Strictly verify NO answer key or explanation is leaked before submit
            Assert.DoesNotContain("\"correctOptionIndex\"", rawJson);
            Assert.DoesNotContain("\"correctAnswer\"", rawJson);
            Assert.DoesNotContain("\"explanation\"", rawJson);

            var session = JsonSerializer.Deserialize<PracticeSessionDto>(rawJson, _jsonOptions)!;
            createdSessionId = session.SessionId;
            Assert.NotEmpty(session.Questions);

            // Look up authoritative answers from DB solely to craft deterministic mix of right & wrong assertions
            var qIds = session.Questions.Select(q => q.Id).ToList();
            var dbExercises = await db.Exercises.AsNoTracking().Where(e => qIds.Contains(e.Id)).ToDictionaryAsync(e => e.Id);

            var submitAnswers = session.Questions.Select((q, idx) =>
            {
                var ex = dbExercises[q.Id];
                var makeCorrect = idx < 3; // 3 right, remaining wrong
                if (ex.CorrectOptionIndex.HasValue)
                {
                    var optIdx = makeCorrect
                        ? ex.CorrectOptionIndex.Value
                        : (ex.CorrectOptionIndex.Value + 1) % Math.Max(2, q.Options.Count);
                    return new SubmitPracticeAnswerDto { QuestionId = q.Id, SelectedOption = optIdx };
                }
                return new SubmitPracticeAnswerDto
                {
                    QuestionId = q.Id,
                    TextAnswer = makeCorrect ? ex.CorrectAnswer : "__WRONG_ANSWER__"
                };
            }).ToList();

            // 2. Submit answers -> Server grades & awards XP once
            var submitRes1 = await _client.PostAsJsonAsync(
                $"/api/v1/question-bank/practice-sessions/{session.SessionId}/submit",
                new SubmitPracticeSessionRequestDto { Answers = submitAnswers, TimeSpentSeconds = 95 });
            Assert.Equal(HttpStatusCode.OK, submitRes1.StatusCode);

            var result1 = await submitRes1.Content.ReadFromJsonAsync<SubmitPracticeSessionResultDto>(_jsonOptions);
            Assert.NotNull(result1);
            Assert.False(result1!.AlreadyCompleted);
            Assert.True(result1.XpAwarded > 0);
            Assert.Equal(session.Questions.Count, result1.QuestionResults.Count);

            var profileAfter1 = await db.StudentLearningProfiles.AsNoTracking().FirstAsync(p => p.UserId == student.Id);
            Assert.Equal(xpBefore + result1.XpAwarded, profileAfter1.XpTotal);

            // 3. Submit same session again -> 0 duplicate XP & idempotent response
            var submitRes2 = await _client.PostAsJsonAsync(
                $"/api/v1/question-bank/practice-sessions/{session.SessionId}/submit",
                new SubmitPracticeSessionRequestDto { Answers = submitAnswers, TimeSpentSeconds = 95 });
            Assert.Equal(HttpStatusCode.OK, submitRes2.StatusCode);

            var result2 = await submitRes2.Content.ReadFromJsonAsync<SubmitPracticeSessionResultDto>(_jsonOptions);
            Assert.True(result2!.AlreadyCompleted);
            Assert.Equal(0, result2.XpAwarded);

            var profileAfter2 = await db.StudentLearningProfiles.AsNoTracking().FirstAsync(p => p.UserId == student.Id);
            Assert.Equal(profileAfter1.XpTotal, profileAfter2.XpTotal);

            var xpTxCount = await db.StudentXpTransactions
                .CountAsync(x => x.UserId == student.Id && x.EventId == $"practice_session_qb_{session.SessionId}");
            Assert.Equal(1, xpTxCount);

            // 4. Adaptive recommendations & history reflect completed session
            var recsRes = await _client.GetFromJsonAsync<AdaptiveRecommendationsResponseDto>("/api/v1/question-bank/recommendations", _jsonOptions);
            Assert.True(recsRes!.TotalPublishedQuestions >= 60);

            var history = await _client.GetFromJsonAsync<List<PracticeSessionHistoryItemDto>>("/api/v1/question-bank/practice-history?limit=10", _jsonOptions);
            Assert.Contains(history!, h => h.SessionId == session.SessionId && h.Status == "COMPLETED");
        }
        finally
        {
            _client.DefaultRequestHeaders.Authorization = null;
            if (createdSessionId.HasValue)
            {
                using var scope = _factory.Services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var sid = createdSessionId.Value;
                var session = await db.QuestionBankPracticeSessions.FirstOrDefaultAsync(s => s.Id == sid);
                if (session != null)
                {
                    var profile = await db.StudentLearningProfiles.FirstOrDefaultAsync(p => p.UserId == session.UserId);
                    var tx = await db.StudentXpTransactions.FirstOrDefaultAsync(x => x.UserId == session.UserId && x.EventId == $"practice_session_qb_{sid}");
                    if (profile != null && tx != null)
                    {
                        profile.XpTotal = Math.Max(0, profile.XpTotal - tx.Amount);
                        db.StudentXpTransactions.Remove(tx);
                    }
                    db.QuestionBankPracticeSessions.Remove(session);
                    await db.SaveChangesAsync();
                }
            }
        }
    }

    [Fact]
    public async Task PaginationAndQueryPerformance_MaintainsLowLatencyOver5500IsolatedRecords()
    {
        var staffToken = await GetContentManagerTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", staffToken);

        var benchTag = $"perf_bench_{Guid.NewGuid():N}";
        var benchEntities = new List<ExerciseEntity>(5500);
        for (var i = 0; i < 5500; i++)
        {
            var hsk = (i % 4) + 1;
            var skill = (i % 4) switch { 0 => "vocabulary", 1 => "grammar", 2 => "reading", _ => "sentence" };
            var diff = (i % 3) switch { 0 => "EASY", 1 => "MEDIUM", _ => "HARD" };
            benchEntities.Add(new ExerciseEntity
            {
                Id = Guid.NewGuid(),
                Type = "multiple-choice",
                Skill = skill,
                HskLevel = hsk,
                Difficulty = diff,
                Title = $"Perf Benchmark {i}",
                Instruction = "Benchmark item",
                PromptHanzi = $"基准测试{i}",
                OptionsJson = "[\"A\",\"B\",\"C\",\"D\"]",
                CorrectOptionIndex = 0,
                CorrectAnswer = "A",
                Status = "ARCHIVED", // Strictly isolated from student PUBLISHED queries
                ReviewStatus = "DRAFT",
                SourceId = benchTag,
                SourceLicense = "INTERNAL_BENCHMARK",
                Tags = benchTag,
                ContentHash = $"bench_{i:D6}_{benchTag[..12]}",
                CreatedAt = DateTime.UtcNow
            });
        }

        try
        {
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                db.Exercises.AddRange(benchEntities);
                await db.SaveChangesAsync();
            }

            var sw = Stopwatch.StartNew();
            var pageRes = await _client.GetAsync($"/api/v1/question-bank?hskLevel=2&skill=grammar&status=ARCHIVED&search={benchTag}&page=3&pageSize=20");
            sw.Stop();
            Assert.Equal(HttpStatusCode.OK, pageRes.StatusCode);
            Assert.True(sw.ElapsedMilliseconds < 2500, $"Paginated composite query took {sw.ElapsedMilliseconds}ms");

            var swStats = Stopwatch.StartNew();
            var statsRes = await _client.GetAsync("/api/v1/question-bank/stats");
            swStats.Stop();
            Assert.Equal(HttpStatusCode.OK, statsRes.StatusCode);
            Assert.True(swStats.ElapsedMilliseconds < 2500, $"Stats aggregation over >5500 rows took {swStats.ElapsedMilliseconds}ms");

            var studentToken = await GetStudentTokenAsync();
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
            var swSession = Stopwatch.StartNew();
            var sessRes = await _client.PostAsJsonAsync("/api/v1/question-bank/practice-sessions", new CreatePracticeSessionRequestDto
            {
                HskLevel = 1,
                Mode = "random",
                QuestionCount = 10
            });
            swSession.Stop();
            Assert.Equal(HttpStatusCode.Created, sessRes.StatusCode);
            Assert.True(swSession.ElapsedMilliseconds < 2500, $"Practice session creation under >5500 rows took {swSession.ElapsedMilliseconds}ms");
            var createdSession = await sessRes.Content.ReadFromJsonAsync<PracticeSessionDto>(_jsonOptions);
            if (createdSession != null)
            {
                using var cleanupScope = _factory.Services.CreateScope();
                var cleanupDb = cleanupScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                await cleanupDb.QuestionBankPracticeSessions
                    .Where(s => s.Id == createdSession.SessionId)
                    .ExecuteDeleteAsync();
            }
        }
        finally
        {
            _client.DefaultRequestHeaders.Authorization = null;
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.Exercises
                .Where(e => e.SourceId == benchTag)
                .ExecuteDeleteAsync();
        }
    }

    [Fact]
    public async Task Phase2_PublishGate_AntiRepeat_Analytics_And_ReportQuestion_WorkEndToEnd()
    {
        var staffToken = await GetContentManagerTokenAsync();
        var studentToken = await GetStudentTokenAsync();
        Guid? tempQuestionId = null;
        var sessionIds = new List<Guid>();

        try
        {
            // 1. Create a question with a tautological explanation, approve it, verify publish gate rejects,
            // then update explanation to substantive Vietnamese and verify publish succeeds.
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", staffToken);
            var createRes = await _client.PostAsJsonAsync("/api/v1/question-bank", new CreateQuestionBankItemDto
            {
                Type = "multiple-choice",
                Skill = "vocabulary",
                HskLevel = 1,
                Difficulty = "EASY",
                Title = "Phase2 Test Vocabulary",
                Instruction = "Chọn nghĩa tiếng Việt đúng cho từ vựng sau.",
                PromptHanzi = "测试词Phase2",
                PromptPinyin = "cèshìcí",
                Options = ["Từ kiểm thử", "Bút chì", "Quyển sách", "Cái bàn"],
                CorrectOptionIndex = 0,
                CorrectAnswer = "Từ kiểm thử",
                Explanation = "Đáp án đúng là 'Từ kiểm thử'.",
                Status = "DRAFT",
                SourceId = "phase2-integration-test",
                SourceLicense = "INTERNAL_AUTHORED"
            });
            Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
            var createdItem = await createRes.Content.ReadFromJsonAsync<QuestionBankItemDto>(_jsonOptions);
            Assert.NotNull(createdItem);
            tempQuestionId = createdItem!.Id;
            Assert.False(createdItem.HasSubstantiveExplanation);

            var approveRes = await _client.PostAsJsonAsync($"/api/v1/question-bank/{tempQuestionId}/review", new ReviewQuestionRequestDto
            {
                Decision = "APPROVED",
                ReviewNotes = "Academic check pass"
            });
            Assert.Equal(HttpStatusCode.OK, approveRes.StatusCode);

            var publishFail = await _client.PostAsync($"/api/v1/question-bank/{tempQuestionId}/publish", null);
            Assert.Equal(HttpStatusCode.BadRequest, publishFail.StatusCode);

            var updateRes = await _client.PutAsJsonAsync($"/api/v1/question-bank/{tempQuestionId}", new UpdateQuestionBankItemDto
            {
                Type = "multiple-choice",
                Skill = "vocabulary",
                HskLevel = 1,
                Difficulty = "EASY",
                Title = "Phase2 Test Vocabulary",
                Instruction = "Chọn nghĩa tiếng Việt đúng cho từ vựng sau.",
                PromptHanzi = "测试词Phase2",
                PromptPinyin = "cèshìcí",
                Options = ["Từ kiểm thử", "Bút chì", "Quyển sách", "Cái bàn"],
                CorrectOptionIndex = 0,
                CorrectAnswer = "Từ kiểm thử",
                Explanation = "Danh từ '测试词' (cèshìcí) nghĩa là từ kiểm thử; 'Bút chì' là 铅笔, 'Quyển sách' là 书, 'Cái bàn' là 桌子.",
                Status = "DRAFT",
                SourceId = "phase2-integration-test",
                SourceLicense = "INTERNAL_AUTHORED"
            });
            Assert.Equal(HttpStatusCode.OK, updateRes.StatusCode);

            var publishOk = await _client.PostAsync($"/api/v1/question-bank/{tempQuestionId}/publish", null);
            Assert.Equal(HttpStatusCode.OK, publishOk.StatusCode);

            // 2. Student reports this temporary item -> tagged & marked NEEDS_ACADEMIC_REVIEW
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
            var reportRes = await _client.PostAsJsonAsync($"/api/v1/question-bank/{tempQuestionId}/report", new ReportQuestionRequestDto
            {
                Reason = "Nội dung kiểm thử cần rà soát",
                Details = "Test report từ Integration Test."
            });
            Assert.Equal(HttpStatusCode.OK, reportRes.StatusCode);
            var reportBody = await reportRes.Content.ReadFromJsonAsync<ReportQuestionResultDto>(_jsonOptions);
            Assert.NotNull(reportBody);
            Assert.Contains("reported-issue", reportBody!.Tags);
            Assert.Equal("NEEDS_ACADEMIC_REVIEW", reportBody.ReviewStatus);

            // 3. Consecutive practice sessions avoid repeating questions back-to-back & recommendations return skill/HSK stats
            var sess1Res = await _client.PostAsJsonAsync("/api/v1/question-bank/practice-sessions", new CreatePracticeSessionRequestDto
            {
                HskLevel = 1,
                Mode = "random",
                QuestionCount = 8
            });
            Assert.Equal(HttpStatusCode.Created, sess1Res.StatusCode);
            var sess1 = (await sess1Res.Content.ReadFromJsonAsync<PracticeSessionDto>(_jsonOptions))!;
            sessionIds.Add(sess1.SessionId);

            var sess2Res = await _client.PostAsJsonAsync("/api/v1/question-bank/practice-sessions", new CreatePracticeSessionRequestDto
            {
                HskLevel = 1,
                Mode = "random",
                QuestionCount = 8
            });
            Assert.Equal(HttpStatusCode.Created, sess2Res.StatusCode);
            var sess2 = (await sess2Res.Content.ReadFromJsonAsync<PracticeSessionDto>(_jsonOptions))!;
            sessionIds.Add(sess2.SessionId);

            var overlap = sess1.Questions.Select(q => q.Id).Intersect(sess2.Questions.Select(q => q.Id)).Count();
            Assert.Equal(0, overlap);

            var recs = await _client.GetFromJsonAsync<AdaptiveRecommendationsResponseDto>("/api/v1/question-bank/recommendations", _jsonOptions);
            Assert.NotNull(recs);
            Assert.NotNull(recs!.SkillStats);
            Assert.NotNull(recs.HskStats);
        }
        finally
        {
            _client.DefaultRequestHeaders.Authorization = null;
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            if (sessionIds.Count > 0)
            {
                await db.QuestionBankPracticeSessions
                    .Where(s => sessionIds.Contains(s.Id))
                    .ExecuteDeleteAsync();
            }
            if (tempQuestionId.HasValue)
            {
                await db.Exercises
                    .Where(e => e.Id == tempQuestionId.Value)
                    .ExecuteDeleteAsync();
            }
        }
    }
}

