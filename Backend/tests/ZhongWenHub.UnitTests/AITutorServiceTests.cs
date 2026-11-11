using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Business.AITutor.DTOs;

namespace ZhongWenHub.UnitTests;

public class AITutorServiceTests
{
    private sealed class StubContextVerifier : IAITutorContextVerifier
    {
        public VerifiedAITutorContext Result { get; set; } = new()
        {
            EffectiveHskLevel = 2,
            Source = "general",
            LanguagePreference = "Vietnamese"
        };

        public Task<VerifiedAITutorContext> VerifyAndNormalizeAsync(
            Guid userId,
            AITutorContextDto? requestedContext,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(Result);
        }
    }

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
                RawText = """
                {
                  "type": "structured",
                  "summary": "Giải thích từ vựng 你好",
                  "markdownFallback": "**你好** (nǐ hǎo): Xin chào.",
                  "blocks": [
                    {
                      "type": "explanation",
                      "title": "NGHĨA VÀ CÁCH DÙNG",
                      "content": "你好 (nǐ hǎo) là cách chào hỏi phổ biến nhất trong tiếng Trung."
                    },
                    {
                      "type": "chinese_example",
                      "hanzi": "你好，请问你叫什么名字？",
                      "pinyin": "Nǐ hǎo, qǐngwèn nǐ jiào shénme míngzi?",
                      "vietnamese": "Xin chào, xin hỏi bạn tên là gì?"
                    }
                  ],
                  "suggestedActions": ["Cho thêm ví dụ", "Luyện hội thoại chào hỏi"]
                }
                """
            });
        }
    }

    private sealed class FakeHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> _responder;
        public HttpRequestMessage? LastRequest { get; private set; }
        public bool ApiKeyHeaderPresent { get; private set; }

        public FakeHttpMessageHandler(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> responder)
        {
            _responder = responder;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequest = request;
            ApiKeyHeaderPresent = request.Headers.Contains("x-goog-api-key");
            return _responder(request, cancellationToken);
        }
    }

    private static AITutorService CreateService(
        IAIProvider provider,
        IAITutorContextVerifier? verifier = null,
        GeminiOptions? options = null)
    {
        return new AITutorService(
            provider,
            verifier ?? new StubContextVerifier(),
            Options.Create(options ?? new GeminiOptions()),
            NullLogger<AITutorService>.Instance);
    }

    [Fact]
    public async Task ChatAsync_ValidVocabularyQuestion_ReturnsStructuredVietnameseHanziPinyinResponse()
    {
        var provider = new StubAIProvider();
        var verifier = new StubContextVerifier
        {
            Result = new VerifiedAITutorContext
            {
                EffectiveHskLevel = 1,
                Source = "vocabulary",
                LanguagePreference = "Vietnamese",
                VerifiedVocabulary = new VerifiedVocabularyInfo
                {
                    Hanzi = "你好",
                    Pinyin = "nǐ hǎo",
                    Meaning = "xin chào",
                    HskLevel = 1,
                    IsDatabaseVerified = true
                }
            }
        };
        var service = CreateService(provider, verifier);

        var response = await service.ChatAsync(Guid.NewGuid(), new AITutorChatRequestDto
        {
            ConversationId = "conv-1",
            Message = "Giải thích từ 你好 giúp em",
            Mode = "EXPLAIN",
            Context = new AITutorContextDto { Source = "vocabulary", HskLevel = 1 }
        });

        Assert.Equal("structured", response.Type);
        Assert.Equal(2, response.Blocks.Count);
        Assert.Contains("你好", response.Blocks[0].GetProperty("content").GetString());
        Assert.Equal("你好，请问你叫什么名字？", response.Blocks[1].GetProperty("hanzi").GetString());
        Assert.Contains("Nǐ hǎo", response.Blocks[1].GetProperty("pinyin").GetString());
        Assert.NotNull(provider.LastRequest);
        Assert.Contains("HSK 1", provider.LastRequest!.SystemInstruction);
        Assert.Contains("tiếng Việt", provider.LastRequest.SystemInstruction);
        Assert.Contains("đã xác minh từ kho từ vựng", provider.LastRequest.UserPrompt);
    }

    [Fact]
    public async Task ChatAsync_EmptyOrTooLongMessage_Throws400WithoutCallingProvider()
    {
        var provider = new StubAIProvider();
        var service = CreateService(provider, options: new GeminiOptions { MaxInputLength = 100 });

        var emptyEx = await Assert.ThrowsAsync<AITutorException>(() =>
            service.ChatAsync(Guid.NewGuid(), new AITutorChatRequestDto { Message = "   " }));
        Assert.Equal(400, emptyEx.StatusCode);

        var tooLongEx = await Assert.ThrowsAsync<AITutorException>(() =>
            service.ChatAsync(Guid.NewGuid(), new AITutorChatRequestDto { Message = new string('a', 101) }));
        Assert.Equal(400, tooLongEx.StatusCode);
        Assert.Null(provider.LastRequest);
    }

    [Fact]
    public async Task ChatAsync_InvalidJsonFromProvider_FallsBackSafelyToMarkdown()
    {
        var provider = new StubAIProvider
        {
            Handler = (_, _) => Task.FromResult(new AIProviderResponse
            {
                Model = "gemini-2.5-flash",
                RawText = "**想 (xiǎng)**: muốn / nhớ. Ví dụ: 我想喝茶 (Wǒ xiǎng hē chá)."
            })
        };
        var service = CreateService(provider);

        var response = await service.ChatAsync(Guid.NewGuid(), new AITutorChatRequestDto
        {
            Message = "Giải thích từ 想"
        });

        Assert.Equal("markdown", response.Type);
        Assert.Empty(response.Blocks);
        Assert.Contains("想 (xiǎng)", response.MarkdownFallback);
    }

    [Fact]
    public async Task ChatAsync_CorrectionBlockMissingDiffItems_NormalizesDiffItemsArray()
    {
        var provider = new StubAIProvider
        {
            Handler = (_, _) => Task.FromResult(new AIProviderResponse
            {
                Model = "gemini-2.5-flash",
                RawText = """
                {
                  "type": "structured",
                  "summary": "Sửa câu tiếng Trung",
                  "blocks": [
                    {
                      "type": "correction",
                      "originalSentence": "我想喝咖啡了",
                      "correctedSentence": "我想喝咖啡。",
                      "pinyin": "Wǒ xiǎng hē kāfēi.",
                      "vietnamese": "Tôi muốn uống cà phê.",
                      "explanation": "Không cần dùng 了 ở cuối câu biểu đạt mong muốn hiện tại."
                    }
                  ],
                  "suggestedActions": []
                }
                """
            })
        };
        var service = CreateService(provider);

        var response = await service.ChatAsync(Guid.NewGuid(), new AITutorChatRequestDto
        {
            Message = "Sửa câu 我想喝咖啡了",
            Mode = "CORRECT"
        });

        Assert.Single(response.Blocks);
        Assert.True(response.Blocks[0].TryGetProperty("diffItems", out var diffItems));
        Assert.Equal(JsonValueKind.Array, diffItems.ValueKind);
        Assert.Equal(2, diffItems.GetArrayLength());
    }

    [Fact]
    public async Task GeminiProvider_MissingApiKey_Throws503WithoutLeakingSecrets()
    {
        var originalEnv = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        try
        {
            Environment.SetEnvironmentVariable("GEMINI_API_KEY", null);
            var handler = new FakeHttpMessageHandler((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)));
            var provider = new GeminiProvider(
                new HttpClient(handler),
                Options.Create(new GeminiOptions { ApiKey = "" }),
                NullLogger<GeminiProvider>.Instance);

            var ex = await Assert.ThrowsAsync<AITutorException>(() =>
                provider.GenerateContentAsync(new AIProviderRequest { SystemInstruction = "sys", UserPrompt = "hi" }));

            Assert.Equal(503, ex.StatusCode);
            Assert.Null(handler.LastRequest);
        }
        finally
        {
            Environment.SetEnvironmentVariable("GEMINI_API_KEY", originalEnv);
        }
    }

    [Fact]
    public async Task GeminiProvider_SendsApiKeyInHeaderNotUrl_AndHandles429AndTimeout()
    {
        const string dummyTestKey = "dummy-test-key-never-leak";

        // 1. Success verifies header vs URL
        var okHandler = new FakeHttpMessageHandler((_, _) =>
        {
            var body = """{"candidates":[{"content":{"parts":[{"text":"{\"type\":\"markdown\",\"markdownFallback\":\"OK\",\"blocks\":[],\"suggestedActions\":[]}"}]}}]}""";
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json")
            });
        });
        var okProvider = new GeminiProvider(
            new HttpClient(okHandler),
            Options.Create(new GeminiOptions { ApiKey = dummyTestKey, Model = "gemini-2.5-flash" }),
            NullLogger<GeminiProvider>.Instance);

        var res = await okProvider.GenerateContentAsync(new AIProviderRequest { SystemInstruction = "sys", UserPrompt = "hi" });
        Assert.Contains("OK", res.RawText);
        Assert.True(okHandler.ApiKeyHeaderPresent);
        Assert.DoesNotContain("key=", okHandler.LastRequest!.RequestUri!.ToString(), StringComparison.OrdinalIgnoreCase);

        // 2. HTTP 429 Quota exceeded
        var handler429 = new FakeHttpMessageHandler((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.TooManyRequests)));
        var provider429 = new GeminiProvider(
            new HttpClient(handler429),
            Options.Create(new GeminiOptions { ApiKey = dummyTestKey }),
            NullLogger<GeminiProvider>.Instance);

        var ex429 = await Assert.ThrowsAsync<AITutorException>(() =>
            provider429.GenerateContentAsync(new AIProviderRequest { SystemInstruction = "sys", UserPrompt = "hi" }));
        Assert.Equal(429, ex429.StatusCode);
        Assert.DoesNotContain(dummyTestKey, ex429.Message);

        // 3. Timeout
        var handlerTimeout = new FakeHttpMessageHandler(async (_, ct) =>
        {
            await Task.Delay(TimeSpan.FromSeconds(5), ct);
            return new HttpResponseMessage(HttpStatusCode.OK);
        });
        var providerTimeout = new GeminiProvider(
            new HttpClient(handlerTimeout),
            Options.Create(new GeminiOptions { ApiKey = dummyTestKey, TimeoutSeconds = 1 }),
            NullLogger<GeminiProvider>.Instance);

        // Override minimal 5s clamp isn't triggered if handler throws TaskCanceledException not matching caller token:
        var exHandlerCanceled = new FakeHttpMessageHandler((_, _) => throw new TaskCanceledException("simulated upstream timeout"));
        var providerSimulatedTimeout = new GeminiProvider(
            new HttpClient(exHandlerCanceled),
            Options.Create(new GeminiOptions { ApiKey = dummyTestKey, TimeoutSeconds = 10 }),
            NullLogger<GeminiProvider>.Instance);

        var exTimeout = await Assert.ThrowsAsync<AITutorException>(() =>
            providerSimulatedTimeout.GenerateContentAsync(new AIProviderRequest { SystemInstruction = "sys", UserPrompt = "hi" }));
        Assert.Equal(504, exTimeout.StatusCode);
        Assert.DoesNotContain(dummyTestKey, exTimeout.Message);
    }
}
