using System;
using System.Text.RegularExpressions;

namespace ZhongWenHub.Business.Content.Helpers;

public static class YouTubeUrlParser
{
    // Regex matching standard YouTube watch URLs, short URLs (youtu.be), embed URLs, and shorts URLs
    private static readonly Regex YouTubeRegex = new(
        @"^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // Regex matching raw 11-char YouTube ID
    private static readonly Regex RawIdRegex = new(
        @"^[a-zA-Z0-9_-]{11}$",
        RegexOptions.Compiled);

    /// <summary>
    /// Parses an input string (full URL or raw ID) and extracts a valid 11-character YouTube Video ID.
    /// Strictly verifies that full URLs belong to legitimate YouTube domains (youtube.com or youtu.be).
    /// Returns null if the URL is invalid or from an untrusted domain.
    /// </summary>
    public static string? ExtractVideoId(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return null;
        }

        var trimmed = input.Trim();

        // Check if input is already a direct 11-character video ID
        if (RawIdRegex.IsMatch(trimmed))
        {
            return trimmed;
        }

        // Enforce strict URI host validation if input resembles a full URL
        if (trimmed.Contains("://", StringComparison.Ordinal) || trimmed.StartsWith("//", StringComparison.Ordinal))
        {
            var testUrl = trimmed.StartsWith("//", StringComparison.Ordinal) ? $"https:{trimmed}" : trimmed;
            if (Uri.TryCreate(testUrl, UriKind.Absolute, out var uri))
            {
                var host = uri.Host.ToLowerInvariant();
                if (host.StartsWith("www.")) host = host[4..];
                if (host.StartsWith("m.")) host = host[2..];

                // Strictly allow only genuine YouTube hostnames
                if (host != "youtube.com" && host != "youtu.be")
                {
                    return null;
                }
            }
            else
            {
                return null;
            }
        }

        // Match against valid YouTube URL patterns
        var match = YouTubeRegex.Match(trimmed);
        if (match.Success && match.Groups.Count > 1)
        {
            var id = match.Groups[1].Value;
            if (RawIdRegex.IsMatch(id))
            {
                return id;
            }
        }

        return null;
    }

    /// <summary>
    /// Generates the standard high-quality YouTube thumbnail URL for a given video ID.
    /// </summary>
    public static string GenerateHqThumbnailUrl(string videoId)
    {
        return $"https://img.youtube.com/vi/{videoId}/hqdefault.jpg";
    }

    /// <summary>
    /// Generates the canonical YouTube watch URL for a given video ID.
    /// </summary>
    public static string GenerateWatchUrl(string videoId)
    {
        return $"https://www.youtube.com/watch?v={videoId}";
    }
}
