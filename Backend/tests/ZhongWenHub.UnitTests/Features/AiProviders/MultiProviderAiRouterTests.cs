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

    [Fact]
    public async Task Router_WithReservationId_DoesNotInsertDuplicateUsageLog()
    {
        using var db = CreateInMemoryDbContext();
        var protector = CreateProtector();

        var adapter = new TestFakeAiProviderAdapter
        {
            ProviderType = "GEMINI",
            OnGenerate = (_, _, _) => Task.FromResult(new AiAdapterResponse { Text = "Reservation test response", Model = "gemini-1.5-flash" })
        };

        db.AiProviderConfigurations.Add(new AiProviderConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Gemini Main",
            ProviderType = "GEMINI",
            DefaultModel = "gemini-1.5-flash",
            EncryptedApiKey = protector.Encrypt("key-1"),
            CapabilitiesJson = "[\"chat\"]",
            IsEnabled = true,
            Priority = 1
        });
        await db.SaveChangesAsync();

        var router = new MultiProviderAiRouter(db, new IAiProviderAdapter[] { adapter }, protector, NullLogger<MultiProviderAiRouter>.Instance);

        var reservationId = Guid.NewGuid();
        var options = new AiGenerationOptions
        {
            ReservationId = reservationId
        };

        var result = await router.GenerateAsync("chat", "Test prompt", options: options, feature: "AI_TUTOR");
        Assert.True(result.IsSuccess);

        // When ReservationId is passed, router must NOT insert an AiUsageLog (caller settles it)
        var logs = await db.AiUsageLogs.ToListAsync();
        Assert.Empty(logs);
    }

    [Fact]
    public async Task ConfigurableAIProvider_WhenRouterUnavailable_ThrowsProviderUnavailable_WithoutFallingBackToGemini()
    {
        using var db = CreateInMemoryDbContext();
        var protector = CreateProtector();

        // Router with no enabled providers -> will throw AiRouterUnavailableException
        var router = new MultiProviderAiRouter(db, Array.Empty<IAiProviderAdapter>(), protector, NullLogger<MultiProviderAiRouter>.Instance);

        var geminiProvider = new ZhongWenHub.Business.AITutor.GeminiProvider(
            new HttpClient(),
            Microsoft.Extensions.Options.Options.Create(new ZhongWenHub.Business.AITutor.GeminiOptions { ApiKey = "fake" }),
            NullLogger<ZhongWenHub.Business.AITutor.GeminiProvider>.Instance);

        var configurableProvider = new ZhongWenHub.Business.AITutor.ConfigurableAIProvider(
            geminiProvider,
            Microsoft.Extensions.Options.Options.Create(new ZhongWenHub.Business.AITutor.GeminiOptions()),
            router);

        var ex = await Assert.ThrowsAsync<ZhongWenHub.Business.AITutor.AITutorException>(() =>
            configurableProvider.GenerateContentAsync(new ZhongWenHub.Business.AITutor.AIProviderRequest
            {
                UserPrompt = "Hello",
                Feature = "AI_TUTOR"
            }));

        Assert.Equal(503, ex.StatusCode);
        Assert.Contains("unavailable", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData("http://127.0.0.1:8080/v1")]
    [InlineData("http://localhost:11434/v1")]
    [InlineData("http://169.254.169.254/latest/meta-data")]
    [InlineData("http://metadata.google.internal/computeMetadata/v1")]
    [InlineData("http://10.0.0.1:8000/v1")]
    [InlineData("http://172.20.0.1:8000/v1")]
    [InlineData("http://192.168.1.1:8000/v1")]
    [InlineData("http://100.64.0.1:8000/v1")] // CG-NAT
    [InlineData("http://[::1]:8000/v1")]      // IPv6 Loopback
    [InlineData("http://[fc00::1]:8000/v1")]  // IPv6 ULA
    [InlineData("http://[fe80::1]:8000/v1")]  // IPv6 Link-Local
    [InlineData("ftp://api.openai.com/v1")]   // Invalid scheme
    public void SsrfProtection_ValidateBaseUrl_BlocksDangerousUrls(string url)
    {
        Assert.Throws<ArgumentException>(() => SsrfProtection.ValidateBaseUrl(url));
    }

    [Theory]
    [InlineData("https://api.openai.com/v1")]
    [InlineData("https://generativelanguage.googleapis.com")]
    [InlineData("https://api.deepseek.com")]
    [InlineData("https://api.groq.com/openai/v1")]
    public void SsrfProtection_ValidateBaseUrl_AllowsPublicUrls(string url)
    {
        // Should not throw
        SsrfProtection.ValidateBaseUrl(url);
    }

    [Fact]
    public void SsrfProtection_IsPrivateOrBlockedIp_IdentifiesAllRestrictedRanges()
    {
        // Loopback
        Assert.True(SsrfProtection.IsPrivateOrBlockedIp(IPAddress.Loopback));
        Assert.True(SsrfProtection.IsPrivateOrBlockedIp(IPAddress.IPv6Loopback));

        // RFC 1918 Private
        Assert.True(SsrfProtection.IsPrivateOrBlockedIp(IPAddress.Parse("10.1.2.3")));
        Assert.True(SsrfProtection.IsPrivateOrBlockedIp(IPAddress.Parse("172.16.0.1")));
        Assert.True(SsrfProtection.IsPrivateOrBlockedIp(IPAddress.Parse("172.31.255.254")));
        Assert.True(SsrfProtection.IsPrivateOrBlockedIp(IPAddress.Parse("192.168.0.1")));

        // Link-Local / Metadata
        Assert.True(SsrfProtection.IsPrivateOrBlockedIp(IPAddress.Parse("169.254.169.254")));

        // CG-NAT (100.64.0.0/10)
        Assert.True(SsrfProtection.IsPrivateOrBlockedIp(IPAddress.Parse("100.64.0.1")));
        Assert.True(SsrfProtection.IsPrivateOrBlockedIp(IPAddress.Parse("100.127.255.254")));

        // 0.0.0.0 and Multicast/Reserved
        Assert.True(SsrfProtection.IsPrivateOrBlockedIp(IPAddress.Parse("0.0.0.0")));
        Assert.True(SsrfProtection.IsPrivateOrBlockedIp(IPAddress.Parse("224.0.0.1")));
        Assert.True(SsrfProtection.IsPrivateOrBlockedIp(IPAddress.Parse("240.0.0.1")));

        // IPv6 ULA & Link-Local
        Assert.True(SsrfProtection.IsPrivateOrBlockedIp(IPAddress.Parse("fc00::1")));
        Assert.True(SsrfProtection.IsPrivateOrBlockedIp(IPAddress.Parse("fd12:3456:789a::1")));
        Assert.True(SsrfProtection.IsPrivateOrBlockedIp(IPAddress.Parse("fe80::1")));

        // IPv4-mapped IPv6
        Assert.True(SsrfProtection.IsPrivateOrBlockedIp(IPAddress.Parse("::ffff:127.0.0.1")));
        Assert.True(SsrfProtection.IsPrivateOrBlockedIp(IPAddress.Parse("::ffff:169.254.169.254")));

        // Public IPs should return false
        Assert.False(SsrfProtection.IsPrivateOrBlockedIp(IPAddress.Parse("8.8.8.8")));
        Assert.False(SsrfProtection.IsPrivateOrBlockedIp(IPAddress.Parse("1.1.1.1")));
        Assert.False(SsrfProtection.IsPrivateOrBlockedIp(IPAddress.Parse("2607:f8b0:4005:805::200e"))); // Google IPv6
    }
}
