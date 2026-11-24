using System;

namespace ZhongWenHub.Features.Teacher.DTOs;

public class TeacherClassStatsDto
{
    public int TotalClasses { get; set; }
    public int ActiveCount { get; set; }
    public int UpcomingCount { get; set; }
    public int ArchivedCount { get; set; }
    public int TotalStudents { get; set; }
}
