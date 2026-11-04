using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ZhongWenHub.Business.Authentication.DTOs;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Content.DTOs;
using ZhongWenHub.Data.Persistence;
using Xunit;

namespace ZhongWenHub.IntegrationTests;

public class Hsk1ImportIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public Hsk1ImportIntegrationTests(CustomWebApplicationFactory factory)
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

    private MultipartFormDataContent CreateCsvMultipartContent(string csvContent, string fileName = "hsk-1.csv")
    {
        var multipart = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(Encoding.UTF8.GetBytes(csvContent));
        fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("text/csv");
        multipart.Add(fileContent, "file", fileName);
        return multipart;
    }

    [Fact]
    public async Task ImportHsk1_FullWorkflow_MeetsAllAcceptanceCriteria()
    {
        // Clean any imported HSK 3.0 records in test DB first
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var imported = await db.Vocabularies.Where(v => v.SourceDataset == "HSK 3.0").ToListAsync();
            if (imported.Count > 0)
            {
                db.Vocabularies.RemoveRange(imported);
                await db.SaveChangesAsync();
            }
        }

        var adminToken = await GetAdminTokenAsync();
        var studentToken = await GetStudentTokenAsync();

        // 4. Record Vocabulary count before import
        int countBefore;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            countBefore = await db.Vocabularies.CountAsync();
        }

        // 9. STUDENT has no permission to import (should get 403 Forbidden)
        var studentImportReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/admin/vocabularies/import-csv");
        studentImportReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        studentImportReq.Content = CreateCsvMultipartContent("id,level,hanzi,pinyin,part_of_speech\n1,1,爱,ài,动\n");
        var studentImportRes = await _client.SendAsync(studentImportReq);
        Assert.Equal(HttpStatusCode.Forbidden, studentImportRes.StatusCode);

        // 5. Import real hsk-1.csv as ADMIN via real API
        string? searchDir = AppContext.BaseDirectory;
        string? csvPath = null;
        while (!string.IsNullOrEmpty(searchDir))
        {
            var candidate = Path.Combine(searchDir, "hsk-1.csv");
            if (File.Exists(candidate))
            {
                csvPath = candidate;
                break;
            }
            var parent = Directory.GetParent(searchDir);
            searchDir = parent?.FullName;
        }
        Assert.True(File.Exists(csvPath), $"hsk-1.csv should exist in repository root");
        var realCsvContent = await File.ReadAllTextAsync(csvPath!, Encoding.UTF8);

        var importReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/admin/vocabularies/import-csv");
        importReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        importReq.Content = CreateCsvMultipartContent(realCsvContent, "hsk-1.csv");

        var importRes = await _client.SendAsync(importReq);
        Assert.Equal(HttpStatusCode.OK, importRes.StatusCode);

        var importResult = await importRes.Content.ReadFromJsonAsync<VocabularyImportResultDto>(_jsonOptions);
        Assert.NotNull(importResult);
        Assert.Equal(300, importResult.TotalRows);
        Assert.Equal(291, importResult.SuccessCount);
        Assert.Equal(9, importResult.SkippedDuplicateCount); // 9 existing seed vocabularies correctly identified as duplicates
        Assert.Equal(0, importResult.ErrorCount);

        // 6. Verify count in SQL Server
        int countAfter;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            countAfter = await db.Vocabularies.CountAsync();
            Assert.Equal(countBefore + 291, countAfter);

            // 8. Verify ALL 291 newly imported words are DRAFT with empty MeaningVi and correct SourceDataset
            var importedList = await db.Vocabularies.Where(v => v.SourceDataset == "HSK 3.0").ToListAsync();
            Assert.Equal(291, importedList.Count);
            Assert.All(importedList, v =>
            {
                Assert.Equal("DRAFT", v.Status);
                Assert.True(string.IsNullOrEmpty(v.MeaningVi), "MeaningVi should be empty when DRAFT");
                Assert.Equal(1, v.HskLevel);
                Assert.Equal("HSK 3.0", v.SourceDataset);
                Assert.False(string.IsNullOrWhiteSpace(v.SourceEntryId));
            });
        }

        // 7. Re-import same file: verify no duplicates created!
        var reimportReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/admin/vocabularies/import-csv");
        reimportReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        reimportReq.Content = CreateCsvMultipartContent(realCsvContent, "hsk-1.csv");

        var reimportRes = await _client.SendAsync(reimportReq);
        Assert.Equal(HttpStatusCode.OK, reimportRes.StatusCode);

        var reimportResult = await reimportRes.Content.ReadFromJsonAsync<VocabularyImportResultDto>(_jsonOptions);
        Assert.NotNull(reimportResult);
        Assert.Equal(300, reimportResult.TotalRows);
        Assert.Equal(0, reimportResult.SuccessCount);
        Assert.Equal(300, reimportResult.SkippedDuplicateCount);
        Assert.Equal(0, reimportResult.ErrorCount);

        // Verify count in SQL Server did not increase
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            int countAfterReimport = await db.Vocabularies.CountAsync();
            Assert.Equal(countAfter, countAfterReimport);
        }

        // 10. STUDENT does NOT see DRAFT words
        var studentGetReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/content/vocabularies?pageSize=100");
        studentGetReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var studentGetRes = await _client.SendAsync(studentGetReq);
        Assert.Equal(HttpStatusCode.OK, studentGetRes.StatusCode);
        var studentVocabs = await studentGetRes.Content.ReadFromJsonAsync<PagedResponse<VocabularyDto>>(_jsonOptions);
        Assert.NotNull(studentVocabs);
        Assert.DoesNotContain(studentVocabs.Items, v => v.Status == "DRAFT");
        Assert.All(studentVocabs.Items, v => Assert.Equal("PUBLISHED", v.Status));

        // 11. Add MeaningVi for one word, publish it, verify STUDENT can see it
        Guid vocabIdToPublish;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var sample = await db.Vocabularies.FirstAsync(v => v.SourceDataset == "HSK 3.0" && v.Hanzi == "爱");
            vocabIdToPublish = sample.Id;
        }

        // Attempting to publish without MeaningVi must fail
        var invalidPublishReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/admin/vocabularies/{vocabIdToPublish}");
        invalidPublishReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        invalidPublishReq.Content = JsonContent.Create(new UpdateVocabularyDto
        {
            HskLevel = 1,
            Hanzi = "爱",
            Pinyin = "ài",
            MeaningVi = "",
            Status = "PUBLISHED"
        });
        var invalidPublishRes = await _client.SendAsync(invalidPublishReq);
        Assert.Equal(HttpStatusCode.BadRequest, invalidPublishRes.StatusCode);

        // Publish with valid MeaningVi
        var validPublishReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/admin/vocabularies/{vocabIdToPublish}");
        validPublishReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        validPublishReq.Content = JsonContent.Create(new UpdateVocabularyDto
        {
            HskLevel = 1,
            Hanzi = "爱",
            Pinyin = "ài",
            MeaningVi = "yêu, thích",
            PartOfSpeech = "động từ",
            Status = "PUBLISHED"
        });
        var validPublishRes = await _client.SendAsync(validPublishReq);
        Assert.Equal(HttpStatusCode.OK, validPublishRes.StatusCode);

        // Verify STUDENT can now see this published word
        var studentSearchReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/content/vocabularies?search=爱");
        studentSearchReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var studentSearchRes = await _client.SendAsync(studentSearchReq);
        Assert.Equal(HttpStatusCode.OK, studentSearchRes.StatusCode);
        var studentSearchResults = await studentSearchRes.Content.ReadFromJsonAsync<PagedResponse<VocabularyDto>>(_jsonOptions);
        Assert.NotNull(studentSearchResults);
        var publishedItem = studentSearchResults.Items.FirstOrDefault(v => v.Id == vocabIdToPublish);
        Assert.NotNull(publishedItem);
        Assert.Equal("PUBLISHED", publishedItem.Status);
        Assert.Equal("yêu, thích", publishedItem.MeaningVi);

        // 13. Try importing an HSK 7-9 row, verify Backend REJECTS the file (400 Bad Request)
        string hsk7Csv = "id,level,hanzi,pinyin,part_of_speech\n9999,7-9,测试,cèshì,动\n";
        var hsk7ImportReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/admin/vocabularies/import-csv");
        hsk7ImportReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        hsk7ImportReq.Content = CreateCsvMultipartContent(hsk7Csv, "hsk-7-invalid.csv");
        var hsk7ImportRes = await _client.SendAsync(hsk7ImportReq);
        Assert.Equal(HttpStatusCode.BadRequest, hsk7ImportRes.StatusCode);
    }
}
