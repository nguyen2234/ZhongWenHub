using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;

namespace ZhongWenHub.Common.AI;

public static class SsrfProtection
{
    private static readonly string[] DisallowedHostnames = new[]
    {
        "localhost",
        "metadata.google.internal",
        "instance-data",
        "169.254.169.254",
        "metadata.internal"
    };

    public static bool IsPrivateOrBlockedIp(IPAddress ip)
    {
        if (IPAddress.IsLoopback(ip)) return true;

        if (ip.IsIPv4MappedToIPv6)
        {
            ip = ip.MapToIPv4();
        }

        var bytes = ip.GetAddressBytes();

        if (ip.AddressFamily == AddressFamily.InterNetwork)
        {
            // 0.0.0.0/8 - Current network (only valid as source address)
            if (bytes[0] == 0) return true;

            // 10.0.0.0/8 - Private-Use (RFC 1918)
            if (bytes[0] == 10) return true;

            // 100.64.0.0/10 - Shared Address Space / CG-NAT (RFC 6598)
            if (bytes[0] == 100 && (bytes[1] & 0xC0) == 64) return true;

            // 127.0.0.0/8 - Loopback (RFC 1122)
            if (bytes[0] == 127) return true;

            // 169.254.0.0/16 - Link Local & Cloud Metadata (RFC 3927)
            if (bytes[0] == 169 && bytes[1] == 254) return true;

            // 172.16.0.0/12 - Private-Use (RFC 1918)
            if (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) return true;

            // 192.0.0.0/24 - IETF Protocol Assignments (RFC 6890)
            if (bytes[0] == 192 && bytes[1] == 0 && bytes[2] == 0) return true;

            // 192.0.2.0/24 - Documentation (TEST-NET-1, RFC 5737)
            if (bytes[0] == 192 && bytes[1] == 0 && bytes[2] == 2) return true;

            // 192.168.0.0/16 - Private-Use (RFC 1918)
            if (bytes[0] == 192 && bytes[1] == 168) return true;

            // 198.18.0.0/15 - Benchmarking (RFC 2544)
            if (bytes[0] == 198 && (bytes[1] == 18 || bytes[1] == 19)) return true;

            // 198.51.100.0/24 - Documentation (TEST-NET-2, RFC 5737)
            if (bytes[0] == 198 && bytes[1] == 51 && bytes[2] == 100) return true;

            // 203.0.113.0/24 - Documentation (TEST-NET-3, RFC 5737)
            if (bytes[0] == 203 && bytes[1] == 0 && bytes[2] == 113) return true;

            // 224.0.0.0/4 - Multicast (RFC 5771)
            if (bytes[0] >= 224 && bytes[0] <= 239) return true;

            // 240.0.0.0/4 - Reserved (RFC 1112) & 255.255.255.255 (Broadcast)
            if (bytes[0] >= 240) return true;
        }
        else if (ip.AddressFamily == AddressFamily.InterNetworkV6)
        {
            // ::/128 - Unspecified
            if (ip.Equals(IPAddress.IPv6None)) return true;

            // ::1/128 - Loopback
            if (ip.Equals(IPAddress.IPv6Loopback)) return true;

            // fc00::/7 - Unique Local Address (ULA, RFC 4193)
            if ((bytes[0] & 0xFE) == 0xFC) return true;

            // fe80::/10 - Link-Local Unicast (RFC 4291)
            if (bytes[0] == 0xFE && (bytes[1] & 0xC0) == 0x80) return true;

            // ff00::/8 - Multicast (RFC 4291)
            if (bytes[0] == 0xFF) return true;

            // 2001:db8::/32 - Documentation (RFC 3849)
            if (bytes[0] == 0x20 && bytes[1] == 0x01 && bytes[2] == 0x0D && bytes[3] == 0xB8) return true;

            // 100::/64 - Discard-Only Prefix (RFC 6666)
            if (bytes[0] == 0x01 && bytes[1] == 0x00 && bytes[2] == 0x00 && bytes[3] == 0x00) return true;
        }

        return false;
    }

    public static void ValidateBaseUrl(string? baseUrl)
    {
        if (string.IsNullOrWhiteSpace(baseUrl)) return;

        if (!Uri.TryCreate(baseUrl.Trim(), UriKind.Absolute, out var uri))
        {
            throw new ArgumentException("BaseUrl không phải là URL hợp lệ.");
        }

        if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
        {
            throw new ArgumentException($"Giao thức {uri.Scheme} không được hỗ trợ. Chỉ chấp nhận HTTP hoặc HTTPS.");
        }

        var host = uri.Host.Trim().ToLowerInvariant();

        if (DisallowedHostnames.Contains(host))
        {
            throw new ArgumentException($"Không được phép kết nối tới host '{host}' vì lý do an toàn mạng (SSRF).");
        }

        if (IPAddress.TryParse(host, out var ip))
        {
            if (IsPrivateOrBlockedIp(ip))
            {
                throw new ArgumentException($"Không được phép kết nối tới địa chỉ IP '{ip}' (SSRF blocked).");
            }
        }
        else
        {
            // Resolve DNS if host is domain name
            try
            {
                var resolvedIps = Dns.GetHostAddresses(host);
                if (resolvedIps != null && resolvedIps.Length > 0)
                {
                    if (resolvedIps.Any(IsPrivateOrBlockedIp))
                    {
                        throw new ArgumentException($"Domain '{host}' phân giải tới địa chỉ IP nội bộ không được phép (SSRF blocked).");
                    }
                }
            }
            catch (ArgumentException)
            {
                throw;
            }
            catch (Exception)
            {
                // If DNS resolution fails here (e.g. offline or mock in test), allow URL saving
                // but Connection-time validation will strictly enforce on connect.
            }
        }
    }

    public static SocketsHttpHandler CreateSafeSocketsHttpHandler()
    {
        return new SocketsHttpHandler
        {
            AllowAutoRedirect = false,
            ConnectCallback = async (context, cancellationToken) =>
            {
                var host = context.DnsEndPoint.Host;
                IPAddress[] addresses;

                if (IPAddress.TryParse(host, out var directIp))
                {
                    addresses = new[] { directIp };
                }
                else
                {
                    addresses = await Dns.GetHostAddressesAsync(host, cancellationToken);
                }

                if (addresses == null || addresses.Length == 0)
                {
                    throw new HttpRequestException($"DNS resolution failed for '{host}'.", null, HttpStatusCode.BadGateway);
                }

                var safeAddress = addresses.FirstOrDefault(ip => !IsPrivateOrBlockedIp(ip));
                if (safeAddress == null)
                {
                    throw new HttpRequestException($"SSRF Blocked: Host '{host}' resolves exclusively to disallowed/private IP address(es).", null, HttpStatusCode.Forbidden);
                }

                var socket = new Socket(safeAddress.AddressFamily, SocketType.Stream, ProtocolType.Tcp)
                {
                    NoDelay = true
                };

                try
                {
                    await socket.ConnectAsync(new IPEndPoint(safeAddress, context.DnsEndPoint.Port), cancellationToken);
                    return new NetworkStream(socket, ownsSocket: true);
                }
                catch
                {
                    socket.Dispose();
                    throw;
                }
            }
        };
    }
}
