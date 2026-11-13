using System.Collections.Generic;

namespace ZhongWenHub.Business.Content.Services.Storage;

public class VideoStorageOptions
{
    public const string SectionName = "VideoStorage";

    /// <summary>
    /// Storage provider: "Supabase", "Local", or "Unconfigured". Default is "Auto".
    /// </summary>
    public string Provider { get; set; } = "Auto";

    /// <summary>
    /// Maximum allowed video upload size in bytes (default 100MB).
    /// </summary>
    public long MaxVideoSizeBytes { get; set; } = 100 * 1024 * 1024;

    /// <summary>
    /// Maximum allowed thumbnail upload size in bytes (default 5MB).
    /// </summary>
    public long MaxThumbnailSizeBytes { get; set; } = 5 * 1024 * 1024;

    /// <summary>
    /// Allowed video MIME types.
    /// </summary>
    public List<string> AllowedVideoMimeTypes { get; set; } = new()
    {
        "video/mp4",
        "video/webm",
        "video/quicktime"
    };

    /// <summary>
    /// Allowed thumbnail image MIME types.
    /// </summary>
    public List<string> AllowedThumbnailMimeTypes { get; set; } = new()
    {
        "image/jpeg",
        "image/png",
        "image/webp"
    };

    /// <summary>
    /// Supabase storage configuration settings.
    /// </summary>
    public SupabaseStorageConfig Supabase { get; set; } = new();

    /// <summary>
    /// Local filesystem storage configuration settings.
    /// </summary>
    public LocalStorageConfig Local { get; set; } = new();
}

public class SupabaseStorageConfig
{
    public string? ProjectUrl { get; set; }
    public string? ServiceRoleKey { get; set; }
    public string BucketName { get; set; } = "learning-videos";
    public string? PublicBaseUrl { get; set; }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(ProjectUrl) &&
        !string.IsNullOrWhiteSpace(ServiceRoleKey) &&
        !string.IsNullOrWhiteSpace(BucketName);
}

public class LocalStorageConfig
{
    public string BaseUploadDirectory { get; set; } = "uploads";
    public string PublicBaseUrl { get; set; } = "/uploads";
    public bool Enabled { get; set; } = true;
}
