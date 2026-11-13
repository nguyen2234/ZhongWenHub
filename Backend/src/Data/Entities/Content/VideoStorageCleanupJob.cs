using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZhongWenHub.Data.Entities.Content;

[Table("video_storage_cleanup_jobs")]
public class VideoStorageCleanupJob
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(500)]
    public string StoragePath { get; set; } = string.Empty;

    [MaxLength(50)]
    public string StorageProvider { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Reason { get; set; } = string.Empty;

    public int RetryCount { get; set; } = 0;

    [MaxLength(2000)]
    public string? LastError { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ProcessedAt { get; set; }

    public bool IsCompleted { get; set; } = false;
}
