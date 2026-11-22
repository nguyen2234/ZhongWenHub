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
    private readonly TimeSpan _normalInterval = TimeSpan.FromSeconds(30);
    private readonly TimeSpan _missingTableInterval = TimeSpan.FromMinutes(5);

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

        // Track whether we have already emitted the "table missing" warning so we
        // do not spam the log on every retry cycle.
        bool missingTableWarningEmitted = false;

        while (!stoppingToken.IsCancellationRequested)
        {
            TimeSpan nextDelay = _normalInterval;

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var cleanupService = scope.ServiceProvider.GetRequiredService<IStorageCleanupService>();
                var processed = await cleanupService.ProcessPendingCleanupsAsync(batchSize: 10, stoppingToken);
                if (processed > 0)
                {
                    _logger.LogInformation(
                        "VideoStorageCleanupWorker successfully cleaned up {Count} orphan storage files.", processed);
                }

                // If we reach here, the table exists — reset the warning flag.
                missingTableWarningEmitted = false;
            }
            catch (CleanupTableMissingException ex)
            {
                // The cleanup table does not exist yet (pending migration).
                // Log once at Warning level; afterwards only log at Debug to avoid spam.
                if (!missingTableWarningEmitted)
                {
                    _logger.LogWarning(
                        "VideoStorageCleanupWorker: {Message} " +
                        "Worker will retry every {IntervalMinutes} minute(s) until migrations are applied. " +
                        "Run: dotnet ef database update --project Backend/ZhongWenHub/ZhongWenHub.csproj -- " +
                        "--connection \"<your-dev-connection-string>\"",
                        ex.Message,
                        _missingTableInterval.TotalMinutes);
                    missingTableWarningEmitted = true;
                }
                else
                {
                    _logger.LogDebug(
                        "VideoStorageCleanupWorker: cleanup table still missing, backing off {IntervalMinutes} minute(s).",
                        _missingTableInterval.TotalMinutes);
                }

                nextDelay = _missingTableInterval;
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
                await Task.Delay(nextDelay, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }

        _logger.LogInformation("VideoStorageCleanupWorker background service stopped.");
    }
}
