using System;
using System.Collections.Generic;

namespace ZhongWenHub.Features.AI.Services.Competency;

/// <summary>
/// Deterministic Bayesian Knowledge Tracing (BKT) engine for language mastery inference.
/// Strictly non-LLM, mathematical, reproducible, and verifiable.
/// </summary>
public static class BktAlgorithm
{
    /// <summary>
    /// Computes the posterior probability P(L_{t-1} | Observation) given correctness of the response.
    /// </summary>
    public static double ComputePosterior(double prior, bool isCorrect, BktParameters parameters)
    {
        var pL = Math.Clamp(prior, 0.001, 0.999);
        var pG = Math.Clamp(parameters.GuessRate, 0.01, 0.90);
        var pS = Math.Clamp(parameters.SlipRate, 0.01, 0.90);

        if (isCorrect)
        {
            var numerator = pL * (1.0 - pS);
            var denominator = numerator + ((1.0 - pL) * pG);
            return denominator <= 0 ? pL : Math.Clamp(numerator / denominator, 0.001, 0.999);
        }
        else
        {
            var numerator = pL * pS;
            var denominator = numerator + ((1.0 - pL) * (1.0 - pG));
            return denominator <= 0 ? pL : Math.Clamp(numerator / denominator, 0.001, 0.999);
        }
    }

    /// <summary>
    /// Updates the mastery probability incorporating both posterior evidence and the transition/learning rate.
    /// P(L_t) = P(L_{t-1} | Obs) + (1 - P(L_{t-1} | Obs)) * P(T)
    /// </summary>
    public static double UpdateMastery(double currentBelief, bool isCorrect, BktParameters? parameters = null)
    {
        var p = parameters ?? BktParameters.Default;
        var posterior = ComputePosterior(currentBelief, isCorrect, p);
        var updated = posterior + ((1.0 - posterior) * p.TransitionRate);
        return Math.Clamp(updated, 0.01, 0.99);
    }

    /// <summary>
    /// Replays a sequential stream of boolean attempts (chronological order) to arrive at the current mastery probability.
    /// </summary>
    public static double ComputeSequence(IEnumerable<bool> observations, BktParameters? parameters = null)
    {
        var p = parameters ?? BktParameters.Default;
        var belief = p.PriorKnowledge;

        foreach (var obs in observations)
        {
            belief = UpdateMastery(belief, obs, p);
        }

        return Math.Round(belief, 4);
    }

    /// <summary>
    /// Computes statistical confidence in [0.0, 1.0] as an asymptotic function of observation count.
    /// Confidence = 1 - e^(-N / HalfCount)
    /// </summary>
    public static double ComputeConfidence(int observationCount, double confidenceHalfCount = 8.0)
    {
        if (observationCount <= 0) return 0.0;
        var half = Math.Max(1.0, confidenceHalfCount);
        var conf = 1.0 - Math.Exp(-observationCount / half);
        return Math.Round(Math.Clamp(conf, 0.0, 1.0), 3);
    }

    /// <summary>
    /// Maps continuous mastery probability and sample confidence to a standardized pedagocical tier.
    /// </summary>
    public static string ResolveMasteryTier(double probability, int observationCount, double confidence)
    {
        if (observationCount == 0 || confidence < 0.15)
        {
            return "NOT_ASSESSED";
        }

        if (probability >= 0.85 && confidence >= 0.50)
        {
            return "MASTERED";
        }

        if (probability >= 0.70)
        {
            return "COMPETENT";
        }

        if (probability >= 0.45)
        {
            return "EMERGING";
        }

        return "NOVICE";
    }
}

