using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Business.Teacher.DTOs;

public class RecordAttendanceItemDto
{
    [Required]
    public Guid StudentId { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "PRESENT"; // PRESENT, ABSENT, LATE, EXCUSED

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class RecordClassAttendanceDto
{
    [Required]
    public DateTime AttendanceDate { get; set; }

    public Guid? ScheduleId { get; set; }

    [Required]
    public List<RecordAttendanceItemDto> Records { get; set; } = new();
}

public class ClassAttendanceRecordDto
{
    public Guid Id { get; set; }
    public Guid ClassId { get; set; }
    public Guid? ScheduleId { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string? StudentAvatarUrl { get; set; }
    public DateTime AttendanceDate { get; set; }
    public string Status { get; set; } = "PRESENT";
    public string? Notes { get; set; }
    public Guid RecordedByTeacherId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class StudentAttendanceSummaryDto
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string? StudentAvatarUrl { get; set; }
    public int TotalSessions { get; set; }
    public int PresentCount { get; set; }
    public int LateCount { get; set; }
    public int AbsentCount { get; set; }
    public int ExcusedCount { get; set; }
    public double AttendanceRate { get; set; }
}

public class ClassAttendanceSummaryDto
{
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public int TotalSessionsHeld { get; set; }
    public double AverageAttendanceRate { get; set; }
    public List<StudentAttendanceSummaryDto> Students { get; set; } = new();
}
