using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZhongWenHub.Data.Entities.Content;

public static class VideoStorageCleanupStatus
{
    public const string Pending = "Pending";
    public const string Processing = "Processing";
    public const string Completed = "Completed";
    public const string Failed = "Failed";
}

[Table("video_storage_cleanup_jobs")]
public class VideoStorageCleanupJob
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
    [MaxLength(50)]
    public string Status { get; set; } = VideoStorageCleanupStatus.Pending;

    [Required]
    [MaxLength(100)]
    public string Reason { get; set; } = "VideoDeleted";

    public int RetryCount { get; set; } = 0;

    public DateTime? NextRetryAt { get; set; }

    [MaxLength(2000)]
    public string? LastError { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ProcessedAt { get; set; }

    [MaxLength(100)]
    public string? LeaseOwner { get; set; }

    public DateTime? LeaseExpiresAt { get; set; }
}
