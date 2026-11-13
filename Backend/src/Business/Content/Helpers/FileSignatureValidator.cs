using System;
using System.IO;

namespace ZhongWenHub.Business.Content.Helpers;

/// <summary>
/// Validates binary file signatures (Magic Bytes) to verify actual MIME types and prevent spoofing.
/// </summary>
public static class FileSignatureValidator
{
    /// <summary>
    /// Inspects the stream header and validates that the binary file signature matches the claimed content type.
    /// Safely resets stream position after inspection.
    /// </summary>
    public static bool ValidateSignature(Stream stream, string contentType, out string detectedFormat)
    {
        detectedFormat = "Unknown";
        if (stream == null || !stream.CanRead) return false;

        var cleanMime = contentType.Split(';')[0].Trim().ToLowerInvariant();
        var initialPosition = stream.CanSeek ? stream.Position : 0;
        var header = new byte[16];

        int bytesRead;
        try
        {
            bytesRead = stream.Read(header, 0, header.Length);
        }
        finally
        {
            if (stream.CanSeek)
            {
                stream.Position = initialPosition;
            }
        }

        if (bytesRead < 4) return false;

        // MP4 / QuickTime: Bytes at offset 4..7 contain "ftyp" (0x66, 0x74, 0x79, 0x70)
        if (bytesRead >= 8 && header[4] == 0x66 && header[5] == 0x74 && header[6] == 0x79 && header[7] == 0x70)
        {
            detectedFormat = "video/mp4";
            return cleanMime is "video/mp4" or "video/quicktime";
        }

        // WebM: Matroska / EBML header starts with 0x1A, 0x45, 0xDF, 0xA3
        if (header[0] == 0x1A && header[1] == 0x45 && header[2] == 0xDF && header[3] == 0xA3)
        {
            detectedFormat = "video/webm";
            return cleanMime is "video/webm";
        }

        // JPEG: Starts with 0xFF, 0xD8, 0xFF
        if (header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
        {
            detectedFormat = "image/jpeg";
            return cleanMime is "image/jpeg" or "image/jpg";
        }

        // PNG: Starts with 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
        if (bytesRead >= 8 &&
            header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47 &&
            header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A)
        {
            detectedFormat = "image/png";
            return cleanMime is "image/png";
        }

        // WebP: Starts with "RIFF" (0x52, 0x49, 0x46, 0x46) at offset 0, and "WEBP" (0x57, 0x45, 0x42, 0x50) at offset 8
        if (bytesRead >= 12 &&
            header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46 &&
            header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50)
        {
            detectedFormat = "image/webp";
            return cleanMime is "image/webp";
        }

        return false;
    }
}
