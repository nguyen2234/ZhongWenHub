using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZhongWenHub.Data.Entities.Teacher;

[Table("teaching_class_members")]
public class TeachingClassMember : BaseEntity
{
    [Required]
    public Guid ClassId { get; set; }

    [ForeignKey(nameof(ClassId))]
    public TeachingClass TeachingClass { get; set; } = null!;

    [Required]
    public Guid StudentId { get; set; }

    [ForeignKey(nameof(StudentId))]
    public ApplicationUser Student { get; set; } = null!;

    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, PAUSED, DROPPED, COMPLETED

    public double AttendanceRate { get; set; } = 100.0;

    public int CompletedAssignmentsCount { get; set; } = 0;

    [MaxLength(500)]
    public string? Notes { get; set; }
}
