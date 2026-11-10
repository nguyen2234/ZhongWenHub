using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ZhongWenHub.Business.Authentication.DTOs;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Content.DTOs;
using ZhongWenHub.Data.Persistence;
using Xunit;

namespace ZhongWenHub.IntegrationTests;

public class Hsk30DataAndSecurityIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public Hsk30DataAndSecurityIntegrationTests(CustomWebApplicationFactory factory)
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
    public async Task Student_CannotAccessDraftVocabulariesOrGrammar_ReturnsOnlyPublished()
    {
        var studentToken = await GetStudentTokenAsync();

        // 1. Student queries Vocabularies
        var vocabReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/content/vocabularies?pageSize=100");
        vocabReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var vocabRes = await _client.SendAsync(vocabReq);
        Assert.Equal(HttpStatusCode.OK, vocabRes.StatusCode);

        var vocabPage = await vocabRes.Content.ReadFromJsonAsync<PagedResponse<VocabularyDto>>(_jsonOptions);
        Assert.NotNull(vocabPage);
        // Student must NEVER receive any DRAFT vocabulary
        Assert.All(vocabPage.Items, item =>
        {
            Assert.Equal("PUBLISHED", item.Status);
        });

        // Even if student explicitly asks for status=DRAFT, content API must enforce publishedOnly
        var draftReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/content/vocabularies?status=DRAFT&pageSize=100");
        draftReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var draftRes = await _client.SendAsync(draftReq);
        Assert.Equal(HttpStatusCode.OK, draftRes.StatusCode);
        var draftPage = await draftRes.Content.ReadFromJsonAsync<PagedResponse<VocabularyDto>>(_jsonOptions);
        Assert.NotNull(draftPage);
        Assert.Empty(draftPage.Items); // Must be strictly empty!

        // 2. Student queries Grammar Points
        var grammarReq = new HttpRequestMessage(HttpMethod.Get, "/api/v1/content/grammar?pageSize=100");
        grammarReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var grammarRes = await _client.SendAsync(grammarReq);
        Assert.Equal(HttpStatusCode.OK, grammarRes.StatusCode);

        var grammarPage = await grammarRes.Content.ReadFromJsonAsync<PagedResponse<GrammarPointDto>>(_jsonOptions);
        Assert.NotNull(grammarPage);
        // Student must NEVER receive any DRAFT grammar point
        Assert.All(grammarPage.Items, item =>
        {
            Assert.Equal("PUBLISHED", item.Status);
        });

        // 3. Student querying a direct DRAFT vocabulary by ID must receive 404 NOT FOUND
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var draftVocab = await db.Vocabularies.FirstOrDefaultAsync(v => v.Status == "DRAFT");
            if (draftVocab != null)
            {
                var directReq = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/content/vocabularies/{draftVocab.Id}");
                directReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
                var directRes = await _client.SendAsync(directReq);
                Assert.Equal(HttpStatusCode.NotFound, directRes.StatusCode);
            }
        }
    }

    [Fact]
    public async Task Admin_CanAccessDraftVocabulariesAndReviewSuggestedMeanings()
    {
        var adminToken = await GetAdminTokenAsync();

        // Admin queries admin vocabulary endpoint
        var req = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/vocabularies?status=DRAFT&pageSize=50");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var res = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        var page = await res.Content.ReadFromJsonAsync<PagedResponse<VocabularyDto>>(_jsonOptions);
        Assert.NotNull(page);
        Assert.NotEmpty(page.Items);
        Assert.All(page.Items, item =>
        {
            Assert.Equal("DRAFT", item.Status);
        });
    }

    [Fact]
    public async Task Hanzi_DatabaseIntegrity_DifferentiatesUniqueCharactersFromLevelRequirements()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var uniqueCharCount = await db.HanziCharacters.CountAsync();
        var levelReqCount = await db.HanziLevelRequirements.CountAsync();

        Assert.Equal(1940, uniqueCharCount);
        Assert.Equal(2640, levelReqCount);

        var type1Count = await db.HanziLevelRequirements.CountAsync(r => r.Type == 1);
        var type2Count = await db.HanziLevelRequirements.CountAsync(r => r.Type == 2);

        Assert.Equal(1940, type1Count); // Handwriting characters
        Assert.Equal(700, type2Count);   // Recognition characters
    }

    [Fact]
    public async Task Hanzi_FullMetadata_HasPinyinSinoVietnameseRadicalAndStrokeCount()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var allHanzi = await db.HanziCharacters.ToListAsync();
        Assert.Equal(1940, allHanzi.Count);

        // Every character must have complete pedagogical metadata
        Assert.All(allHanzi, ch =>
        {
            Assert.False(string.IsNullOrWhiteSpace(ch.Pinyin), $"Character {ch.Character} missing Pinyin");
            Assert.False(string.IsNullOrWhiteSpace(ch.SinoVietnamese), $"Character {ch.Character} missing SinoVietnamese");
            Assert.False(string.IsNullOrWhiteSpace(ch.MeaningVi), $"Character {ch.Character} missing MeaningVi");
            Assert.False(string.IsNullOrWhiteSpace(ch.Radical), $"Character {ch.Character} missing Radical");
            Assert.True(ch.StrokeCount > 0, $"Character {ch.Character} invalid stroke count {ch.StrokeCount}");
        });
    }

    [Fact]
    public async Task Curriculum_FullStructure_IntegratesLessonsVocabulariesGrammarAndExercises()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var courses = await db.Courses.OrderBy(c => c.HskLevel).ToListAsync();
        Assert.Equal(6, courses.Count);

        // All 6 levels must have units and lessons
        var units = await db.Units.ToListAsync();
        var lessons = await db.Lessons.ToListAsync();
        var exercises = await db.Exercises.ToListAsync();

        Assert.True(units.Count >= 35, $"Expected at least 35 units, found {units.Count}");
        Assert.True(lessons.Count >= 140, $"Expected at least 140 lessons, found {lessons.Count}");
        Assert.True(exercises.Count >= 278, $"Expected at least 278 exercises, found {exercises.Count}");

        // Verify every level has at least 5 lessons
        for (int lvl = 1; lvl <= 6; lvl++)
        {
            var course = courses.First(c => c.HskLevel == lvl);
            var courseLessons = lessons.Where(l => l.CourseId == course.Id).ToList();
            Assert.True(courseLessons.Count >= 15, $"Level {lvl} has {courseLessons.Count} lessons, expected >= 15");
        }

        // Verify grammar points have full titles, explanations, and structure formulas
        var grammar = await db.GrammarPoints.ToListAsync();
        Assert.Equal(461, grammar.Count);
        Assert.All(grammar, g =>
        {
            Assert.False(string.IsNullOrWhiteSpace(g.Title), $"Grammar {g.Code} missing Title");
            Assert.False(string.IsNullOrWhiteSpace(g.Explanation), $"Grammar {g.Code} missing Explanation");
            Assert.False(string.IsNullOrWhiteSpace(g.StructureFormula), $"Grammar {g.Code} missing StructureFormula");
            Assert.False(string.IsNullOrWhiteSpace(g.ExamplesJson), $"Grammar {g.Code} missing ExamplesJson");
        });
    }

    [Fact]
    public async Task Vocabularies_QualityAudit_NoSurnameOrDebrisTraps()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var vocabularies = await db.Vocabularies.ToListAsync();
        Assert.True(vocabularies.Count >= 300, $"Expected at least 300 vocabularies, found {vocabularies.Count}");

        var surnameTrapRegex = new System.Text.RegularExpressions.Regex(@"họ\s+(\[[A-Z]|\b[A-Z][a-z]+)|\(họ\b", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        var debrisTrapRegex = new System.Text.RegularExpressions.Regex(@"(biến thể\b|cũ của\b|dùng trong\b|LT:|CL:)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);

        var surnameTraps = vocabularies
            .Where(v => !string.IsNullOrEmpty(v.MeaningVi)
                        && v.Hanzi != "姓名" && v.Hanzi != "姓" && v.Hanzi != "亲属"
                        && surnameTrapRegex.IsMatch(v.MeaningVi))
            .ToList();

        var debrisTraps = vocabularies
            .Where(v => !string.IsNullOrEmpty(v.MeaningVi)
                        && debrisTrapRegex.IsMatch(v.MeaningVi))
            .ToList();

        Assert.Empty(surnameTraps);
        Assert.Empty(debrisTraps);

        // Verify focus pedagogical words
        var guoWords = vocabularies.Where(v => v.Hanzi == "过").ToList();
        Assert.True(guoWords.All(w => !w.MeaningVi!.Contains("họ [Guo1]")));

        var haoHsk1 = vocabularies.FirstOrDefault(v => v.Hanzi == "好" && v.HskLevel == 1);
        if (haoHsk1 != null)
        {
            Assert.Contains("tốt", haoHsk1.MeaningVi);
        }

        var deiWord = vocabularies.FirstOrDefault(v => v.Hanzi == "得" && v.Pinyin == "děi");
        if (deiWord != null)
        {
            Assert.Contains("phải", deiWord.MeaningVi);
        }

        var haoWord = vocabularies.FirstOrDefault(v => v.Hanzi == "好" && v.Pinyin == "hào");
        if (haoWord != null)
        {
            Assert.Contains("thích", haoWord.MeaningVi);
        }
    }

    [Fact]
    public async Task GrammarPoints_QualityAudit_NoCodeInTitlesOrFormulas()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var grammarPoints = await db.GrammarPoints.ToListAsync();
        Assert.Equal(461, grammarPoints.Count);

        var codeInTitles = grammarPoints
            .Where(g => g.Title.Contains("GR30-HSK") || g.StructureFormula.Contains("GR30-HSK"))
            .ToList();

        Assert.Empty(codeInTitles);

        // Verify the 7 remediated grammar points have pedagogically sound titles
        var g46 = grammarPoints.FirstOrDefault(g => g.Code == "GR30-HSK1-046");
        Assert.NotNull(g46);
        Assert.Contains("Câu trần thuật", g46.Title);

        var g50 = grammarPoints.FirstOrDefault(g => g.Code == "GR30-HSK1-050");
        Assert.NotNull(g50);
        Assert.Contains("Câu cầu khiến", g50.Title);

        var g51 = grammarPoints.FirstOrDefault(g => g.Code == "GR30-HSK1-051");
        Assert.NotNull(g51);
        Assert.Contains("Câu cảm thán", g51.Title);

        var g59 = grammarPoints.FirstOrDefault(g => g.Code == "GR30-HSK1-059");
        Assert.NotNull(g59);
        Assert.Contains("Câu phức không dùng liên từ", g59.Title);

        var g108 = grammarPoints.FirstOrDefault(g => g.Code == "GR30-HSK2-108");
        Assert.NotNull(g108);
        Assert.Contains("Cụm danh từ", g108.Title);

        var g109 = grammarPoints.FirstOrDefault(g => g.Code == "GR30-HSK2-109");
        Assert.NotNull(g109);
        Assert.Contains("Cụm động từ", g109.Title);

        var g110 = grammarPoints.FirstOrDefault(g => g.Code == "GR30-HSK2-110");
        Assert.NotNull(g110);
        Assert.Contains("Cụm tính từ", g110.Title);
    }

    [Fact]
    public async Task Curriculum_QualityAudit_LegacyLessonPreserved()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var legacyLessonId = Guid.Parse("AAAAAAAA-4444-4444-4444-444444444444");
        var legacyLesson = await db.Lessons.FirstOrDefaultAsync(l => l.Id == legacyLessonId);

        Assert.NotNull(legacyLesson);
        Assert.Equal("他是我的汉语老师", legacyLesson.TitleZh);
        Assert.Equal("DRAFT", legacyLesson.Status);

        var totalLessons = await db.Lessons.CountAsync();
        Assert.Equal(140, totalLessons);

        var totalUnits = await db.Units.CountAsync();
        Assert.Equal(35, totalUnits);

        var totalCourses = await db.Courses.CountAsync();
        Assert.Equal(6, totalCourses);

        var totalExercises = await db.Exercises.CountAsync();
        Assert.True(totalExercises == 278 || totalExercises == 310 || totalExercises == 370 || totalExercises == 450 || totalExercises == 490, $"Total exercises should be either baseline 278, Phase 9.1 integrated 310, Phase 9.2 integrated 370, Phase 9.3 integrated 450, or Phase 9.4 integrated 490 (Actual: {totalExercises})");
    }
}
