using System;

namespace ZhongWenHub.Features.Teacher.DTOs;

public class StudentEnrolledClassDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string HskLevelId { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public string Status { get; set; } = "ACTIVE";
    public DateTime StartDate { get; set; }
    public string LocationType { get; set; } = "ONLINE";
    public string SchedulesSummary { get; set; } = string.Empty;
    public DateTime EnrolledAt { get; set; }
}
