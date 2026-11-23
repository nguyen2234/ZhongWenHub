namespace ZhongWenHub.Business.AILearning.Services.Competency;

/// <summary>
/// Configurable Bayesian Knowledge Tracing (BKT) parameters for skill and concept mastery estimation.
/// </summary>
public record BktParameters
{
    /// <summary>
    /// Initial probability of knowing the skill before any observations.
    /// </summary>
    public double PriorKnowledge { get; init; } = 0.20;

    /// <summary>
    /// Probability of transitioning from unlearned to learned state at each opportunity.
    /// </summary>
    public double TransitionRate { get; init; } = 0.15;

    /// <summary>
    /// Probability of correctly answering despite not knowing the skill (guessing).
    /// </summary>
    public double GuessRate { get; init; } = 0.25;

    /// <summary>
    /// Probability of incorrectly answering despite knowing the skill (slipping/careless mistake).
    /// </summary>
    public double SlipRate { get; init; } = 0.10;

    /// <summary>
    /// Half-saturation sample count for asymptotic confidence estimation.
    /// </summary>
    public double ConfidenceHalfCount { get; init; } = 8.0;

    public static BktParameters Default => new();
}

