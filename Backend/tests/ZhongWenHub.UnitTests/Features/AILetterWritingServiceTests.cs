using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using ZhongWenHub.Business.AILearning;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Common.AI;
using ZhongWenHub.Data.Entities.AI;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.UnitTests.Features;

public class AILetterWritingServiceTests
{
    private sealed class StubAIProvider : IAIProvider
    {
        public AIProviderRequest? LastRequest { get; private set; }
        public Func<AIProviderRequest, CancellationToken, Task<AIProviderResponse>>? Handler { get; set; }

        public Task<AIProviderResponse> GenerateContentAsync(AIProviderRequest request, CancellationToken cancellationToken = default)
        {
            LastRequest = request;
            if (Handler is not null)
            {
                return Handler(request, cancellationToken);
            }

            return Task.FromResult(new AIProviderResponse
            {
                Model = "gemini-2.5-flash",
                PromptTokens = 120,
                CompletionTokens = 250,
                TotalTokens = 370,
                LatencyMs = 600,
                RawText = """
                {
                  "titleZh": "致李老师的一封感谢信",
                  "salutationZh": "尊敬的李老师：",
                  "bodyZh": "您好！非常感谢您这一年来对我的悉心指导和耐心帮助。",
                  "closingZh": "祝您身体健康，工作顺利！",
                  "signOffZh": "您的学生 李明\n2026年11月23日",
                  "fullLetterZh": "尊敬的李老师：\n\n您好！非常感谢您这一年来对我的悉心指导和耐心帮助。\n\n祝您身体健康，工作顺利！\n\n您的学生 李明\n2026年11月23日",
                  "fullLetterPinyin": "Zūnjìng de Lǐ lǎoshī:\n\nNǐ hǎo! Fēicháng gǎnxiè...",
                  "fullLetterVi": "Kính gửi thầy Lý:\n\nEm chào thầy! Em xin chân thành cảm ơn sự hướng dẫn tận tình...",
                  "keyVocabulary": [
                    { "wordZh": "指导", "pinyin": "zhǐdǎo", "meaningVi": "chỉ đạo, hướng dẫn", "usageNoteVi": "dùng trong ngữ cảnh học tập" }
                  ],
                  "keyPatterns": [
                    { "patternZh": "非常感谢...", "pinyin": "fēicháng gǎnxiè", "meaningVi": "rất cảm ơn", "exampleSentence": "非常感谢您的帮助。" }
                  ],
                  "userDraftCorrections": [],
                  "pedagogicalAdviceVi": "Khi viết thư cho thầy cô, nên dùng 尊敬的 và kết thúc bằng 祝您...",
                  "estimatedHskLevel": 3
                }
                """
            });
        }
    }

    private sealed class StubUsageLogger : IAIUsageLogger
    {
        public int EnsureBudgetCallCount { get; private set; }
        public int LogCallCount { get; private set; }

        public Task EnsureWithinDailyBudgetAsync(Guid userId, CancellationToken ct = default)
        {
            EnsureBudgetCallCount++;
            return Task.CompletedTask;
        }

        public Task LogAsync(Guid userId, string feature, AIProviderResponse? response, bool isSuccess, string? errorCode = null, CancellationToken ct = default)
        {
            LogCallCount++;
            return Task.CompletedTask;
        }
    }

    private static ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task GenerateLetterAsync_ValidRequest_PersistsSessionAndReturnsStructuredResult()
    {
        using var dbContext = CreateInMemoryDbContext();
        var aiProvider = new StubAIProvider();
        var usageLogger = new StubUsageLogger();
        var service = new AILetterWritingService(
            dbContext,
            aiProvider,
            usageLogger,
            NullLogger<AILetterWritingService>.Instance);

        var userId = Guid.NewGuid();
        var request = new GenerateLetterRequestDto
        {
            Topic = "Thư cảm ơn thầy giáo",
            RecipientType = "teacher",
            HskLevel = 3,
            Tone = "polite",
            Length = "medium"
        };

        var result = await service.GenerateLetterAsync(userId, request);

        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.SessionId);
        Assert.Equal("致李老师的一封感谢信", result.TitleZh);
        Assert.Equal("尊敬的李老师：", result.SalutationZh);
        Assert.Single(result.KeyVocabulary);
        Assert.Equal("指导", result.KeyVocabulary[0].WordZh);
        Assert.Equal(370, result.TotalTokensUsed);
        Assert.Equal("gemini-2.5-flash", result.ModelUsed);

        // Verify Database Persistence
        var session = await dbContext.AiConversationSessions.FirstOrDefaultAsync(s => s.Id == result.SessionId);
        Assert.NotNull(session);
        Assert.Equal(userId, session.UserId);
        Assert.Equal("LETTER_WRITING", session.SessionType);
        Assert.Equal(3, session.HskLevel);
        Assert.Equal("teacher", session.ScenarioCode);

        var messages = await dbContext.AiMessages.Where(m => m.SessionId == result.SessionId).ToListAsync();
        Assert.Equal(2, messages.Count);
        Assert.Contains(messages, m => m.Role == "user");
        Assert.Contains(messages, m => m.Role == "assistant");

        Assert.Equal(1, usageLogger.EnsureBudgetCallCount);
        Assert.Equal(1, usageLogger.LogCallCount);
    }

    [Fact]
    public async Task GenerateLetterAsync_EmptyTopic_Throws400BadRequest()
    {
        using var dbContext = CreateInMemoryDbContext();
        var aiProvider = new StubAIProvider();
        var usageLogger = new StubUsageLogger();
        var service = new AILetterWritingService(
            dbContext,
            aiProvider,
            usageLogger,
            NullLogger<AILetterWritingService>.Instance);

        var ex = await Assert.ThrowsAsync<AITutorException>(() =>
            service.GenerateLetterAsync(Guid.NewGuid(), new GenerateLetterRequestDto { Topic = "   " }));

        Assert.Equal(400, ex.StatusCode);
        Assert.Null(aiProvider.LastRequest);
    }

    [Fact]
    public async Task GetHistoryAsync_ReturnsSessionsDescending()
    {
        using var dbContext = CreateInMemoryDbContext();
        var aiProvider = new StubAIProvider();
        var usageLogger = new StubUsageLogger();
        var service = new AILetterWritingService(
            dbContext,
            aiProvider,
            usageLogger,
            NullLogger<AILetterWritingService>.Instance);

        var userId = Guid.NewGuid();
        var s1 = new AiConversationSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SessionType = "LETTER_WRITING",
            ScenarioTitle = "Thư 1",
            ScenarioCode = "friend",
            HskLevel = 2,
            StartedAt = DateTime.UtcNow.AddMinutes(-10)
        };
        var s2 = new AiConversationSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SessionType = "LETTER_WRITING",
            ScenarioTitle = "Thư 2",
            ScenarioCode = "teacher",
            HskLevel = 4,
            StartedAt = DateTime.UtcNow
        };
        dbContext.AiConversationSessions.AddRange(s1, s2);
        await dbContext.SaveChangesAsync();

        var history = await service.GetHistoryAsync(userId, 10);

        Assert.Equal(2, history.Count);
        Assert.Equal("Thư 2", history[0].TitleZh);
        Assert.Equal("Thư 1", history[1].TitleZh);
    }

    [Fact]
    public async Task GetLetterDetailAsync_ValidSessionId_ReturnsLetter()
    {
        using var dbContext = CreateInMemoryDbContext();
        var aiProvider = new StubAIProvider();
        var usageLogger = new StubUsageLogger();
        var service = new AILetterWritingService(
            dbContext,
            aiProvider,
            usageLogger,
            NullLogger<AILetterWritingService>.Instance);

        var userId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var session = new AiConversationSession
        {
            Id = sessionId,
            UserId = userId,
            SessionType = "LETTER_WRITING",
            ScenarioTitle = "Thư mời sinh nhật",
            ScenarioCode = "friend",
            HskLevel = 2,
            StartedAt = DateTime.UtcNow
        };
        var assistantMsg = new AiMessage
        {
            SessionId = sessionId,
            UserId = userId,
            Role = "assistant",
            ContentZh = "亲爱的李华：请来参加我的生日聚会！",
            Pinyin = "Qīn'ài de Lǐ Huá...",
            ContentVi = "Gửi Lý Hoa: Mời cậu đến dự tiệc sinh nhật!",
            CreatedAt = DateTime.UtcNow
        };
        dbContext.AiConversationSessions.Add(session);
        dbContext.AiMessages.Add(assistantMsg);
        await dbContext.SaveChangesAsync();

        var detail = await service.GetLetterDetailAsync(userId, sessionId);

        Assert.NotNull(detail);
        Assert.Equal(sessionId, detail.SessionId);
        Assert.Equal("Thư mời sinh nhật", detail.TitleZh);
        Assert.Equal("亲爱的李华：请来参加我的生日聚会！", detail.FullLetterZh);
    }
}
