using System;
using System.IO;
using System.Security;
using System.Text.RegularExpressions;

namespace ZhongWenHub.Business.Content.Helpers;

/// <summary>
/// Security utility for validating storage paths, preventing path traversal and handling provider URI schemes.
/// </summary>
public static class StoragePathSecurity
{
    public const string SchemeSupabase = "supabase://";
    public const string SchemeLocal = "local://";

    // Strict regex matching legitimate backend-generated storage paths:
    // videos/yyyyMM/video_{guid32}.(mp4|webm|mov)
    // thumbnails/yyyyMM/thumb_{guid32}.(jpg|jpeg|png|webp)
    private static readonly Regex ValidRelativePathRegex = new(
        @"^(?:videos\/\d{6}\/video_[a-fA-F0-9]{32}\.(?:mp4|webm|mov)|thumbnails\/\d{6}\/thumb_[a-fA-F0-9]{32}\.(?:jpg|jpeg|png|webp))$",
        RegexOptions.Compiled);

    /// <summary>
    /// Validates whether a storage path is safe and conforms to the backend storage schema.
    /// Rejects path traversal sequences, absolute paths, backslashes, colon, and unrecognized schemes.
    /// </summary>
    public static bool IsValidStoragePath(string? storagePath)
    {
        if (string.IsNullOrWhiteSpace(storagePath)) return false;

        var trimmed = storagePath.Trim();

        // Reject dangerous characters and sequences immediately
        if (trimmed.Contains("..", StringComparison.Ordinal) ||
            trimmed.Contains("%2e", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Contains('\\', StringComparison.Ordinal) ||
            (trimmed.Contains(':') &&
             !trimmed.StartsWith(SchemeSupabase, StringComparison.OrdinalIgnoreCase) &&
             !trimmed.StartsWith(SchemeLocal, StringComparison.OrdinalIgnoreCase)))
        {
            return false;
        }

        // Reject arbitrary web URLs in StoragePath (thumbnails use ThumbnailUrl, not StoragePath)
        if (trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase) ||
            trimmed.StartsWith("file://", StringComparison.OrdinalIgnoreCase) ||
            trimmed.StartsWith("ftp://", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        // Strip known scheme prefix if present
        var relative = ExtractRelativePath(trimmed);

        // Path cannot start with '/' or contain '//'
        if (relative.StartsWith('/') || relative.Contains("//", StringComparison.Ordinal))
        {
            return false;
        }

        // Must match expected storage path structure
        return ValidRelativePathRegex.IsMatch(relative);
    }

    /// <summary>
    /// Parses a storage path into its explicit provider and relative path.
    /// If no scheme is present, returns "Unknown" as provider.
    /// </summary>
    public static (string Provider, string RelativePath) Parse(string storagePath)
    {
        if (string.IsNullOrWhiteSpace(storagePath))
        {
            return ("Unknown", string.Empty);
        }

        var trimmed = storagePath.Trim();

        if (trimmed.StartsWith(SchemeSupabase, StringComparison.OrdinalIgnoreCase))
        {
            return ("Supabase", trimmed[SchemeSupabase.Length..].TrimStart('/'));
        }

        if (trimmed.StartsWith(SchemeLocal, StringComparison.OrdinalIgnoreCase))
        {
            return ("LocalFileSystem", trimmed[SchemeLocal.Length..].TrimStart('/'));
        }

        return ("Unknown", trimmed.TrimStart('/'));
    }

    /// <summary>
    /// Extracts the clean relative path, stripping any provider scheme prefix.
    /// </summary>
    public static string ExtractRelativePath(string storagePath)
    {
        return Parse(storagePath).RelativePath;
    }

    /// <summary>
    /// Formats a relative path with an explicit provider scheme.
    /// </summary>
    public static string FormatWithProvider(string provider, string relativePath)
    {
        var cleanRel = relativePath.Trim().TrimStart('/');
        return provider switch
        {
            "Supabase" => $"{SchemeSupabase}{cleanRel}",
            "LocalFileSystem" => $"{SchemeLocal}{cleanRel}",
            _ => cleanRel
        };
    }

    /// <summary>
    /// Resolves and validates a local file system path, ensuring it is strictly contained inside the storage root directory.
    /// Throws SecurityException if path traversal is detected.
    /// </summary>
    public static string ResolveAndVerifyLocalPath(string baseDirectory, string relativePath)
    {
        var cleanRelative = ExtractRelativePath(relativePath);

        if (!IsValidStoragePath(cleanRelative))
        {
            throw new SecurityException($"Đường dẫn lưu trữ không hợp lệ hoặc chứa ký tự nguy hiểm: {relativePath}");
        }

        var normalizedBase = Path.GetFullPath(baseDirectory);
        var combined = Path.Combine(normalizedBase, cleanRelative.Replace('/', Path.DirectorySeparatorChar));
        var fullPath = Path.GetFullPath(combined);

        // Enforce strict root containment
        if (!fullPath.StartsWith(normalizedBase, StringComparison.OrdinalIgnoreCase))
        {
            throw new SecurityException("Phát hiện hành vi Path Traversal: Đường dẫn vượt ra ngoài thư mục lưu trữ cho phép.");
        }

        return fullPath;
    }
}
