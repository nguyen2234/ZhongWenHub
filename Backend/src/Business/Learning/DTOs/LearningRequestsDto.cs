using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Business.Learning.DTOs;

public class UpdateLessonStepDto
{
    [Required]
    public int CurrentStepIndex { get; set; }
    public int? MaxUnlockedStepIndex { get; set; }
}

public class CompleteLessonDto
{
    [Range(0, 100)]
    public int QuizScore { get; set; }
    [Range(0, 100)]
    public int TotalQuizQuestions { get; set; } = 5;
    public int XpEarned { get; set; } = 100;
}

public class RecordPracticeAttemptDto
{
    [Required]
    public string ExerciseId { get; set; } = string.Empty;
    public string? QuestionId { get; set; }
    [Required]
    public string KnowledgePointId { get; set; } = string.Empty;
    [Required]
    public string TopicTitle { get; set; } = string.Empty;
    public string Category { get; set; } = "grammar";
    public int HskLevel { get; set; } = 1;
    public string? UserAnswer { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

public class PracticeSessionResultDto
{
    [Required]
    public string SessionId { get; set; } = string.Empty;
    public int XpEarned { get; set; } = 20;
    public int TotalQuestions { get; set; } = 1;
    public int CorrectQuestions { get; set; } = 1;
    public int TimeSpentSeconds { get; set; } = 60;
}

public class UpdateLearningPreferencesDto
{
    public int? SelectedHskLevel { get; set; }
    public int? TargetDailyMinutes { get; set; }
    public int? TargetDailyXp { get; set; }
    public string? CurrentLessonId { get; set; }
}

public class SrsReviewRequestDto
{
    [Required]
    public string VocabularyId { get; set; } = string.Empty;
    [Required]
    public string Rating { get; set; } = "good"; // again, hard, good, easy
}

public class CompleteSrsSessionDto
{
    public int SessionXp { get; set; } = 30;
    public int WordsReviewedCount { get; set; }
}

public class AddVocabularyRequestDto
{
    public string? VocabularyId { get; set; }
    [Required]
    public string Hanzi { get; set; } = string.Empty;
    public string Pinyin { get; set; } = string.Empty;
    public string? Meaning { get; set; }
    public int? HskLevel { get; set; }
}
