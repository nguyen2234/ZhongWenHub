using ZhongWenHub.Data.Persistence;
using Xunit;

namespace ZhongWenHub.UnitTests;

public class VocabularyDeduplicationTests
{
    [Theory]
    [InlineData("bā", "bā")]
    [InlineData(" Bā ", "bā")]
    [InlineData("shàng bān", "shàngbān")]
    [InlineData("shàngbān", "shàngbān")]
    [InlineData("bú kèqi", "búkèqi")]
    [InlineData("xī'ān", "xīān")]
    [InlineData("xī’ān", "xīān")]
    public void NormalizePinyin_NormalizesSpacingCaseAndPunctuation(string input, string expected)
    {
        Assert.Equal(expected, VocabularyKeyNormalizer.NormalizePinyin(input));
    }

    [Fact]
    public void NormalizePinyin_PreservesTones_ForPolyphones()
    {
        Assert.NotEqual(
            VocabularyKeyNormalizer.NormalizePinyin("kōng"),
            VocabularyKeyNormalizer.NormalizePinyin("kòng"));
        Assert.NotEqual(
            VocabularyKeyNormalizer.NormalizePinyin("hái"),
            VocabularyKeyNormalizer.NormalizePinyin("huán"));
        Assert.NotEqual(
            VocabularyKeyNormalizer.NormalizePinyin("guo"),
            VocabularyKeyNormalizer.NormalizePinyin("guò"));
        Assert.NotEqual(
            VocabularyKeyNormalizer.NormalizePinyin("cháng"),
            VocabularyKeyNormalizer.NormalizePinyin("zhǎng"));
    }

    [Fact]
    public void BuildCanonicalKey_DistinguishesHomographsAndMatchesNormalizedDuplicates()
    {
        var k1 = VocabularyKeyNormalizer.BuildCanonicalKey(2, "上班", "shàng bān", null);
        var k2 = VocabularyKeyNormalizer.BuildCanonicalKey(2, " 上班 ", "ShàngBān", "");
        Assert.Equal(k1, k2);

        var homo1 = VocabularyKeyNormalizer.BuildCanonicalKey(4, "对", "duì", "1");
        var homo2 = VocabularyKeyNormalizer.BuildCanonicalKey(4, "对", "duì", "2");
        Assert.NotEqual(homo1, homo2);
    }
}

