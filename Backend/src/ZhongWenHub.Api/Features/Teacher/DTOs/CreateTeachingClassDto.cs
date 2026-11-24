using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Features.Teacher.DTOs;

public class CreateTeachingClassDto
{
    [Required(ErrorMessage = "Tên lớp học là bắt buộc.")]
    [MaxLength(200, ErrorMessage = "Tên lớp học không được vượt quá 200 ký tự.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mã lớp học là bắt buộc.")]
    [MaxLength(50, ErrorMessage = "Mã lớp học không được vượt quá 50 ký tự.")]
    public string Code { get; set; } = string.Empty;

    [MaxLength(2000, ErrorMessage = "Mô tả không được vượt quá 2000 ký tự.")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Cấp độ HSK là bắt buộc.")]
    [MaxLength(50)]
    public string HskLevelId { get; set; } = "level-hsk-1";

    public Guid? CourseId { get; set; }

    [Range(1, 500, ErrorMessage = "Sĩ số lớp phải từ 1 đến 500 học viên.")]
    public int Capacity { get; set; } = 30;

    [Required(ErrorMessage = "Ngày khai giảng là bắt buộc.")]
    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    [Required(ErrorMessage = "Hình thức đào tạo là bắt buộc.")]
    [RegularExpression("^(ONLINE|OFFLINE|HYBRID)$", ErrorMessage = "Hình thức đào tạo phải là ONLINE, OFFLINE hoặc HYBRID.")]
    public string LocationType { get; set; } = "ONLINE";

    [MaxLength(500)]
    public string? MeetingUrl { get; set; }

    [MaxLength(200)]
    public string? RoomLocation { get; set; }

    public List<ClassScheduleDto> Schedules { get; set; } = new();
}
