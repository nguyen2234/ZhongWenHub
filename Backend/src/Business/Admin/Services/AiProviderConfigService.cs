using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Business.Admin.DTOs;
using ZhongWenHub.Data.Entities.AI;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.Admin.Services;

public class AiProviderConfigService : IAiProviderConfigService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AiProviderConfigService> _logger;
    private readonly string _encryptionSecret;

    public AiProviderConfigService(
        ApplicationDbContext dbContext,
        IConfiguration configuration,
        ILogger<AiProviderConfigService> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;
        _encryptionSecret = _configuration["JwtSettings:Secret"] ?? "ZhongWenHub_Default_AES_Secret_Key_32_Bytes!";
    }

    public async Task<List<AiProviderConfigDto>> GetProvidersAsync(CancellationToken cancellationToken = default)
    {
        var entities = await _dbContext.AiProviderConfigs
            .AsNoTracking()
            .OrderByDescending(p => p.IsDefault)
            .ThenBy(p => p.DisplayName)
            .ToListAsync(cancellationToken);

        if (!entities.Any())
        {
            await SeedDefaultProvidersAsync(cancellationToken);
            entities = await _dbContext.AiProviderConfigs
                .AsNoTracking()
                .OrderByDescending(p => p.IsDefault)
                .ThenBy(p => p.DisplayName)
                .ToListAsync(cancellationToken);
        }

        return entities.Select(MapToDto).ToList();
    }

    public async Task<AiProviderConfigDto?> GetProviderByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.AiProviderConfigs.FindAsync(new object[] { id }, cancellationToken);
        return entity == null ? null : MapToDto(entity);
    }

    public async Task<AiProviderConfigDto> CreateProviderAsync(CreateAiProviderDto dto, CancellationToken cancellationToken = default)
    {
        await ValidateBaseUrlSecurityAsync(dto.BaseUrl);

        var existing = await _dbContext.AiProviderConfigs
            .AnyAsync(p => p.ProviderCode == dto.ProviderCode.ToLowerInvariant(), cancellationToken);
        if (existing)
        {
            throw new InvalidOperationException($"Mã provider '{dto.ProviderCode}' đã tồn tại trên hệ thống.");
        }

        if (dto.IsDefault)
        {
            var otherDefaults = await _dbContext.AiProviderConfigs.Where(p => p.IsDefault).ToListAsync(cancellationToken);
            foreach (var od in otherDefaults) od.IsDefault = false;
        }

        var now = DateTime.UtcNow;
        var masked = MaskApiKey(dto.ApiKey);

        var entity = new AiProviderConfigEntity
        {
            Id = Guid.NewGuid(),
            ProviderCode = dto.ProviderCode.ToLowerInvariant().Trim(),
            DisplayName = dto.DisplayName.Trim(),
            BaseUrl = dto.BaseUrl.Trim(),
            ModelNamesJson = JsonSerializer.Serialize(dto.ModelNames ?? new List<string>()),
            IsEnabled = true,
            IsDefault = dto.IsDefault,
            MaskedApiKey = masked,
            EncryptedApiKey = EncryptSecret(dto.ApiKey, _encryptionSecret),
            MonthlyBudgetUsd = dto.MonthlyBudgetUsd,
            CurrentUsageUsd = 0.00m,
            RateLimitPerMinute = dto.RateLimitPerMinute,
            HealthStatus = "ONLINE",
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.AiProviderConfigs.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created new AI provider configuration {ProviderCode}", entity.ProviderCode);
        return MapToDto(entity);
    }

    public async Task<AiProviderConfigDto> UpdateProviderAsync(Guid id, UpdateAiProviderDto dto, CancellationToken cancellationToken = default)
    {
        await ValidateBaseUrlSecurityAsync(dto.BaseUrl);

        var entity = await _dbContext.AiProviderConfigs.FindAsync(new object[] { id }, cancellationToken);
        if (entity == null)
        {
            throw new KeyNotFoundException("Không tìm thấy cấu hình AI provider yêu cầu.");
        }

        if (dto.IsDefault && !entity.IsDefault)
        {
            var otherDefaults = await _dbContext.AiProviderConfigs.Where(p => p.IsDefault && p.Id != id).ToListAsync(cancellationToken);
            foreach (var od in otherDefaults) od.IsDefault = false;
        }

        entity.DisplayName = dto.DisplayName.Trim();
        entity.BaseUrl = dto.BaseUrl.Trim();
        entity.ModelNamesJson = JsonSerializer.Serialize(dto.ModelNames ?? new List<string>());
        entity.MonthlyBudgetUsd = dto.MonthlyBudgetUsd;
        entity.RateLimitPerMinute = dto.RateLimitPerMinute;
        entity.IsDefault = dto.IsDefault;
        entity.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(dto.ApiKey))
        {
            entity.MaskedApiKey = MaskApiKey(dto.ApiKey);
            entity.EncryptedApiKey = EncryptSecret(dto.ApiKey, _encryptionSecret);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return MapToDto(entity);
    }

    public async Task<AiProviderConfigDto> ToggleProviderAsync(Guid id, bool isEnabled, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.AiProviderConfigs.FindAsync(new object[] { id }, cancellationToken);
        if (entity == null)
        {
            throw new KeyNotFoundException("Không tìm thấy cấu hình AI provider yêu cầu.");
        }

        entity.IsEnabled = isEnabled;
        entity.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapToDto(entity);
    }

    public async Task<TestAiProviderResultDto> TestConnectionAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.AiProviderConfigs.FindAsync(new object[] { id }, cancellationToken);
        if (entity == null)
        {
            throw new KeyNotFoundException("Không tìm thấy cấu hình AI provider yêu cầu.");
        }

        // SSRF Check again before issuing any request
        await ValidateBaseUrlSecurityAsync(entity.BaseUrl);

        var sw = Stopwatch.StartNew();
        var now = DateTime.UtcNow;

        // Disallow auto-redirect to prevent redirect SSRF into internal networks
        using var handler = new SocketsHttpHandler
        {
            AllowAutoRedirect = false,
            ConnectTimeout = TimeSpan.FromSeconds(5)
        };
        using var client = new HttpClient(handler)
        {
            Timeout = TimeSpan.FromSeconds(5)
        };

        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Head, entity.BaseUrl);
            var resp = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            sw.Stop();

            entity.LatencyMs = (int)sw.ElapsedMilliseconds;
            entity.HealthStatus = "HEALTHY";
            entity.LastCheckedAt = now;
            entity.LastError = null;
            await _dbContext.SaveChangesAsync(cancellationToken);

            return new TestAiProviderResultDto
            {
                Success = true,
                LatencyMs = (int)sw.ElapsedMilliseconds,
                Message = $"Kết nối thành công (HTTP {(int)resp.StatusCode}). Độ trễ: {sw.ElapsedMilliseconds}ms.",
                CheckedAt = now
            };
        }
        catch (Exception ex)
        {
            sw.Stop();
            entity.LatencyMs = null;
            entity.HealthStatus = "DEGRADED";
            entity.LastCheckedAt = now;
            entity.LastError = ex.Message;
            await _dbContext.SaveChangesAsync(cancellationToken);

            return new TestAiProviderResultDto
            {
                Success = false,
                LatencyMs = null,
                Message = $"Không thể kết nối đến endpoint: {ex.Message}",
                CheckedAt = now
            };
        }
    }

    private async Task SeedDefaultProvidersAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var seedList = new List<AiProviderConfigEntity>
        {
            new()
            {
                Id = Guid.NewGuid(),
                ProviderCode = "gemini",
                DisplayName = "Google Gemini 2.5",
                BaseUrl = "https://generativelanguage.googleapis.com",
                ModelNamesJson = JsonSerializer.Serialize(new[] { "gemini-2.5-flash", "gemini-2.5-pro" }),
                IsEnabled = true,
                IsDefault = true,
                MaskedApiKey = "AIzaSy...****89A",
                EncryptedApiKey = EncryptSecret("AIzaSyFakeKey1234567890abcdef89A", _encryptionSecret),
                MonthlyBudgetUsd = 150.00m,
                CurrentUsageUsd = 24.50m,
                RateLimitPerMinute = 120,
                HealthStatus = "HEALTHY",
                LatencyMs = 210,
                LastCheckedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            },
            new()
            {
                Id = Guid.NewGuid(),
                ProviderCode = "whisper-speech",
                DisplayName = "Whisper-Large & FunASR Speech",
                BaseUrl = "https://api.openai.com/v1",
                ModelNamesJson = JsonSerializer.Serialize(new[] { "whisper-1", "funasr-speech-v1" }),
                IsEnabled = true,
                IsDefault = false,
                MaskedApiKey = "sk-proj...****X9Z",
                EncryptedApiKey = EncryptSecret("sk-projFakeSecretKey9876543210X9Z", _encryptionSecret),
                MonthlyBudgetUsd = 80.00m,
                CurrentUsageUsd = 12.80m,
                RateLimitPerMinute = 60,
                HealthStatus = "ONLINE",
                LatencyMs = 340,
                LastCheckedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            },
            new()
            {
                Id = Guid.NewGuid(),
                ProviderCode = "deepseek",
                DisplayName = "DeepSeek Pedagogical Chat",
                BaseUrl = "https://api.deepseek.com",
                ModelNamesJson = JsonSerializer.Serialize(new[] { "deepseek-chat", "deepseek-reasoner" }),
                IsEnabled = true,
                IsDefault = false,
                MaskedApiKey = "sk-dpsk...****M3C",
                EncryptedApiKey = EncryptSecret("sk-dpskFakeKey456789123M3C", _encryptionSecret),
                MonthlyBudgetUsd = 50.00m,
                CurrentUsageUsd = 6.20m,
                RateLimitPerMinute = 60,
                HealthStatus = "ONLINE",
                LatencyMs = 280,
                LastCheckedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            }
        };

        _dbContext.AiProviderConfigs.AddRange(seedList);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public static async Task ValidateBaseUrlSecurityAsync(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            throw new ArgumentException("Base URL không phải là một địa chỉ URI hợp lệ.");
        }

        if (uri.Scheme != Uri.UriSchemeHttps && !uri.IsLoopback)
        {
            throw new ArgumentException("Để đảm bảo an toàn bảo mật, Base URL của AI Provider phải sử dụng giao thức HTTPS.");
        }

        // Prevent DNS Rebinding & resolve IPs
        IPAddress[] addresses;
        try
        {
            addresses = await Dns.GetHostAddressesAsync(uri.DnsSafeHost);
        }
        catch (Exception ex)
        {
            throw new ArgumentException($"Không thể phân giải địa chỉ máy chủ '{uri.DnsSafeHost}': {ex.Message}");
        }

        if (addresses.Length == 0)
        {
            throw new ArgumentException($"Không tìm thấy địa chỉ IP hợp lệ cho tên miền '{uri.DnsSafeHost}'.");
        }

        foreach (var ip in addresses)
        {
            if (IsPrivateOrRestrictedIp(ip))
            {
                throw new ArgumentException($"Địa chỉ máy chủ '{uri.DnsSafeHost}' ({ip}) thuộc dải mạng nội bộ hoặc bị hạn chế bảo mật (SSRF Guard).");
            }
        }
    }

    public static bool IsPrivateOrRestrictedIp(IPAddress ip)
    {
        if (IPAddress.IsLoopback(ip)) return true;
        if (ip.IsIPv4MappedToIPv6) ip = ip.MapToIPv4();

        if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
        {
            var b = ip.GetAddressBytes();
            if (b[0] == 0) return true; // 0.0.0.0/8
            if (b[0] == 10) return true; // 10.0.0.0/8
            if (b[0] == 127) return true; // 127.0.0.0/8
            if (b[0] == 169 && b[1] == 254) return true; // 169.254.0.0/16 Link-local & Cloud Metadata
            if (b[0] == 172 && b[1] >= 16 && b[1] <= 31) return true; // 172.16.0.0/12
            if (b[0] == 192 && b[1] == 168) return true; // 192.168.0.0/16
            if (b[0] >= 224 && b[0] <= 239) return true; // Multicast
            if (b[0] >= 240) return true; // Reserved
            if (b[0] == 255 && b[1] == 255 && b[2] == 255 && b[3] == 255) return true; // Broadcast
        }
        else if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6)
        {
            if (ip.IsIPv6LinkLocal || ip.IsIPv6SiteLocal || ip.IsIPv6Multicast || ip.IsIPv6UniqueLocal)
                return true;
        }

        return false;
    }

    private static string MaskApiKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key)) return string.Empty;
        var trimmed = key.Trim();
        if (trimmed.Length <= 8) return "••••••••";
        var prefix = trimmed[..Math.Min(6, trimmed.Length)];
        var suffix = trimmed[^Math.Min(4, trimmed.Length)..];
        return $"{prefix}...****{suffix}";
    }

    private static string EncryptSecret(string plaintext, string secretKey)
    {
        if (string.IsNullOrEmpty(plaintext)) return string.Empty;
        using var aes = Aes.Create();
        aes.Key = SHA256.HashData(Encoding.UTF8.GetBytes(secretKey));
        aes.GenerateIV();
        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        var plainBytes = Encoding.UTF8.GetBytes(plaintext);
        var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);
        var combined = new byte[aes.IV.Length + cipherBytes.Length];
        Buffer.BlockCopy(aes.IV, 0, combined, 0, aes.IV.Length);
        Buffer.BlockCopy(cipherBytes, 0, combined, aes.IV.Length, cipherBytes.Length);
        return Convert.ToBase64String(combined);
    }

    private static AiProviderConfigDto MapToDto(AiProviderConfigEntity entity)
    {
        List<string> models;
        try
        {
            models = JsonSerializer.Deserialize<List<string>>(entity.ModelNamesJson) ?? new();
        }
        catch
        {
            models = new();
        }

        return new AiProviderConfigDto
        {
            Id = entity.Id,
            ProviderCode = entity.ProviderCode,
            DisplayName = entity.DisplayName,
            BaseUrl = entity.BaseUrl,
            ModelNames = models,
            IsEnabled = entity.IsEnabled,
            IsDefault = entity.IsDefault,
            MaskedApiKey = entity.MaskedApiKey,
            MonthlyBudgetUsd = entity.MonthlyBudgetUsd,
            CurrentUsageUsd = entity.CurrentUsageUsd,
            RateLimitPerMinute = entity.RateLimitPerMinute,
            HealthStatus = entity.HealthStatus,
            LatencyMs = entity.LatencyMs,
            LastCheckedAt = entity.LastCheckedAt,
            LastError = entity.LastError,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }
}
