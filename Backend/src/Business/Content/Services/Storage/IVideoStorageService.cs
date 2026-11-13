using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace ZhongWenHub.Business.Content.Services.Storage;

public class StorageUploadResult
{
    public bool Success { get; set; }
    public Guid? UploadId { get; set; }
    public string? StoragePath { get; set; }
    public string? PublicUrl { get; set; }
    public long FileSizeBytes { get; set; }
    public string? ContentType { get; set; }
    public string? ErrorMessage { get; set; }

    public static StorageUploadResult Failed(string error) =>
        new() { Success = false, ErrorMessage = error };

    public static StorageUploadResult Succeeded(string storagePath, string publicUrl, long size, string contentType, Guid? uploadId = null) =>
        new()
        {
            Success = true,
            UploadId = uploadId,
            StoragePath = storagePath,
            PublicUrl = publicUrl,
            FileSizeBytes = size,
            ContentType = contentType
        };
}

public interface IVideoStorageService
{
    /// <summary>
    /// Indicates whether cloud storage credentials are fully configured and ready for live uploads.
    /// </summary>
    bool IsConfigured { get; }

    /// <summary>
    /// Name of the active storage provider (e.g. Supabase, LocalFileSystem, Unconfigured).
    /// </summary>
    string ProviderName { get; }

    /// <summary>
    /// Uploads a learning video stream and returns the persisted storage path & public URL.
    /// </summary>
    Task<StorageUploadResult> UploadVideoAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default);

    /// <summary>
    /// Uploads a video thumbnail image stream and returns the persisted storage path & public URL.
    /// </summary>
    Task<StorageUploadResult> UploadThumbnailAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a file from storage given its path.
    /// </summary>
    Task<bool> DeleteFileAsync(string storagePath, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks whether a file exists at the given storage path.
    /// </summary>
    Task<bool> FileExistsAsync(string storagePath, CancellationToken cancellationToken = default);

    /// <summary>
    /// Resolves the public accessible URL for a given storage path.
    /// </summary>
    string GetPublicUrl(string storagePath);
}

