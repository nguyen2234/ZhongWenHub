using System.Collections.Generic;

namespace ZhongWenHub.Business.Content.Services.Storage;

public static class VideoStorageProviders
{
    public const string Supabase = "Supabase";
    public const string Local = "LocalFileSystem";
    public const string Auto = "Auto";
}

public class VideoStorageOptions
{
    public const string SectionName = "VideoStorage";

    /// <summary>
    /// Storage provider: "Supabase", "Local", or "Auto".
    /// When "Auto", uses Supabase if configured; otherwise uses LocalFileSystem in Development.
    /// </summary>
    public string Provider { get; set; } = VideoStorageProviders.Auto;

    /// <summary>
    /// If true, automatically falls back to local storage when Supabase upload fails.
    /// Strictly disabled (false) by default to prevent silent environmental degradation in Production.
    /// </summary>
    public bool FallbackToLocalOnSupabaseFailure { get; set; } = false;

    /// <summary>
    /// Maximum allowed video upload size in bytes (default 100MB).
    /// Note: Uploads up to 100MB use standard authenticated streaming POST.
    /// Multi-gigabyte resumable chunking is documented on the roadmap for Phase 3/4.
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
