using System;
using System.Collections.Generic;

namespace ZhongWenHub.Features.Teacher.DTOs;

public class ClassMembersSummaryDto
{
    public int Total { get; set; }
    public int Active { get; set; }
    public int Paused { get; set; }
    public int Dropped { get; set; }
}

public class ClassDetailDto
{
    public TeachingClassDto ClassInfo { get; set; } = null!;
    public string HskLevelName { get; set; } = string.Empty;
    public string HskLevelColor { get; set; } = "#4338ca";
    public string? CourseName { get; set; }
    public int DerivedEnrollmentCount { get; set; }
    public double DerivedAttendanceAverage { get; set; } = 100.0;
    public List<ClassScheduleDto> Schedules { get; set; } = new();
    public ClassMembersSummaryDto MembersSummary { get; set; } = new();
}
