using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.Content.Services.Storage;

public class StorageCleanupService : IStorageCleanupService
{
    private readonly ApplicationDbContext _context;
    private readonly IVideoStorageService _storageService;
    private readonly ILogger<StorageCleanupService> _logger;

    public StorageCleanupService(
        ApplicationDbContext context,
        IVideoStorageService storageService,
        ILogger<StorageCleanupService> logger)
    {
        _context = context;
        _storageService = storageService;
        _logger = logger;
    }

    public async Task QueueCleanupJobAsync(
        string storagePath,
        string provider,
        string reason,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(storagePath)) return;

        var job = new VideoStorageCleanupJob
        {
            Id = Guid.NewGuid(),
            StoragePath = storagePath.Trim(),
            StorageProvider = string.IsNullOrWhiteSpace(provider) ? _storageService.ProviderName : provider.Trim(),
            Status = VideoStorageCleanupStatus.Pending,
            Reason = string.IsNullOrWhiteSpace(reason) ? "VideoDeleted" : reason.Trim(),
            RetryCount = 0,
            NextRetryAt = null,
            LastError = null,
            CreatedAt = DateTime.UtcNow,
            ProcessedAt = null
        };

        _context.VideoStorageCleanupJobs.Add(job);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Enqueued durable storage cleanup job: JobId={JobId}, Path={Path}, Reason={Reason}",
            job.Id, job.StoragePath, job.Reason);
    }

    public async Task RecordFailedCleanupAsync(
        string storagePath,
        string provider,
        string reason,
        string? errorMessage,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(storagePath)) return;

        var job = new VideoStorageCleanupJob
        {
            Id = Guid.NewGuid(),
            StoragePath = storagePath.Trim(),
            StorageProvider = string.IsNullOrWhiteSpace(provider) ? _storageService.ProviderName : provider.Trim(),
            Status = VideoStorageCleanupStatus.Pending,
            Reason = string.IsNullOrWhiteSpace(reason) ? "ManualOrphanCleanup" : reason.Trim(),
            RetryCount = 1,
            NextRetryAt = DateTime.UtcNow.AddSeconds(10),
            LastError = errorMessage,
            CreatedAt = DateTime.UtcNow
        };

        try
        {
            _context.VideoStorageCleanupJobs.Add(job);
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not persist cleanup job to database (table might be pending migration): {Path}", storagePath);
        }
    }

    public Task<int> ProcessPendingCleanupsAsync(CancellationToken cancellationToken = default)
    {
        return ProcessPendingCleanupsAsync(10, cancellationToken);
    }

    public async Task<int> ProcessPendingCleanupsAsync(
        int batchSize = 10,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var workerId = $"Worker-{Environment.MachineName}-{Environment.ProcessId}";

        List<VideoStorageCleanupJob> candidateJobs;
        try
        {
            // Select eligible pending or expired lease jobs
            candidateJobs = await _context.VideoStorageCleanupJobs
                .Where(j => (j.Status == VideoStorageCleanupStatus.Pending ||
                            (j.Status == VideoStorageCleanupStatus.Processing && j.LeaseExpiresAt != null && j.LeaseExpiresAt <= now))
                         && (j.NextRetryAt == null || j.NextRetryAt <= now)
                         && j.RetryCount < 5)
                .OrderBy(j => j.CreatedAt)
                .Take(batchSize)
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cannot query VideoStorageCleanupJobs. Migration may be pending.");
            return 0;
        }

        if (candidateJobs.Count == 0)
        {
            return 0;
        }

        // 1. Acquire leases for candidate batch
        var leaseDuration = TimeSpan.FromMinutes(5);
        foreach (var job in candidateJobs)
        {
            job.Status = VideoStorageCleanupStatus.Processing;
            job.LeaseOwner = workerId;
            job.LeaseExpiresAt = now.Add(leaseDuration);
        }

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to acquire leases for cleanup jobs batch.");
            return 0;
        }

        var processedCount = 0;

        // 2. Process each claimed job
        foreach (var job in candidateJobs)
        {
            // Cross-reference safety check: is file still referenced anywhere?
            var isReferencedInVideos = await _context.LearningVideos
                .AnyAsync(v => v.StoragePath == job.StoragePath, cancellationToken);

            var isReferencedInAssets = await _context.VideoUploadAssets
                .AnyAsync(a => a.StoragePath == job.StoragePath && a.UploadStatus == VideoUploadAssetStatus.Linked, cancellationToken);

            if (isReferencedInVideos || isReferencedInAssets)
            {
                _logger.LogInformation(
                    "Skipping physical file deletion for {Path}: still referenced by active video or linked asset. Marking job completed.",
                    job.StoragePath);

                job.Status = VideoStorageCleanupStatus.Completed;
                job.ProcessedAt = DateTime.UtcNow;
                job.LastError = "Skipped physical deletion: file is referenced by active video/asset.";
                job.LeaseOwner = null;
                job.LeaseExpiresAt = null;
                continue;
            }

            try
            {
                var deleted = await _storageService.DeleteFileAsync(job.StoragePath, cancellationToken);
                if (deleted)
                {
                    job.Status = VideoStorageCleanupStatus.Completed;
                    job.ProcessedAt = DateTime.UtcNow;
                    job.LastError = null;
                    job.LeaseOwner = null;
                    job.LeaseExpiresAt = null;
                    processedCount++;
                }
                else
                {
                    // File may be already gone or not found (idempotent retry with backoff)
                    job.RetryCount++;
                    job.LastError = "Storage provider returned false on delete attempt.";
                    var delaySec = Math.Min(3600, (int)Math.Pow(2, job.RetryCount) * 10);
                    job.NextRetryAt = DateTime.UtcNow.AddSeconds(delaySec);
                    job.Status = job.RetryCount >= 5 ? VideoStorageCleanupStatus.Failed : VideoStorageCleanupStatus.Pending;
                    job.LeaseOwner = null;
                    job.LeaseExpiresAt = null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error deleting physical storage file {Path} on retry {RetryCount}", job.StoragePath, job.RetryCount + 1);
                job.RetryCount++;
                job.LastError = ex.Message;
                var delaySec = Math.Min(3600, (int)Math.Pow(2, job.RetryCount) * 10);
                job.NextRetryAt = DateTime.UtcNow.AddSeconds(delaySec);
                job.Status = job.RetryCount >= 5 ? VideoStorageCleanupStatus.Failed : VideoStorageCleanupStatus.Pending;
                job.LeaseOwner = null;
                job.LeaseExpiresAt = null;
            }
        }

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist processed cleanup jobs batch status.");
        }

        return processedCount;
    }

    public async Task<IReadOnlyList<VideoStorageCleanupJob>> GetPendingCleanupsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _context.VideoStorageCleanupJobs
                .Where(j => j.Status == VideoStorageCleanupStatus.Pending || j.Status == VideoStorageCleanupStatus.Processing)
                .OrderByDescending(j => j.CreatedAt)
                .Take(100)
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cannot query pending cleanup jobs from database.");
            return Array.Empty<VideoStorageCleanupJob>();
        }
    }
}
