using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using ZhongWenHub.Business.AILearning.DTOs;

namespace ZhongWenHub.Business.AILearning.Services.Speech;

public sealed class AIPronunciationService : IAIPronunciationService
{
    private static readonly Regex PunctuationRegex = new(@"[，。！？、；：""'’‘“”（）\s,.!?;:()""'-]+", RegexOptions.Compiled);

    public SpeakingAssessmentResultDto EvaluatePronunciation(
        string targetZh,
        string? targetPinyin,
        string? targetMeaningVi,
        string recognizedZh,
        int hskLevel,
        string practiceType = "WORD",
        string sttProvider = "GeminiAudioSTT",
        bool isSttAvailable = true)
    {
        var cleanTarget = CleanChineseText(targetZh);
        var cleanRecognized = CleanChineseText(recognizedZh);

        var pinyinTokens = TokenizePinyin(targetPinyin, cleanTarget.Length);

        // Perform character alignment using LCS
        var lcs = ComputeLcs(cleanTarget, cleanRecognized);
        var breakdown = new List<WordAlignmentDetailDto>();

        var matchedCount = 0;
        var missedList = new List<string>();

        var recIndex = 0;
        for (var i = 0; i < cleanTarget.Length; i++)
        {
            var targetChar = cleanTarget[i].ToString();
            var py = i < pinyinTokens.Count ? pinyinTokens[i] : null;

            if (recIndex < cleanRecognized.Length && cleanTarget[i] == cleanRecognized[recIndex])
            {
                breakdown.Add(new WordAlignmentDetailDto
                {
                    CharacterOrWord = targetChar,
                    Pinyin = py,
                    Status = "MATCHED",
                    TipVi = "Phát âm chuẩn xác."
                });
                matchedCount++;
                recIndex++;
            }
            else if (cleanRecognized.Contains(cleanTarget[i]))
            {
                // Found elsewhere in recognized string
                breakdown.Add(new WordAlignmentDetailDto
                {
                    CharacterOrWord = targetChar,
                    Pinyin = py,
                    Status = "MATCHED",
                    TipVi = "Nhận diện đúng."
                });
                matchedCount++;
            }
            else
            {
                breakdown.Add(new WordAlignmentDetailDto
                {
                    CharacterOrWord = targetChar,
                    Pinyin = py,
                    Status = "MISSED",
                    TipVi = $"Cần chú ý phát âm rõ âm [{py ?? targetChar}]."
                });
                missedList.Add(targetChar);
            }
        }

        var totalTargetChars = Math.Max(1, cleanTarget.Length);
        var accuracyPercent = Math.Round((double)matchedCount / totalTargetChars * 100.0, 1);
        accuracyPercent = Math.Clamp(accuracyPercent, 0.0, 100.0);

        var overallScore = accuracyPercent;

        string feedbackVi;
        if (accuracyPercent >= 95)
        {
            feedbackVi = "Xuất sắc! Bạn phát âm rất rõ ràng, toàn bộ các âm tiết được nhận diện chính xác.";
        }
        else if (accuracyPercent >= 80)
        {
            feedbackVi = $"Rất tốt! Bạn đã phát âm chuẩn hầu hết các từ. {(missedList.Count > 0 ? "Lưu ý luyện thêm từ: " + string.Join(", ", missedList) : "")}";
        }
        else if (accuracyPercent >= 60)
        {
            feedbackVi = $"Khá tốt! Bạn đã phát âm đúng được {matchedCount}/{totalTargetChars} chữ. Hãy nghe lại phát âm mẫu và chú ý âm bật hơi hoặc khẩu hình các từ: {string.Join(", ", missedList.Take(3))}.";
        }
        else
        {
            feedbackVi = $"Cần luyện tập thêm. Hệ thống chưa nhận diện rõ các từ: {string.Join(", ", missedList.Take(4))}. Hãy nghe mẫu và đọc chậm từng âm tiết.";
        }

        string? nextSuggestion = null;
        if (missedList.Count > 0)
        {
            nextSuggestion = $"Luyện tập phát âm từ vựng chứa chữ '{missedList[0]}'";
        }

        return new SpeakingAssessmentResultDto
        {
            AttemptId = Guid.NewGuid(),
            PracticeType = practiceType,
            HskLevel = hskLevel,
            TargetTextZh = targetZh,
            TargetPinyin = targetPinyin,
            RecognizedTranscriptZh = recognizedZh,
            TranscriptAccuracyPercent = accuracyPercent,
            OverallPronunciationScore = overallScore,
            AssessmentMethod = "TRANSCRIPT_ALIGNMENT",
            HasAcousticToneData = false,
            ToneAssessmentNote = "Điểm số phản ánh độ khớp văn bản nhận diện (Transcript Alignment). Không suy đoán thanh điệu hoặc ngữ điệu âm học khi chưa có thiết bị đo chuyên biệt.",
            EvaluationFeedbackVi = feedbackVi,
            WordBreakdown = breakdown,
            SuggestedNextPractice = nextSuggestion,
            SttProvider = sttProvider,
            IsSttAvailable = isSttAvailable,
            AttemptedAt = DateTime.UtcNow
        };
    }

    private static string CleanChineseText(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        return PunctuationRegex.Replace(input, string.Empty).Trim();
    }

    private static List<string> TokenizePinyin(string? pinyin, int targetLength)
    {
        if (string.IsNullOrWhiteSpace(pinyin)) return new List<string>();
        var tokens = pinyin.Split(new[] { ' ', '\'', '-', ',' }, StringSplitOptions.RemoveEmptyEntries).ToList();
        return tokens;
    }

    private static int ComputeLcs(string s1, string s2)
    {
        var m = s1.Length;
        var n = s2.Length;
        var dp = new int[m + 1, n + 1];

        for (var i = 0; i <= m; i++)
        {
            for (var j = 0; j <= n; j++)
            {
                if (i == 0 || j == 0)
                    dp[i, j] = 0;
                else if (s1[i - 1] == s2[j - 1])
                    dp[i, j] = dp[i - 1, j - 1] + 1;
                else
                    dp[i, j] = Math.Max(dp[i - 1, j], dp[i, j - 1]);
            }
        }

        return dp[m, n];
    }
}

