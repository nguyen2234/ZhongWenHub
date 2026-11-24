using System;

namespace ZhongWenHub.Features.Teacher.DTOs;

public class ClassMemberViewDto
{
    public Guid Id { get; set; }
    public Guid ClassId { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string? StudentAvatarUrl { get; set; }
    public DateTime EnrolledAt { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public double AttendanceRate { get; set; } = 100.0;
    public int CompletedAssignmentsCount { get; set; }
    public string? Notes { get; set; }
}
