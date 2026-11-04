using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ZhongWenHub.Business.Authentication.DTOs;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Content.DTOs;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Persistence;
using Xunit;

namespace ZhongWenHub.IntegrationTests;

public class Hsk1MeaningAndPublishIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public Hsk1MeaningAndPublishIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> GetAdminTokenAsync()
    {
        var loginReq = new LoginRequestDto
        {
            UsernameOrEmail = "admin@zhongwenhub.edu.vn",
            Password = "AdminPassword123!"
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
    public async Task UpdateMeaningAndPublishWorkflow_MeetsAllAcceptanceCriteria()
    {
        var adminToken = await GetAdminTokenAsync();
        var studentToken = await GetStudentTokenAsync();

        // 1. Prepare two DRAFT test words in database: one for single update/publish, one for batch publish
        Guid testWordId1 = Guid.NewGuid();
        Guid testWordId2 = Guid.NewGuid();
        Guid testWordWithoutMeaningId = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            db.Vocabularies.Add(new VocabularyEntity
            {
                Id = testWordId1,
                Hanzi = "八",
                Pinyin = "bā",
                MeaningVi = "", // Initially empty
                PartOfSpeech = "Số từ",
                HskLevel = 1,
                Status = "DRAFT",
                SourceDataset = "HSK 3.0",
                SourceEntryId = "2"
            });

            db.Vocabularies.Add(new VocabularyEntity
            {
                Id = testWordId2,
                Hanzi = "爸爸",
                Pinyin = "bàba",
                MeaningVi = "bố, ba, cha", // Has meaning
                PartOfSpeech = "Danh từ",
                HskLevel = 1,
                Status = "DRAFT",
                SourceDataset = "HSK 3.0",
                SourceEntryId = "3"
            });

            db.Vocabularies.Add(new VocabularyEntity
            {
                Id = testWordWithoutMeaningId,
                Hanzi = "白天",
                Pinyin = "báitiān",
                MeaningVi = "", // Missing meaning
                PartOfSpeech = "Danh từ",
                HskLevel = 1,
                Status = "DRAFT",
                SourceDataset = "HSK 3.0",
                SourceEntryId = "5"
            });

            await db.SaveChangesAsync();
        }

        // Test Step 1: Content Manager updates Vietnamese meaning and saves as DRAFT
        var updateDraftReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/admin/vocabularies/{testWordId1}");
        updateDraftReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        updateDraftReq.Content = JsonContent.Create(new UpdateVocabularyDto
        {
            HskLevel = 1,
            Hanzi = "八",
            Pinyin = "bā",
            MeaningVi = "tám (số 8)",
            PartOfSpeech = "Số từ",
            Status = "DRAFT"
        });
        var updateDraftRes = await _client.SendAsync(updateDraftReq);
        Assert.Equal(HttpStatusCode.OK, updateDraftRes.StatusCode);

        // Test Step 2: Verify meaning persisted in database as DRAFT
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var saved = await db.Vocabularies.FindAsync(testWordId1);
            Assert.NotNull(saved);
            Assert.Equal("tám (số 8)", saved.MeaningVi);
            Assert.Equal("DRAFT", saved.Status);
        }

        // Test Step 3: STUDENT cannot see the DRAFT word even with meaning
        var studentGetReq = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/content/vocabularies/{testWordId1}");
        studentGetReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var studentGetRes = await _client.SendAsync(studentGetReq);
        Assert.Equal(HttpStatusCode.NotFound, studentGetRes.StatusCode);

        // Test Step 4: Disallow publishing word without MeaningVi
        var invalidPublishReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/admin/vocabularies/{testWordWithoutMeaningId}");
        invalidPublishReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        invalidPublishReq.Content = JsonContent.Create(new UpdateVocabularyDto
        {
            HskLevel = 1,
            Hanzi = "白天",
            Pinyin = "báitiān",
            MeaningVi = "   ", // whitespace only
            PartOfSpeech = "Danh từ",
            Status = "PUBLISHED"
        });
        var invalidPublishRes = await _client.SendAsync(invalidPublishReq);
        Assert.Equal(HttpStatusCode.BadRequest, invalidPublishRes.StatusCode);

        // Test Step 5: Publish the valid word testWordId1
        var publishReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/admin/vocabularies/{testWordId1}");
        publishReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        publishReq.Content = JsonContent.Create(new UpdateVocabularyDto
        {
            HskLevel = 1,
            Hanzi = "八",
            Pinyin = "bā",
            MeaningVi = "tám (số 8)",
            PartOfSpeech = "Số từ",
            Status = "PUBLISHED"
        });
        var publishRes = await _client.SendAsync(publishReq);
        Assert.Equal(HttpStatusCode.OK, publishRes.StatusCode);

        // Test Step 6: STUDENT can now see the PUBLISHED word
        var studentVerifyReq = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/content/vocabularies/{testWordId1}");
        studentVerifyReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var studentVerifyRes = await _client.SendAsync(studentVerifyReq);
        Assert.Equal(HttpStatusCode.OK, studentVerifyRes.StatusCode);
        var studentWord = await studentVerifyRes.Content.ReadFromJsonAsync<VocabularyDto>(_jsonOptions);
        Assert.NotNull(studentWord);
        Assert.Equal("八", studentWord.Hanzi);
        Assert.Equal("bā", studentWord.Pinyin);
        Assert.Equal("tám (số 8)", studentWord.MeaningVi);
        Assert.Equal("PUBLISHED", studentWord.Status);

        // Test Step 7: Batch Publish
        // Pass both testWordId2 (has meaning) and testWordWithoutMeaningId (lacks meaning)
        var batchPublishReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/content/vocabularies/batch-publish");
        batchPublishReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        batchPublishReq.Content = JsonContent.Create(new BatchPublishRequestDto
        {
            Ids = new List<Guid> { testWordId2, testWordWithoutMeaningId }
        });
        var batchPublishRes = await _client.SendAsync(batchPublishReq);
        Assert.Equal(HttpStatusCode.OK, batchPublishRes.StatusCode);
        var batchResult = await batchPublishRes.Content.ReadFromJsonAsync<BatchPublishResultDto>(_jsonOptions);
        Assert.NotNull(batchResult);
        Assert.Equal(1, batchResult.PublishedCount); // testWordId2 published
        Assert.Equal(1, batchResult.SkippedCount);   // testWordWithoutMeaningId skipped
        Assert.Single(batchResult.SkippedReasons);

        // Verify testWordId2 is now PUBLISHED and testWordWithoutMeaningId remains DRAFT
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var w2 = await db.Vocabularies.FindAsync(testWordId2);
            var wWithout = await db.Vocabularies.FindAsync(testWordWithoutMeaningId);
            Assert.NotNull(w2);
            Assert.Equal("PUBLISHED", w2.Status);
            Assert.NotNull(wWithout);
            Assert.Equal("DRAFT", wWithout.Status);
        }

        // Test Step 8: STUDENT cannot batch-publish (Forbidden)
        var studentBatchReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/content/vocabularies/batch-publish");
        studentBatchReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        studentBatchReq.Content = JsonContent.Create(new BatchPublishRequestDto
        {
            Ids = new List<Guid> { testWordWithoutMeaningId }
        });
        var studentBatchRes = await _client.SendAsync(studentBatchReq);
        Assert.Equal(HttpStatusCode.Forbidden, studentBatchRes.StatusCode);
    }
}
