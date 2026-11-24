using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ZhongWenHub.Models.Content;

namespace ZhongWenHub.Models.Teacher;

[Table("teaching_classes")]
public class TeachingClass : BaseEntity
{
    [Required]
    public Guid TeacherId { get; set; }

    [ForeignKey(nameof(TeacherId))]
    public ApplicationUser? Teacher { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string HskLevelId { get; set; } = "level-hsk-1";

    public Guid? CourseId { get; set; }

    [ForeignKey(nameof(CourseId))]
    public CourseEntity? Course { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "UPCOMING"; // DRAFT, UPCOMING, ACTIVE, COMPLETED, ARCHIVED

    public int Capacity { get; set; } = 30;

    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    [Required]
    [MaxLength(20)]
    public string LocationType { get; set; } = "ONLINE"; // ONLINE, OFFLINE, HYBRID

    [MaxLength(500)]
    public string? MeetingUrl { get; set; }

    [MaxLength(200)]
    public string? RoomLocation { get; set; }

    public bool IsArchived { get; set; } = false;

    public DateTime? ArchivedAt { get; set; }

    // Navigation collections
    public ICollection<TeachingClassMember> Members { get; set; } = new List<TeachingClassMember>();
    public ICollection<TeachingClassSchedule> Schedules { get; set; } = new List<TeachingClassSchedule>();
    public ICollection<TeachingClassAttendance> Attendances { get; set; } = new List<TeachingClassAttendance>();
    public ICollection<AssignmentTarget> AssignmentTargets { get; set; } = new List<AssignmentTarget>();
}
