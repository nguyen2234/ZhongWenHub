using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZhongWenHub.Models.Teacher;

[Table("teaching_class_schedules")]
public class TeachingClassSchedule : BaseEntity
{
    [Required]
    public Guid ClassId { get; set; }

    [ForeignKey(nameof(ClassId))]
    public TeachingClass TeachingClass { get; set; } = null!;

    [Required]
    [MaxLength(20)]
    public string DayOfWeek { get; set; } = "MONDAY"; // MONDAY..SUNDAY

    [Required]
    [MaxLength(10)]
    public string StartTime { get; set; } = "19:00"; // HH:mm

    [Required]
    [MaxLength(10)]
    public string EndTime { get; set; } = "20:30"; // HH:mm

    [MaxLength(50)]
    public string Timezone { get; set; } = "Asia/Ho_Chi_Minh";

    [Required]
    [MaxLength(20)]
    public string LocationType { get; set; } = "ONLINE";

    [MaxLength(500)]
    public string? MeetingUrl { get; set; }

    [MaxLength(200)]
    public string? RoomLocation { get; set; }
}
