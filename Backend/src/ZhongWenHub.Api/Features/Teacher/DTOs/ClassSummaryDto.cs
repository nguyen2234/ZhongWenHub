using System;

namespace ZhongWenHub.Features.Teacher.DTOs;

public class ClassSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string HskLevelId { get; set; } = string.Empty;
    public string HskLevelName { get; set; } = string.Empty;
    public string HskLevelColor { get; set; } = "#4338ca";
    public Guid? CourseId { get; set; }
    public string? CourseName { get; set; }
    public string Status { get; set; } = "UPCOMING";
    public int Capacity { get; set; }
    public int DerivedEnrollmentCount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string LocationType { get; set; } = "ONLINE";
    public string? MeetingUrl { get; set; }
    public string? RoomLocation { get; set; }
    public string SchedulesSummary { get; set; } = "Chưa xếp lịch";
    public string? NextSessionText { get; set; }
}
