using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Common.AI;
using ZhongWenHub.Data.Entities.AI;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.AILearning;

public class AILetterWritingService : IAILetterWritingService
{
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    private readonly ApplicationDbContext _dbContext;
    private readonly IAIProvider _aiProvider;
    private readonly IMultiProviderAiRouter? _router;
    private readonly IAIUsageLogger _usageLogger;
    private readonly ZhongWenHub.Features.admin.AiGovernance.IAiTokenGovernanceService? _tokenGovernance;
    private readonly ILogger<AILetterWritingService> _logger;

    public AILetterWritingService(
        ApplicationDbContext dbContext,
        IAIProvider aiProvider,
        IAIUsageLogger usageLogger,
        ILogger<AILetterWritingService> logger,
        IMultiProviderAiRouter? router = null,
        ZhongWenHub.Features.admin.AiGovernance.IAiTokenGovernanceService? tokenGovernance = null)
    {
        _dbContext = dbContext;
        _aiProvider = aiProvider;
        _usageLogger = usageLogger;
        _logger = logger;
        _router = router;
        _tokenGovernance = tokenGovernance;
    }

    public async Task<GeneratedLetterResponseDto> GenerateLetterAsync(
        Guid userId,
        GenerateLetterRequestDto request,
        CancellationToken ct = default)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Topic))
        {
            throw AITutorException.BadRequest("Chủ đề thư không được để trống.");
        }

        if (_tokenGovernance != null)
        {
            await _tokenGovernance.EnsureQuotaAvailableAsync(userId, "AI_LETTER_WRITING", 1500, ct);
        }
        else
        {
            await _usageLogger.EnsureWithinDailyBudgetAsync(userId, ct);
        }

        var systemPrompt = BuildSystemPrompt(request);
        var userPrompt = BuildUserPrompt(request);

        string rawResponseText;
        string modelUsed = "Unknown";
        int promptTokens = 0;
        int completionTokens = 0;
        int totalTokens = 0;
        int latencyMs = 0;

        try
        {
            if (_router != null)
            {
                var routerResult = await _router.GenerateAsync(
                    capability: "chat",
                    prompt: userPrompt,
                    options: new AiGenerationOptions
                    {
                        SystemInstruction = systemPrompt,
                        MaxTokens = 2048,
                        Temperature = 0.5
                    },
                    userId: userId,
                    feature: "AI_LETTER_WRITING",
                    ct: ct);

                rawResponseText = routerResult.Text;
                modelUsed = routerResult.Model;
                promptTokens = routerResult.PromptTokens;
                completionTokens = routerResult.CompletionTokens;
                totalTokens = routerResult.TotalTokens;
                latencyMs = (int)routerResult.LatencyMs;
            }
            else
            {
                var providerResponse = await _aiProvider.GenerateContentAsync(
                    new AIProviderRequest
                    {
                        Feature = "AI_LETTER_WRITING",
                        SystemInstruction = systemPrompt,
                        UserPrompt = userPrompt,
                        ExpectJson = true,
                        Temperature = 0.5,
                        MaxOutputTokens = 2048
                    },
                    ct);

                rawResponseText = providerResponse.RawText;
                modelUsed = providerResponse.Model;
                promptTokens = providerResponse.PromptTokens;
                completionTokens = providerResponse.CompletionTokens;
                totalTokens = providerResponse.TotalTokens;
                latencyMs = providerResponse.LatencyMs;

                await _usageLogger.LogAsync(userId, "AI_LETTER_WRITING", providerResponse, true, null, ct);
            }
        }
        catch (AITutorException ex)
        {
            await _usageLogger.LogAsync(userId, "AI_LETTER_WRITING", null, false, $"HTTP_{ex.StatusCode}", ct);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi gọi AI Provider để tạo thư cho học viên {UserId}", userId);
            await _usageLogger.LogAsync(userId, "AI_LETTER_WRITING", null, false, ex.GetType().Name, ct);
            throw AITutorException.ProviderUnavailable("Không thể tạo thư bằng AI lúc này. Vui lòng thử lại sau.");
        }

        var parsed = ParseResponse(rawResponseText, request);
        parsed.ModelUsed = modelUsed;
        parsed.TotalTokensUsed = totalTokens;

        // Persist letter session and message
        var session = new AiConversationSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SessionType = "LETTER_WRITING",
            HskLevel = request.HskLevel,
            ScenarioCode = request.RecipientType ?? "general",
            ScenarioTitle = request.Topic.Trim(),
            Status = "COMPLETED",
            ShowPinyin = true,
            ShowVietnamese = true,
            MessageCount = 2,
            StartedAt = DateTime.UtcNow,
            EndedAt = DateTime.UtcNow,
            SummaryVi = parsed.PedagogicalAdviceVi
        };

        var userMsg = new AiMessage
        {
            SessionId = session.Id,
            UserId = userId,
            Role = "user",
            ContentZh = request.UserDraftText ?? request.Topic,
            StructuredPayloadJson = JsonSerializer.Serialize(request, JsonOpts),
            CreatedAt = DateTime.UtcNow
        };

        var assistantMsg = new AiMessage
        {
            SessionId = session.Id,
            UserId = userId,
            Role = "assistant",
            ContentZh = parsed.FullLetterZh,
            Pinyin = parsed.FullLetterPinyin,
            ContentVi = parsed.FullLetterVi,
            StructuredPayloadJson = rawResponseText,
            Model = modelUsed,
            PromptTokens = promptTokens,
            CompletionTokens = completionTokens,
            LatencyMs = latencyMs,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.AiConversationSessions.Add(session);
        _dbContext.AiMessages.Add(userMsg);
        _dbContext.AiMessages.Add(assistantMsg);

        await _dbContext.SaveChangesAsync(ct);

        parsed.SessionId = session.Id;
        return parsed;
    }

    public async Task<List<LetterSummaryDto>> GetHistoryAsync(
        Guid userId,
        int limit = 20,
        CancellationToken ct = default)
    {
        var sessions = await _dbContext.AiConversationSessions
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.SessionType == "LETTER_WRITING")
            .OrderByDescending(s => s.StartedAt)
            .Take(Math.Clamp(limit, 1, 50))
            .ToListAsync(ct);

        var sessionIds = sessions.Select(s => s.Id).ToList();
        var assistantMessages = await _dbContext.AiMessages
            .AsNoTracking()
            .Where(m => sessionIds.Contains(m.SessionId) && m.Role == "assistant")
            .ToListAsync(ct);

        var msgMap = assistantMessages.ToDictionary(m => m.SessionId, m => m.ContentZh);

        return sessions.Select(s => new LetterSummaryDto
        {
            SessionId = s.Id,
            TitleZh = s.ScenarioTitle,
            ScenarioCode = s.ScenarioCode,
            HskLevel = s.HskLevel,
            SnippetZh = msgMap.TryGetValue(s.Id, out var text) 
                ? (text.Length > 80 ? text[..80] + "..." : text) 
                : string.Empty,
            CreatedAt = s.StartedAt
        }).ToList();
    }

    public async Task<GeneratedLetterResponseDto?> GetLetterDetailAsync(
        Guid userId,
        Guid sessionId,
        CancellationToken ct = default)
    {
        var session = await _dbContext.AiConversationSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId && s.SessionType == "LETTER_WRITING", ct);

        if (session == null) return null;

        var assistantMsg = await _dbContext.AiMessages
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.SessionId == sessionId && m.Role == "assistant", ct);

        if (assistantMsg == null || string.IsNullOrWhiteSpace(assistantMsg.StructuredPayloadJson))
        {
            return new GeneratedLetterResponseDto
            {
                SessionId = session.Id,
                TitleZh = session.ScenarioTitle,
                FullLetterZh = assistantMsg?.ContentZh ?? string.Empty,
                FullLetterPinyin = assistantMsg?.Pinyin ?? string.Empty,
                FullLetterVi = assistantMsg?.ContentVi ?? string.Empty,
                EstimatedHskLevel = session.HskLevel,
                CreatedAt = session.StartedAt
            };
        }

        var parsed = ParseResponse(assistantMsg.StructuredPayloadJson, new GenerateLetterRequestDto { HskLevel = session.HskLevel });
        parsed.SessionId = session.Id;
        parsed.ModelUsed = assistantMsg.Model ?? "Unknown";
        parsed.TotalTokensUsed = assistantMsg.PromptTokens + assistantMsg.CompletionTokens;
        parsed.CreatedAt = session.StartedAt;
        return parsed;
    }

    private static string BuildSystemPrompt(GenerateLetterRequestDto request)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Bạn là trợ lý AI chuyên gia viết thư và biên soạn thư tín tiếng Trung (书信) cho học viên Việt Nam.");
        sb.AppendLine($"Trình độ HSK mục tiêu: HSK {request.HskLevel}. Giọng văn: {request.Tone}. Độ dài: {request.Length}.");
        sb.AppendLine("Quy tắc cấu trúc thư tiếng Trung bắt buộc:");
        sb.AppendLine("1. 称谓 (Xưng hô mở đầu, lùi/đầu dòng chuẩn xác ví dụ 尊敬的王老师/亲爱的李华).");
        sb.AppendLine("2. 问候语 (Lời hỏi thăm xã giao mở đầu).");
        sb.AppendLine("3. 正文 (Nội dung chính của thư, diễn đạt tự nhiên theo chủ đề).");
        sb.AppendLine("4. 祝颂语 (Lời chúc kết thư ví dụ 此致 敬礼 / 祝你身体健康 / 祝工作顺利).");
        sb.AppendLine("5. 署名 (Ký tên người gửi) và 日期 (Ngày tháng).");
        sb.AppendLine("BẮT BUỘC TRẢ VỀ DUY NHẤT 1 JSON OBJECT KHÔNG CÓ MARKDOWN bao bọc, cấu trúc chính xác:");
        sb.AppendLine("""
{
  "titleZh": "Tiêu đề thư bằng tiếng Trung",
  "salutationZh": "Xưng hô mở đầu",
  "bodyZh": "Nội dung thân bài thư",
  "closingZh": "Lời chúc kết thư",
  "signOffZh": "Ký tên và ngày tháng",
  "fullLetterZh": "Toàn văn lá thư hoàn chỉnh ghép từ các phần trên",
  "fullLetterPinyin": "Pinyin đầy đủ có dấu thanh cho toàn văn lá thư",
  "fullLetterVi": "Bản dịch tiếng Việt tự nhiên, chuẩn phong cách thư tín",
  "keyVocabulary": [
    { "wordZh": "词语", "pinyin": "cíyǔ", "meaningVi": "nghĩa tiếng Việt", "usageNoteVi": "ghi chú cách dùng" }
  ],
  "keyPatterns": [
    { "patternZh": "mẫu câu", "pinyin": "pinyin", "meaningVi": "ý nghĩa", "exampleSentence": "câu ví dụ" }
  ],
  "userDraftCorrections": [
    { "originalText": "câu học viên viết sai nếu có", "correctedText": "câu sửa lại", "reasonVi": "giải thích lỗi" }
  ],
  "pedagogicalAdviceVi": "Lời khuyên sư phạm về văn phong thư tín trong ngữ cảnh này",
  "estimatedHskLevel": 3
}
""");
        return sb.ToString();
    }

    private static string BuildUserPrompt(GenerateLetterRequestDto request)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Chủ đề: {request.Topic.Trim()}");
        sb.AppendLine($"Người nhận: {request.RecipientType}");
        sb.AppendLine($"Trình độ: HSK {request.HskLevel}");
        sb.AppendLine($"Giọng văn: {request.Tone}");
        if (!string.IsNullOrWhiteSpace(request.KeyPoints))
        {
            sb.AppendLine($"Các ý chính cần có: {request.KeyPoints.Trim()}");
        }
        if (!string.IsNullOrWhiteSpace(request.UserDraftText))
        {
            sb.AppendLine($"Bản nháp của học viên gửi để AI sửa và nâng cấp:\n\"{request.UserDraftText.Trim()}\"");
        }
        return sb.ToString();
    }

    private static GeneratedLetterResponseDto ParseResponse(string rawText, GenerateLetterRequestDto request)
    {
        try
        {
            var cleaned = rawText.Trim();
            if (cleaned.StartsWith("```"))
            {
                var firstBrace = cleaned.IndexOf('{');
                var lastBrace = cleaned.LastIndexOf('}');
                if (firstBrace >= 0 && lastBrace > firstBrace)
                {
                    cleaned = cleaned[firstBrace..(lastBrace + 1)];
                }
            }

            var dto = JsonSerializer.Deserialize<GeneratedLetterResponseDto>(cleaned, JsonOpts);
            if (dto != null)
            {
                if (string.IsNullOrWhiteSpace(dto.FullLetterZh))
                {
                    dto.FullLetterZh = $"{dto.SalutationZh}\n\n{dto.BodyZh}\n\n{dto.ClosingZh}\n\n{dto.SignOffZh}".Trim();
                }
                return dto;
            }
        }
        catch
        {
            // Fallback parsing if JSON was imperfect
        }

        return new GeneratedLetterResponseDto
        {
            TitleZh = request.Topic,
            SalutationZh = "亲爱的朋友：",
            BodyZh = rawText,
            ClosingZh = "祝好！",
            SignOffZh = "你的朋友",
            FullLetterZh = rawText,
            FullLetterVi = "Bản thư tiếng Trung được tạo bởi AI.",
            EstimatedHskLevel = request.HskLevel,
            PedagogicalAdviceVi = "Hãy chú ý cách dùng từ xưng hô và lời chúc kết thư chuẩn mực."
        };
    }
}
