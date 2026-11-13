using System;
using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Data.Entities.Content;

public class LearningVideo : BaseEntity
{
    [Required]
    [MaxLength(250)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    /// <summary>
    /// Source type of the video: "YouTube" or "Uploaded"
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string SourceType { get; set; } = "YouTube";

    /// <summary>
    /// 11-character YouTube video ID when SourceType is "YouTube" (e.g. "4lHwBZr66so")
    /// </summary>
    [MaxLength(50)]
    public string? YouTubeVideoId { get; set; }

    /// <summary>
    /// File path in storage when SourceType is "Uploaded" (e.g. "videos/hsk1/greetings.mp4")
    /// </summary>
    [MaxLength(500)]
    public string? StoragePath { get; set; }

    /// <summary>
    /// URL to the video thumbnail image
    /// </summary>
    [Required]
    [MaxLength(1000)]
    public string ThumbnailUrl { get; set; } = string.Empty;

    /// <summary>
    /// Video duration in seconds
    /// </summary>
    public int DurationSeconds { get; set; } = 0;

    /// <summary>
    /// HSK level from 1 to 6
    /// </summary>
    public int HskLevel { get; set; } = 1;

    /// <summary>
    /// Topic category (e.g. "Giao tiếp hàng ngày", "Ẩm thực & Mua sắm", "Du lịch & Đời sống", "Ngữ pháp thực dụng", "Luyện thi HSK", "Văn hóa & Phong tục")
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Topic { get; set; } = "Giao tiếp hàng ngày";

    /// <summary>
    /// Publication status: "Draft", "Published", "Hidden"
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft";

    /// <summary>
    /// Total view count
    /// </summary>
    public int ViewCount { get; set; } = 0;

    /// <summary>
    /// Optional foreign key to related LessonEntity
    /// </summary>
    public Guid? LessonId { get; set; }

    /// <summary>
    /// Navigation property to related LessonEntity
    /// </summary>
    public LessonEntity? Lesson { get; set; }
}

