using System;
using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Features.Teacher.DTOs;

public class ClassScheduleDto
{
    public Guid? Id { get; set; }

    [Required(ErrorMessage = "Ngày trong tuần là bắt buộc.")]
    [MaxLength(20)]
    public string DayOfWeek { get; set; } = "MONDAY"; // MONDAY..SUNDAY

    [Required(ErrorMessage = "Giờ bắt đầu là bắt buộc.")]
    [RegularExpression(@"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", ErrorMessage = "Định dạng giờ bắt đầu không hợp lệ (HH:mm).")]
    public string StartTime { get; set; } = "19:00";

    [Required(ErrorMessage = "Giờ kết thúc là bắt buộc.")]
    [RegularExpression(@"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", ErrorMessage = "Định dạng giờ kết thúc không hợp lệ (HH:mm).")]
    public string EndTime { get; set; } = "20:30";

    public string Timezone { get; set; } = "Asia/Ho_Chi_Minh";

    public string LocationType { get; set; } = "ONLINE"; // ONLINE, OFFLINE, HYBRID

    [MaxLength(500)]
    public string? MeetingUrl { get; set; }

    [MaxLength(200)]
    public string? RoomLocation { get; set; }
}
