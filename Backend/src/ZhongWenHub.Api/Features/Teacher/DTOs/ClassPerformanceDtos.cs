using System;
using System.Collections.Generic;

namespace ZhongWenHub.Features.Teacher.DTOs;

public class StudentPerformanceSummaryDto
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string? StudentAvatarUrl { get; set; }
    public double AttendanceRate { get; set; }
    public int AssignmentsCompleted { get; set; }
    public int TotalAssignments { get; set; }
    public double AverageScore { get; set; }
    public string Status { get; set; } = "ACTIVE";
}

public class GradeDistributionDto
{
    public int ExcellentCount { get; set; } // >= 85
    public int GoodCount { get; set; }      // 70 - 84
    public int AverageCount { get; set; }   // 50 - 69
    public int PoorCount { get; set; }      // < 50
}

public class ClassPerformanceDto
{
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string ClassCode { get; set; } = string.Empty;
    public int TotalStudents { get; set; }
    public double AverageAttendanceRate { get; set; }
    public int TotalAssignmentsAssigned { get; set; }
    public double AverageAssignmentScore { get; set; }
    public double SubmissionRate { get; set; }
    public GradeDistributionDto GradeDistribution { get; set; } = new();
    public List<StudentPerformanceSummaryDto> StudentSummaries { get; set; } = new();
}

public class ClassCurriculumLessonDto
{
    public Guid Id { get; set; }
    public int LessonNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string PinyinTitle { get; set; } = string.Empty;
    public string VietnameseTitle { get; set; } = string.Empty;
    public bool IsPublished { get; set; }
}

public class ClassCurriculumUnitDto
{
    public Guid Id { get; set; }
    public int UnitNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<ClassCurriculumLessonDto> Lessons { get; set; } = new();
}

public class ClassCurriculumDto
{
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public Guid? CourseId { get; set; }
    public string? CourseTitle { get; set; }
    public string HskLevelId { get; set; } = "level-hsk-1";
    public List<ClassCurriculumUnitDto> Units { get; set; } = new();
}

public class SetClassCurriculumDto
{
    public Guid CourseId { get; set; }
}
