using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ZhongWenHub.Data.Entities.Content;

namespace ZhongWenHub.Data.Entities.Teacher;

[Table("teaching_assignments")]
public class TeachingAssignment : BaseEntity
{
    [Required]
    public Guid TeacherId { get; set; }

    [ForeignKey(nameof(TeacherId))]
    public ApplicationUser? Teacher { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string HskLevelId { get; set; } = "level-hsk-1";

    public Guid? LessonId { get; set; }

    [ForeignKey(nameof(LessonId))]
    public LessonEntity? Lesson { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "DRAFT"; // DRAFT, PUBLISHED, CLOSED, ARCHIVED

    public int TimeLimitMinutes { get; set; } = 0; // 0 = unlimited

    public int MaxAttempts { get; set; } = 1;

    [Required]
    [MaxLength(30)]
    public string RetakePolicy { get; set; } = "HIGHEST_SCORE"; // HIGHEST_SCORE, LATEST_ATTEMPT, AVERAGE_SCORE

    public double PassingPoints { get; set; } = 60.0;

    public bool AllowLateSubmission { get; set; } = true;

    public int LatePenaltyPercent { get; set; } = 0;

    public bool ShuffleQuestions { get; set; } = false;

    public bool ShowCorrectAnswers { get; set; } = true;

    public DateTime? PublishedAt { get; set; }

    public DateTime? ClosedAt { get; set; }

    // Navigation collections
    public ICollection<AssignmentQuestion> Questions { get; set; } = new List<AssignmentQuestion>();
    public ICollection<AssignmentTarget> Targets { get; set; } = new List<AssignmentTarget>();
    public ICollection<StudentAssignmentSubmission> Submissions { get; set; } = new List<StudentAssignmentSubmission>();
}
