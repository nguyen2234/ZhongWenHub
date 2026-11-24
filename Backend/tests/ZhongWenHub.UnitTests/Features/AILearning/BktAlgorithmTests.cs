using System;
using System.Collections.Generic;
using Xunit;
using ZhongWenHub.Features.AI.Services.Competency;

namespace ZhongWenHub.UnitTests.AILearning;

public class BktAlgorithmTests
{
    [Fact]
    public void ComputePosterior_WhenCorrect_IncreasesProbability()
    {
        var parameters = BktParameters.Default;
        var prior = 0.30;

        var posterior = BktAlgorithm.ComputePosterior(prior, isCorrect: true, parameters);

        Assert.True(posterior > prior, $"Expected posterior ({posterior}) to be greater than prior ({prior})");
        Assert.True(posterior <= 1.0);
    }

    [Fact]
    public void ComputePosterior_WhenIncorrect_DecreasesProbability()
    {
        var parameters = BktParameters.Default;
        var prior = 0.50;

        var posterior = BktAlgorithm.ComputePosterior(prior, isCorrect: false, parameters);

        Assert.True(posterior < prior, $"Expected posterior ({posterior}) to be less than prior ({prior})");
        Assert.True(posterior >= 0.0);
    }

    [Fact]
    public void UpdateMastery_IncludesTransitionRate()
    {
        var parameters = new BktParameters
        {
            PriorKnowledge = 0.30,
            TransitionRate = 0.20,
            GuessRate = 0.25,
            SlipRate = 0.10
        };

        var posterior = BktAlgorithm.ComputePosterior(0.30, true, parameters);
        var updated = BktAlgorithm.UpdateMastery(0.30, true, parameters);

        // Updated incorporates learning opportunity: P(L_t) = posterior + (1 - posterior) * P(T)
        Assert.True(updated > posterior, $"Updated ({updated}) must be greater than posterior ({posterior}) due to P(T)");
    }

    [Fact]
    public void ComputeSequence_ConsecutiveCorrect_MonotonicallyIncreases()
    {
        var observations = new List<bool> { true, true, true, true, true };
        var belief = 0.20;

        foreach (var obs in observations)
        {
            var next = BktAlgorithm.UpdateMastery(belief, obs);
            Assert.True(next > belief, $"Belief should increase from {belief} to {next}");
            belief = next;
        }

        Assert.True(belief >= 0.80, $"Expected high mastery after 5 consecutive correct answers, got {belief}");
    }

    [Fact]
    public void ComputeSequence_ConsecutiveIncorrect_DecreasesStabilizes()
    {
        var observations = new List<bool> { false, false, false, false };
        var result = BktAlgorithm.ComputeSequence(observations);

        Assert.True(result < 0.25, $"Expected low mastery after 4 incorrect answers, got {result}");
    }

    [Theory]
    [InlineData(0, 0.0)]
    [InlineData(3, 0.313)]
    [InlineData(8, 0.632)]
    [InlineData(16, 0.865)]
    [InlineData(30, 0.976)]
    public void ComputeConfidence_ApproachesUnityAsymptotically(int count, double expectedApprox)
    {
        var confidence = BktAlgorithm.ComputeConfidence(count, confidenceHalfCount: 8.0);
        Assert.InRange(confidence, expectedApprox - 0.02, expectedApprox + 0.02);
    }

    [Theory]
    [InlineData(0.90, 0, 0.0, "NOT_ASSESSED")]
    [InlineData(0.90, 2, 0.10, "NOT_ASSESSED")]
    [InlineData(0.25, 10, 0.70, "NOVICE")]
    [InlineData(0.55, 10, 0.70, "EMERGING")]
    [InlineData(0.75, 10, 0.70, "COMPETENT")]
    [InlineData(0.88, 15, 0.80, "MASTERED")]
    public void ResolveMasteryTier_ClassifiesCorrectly(double prob, int count, double conf, string expectedTier)
    {
        var tier = BktAlgorithm.ResolveMasteryTier(prob, count, conf);
        Assert.Equal(expectedTier, tier);
    }

    [Fact]
    public void ComputeSequence_OrderSensitivity_RecentSuccessShowsHigherMasteryThanRecentFailure()
    {
        // Both sequences have 3 correct and 3 incorrect (50% naive accuracy)
        var learnedSequence = new List<bool> { false, false, false, true, true, true };
        var forgottenSequence = new List<bool> { true, true, true, false, false, false };

        var learnedScore = BktAlgorithm.ComputeSequence(learnedSequence);
        var forgottenScore = BktAlgorithm.ComputeSequence(forgottenSequence);

        // BKT is time-aware: recent consecutive successes indicate current mastery,
        // whereas recent consecutive failures indicate decay/loss of mastery.
        Assert.True(learnedScore > forgottenScore,
            $"Recent success sequence ({learnedScore}) must produce higher BKT belief than recent failure sequence ({forgottenScore})");
        Assert.True(learnedScore >= 0.75, $"Expected learned score >= 0.75, got {learnedScore}");
        Assert.True(forgottenScore <= 0.35, $"Expected forgotten score <= 0.35, got {forgottenScore}");
    }

    [Fact]
    public void ComputeSequence_LowObservationCount_PreservesEpistemicUncertainty()
    {
        // Only 1 single attempt: not enough statistical evidence to assess
        var singleAttempt = new List<bool> { true };
        var score = BktAlgorithm.ComputeSequence(singleAttempt);
        var conf = BktAlgorithm.ComputeConfidence(singleAttempt.Count);
        var tier = BktAlgorithm.ResolveMasteryTier(score, singleAttempt.Count, conf);

        Assert.True(conf < 0.15, $"1 attempt must have low confidence, got {conf}");
        Assert.Equal("NOT_ASSESSED", tier);
    }
}

