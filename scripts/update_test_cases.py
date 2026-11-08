import sys

path = r'Backend\tests\ZhongWenHub.IntegrationTests\Hsk2ReviewWorkflowIntegrationTests.cs'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Replace the entire new block starting at GrammarReview_Workflow_Draft_PendingReview_Published
start_marker = '    [Fact]\n    public async Task GrammarReview_Workflow_Draft_PendingReview_Published()'
start_idx = c.find(start_marker)
if start_idx == -1:
    start_marker = '    [Fact]\r\n    public async Task GrammarReview_Workflow_Draft_PendingReview_Published()'
    start_idx = c.find(start_marker)

assert start_idx != -1, 'Could not find start marker'

replacement_tests = """    [Fact]
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
"""

c = c[:start_idx] + replacement_tests

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated integration tests cleanly')
