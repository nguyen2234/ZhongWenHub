using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Business.Authentication.DTOs;
using ZhongWenHub.Features.admin.AiGovernance.DTO;
using Xunit;

namespace ZhongWenHub.IntegrationTests;

[Trait("Category", "Integration")]
public class AILetterWritingAndGovernanceIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public AILetterWritingAndGovernanceIntegrationTests(CustomWebApplicationFactory factory)
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

    private async Task<string> LoginAsAdminAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto
        {
            UsernameOrEmail = "admin@gmail.com",
            Password = "admin"
        });
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        return body!.AccessToken;
    }

    [Fact]
    public async Task LetterWriting_WithoutJwt_Returns401()
    {
        var client = _factory.CreateNoCookieClient();
        var response = await client.PostAsJsonAsync("/api/v1/ai/letters/generate", new GenerateLetterRequestDto
        {
            Topic = "Viết thư cho bạn hỏi thăm sức khỏe",
            RecipientType = "friend",
            HskLevel = 2,
            Tone = "polite",
            Length = "medium"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task LetterWriting_Generate_WithStudentJwt_Returns200StructuredResponse()
    {
        using var customFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IAIProvider>();
                services.AddSingleton<IAIProvider>(new LetterStubAIProvider());
            });
        });

        var client = customFactory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = false
        });

        var token = await LoginAsStudentAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsJsonAsync("/api/v1/ai/letters/generate", new GenerateLetterRequestDto
        {
            Topic = "Thư mời bạn sinh nhật",
            RecipientType = "friend",
            HskLevel = 2,
            Tone = "polite",
            Length = "medium",
            UserDraftText = "你好吗？我想请你来。"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<GeneratedLetterResponseDto>(_jsonOptions);
        Assert.NotNull(body);
        Assert.Contains("小李", body!.SalutationZh);
        Assert.NotEmpty(body.BodyZh);
        Assert.NotEmpty(body.KeyVocabulary);
        Assert.NotEmpty(body.KeyPatterns);
        Assert.NotEmpty(body.UserDraftCorrections);
    }

    [Fact]
    public async Task Governance_Get_WithoutJwt_Returns401()
    {
        var client = _factory.CreateNoCookieClient();
        var response = await client.GetAsync("/api/v1/admin/ai-governance");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Governance_Get_WithStudentJwt_Returns403Forbidden()
    {
        var client = _factory.CreateNoCookieClient();
        var token = await LoginAsStudentAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/v1/admin/ai-governance");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Governance_Get_WithAdminJwt_Returns200WithAllConfiguredFeatures()
    {
        var client = _factory.CreateNoCookieClient();
        var token = await LoginAsAdminAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/v1/admin/ai-governance");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<List<AiFeatureGovernanceDto>>(_jsonOptions);
        Assert.NotNull(body);
        Assert.Contains(body!, f => f.FeatureGroup == "AI_LETTER_WRITING");
        Assert.Contains(body!, f => f.FeatureGroup == "AI_TUTOR");
        Assert.Contains(body!, f => f.FeatureGroup == "AI_CONVERSATION");
    }

    [Fact]
    public async Task Governance_CircuitBreaker_DisablesFeatureAndBlocksUsageWith503()
    {
        using var customFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IAIProvider>();
                services.AddSingleton<IAIProvider>(new LetterStubAIProvider());
            });
        });

        var adminClient = customFactory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions { HandleCookies = false });
        var adminToken = await LoginAsAdminAsync(adminClient);
        adminClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var studentClient = customFactory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions { HandleCookies = false });
        var studentToken = await LoginAsStudentAsync(studentClient);
        studentClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);

        try
        {
            // Disable AI_LETTER_WRITING
            var updateRes = await adminClient.PutAsJsonAsync("/api/v1/admin/ai-governance/AI_LETTER_WRITING", new UpdateAiFeatureGovernanceDto
            {
                IsEnabled = false,
                DailyTokenQuota = 300000,
                MonthlyTokenQuota = 9000000,
                UserDailyRequestLimit = 20,
                MaxTokensPerRequest = 2048
            });
            Assert.Equal(HttpStatusCode.OK, updateRes.StatusCode);

            // Student calling generate should get 503 ServiceUnavailable
            var blockedRes = await studentClient.PostAsJsonAsync("/api/v1/ai/letters/generate", new GenerateLetterRequestDto
            {
                Topic = "Thử nghiệm circuit breaker",
                RecipientType = "friend",
                HskLevel = 2
            });
            Assert.Equal(HttpStatusCode.ServiceUnavailable, blockedRes.StatusCode);
        }
        finally
        {
            // Re-enable to leave DB clean
            await adminClient.PutAsJsonAsync("/api/v1/admin/ai-governance/AI_LETTER_WRITING", new UpdateAiFeatureGovernanceDto
            {
                IsEnabled = true,
                DailyTokenQuota = 300000,
                MonthlyTokenQuota = 9000000,
                UserDailyRequestLimit = 20,
                MaxTokensPerRequest = 2048
            });
        }
    }

    private sealed class LetterStubAIProvider : IAIProvider
    {
        public Task<AIProviderResponse> GenerateContentAsync(AIProviderRequest request, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new AIProviderResponse
            {
                Model = "test-ai-provider",
                RawText = """
                {
                  "titleZh": "生日邀请信",
                  "salutationZh": "亲爱的小李：",
                  "bodyZh": "你好！下周是我的生日，我想邀请你来我家做客。",
                  "closingZh": "祝好！",
                  "signOffZh": "你的好友",
                  "fullLetterZh": "亲爱的小李：\n\n你好！下周是我的生日，我想邀请你来我家做客。\n\n祝好！\n你的好友",
                  "fullLetterPinyin": "Qīn'ài de Xiǎo Lǐ...",
                  "fullLetterVi": "Tiểu Lý thân mến...",
                  "keyVocabulary": [
                    { "wordZh": "邀请", "pinyin": "yāoqǐng", "meaningVi": "mời", "usageNoteVi": "dùng khi mời ai đó" }
                  ],
                  "keyPatterns": [
                    { "patternZh": "想 + V", "pinyin": "xiǎng + V", "meaningVi": "muốn làm gì", "exampleSentence": "我想邀请你。" }
                  ],
                  "userDraftCorrections": [
                    { "originalText": "你好吗", "correctedText": "你好！", "reasonVi": "Lời chào tự nhiên hơn" }
                  ],
                  "pedagogicalAdviceVi": "Nên dùng lời chào ấm áp với bạn bè.",
                  "estimatedHskLevel": 2
                }
                """
            });
        }
    }
}
