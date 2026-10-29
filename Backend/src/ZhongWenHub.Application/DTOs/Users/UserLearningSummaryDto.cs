namespace ZhongWenHub.Application.DTOs.Users;

public class UserLearningSummaryDto
{
    public string CurrentHsk { get; set; } = "HSK 1";
    public int TotalXp { get; set; } = 0;
    public int StreakDays { get; set; } = 0;
    public int CompletedLessons { get; set; } = 0;
    public int TotalLessons { get; set; } = 35;
    public double ProgressPercentage { get; set; } = 0;
    public int VocabularyMastered { get; set; } = 0;
    public int SrsReviewDue { get; set; } = 0;
    public string LastStudySession { get; set; } = "Chưa có hoạt động học tập";
}
