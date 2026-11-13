using System;
using System.Collections.Concurrent;
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

    // Resilient in-memory fallback queue in case DB migration is in Pending state
    private static readonly ConcurrentBag<VideoStorageCleanupJob> FallbackQueue = new();

    public StorageCleanupService(
        ApplicationDbContext context,
        IVideoStorageService storageService,
        ILogger<StorageCleanupService> logger)
    {
        _context = context;
        _storageService = storageService;
        _logger = logger;
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
            StorageProvider = provider ?? "Unknown",
            Reason = reason ?? "ManualOrphanCleanup",
            RetryCount = 0,
            LastError = errorMessage,
            CreatedAt = DateTime.UtcNow,
            IsCompleted = false
        };

        _logger.LogWarning(
            "Recording storage cleanup job for orphan file: Path={Path}, Provider={Provider}, Reason={Reason}, Error={Error}",
            job.StoragePath, job.StorageProvider, job.Reason, job.LastError);

        try
        {
            _context.Set<VideoStorageCleanupJob>().Add(job);
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not persist cleanup job to database (table might be pending migration). Storing in resilient memory queue.");
            FallbackQueue.Add(job);
        }
    }

    public async Task<int> ProcessPendingCleanupsAsync(CancellationToken cancellationToken = default)
    {
        var processedCount = 0;

        // 1. Process in-memory fallback items
        var inMemoryItems = FallbackQueue.Where(j => !j.IsCompleted && j.RetryCount < 5).ToList();
        foreach (var job in inMemoryItems)
        {
            try
            {
                var deleted = await _storageService.DeleteFileAsync(job.StoragePath, cancellationToken);
                if (deleted)
                {
                    job.IsCompleted = true;
                    job.ProcessedAt = DateTime.UtcNow;
                    processedCount++;
                }
                else
                {
                    job.RetryCount++;
                }
            }
            catch (Exception ex)
            {
                job.RetryCount++;
                job.LastError = ex.Message;
            }
        }

        // 2. Process DB pending items
        try
        {
            var dbJobs = await _context.Set<VideoStorageCleanupJob>()
                .Where(j => !j.IsCompleted && j.RetryCount < 5)
                .OrderBy(j => j.CreatedAt)
                .Take(50)
                .ToListAsync(cancellationToken);

            foreach (var job in dbJobs)
            {
                try
                {
                    var deleted = await _storageService.DeleteFileAsync(job.StoragePath, cancellationToken);
                    if (deleted)
                    {
                        job.IsCompleted = true;
                        job.ProcessedAt = DateTime.UtcNow;
                        processedCount++;
                    }
                    else
                    {
                        job.RetryCount++;
                        job.LastError = "Storage returned false on delete attempt";
                    }
                }
                catch (Exception ex)
                {
                    job.RetryCount++;
                    job.LastError = ex.Message;
                }
            }

            if (dbJobs.Count > 0)
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not query pending cleanup jobs from database table.");
        }

        return processedCount;
    }

    public async Task<IReadOnlyList<VideoStorageCleanupJob>> GetPendingCleanupsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _context.Set<VideoStorageCleanupJob>()
                .Where(j => !j.IsCompleted)
                .OrderByDescending(j => j.CreatedAt)
                .Take(100)
                .ToListAsync(cancellationToken);
        }
        catch
        {
            return FallbackQueue.Where(j => !j.IsCompleted).ToList();
        }
    }
}
