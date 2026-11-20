using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Business.AITutor.DTOs;
using ZhongWenHub.Business.Authentication.DTOs;

namespace ZhongWenHub.IntegrationTests;

public class AITutorIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public AITutorIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<string> LoginAsStudentAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto
        {
            UsernameOrEmail = "student@zhongwenhub.edu.vn",
            Password = "StudentPassword123!"
        });
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        return body!.AccessToken;
    }

    [Fact]
    public async Task Chat_WithoutJwt_Returns401UnauthorizedProblemDetails()
    {
        var client = _factory.CreateNoCookieClient();

        var response = await client.PostAsJsonAsync("/api/v1/ai-tutor/chat", new AITutorChatRequestDto
        {
            ConversationId = "conv-unauth",
            Message = "你好 là gì?",
            Mode = "ASK"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Chat_WithJwt_AndMissingGeminiApiKey_Returns503WithoutFakeAnswer()
    {
        var originalKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        try
        {
            Environment.SetEnvironmentVariable("GEMINI_API_KEY", null);
            var client = _factory.CreateNoCookieClient();
            var token = await LoginAsStudentAsync(client);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.PostAsJsonAsync("/api/v1/ai-tutor/chat", new AITutorChatRequestDto
            {
                ConversationId = "conv-nokey",
                Message = "Giải thích từ 你好",
                Mode = "EXPLAIN"
            });

            Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        }
        finally
        {
            Environment.SetEnvironmentVariable("GEMINI_API_KEY", originalKey);
        }
    }

    [Fact]
    public async Task Chat_WithJwt_AndValidProviderResponse_Returns200StructuredResponse()
    {
        using var customizedFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IAIProvider>();
                services.AddSingleton<IAIProvider>(new TestStubAIProvider());
            });
        });

        var client = customizedFactory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = false
        });

        var token = await LoginAsStudentAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsJsonAsync("/api/v1/ai-tutor/chat", new AITutorChatRequestDto
        {
            ConversationId = "conv-auth-ok",
            Message = "Giải thích từ 学习 giúp em",
            Mode = "EXPLAIN",
            Context = new AITutorContextDto
            {
                Source = "vocabulary",
                HskLevel = 1,
                VocabularyWord = new AITutorVocabularyWordDto
                {
                    Hanzi = "学习",
                    Pinyin = "xuéxí",
                    Meaning = "học tập"
                }
            }
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = await response.Content.ReadFromJsonAsync<AITutorChatResponseDto>(_jsonOptions);
        Assert.NotNull(payload);
        Assert.Equal("structured", payload.Type);
        Assert.NotEmpty(payload.Blocks);
    }

    [Fact]
    public async Task Chat_WithMultiTurnHistory_ForwardsHistoryToProvider()
    {
        var capturingProvider = new CapturingStubAIProvider();
        using var customizedFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IAIProvider>();
                services.AddSingleton<IAIProvider>(capturingProvider);
            });
        });

        var client = customizedFactory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = false
        });

        var token = await LoginAsStudentAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsJsonAsync("/api/v1/ai-tutor/chat", new AITutorChatRequestDto
        {
            ConversationId = "conv-multi-turn",
            Message = "Cho tôi thêm ví dụ",
            Mode = "ASK",
            History = new List<AITutorHistoryTurnDto>
            {
                new() { Role = "user", Content = "Từ 学习 nghĩa là gì?" },
                new() { Role = "assistant", Content = "学习 (xuéxí) nghĩa là học tập." }
            },
            Context = new AITutorContextDto
            {
                Source = "vocabulary",
                HskLevel = 1
            }
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(capturingProvider.LastRequest);
        Assert.Equal(2, capturingProvider.LastRequest!.History.Count);
        Assert.Equal("user", capturingProvider.LastRequest.History[0].Role);
        Assert.Equal("model", capturingProvider.LastRequest.History[1].Role);
    }

    private sealed class CapturingStubAIProvider : IAIProvider
    {
        public AIProviderRequest? LastRequest { get; private set; }

        public Task<AIProviderResponse> GenerateContentAsync(AIProviderRequest request, CancellationToken cancellationToken = default)
        {
            LastRequest = request;
            return new TestStubAIProvider().GenerateContentAsync(request, cancellationToken);
        }
    }

    private sealed class TestStubAIProvider : IAIProvider
    {
        public Task<AIProviderResponse> GenerateContentAsync(AIProviderRequest request, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new AIProviderResponse
            {
                Model = "gemini-2.5-flash",
                RawText = """
                {
                  "type": "structured",
                  "summary": "Giải thích từ vựng 学习 (xuéxí)",
                  "blocks": [
                    {
                      "type": "explanation",
                      "title": "Ý NGHĨA & CÁCH DÙNG",
                      "content": "学习 (xuéxí) là động từ mang nghĩa học, học tập."
                    },
                    {
                      "type": "chinese_example",
                      "hanzi": "我每天学习汉语。",
                      "pinyin": "Wǒ měitiān xuéxí Hànyǔ.",
                      "vietnamese": "Tôi học tiếng Hán mỗi ngày."
                    }
                  ],
                  "suggestedActions": ["Cho thêm ví dụ với 学习"]
                }
                """
            });
        }
    }
}

