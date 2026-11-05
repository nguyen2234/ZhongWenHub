using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;
using ZhongWenHub.Business.Authentication.DTOs;
using ZhongWenHub.Business.Learning.DTOs;

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
}
