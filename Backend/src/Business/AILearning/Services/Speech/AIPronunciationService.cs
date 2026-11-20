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
        bool isSttAvailable = true,
        double? sttConfidence = null,
        string sttConfidenceStatus = "UNAVAILABLE",
        bool isDirectTextInput = false)
    {
        var cleanTarget = CleanChineseText(targetZh);
        var cleanRecognized = CleanChineseText(recognizedZh);

        var pinyinTokens = TokenizePinyin(targetPinyin, cleanTarget.Length);

        // Perform character alignment using forward LCS (Longest Common Subsequence) dynamic programming
        // Forward alignment guarantees matching earlier characters first in left-to-right reading order
        var m = cleanTarget.Length;
        var n = cleanRecognized.Length;
        var dp = new int[m + 1, n + 1];

        for (var i = m - 1; i >= 0; i--)
        {
            for (var j = n - 1; j >= 0; j--)
            {
                if (cleanTarget[i] == cleanRecognized[j])
                    dp[i, j] = dp[i + 1, j + 1] + 1;
                else
                    dp[i, j] = Math.Max(dp[i + 1, j], dp[i, j + 1]);
            }
        }

        var lcsLength = dp[0, 0];

        // Backtrack forward from (0, 0) to extract unique matched character indices preserving order
        // Guarantee: Each target character is matched to at most one recognized character
        var matchedTargetIndices = new HashSet<int>();
        var matchedRecIndices = new HashSet<int>();

        var curI = 0;
        var curJ = 0;
        while (curI < m && curJ < n)
        {
            if (cleanTarget[curI] == cleanRecognized[curJ])
            {
                matchedTargetIndices.Add(curI);
                matchedRecIndices.Add(curJ);
                curI++;
                curJ++;
            }
            else if (dp[curI + 1, curJ] >= dp[curI, curJ + 1])
            {
                curI++;
            }
            else
            {
                curJ++;
            }
        }

        var breakdown = new List<WordAlignmentDetailDto>();
        var missedList = new List<string>();

        // Build target breakdown: MATCHED vs MISSED
        for (var i = 0; i < m; i++)
        {
            var targetChar = cleanTarget[i].ToString();
            var py = i < pinyinTokens.Count ? pinyinTokens[i] : null;

            if (matchedTargetIndices.Contains(i))
            {
                breakdown.Add(new WordAlignmentDetailDto
                {
                    CharacterOrWord = targetChar,
                    Pinyin = py,
                    Status = "MATCHED",
                    TipVi = "Nội dung nhận diện khớp."
                });
            }
            else
            {
                breakdown.Add(new WordAlignmentDetailDto
                {
                    CharacterOrWord = targetChar,
                    Pinyin = py,
                    Status = "MISSED",
                    TipVi = $"Cần chú ý đọc rõ âm [{py ?? targetChar}]."
                });
                missedList.Add(targetChar);
            }
        }

        // Collect extra characters from recognized transcript that do not match target characters
        var extraList = new List<string>();
        for (var j = 0; j < n; j++)
        {
            if (!matchedRecIndices.Contains(j))
            {
                var extraChar = cleanRecognized[j].ToString();
                extraList.Add(extraChar);
                breakdown.Add(new WordAlignmentDetailDto
                {
                    CharacterOrWord = extraChar,
                    Pinyin = null,
                    Status = "EXTRA",
                    TipVi = $"Từ thừa trong nhận diện [{extraChar}]."
                });
            }
        }

        // Accuracy percent:
        // Symmetric normalization based on max(targetLength, recognizedLength)
        // Treats omissions, insertions, and inversions rigorously without overcounting
        double accuracyPercent = 0.0;
        if (m > 0)
        {
            var maxLen = Math.Max(m, n);
            accuracyPercent = Math.Round((double)lcsLength / maxLen * 100.0, 1);
            accuracyPercent = Math.Clamp(accuracyPercent, 0.0, 100.0);
        }

        var overallScore = accuracyPercent;

        string feedbackVi;
        if (accuracyPercent >= 95)
        {
            feedbackVi = "Xuất sắc! Toàn bộ nội dung âm thanh được nhận diện khớp hoàn toàn với văn bản mục tiêu.";
        }
        else if (accuracyPercent >= 80)
        {
            feedbackVi = $"Rất tốt! Nội dung nhận diện khớp hầu hết các từ trong câu. {(missedList.Count > 0 ? "Cần chú ý đọc rõ các từ: " + string.Join(", ", missedList) : "")}";
        }
        else if (accuracyPercent >= 60)
        {
            feedbackVi = $"Khá tốt! Nội dung nhận diện khớp {matchedTargetIndices.Count}/{m} chữ. Hãy nghe lại phát âm mẫu và chú ý đọc rõ các từ chưa khớp: {string.Join(", ", missedList.Take(3))}.";
        }
        else
        {
            feedbackVi = $"Cần luyện tập thêm. Hệ thống nhận diện chưa khớp các từ: {string.Join(", ", missedList.Take(4))}. Hãy nghe mẫu và đọc chậm rõ từng âm tiết.";
        }

        if (extraList.Count > 0)
        {
            feedbackVi += $" (Phát hiện âm thừa trong nhận diện: {string.Join(", ", extraList.Take(3))}).";
        }

        if (isDirectTextInput)
        {
            feedbackVi += " [Thử nghiệm DirectText: Không tính vào điểm năng lực Nói hoặc thống kê âm thanh].";
        }

        string? nextSuggestion = null;
        if (missedList.Count > 0)
        {
            nextSuggestion = $"Luyện tập nhận diện từ vựng chứa chữ '{missedList[0]}'";
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
            SttConfidence = sttConfidence,
            SttConfidenceStatus = sttConfidenceStatus,
            IsDirectTextInput = isDirectTextInput,
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

