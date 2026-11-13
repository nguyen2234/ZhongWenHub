using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ZhongWenHub.Business.Content.Helpers;

namespace ZhongWenHub.Business.Content.Services.Storage;

public class VideoStorageService : IVideoStorageService
{
    private readonly VideoStorageOptions _options;
    private readonly IHostEnvironment _environment;
    private readonly HttpClient _httpClient;
    private readonly ILogger<VideoStorageService> _logger;

    public VideoStorageService(
        IOptions<VideoStorageOptions> options,
        IHostEnvironment environment,
        HttpClient httpClient,
        ILogger<VideoStorageService> logger)
    {
        _options = options.Value;
        _environment = environment;
        _httpClient = httpClient;
        _logger = logger;
    }

    public bool IsConfigured
    {
        get
        {
            if (string.Equals(_options.Provider, VideoStorageProviders.Supabase, StringComparison.OrdinalIgnoreCase))
            {
                return _options.Supabase.IsConfigured;
            }

            if (string.Equals(_options.Provider, VideoStorageProviders.Local, StringComparison.OrdinalIgnoreCase))
            {
                return _options.Local.Enabled;
            }

            // Auto mode
            if (_options.Supabase.IsConfigured) return true;
            return _options.Local.Enabled;
        }
    }

    public string ProviderName
    {
        get
        {
            if (string.Equals(_options.Provider, VideoStorageProviders.Local, StringComparison.OrdinalIgnoreCase))
            {
                return VideoStorageProviders.Local;
            }

            if (_options.Supabase.IsConfigured)
            {
                return VideoStorageProviders.Supabase;
            }

            if (_options.Local.Enabled)
            {
                return VideoStorageProviders.Local;
            }

            return "Unconfigured";
        }
    }

    public async Task<StorageUploadResult> UploadVideoAsync(
        Stream stream,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        if (stream == null || stream.Length == 0)
        {
            return StorageUploadResult.Failed("Tệp video rỗng hoặc không có nội dung.");
        }

        if (stream.Length > _options.MaxVideoSizeBytes)
        {
            var maxMb = _options.MaxVideoSizeBytes / (1024 * 1024);
            return StorageUploadResult.Failed($"Dung lượng video vượt quá giới hạn cho phép ({maxMb} MB).");
        }

        var cleanMime = contentType.Split(';')[0].Trim().ToLowerInvariant();
        if (!_options.AllowedVideoMimeTypes.Contains(cleanMime))
        {
            return StorageUploadResult.Failed($"Định dạng video '{cleanMime}' không được hỗ trợ. Chỉ hỗ trợ MP4, WebM, QuickTime.");
        }

        // Validate Magic Bytes to prevent MIME-spoofing
        if (!FileSignatureValidator.ValidateSignature(stream, cleanMime, out var detectedFormat))
        {
            _logger.LogWarning("MIME spoofing detected on video upload: Claimed={Claimed}, Detected={Detected}", cleanMime, detectedFormat);
            return StorageUploadResult.Failed($"Chữ ký tệp (magic bytes) không khớp với định dạng video đã khai báo ({cleanMime}). Phát hiện: {detectedFormat}.");
        }

        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(ext)) ext = ".mp4";

        var safeFileName = $"video_{Guid.NewGuid():N}{ext}";
        var relativePath = $"videos/{DateTime.UtcNow:yyyyMM}/{safeFileName}";

        return await UploadInternalAsync(stream, relativePath, cleanMime, cancellationToken);
    }

    public async Task<StorageUploadResult> UploadThumbnailAsync(
        Stream stream,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        if (stream == null || stream.Length == 0)
        {
            return StorageUploadResult.Failed("Tệp ảnh thumbnail rỗng hoặc không có nội dung.");
        }

        if (stream.Length > _options.MaxThumbnailSizeBytes)
        {
            var maxMb = _options.MaxThumbnailSizeBytes / (1024 * 1024);
            return StorageUploadResult.Failed($"Dung lượng ảnh đại diện vượt quá giới hạn cho phép ({maxMb} MB).");
        }

        var cleanMime = contentType.Split(';')[0].Trim().ToLowerInvariant();
        if (!_options.AllowedThumbnailMimeTypes.Contains(cleanMime))
        {
            return StorageUploadResult.Failed($"Định dạng ảnh '{cleanMime}' không được hỗ trợ. Chỉ hỗ trợ JPEG, PNG, WebP.");
        }

        // Validate Magic Bytes to prevent MIME-spoofing
        if (!FileSignatureValidator.ValidateSignature(stream, cleanMime, out var detectedFormat))
        {
            _logger.LogWarning("MIME spoofing detected on thumbnail upload: Claimed={Claimed}, Detected={Detected}", cleanMime, detectedFormat);
            return StorageUploadResult.Failed($"Chữ ký tệp (magic bytes) không khớp với định dạng ảnh đã khai báo ({cleanMime}). Phát hiện: {detectedFormat}.");
        }

        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(ext)) ext = ".jpg";

        var safeFileName = $"thumb_{Guid.NewGuid():N}{ext}";
        var relativePath = $"thumbnails/{DateTime.UtcNow:yyyyMM}/{safeFileName}";

        return await UploadInternalAsync(stream, relativePath, cleanMime, cancellationToken);
    }

    private async Task<StorageUploadResult> UploadInternalAsync(
        Stream stream,
        string relativePath,
        string contentType,
        CancellationToken cancellationToken)
    {
        var isSupabaseConfigured = _options.Supabase.IsConfigured;
        var isLocalEnabled = _options.Local.Enabled;
        var allowLocalFallback = _options.FallbackToLocalOnSupabaseFailure && !_environment.IsProduction();

        // 1. Direct Local Provider configured
        if (string.Equals(_options.Provider, VideoStorageProviders.Local, StringComparison.OrdinalIgnoreCase))
        {
            if (!isLocalEnabled)
            {
                return StorageUploadResult.Failed("Local FileSystem Storage bị tắt trong cấu hình.");
            }
            return await UploadToLocalStorageAsync(stream, relativePath, contentType, cancellationToken);
        }

        // 2. Direct Supabase or Auto Mode with Supabase configured
        if (string.Equals(_options.Provider, VideoStorageProviders.Supabase, StringComparison.OrdinalIgnoreCase) ||
            (string.Equals(_options.Provider, VideoStorageProviders.Auto, StringComparison.OrdinalIgnoreCase) && isSupabaseConfigured))
        {
            if (!isSupabaseConfigured)
            {
                return StorageUploadResult.Failed("Supabase Storage chưa được cấu hình ProjectUrl hoặc ServiceRoleKey.");
            }

            try
            {
                var supabaseResult = await UploadToSupabaseAsync(stream, relativePath, contentType, cancellationToken);
                if (supabaseResult.Success)
                {
                    return supabaseResult;
                }

                _logger.LogWarning("Supabase upload failed: {Error}", supabaseResult.ErrorMessage);

                // Check if local fallback is explicitly allowed
                if (allowLocalFallback && isLocalEnabled)
                {
                    _logger.LogWarning("Local fallback explicitly enabled in non-production. Falling back to LocalFileSystem.");
                    return await UploadToLocalStorageAsync(stream, relativePath, contentType, cancellationToken);
                }

                return StorageUploadResult.Failed($"Tải lên Supabase Storage thất bại: {supabaseResult.ErrorMessage}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error uploading to Supabase Storage.");
                if (allowLocalFallback && isLocalEnabled)
                {
                    _logger.LogWarning("Falling back to local storage after unexpected Supabase exception.");
                    return await UploadToLocalStorageAsync(stream, relativePath, contentType, cancellationToken);
                }
                return StorageUploadResult.Failed($"Lỗi kết nối Supabase Storage: {ex.Message}");
            }
        }

        // 3. Auto mode fallback to Local in development
        if (isLocalEnabled)
        {
            return await UploadToLocalStorageAsync(stream, relativePath, contentType, cancellationToken);
        }

        return StorageUploadResult.Failed("Không có nhà cung cấp lưu trữ (Storage Provider) nào khả dụng.");
    }

    private async Task<StorageUploadResult> UploadToSupabaseAsync(
        Stream stream,
        string relativePath,
        string contentType,
        CancellationToken cancellationToken)
    {
        var cfg = _options.Supabase;
        var cleanProjectUrl = cfg.ProjectUrl!.TrimEnd('/');
        var url = $"{cleanProjectUrl}/storage/v1/object/{cfg.BucketName}/{relativePath}";

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", cfg.ServiceRoleKey);
        request.Headers.Add("apikey", cfg.ServiceRoleKey);

        if (stream.CanSeek)
        {
            stream.Position = 0;
        }

        using var content = new StreamContent(stream);
        content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        request.Content = content;

        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (response.IsSuccessStatusCode)
        {
            var publicUrl = !string.IsNullOrWhiteSpace(cfg.PublicBaseUrl)
                ? $"{cfg.PublicBaseUrl.TrimEnd('/')}/{relativePath}"
                : $"{cleanProjectUrl}/storage/v1/object/public/{cfg.BucketName}/{relativePath}";

            var providerPath = StoragePathSecurity.FormatWithProvider(VideoStorageProviders.Supabase, relativePath);
            return StorageUploadResult.Succeeded(providerPath, publicUrl, stream.Length, contentType);
        }

        var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
        return StorageUploadResult.Failed($"Supabase error ({response.StatusCode}): {errorBody}");
    }

    private async Task<StorageUploadResult> UploadToLocalStorageAsync(
        Stream stream,
        string relativePath,
        string contentType,
        CancellationToken cancellationToken)
    {
        try
        {
            var rootDir = Path.Combine(_environment.ContentRootPath, "wwwroot", _options.Local.BaseUploadDirectory);
            var targetFilePath = StoragePathSecurity.ResolveAndVerifyLocalPath(rootDir, relativePath);

            var targetDir = Path.GetDirectoryName(targetFilePath);
            if (!string.IsNullOrEmpty(targetDir) && !Directory.Exists(targetDir))
            {
                Directory.CreateDirectory(targetDir);
            }

            if (stream.CanSeek)
            {
                stream.Position = 0;
            }

            await using (var fileStream = new FileStream(targetFilePath, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                await stream.CopyToAsync(fileStream, cancellationToken);
            }

            var cleanPublicBase = _options.Local.PublicBaseUrl.TrimEnd('/');
            var publicUrl = $"{cleanPublicBase}/{relativePath.TrimStart('/')}";
            var providerPath = StoragePathSecurity.FormatWithProvider(VideoStorageProviders.Local, relativePath);

            return StorageUploadResult.Succeeded(providerPath, publicUrl, stream.Length, contentType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to write file to local file system: {Path}", relativePath);
            return StorageUploadResult.Failed($"Lỗi ghi tệp cục bộ: {ex.Message}");
        }
    }

    public async Task<bool> DeleteFileAsync(string storagePath, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(storagePath)) return false;

        if (!StoragePathSecurity.IsValidStoragePath(storagePath))
        {
            _logger.LogWarning("Attempted to delete file with invalid or dangerous path: {Path}", storagePath);
            return false;
        }

        var (provider, relativePath) = StoragePathSecurity.Parse(storagePath);
        var deleted = false;

        // If explicitly Local or Unknown
        if (provider is "LocalFileSystem" or "Unknown")
        {
            try
            {
                var rootDir = Path.Combine(_environment.ContentRootPath, "wwwroot", _options.Local.BaseUploadDirectory);
                var localPath = StoragePathSecurity.ResolveAndVerifyLocalPath(rootDir, relativePath);
                if (File.Exists(localPath))
                {
                    File.Delete(localPath);
                    deleted = true;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not delete local file: {Path}", storagePath);
            }
        }

        // If explicitly Supabase or Unknown
        if ((provider is "Supabase" or "Unknown") && _options.Supabase.IsConfigured)
        {
            try
            {
                var cfg = _options.Supabase;
                var cleanProjectUrl = cfg.ProjectUrl!.TrimEnd('/');
                var url = $"{cleanProjectUrl}/storage/v1/object/{cfg.BucketName}/{relativePath}";

                using var request = new HttpRequestMessage(HttpMethod.Delete, url);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", cfg.ServiceRoleKey);
                request.Headers.Add("apikey", cfg.ServiceRoleKey);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    deleted = true;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not delete Supabase object: {Path}", storagePath);
            }
        }

        return deleted;
    }

    public async Task<bool> FileExistsAsync(string storagePath, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(storagePath)) return false;

        if (!StoragePathSecurity.IsValidStoragePath(storagePath))
        {
            return false;
        }

        var (provider, relativePath) = StoragePathSecurity.Parse(storagePath);

        // Check Local
        if (provider is "LocalFileSystem" or "Unknown")
        {
            try
            {
                var rootDir = Path.Combine(_environment.ContentRootPath, "wwwroot", _options.Local.BaseUploadDirectory);
                var localPath = StoragePathSecurity.ResolveAndVerifyLocalPath(rootDir, relativePath);
                if (File.Exists(localPath)) return true;
            }
            catch
            {
                // Ignored - check Supabase if unknown
            }
        }

        // Check Supabase
        if ((provider is "Supabase" or "Unknown") && _options.Supabase.IsConfigured)
        {
            try
            {
                var cfg = _options.Supabase;
                var cleanProjectUrl = cfg.ProjectUrl!.TrimEnd('/');
                var url = $"{cleanProjectUrl}/storage/v1/object/{cfg.BucketName}/{relativePath}";

                using var request = new HttpRequestMessage(HttpMethod.Head, url);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", cfg.ServiceRoleKey);
                request.Headers.Add("apikey", cfg.ServiceRoleKey);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (response.IsSuccessStatusCode) return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Supabase file existence check failed for {Path}", storagePath);
            }
        }

        return false;
    }

    public string GetPublicUrl(string storagePath)
    {
        if (string.IsNullOrWhiteSpace(storagePath)) return string.Empty;

        if (storagePath.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            storagePath.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return storagePath;
        }

        var (provider, relativePath) = StoragePathSecurity.Parse(storagePath);

        if (provider == "Supabase" || (provider == "Unknown" && _options.Supabase.IsConfigured))
        {
            var cfg = _options.Supabase;
            if (cfg.IsConfigured)
            {
                if (!string.IsNullOrWhiteSpace(cfg.PublicBaseUrl))
                {
                    return $"{cfg.PublicBaseUrl.TrimEnd('/')}/{relativePath.TrimStart('/')}";
                }
                var cleanProjectUrl = cfg.ProjectUrl!.TrimEnd('/');
                return $"{cleanProjectUrl}/storage/v1/object/public/{cfg.BucketName}/{relativePath.TrimStart('/')}";
            }
        }

        var cleanBase = _options.Local.PublicBaseUrl.TrimEnd('/');
        return $"{cleanBase}/{relativePath.TrimStart('/')}";
    }
}
