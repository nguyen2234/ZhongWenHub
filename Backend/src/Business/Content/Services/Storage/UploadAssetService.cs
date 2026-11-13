using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.Content.Services.Storage;

public class UploadAssetService : IUploadAssetService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<UploadAssetService> _logger;

    public UploadAssetService(
        ApplicationDbContext context,
        ILogger<UploadAssetService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<VideoUploadAsset> RegisterUploadAsync(
        string storagePath,
        string provider,
        string userId,
        string contentType,
        long fileSize,
        string assetType = "Video",
        CancellationToken cancellationToken = default)
    {
        var asset = new VideoUploadAsset
        {
            Id = Guid.NewGuid(),
            StoragePath = storagePath.Trim(),
            StorageProvider = provider,
            UploadedByUserId = userId,
            UploadStatus = VideoUploadAssetStatus.Completed,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            LinkedVideoId = null,
            ContentType = contentType,
            FileSizeBytes = fileSize,
            AssetType = assetType
        };

        _context.VideoUploadAssets.Add(asset);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Upload asset registered: UploadId={UploadId}, User={UserId}, Path={Path}, Type={Type}",
            asset.Id, userId, asset.StoragePath, asset.AssetType);

        return asset;
    }

    public async Task<VideoUploadAsset> ValidateAndClaimAssetAsync(
        Guid uploadId,
        string userId,
        bool isAdmin,
        Guid videoId,
        CancellationToken cancellationToken = default)
    {
        var asset = await _context.VideoUploadAssets
            .FirstOrDefaultAsync(a => a.Id == uploadId, cancellationToken);

        if (asset == null)
        {
            throw new ArgumentException($"Tệp tải lên không tồn tại (UploadId: {uploadId}).");
        }

        // Check expiration
        if (asset.ExpiresAt <= DateTime.UtcNow)
        {
            throw new InvalidOperationException("Phiên tải lên đã hết hạn sử dụng (quá 24 giờ). Vui lòng tải lại tệp mới.");
        }

        // Check ownership / administrative permission
        if (!isAdmin && !string.Equals(asset.UploadedByUserId, userId, StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Bạn không có quyền sử dụng tệp tải lên thuộc quyền sở hữu của người dùng khác.");
        }

        // Check concurrency & double linking
        if (string.Equals(asset.UploadStatus, VideoUploadAssetStatus.Linked, StringComparison.OrdinalIgnoreCase) &&
            asset.LinkedVideoId.HasValue && asset.LinkedVideoId.Value != videoId)
        {
            throw new InvalidOperationException("Tệp tải lên này đã được liên kết với một video khác trong hệ thống.");
        }

        if (string.Equals(asset.UploadStatus, VideoUploadAssetStatus.Deleted, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(asset.UploadStatus, VideoUploadAssetStatus.Revoked, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Tệp tải lên này đã bị hủy hoặc không còn khả dụng.");
        }

        // Atomic claim assignment
        asset.UploadStatus = VideoUploadAssetStatus.Linked;
        asset.LinkedVideoId = videoId;

        return asset;
    }

    public async Task<VideoUploadAsset?> GetAssetByIdAsync(
        Guid uploadId,
        CancellationToken cancellationToken = default)
    {
        return await _context.VideoUploadAssets
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == uploadId, cancellationToken);
    }
}
