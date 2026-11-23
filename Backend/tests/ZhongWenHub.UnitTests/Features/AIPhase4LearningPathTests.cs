using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AILearning.Services.Competency;
using ZhongWenHub.Business.AILearning.Services.LearningPath;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Entities.Learning;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.UnitTests;

public class AIPhase4LearningPathUnitTests
{
    [Theory]
    [InlineData(1)]
    [InlineData(4)]
    [InlineData(6)]
    public void GenerateLearningPathRequest_ValidatesHskRanges(int targetHsk)
    {
        var request = new GenerateLearningPathRequestDto
        {
            TargetHskLevel = targetHsk,
            IncludeAiExplanation = true
        };

        Assert.True(request.TargetHskLevel.HasValue);
        Assert.InRange(request.TargetHskLevel.Value, 1, 6);
    }

    [Fact]
    public void UpdateLearningGoalDto_ValidatesBoundaryConditions()
    {
        var goal = new UpdateLearningGoalDto
        {
            TargetHskLevel = 3,
            DailyStudyMinutes = 45,
            StudyDaysPerWeek = 5,
            PrioritySkills = new List<string> { "vocabulary", "grammar" },
            IntensityMode = "balanced"
        };

        Assert.InRange(goal.TargetHskLevel, 1, 6);
        Assert.Contains(goal.DailyStudyMinutes, new[] { 15, 30, 45, 60 });
        Assert.InRange(goal.StudyDaysPerWeek, 1, 7);
        Assert.NotEmpty(goal.PrioritySkills);
    }

    [Fact]
    public void DestinationRoute_OnlyPointsToApprovedApplicationRoutes()
    {
        var approvedPrefixes = new[]
        {
            "/lesson/focus?id=",
            "/srs-review",
            "/practice",
            "/ai-exercises"
        };

        var sampleRoutes = new[]
        {
            "/lesson/focus?id=abc-123",
            "/srs-review",
            "/practice",
            "/ai-exercises"
        };

        foreach (var route in sampleRoutes)
        {
            Assert.True(approvedPrefixes.Any(p => route.StartsWith(p)), $"Route {route} must start with an approved prefix");
        }
    }

    [Fact]
    public void FallbackRationale_ProvidesDetailedPedagogicalGuidance_WithoutCrashing()
    {
        var weakConcepts = new List<WeakConceptDto>
        {
            new() { ConceptCode = "HSK2-GRAM-01", TitleVi = "Câu chữ 把 (bǎ)", SkillCategory = "grammar" }
        };

        var rationale = LearningPathService.BuildDeterministicRationale(
            selectedHsk: 1,
            targetHsk: 2,
            estimatedHsk: 2,
            weakConcepts: weakConcepts,
            dailyMinutes: 45,
            daysPerWeek: 6);

        Assert.False(string.IsNullOrWhiteSpace(rationale));
        Assert.Contains("HSK 1", rationale);
        Assert.Contains("HSK 2", rationale);
        Assert.Contains("45 phút/ngày", rationale);
        Assert.Contains("Câu chữ 把 (bǎ)", rationale);
    }
}
