using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ZhongWenHub.Business.Authentication.DTOs;
using ZhongWenHub.Business.Content.DTOs;
using ZhongWenHub.Data.Persistence;
using Xunit;

namespace ZhongWenHub.IntegrationTests;

public class VocabularyExcelImportIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public VocabularyExcelImportIntegrationTests(CustomWebApplicationFactory factory)
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
    public async Task DownloadExcelTemplate_ReturnsValidXlsxFileWithBothSheetsAndExamples()
    {
        var adminToken = await GetAdminTokenAsync();

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/content/vocabularies/import-template");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", response.Content.Headers.ContentType?.MediaType);

        var fileBytes = await response.Content.ReadAsByteArrayAsync();
        Assert.True(fileBytes.Length > 0);

        using var memoryStream = new MemoryStream(fileBytes);
        using var workbook = new XLWorkbook(memoryStream);

        // Verify sheets
        Assert.True(workbook.Worksheets.Contains("DuLieu"), "Template must contain sheet 'DuLieu'");
        Assert.True(workbook.Worksheets.Contains("HuongDan"), "Template must contain sheet 'HuongDan'");

        var dataSheet = workbook.Worksheet("DuLieu");
        Assert.Equal("SourceEntryId", dataSheet.Cell(1, 1).GetString());
        Assert.Equal("HskLevel", dataSheet.Cell(1, 2).GetString());
        Assert.Equal("Hanzi", dataSheet.Cell(1, 3).GetString());
        Assert.Equal("Pinyin", dataSheet.Cell(1, 4).GetString());
        Assert.Equal("MeaningVi", dataSheet.Cell(1, 5).GetString());

        // Verify sample rows exist
        Assert.Equal("HSK1-EX01", dataSheet.Cell(2, 1).GetString());
        Assert.Equal(1, dataSheet.Cell(2, 2).GetValue<int>());
        Assert.Equal("你好", dataSheet.Cell(2, 3).GetString());
    }

    [Fact]
    public async Task Student_CannotDownloadTemplateOrImportExcel()
    {
        var studentToken = await GetStudentTokenAsync();

        // 1. Template download should be 403 Forbidden for Student
        var getReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/content/vocabularies/import-template");
        getReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var getRes = await _client.SendAsync(getReq);
        Assert.Equal(HttpStatusCode.Forbidden, getRes.StatusCode);

        // 2. Import should be 403 Forbidden for Student
        var postReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/content/vocabularies/import-excel");
        postReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var postRes = await _client.SendAsync(postReq);
        Assert.Equal(HttpStatusCode.Forbidden, postRes.StatusCode);
    }

    [Fact]
    public async Task ExcelImport_PreviewAndCommit_EnforcesRulesAndDedup()
    {
        var adminToken = await GetAdminTokenAsync();

        // Count initial HSK 1 words in DB to ensure untouched
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var initialHsk1Count = await db.Vocabularies.CountAsync(v => v.HskLevel == 1);
            Assert.True(initialHsk1Count >= 300, "Initial HSK 1 vocabulary must be at least 300 words");

            // Clean up any leftovers from previous failed test runs
            var leftovers = await db.Vocabularies
                .Where(v => v.SourceEntryId == "TEST-HSK2-EXCEL-001" || v.SourceEntryId == "TEST-HSK3-EXCEL-002")
                .ToListAsync();
            if (leftovers.Count > 0)
            {
                db.Vocabularies.RemoveRange(leftovers);
                await db.SaveChangesAsync();
            }
        }

        // Create an in-memory Excel workbook for testing
        using var testWorkbook = new XLWorkbook();
        var sheet = testWorkbook.Worksheets.Add("DuLieu");

        // Headers
        string[] headers = { "SourceEntryId", "HskLevel", "Hanzi", "Pinyin", "MeaningVi", "MeaningEn", "PartOfSpeech", "ExampleHanzi", "ExamplePinyin", "ExampleMeaningVi" };
        for (int i = 0; i < headers.Length; i++)
        {
            sheet.Cell(1, i + 1).Value = headers[i];
        }

        // Row 2: Template sample row (should be automatically ignored)
        sheet.Cell(2, 1).Value = "HSK1-EX01";
        sheet.Cell(2, 2).Value = 1;
        sheet.Cell(2, 3).Value = "你好";
        sheet.Cell(2, 4).Value = "nǐ hǎo";
        sheet.Cell(2, 5).Value = "Xin chào (DÒNG VÍ DỤ - HÃY XÓA TRƯỚC KHI IMPORT)";

        // Row 3: Valid HSK 2 word
        string uniqueEntryId1 = "TEST-HSK2-EXCEL-001";
        sheet.Cell(3, 1).Value = uniqueEntryId1;
        sheet.Cell(3, 2).Value = 2;
        sheet.Cell(3, 3).Value = "测试词汇一";
        sheet.Cell(3, 4).Value = "cè shì cí huì yī";
        sheet.Cell(3, 5).Value = "Từ vựng kiểm thử một";
        sheet.Cell(3, 6).Value = "Test vocabulary one";
        sheet.Cell(3, 7).Value = "Danh từ";
        sheet.Cell(3, 8).Value = "这是测试词汇。";
        sheet.Cell(3, 9).Value = "Zhè shì cèshì cíhuì.";
        sheet.Cell(3, 10).Value = "Đây là từ vựng kiểm thử.";

        // Row 4: Valid HSK 3 word with formula injection attempt (starts with =1+1)
        string uniqueEntryId2 = "TEST-HSK3-EXCEL-002";
        sheet.Cell(4, 1).Value = uniqueEntryId2;
        sheet.Cell(4, 2).Value = 3;
        sheet.Cell(4, 3).Value = "测试词汇二";
        sheet.Cell(4, 4).Value = "cè shì cí huì èr";
        sheet.Cell(4, 5).Value = "=1+1 Injection Test"; // Formula attempt

        // Row 5: Invalid HSK level (HSK 7 - must be rejected by ZhongWenHub 1-6 rule)
        sheet.Cell(5, 1).Value = "TEST-HSK7-EXCEL-003";
        sheet.Cell(5, 2).Value = 7;
        sheet.Cell(5, 3).Value = "超纲词汇";
        sheet.Cell(5, 4).Value = "chāo gāng cí huì";
        sheet.Cell(5, 5).Value = "Từ vựng cấp 7";

        using var excelMs = new MemoryStream();
        testWorkbook.SaveAs(excelMs);
        var excelBytes = excelMs.ToArray();

        // ----------------------------------------------------
        // Step 1: Preview (dry-run = true)
        // ----------------------------------------------------
        var previewForm = new MultipartFormDataContent();
        var fileContentPreview = new ByteArrayContent(excelBytes);
        fileContentPreview.Headers.ContentType = new MediaTypeHeaderValue("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        previewForm.Add(fileContentPreview, "file", "test_import.xlsx");

        var previewReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/content/vocabularies/import-excel/preview");
        previewReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        previewReq.Content = previewForm;

        var previewRes = await _client.SendAsync(previewReq);
        Assert.Equal(HttpStatusCode.OK, previewRes.StatusCode);

        var previewData = await previewRes.Content.ReadFromJsonAsync<VocabularyImportResultDto>(_jsonOptions);
        Assert.NotNull(previewData);
        // Print errors if any
        foreach (var err in previewData.Errors)
        {
            Console.WriteLine($"Row {err.RowNumber} Col {err.ColumnName}: {err.Reason}");
        }
        Assert.True(previewData.DryRun);
        Assert.Equal(3, previewData.TotalRows); // Example row was skipped, so 3 data rows
        Assert.Equal(2, previewData.SuccessCount); // Rows 3 and 4 are valid
        Assert.Equal(1, previewData.ErrorCount); // Row 5 is HSK 7 (rejected)
        Assert.Contains(previewData.Errors, e => e.ColumnName == "HskLevel" && e.Reason.Contains("HSK 3.0 từ cấp 1 đến cấp 6"));

        // Verify DB still does not contain the previewed words
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var exists = await db.Vocabularies.AnyAsync(v => v.SourceEntryId == uniqueEntryId1);
            Assert.False(exists, "DryRun preview must not write to database");
        }

        // ----------------------------------------------------
        // Step 2: Real Import (dry-run = false)
        // ----------------------------------------------------
        var importForm = new MultipartFormDataContent();
        var fileContentImport = new ByteArrayContent(excelBytes);
        fileContentImport.Headers.ContentType = new MediaTypeHeaderValue("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        importForm.Add(fileContentImport, "file", "test_import.xlsx");

        var importReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/content/vocabularies/import-excel");
        importReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        importReq.Content = importForm;

        var importRes = await _client.SendAsync(importReq);
        Assert.Equal(HttpStatusCode.OK, importRes.StatusCode);

        var importData = await importRes.Content.ReadFromJsonAsync<VocabularyImportResultDto>(_jsonOptions);
        Assert.NotNull(importData);
        Assert.False(importData.DryRun);
        Assert.Equal(2, importData.SuccessCount);

        // Verify in DB that rows were inserted as DRAFT with sanitized formula
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var vocab1 = await db.Vocabularies.FirstOrDefaultAsync(v => v.SourceEntryId == uniqueEntryId1);
            Assert.NotNull(vocab1);
            Assert.Equal("DRAFT", vocab1.Status);
            Assert.Equal("HSK 3.0", vocab1.SourceDataset);
            Assert.Equal("测试词汇一", vocab1.Hanzi);
            Assert.NotNull(vocab1.ExamplesJson);
            Assert.Contains("这是测试词汇", vocab1.ExamplesJson);

            var vocab2 = await db.Vocabularies.FirstOrDefaultAsync(v => v.SourceEntryId == uniqueEntryId2);
            Assert.NotNull(vocab2);
            Assert.Equal("DRAFT", vocab2.Status);
            // Verify formula injection leading '=' was sanitized
            Assert.False(vocab2.MeaningVi.StartsWith("="), "Formula leading '=' must be sanitized");
        }

        // ----------------------------------------------------
        // Step 3: Re-import same Excel -> Verify Deduplication
        // ----------------------------------------------------
        var reimportForm = new MultipartFormDataContent();
        var reimportFileContent = new ByteArrayContent(excelBytes);
        reimportFileContent.Headers.ContentType = new MediaTypeHeaderValue("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        reimportForm.Add(reimportFileContent, "file", "test_import.xlsx");

        var reimportReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/content/vocabularies/import-excel");
        reimportReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        reimportReq.Content = reimportForm;

        var reimportRes = await _client.SendAsync(reimportReq);
        Assert.Equal(HttpStatusCode.OK, reimportRes.StatusCode);

        var reimportData = await reimportRes.Content.ReadFromJsonAsync<VocabularyImportResultDto>(_jsonOptions);
        Assert.NotNull(reimportData);
        Assert.Equal(0, reimportData.SuccessCount);
        Assert.Equal(2, reimportData.SkippedDuplicateCount);

        // Final cleanup
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var leftovers = await db.Vocabularies
                .Where(v => v.SourceEntryId == uniqueEntryId1 || v.SourceEntryId == uniqueEntryId2)
                .ToListAsync();
            db.Vocabularies.RemoveRange(leftovers);
            await db.SaveChangesAsync();
        }
    }
}
