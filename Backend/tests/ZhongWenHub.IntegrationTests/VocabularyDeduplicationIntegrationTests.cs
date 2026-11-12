using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ZhongWenHub.Business.Authentication.DTOs;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Content.DTOs;
using ZhongWenHub.Data.Persistence;
using Xunit;

namespace ZhongWenHub.IntegrationTests;

public class VocabularyDeduplicationIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public VocabularyDeduplicationIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> GetAdminTokenAsync()
    {
        var res = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto
        {
            UsernameOrEmail = "admin@gmail.com",
            Password = "admin"
        });
        var body = await res.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        return body!.AccessToken;
    }

    [Fact]
    public async Task GetVocabularies_Hsk1_BaAppearsOnceWithLessonInfo()
    {
        var res = await _client.GetAsync("/api/v1/content/vocabularies?hskLevel=1&search=%E5%85%AB&pageSize=50");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        var paged = await res.Content.ReadFromJsonAsync<PagedResponse<VocabularyDto>>(_jsonOptions);
        Assert.NotNull(paged);

        var exactBa = paged.Items.Where(v => v.Hanzi == "八").ToList();
        Assert.Single(exactBa);
        Assert.Equal("bā", exactBa[0].Pinyin);
        Assert.Equal("PUBLISHED", exactBa[0].Status);
        Assert.NotEmpty(exactBa[0].Lessons);
        Assert.Contains(exactBa[0].Lessons, l => l.LessonNumber == 7);
    }

    [Fact]
    public async Task GetVocabularies_MultiLessonWords_AppearOnceAndInEachLinkedLesson()
    {
        var targets = new[]
        {
            (Hanzi: "得", Pinyin: "dé", ExpectedLessons: new[] { 2, 3 }),
            (Hanzi: "还", Pinyin: "hái", ExpectedLessons: new[] { 4, 5 }),
            (Hanzi: "长", Pinyin: "zhǎng", ExpectedLessons: new[] { 1, 14 })
        };

        foreach (var t in targets)
        {
            var res = await _client.GetAsync($"/api/v1/content/vocabularies?hskLevel=2&search={Uri.EscapeDataString(t.Hanzi)}&pageSize=50");
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            var paged = await res.Content.ReadFromJsonAsync<PagedResponse<VocabularyDto>>(_jsonOptions);
            Assert.NotNull(paged);

            var matches = paged.Items.Where(v => v.Hanzi == t.Hanzi && v.Pinyin == t.Pinyin).ToList();
            Assert.Single(matches);

            var lessonNums = matches[0].Lessons.Select(l => l.LessonNumber).OrderBy(n => n).ToArray();
            Assert.Equal(t.ExpectedLessons, lessonNums);

            // Verify each linked lesson also returns this canonical word
            foreach (var lessonRef in matches[0].Lessons)
            {
                var lessonRes = await _client.GetAsync($"/api/v1/content/lessons/{lessonRef.LessonId}");
                Assert.Equal(HttpStatusCode.OK, lessonRes.StatusCode);
                var lessonDetail = await lessonRes.Content.ReadFromJsonAsync<LessonDetailDto>(_jsonOptions);
                Assert.NotNull(lessonDetail);
                Assert.Contains(lessonDetail.Vocabularies, v => v.Id == matches[0].Id);
            }
        }
    }

    [Fact]
    public async Task GetVocabularies_DistinctSenseHomographs_PreservedSeparately()
    {
        foreach (var hanzi in new[] { "对", "等", "过" })
        {
            var res = await _client.GetAsync($"/api/v1/content/vocabularies?hskLevel=4&search={Uri.EscapeDataString(hanzi)}&pageSize=50");
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            var paged = await res.Content.ReadFromJsonAsync<PagedResponse<VocabularyDto>>(_jsonOptions);
            Assert.NotNull(paged);

            var matches = paged.Items.Where(v => v.Hanzi == hanzi).ToList();
            Assert.Equal(2, matches.Count);
            Assert.NotEqual(matches[0].PartOfSpeech, matches[1].PartOfSpeech);
        }
    }

    [Fact]
    public async Task Pagination_Hsk1_TotalItemsMatchesUniqueIdsAcrossPages()
    {
        var page1Res = await _client.GetAsync("/api/v1/content/vocabularies?hskLevel=1&page=1&pageSize=50");
        Assert.Equal(HttpStatusCode.OK, page1Res.StatusCode);
        var p1 = await page1Res.Content.ReadFromJsonAsync<PagedResponse<VocabularyDto>>(_jsonOptions);
        Assert.NotNull(p1);
        Assert.Equal(150, p1.TotalItems);

        var allIds = new HashSet<Guid>(p1.Items.Select(x => x.Id));
        for (int p = 2; p <= p1.TotalPages; p++)
        {
            var pageRes = await _client.GetAsync($"/api/v1/content/vocabularies?hskLevel=1&page={p}&pageSize=50");
            Assert.Equal(HttpStatusCode.OK, pageRes.StatusCode);
            var pageBody = await pageRes.Content.ReadFromJsonAsync<PagedResponse<VocabularyDto>>(_jsonOptions);
            Assert.NotNull(pageBody);
            foreach (var item in pageBody.Items)
            {
                Assert.True(allIds.Add(item.Id), $"Duplicate vocabulary ID {item.Id} returned across paginated pages.");
            }
        }

        Assert.Equal(p1.TotalItems, allIds.Count);
    }

    [Fact]
    public async Task CreateUpdateAndExcelImport_PreventNormalizedDuplicates_AllowDistinctHomograph()
    {
        var adminToken = await GetAdminTokenAsync();
        var createdIds = new List<Guid>();
        var uniqueSuffix = Guid.NewGuid().ToString("N")[..6];
        var syntheticHanzi = $"测词{uniqueSuffix}";

        try
        {
            // 1. Create initial word
            var createReq1 = new HttpRequestMessage(HttpMethod.Post, "/api/v1/admin/vocabularies");
            createReq1.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
            createReq1.Content = JsonContent.Create(new CreateVocabularyDto
            {
                HskLevel = 5,
                Hanzi = syntheticHanzi,
                Pinyin = "cè cí",
                MeaningVi = "từ thử nghiệm nghĩa 1",
                PartOfSpeech = "Danh từ",
                Status = "DRAFT"
            });
            var res1 = await _client.SendAsync(createReq1);
            Assert.Equal(HttpStatusCode.Created, res1.StatusCode);
            var created1 = await res1.Content.ReadFromJsonAsync<VocabularyDto>(_jsonOptions);
            Assert.NotNull(created1);
            createdIds.Add(created1.Id);

            // 2. Attempt duplicate create with normalized pinyin variant ("CèCí") -> MUST FAIL
            var dupReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/admin/vocabularies");
            dupReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
            dupReq.Content = JsonContent.Create(new CreateVocabularyDto
            {
                HskLevel = 5,
                Hanzi = syntheticHanzi,
                Pinyin = "CèCí",
                MeaningVi = "trùng lặp",
                Status = "DRAFT"
            });
            var dupRes = await _client.SendAsync(dupReq);
            Assert.Equal(HttpStatusCode.BadRequest, dupRes.StatusCode);

            // 3. Create distinct homograph with explicit Homograph = "2" -> MUST SUCCEED
            var createReq2 = new HttpRequestMessage(HttpMethod.Post, "/api/v1/admin/vocabularies");
            createReq2.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
            createReq2.Content = JsonContent.Create(new CreateVocabularyDto
            {
                HskLevel = 5,
                Hanzi = syntheticHanzi,
                Pinyin = "cè cí",
                Homograph = "2",
                MeaningVi = "từ thử nghiệm nghĩa 2",
                PartOfSpeech = "Động từ",
                Status = "DRAFT"
            });
            var res2 = await _client.SendAsync(createReq2);
            Assert.Equal(HttpStatusCode.Created, res2.StatusCode);
            var created2 = await res2.Content.ReadFromJsonAsync<VocabularyDto>(_jsonOptions);
            Assert.NotNull(created2);
            createdIds.Add(created2.Id);

            // 4. Verify Excel import with normalized pinyin variant skips duplicate cleanly
            using var wb = new XLWorkbook();
            var ws = wb.Worksheets.Add("DuLieu");
            ws.Cell(1, 1).Value = "SourceEntryId";
            ws.Cell(1, 2).Value = "HskLevel";
            ws.Cell(1, 3).Value = "Hanzi";
            ws.Cell(1, 4).Value = "Pinyin";
            ws.Cell(1, 5).Value = "MeaningVi";
            ws.Cell(2, 1).Value = $"IMP-{uniqueSuffix}";
            ws.Cell(2, 2).Value = 5;
            ws.Cell(2, 3).Value = syntheticHanzi;
            ws.Cell(2, 4).Value = "cècí";
            ws.Cell(2, 5).Value = "nghĩa import";
            using var ms = new MemoryStream();
            wb.SaveAs(ms);
            ms.Position = 0;

            using var multipart = new MultipartFormDataContent();
            var fileContent = new ByteArrayContent(ms.ToArray());
            fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            multipart.Add(fileContent, "file", "dedup-check.xlsx");

            var importReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/content/vocabularies/import-excel");
            importReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
            importReq.Content = multipart;
            var importRes = await _client.SendAsync(importReq);
            Assert.Equal(HttpStatusCode.OK, importRes.StatusCode);
            var importResult = await importRes.Content.ReadFromJsonAsync<VocabularyImportResultDto>(_jsonOptions);
            Assert.NotNull(importResult);
            Assert.Equal(0, importResult.SuccessCount);
            Assert.Equal(1, importResult.SkippedDuplicateCount);
        }
        finally
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cleanup = await db.Vocabularies.Where(v => createdIds.Contains(v.Id)).ToListAsync();
            if (cleanup.Count > 0)
            {
                db.Vocabularies.RemoveRange(cleanup);
                await db.SaveChangesAsync();
            }
        }
    }
}

