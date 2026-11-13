using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Data.Entities.Content;

namespace ZhongWenHub.Business.Content.Services.Storage;

public interface IStorageCleanupService
{
    Task QueueCleanupJobAsync(
        string storagePath,
        string provider,
        string reason,
        CancellationToken cancellationToken = default);

    Task RecordFailedCleanupAsync(
        string storagePath,
        string provider,
        string reason,
        string? errorMessage,
        CancellationToken cancellationToken = default);

    Task<int> ProcessPendingCleanupsAsync(
        CancellationToken cancellationToken = default);

    Task<int> ProcessPendingCleanupsAsync(
        int batchSize,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<VideoStorageCleanupJob>> GetPendingCleanupsAsync(
        CancellationToken cancellationToken = default);
}
