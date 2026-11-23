using System;
using System.Collections.Generic;

namespace ZhongWenHub.Business.AILearning.DTOs;

public sealed class SpeakingPracticeItemDto
{
    public string Id { get; init; } = string.Empty;
    public string PracticeType { get; init; } = "WORD"; // WORD, SENTENCE, SCENARIO
    public int HskLevel { get; init; } = 1;
    public string TargetTextZh { get; init; } = string.Empty;
    public string TargetPinyin { get; init; } = string.Empty;
    public string MeaningVi { get; init; } = string.Empty;
    public string? AudioSampleUrl { get; init; }
    public string? ContextScenario { get; init; }
    public string? CulturalNoteVi { get; init; }
}

public sealed class SubmitSpeakingPracticeDto
{
    public string PracticeType { get; init; } = "WORD"; // WORD, SENTENCE, SCENARIO
    public int HskLevel { get; init; } = 1;
    public string TargetTextZh { get; init; } = string.Empty;
    public string? TargetPinyin { get; init; }
    public string? TargetMeaningVi { get; init; }
    public string? DirectText { get; init; } // Fallback when STT not configured or student types
    public int AudioDurationSeconds { get; init; } = 0;
}

public sealed class WordAlignmentDetailDto
{
    public string CharacterOrWord { get; init; } = string.Empty;
    public string? Pinyin { get; init; }
    public string Status { get; init; } = "MATCHED"; // MATCHED, MISSED, SUBSTITUTED, EXTRA
    public string? TipVi { get; init; }
}

public sealed record SpeakingAssessmentResultDto
{
    public Guid AttemptId { get; init; }
    public string PracticeType { get; init; } = "WORD";
    public int HskLevel { get; init; } = 1;
    public string TargetTextZh { get; init; } = string.Empty;
    public string? TargetPinyin { get; init; }
    public string RecognizedTranscriptZh { get; init; } = string.Empty;
    public double TranscriptAccuracyPercent { get; init; }
    public double OverallPronunciationScore { get; init; }
    public string AssessmentMethod { get; init; } = "TRANSCRIPT_ALIGNMENT"; // TRANSCRIPT_ALIGNMENT, ACOUSTIC_MODEL
    public bool HasAcousticToneData { get; init; } = false;
    public string ToneAssessmentNote { get; init; } = "Điểm số phản ánh độ khớp văn bản nhận diện (Transcript Alignment). Không suy đoán thanh điệu hoặc ngữ điệu âm học khi chưa có thiết bị đo chuyên biệt.";
    public string EvaluationFeedbackVi { get; init; } = string.Empty;
    public List<WordAlignmentDetailDto> WordBreakdown { get; init; } = new();
    public string? SuggestedNextPractice { get; init; }
    public string SttProvider { get; init; } = "GeminiAudioSTT";
    public bool IsSttAvailable { get; init; } = true;
    public double? SttConfidence { get; init; } = null;
    public string SttConfidenceStatus { get; init; } = "UNAVAILABLE"; // REAL, UNAVAILABLE
    public bool IsDirectTextInput { get; init; } = false;
    public DateTime AttemptedAt { get; init; } = DateTime.UtcNow;
}

public sealed class SpeakingStatsDto
{
    public int TotalSpeakingAttempts { get; init; }
    public double AverageAccuracyPercent { get; init; }
    public int CompletedWords { get; init; }
    public int CompletedSentences { get; init; }
    public int CompletedScenarios { get; init; }
    public DateTime? LastPracticedAt { get; init; }
    public bool HasAudioAssessedData { get; init; }
    public string DisclaimerNoteVi { get; init; } = "Dữ liệu dựa trên độ khớp nhận diện giọng nói (Transcript Alignment).";
}
