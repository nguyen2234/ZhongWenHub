using System;
using System.Collections.Generic;

namespace ZhongWenHub.Features.AI.DTOs;

public class CompetencyProfileDto
{
    public Guid UserId { get; set; }

    /// <summary>
    /// Overall assessment status: NOT_ASSESSED, IN_PROGRESS, ASSESSED, CALIBRATED.
    /// </summary>
    public string AssessmentStatus { get; set; } = "NOT_ASSESSED";

    /// <summary>
    /// Student's self-selected / enrolled HSK level.
    /// </summary>
    public int SelectedHskLevel { get; set; } = 1;

    /// <summary>
    /// Empirically estimated HSK level (1 to 6) based on validated cross-skill evidence.
    /// Null when NOT_ASSESSED or evidence is insufficient.
    /// </summary>
    public int? EstimatedHskLevel { get; set; }

    /// <summary>
    /// Statistical confidence in [0.0, 1.0] reflecting data volume and consistency.
    /// </summary>
    public double ConfidenceScore { get; set; } = 0.0;

    /// <summary>
    /// Overall mastery percentage in [0.0, 100.0] aggregated across measured skills.
    /// </summary>
    public double OverallMasteryPercent { get; set; } = 0.0;

    /// <summary>
    /// Total real practice and test questions analyzed.
    /// </summary>
    public int TotalEvaluations { get; set; } = 0;

    /// <summary>
    /// Number of attempts whose categories could not be mapped to standard macro skills.
    /// Preserved for traceability without distorting other skills.
    /// </summary>
    public int UnclassifiedEvaluationsCount { get; set; } = 0;

    /// <summary>
    /// Whether speaking pronunciation has been evaluated with real audio data.
    /// </summary>
    public bool HasSpeakingAudioData { get; set; } = false;

    /// <summary>
    /// Transparent note regarding audio speaking evaluation status.
    /// </summary>
    public string SpeakingAudioNote { get; set; } = "Chưa có dữ liệu âm thanh được chấm điểm; không suy đoán điểm nói.";

    /// <summary>
    /// Breakdown across 6 core language skills.
    /// </summary>
    public List<SkillCompetencyDto> MacroSkills { get; set; } = new();

    /// <summary>
    /// Highest priority weak micro-concepts needing targeted remediation.
    /// </summary>
    public List<WeakConceptDto> TopWeakConcepts { get; set; } = new();

    /// <summary>
    /// Recognized strengths where mastery >= 85%.
    /// </summary>
    public List<string> TopStrengths { get; set; } = new();

    public DateTime LastAssessedAt { get; set; } = DateTime.UtcNow;
}

public class SkillCompetencyDto
{
    public string SkillCategory { get; set; } = string.Empty; // vocabulary, grammar, reading, listening, hanzi, speaking
    public string LabelVi { get; set; } = string.Empty;
    public int TotalAttempts { get; set; } = 0;
    public int CorrectAttempts { get; set; } = 0;
    public double AccuracyPercent { get; set; } = 0.0;
    public double MasteryScore { get; set; } = 0.0; // 0.0 to 1.0
    public double MasteryPercent { get; set; } = 0.0; // 0.0 to 100.0
    public double ConfidenceScore { get; set; } = 0.0;
    public string MasteryTier { get; set; } = "NOT_ASSESSED"; // NOT_ASSESSED, NOVICE, EMERGING, COMPETENT, MASTERED
    public bool IsMeasuredRealData { get; set; } = true;
    public List<string> WeakTopics { get; set; } = new();
}

public class WeakConceptDto
{
    public string ConceptCode { get; set; } = string.Empty;
    public string TitleVi { get; set; } = string.Empty;
    public string SkillCategory { get; set; } = string.Empty;
    public int HskLevel { get; set; } = 1;
    public double MasteryScore { get; set; } = 0.0;
    public string MasteryTier { get; set; } = "NOVICE";
    public int TotalAttempts { get; set; } = 0;
    public int IncorrectAttempts { get; set; } = 0;
    public string EvidenceVi { get; set; } = string.Empty;
    public string RecommendedActionRoute { get; set; } = string.Empty;
}

