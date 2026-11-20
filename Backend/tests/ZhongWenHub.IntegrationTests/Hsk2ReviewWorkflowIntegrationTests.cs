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
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Content.DTOs;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Persistence;
using Xunit;

namespace ZhongWenHub.IntegrationTests;

public class Hsk2ReviewWorkflowIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public Hsk2ReviewWorkflowIntegrationTests(CustomWebApplicationFactory factory)
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

    private async Task<string> GetTeacherTokenAsync()
    {
        var loginReq = new LoginRequestDto
        {
            UsernameOrEmail = "teacher@zhongwenhub.edu.vn",
            Password = "TeacherPassword123!"
        };
        var res = await _client.PostAsJsonAsync("/api/v1/auth/login", loginReq);
        var body = await res.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        return body!.AccessToken;
    }

    [Fact]
    public async Task VocabularyReview_Workflow_Draft_PendingReview_Published()
    {
        var adminToken = await GetAdminTokenAsync();

        // 1. Create a draft vocabulary with meaning
        Guid testVocabId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var vocab = new VocabularyEntity
            {
                Id = Guid.NewGuid(),
                HskLevel = 2,
                Hanzi = "测试词" + Guid.NewGuid().ToString("N")[..4],
                Pinyin = "cè shì cí",
                MeaningVi = "Từ vựng kiểm thử quy trình duyệt",
                Status = "DRAFT",
                CreatedAt = DateTime.UtcNow
            };
            db.Vocabularies.Add(vocab);
            await db.SaveChangesAsync();
            testVocabId = vocab.Id;
        }

        // 2. Admin submits for review (PENDING_REVIEW)
        var submitReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/vocabularies/{testVocabId}/review")
        {
            Content = JsonContent.Create(new ReviewContentDto
            {
                Status = "PENDING_REVIEW",
                ReviewNotes = "Gửi kiểm duyệt học liệu HSK 2"
            })
        };
        submitReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var submitRes = await _client.SendAsync(submitReq);
        Assert.Equal(HttpStatusCode.OK, submitRes.StatusCode);

        var submitDto = await submitRes.Content.ReadFromJsonAsync<VocabularyDto>(_jsonOptions);
        Assert.NotNull(submitDto);
        Assert.Equal("PENDING_REVIEW", submitDto.Status);
        Assert.Equal("Gửi kiểm duyệt học liệu HSK 2", submitDto.ReviewNotes);
        Assert.NotNull(submitDto.ReviewedAt);
        Assert.NotNull(submitDto.ReviewedByUserId);

        // 3. Admin approves and publishes (PUBLISHED)
        var approveReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/vocabularies/{testVocabId}/review")
        {
            Content = JsonContent.Create(new ReviewContentDto
            {
                Status = "PUBLISHED",
                ReviewNotes = "Phê duyệt đạt chuẩn HSK 2"
            })
        };
        approveReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var approveRes = await _client.SendAsync(approveReq);
        Assert.Equal(HttpStatusCode.OK, approveRes.StatusCode);

        var approveDto = await approveRes.Content.ReadFromJsonAsync<VocabularyDto>(_jsonOptions);
        Assert.NotNull(approveDto);
        Assert.Equal("PUBLISHED", approveDto.Status);
        Assert.Equal("Phê duyệt đạt chuẩn HSK 2", approveDto.ReviewNotes);

        // Clean up
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var v = await db.Vocabularies.FindAsync(testVocabId);
            if (v != null)
            {
                db.Vocabularies.Remove(v);
                await db.SaveChangesAsync();
            }
        }
    }

    [Fact]
    public async Task VocabularyReview_PublishWithoutMeaningVi_Fails()
    {
        var adminToken = await GetAdminTokenAsync();

        // Create draft vocab without meaning
        Guid testVocabId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var vocab = new VocabularyEntity
            {
                Id = Guid.NewGuid(),
                HskLevel = 2,
                Hanzi = "空义" + Guid.NewGuid().ToString("N")[..4],
                Pinyin = "kōng yì",
                MeaningVi = "",
                Status = "DRAFT",
                CreatedAt = DateTime.UtcNow
            };
            db.Vocabularies.Add(vocab);
            await db.SaveChangesAsync();
            testVocabId = vocab.Id;
        }

        // Try to review directly to PUBLISHED without MeaningVi
        var req = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/vocabularies/{testVocabId}/review")
        {
            Content = JsonContent.Create(new ReviewContentDto
            {
                Status = "PUBLISHED",
                ReviewNotes = "Cố gắng xuất bản khi chưa có nghĩa"
            })
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var res = await _client.SendAsync(req);

        // Must reject with 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);

        // Clean up
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var v = await db.Vocabularies.FindAsync(testVocabId);
            if (v != null)
            {
                db.Vocabularies.Remove(v);
                await db.SaveChangesAsync();
            }
        }
    }

    [Fact]
    public async Task VocabularyReview_RejectToDraft_WithNotes()
    {
        var adminToken = await GetAdminTokenAsync();

        Guid testVocabId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var vocab = new VocabularyEntity
            {
                Id = Guid.NewGuid(),
                HskLevel = 2,
                Hanzi = "待改" + Guid.NewGuid().ToString("N")[..4],
                Pinyin = "dài gǎi",
                MeaningVi = "Nghĩa cần sửa lại cho chuẩn",
                Status = "PENDING_REVIEW",
                CreatedAt = DateTime.UtcNow
            };
            db.Vocabularies.Add(vocab);
            await db.SaveChangesAsync();
            testVocabId = vocab.Id;
        }

        // Reject back to DRAFT
        var req = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/vocabularies/{testVocabId}/review")
        {
            Content = JsonContent.Create(new ReviewContentDto
            {
                Status = "DRAFT",
                ReviewNotes = "Nghĩa chưa chuẩn ngữ cảnh HSK 2, yêu cầu biên tập viên chỉnh sửa lại."
            })
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var res = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        var dto = await res.Content.ReadFromJsonAsync<VocabularyDto>(_jsonOptions);
        Assert.NotNull(dto);
        Assert.Equal("DRAFT", dto.Status);
        Assert.Contains("Nghĩa chưa chuẩn", dto.ReviewNotes);

        // Clean up
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var v = await db.Vocabularies.FindAsync(testVocabId);
            if (v != null)
            {
                db.Vocabularies.Remove(v);
                await db.SaveChangesAsync();
            }
        }
    }

    [Fact]
    public async Task Student_CannotAccessPendingReviewOrDraftVocabularies()
    {
        var studentToken = await GetStudentTokenAsync();
        Guid pendingVocabId;

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var vocab = new VocabularyEntity
            {
                Id = Guid.NewGuid(),
                HskLevel = 2,
                Hanzi = "保密" + Guid.NewGuid().ToString("N")[..4],
                Pinyin = "bǎo mì",
                MeaningVi = "Bảo mật chờ duyệt",
                Status = "PENDING_REVIEW",
                CreatedAt = DateTime.UtcNow
            };
            db.Vocabularies.Add(vocab);
            await db.SaveChangesAsync();
            pendingVocabId = vocab.Id;
        }

        // Direct request by student to ID
        var req = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/content/vocabularies/{pendingVocabId}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var res = await _client.SendAsync(req);

        // Student must receive 404 NOT FOUND
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);

        // Clean up
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var v = await db.Vocabularies.FindAsync(pendingVocabId);
            if (v != null)
            {
                db.Vocabularies.Remove(v);
                await db.SaveChangesAsync();
            }
        }
    }

    [Fact]
    public async Task Student_CallingReviewEndpoint_Forbidden()
    {
        var studentToken = await GetStudentTokenAsync();

        var req = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/vocabularies/{Guid.NewGuid()}/review")
        {
            Content = JsonContent.Create(new ReviewContentDto
            {
                Status = "PUBLISHED",
                ReviewNotes = "Student hack attempt"
            })
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var res = await _client.SendAsync(req);

        // Must be 403 Forbidden
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task BatchReview_Vocabularies_HandlesValidAndInvalid()
    {
        var adminToken = await GetAdminTokenAsync();
        Guid validId, emptyMeaningId;

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var v1 = new VocabularyEntity
            {
                Id = Guid.NewGuid(),
                HskLevel = 2,
                Hanzi = "批量一" + Guid.NewGuid().ToString("N")[..4],
                Pinyin = "pī liàng yī",
                MeaningVi = "Từ có nghĩa hợp lệ",
                Status = "DRAFT",
                CreatedAt = DateTime.UtcNow
            };
            var v2 = new VocabularyEntity
            {
                Id = Guid.NewGuid(),
                HskLevel = 2,
                Hanzi = "批量二" + Guid.NewGuid().ToString("N")[..4],
                Pinyin = "pī liàng èr",
                MeaningVi = "", // Missing meaning!
                Status = "DRAFT",
                CreatedAt = DateTime.UtcNow
            };
            db.Vocabularies.AddRange(v1, v2);
            await db.SaveChangesAsync();
            validId = v1.Id;
            emptyMeaningId = v2.Id;
        }

        // Try batch publish
        var req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/content/vocabularies/batch-review")
        {
            Content = JsonContent.Create(new BatchReviewContentDto
            {
                Ids = new List<Guid> { validId, emptyMeaningId },
                Status = "PUBLISHED",
                ReviewNotes = "Duyệt xuất bản đợt HSK 2"
            })
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var res = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        var result = await res.Content.ReadFromJsonAsync<BatchReviewResultDto>(_jsonOptions);
        Assert.NotNull(result);
        Assert.Equal(1, result.ProcessedCount); // only validId processed
        Assert.Equal(1, result.SkippedCount);   // emptyMeaningId skipped
        Assert.Contains(result.SkippedReasons, r => r.Contains("chưa có nghĩa tiếng Việt"));

        // Clean up
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var v1 = await db.Vocabularies.FindAsync(validId);
            var v2 = await db.Vocabularies.FindAsync(emptyMeaningId);
            if (v1 != null) db.Vocabularies.Remove(v1);
            if (v2 != null) db.Vocabularies.Remove(v2);
            await db.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task Vocabulary_CreateAndPut_CannotBypassMeaningViRequirement()
    {
        var adminToken = await GetAdminTokenAsync();

        // 1. POST /vocabularies with PENDING_REVIEW and empty MeaningVi -> 400
        var createPendingReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/content/vocabularies")
        {
            Content = JsonContent.Create(new CreateVocabularyDto
            {
                HskLevel = 2,
                Hanzi = "绕道一",
                Pinyin = "rào dào yī",
                MeaningVi = "", // empty
                Status = "PENDING_REVIEW"
            })
        };
        createPendingReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var res1 = await _client.SendAsync(createPendingReq);
        Assert.Equal(HttpStatusCode.BadRequest, res1.StatusCode);

        // 2. POST /vocabularies with PUBLISHED and empty MeaningVi -> 400
        var createPubReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/content/vocabularies")
        {
            Content = JsonContent.Create(new CreateVocabularyDto
            {
                HskLevel = 2,
                Hanzi = "绕道二",
                Pinyin = "rào dào èr",
                MeaningVi = "   ", // whitespace only
                Status = "PUBLISHED"
            })
        };
        createPubReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var res2 = await _client.SendAsync(createPubReq);
        Assert.Equal(HttpStatusCode.BadRequest, res2.StatusCode);

        // 3. PUT /vocabularies/{id} trying to change to PUBLISHED or PENDING_REVIEW without MeaningVi
        Guid testVocabId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var v = new VocabularyEntity
            {
                Id = Guid.NewGuid(),
                HskLevel = 2,
                Hanzi = "绕道三",
                Pinyin = "rào dào sān",
                MeaningVi = "",
                Status = "DRAFT",
                CreatedAt = DateTime.UtcNow
            };
            db.Vocabularies.Add(v);
            await db.SaveChangesAsync();
            testVocabId = v.Id;
        }

        var updateReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/vocabularies/{testVocabId}")
        {
            Content = JsonContent.Create(new UpdateVocabularyDto
            {
                HskLevel = 2,
                Hanzi = "绕道三",
                Pinyin = "rào dào sān",
                MeaningVi = "",
                Status = "PENDING_REVIEW"
            })
        };
        updateReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var res3 = await _client.SendAsync(updateReq);
        Assert.Equal(HttpStatusCode.BadRequest, res3.StatusCode);

        // Clean up
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var v = await db.Vocabularies.FindAsync(testVocabId);
            if (v != null)
            {
                db.Vocabularies.Remove(v);
                await db.SaveChangesAsync();
            }
        }
    }

    [Fact]
    public async Task VocabularyReview_SubmitToPendingReview_WithoutMeaningVi_FailsWithBadRequest()
    {
        var adminToken = await GetAdminTokenAsync();

        Guid testVocabId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var v = new VocabularyEntity
            {
                Id = Guid.NewGuid(),
                HskLevel = 2,
                Hanzi = "无意词",
                Pinyin = "wú yì cí",
                MeaningVi = "",
                Status = "DRAFT",
                CreatedAt = DateTime.UtcNow
            };
            db.Vocabularies.Add(v);
            await db.SaveChangesAsync();
            testVocabId = v.Id;
        }

        var req = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/vocabularies/{testVocabId}/review")
        {
            Content = JsonContent.Create(new ReviewContentDto
            {
                Status = "PENDING_REVIEW",
                ReviewNotes = "Cố tình gửi chờ duyệt khi chưa có nghĩa"
            })
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var res = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);

        // Clean up
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var v = await db.Vocabularies.FindAsync(testVocabId);
            if (v != null)
            {
                db.Vocabularies.Remove(v);
                await db.SaveChangesAsync();
            }
        }
    }

    [Fact]
    public async Task Grammar_CannotPublishWithoutTitleOrExplanationOrStructure()
    {
        var adminToken = await GetAdminTokenAsync();

        Guid testGrammarId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var g = new GrammarPointEntity
            {
                Id = Guid.NewGuid(),
                Code = "HSK2-TEST-" + Guid.NewGuid().ToString("N")[..4],
                Title = "Ngữ pháp kiểm thử",
                PinyinTitle = "yǔ fǎ",
                HskLevel = 2,
                Category = "cơ bản",
                StructureFormula = "", // Empty formula!
                Explanation = "",      // Empty explanation!
                Status = "DRAFT",
                CreatedAt = DateTime.UtcNow
            };
            db.GrammarPoints.Add(g);
            await db.SaveChangesAsync();
            testGrammarId = g.Id;
        }

        try
        {
            // 1. Review to PUBLISHED -> must fail
        var reviewReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/grammar/{testGrammarId}/review")
        {
            Content = JsonContent.Create(new ReviewContentDto
            {
                Status = "PUBLISHED",
                ReviewNotes = "Cố tình xuất bản ngữ pháp thiếu nội dung"
            })
        };
        reviewReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var reviewRes = await _client.SendAsync(reviewReq);
        Assert.Equal(HttpStatusCode.BadRequest, reviewRes.StatusCode);

        // 2. PUT update to PUBLISHED -> must fail
        var updateReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/grammar/{testGrammarId}")
        {
            Content = JsonContent.Create(new UpdateGrammarPointDto
            {
                Title = "Ngữ pháp kiểm thử",
                PinyinTitle = "yǔ fǎ",
                HskLevel = 2,
                Category = "cơ bản",
                StructureFormula = "",
                Explanation = "",
                Status = "PUBLISHED"
            })
        };
        updateReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var updateRes = await _client.SendAsync(updateReq);
        Assert.Equal(HttpStatusCode.BadRequest, updateRes.StatusCode);

        }
        finally
        {
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var g = await db.GrammarPoints.FindAsync(testGrammarId);
                if (g != null)
                {
                    db.GrammarPoints.Remove(g);
                    await db.SaveChangesAsync();
                }
            }
        }
    }

    [Fact]
    public async Task Teacher_CallingReviewEndpoint_Forbidden()
    {
        var teacherToken = await GetTeacherTokenAsync();

        var req = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/vocabularies/{Guid.NewGuid()}/review")
        {
            Content = JsonContent.Create(new ReviewContentDto
            {
                Status = "PUBLISHED",
                ReviewNotes = "Teacher review attempt"
            })
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", teacherToken);
        var res = await _client.SendAsync(req);

        // Must be 403 Forbidden
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task Student_CannotAccessPendingReviewOrDraftGrammarPoint_ById()
    {
        var studentToken = await GetStudentTokenAsync();
        Guid testGrammarId;

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var g = new GrammarPointEntity
            {
                Id = Guid.NewGuid(),
                Code = "HSK2-DRAFT-" + Guid.NewGuid().ToString("N")[..4],
                Title = "Ngữ pháp chưa xuất bản",
                PinyinTitle = "yǔ fǎ wèi fā bù",
                HskLevel = 2,
                Category = "cơ bản",
                StructureFormula = "S + V + O",
                Explanation = "Giải thích chi tiết",
                Status = "PENDING_REVIEW",
                CreatedAt = DateTime.UtcNow
            };
            db.GrammarPoints.Add(g);
            await db.SaveChangesAsync();
            testGrammarId = g.Id;
        }

        try
        {
            // Student query by ID
        var req = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/content/grammar/{testGrammarId}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var res = await _client.SendAsync(req);

        // Student must receive 404 NOT FOUND
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);

        }
        finally
        {
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var g = await db.GrammarPoints.FindAsync(testGrammarId);
                if (g != null)
                {
                    db.GrammarPoints.Remove(g);
                    await db.SaveChangesAsync();
                }
            }
        }
    }

    [Fact]
    public async Task GrammarReview_Workflow_Draft_PendingReview_Published()
    {
        var adminToken = await GetAdminTokenAsync();
        var cmToken = await GetContentManagerTokenAsync();

        // 1. Create a draft grammar point
        Guid testGrammarId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var g = new GrammarPointEntity
            {
                Id = Guid.NewGuid(),
                Code = "TEST-GP-" + Guid.NewGuid().ToString("N")[..4],
                Title = "Cấu trúc kiểm thử quy trình duyệt",
                PinyinTitle = "cè shì jié gòu",
                HskLevel = 2,
                Category = "cơ bản",
                StructureFormula = "A + 比 + B + Tính từ",
                Explanation = "Giải thích câu chữ so sánh",
                Status = "DRAFT",
                CreatedAt = DateTime.UtcNow
            };
            db.GrammarPoints.Add(g);
            await db.SaveChangesAsync();
            testGrammarId = g.Id;
        }

        try
        {
            // 2. ContentManager submits for review (PENDING_REVIEW)
            var submitReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/grammar/{testGrammarId}/review")
            {
                Content = JsonContent.Create(new ReviewContentDto
                {
                    Status = "PENDING_REVIEW",
                    ReviewNotes = "Biên tập viên gửi duyệt sau khi hoàn thành ví dụ"
                })
            };
            submitReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", cmToken);
            var submitRes = await _client.SendAsync(submitReq);
            Assert.Equal(HttpStatusCode.OK, submitRes.StatusCode);

            // Verify status in DB is PENDING_REVIEW
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var g = await db.GrammarPoints.FindAsync(testGrammarId);
                Assert.NotNull(g);
                Assert.Equal("PENDING_REVIEW", g.Status);
                Assert.Equal("Biên tập viên gửi duyệt sau khi hoàn thành ví dụ", g.ReviewNotes);
            }

            // 3. Admin approves and publishes (PUBLISHED)
            var approveReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/grammar/{testGrammarId}/review")
            {
                Content = JsonContent.Create(new ReviewContentDto
                {
                    Status = "PUBLISHED",
                    ReviewNotes = "Admin thẩm định sư phạm và phê duyệt xuất bản"
                })
            };
            approveReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
            var approveRes = await _client.SendAsync(approveReq);
            Assert.Equal(HttpStatusCode.OK, approveRes.StatusCode);

            // Verify status in DB is PUBLISHED, ReviewedByUserId and ReviewedAt are populated
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var g = await db.GrammarPoints.FindAsync(testGrammarId);
                Assert.NotNull(g);
                Assert.Equal("PUBLISHED", g.Status);
                Assert.NotNull(g.ReviewedByUserId);
                Assert.NotNull(g.ReviewedAt);
                Assert.Equal("Admin thẩm định sư phạm và phê duyệt xuất bản", g.ReviewNotes);
            }
        }
        finally
        {
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var g = await db.GrammarPoints.FindAsync(testGrammarId);
                if (g != null)
                {
                    db.GrammarPoints.Remove(g);
                    await db.SaveChangesAsync();
                }
            }
        }
    }

    [Fact]
    public async Task BatchReviewGrammarPoints_AdminAndContentManager_Success()
    {
        var cmToken = await GetContentManagerTokenAsync();
        var adminToken = await GetAdminTokenAsync();

        Guid g1Id, g2Id;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var g1 = new GrammarPointEntity
            {
                Id = Guid.NewGuid(),
                Code = "BATCH-G1-" + Guid.NewGuid().ToString("N")[..4],
                Title = "Ngữ pháp theo lô 1",
                StructureFormula = "S + V + O",
                Explanation = "Giải thích lô 1",
                HskLevel = 3,
                Status = "DRAFT",
                CreatedAt = DateTime.UtcNow
            };
            var g2 = new GrammarPointEntity
            {
                Id = Guid.NewGuid(),
                Code = "BATCH-G2-" + Guid.NewGuid().ToString("N")[..4],
                Title = "Ngữ pháp theo lô 2",
                StructureFormula = "S + ADV + V",
                Explanation = "Giải thích lô 2",
                HskLevel = 3,
                Status = "DRAFT",
                CreatedAt = DateTime.UtcNow
            };
            db.GrammarPoints.AddRange(g1, g2);
            await db.SaveChangesAsync();
            g1Id = g1.Id;
            g2Id = g2.Id;
        }

        try
        {
            // 1. ContentManager batch sets to PENDING_REVIEW
            var batchReviewReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/content/grammar/batch-review")
            {
                Content = JsonContent.Create(new BatchReviewContentDto
                {
                    Ids = new List<Guid> { g1Id, g2Id },
                    Status = "PENDING_REVIEW",
                    ReviewNotes = "Lô ngữ pháp gửi kiểm duyệt HSK 3"
                })
            };
            batchReviewReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", cmToken);
            var res1 = await _client.SendAsync(batchReviewReq);
            Assert.Equal(HttpStatusCode.OK, res1.StatusCode);
            var result1 = await res1.Content.ReadFromJsonAsync<BatchReviewResultDto>(_jsonOptions);
            Assert.NotNull(result1);
            Assert.Equal(2, result1.ProcessedCount);
            Assert.Empty(result1.SkippedReasons);

            // 2. Admin batch publishes
            var batchPublishReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/content/grammar/batch-publish")
            {
                Content = JsonContent.Create(new BatchPublishRequestDto
                {
                    Ids = new List<Guid> { g1Id, g2Id }
                })
            };
            batchPublishReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
            var res2 = await _client.SendAsync(batchPublishReq);
            Assert.Equal(HttpStatusCode.OK, res2.StatusCode);
            var result2 = await res2.Content.ReadFromJsonAsync<BatchPublishResultDto>(_jsonOptions);
            Assert.NotNull(result2);
            Assert.Equal(2, result2.PublishedCount);
        }
        finally
        {
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var list = await db.GrammarPoints.Where(g => g.Id == g1Id || g.Id == g2Id).ToListAsync();
                db.GrammarPoints.RemoveRange(list);
                await db.SaveChangesAsync();
            }
        }
    }

    [Fact]
    public async Task BatchReviewGrammarPoints_IncompleteGrammar_Skipped()
    {
        var adminToken = await GetAdminTokenAsync();
        Guid completeId, incompleteId;

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var complete = new GrammarPointEntity
            {
                Id = Guid.NewGuid(),
                Code = "COMP-" + Guid.NewGuid().ToString("N")[..4],
                Title = "Đầy đủ thông tin",
                StructureFormula = "S + V",
                Explanation = "Giải thích hoàn chỉnh",
                HskLevel = 4,
                Status = "DRAFT",
                CreatedAt = DateTime.UtcNow
            };
            var incomplete = new GrammarPointEntity
            {
                Id = Guid.NewGuid(),
                Code = "INCOMP-" + Guid.NewGuid().ToString("N")[..4],
                Title = "Thiếu công thức",
                StructureFormula = "", // Empty formula!
                Explanation = "Giải thích",
                HskLevel = 4,
                Status = "DRAFT",
                CreatedAt = DateTime.UtcNow
            };
            db.GrammarPoints.AddRange(complete, incomplete);
            await db.SaveChangesAsync();
            completeId = complete.Id;
            incompleteId = incomplete.Id;
        }

        try
        {
            var req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/content/grammar/batch-publish")
            {
                Content = JsonContent.Create(new BatchPublishRequestDto
                {
                    Ids = new List<Guid> { completeId, incompleteId }
                })
            };
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
            var res = await _client.SendAsync(req);
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);

            var result = await res.Content.ReadFromJsonAsync<BatchPublishResultDto>(_jsonOptions);
            Assert.NotNull(result);
            Assert.Equal(1, result.PublishedCount); // Only the complete one
            Assert.Equal(1, result.SkippedCount);
            Assert.NotEmpty(result.SkippedReasons);
        }
        finally
        {
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var list = await db.GrammarPoints.Where(g => g.Id == completeId || g.Id == incompleteId).ToListAsync();
                db.GrammarPoints.RemoveRange(list);
                await db.SaveChangesAsync();
            }
        }
    }

    [Fact]
    public async Task TeacherAndStudent_CannotAccessGrammarBatchReview_ReturnsForbidden()
    {
        var teacherToken = await GetTeacherTokenAsync();
        var studentToken = await GetStudentTokenAsync();

        var body = new BatchReviewContentDto
        {
            Ids = new List<Guid> { Guid.NewGuid() },
            Status = "PUBLISHED"
        };

        // 1. Teacher cannot call batch-review
        var teacherReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/content/grammar/batch-review")
        {
            Content = JsonContent.Create(body)
        };
        teacherReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", teacherToken);
        var teacherRes = await _client.SendAsync(teacherReq);
        Assert.Equal(HttpStatusCode.Forbidden, teacherRes.StatusCode);

        // 2. Student cannot call batch-publish
        var studentReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/content/grammar/batch-publish")
        {
            Content = JsonContent.Create(body)
        };
        studentReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var studentRes = await _client.SendAsync(studentReq);
        Assert.Equal(HttpStatusCode.Forbidden, studentRes.StatusCode);
    }

    [Fact]
    public async Task Characters_QueryAndEditMetadata_ContentManagerAllowed_StudentForbidden()
    {
        var cmToken = await GetContentManagerTokenAsync();
        var studentToken = await GetStudentTokenAsync();

        // 1. Pick an existing character from DB
        Guid targetCharId;
        string originalSinoVi = "";
        string originalMeaningVi = "";
        string charStr = "";
        string pinyin = "";
        int? strokeCount = null;
        string? radical = null;

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var c = await db.HanziCharacters.FirstOrDefaultAsync(x => x.Character == "好");
            if (c == null)
            {
                c = await db.HanziCharacters.FirstAsync();
            }
            targetCharId = c.Id;
            charStr = c.Character;
            pinyin = c.Pinyin ?? "";
            originalSinoVi = c.SinoVietnamese ?? "";
            originalMeaningVi = c.MeaningVi ?? "";
            strokeCount = c.StrokeCount;
            radical = c.Radical;
        }

        try
        {
            // 2. Query characters list (open to all / public)
            var listRes = await _client.GetAsync($"/api/v1/content/characters?search={Uri.EscapeDataString(charStr)}");
            Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);

            // 3. Student attempts to update metadata -> 403 Forbidden
            var updateDto = new UpdateHanziCharacterDto
            {
                Pinyin = pinyin,
                SinoVietnamese = originalSinoVi + " (cập nhật test)",
                MeaningVi = "kiểm thử phân quyền",
                Radical = radical,
                StrokeCount = strokeCount
            };
            var studentReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/characters/{targetCharId}")
            {
                Content = JsonContent.Create(updateDto)
            };
            studentReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
            var studentRes = await _client.SendAsync(studentReq);
            Assert.Equal(HttpStatusCode.Forbidden, studentRes.StatusCode);

            // 4. ContentManager updates metadata -> 200 OK
            var cmReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/characters/{targetCharId}")
            {
                Content = JsonContent.Create(updateDto)
            };
            cmReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", cmToken);
            var cmRes = await _client.SendAsync(cmReq);
            Assert.Equal(HttpStatusCode.OK, cmRes.StatusCode);

            // 5. Verify database update
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var updated = await db.HanziCharacters.FindAsync(targetCharId);
                Assert.NotNull(updated);
                Assert.Equal(originalSinoVi + " (cập nhật test)", updated.SinoVietnamese);
                Assert.Equal("kiểm thử phân quyền", updated.MeaningVi);
            }
        }
        finally
        {
            // Restore original character values
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var c = await db.HanziCharacters.FindAsync(targetCharId);
                if (c != null)
                {
                    c.SinoVietnamese = originalSinoVi;
                    c.MeaningVi = originalMeaningVi;
                    await db.SaveChangesAsync();
                }
            }
        }
    }
}
