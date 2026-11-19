namespace ZhongWenHub.Business.Users.DTOs;

public class AdminActivityDto
{
    public string Id { get; set; } = string.Empty;
    public string ActionText { get; set; } = string.Empty;
    public string TargetName { get; set; } = string.Empty;
    public string ActorName { get; set; } = string.Empty;
    public string TimeAgo { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
}

public class AdminDashboardStatsDto
{
    public int TotalStudents { get; set; }
    public int TotalTeachers { get; set; }
    public int TotalStaff { get; set; }
    public int? TotalCourses { get; set; }
    public int? TotalClasses { get; set; }
    public int? PendingSupportTickets { get; set; }
    public int ActiveUsers { get; set; }
    public int LockedUsers { get; set; }
    public int NewUsers30d { get; set; }

    // Content Scale metrics from real database
    public int TotalVocabularies { get; set; }
    public int TotalGrammarPoints { get; set; }
    public int TotalCharacters { get; set; }
    public int TotalLessons { get; set; }
    public int TotalExercises { get; set; }
    public int TotalVideos { get; set; }
    public int TotalExams { get; set; }
    public int PendingModerationCount { get; set; }

    // Recent Activities from real database events
    public List<AdminActivityDto> RecentActivities { get; set; } = new();
}
