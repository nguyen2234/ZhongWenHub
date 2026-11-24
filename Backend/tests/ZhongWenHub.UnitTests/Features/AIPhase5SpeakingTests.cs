using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ZhongWenHub.Common.Api;
using ZhongWenHub.Models.AI;
using ZhongWenHub.Data.Persistence;
using ZhongWenHub.Features.AI;
using ZhongWenHub.Features.AI.Services.Speech;

namespace ZhongWenHub.UnitTests.Features;

public class SkillRetirementAcceptanceTests
{
    [Fact]
    public void AILearningEngineController_DoesNotExposeRetiredSpeakingEndpoints()
    {
        var controllerType = typeof(AILearningEngineController);
        var methods = controllerType.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly);

        var endpointAttributes = methods
            .SelectMany(m => m.GetCustomAttributes())
            .OfType<HttpMethodAttribute>()
            .Select(attr => attr.Template ?? string.Empty)
            .ToList();

        Assert.DoesNotContain(endpointAttributes, t => t.Contains("speaking/items"));
        Assert.DoesNotContain(endpointAttributes, t => t.Contains("speaking/submit"));
        Assert.DoesNotContain(endpointAttributes, t => t.Contains("speaking/submit-json"));
        Assert.DoesNotContain(endpointAttributes, t => t.Contains("speaking/history"));
        Assert.DoesNotContain(endpointAttributes, t => t.Contains("speaking/stats"));
    }

    [Fact]
    public void SpeechRecognitionService_RemainsAvailableForAITutorVoiceChat()
    {
        var sttInterfaceType = typeof(ISpeechRecognitionService);
        var implType = typeof(GeminiSpeechRecognitionService);

        Assert.True(sttInterfaceType.IsAssignableFrom(implType));
        var method = sttInterfaceType.GetMethod("RecognizeSpeechAsync");
        Assert.NotNull(method);
    }

    [Fact]
    public void HistoricalAiSpeakingAttemptModel_PreservedInDbContextWithoutDestructiveDrop()
    {
        var dbContextType = typeof(ApplicationDbContext);
        var property = dbContextType.GetProperty("AiSpeakingAttempts");
        Assert.NotNull(property);
        Assert.Equal(typeof(DbSet<AiSpeakingAttempt>), property.PropertyType);
    }

    [Fact]
    public async Task GeminiSpeechRecognitionService_WhenEmptyAudioStream_ReturnsEmptyAudioResult()
    {
        var options = Microsoft.Extensions.Options.Options.Create(new GeminiOptions());
        var service = new GeminiSpeechRecognitionService(
            new HttpClient(),
            options,
            Microsoft.Extensions.Logging.Abstractions.NullLogger<GeminiSpeechRecognitionService>.Instance);

        using var emptyStream = new MemoryStream();
        var result = await service.RecognizeSpeechAsync(emptyStream, "audio/webm");

        Assert.False(result.IsSuccess);
        Assert.Equal("EMPTY_AUDIO", result.ErrorCode);
    }

    [Fact]
    public async Task GeminiSpeechRecognitionService_WhenApiKeyMissing_ReturnsSttUnavailableResult()
    {
        var options = Microsoft.Extensions.Options.Options.Create(new GeminiOptions { ApiKey = "" });
        var service = new GeminiSpeechRecognitionService(
            new HttpClient(),
            options,
            Microsoft.Extensions.Logging.Abstractions.NullLogger<GeminiSpeechRecognitionService>.Instance);

        using var stream = new MemoryStream(new byte[] { 1, 2, 3, 4 });
        var result = await service.RecognizeSpeechAsync(stream, "audio/webm");

        Assert.False(result.IsSuccess);
        Assert.Equal("STT_UNAVAILABLE", result.ErrorCode);
    }
}
