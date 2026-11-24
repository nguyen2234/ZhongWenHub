using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Features.Admin.DTOs;

namespace ZhongWenHub.Features.Admin;

public interface IAdminOperationsService
{
    Task<AdminAIOperationsStatsDto> GetAIOperationsStatsAsync(CancellationToken cancellationToken = default);

    Task<AdminAnalyticsReportDto> GetAnalyticsReportAsync(string range = "30d", CancellationToken cancellationToken = default);

    Task<AdminSystemSettingsDto> GetSystemSettingsAsync(CancellationToken cancellationToken = default);

    Task<AdminSystemSettingsDto> UpdateSystemSettingsAsync(AdminSystemSettingsDto dto, CancellationToken cancellationToken = default);
}
