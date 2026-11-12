using System.Diagnostics;
using System.Text.Json;

namespace ZhongWenHub.Business.AITutor;

/// <summary>
/// Deterministic mock AI provider for automated testing and offline verification when AI:Provider / Gemini:Provider is set to "Mock".
/// Never masquerades as a live Gemini call: always sets Provider = "Mock" and IsMock = true.
/// </summary>
public sealed class MockAIProvider : IAIProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public Task<AIProviderResponse> GenerateContentAsync(
        AIProviderRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var sw = Stopwatch.StartNew();

        var rawText = request.Feature switch
        {
            "AI_CONVERSATION" => BuildConversationMockJson(request),
            "AI_EXERCISE_GEN" => BuildExerciseMockJson(request),
            "AI_LEARNING_EXPLAIN" => BuildLearningExplainMockJson(request),
            _ => BuildTutorMockJson(request),
        };

        sw.Stop();
        var promptTokens = Math.Max(16, (request.SystemInstruction.Length + request.UserPrompt.Length) / 4);
        var completionTokens = Math.Max(24, rawText.Length / 4);

        return Task.FromResult(new AIProviderResponse
        {
            RawText = rawText,
            Model = "mock-hsk-tutor-v1",
            Provider = "Mock",
            IsMock = true,
            PromptTokens = promptTokens,
            CompletionTokens = completionTokens,
            TotalTokens = promptTokens + completionTokens,
            LatencyMs = (int)Math.Max(1, sw.ElapsedMilliseconds)
        });
    }

    private static string BuildTutorMockJson(AIProviderRequest request)
    {
        var payload = new
        {
            type = "structured",
            summary = "Giải thích ngữ cảnh học tập HSK (Chế độ Mock kiểm thử).",
            markdownFallback = "Chế độ kiểm thử MockAIProvider: Đã tiếp nhận ngữ cảnh bài học HSK và câu hỏi của bạn.",
            blocks = new object[]
            {
                new
                {
                    type = "explanation",
                    title = "PHÂN TÍCH NGỮ CẢNH HSK (MOCK)",
                    content = "Đây là phản hồi từ MockAIProvider phục vụ kiểm thử khi chưa gọi trực tiếp Gemini API.",
                    note = "Kết quả thực tế sẽ được sinh bởi Gemini khi cấu hình Provider = Gemini."
                },
                new
                {
                    type = "chinese_example",
                    hanzi = "我在学习汉语。",
                    pinyin = "Wǒ zài xuéxí Hànyǔ.",
                    vietnamese = "Tôi đang học tiếng Trung."
                }
            },
            suggestedActions = new[]
            {
                "Cho thêm ví dụ cùng cấp HSK",
                "Phân tích cấu trúc ngữ pháp trong câu",
                "Tạo 1 bài tập ngắn luyện tập"
            }
        };

        return JsonSerializer.Serialize(payload, JsonOptions);
    }

    private static string BuildConversationMockJson(AIProviderRequest request)
    {
        var payload = new
        {
            replyZh = "你好！很高兴和你一起练习中文。你今天怎么样？",
            replyPinyin = "Nǐ hǎo! Hěn gāoxìng hé nǐ yìqǐ liànxí Zhōngwén. Nǐ jīntiān zěnmeyàng?",
            replyVi = "Xin chào! Rất vui được cùng bạn luyện tiếng Trung. Hôm nay bạn thế nào?",
            hasError = false,
            errorCategory = (string?)null,
            correctionExplanationVi = (string?)null,
            naturalSuggestionZh = "我今天很好，谢谢！",
            naturalSuggestionPinyin = "Wǒ jīntiān hěn hǎo, xièxie!",
            naturalSuggestionVi = "Hôm nay tôi rất khỏe, cảm ơn!",
            suggestedUserReplies = new[]
            {
                "我今天很好，谢谢！",
                "我想练习买东西的对话。"
            }
        };

        return JsonSerializer.Serialize(payload, JsonOptions);
    }

    private static string BuildExerciseMockJson(AIProviderRequest request)
    {
        var payload = new
        {
            exercises = new[]
            {
                new
                {
                    exerciseType = "multiple-choice",
                    skillCategory = "vocabulary",
                    promptZh = "请选择“谢谢”的意思：",
                    promptPinyin = "Qǐng xuǎnzé \"xièxie\" de yìsi:",
                    promptVi = "Hãy chọn nghĩa đúng của từ \"谢谢\":",
                    options = new[] { "Cảm ơn", "Xin lỗi", "Tạm biệt", "Xin chào" },
                    correctIndex = 0,
                    correctAnswer = "Cảm ơn",
                    explanationVi = "谢谢 (xièxie) có nghĩa là Cảm ơn trong tiếng Trung."
                }
            }
        };

        return JsonSerializer.Serialize(payload, JsonOptions);
    }

    private static string BuildLearningExplainMockJson(AIProviderRequest request)
    {
        var payload = new
        {
            explanationVi = "Dựa trên dữ liệu luyện tập và SRS thực tế, bạn nên ưu tiên ôn tập từ vựng đến hạn trước khi làm bài tập củng cố điểm yếu.",
            focusTipVi = "Hãy dành 10 phút ôn lại các điểm ngữ pháp có độ chính xác dưới 65%."
        };

        return JsonSerializer.Serialize(payload, JsonOptions);
    }
}
