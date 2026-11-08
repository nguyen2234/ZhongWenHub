import sys

path = r'Backend\tests\ZhongWenHub.IntegrationTests\Hsk2ReviewWorkflowIntegrationTests.cs'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Add GetContentManagerTokenAsync helper
helper = """    private async Task<string> GetContentManagerTokenAsync()
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
"""

if 'GetContentManagerTokenAsync' not in c:
    target_pos = '    private async Task<string> GetTeacherTokenAsync()'
    c = c.replace(target_pos, helper + '\n' + target_pos, 1)

new_tests = """
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

            // Clean up
            db.GrammarPoints.Remove(g);
            await db.SaveChangesAsync();
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
        Assert.Equal(2, result1.UpdatedCount);
        Assert.Empty(result1.Errors);

        // 2. Admin batch publishes
        var batchPublishReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/content/grammar/batch-publish")
        {
            Content = JsonContent.Create(new BatchReviewContentDto
            {
                Ids = new List<Guid> { g1Id, g2Id },
                Status = "PUBLISHED",
                ReviewNotes = "Admin phê duyệt xuất bản lô ngữ pháp HSK 3"
            })
        };
        batchPublishReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var res2 = await _client.SendAsync(batchPublishReq);
        Assert.Equal(HttpStatusCode.OK, res2.StatusCode);
        var result2 = await res2.Content.ReadFromJsonAsync<BatchReviewResultDto>(_jsonOptions);
        Assert.NotNull(result2);
        Assert.Equal(2, result2.UpdatedCount);

        // Clean up
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var list = await db.GrammarPoints.Where(g => g.Id == g1Id || g.Id == g2Id).ToListAsync();
            db.GrammarPoints.RemoveRange(list);
            await db.SaveChangesAsync();
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

        var req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/content/grammar/batch-publish")
        {
            Content = JsonContent.Create(new BatchReviewContentDto
            {
                Ids = new List<Guid> { completeId, incompleteId },
                Status = "PUBLISHED"
            })
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var res = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        var result = await res.Content.ReadFromJsonAsync<BatchReviewResultDto>(_jsonOptions);
        Assert.NotNull(result);
        Assert.Equal(1, result.UpdatedCount); // Only the complete one
        Assert.True(result.Errors.ContainsKey(incompleteId.ToString()));

        // Clean up
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var list = await db.GrammarPoints.Where(g => g.Id == completeId || g.Id == incompleteId).ToListAsync();
            db.GrammarPoints.RemoveRange(list);
            await db.SaveChangesAsync();
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

        // 1. Create a Hanzi character for testing
        Guid testCharId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cEntity = new HanziCharacterEntity
            {
                Id = Guid.NewGuid(),
                Character = "字",
                Pinyin = "zì",
                HanViet = "tự",
                MeaningVi = "chữ, văn tự",
                Radical = "宀",
                StrokeCount = 6,
                CreatedAt = DateTime.UtcNow
            };
            db.HanziCharacters.Add(cEntity);
            await db.SaveChangesAsync();
            testCharId = cEntity.Id;
        }

        // 2. Query characters list (open to all / public)
        var listRes = await _client.GetAsync("/api/v1/content/characters?search=字");
        Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);

        // 3. Student attempts to update metadata -> 403 Forbidden
        var updateDto = new UpdateHanziCharacterDto
        {
            HanViet = "tự (cập nhật)",
            MeaningVi = "chữ viết, ký tự",
            Radical = "宀",
            StrokeCount = 6
        };
        var studentReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/characters/{testCharId}")
        {
            Content = JsonContent.Create(updateDto)
        };
        studentReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        var studentRes = await _client.SendAsync(studentReq);
        Assert.Equal(HttpStatusCode.Forbidden, studentRes.StatusCode);

        // 4. ContentManager updates metadata -> 200 OK
        var cmReq = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/content/characters/{testCharId}")
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
            var updated = await db.HanziCharacters.FindAsync(testCharId);
            Assert.NotNull(updated);
            Assert.Equal("tự (cập nhật)", updated.HanViet);
            Assert.Equal("chữ viết, ký tự", updated.MeaningVi);

            // Clean up
            db.HanziCharacters.Remove(updated);
            await db.SaveChangesAsync();
        }
    }
"""

# Insert new tests right before the last closing brace
last_brace = c.rfind('}')
c = c[:last_brace] + new_tests + '\n}\n'

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print('Successfully added 5 new integration tests')
