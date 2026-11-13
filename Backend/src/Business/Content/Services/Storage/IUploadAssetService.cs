using System;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Data.Entities.Content;

namespace ZhongWenHub.Business.Content.Services.Storage;

public interface IUploadAssetService
{
    Task<VideoUploadAsset> RegisterUploadAsync(
        string storagePath,
        string provider,
        string userId,
        string contentType,
        long fileSize,
        string assetType = "Video",
        CancellationToken cancellationToken = default);

    Task<VideoUploadAsset> ValidateAndClaimAssetAsync(
        Guid uploadId,
        string userId,
        bool isAdmin,
        Guid videoId,
        CancellationToken cancellationToken = default);

    Task<VideoUploadAsset?> GetAssetByIdAsync(
        Guid uploadId,
        CancellationToken cancellationToken = default);
}
