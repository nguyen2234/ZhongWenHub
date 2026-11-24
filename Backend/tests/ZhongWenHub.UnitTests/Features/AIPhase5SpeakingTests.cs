using System;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ZhongWenHub.Api.Controllers;
using ZhongWenHub.Data.Entities.AI;
using ZhongWenHub.Data.Persistence;
using ZhongWenHub.Business.AILearning.Services.Speech;

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
}
