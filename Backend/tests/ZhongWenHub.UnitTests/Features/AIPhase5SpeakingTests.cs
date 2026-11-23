using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Xunit;
using ZhongWenHub.Business.AILearning.Services.Speech;

namespace ZhongWenHub.UnitTests;

public class AIPhase5SpeakingUnitTests
{
    [Fact]
    public void PronunciationAssessment_AlignsCharacters_AndProvidesMetricDisclaimers()
    {
        var pron = new AIPronunciationService();

        // Target: 你好很高兴认识你
        // Recognized: 你好认识你 (missing 很高兴)
        var result = pron.EvaluatePronunciation(
            targetZh: "你好，很高兴认识你。",
            targetPinyin: "Nǐ hǎo, hěn gāoxìng rènshi nǐ.",
            targetMeaningVi: "Xin chào, rất vui được làm quen với bạn.",
            recognizedZh: "你好认识你",
            hskLevel: 1,
            practiceType: "SENTENCE");

        Assert.Equal("TRANSCRIPT_ALIGNMENT", result.AssessmentMethod);
        Assert.False(result.HasAcousticToneData, "Transcript alignment must NOT pretend acoustic tone evaluation");
        Assert.Contains("Transcript Alignment", result.ToneAssessmentNote);
        Assert.True(result.TranscriptAccuracyPercent > 0 && result.TranscriptAccuracyPercent < 100);

        // Verify word breakdown contains matched and missed with pedagogical honesty
        Assert.Contains(result.WordBreakdown, w => w.Status == "MATCHED" && w.CharacterOrWord == "你" && w.TipVi!.Contains("khớp"));
        Assert.Contains(result.WordBreakdown, w => w.Status == "MISSED" && w.CharacterOrWord == "高");
        Assert.NotEmpty(result.EvaluationFeedbackVi);
        Assert.DoesNotContain("phát âm chuẩn", result.EvaluationFeedbackVi);
    }

    [Fact]
    public void LcsAlignment_DuplicateCharacters_DoesNotOvercount()
    {
        var pron = new AIPronunciationService();

        // Target: 妈妈 (2 chars), Recognized: 妈 (1 char)
        // With true LCS alignment, only 1 妈 matches. The 2nd 妈 is MISSED.
        var result = pron.EvaluatePronunciation(
            targetZh: "妈妈",
            targetPinyin: "māma",
            targetMeaningVi: "Mẹ",
            recognizedZh: "妈",
            hskLevel: 1,
            practiceType: "WORD");

        Assert.Equal(50.0, result.TranscriptAccuracyPercent);
        Assert.Equal(2, result.WordBreakdown.Count);
        Assert.Equal("MATCHED", result.WordBreakdown[0].Status);
        Assert.Equal("MISSED", result.WordBreakdown[1].Status);
    }

    [Fact]
    public void LcsAlignment_InvertedCharacters_DoesNotCountAsFullMatch()
    {
        var pron = new AIPronunciationService();

        // Target: 苹果 (apple), Recognized: 果苹 (inverted order)
        var result = pron.EvaluatePronunciation(
            targetZh: "苹果",
            targetPinyin: "píngguǒ",
            targetMeaningVi: "Quả táo",
            recognizedZh: "果苹",
            hskLevel: 1,
            practiceType: "WORD");

        Assert.Equal(50.0, result.TranscriptAccuracyPercent);
        Assert.Contains(result.WordBreakdown, w => w.Status == "MATCHED");
        Assert.Contains(result.WordBreakdown, w => w.Status == "MISSED");
        Assert.Contains(result.WordBreakdown, w => w.Status == "EXTRA");
    }

    [Fact]
    public void LcsAlignment_ExtraCharacters_PenalizesAccuracy_AndPreservesOrder()
    {
        var pron = new AIPronunciationService();

        // Target: 你好 (2 chars), Recognized: 你好啊 (3 chars with extra 啊)
        var result = pron.EvaluatePronunciation(
            targetZh: "你好",
            targetPinyin: "nǐ hǎo",
            targetMeaningVi: "Xin chào",
            recognizedZh: "你好啊",
            hskLevel: 1,
            practiceType: "WORD");

        Assert.Equal(66.7, result.TranscriptAccuracyPercent);
        Assert.Equal("MATCHED", result.WordBreakdown[0].Status);
        Assert.Equal("MATCHED", result.WordBreakdown[1].Status);
        Assert.Contains(result.WordBreakdown, w => w.Status == "EXTRA" && w.CharacterOrWord == "啊");
    }

    [Fact]
    public void SpeechRecognition_Gemini_ConfidenceIsNull_NeverFaked()
    {
        var pron = new AIPronunciationService();

        // Gemini STT result returns Confidence = null and ConfidenceStatus = "UNAVAILABLE"
        var result = pron.EvaluatePronunciation(
            targetZh: "你好",
            targetPinyin: "nǐ hǎo",
            targetMeaningVi: "Xin chào",
            recognizedZh: "你好",
            hskLevel: 1,
            practiceType: "WORD",
            sttProvider: "GeminiMultimodalAudioSTT",
            isSttAvailable: true,
            sttConfidence: null,
            sttConfidenceStatus: "UNAVAILABLE");

        Assert.Null(result.SttConfidence);
        Assert.Equal("UNAVAILABLE", result.SttConfidenceStatus);
    }
}
