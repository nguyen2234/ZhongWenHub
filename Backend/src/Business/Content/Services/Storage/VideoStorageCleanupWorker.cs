using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ZhongWenHub.Business.Content.Services.Storage;

public class VideoStorageCleanupWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<VideoStorageCleanupWorker> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(30);

    public VideoStorageCleanupWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<VideoStorageCleanupWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("VideoStorageCleanupWorker background service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var cleanupService = scope.ServiceProvider.GetRequiredService<IStorageCleanupService>();
                var processed = await cleanupService.ProcessPendingCleanupsAsync(batchSize: 10, stoppingToken);
                if (processed > 0)
                {
                    _logger.LogInformation("VideoStorageCleanupWorker successfully cleaned up {Count} orphan storage files.", processed);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "VideoStorageCleanupWorker encountered an error during batch processing cycle.");
            }

            try
            {
                await Task.Delay(_checkInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }

        _logger.LogInformation("VideoStorageCleanupWorker background service stopped.");
    }
}
