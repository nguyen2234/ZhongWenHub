using System.Text.RegularExpressions;

namespace ZhongWenHub.Business.AITutor;

public static partial class PromptSanitizer
{
    [GeneratedRegex(@"(\[/?(SYSTEM|INST|NGỮ CẢNH|CÂU HỎI|HƯỚNG DẪN)[^\]]*\]|ignore\s+(all\s+)?(previous|above)\s+instructions|system\s*:|assistant\s*:|<\s*/?\s*system\s*>)", RegexOptions.IgnoreCase)]
    private static partial Regex InjectionMarkerRegex();

    public static string SanitizeUntrustedText(string? value, int maxLength = 1200)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = value.Replace("\r\n", "\n").Trim();
        normalized = InjectionMarkerRegex().Replace(normalized, "[filtered]");
        if (normalized.Length > maxLength)
        {
            normalized = normalized[..maxLength];
        }

        return normalized;
    }
}
