using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ZhongWenHub.Business.Content.DTOs;

public class LearningVideoDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string SourceType { get; set; } = "YouTube";

    [JsonPropertyName("youtubeVideoId")]
    public string? YouTubeVideoId { get; set; }

    public string? StoragePath { get; set; }
    public string ThumbnailUrl { get; set; } = string.Empty;
    public int DurationSeconds { get; set; }
    public string DurationFormatted => FormatDuration(DurationSeconds);
    public int HskLevel { get; set; } = 1;
    public string Topic { get; set; } = "Giao tiếp hàng ngày";
    public string Status { get; set; } = "Draft";
    public int ViewCount { get; set; }
    public Guid? LessonId { get; set; }
    public string? LessonTitle { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public static string FormatDuration(int seconds)
    {
        if (seconds < 0) seconds = 0;
        var hours = seconds / 3600;
        var minutes = (seconds % 3600) / 60;
        var remainingSeconds = seconds % 60;

        if (hours > 0)
        {
            return $"{hours:D2}:{minutes:D2}:{remainingSeconds:D2}";
        }
        return $"{minutes:D2}:{remainingSeconds:D2}";
    }
}

public class LearningVideoQueryDto
{
    public string? Search { get; set; }
    public int? HskLevel { get; set; }
    public string? Topic { get; set; }
    public string? SourceType { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

public class LearningVideoAdminQueryDto : LearningVideoQueryDto
{
    public string? Status { get; set; }
}

public class UpdateVideoStatusDto
{
    [Required(ErrorMessage = "Trạng thái video là bắt buộc.")]
    [RegularExpression("^(Draft|Published|Hidden)$", ErrorMessage = "Trạng thái chỉ chấp nhận 'Draft', 'Published' hoặc 'Hidden'.")]
    public string Status { get; set; } = "Draft";
}

public class VideoStorageStatusDto
{
    public bool IsConfigured { get; set; }
    public string ProviderName { get; set; } = "Unconfigured";
    public long MaxVideoSizeBytes { get; set; }
    public long MaxThumbnailSizeBytes { get; set; }
    public List<string> AllowedVideoMimeTypes { get; set; } = new();
    public List<string> AllowedThumbnailMimeTypes { get; set; } = new();
}

public class CreateLearningVideoDto : IValidatableObject
{
    [Required(ErrorMessage = "Tiêu đề video là bắt buộc.")]
    [StringLength(250, ErrorMessage = "Tiêu đề không được vượt quá 250 ký tự.")]
    public string Title { get; set; } = string.Empty;

    [StringLength(2000, ErrorMessage = "Mô tả không được vượt quá 2000 ký tự.")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Loại nguồn video là bắt buộc (YouTube hoặc Uploaded).")]
    public string SourceType { get; set; } = "YouTube";

    [StringLength(500, ErrorMessage = "YouTube URL không được vượt quá 500 ký tự.")]
    public string? YouTubeUrl { get; set; }

    [StringLength(50, ErrorMessage = "YouTube Video ID không được vượt quá 50 ký tự.")]
    [JsonPropertyName("youtubeVideoId")]
    public string? YouTubeVideoId { get; set; }

    [StringLength(500, ErrorMessage = "Đường dẫn lưu trữ không được vượt quá 500 ký tự.")]
    public string? StoragePath { get; set; }

    [Required(ErrorMessage = "Ảnh đại diện (ThumbnailUrl) là bắt buộc.")]
    [StringLength(1000, ErrorMessage = "Thumbnail URL không được vượt quá 1000 ký tự.")]
    public string ThumbnailUrl { get; set; } = string.Empty;

    [Range(0, 86400, ErrorMessage = "Thời lượng video phải từ 0 đến 86400 giây (24 giờ).")]
    public int DurationSeconds { get; set; }

    [Range(1, 6, ErrorMessage = "Cấp độ HSK phải từ 1 đến 6.")]
    public int HskLevel { get; set; } = 1;

    [Required(ErrorMessage = "Chủ đề video là bắt buộc.")]
    [StringLength(100, ErrorMessage = "Chủ đề không được vượt quá 100 ký tự.")]
    public string Topic { get; set; } = "Giao tiếp hàng ngày";

    public string Status { get; set; } = "Draft";
    public Guid? LessonId { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var isYouTube = string.Equals(SourceType, "YouTube", StringComparison.OrdinalIgnoreCase);
        var isUploaded = string.Equals(SourceType, "Uploaded", StringComparison.OrdinalIgnoreCase);

        if (!isYouTube && !isUploaded)
        {
            yield return new ValidationResult(
                "SourceType chỉ chấp nhận 'YouTube' hoặc 'Uploaded'.",
                new[] { nameof(SourceType) });
        }

        if (isYouTube && string.IsNullOrWhiteSpace(YouTubeVideoId) && string.IsNullOrWhiteSpace(YouTubeUrl))
        {
            yield return new ValidationResult(
                "Video nguồn YouTube phải cung cấp YouTubeUrl hoặc YouTubeVideoId hợp lệ.",
                new[] { nameof(YouTubeVideoId) });
        }

        var isPublished = string.Equals(Status, "Published", StringComparison.OrdinalIgnoreCase);
        if (isUploaded && isPublished && string.IsNullOrWhiteSpace(StoragePath))
        {
            yield return new ValidationResult(
                "Video tự tải lên (Uploaded) phải có StoragePath hợp lệ trước khi xuất bản.",
                new[] { nameof(StoragePath) });
        }
    }
}

public class UpdateLearningVideoDto : IValidatableObject
{
    [Required(ErrorMessage = "Tiêu đề video là bắt buộc.")]
    [StringLength(250, ErrorMessage = "Tiêu đề không được vượt quá 250 ký tự.")]
    public string Title { get; set; } = string.Empty;

    [StringLength(2000, ErrorMessage = "Mô tả không được vượt quá 2000 ký tự.")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Loại nguồn video là bắt buộc (YouTube hoặc Uploaded).")]
    public string SourceType { get; set; } = "YouTube";

    [StringLength(500, ErrorMessage = "YouTube URL không được vượt quá 500 ký tự.")]
    public string? YouTubeUrl { get; set; }

    [StringLength(50, ErrorMessage = "YouTube Video ID không được vượt quá 50 ký tự.")]
    [JsonPropertyName("youtubeVideoId")]
    public string? YouTubeVideoId { get; set; }

    [StringLength(500, ErrorMessage = "Đường dẫn lưu trữ không được vượt quá 500 ký tự.")]
    public string? StoragePath { get; set; }

    [Required(ErrorMessage = "Ảnh đại diện (ThumbnailUrl) là bắt buộc.")]
    [StringLength(1000, ErrorMessage = "Thumbnail URL không được vượt quá 1000 ký tự.")]
    public string ThumbnailUrl { get; set; } = string.Empty;

    [Range(0, 86400, ErrorMessage = "Thời lượng video phải từ 0 đến 86400 giây (24 giờ).")]
    public int DurationSeconds { get; set; }

    [Range(1, 6, ErrorMessage = "Cấp độ HSK phải từ 1 đến 6.")]
    public int HskLevel { get; set; } = 1;

    [Required(ErrorMessage = "Chủ đề video là bắt buộc.")]
    [StringLength(100, ErrorMessage = "Chủ đề không được vượt quá 100 ký tự.")]
    public string Topic { get; set; } = "Giao tiếp hàng ngày";

    public string Status { get; set; } = "Draft";
    public Guid? LessonId { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var isYouTube = string.Equals(SourceType, "YouTube", StringComparison.OrdinalIgnoreCase);
        var isUploaded = string.Equals(SourceType, "Uploaded", StringComparison.OrdinalIgnoreCase);

        if (!isYouTube && !isUploaded)
        {
            yield return new ValidationResult(
                "SourceType chỉ chấp nhận 'YouTube' hoặc 'Uploaded'.",
                new[] { nameof(SourceType) });
        }

        if (isYouTube && string.IsNullOrWhiteSpace(YouTubeVideoId) && string.IsNullOrWhiteSpace(YouTubeUrl))
        {
            yield return new ValidationResult(
                "Video nguồn YouTube phải cung cấp YouTubeUrl hoặc YouTubeVideoId hợp lệ.",
                new[] { nameof(YouTubeVideoId) });
        }

        var isPublished = string.Equals(Status, "Published", StringComparison.OrdinalIgnoreCase);
        if (isUploaded && isPublished && string.IsNullOrWhiteSpace(StoragePath))
        {
            yield return new ValidationResult(
                "Video tự tải lên (Uploaded) phải có StoragePath hợp lệ trước khi xuất bản.",
                new[] { nameof(StoragePath) });
        }
    }
}

