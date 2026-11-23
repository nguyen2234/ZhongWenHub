using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZhongWenHub.Data.Entities.Teacher;

[Table("student_assignment_submissions")]
public class StudentAssignmentSubmission : BaseEntity
{
    [Required]
    public Guid AssignmentId { get; set; }

    [ForeignKey(nameof(AssignmentId))]
    public TeachingAssignment Assignment { get; set; } = null!;

    [Required]
    public Guid StudentId { get; set; }

    [ForeignKey(nameof(StudentId))]
    public ApplicationUser Student { get; set; } = null!;

    [Required]
    public Guid ClassId { get; set; }

    [ForeignKey(nameof(ClassId))]
    public TeachingClass TeachingClass { get; set; } = null!;

    public int AttemptNumber { get; set; } = 1;

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    public DateTime? SubmittedAt { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "IN_PROGRESS"; // IN_PROGRESS, SUBMITTED, GRADING, GRADED, LATE

    public double Score { get; set; } = 0.0;

    public double MaxScore { get; set; } = 100.0;

    public bool IsPassed { get; set; } = false;

    public int TimeSpentSeconds { get; set; } = 0;

    [Required]
    public string StudentAnswersJson { get; set; } = "[]";

    [MaxLength(2000)]
    public string? FeedbackNote { get; set; }

    public Guid? GradedByTeacherId { get; set; }

    [ForeignKey(nameof(GradedByTeacherId))]
    public ApplicationUser? GradedByTeacher { get; set; }

    public DateTime? GradedAt { get; set; }
}
