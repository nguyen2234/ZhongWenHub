using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZhongWenHub.Models.Teacher;

[Table("teaching_class_attendances")]
public class TeachingClassAttendance : BaseEntity
{
    [Required]
    public Guid ClassId { get; set; }

    [ForeignKey(nameof(ClassId))]
    public TeachingClass TeachingClass { get; set; } = null!;

    public Guid? ScheduleId { get; set; }

    [ForeignKey(nameof(ScheduleId))]
    public TeachingClassSchedule? Schedule { get; set; }

    [Required]
    public Guid StudentId { get; set; }

    [ForeignKey(nameof(StudentId))]
    public ApplicationUser Student { get; set; } = null!;

    [Required]
    public DateTime AttendanceDate { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "PRESENT"; // PRESENT, ABSENT, LATE, EXCUSED

    [MaxLength(500)]
    public string? Notes { get; set; }

    [Required]
    public Guid RecordedByTeacherId { get; set; }

    [ForeignKey(nameof(RecordedByTeacherId))]
    public ApplicationUser? RecordedByTeacher { get; set; }
}
