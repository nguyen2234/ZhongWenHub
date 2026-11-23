using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZhongWenHub.Data.Entities.Content;

public static class VideoUploadAssetStatus
{
    public const string Completed = "Completed";
    public const string Linked = "Linked";
    public const string Expired = "Expired";
    public const string Deleted = "Deleted";
    public const string Revoked = "Revoked";
}

[Table("video_upload_assets")]
public class VideoUploadAsset
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(500)]
    public string StoragePath { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string StorageProvider { get; set; } = "Unknown";

    [Required]
    [MaxLength(450)]
    public string UploadedByUserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string UploadStatus { get; set; } = VideoUploadAssetStatus.Completed;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(24);

    public Guid? LinkedVideoId { get; set; }

    [MaxLength(100)]
    public string ContentType { get; set; } = string.Empty;

    public long FileSizeBytes { get; set; } = 0;

    [Required]
    [MaxLength(50)]
    public string AssetType { get; set; } = "Video"; // "Video" or "Thumbnail"

    [ForeignKey(nameof(LinkedVideoId))]
    public LearningVideo? LinkedVideo { get; set; }
}
