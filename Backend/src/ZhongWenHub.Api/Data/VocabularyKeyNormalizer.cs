using System.Text;
using System.Text.RegularExpressions;

namespace ZhongWenHub.Data.Persistence;

public static partial class VocabularyKeyNormalizer
{
    [GeneratedRegex(@"[\s'\u2019\-·•.,/()]+")]
    private static partial Regex PinyinSeparatorRegex();

    public static string NormalizeHanzi(string? hanzi)
        => (hanzi ?? string.Empty).Trim();

    public static string NormalizePinyin(string? pinyin)
    {
        if (string.IsNullOrWhiteSpace(pinyin))
        {
            return string.Empty;
        }

        var nfc = pinyin.Trim().Normalize(NormalizationForm.FormC).ToLowerInvariant();
        return PinyinSeparatorRegex().Replace(nfc, string.Empty);
    }

    public static string NormalizeHomograph(string? homograph)
        => string.IsNullOrWhiteSpace(homograph) ? string.Empty : homograph.Trim();

    public static string BuildCanonicalKey(int hskLevel, string? hanzi, string? pinyin, string? homograph)
        => $"{hskLevel}|{NormalizeHanzi(hanzi)}|{NormalizePinyin(pinyin)}|{NormalizeHomograph(homograph)}";
}

