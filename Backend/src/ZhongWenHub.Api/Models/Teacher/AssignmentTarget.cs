using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZhongWenHub.Models.Teacher;

[Table("assignment_targets")]
public class AssignmentTarget : BaseEntity
{
    [Required]
    public Guid AssignmentId { get; set; }

    [ForeignKey(nameof(AssignmentId))]
    public TeachingAssignment Assignment { get; set; } = null!;

    [Required]
    public Guid ClassId { get; set; }

    [ForeignKey(nameof(ClassId))]
    public TeachingClass TeachingClass { get; set; } = null!;

    public DateTime? DueDate { get; set; }

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}
