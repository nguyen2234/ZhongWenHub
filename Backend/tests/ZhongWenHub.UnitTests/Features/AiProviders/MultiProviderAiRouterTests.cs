using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using ZhongWenHub.Common.AI;
using ZhongWenHub.Data;
using ZhongWenHub.Data.Persistence;
using ZhongWenHub.Data.Entities.AI;
using ZhongWenHub.Features.admin.AiProviders;
using ZhongWenHub.Features.admin.AiProviders.DTO;

namespace ZhongWenHub.Tests.Features.AiProviders;

public class TestFakeAiProviderAdapter : IAiProviderAdapter
{
    public string ProviderType { get; set; } = "GEMINI";
    public Func<AiProviderConfiguration, string, string, Task<AiAdapterResponse>>? OnGenerate { get; set; }
    public int CallCount { get; private set; }
    public AiGenerationOptions? LastOptions { get; private set; }

    public Task<AiAdapterResponse> GenerateTextAsync(
        AiProviderConfiguration config,
        string apiKey,
        string prompt,
        AiGenerationOptions? options = null,
        CancellationToken ct = default)
    {
        CallCount++;
        LastOptions = options;
        if (OnGenerate != null)
        {
            return OnGenerate(config, apiKey, prompt);
        }
        return Task.FromResult(new AiAdapterResponse { Text = "Default Fake Response", Model = config.DefaultModel });
    }

    public Task<AiHealthCheckResult> TestConnectionAsync(
        AiProviderConfiguration config,
        string apiKey,
        CancellationToken ct = default)
    {
        return Task.FromResult(new AiHealthCheckResult { IsSuccess = true, StatusCode = 200, Message = "OK" });
    }
}

public class MultiProviderAiRouterTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private IAiProviderSecretProtector CreateProtector()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["AiSecurity:EncryptionKey"] = "Unit_Test_Encryption_Key_32_Chars_Length!"
            })
            .Build();
        return new DataProtectionAiProviderSecretProtector(config);
    }

    [Fact]
    public void SecretProtector_Encrypt_Decrypt_Mask_WorksCorrectly()
    {
        var protector = CreateProtector();
        var rawKey = "sk-test-secret-api-key-12345678";

        var encrypted = protector.Encrypt(rawKey);
        Assert.NotEmpty(encrypted);
        Assert.NotEqual(rawKey, encrypted);

        var decrypted = protector.Decrypt(encrypted);
        Assert.Equal(rawKey, decrypted);

        var masked = protector.Mask(rawKey);
        Assert.EndsWith("5678", masked);
        Assert.Contains("****", masked);
    }

    [Fact]
    public async Task Router_SelectsHigherPriorityProvider_First()
    {
        using var db = CreateInMemoryDbContext();
        var protector = CreateProtector();

        var p1 = new AiProviderConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Primary Gemini",
            ProviderType = "GEMINI",
            DefaultModel = "gemini-1.5-flash",
            EncryptedApiKey = protector.Encrypt("gemini-key"),
            IsEnabled = true,
            Priority = 1,
            CapabilitiesJson = "[\"chat\"]"
        };
        var p2 = new AiProviderConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Secondary OpenAI",
            ProviderType = "OPENAI",
            DefaultModel = "gpt-4o-mini",
            EncryptedApiKey = protector.Encrypt("openai-key"),
            IsEnabled = true,
            Priority = 2,
            CapabilitiesJson = "[\"chat\"]"
        };
        db.AiProviderConfigurations.AddRange(p1, p2);
        await db.SaveChangesAsync();

        var fakeGemini = new TestFakeAiProviderAdapter
        {
            ProviderType = "GEMINI",
            OnGenerate = (cfg, key, prompt) => Task.FromResult(new AiAdapterResponse { Text = "Gemini answer", Model = "gemini-1.5-flash" })
        };

        var fakeOpenAi = new TestFakeAiProviderAdapter
        {
            ProviderType = "OPENAI",
            OnGenerate = (cfg, key, prompt) => Task.FromResult(new AiAdapterResponse { Text = "OpenAI answer", Model = "gpt-4o-mini" })
        };

        var router = new MultiProviderAiRouter(db, new[] { fakeGemini, fakeOpenAi }, protector, NullLogger<MultiProviderAiRouter>.Instance);

        var result = await router.GenerateAsync("chat", "hello");

        Assert.True(result.IsSuccess);
        Assert.Equal("Gemini answer", result.Text);
        Assert.Equal("Primary Gemini", result.ProviderName);
        Assert.Equal(1, fakeGemini.CallCount);
        Assert.Equal(0, fakeOpenAi.CallCount);
    }

    [Fact]
    public async Task Router_FailsOver_WhenPrimaryProviderFails()
    {
        using var db = CreateInMemoryDbContext();
        var protector = CreateProtector();

        var p1 = new AiProviderConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Primary Gemini",
            ProviderType = "GEMINI",
            DefaultModel = "gemini-1.5-flash",
            EncryptedApiKey = protector.Encrypt("gemini-key"),
            IsEnabled = true,
            Priority = 1,
            CapabilitiesJson = "[\"chat\"]"
        };
        var p2 = new AiProviderConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Secondary OpenAI",
            ProviderType = "OPENAI",
            DefaultModel = "gpt-4o-mini",
            EncryptedApiKey = protector.Encrypt("openai-key"),
            IsEnabled = true,
            Priority = 2,
            CapabilitiesJson = "[\"chat\"]"
        };
        db.AiProviderConfigurations.AddRange(p1, p2);
        await db.SaveChangesAsync();

        var fakeGemini = new TestFakeAiProviderAdapter
        {
            ProviderType = "GEMINI",
            OnGenerate = (cfg, key, prompt) => throw new HttpRequestException("Rate limit", null, HttpStatusCode.TooManyRequests)
        };

        var fakeOpenAi = new TestFakeAiProviderAdapter
        {
            ProviderType = "OPENAI",
            OnGenerate = (cfg, key, prompt) => Task.FromResult(new AiAdapterResponse { Text = "OpenAI fallback answer", Model = "gpt-4o-mini" })
        };

        var router = new MultiProviderAiRouter(db, new[] { fakeGemini, fakeOpenAi }, protector, NullLogger<MultiProviderAiRouter>.Instance);

        var result = await router.GenerateAsync("chat", "hello");

        Assert.True(result.IsSuccess);
        Assert.Equal("OpenAI fallback answer", result.Text);
        Assert.Equal("Secondary OpenAI", result.ProviderName);
        Assert.Equal(1, fakeGemini.CallCount);
        Assert.Equal(1, fakeOpenAi.CallCount);
    }

    [Fact]
    public async Task Router_ThrowsSanitized503_WhenAllProvidersFail()
    {
        using var db = CreateInMemoryDbContext();
        var protector = CreateProtector();

        var p1 = new AiProviderConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Primary Gemini",
            ProviderType = "GEMINI",
            DefaultModel = "gemini-1.5-flash",
            EncryptedApiKey = protector.Encrypt("gemini-key"),
            IsEnabled = true,
            Priority = 1,
            CapabilitiesJson = "[\"chat\"]"
        };
        db.AiProviderConfigurations.Add(p1);
        await db.SaveChangesAsync();

        var fakeGemini = new TestFakeAiProviderAdapter
        {
            ProviderType = "GEMINI",
            OnGenerate = (cfg, key, prompt) => throw new HttpRequestException("Server Down", null, HttpStatusCode.ServiceUnavailable)
        };

        var router = new MultiProviderAiRouter(db, new[] { fakeGemini }, protector, NullLogger<MultiProviderAiRouter>.Instance);

        var ex = await Assert.ThrowsAsync<AiRouterUnavailableException>(() => router.GenerateAsync("chat", "hello"));
        Assert.Contains("All AI providers are currently unavailable", ex.Message);
        Assert.DoesNotContain("gemini-key", ex.Message);
    }

    [Fact]
    public async Task GenerateAsync_WhenNoActiveProvidersConfigured_ThrowsAiRouterUnavailableExceptionWithoutMockFallback()
    {
        using var db = CreateInMemoryDbContext();
        var protector = CreateProtector();
        var router = new MultiProviderAiRouter(db, Array.Empty<IAiProviderAdapter>(), protector, NullLogger<MultiProviderAiRouter>.Instance);

        var ex = await Assert.ThrowsAsync<AiRouterUnavailableException>(() => router.GenerateAsync("chat", "Test prompt"));
        Assert.Contains("All AI providers are currently unavailable", ex.Message);
        Assert.False(string.IsNullOrWhiteSpace(ex.Message));
    }

    [Fact]
    public async Task ManagementService_CRUD_And_Priorities_Work()
    {
        using var db = CreateInMemoryDbContext();
        var protector = CreateProtector();
        var service = new AiProviderManagementService(db, Array.Empty<IAiProviderAdapter>(), protector, NullLogger<AiProviderManagementService>.Instance);

        // Create
        var createReq = new CreateAiProviderRequest
        {
            Name = "Test Gemini",
            ProviderType = "GEMINI",
            ApiKey = "raw-secret-api-key-9999",
            DefaultModel = "gemini-1.5-flash",
            Priority = 1
        };
        var created = await service.CreateAsync(createReq);
        Assert.NotNull(created);
        Assert.Equal("Test Gemini", created.Name);
        Assert.EndsWith("9999", created.MaskedApiKey);
        Assert.DoesNotContain("raw-secret", created.MaskedApiKey);

        // Read
        var all = await service.GetAllAsync();
        Assert.Single(all);

        // Toggle
        var toggled = await service.ToggleEnabledAsync(created.Id, false);
        Assert.True(toggled);
        var disabled = await service.GetByIdAsync(created.Id);
        Assert.False(disabled!.IsEnabled);

        // Update Priorities
        await service.UpdatePrioritiesAsync(new UpdateProviderPrioritiesRequest
        {
            Priorities = new List<UpdateProviderPriorityItem>
            {
                new() { Id = created.Id, Priority = 5 }
            }
        });
        var updated = await service.GetByIdAsync(created.Id);
        Assert.Equal(5, updated!.Priority);

        // Delete
        var deleted = await service.DeleteAsync(created.Id);
        Assert.True(deleted);
        Assert.Empty(await service.GetAllAsync());
    }

    [Fact]
    public async Task Router_PassesMultiTurnHistoryAndFeatureTag_ToAdapterAndLogs()
    {
        using var db = CreateInMemoryDbContext();
        var protector = CreateProtector();
        var adapter = new TestFakeAiProviderAdapter();

        db.AiProviderConfigurations.Add(new AiProviderConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "MultiTurn Gemini",
            ProviderType = "GEMINI",
            DefaultModel = "gemini-1.5-flash",
            EncryptedApiKey = protector.Encrypt("gemini-test-key"),
            IsEnabled = true,
            Priority = 1
        });
        await db.SaveChangesAsync();

        var router = new MultiProviderAiRouter(db, new[] { adapter }, protector, NullLogger<MultiProviderAiRouter>.Instance);

        var historyTurns = new List<ZhongWenHub.Business.AITutor.AIProviderTurn>
        {
            new() { Role = "user", Content = "Xin chào" },
            new() { Role = "model", Content = "你好！很高兴认识你。" }
        };

        var options = new AiGenerationOptions
        {
            SystemInstruction = "Bạn là trợ lý tiếng Trung",
            History = historyTurns
        };

        var result = await router.GenerateAsync(
            capability: "chat",
            prompt: "Hôm nay thời tiết thế nào?",
            options: options,
            userId: Guid.NewGuid(),
            feature: "AI_CONVERSATION");

        Assert.True(result.IsSuccess);
        Assert.NotNull(adapter.LastOptions);
        Assert.NotNull(adapter.LastOptions!.History);
        Assert.Equal(2, adapter.LastOptions.History!.Count);
        Assert.Equal("Bạn là trợ lý tiếng Trung", adapter.LastOptions.SystemInstruction);

        var log = await db.AiUsageLogs.FirstOrDefaultAsync();
        Assert.NotNull(log);
        Assert.Equal("AI_CONVERSATION", log.Feature);
        Assert.True(log.Success);
    }

    [Theory]
    [InlineData("http://localhost:8000")]
    [InlineData("http://127.0.0.1:11434")]
    [InlineData("http://169.254.169.254/latest/meta-data")]
    [InlineData("http://metadata.google.internal/computeMetadata/v1/")]
    [InlineData("http://10.0.0.1/api")]
    [InlineData("http://172.20.0.1/api")]
    [InlineData("http://192.168.1.100:8080")]
    [InlineData("ftp://api.example.com")]
    [InlineData("file:///etc/passwd")]
    public void ValidateBaseUrl_RejectsSsrfTargets(string maliciousUrl)
    {
        var ex = Assert.Throws<ArgumentException>(() =>
            AiProviderManagementService.ValidateBaseUrl(maliciousUrl));
        Assert.NotEmpty(ex.Message);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("https://api.deepseek.com")]
    [InlineData("https://api.openai.com/v1")]
    [InlineData("https://generativelanguage.googleapis.com")]
    public void ValidateBaseUrl_AllowsLegitimatePublicEndpoints(string? validUrl)
    {
        AiProviderManagementService.ValidateBaseUrl(validUrl);
    }

    [Fact]
    public async Task Router_RoutesToFeatureSpecificProvider_WhenAvailable()
    {
        using var db = CreateInMemoryDbContext();
        var protector = CreateProtector();

        var letterAdapter = new TestFakeAiProviderAdapter
        {
            ProviderType = "GEMINI",
            OnGenerate = (config, key, prompt) => Task.FromResult(new AiAdapterResponse { Text = "Letter AI response", Model = config.DefaultModel })
        };
        var tutorAdapter = new TestFakeAiProviderAdapter
        {
            ProviderType = "OPENAI",
            OnGenerate = (config, key, prompt) => Task.FromResult(new AiAdapterResponse { Text = "Tutor AI response", Model = config.DefaultModel })
        };

        db.AiProviderConfigurations.Add(new AiProviderConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Tutor Dedicated Provider",
            ProviderType = "OPENAI",
            DefaultModel = "gpt-4o-mini",
            EncryptedApiKey = protector.Encrypt("key-1"),
            CapabilitiesJson = "[\"chat\", \"feature:AI_TUTOR\"]",
            IsEnabled = true,
            Priority = 1
        });

        db.AiProviderConfigurations.Add(new AiProviderConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Letter Dedicated Provider",
            ProviderType = "GEMINI",
            DefaultModel = "gemini-1.5-flash",
            EncryptedApiKey = protector.Encrypt("key-2"),
            CapabilitiesJson = "[\"chat\", \"feature:AI_LETTER_WRITING\"]",
            IsEnabled = true,
            Priority = 2
        });
        await db.SaveChangesAsync();

        var router = new MultiProviderAiRouter(db, new IAiProviderAdapter[] { letterAdapter, tutorAdapter }, protector, NullLogger<MultiProviderAiRouter>.Instance);

        // Request for AI_LETTER_WRITING should route to Letter Dedicated Provider (GEMINI)
        var letterRes = await router.GenerateAsync("chat", "Viết một bức thư", feature: "AI_LETTER_WRITING");
        Assert.True(letterRes.IsSuccess);
        Assert.Equal("Letter Dedicated Provider", letterRes.ProviderName);
        Assert.Equal("Letter AI response", letterRes.Text);
        Assert.Equal(1, letterAdapter.CallCount);
        Assert.Equal(0, tutorAdapter.CallCount);

        // Request for AI_TUTOR should route to Tutor Dedicated Provider (OPENAI)
        var tutorRes = await router.GenerateAsync("chat", "Giải thích từ 你好", feature: "AI_TUTOR");
        Assert.True(tutorRes.IsSuccess);
        Assert.Equal("Tutor Dedicated Provider", tutorRes.ProviderName);
        Assert.Equal("Tutor AI response", tutorRes.Text);
        Assert.Equal(1, tutorAdapter.CallCount);
    }
}
