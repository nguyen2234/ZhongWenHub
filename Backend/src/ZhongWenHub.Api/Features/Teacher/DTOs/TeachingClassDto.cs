using System;

namespace ZhongWenHub.Business.Teacher.DTOs;

public class TeachingClassDto
{
    public Guid Id { get; set; }
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string HskLevelId { get; set; } = string.Empty;
    public Guid? CourseId { get; set; }
    public string? CourseName { get; set; }
    public string Status { get; set; } = "UPCOMING";
    public int Capacity { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string LocationType { get; set; } = "ONLINE";
    public string? MeetingUrl { get; set; }
    public string? RoomLocation { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
