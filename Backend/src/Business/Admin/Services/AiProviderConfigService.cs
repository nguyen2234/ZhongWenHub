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
using Microsoft.Extensions.Hosting;
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
        ILogger<AiProviderConfigService> logger,
        IHostEnvironment? hostEnvironment = null)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;
        var key = _configuration["AiSecurity:EncryptionKey"];
        if (string.IsNullOrWhiteSpace(key))
        {
            key = Environment.GetEnvironmentVariable("AI_ENCRYPTION_KEY");
        }
        var isProduction = hostEnvironment != null
            ? hostEnvironment.IsProduction()
            : string.Equals(Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"), "Production", StringComparison.OrdinalIgnoreCase) ||
              string.Equals(_configuration["ASPNETCORE_ENVIRONMENT"], "Production", StringComparison.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(key) && isProduction)
        {
            throw new InvalidOperationException("AiSecurity:EncryptionKey must be configured in production via secret manager or environment variable.");
        }
        _encryptionSecret = !string.IsNullOrWhiteSpace(key) ? key : "ZhongWenHub_Development_Encryption_Fallback_Key_32B!";
    }

    public async Task<List<AiProviderConfigDto>> GetProvidersAsync(CancellationToken cancellationToken = default)
    {
        var entities = await _dbContext.AiProviderConfigs
            .AsNoTracking()
            .OrderByDescending(p => p.IsDefault)
            .ThenBy(p => p.DisplayName)
            .ToListAsync(cancellationToken);

        if (entities.Count == 0)
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

    private async Task SeedDefaultProvidersAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var defaults = new List<AiProviderConfigEntity>
        {
            new()
            {
                Id = Guid.Parse("11111111-2222-3333-4444-555555555551"),
                ProviderCode = "gemini",
                DisplayName = "Google Gemini (Official Gateway)",
                BaseUrl = "https://generativelanguage.googleapis.com",
                ModelNamesJson = JsonSerializer.Serialize(new List<string> { "gemini-2.5-flash", "gemini-2.5-pro" }),
                IsEnabled = false,
                IsDefault = true,
                MaskedApiKey = "AIzaSy...****DEFAULT",
                EncryptedApiKey = string.Empty,
                MonthlyBudgetUsd = 200.00m,
                CurrentUsageUsd = 0.00m,
                RateLimitPerMinute = 60,
                HealthStatus = "UNCONFIGURED",
                CreatedAt = now,
                UpdatedAt = now
            },
            new()
            {
                Id = Guid.Parse("11111111-2222-3333-4444-555555555552"),
                ProviderCode = "openai",
                DisplayName = "OpenAI GPT (Direct)",
                BaseUrl = "https://api.openai.com",
                ModelNamesJson = JsonSerializer.Serialize(new List<string> { "gpt-4o-mini", "gpt-4o" }),
                IsEnabled = false,
                IsDefault = false,
                MaskedApiKey = "sk-proj...****DEFAULT",
                EncryptedApiKey = string.Empty,
                MonthlyBudgetUsd = 300.00m,
                CurrentUsageUsd = 0.00m,
                RateLimitPerMinute = 120,
                HealthStatus = "UNCONFIGURED",
                CreatedAt = now,
                UpdatedAt = now
            }
        };

        _dbContext.AiProviderConfigs.AddRange(defaults);
        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            // Concurrent seed guard
        }
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

        // Anti-DNS-rebinding SocketsHttpHandler with ConnectCallback
        using var handler = new SocketsHttpHandler
        {
            UseProxy = false, // explicitly disable proxy to prevent SSRF bypass
            AllowAutoRedirect = false,
            ConnectTimeout = TimeSpan.FromSeconds(5),
            ConnectCallback = async (context, ct) =>
            {
                var host = context.DnsEndPoint.Host;
                var port = context.DnsEndPoint.Port;
                var addresses = await Dns.GetHostAddressesAsync(host, ct);
                if (addresses.Length == 0)
                {
                    throw new HttpRequestException($"Không thể phân giải địa chỉ IP cho máy chủ '{host}'.");
                }
                var targetIp = addresses.FirstOrDefault(ip => !IsPrivateOrRestrictedIp(ip));
                if (targetIp == null)
                {
                    throw new HttpRequestException($"Địa chỉ máy chủ '{host}' thuộc dải mạng nội bộ hoặc bị hạn chế bảo mật (SSRF Guard).");
                }
                var socket = new System.Net.Sockets.Socket(targetIp.AddressFamily, System.Net.Sockets.SocketType.Stream, System.Net.Sockets.ProtocolType.Tcp);
                try
                {
                    await socket.ConnectAsync(new IPEndPoint(targetIp, port), ct);
                    return new System.Net.Sockets.NetworkStream(socket, ownsSocket: true);
                }
                catch
                {
                    socket.Dispose();
                    throw;
                }
            }
        };
        using var client = new HttpClient(handler)
        {
            Timeout = TimeSpan.FromSeconds(5)
        };

        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Head, entity.BaseUrl);
            var apiKey = DecryptSecret(entity.EncryptedApiKey, _encryptionSecret);
            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                if (entity.ProviderCode == "gemini")
                {
                    req.Headers.TryAddWithoutValidation("x-goog-api-key", apiKey);
                }
                else
                {
                    req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
                }
            }
            var resp = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            sw.Stop();

            var statusCode = (int)resp.StatusCode;
            var isSuccess = resp.IsSuccessStatusCode;

            entity.LatencyMs = (int)sw.ElapsedMilliseconds;
            entity.LastCheckedAt = now;

            if (isSuccess)
            {
                entity.HealthStatus = "HEALTHY";
                entity.LastError = null;
            }
            else
            {
                entity.HealthStatus = (statusCode == 401 || statusCode == 403)
                    ? "AUTH_FAILED"
                    : (statusCode >= 500 ? "DOWN" : "DEGRADED");
                entity.LastError = $"Máy chủ phản hồi mã lỗi HTTP {statusCode} ({resp.ReasonPhrase})";
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return new TestAiProviderResultDto
            {
                Success = isSuccess,
                LatencyMs = (int)sw.ElapsedMilliseconds,
                Message = isSuccess
                    ? $"Kết nối thành công (HTTP {statusCode}). Đã xác thực endpoint."
                    : $"Kết nối thất bại (HTTP {statusCode} {resp.ReasonPhrase}). Trạng thái sức khỏe: {entity.HealthStatus}.",
                CheckedAt = now
            };
        }
        catch (Exception ex)
        {
            sw.Stop();
            entity.LatencyMs = null;
            entity.HealthStatus = "DOWN";
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
            if (b[0] == 10) return true; // 10.0.0.0/8 Private
            if (b[0] == 100 && b[1] >= 64 && b[1] <= 127) return true; // 100.64.0.0/10 Carrier-grade NAT (CGNAT)
            if (b[0] == 127) return true; // 127.0.0.0/8 Loopback
            if (b[0] == 169 && b[1] == 254) return true; // 169.254.0.0/16 Link-local & Cloud Metadata
            if (b[0] == 172 && b[1] >= 16 && b[1] <= 31) return true; // 172.16.0.0/12 Private
            if (b[0] == 192 && b[1] == 168) return true; // 192.168.0.0/16 Private
            if (b[0] == 192 && b[1] == 0 && b[2] == 2) return true; // 192.0.2.0/24 TEST-NET-1
            if (b[0] == 198 && (b[1] == 18 || b[1] == 19)) return true; // 198.18.0.0/15 Benchmark
            if (b[0] == 198 && b[1] == 51 && b[2] == 100) return true; // 198.51.100.0/24 TEST-NET-2
            if (b[0] == 203 && b[1] == 0 && b[2] == 113) return true; // 203.0.113.0/24 TEST-NET-3
            if (b[0] >= 224 && b[0] <= 239) return true; // Multicast
            if (b[0] >= 240) return true; // Reserved
            if (b[0] == 255 && b[1] == 255 && b[2] == 255 && b[3] == 255) return true; // Broadcast
        }
        else if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6)
        {
            if (ip.IsIPv6LinkLocal || ip.IsIPv6SiteLocal || ip.IsIPv6Multicast || ip.IsIPv6UniqueLocal)
                return true;
            if (IPAddress.IPv6None.Equals(ip) || IPAddress.IPv6Loopback.Equals(ip) || IPAddress.IPv6Any.Equals(ip))
                return true;
            var bytes = ip.GetAddressBytes();
            if ((bytes[0] & 0xfe) == 0xfc) return true; // fc00::/7 Unique Local Address
            if (bytes[0] == 0x20 && bytes[1] == 0x01 && bytes[2] == 0x0d && bytes[3] == 0xb8) return true; // 2001:db8::/32 Documentation
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

    public static string EncryptSecret(string plaintext, string secretKey)
    {
        if (string.IsNullOrEmpty(plaintext)) return string.Empty;
        var key = SHA256.HashData(Encoding.UTF8.GetBytes(secretKey));
        var plainBytes = Encoding.UTF8.GetBytes(plaintext);
        var nonce = new byte[AesGcm.NonceByteSizes.MaxSize];
        RandomNumberGenerator.Fill(nonce);
        var cipherBytes = new byte[plainBytes.Length];
        var tag = new byte[AesGcm.TagByteSizes.MaxSize];

        using var aesGcm = new AesGcm(key, tag.Length);
        aesGcm.Encrypt(nonce, plainBytes, cipherBytes, tag);

        return $"v2:{Convert.ToBase64String(nonce)}:{Convert.ToBase64String(tag)}:{Convert.ToBase64String(cipherBytes)}";
    }

    public static string DecryptSecret(string ciphertext, string secretKey)
    {
        if (string.IsNullOrEmpty(ciphertext)) return string.Empty;
        var key = SHA256.HashData(Encoding.UTF8.GetBytes(secretKey));

        if (ciphertext.StartsWith("v2:", StringComparison.Ordinal))
        {
            var parts = ciphertext.Split(':');
            if (parts.Length != 4) throw new FormatException("Invalid encrypted payload format.");
            var nonce = Convert.FromBase64String(parts[1]);
            var tag = Convert.FromBase64String(parts[2]);
            var cipherBytes = Convert.FromBase64String(parts[3]);
            var plainBytes = new byte[cipherBytes.Length];

            using var aesGcm = new AesGcm(key, tag.Length);
            aesGcm.Decrypt(nonce, cipherBytes, tag, plainBytes);
            return Encoding.UTF8.GetString(plainBytes);
        }

        if (ciphertext.StartsWith("v1:", StringComparison.Ordinal))
        {
            var parts = ciphertext.Split(':');
            if (parts.Length != 3) throw new FormatException("Invalid encrypted payload format.");
            var iv = Convert.FromBase64String(parts[1]);
            var cipherBytes = Convert.FromBase64String(parts[2]);
            using var aes = Aes.Create();
            aes.Key = key;
            using var decryptor = aes.CreateDecryptor(aes.Key, iv);
            var plainBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);
            return Encoding.UTF8.GetString(plainBytes);
        }
        else
        {
            var raw = Convert.FromBase64String(ciphertext);
            if (raw.Length < 16) throw new FormatException("Invalid encrypted payload length.");
            var iv = new byte[16];
            var cipherBytes = new byte[raw.Length - 16];
            Buffer.BlockCopy(raw, 0, iv, 0, 16);
            Buffer.BlockCopy(raw, 16, cipherBytes, 0, cipherBytes.Length);
            using var aes = Aes.Create();
            aes.Key = key;
            using var decryptor = aes.CreateDecryptor(aes.Key, iv);
            var plainBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);
            return Encoding.UTF8.GetString(plainBytes);
        }
    }

    public async Task<string> DecryptApiKeyAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.AiProviderConfigs.FindAsync(new object[] { id }, cancellationToken);
        if (entity == null || string.IsNullOrEmpty(entity.EncryptedApiKey)) return string.Empty;
        return DecryptSecret(entity.EncryptedApiKey, _encryptionSecret);
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
