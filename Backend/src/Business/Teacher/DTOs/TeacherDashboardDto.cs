using System;
using System.Collections.Generic;

namespace ZhongWenHub.Business.Teacher.DTOs;

public class TeacherKpiMetricsDto
{
    public int ActiveClassesCount { get; set; }
    public int TotalEnrolledStudents { get; set; }
    public int PendingSubmissionsCount { get; set; }
    public double WeeklyTeachingHours { get; set; }
}

public class UpcomingTeachingSessionDto
{
    public string Id { get; set; } = string.Empty;
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string ClassCode { get; set; } = string.Empty;
    public string HskLevelName { get; set; } = string.Empty;
    public string HskLevelColor { get; set; } = "#4338ca";
    public string DayOfWeekText { get; set; } = string.Empty;
    public string DateFormatted { get; set; } = string.Empty;
    public string TimeRange { get; set; } = string.Empty;
    public string LocationType { get; set; } = "ONLINE";
    public string? MeetingUrl { get; set; }
    public string? RoomLocation { get; set; }
    public int EnrolledStudentsCount { get; set; }
    public string? LessonTopicPreview { get; set; }
    public bool IsToday { get; set; }
}

public class DemoSubmissionItemDto
{
    public string Id { get; set; } = string.Empty;
    public string AssignmentTitle { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string? StudentAvatarUrl { get; set; }
    public string SubmittedAt { get; set; } = string.Empty;
    public string SubmittedTimeAgo { get; set; } = string.Empty;
    public string Status { get; set; } = "SUBMITTED";
    public double? Score { get; set; }
}

public class RecentClassActivityDto
{
    public string Id { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
    public string TimeAgo { get; set; } = string.Empty;
    public string Type { get; set; } = "SYSTEM";
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ClassId { get; set; }
}

public class TeacherQuickActionDto
{
    public string Id { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string IconName { get; set; } = "classes";
    public string? Badge { get; set; }
}

public class TeacherDashboardDto
{
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public string TeacherEmail { get; set; } = string.Empty;
    public TeacherKpiMetricsDto Metrics { get; set; } = new();
    public List<UpcomingTeachingSessionDto> UpcomingSessions { get; set; } = new();
    public List<ClassSummaryDto> ActiveClasses { get; set; } = new();
    public List<DemoSubmissionItemDto> PendingSubmissions { get; set; } = new();
    public List<RecentClassActivityDto> RecentActivities { get; set; } = new();
    public List<TeacherQuickActionDto> QuickActions { get; set; } = new();
}
