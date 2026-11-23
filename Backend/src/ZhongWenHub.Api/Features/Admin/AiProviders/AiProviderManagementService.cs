using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Common.AI;
using ZhongWenHub.Data;
using ZhongWenHub.Data.Entities.AI;
using ZhongWenHub.Features.admin.AiProviders.DTO;

namespace ZhongWenHub.Features.admin.AiProviders;

public class AiProviderManagementService : IAiProviderManagementService
{
    private readonly ApplicationDbContext _context;
    private readonly IEnumerable<IAiProviderAdapter> _adapters;
    private readonly IAiProviderSecretProtector _secretProtector;
    private readonly ILogger<AiProviderManagementService> _logger;

    public AiProviderManagementService(
        ApplicationDbContext context,
        IEnumerable<IAiProviderAdapter> adapters,
        IAiProviderSecretProtector secretProtector,
        ILogger<AiProviderManagementService> logger)
    {
        _context = context;
        _adapters = adapters;
        _secretProtector = secretProtector;
        _logger = logger;
    }

    public async Task<List<AiProviderResponse>> GetAllAsync(CancellationToken ct = default)
    {
        var providers = await _context.AiProviderConfigurations
            .AsNoTracking()
            .OrderBy(p => p.Priority)
            .ThenBy(p => p.CreatedAt)
            .ToListAsync(ct);

        return providers.Select(MapToResponse).ToList();
    }

    public async Task<AiProviderResponse?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var provider = await _context.AiProviderConfigurations
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        return provider == null ? null : MapToResponse(provider);
    }

    public async Task<AiProviderResponse> CreateAsync(CreateAiProviderRequest request, CancellationToken ct = default)
    {
        ValidateBaseUrl(request.BaseUrl);

        var encryptedKey = _secretProtector.Encrypt(request.ApiKey);

        var entity = new AiProviderConfiguration
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            ProviderType = request.ProviderType.ToUpperInvariant().Trim(),
            BaseUrl = string.IsNullOrWhiteSpace(request.BaseUrl) ? null : request.BaseUrl.Trim(),
            EncryptedApiKey = encryptedKey,
            DefaultModel = request.DefaultModel.Trim(),
            CapabilitiesJson = JsonSerializer.Serialize(request.Capabilities ?? new List<string>()),
            IsEnabled = request.IsEnabled,
            Priority = request.Priority,
            TimeoutSeconds = request.TimeoutSeconds > 0 ? request.TimeoutSeconds : 30,
            MaxRetries = request.MaxRetries >= 0 ? request.MaxRetries : 2,
            MaxTokens = request.MaxTokens,
            Temperature = request.Temperature,
            LastHealthStatus = "UNCHECKED",
            CreatedAt = DateTime.UtcNow
        };

        _context.AiProviderConfigurations.Add(entity);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Created new AI provider configuration '{Name}' ({Id}).", entity.Name, entity.Id);
        return MapToResponse(entity);
    }

    public async Task<AiProviderResponse?> UpdateAsync(Guid id, UpdateAiProviderRequest request, CancellationToken ct = default)
    {
        ValidateBaseUrl(request.BaseUrl);

        var entity = await _context.AiProviderConfigurations.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (entity == null)
        {
            return null;
        }

        entity.Name = request.Name.Trim();
        entity.ProviderType = request.ProviderType.ToUpperInvariant().Trim();
        entity.BaseUrl = string.IsNullOrWhiteSpace(request.BaseUrl) ? null : request.BaseUrl.Trim();

        if (!string.IsNullOrWhiteSpace(request.ApiKey))
        {
            entity.EncryptedApiKey = _secretProtector.Encrypt(request.ApiKey);
        }

        entity.DefaultModel = request.DefaultModel.Trim();
        entity.CapabilitiesJson = JsonSerializer.Serialize(request.Capabilities ?? new List<string>());
        entity.IsEnabled = request.IsEnabled;
        entity.Priority = request.Priority;
        entity.TimeoutSeconds = request.TimeoutSeconds > 0 ? request.TimeoutSeconds : 30;
        entity.MaxRetries = request.MaxRetries >= 0 ? request.MaxRetries : 2;
        entity.MaxTokens = request.MaxTokens;
        entity.Temperature = request.Temperature;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        _logger.LogInformation("Updated AI provider configuration '{Name}' ({Id}).", entity.Name, entity.Id);

        return MapToResponse(entity);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _context.AiProviderConfigurations.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (entity == null)
        {
            return false;
        }

        _context.AiProviderConfigurations.Remove(entity);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Deleted AI provider configuration '{Name}' ({Id}).", entity.Name, entity.Id);
        return true;
    }

    public async Task<bool> ToggleEnabledAsync(Guid id, bool isEnabled, CancellationToken ct = default)
    {
        var entity = await _context.AiProviderConfigurations.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (entity == null)
        {
            return false;
        }

        entity.IsEnabled = isEnabled;
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Toggled AI provider '{Name}' enabled status to {IsEnabled}.", entity.Name, isEnabled);
        return true;
    }

    public async Task UpdatePrioritiesAsync(UpdateProviderPrioritiesRequest request, CancellationToken ct = default)
    {
        if (request.Priorities == null || request.Priorities.Count == 0)
        {
            return;
        }

        var ids = request.Priorities.Select(p => p.Id).ToList();
        var entities = await _context.AiProviderConfigurations.Where(p => ids.Contains(p.Id)).ToListAsync(ct);

        foreach (var entity in entities)
        {
            var item = request.Priorities.FirstOrDefault(p => p.Id == entity.Id);
            if (item != null)
            {
                entity.Priority = item.Priority;
                entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync(ct);
        _logger.LogInformation("Updated priorities for {Count} AI providers.", entities.Count);
    }

    public async Task<TestProviderResponse> TestConnectionAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _context.AiProviderConfigurations.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (entity == null)
        {
            throw new KeyNotFoundException($"AI Provider with ID '{id}' not found.");
        }

        var adapter = _adapters.FirstOrDefault(a => 
            string.Equals(a.ProviderType, entity.ProviderType, StringComparison.OrdinalIgnoreCase));

        if (adapter == null)
        {
            return new TestProviderResponse
            {
                IsSuccess = false,
                StatusCode = 400,
                LatencyMs = 0,
                Message = $"No adapter registered for provider type '{entity.ProviderType}'.",
                Status = "UNHEALTHY",
                TestedAt = DateTime.UtcNow
            };
        }

        var apiKey = _secretProtector.Decrypt(entity.EncryptedApiKey);
        var result = await adapter.TestConnectionAsync(entity, apiKey, ct);

        entity.LastHealthStatus = result.IsSuccess ? "HEALTHY" : (result.StatusCode == 429 ? "DEGRADED" : "UNHEALTHY");
        entity.LastHealthMessage = result.Message;
        entity.LastCheckedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        return new TestProviderResponse
        {
            IsSuccess = result.IsSuccess,
            StatusCode = result.StatusCode,
            LatencyMs = result.LatencyMs,
            Message = result.Message,
            Status = entity.LastHealthStatus,
            TestedAt = entity.LastCheckedAt.Value
        };
    }

    public async Task<AiUsageSummaryDto> GetUsageSummaryAsync(int days = 7, CancellationToken ct = default)
    {
        var since = DateTime.UtcNow.AddDays(-Math.Max(1, days));
        var logs = await _context.AiUsageLogs
            .AsNoTracking()
            .Where(l => l.CreatedAt >= since)
            .ToListAsync(ct);

        var totalRequests = logs.Count;
        var successfulRequests = logs.Count(l => l.Success);
        var failedRequests = totalRequests - successfulRequests;
        var totalTokens = logs.Sum(l => l.TotalTokens);
        var avgLatency = totalRequests > 0 ? logs.Average(l => l.LatencyMs) : 0;

        var breakdowns = logs
            .GroupBy(l => l.Provider)
            .Select(g => new ProviderUsageBreakdownDto
            {
                Provider = g.Key,
                Requests = g.Count(),
                SuccessRequests = g.Count(l => l.Success),
                TotalTokens = g.Sum(l => l.TotalTokens),
                AverageLatencyMs = g.Average(l => l.LatencyMs)
            })
            .OrderByDescending(b => b.Requests)
            .ToList();

        return new AiUsageSummaryDto
        {
            TotalRequests = totalRequests,
            SuccessfulRequests = successfulRequests,
            FailedRequests = failedRequests,
            TotalTokens = totalTokens,
            AverageLatencyMs = Math.Round(avgLatency, 2),
            Providers = breakdowns
        };
    }

    private AiProviderResponse MapToResponse(AiProviderConfiguration entity)
    {
        var decryptedKey = _secretProtector.Decrypt(entity.EncryptedApiKey);
        var maskedKey = _secretProtector.Mask(decryptedKey);

        List<string> caps = new();
        if (!string.IsNullOrWhiteSpace(entity.CapabilitiesJson))
        {
            try
            {
                caps = JsonSerializer.Deserialize<List<string>>(entity.CapabilitiesJson) ?? new();
            }
            catch
            {
                // ignore
            }
        }

        return new AiProviderResponse
        {
            Id = entity.Id,
            Name = entity.Name,
            ProviderType = entity.ProviderType,
            BaseUrl = entity.BaseUrl,
            MaskedApiKey = maskedKey,
            DefaultModel = entity.DefaultModel,
            Capabilities = caps,
            IsEnabled = entity.IsEnabled,
            Priority = entity.Priority,
            TimeoutSeconds = entity.TimeoutSeconds,
            MaxRetries = entity.MaxRetries,
            MaxTokens = entity.MaxTokens,
            Temperature = entity.Temperature,
            LastHealthStatus = entity.LastHealthStatus,
            LastHealthMessage = entity.LastHealthMessage,
            LastCheckedAt = entity.LastCheckedAt,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }

    public static void ValidateBaseUrl(string? baseUrl)
    {
        SsrfProtection.ValidateBaseUrl(baseUrl);
    }
}
