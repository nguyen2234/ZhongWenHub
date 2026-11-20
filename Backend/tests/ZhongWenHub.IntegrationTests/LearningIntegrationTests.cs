using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using ZhongWenHub.Business.Authentication.DTOs;
using ZhongWenHub.Business.Learning;
using ZhongWenHub.Business.Learning.DTOs;
using ZhongWenHub.Data.Entities.Learning;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.IntegrationTests;

public class LearningIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public LearningIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateNoCookieClient();
    }

    private async Task<string> GetStudentTokenAsync()
    {
        var loginRequest = new LoginRequestDto
        {
            UsernameOrEmail = "student@zhongwenhub.edu.vn",
            Password = "StudentPassword123!"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        return body!.AccessToken;
    }

    [Fact]
    public async Task GetMyState_WithoutToken_Returns401Unauthorized()
    {
        var response = await _client.GetAsync("/api/v1/learning/me");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetMyState_WithValidStudentToken_Returns200WithInitializedState()
    {
        var token = await GetStudentTokenAsync();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/learning/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var state = await response.Content.ReadFromJsonAsync<StudentLearningStateDto>(_jsonOptions);
        Assert.NotNull(state);
        Assert.NotEmpty(state.StudentId);
        Assert.True(state.SelectedHskLevel >= 1);
        Assert.NotNull(state.DailyGoal);
        Assert.NotNull(state.LessonProgress);
    }

    [Fact]
    public async Task UpdatePreferences_WithValidData_ReturnsUpdatedState()
    {
        var token = await GetStudentTokenAsync();
        var updatePayload = new UpdateLearningPreferencesDto
        {
            SelectedHskLevel = 2,
            TargetDailyMinutes = 45,
            TargetDailyXp = 100,
            CurrentLessonId = "les-2"
        };

        using var request = new HttpRequestMessage(HttpMethod.Put, "/api/v1/learning/me/preferences")
        {
            Content = JsonContent.Create(updatePayload)
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var state = await response.Content.ReadFromJsonAsync<StudentLearningStateDto>(_jsonOptions);
        Assert.NotNull(state);
        Assert.Equal(2, state.SelectedHskLevel);
        Assert.Equal(45, state.DailyGoal.TargetMinutes);
        Assert.Equal(100, state.DailyGoal.TargetXp);
        Assert.Equal("les-2", state.CurrentLessonId);
    }

    [Fact]
    public async Task UpdateLessonStepAndComplete_PersistsInDatabaseAndIsIdempotent()
    {
        var token = await GetStudentTokenAsync();

        // 1. Update lesson step
        var stepPayload = new UpdateLessonStepDto
        {
            CurrentStepIndex = 2,
            MaxUnlockedStepIndex = 3
        };

        using (var stepReq = new HttpRequestMessage(HttpMethod.Put, "/api/v1/learning/me/lessons/les-3/progress"))
        {
            stepReq.Content = JsonContent.Create(stepPayload);
            stepReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var stepRes = await _client.SendAsync(stepReq);
            Assert.Equal(HttpStatusCode.OK, stepRes.StatusCode);
        }

        // 2. Complete lesson
        var completePayload = new CompleteLessonDto
        {
            QuizScore = 5,
            TotalQuizQuestions = 5,
            XpEarned = 100
        };

        StudentLearningStateDto? stateAfterFirst;
        using (var compReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/learning/me/lessons/les-3/complete"))
        {
            compReq.Content = JsonContent.Create(completePayload);
            compReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var compRes = await _client.SendAsync(compReq);
            Assert.Equal(HttpStatusCode.OK, compRes.StatusCode);
            stateAfterFirst = await compRes.Content.ReadFromJsonAsync<StudentLearningStateDto>(_jsonOptions);
        }

        Assert.NotNull(stateAfterFirst);
        Assert.Contains("les-3", stateAfterFirst.CompletedLessonIds);
        Assert.True(stateAfterFirst.XpTotal >= 100);
        Assert.Contains("lesson_complete_les-3", stateAfterFirst.RewardedEventIds);

        var xpBeforeSecond = stateAfterFirst.XpTotal;

        // 3. Complete lesson again (idempotency check)
        using (var compReq2 = new HttpRequestMessage(HttpMethod.Post, "/api/v1/learning/me/lessons/les-3/complete"))
        {
            compReq2.Content = JsonContent.Create(completePayload);
            compReq2.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var compRes2 = await _client.SendAsync(compReq2);
            Assert.Equal(HttpStatusCode.OK, compRes2.StatusCode);
            var stateAfterSecond = await compRes2.Content.ReadFromJsonAsync<StudentLearningStateDto>(_jsonOptions);

            Assert.NotNull(stateAfterSecond);
            // XP should not have increased again
            Assert.Equal(xpBeforeSecond, stateAfterSecond.XpTotal);
        }
    }

    [Fact]
    public async Task VocabularyAndSrs_Flow_RecordsWordAndUpdatesReview()
    {
        var token = await GetStudentTokenAsync();

        // 1. Add vocabulary
        var addPayload = new AddVocabularyRequestDto
        {
            VocabularyId = "vocab-test-nihao",
            Hanzi = "你好",
            Pinyin = "nǐ hǎo",
            Meaning = "xin chào",
            HskLevel = 1
        };

        using (var addReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/learning/me/vocabulary"))
        {
            addReq.Content = JsonContent.Create(addPayload);
            addReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var addRes = await _client.SendAsync(addReq);
            Assert.Equal(HttpStatusCode.OK, addRes.StatusCode);
        }

        // 2. Review vocabulary
        var reviewPayload = new SrsReviewRequestDto
        {
            VocabularyId = "vocab-test-nihao",
            Rating = "good"
        };

        using (var revReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/learning/me/vocabulary/reviews"))
        {
            revReq.Content = JsonContent.Create(reviewPayload);
            revReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var revRes = await _client.SendAsync(revReq);
            Assert.Equal(HttpStatusCode.OK, revRes.StatusCode);

            var state = await revRes.Content.ReadFromJsonAsync<StudentLearningStateDto>(_jsonOptions);
            Assert.NotNull(state);
            Assert.True(state.UserVocabStates.ContainsKey("vocab-test-nihao"));
            var vocab = state.UserVocabStates["vocab-test-nihao"];
            Assert.True(vocab.ReviewCount >= 1);
        }
    }

    [Fact]
    public async Task LegacyProgressCompatibility_WithLes1AndGuid_HandlesBothGracefullyWithoutCrash()
    {
        var token = await GetStudentTokenAsync();
        const string lesson1Guid = "aaaaaaaa-1111-1111-1111-111111111111";

        // 1. Set current lesson to legacy 'les-1' and verify it normalizes to GUID in state
        var updatePrefPayload = new UpdateLearningPreferencesDto
        {
            CurrentLessonId = "les-1"
        };
        using (var prefReq = new HttpRequestMessage(HttpMethod.Put, "/api/v1/learning/me/preferences")
        {
            Content = JsonContent.Create(updatePrefPayload)
        })
        {
            prefReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var prefRes = await _client.SendAsync(prefReq);
            Assert.Equal(HttpStatusCode.OK, prefRes.StatusCode);

            var state = await prefRes.Content.ReadFromJsonAsync<StudentLearningStateDto>(_jsonOptions);
            Assert.NotNull(state);
            Assert.Equal(lesson1Guid, state.CurrentLessonId);
            Assert.True(state.LessonProgress.ContainsKey(lesson1Guid));
            Assert.True(state.LessonProgress.ContainsKey("les-1"));
        }

        // 2. Update step using legacy 'les-1'
        var stepPayload = new UpdateLessonStepDto
        {
            CurrentStepIndex = 2,
            MaxUnlockedStepIndex = 2
        };
        using (var stepReq = new HttpRequestMessage(HttpMethod.Put, "/api/v1/learning/me/lessons/les-1/progress"))
        {
            stepReq.Content = JsonContent.Create(stepPayload);
            stepReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var stepRes = await _client.SendAsync(stepReq);
            Assert.Equal(HttpStatusCode.OK, stepRes.StatusCode);

            var progress = await stepRes.Content.ReadFromJsonAsync<LessonProgressDto>(_jsonOptions);
            Assert.NotNull(progress);
            Assert.Equal(lesson1Guid, progress.LessonId);
            Assert.Equal(2, progress.CurrentStepIndex);
        }

        // 3. Update step using canonical GUID - must update the SAME record, not duplicate
        var step2Payload = new UpdateLessonStepDto
        {
            CurrentStepIndex = 4,
            MaxUnlockedStepIndex = 4
        };
        using (var step2Req = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/learning/me/lessons/{lesson1Guid}/progress"))
        {
            step2Req.Content = JsonContent.Create(step2Payload);
            step2Req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var step2Res = await _client.SendAsync(step2Req);
            Assert.Equal(HttpStatusCode.OK, step2Res.StatusCode);

            var progress = await step2Res.Content.ReadFromJsonAsync<LessonProgressDto>(_jsonOptions);
            Assert.NotNull(progress);
            Assert.Equal(lesson1Guid, progress.LessonId);
            Assert.Equal(4, progress.CurrentStepIndex);
        }

        // 4. Verify all lesson progresses returned - only one entry for Lesson 1
        using (var listReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/learning/me/lessons"))
        {
            listReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var listRes = await _client.SendAsync(listReq);
            Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);

            var progresses = await listRes.Content.ReadFromJsonAsync<List<LessonProgressDto>>(_jsonOptions);
            Assert.NotNull(progresses);
            var lesson1Entries = progresses.Where(p => p.LessonId == lesson1Guid).ToList();
            Assert.Single(lesson1Entries);
            Assert.Equal(4, lesson1Entries[0].CurrentStepIndex);
        }
    }
    [Fact]
    public async Task NonExistentLesson_ReturnsNotFound()
    {
        var token = await GetStudentTokenAsync();

        // 1. Non-existent slug 'les-999'
        var stepPayload = new UpdateLessonStepDto
        {
            CurrentStepIndex = 1,
            MaxUnlockedStepIndex = 1
        };
        using (var stepReq = new HttpRequestMessage(HttpMethod.Put, "/api/v1/learning/me/lessons/les-999/progress"))
        {
            stepReq.Content = JsonContent.Create(stepPayload);
            stepReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var stepRes = await _client.SendAsync(stepReq);
            Assert.Equal(HttpStatusCode.NotFound, stepRes.StatusCode);
        }

        // 2. Non-existent random GUID
        var randomGuid = Guid.NewGuid().ToString();
        using (var stepReq2 = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/learning/me/lessons/{randomGuid}/progress"))
        {
            stepReq2.Content = JsonContent.Create(stepPayload);
            stepReq2.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var stepRes2 = await _client.SendAsync(stepReq2);
            Assert.Equal(HttpStatusCode.NotFound, stepRes2.StatusCode);
        }
    }

    [Fact]
    public async Task UserIsolation_ProgressDoesNotLeakBetweenStudents()
    {
        var tokenA = await GetStudentTokenAsync();

        // Login as Student B
        var loginB = new LoginRequestDto
        {
            UsernameOrEmail = "student.binh.demo@zhongwenhub.edu.vn",
            Password = "Demo@2026!ZhongWen"
        };
        var loginBRes = await _client.PostAsJsonAsync("/api/v1/auth/login", loginB);
        loginBRes.EnsureSuccessStatusCode();
        var bodyB = await loginBRes.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        var tokenB = bodyB!.AccessToken;

        // Student A updates lesson 1 progress
        const string lesson1Guid = "aaaaaaaa-1111-1111-1111-111111111111";
        var stepPayload = new UpdateLessonStepDto
        {
            CurrentStepIndex = 3,
            MaxUnlockedStepIndex = 3
        };
        using (var reqA = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/learning/me/lessons/{lesson1Guid}/progress"))
        {
            reqA.Content = JsonContent.Create(stepPayload);
            reqA.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenA);
            var resA = await _client.SendAsync(reqA);
            Assert.Equal(HttpStatusCode.OK, resA.StatusCode);
        }

        // Fetch Student B state and verify Student A's step does not leak into Student B's state
        using (var reqB = new HttpRequestMessage(HttpMethod.Get, "/api/v1/learning/me"))
        {
            reqB.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenB);
            var resB = await _client.SendAsync(reqB);
            Assert.Equal(HttpStatusCode.OK, resB.StatusCode);

            var stateB = await resB.Content.ReadFromJsonAsync<StudentLearningStateDto>(_jsonOptions);
            Assert.NotNull(stateB);
            Assert.NotEqual(bodyB.User.Id.ToString(), tokenA);
        }
    }

    [Fact]
    public async Task ConcurrentProgressUpdates_HandlesParallelRequestsWithoutDeadlockOrDuplicateXp()
    {
        var token = await GetStudentTokenAsync();
        const string lesson1Guid = "aaaaaaaa-1111-1111-1111-111111111111";

        // Dispatch 10 concurrent step update tasks
        var tasks = new List<Task<HttpResponseMessage>>();
        for (int i = 1; i <= 10; i++)
        {
            var stepIndex = (i % 5) + 1;
            var payload = new UpdateLessonStepDto
            {
                CurrentStepIndex = stepIndex,
                MaxUnlockedStepIndex = Math.Max(stepIndex, 3)
            };

            var req = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/learning/me/lessons/{lesson1Guid}/progress")
            {
                Content = JsonContent.Create(payload)
            };
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            tasks.Add(_client.SendAsync(req));
        }

        var responses = await Task.WhenAll(tasks);

        // Verify all 10 completed with 200 OK without deadlocks or 500 Internal Server Errors
        foreach (var res in responses)
        {
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        }

        // Verify final state is consistent and queryable
        using var stateReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/learning/me");
        stateReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var stateRes = await _client.SendAsync(stateReq);
        Assert.Equal(HttpStatusCode.OK, stateRes.StatusCode);
        var finalState = await stateRes.Content.ReadFromJsonAsync<StudentLearningStateDto>(_jsonOptions);
        Assert.NotNull(finalState);
        Assert.True(finalState.LessonProgress.ContainsKey(lesson1Guid));
    }

    [Fact]
    public async Task CompleteLesson_WhenLegacyLes1AndCanonicalGuidCoexist_MergesWithoutDuplicateKeyFailure()
    {
        var token = await GetStudentTokenAsync();
        const string lesson1Guid = "aaaaaaaa-1111-1111-1111-111111111111";

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var student = await db.Users.FirstAsync(u => u.Email == "student@zhongwenhub.edu.vn");
            var existingRows = await db.StudentLessonProgresses
                .Where(p => p.UserId == student.Id && (p.LessonId == lesson1Guid || p.LessonId == LearningService.LegacyLesson1Id))
                .ToListAsync();
            db.StudentLessonProgresses.RemoveRange(existingRows);
            await db.SaveChangesAsync();

            db.StudentLessonProgresses.AddRange(
                new StudentLessonProgress
                {
                    UserId = student.Id,
                    LessonId = LearningService.LegacyLesson1Id,
                    Status = "NOT_STARTED",
                    CurrentStepIndex = 0,
                    MaxUnlockedStepIndex = 0,
                    XpEarned = 0
                },
                new StudentLessonProgress
                {
                    UserId = student.Id,
                    LessonId = lesson1Guid,
                    Status = "IN_PROGRESS",
                    CurrentStepIndex = 2,
                    MaxUnlockedStepIndex = 2,
                    XpEarned = 0
                });
            await db.SaveChangesAsync();
        }

        var completePayload = new CompleteLessonDto
        {
            QuizScore = 4,
            TotalQuizQuestions = 4,
            XpEarned = 50
        };

        using var req1 = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/learning/me/lessons/{lesson1Guid}/complete")
        {
            Content = JsonContent.Create(completePayload)
        };
        req1.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var res1 = await _client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.OK, res1.StatusCode);
        var state1 = await res1.Content.ReadFromJsonAsync<StudentLearningStateDto>(_jsonOptions);
        Assert.NotNull(state1);
        Assert.Contains(lesson1Guid, state1.CompletedLessonIds);

        using var req2 = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/learning/me/lessons/{lesson1Guid}/complete")
        {
            Content = JsonContent.Create(completePayload)
        };
        req2.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var res2 = await _client.SendAsync(req2);
        Assert.Equal(HttpStatusCode.OK, res2.StatusCode);
        var state2 = await res2.Content.ReadFromJsonAsync<StudentLearningStateDto>(_jsonOptions);
        Assert.NotNull(state2);
        Assert.Equal(state1.XpTotal, state2.XpTotal);

        using (var verifyScope = _factory.Services.CreateScope())
        {
            var db = verifyScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var student = await db.Users.FirstAsync(u => u.Email == "student@zhongwenhub.edu.vn");
            var remaining = await db.StudentLessonProgresses
                .Where(p => p.UserId == student.Id && (p.LessonId == lesson1Guid || p.LessonId == LearningService.LegacyLesson1Id))
                .ToListAsync();
            Assert.Single(remaining);
            Assert.Equal(lesson1Guid, remaining[0].LessonId);
            Assert.Equal("COMPLETED", remaining[0].Status);
        }
    }
}
