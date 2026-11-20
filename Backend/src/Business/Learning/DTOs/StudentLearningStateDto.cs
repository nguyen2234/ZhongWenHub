using System.Collections.Generic;

namespace ZhongWenHub.Business.Learning.DTOs;

public class DailyGoalDto
{
    public int TargetMinutes { get; set; } = 30;
    public int TargetXp { get; set; } = 50;
}

public class HskCourseProgressDto
{
    public int HskLevel { get; set; }
    public string CourseId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int TotalLessons { get; set; }
    public int PublishedLessons { get; set; }
    public int CompletedLessons { get; set; }
    public int InProgressLessons { get; set; }
    public int Percent { get; set; }
    public bool IsComingSoon { get; set; }
}

public class StudentLearningStateDto
{
    public int SchemaVersion { get; set; } = 1;
    public string StudentId { get; set; } = string.Empty;
    public int SelectedHskLevel { get; set; } = 1;
    public string CurrentLessonId { get; set; } = "aaaaaaaa-1111-1111-1111-111111111111";
    public List<string> CompletedLessonIds { get; set; } = new();
    public Dictionary<string, LessonProgressDto> LessonProgress { get; set; } = new();
    public List<PracticeAttemptDto> ExerciseAttempts { get; set; } = new();
    public Dictionary<string, UserVocabularyStateDto> UserVocabStates { get; set; } = new();
    public Dictionary<string, SrsStateDto> UserSrsStates { get; set; } = new();
    public List<WeakKnowledgeDto> WeakKnowledgePoints { get; set; } = new();
    public int XpTotal { get; set; }
    public List<string> RewardedEventIds { get; set; } = new();
    public int StreakDays { get; set; }
    public string LastActivityDate { get; set; } = string.Empty;
    public DailyGoalDto DailyGoal { get; set; } = new();
    public Dictionary<string, DailyActivityDto> DailyActivityHistory { get; set; } = new();
    public List<HskCourseProgressDto> HskProgress { get; set; } = new();
}
