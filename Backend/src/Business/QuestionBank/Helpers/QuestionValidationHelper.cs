using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using ZhongWenHub.Data.Entities.Content;

namespace ZhongWenHub.Business.QuestionBank.Helpers;

public sealed record QuestionValidationResult(
    bool IsValid,
    List<string> Errors,
    List<string> Warnings,
    double QualityScore,
    string NormalizedType,
    string NormalizedSkill,
    string NormalizedDifficulty,
    string? NormalizedCorrectAnswer,
    int? NormalizedCorrectOptionIndex,
    string ContentHash);

/// <summary>
/// Shared normalization, deduplication hashing, quality scoring, validation, and
/// deterministic server-side grading helper aligned with Frontend answer-grading.ts.
/// </summary>
public static partial class QuestionValidationHelper
{
    private static readonly Regex PunctuationAndSpaceRegex = new(
        @"[\s\u3000\.,!\?。！？，、；：""'“”‘’（）\(\)【】\[\]—\-·…~`]+",
        RegexOptions.Compiled);

    private static readonly Regex ParentheticalNoteRegex = new(
        @"\s*\([^)]*\)\s*",
        RegexOptions.Compiled);

    private static readonly Regex BracketTokenRegex = new(
        @"\[([^\]]+)\]",
        RegexOptions.Compiled);

    private static readonly string[] PlaceholderMarkers =
    [
        "lorem ipsum",
        "placeholder",
        "tbd",
        "todo",
        "coming soon",
        "sample question",
        "???"
    ];

    public static string NormalizeAnswerText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        var nfkc = value.Normalize(NormalizationForm.FormKC);
        return PunctuationAndSpaceRegex.Replace(nfkc, string.Empty).Trim().ToLowerInvariant();
    }

    public static string StripParentheticalNote(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        return ParentheticalNoteRegex.Replace(value, " ").Trim();
    }

    public static string NormalizeType(string? rawType)
    {
        var t = (rawType ?? "multiple-choice").Trim().ToLowerInvariant();
        return t switch
        {
            "fill-in-the-blank" or "fill_blank" or "fill_in_blank" or "fill-blank" => "fill-blank",
            "sentence-ordering" or "sentence_order" or "sentence-order" => "sentence-order",
            "listening" or "listen-choice" => "listen-choice",
            "listening_true_false" => "listening_true_false",
            "reading_comprehension" or "choice" => "multiple-choice",
            "multiple-choice" or "matching" or "chinese-to-vietnamese" or "vietnamese-to-chinese"
                or "pronunciation" or "speaking" or "hanzi-writing" => t,
            _ => "multiple-choice"
        };
    }

    public static string NormalizeSkill(string? rawSkill)
    {
        var s = (rawSkill ?? "grammar").Trim().ToLowerInvariant();
        return s switch
        {
            "vocabulary" or "grammar" or "listening" or "reading" or "sentence" or "comprehensive" => s,
            "writing" => "sentence",
            _ => "grammar"
        };
    }

    public static string NormalizeDifficulty(string? rawDifficulty, int hskLevel = 1)
    {
        var d = (rawDifficulty ?? string.Empty).Trim().ToUpperInvariant();
        if (d is "EASY" or "DỄ" or "DE") return "EASY";
        if (d is "HARD" or "KHÓ" or "KHO") return "HARD";
        if (d is "MEDIUM" or "TRUNG BÌNH" or "TRUNG BINH") return "MEDIUM";
        if (hskLevel <= 1) return "EASY";
        if (hskLevel >= 4) return "HARD";
        return "MEDIUM";
    }

    public static string NormalizeStatus(string? rawStatus, string fallback = "DRAFT")
    {
        var s = (rawStatus ?? fallback).Trim().ToUpperInvariant();
        return s is "DRAFT" or "PENDING_REVIEW" or "PUBLISHED" or "ARCHIVED" ? s : fallback;
    }

    public static string NormalizeReviewStatus(string? rawReviewStatus, string fallback = "DRAFT")
    {
        var s = (rawReviewStatus ?? fallback).Trim().ToUpperInvariant();
        return s is "DRAFT" or "PENDING_REVIEW" or "VALIDATED" or "NEEDS_ACADEMIC_REVIEW" or "APPROVED" or "REJECTED"
            ? s
            : fallback;
    }

    public static bool HasSubstantiveExplanation(string? explanation, string? correctAnswer)
    {
        if (string.IsNullOrWhiteSpace(explanation)) return false;
        var exp = explanation.Trim();
        if (exp.Length < 24) return false;

        var normExp = NormalizeAnswerText(exp);
        var normAns = NormalizeAnswerText(StripParentheticalNote(correctAnswer));
        if (string.IsNullOrEmpty(normExp)) return false;
        if (!string.IsNullOrEmpty(normAns) && normExp == normAns) return false;

        // Reject trivial tautologies like "Đáp án đúng là 'X' (nguồn ...)." without actual explanation
        if ((exp.StartsWith("Đáp án đúng là", StringComparison.OrdinalIgnoreCase) ||
             exp.StartsWith("Đáp án đúng:", StringComparison.OrdinalIgnoreCase) ||
             exp.StartsWith("Chữ Hán đúng là", StringComparison.OrdinalIgnoreCase)) &&
            exp.Length < 70 &&
            !exp.Contains("ngữ pháp", StringComparison.OrdinalIgnoreCase) &&
            !exp.Contains("Phân biệt", StringComparison.OrdinalIgnoreCase) &&
            !exp.Contains("Nghĩa", StringComparison.OrdinalIgnoreCase) &&
            !exp.Contains("Ví dụ", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        // Reject if removing answer and source boilerplate leaves almost nothing meaningful
        if (!string.IsNullOrEmpty(normAns) && normExp.StartsWith("đápánđúng" + normAns, StringComparison.Ordinal) &&
            normExp.Length - ("đápánđúng" + normAns).Length < 14)
        {
            return false;
        }

        return true;
    }

    public static bool IsPublishQualified(
        QuestionValidationResult validation,
        string? explanation,
        string? correctAnswer,
        out string failureReason)
    {
        if (!validation.IsValid)
        {
            failureReason = string.Join(" ", validation.Errors);
            return false;
        }

        if (!HasSubstantiveExplanation(explanation, correctAnswer))
        {
            failureReason = "Cần bổ sung giải thích đáp án bằng tiếng Việt đủ chi tiết (>= 24 ký tự, nêu lý do/ngữ pháp/phân biệt, không chỉ lặp lại đáp án) trước khi xuất bản.";
            return false;
        }

        failureReason = string.Empty;
        return true;
    }

    public static List<string> ParseOptions(string? optionsJson)
    {
        if (string.IsNullOrWhiteSpace(optionsJson)) return [];
        try
        {
            var list = JsonSerializer.Deserialize<List<string>>(optionsJson);
            return list?
                .Select(x => x?.Trim() ?? string.Empty)
                .ToList() ?? [];
        }
        catch
        {
            return [];
        }
    }

    public static List<string> ParseBracketedTokens(string? promptHanzi)
    {
        if (string.IsNullOrWhiteSpace(promptHanzi)) return [];
        var matches = BracketTokenRegex.Matches(promptHanzi)
            .Select(m => m.Groups[1].Value.Trim())
            .Where(s => !string.IsNullOrEmpty(s))
            .ToList();
        return matches.Count >= 2 ? matches : [];
    }

    public static string ComputeContentHash(
        int hskLevel,
        string? type,
        string? promptHanzi,
        string? promptVietnamese,
        string? correctAnswer)
    {
        var canonicalType = NormalizeType(type);
        var pHanzi = NormalizeAnswerText(promptHanzi);
        var pVi = NormalizeAnswerText(promptVietnamese);
        var ans = NormalizeAnswerText(StripParentheticalNote(correctAnswer));
        var payload = $"{hskLevel}|{canonicalType}|{pHanzi}|{pVi}|{ans}";
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public static QuestionValidationResult ValidateQuestion(
        string? type,
        string? skill,
        int hskLevel,
        string? difficulty,
        string? title,
        string? instruction,
        string? promptHanzi,
        string? promptPinyin,
        string? promptVietnamese,
        string? audioUrl,
        string? optionsJson,
        int? correctOptionIndex,
        string? correctAnswer,
        string? explanation,
        string? tags)
    {
        var errors = new List<string>();
        var warnings = new List<string>();

        var normalizedType = NormalizeType(type);
        var normalizedSkill = NormalizeSkill(skill);
        var normalizedDifficulty = NormalizeDifficulty(difficulty, hskLevel);

        if (hskLevel < 1 || hskLevel > 6)
        {
            errors.Add("HskLevel phải nằm trong khoảng 1..6.");
        }

        if (string.IsNullOrWhiteSpace(title))
        {
            errors.Add("Tiêu đề câu hỏi không được để trống.");
        }

        if (string.IsNullOrWhiteSpace(instruction))
        {
            errors.Add("Hướng dẫn làm bài không được để trống.");
        }

        var combinedPrompt = string.Join(" ", new[] { title, promptHanzi, promptVietnamese, correctAnswer }
            .Where(s => !string.IsNullOrWhiteSpace(s))).ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(promptHanzi) && string.IsNullOrWhiteSpace(promptVietnamese))
        {
            errors.Add("Câu hỏi phải có ít nhất PromptHanzi hoặc PromptVietnamese.");
        }

        foreach (var marker in PlaceholderMarkers)
        {
            if (combinedPrompt.Contains(marker, StringComparison.OrdinalIgnoreCase))
            {
                errors.Add($"Phát hiện nội dung giữ chỗ (placeholder): '{marker}'.");
                break;
            }
        }

        if (!string.IsNullOrWhiteSpace(audioUrl) &&
            (audioUrl.Contains("placeholder", StringComparison.OrdinalIgnoreCase) ||
             audioUrl.Contains("example.com", StringComparison.OrdinalIgnoreCase)))
        {
            errors.Add("AudioUrl trỏ tới placeholder hoặc domain không hợp lệ.");
        }

        var options = ParseOptions(optionsJson);
        int? resolvedCorrectIdx = correctOptionIndex;
        var resolvedCorrectAns = correctAnswer?.Trim();

        if (options.Count > 0)
        {
            if (options.Count < 2)
            {
                errors.Add("Câu hỏi trắc nghiệm phải có ít nhất 2 phương án.");
            }

            if (options.Any(string.IsNullOrWhiteSpace))
            {
                errors.Add("Có phương án trả lời bị rỗng.");
            }

            var distinctNormalized = options
                .Select(NormalizeAnswerText)
                .Where(s => !string.IsNullOrEmpty(s))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Count();

            if (distinctNormalized < options.Count)
            {
                errors.Add("Các phương án trả lời bị trùng lặp sau khi chuẩn hóa.");
            }

            if (!resolvedCorrectIdx.HasValue || resolvedCorrectIdx.Value < 0 || resolvedCorrectIdx.Value >= options.Count)
            {
                // Recover index cleanly only if CorrectAnswer matches exactly one option
                if (!string.IsNullOrWhiteSpace(resolvedCorrectAns))
                {
                    var normAns = NormalizeAnswerText(resolvedCorrectAns);
                    var idx = options.FindIndex(o => NormalizeAnswerText(o) == normAns);
                    if (idx >= 0)
                    {
                        resolvedCorrectIdx = idx;
                    }
                }
            }

            if (!resolvedCorrectIdx.HasValue || resolvedCorrectIdx.Value < 0 || resolvedCorrectIdx.Value >= options.Count)
            {
                errors.Add("CorrectOptionIndex nằm ngoài phạm vi Options.");
            }
            else if (string.IsNullOrWhiteSpace(resolvedCorrectAns))
            {
                resolvedCorrectAns = options[resolvedCorrectIdx.Value];
            }
        }
        else if (normalizedType == "matching")
        {
            if (string.IsNullOrWhiteSpace(resolvedCorrectAns))
            {
                errors.Add("Bài tập nối cặp (matching) cần dữ liệu cặp hoặc CorrectAnswer.");
            }
        }
        else if (normalizedType == "sentence-order")
        {
            var tokens = ParseBracketedTokens(promptHanzi);
            if (tokens.Count < 2)
            {
                errors.Add("Bài tập sắp xếp câu không có Options cần ít nhất 2 token [..].");
            }
            if (string.IsNullOrWhiteSpace(resolvedCorrectAns))
            {
                errors.Add("Bài tập sắp xếp câu thiếu CorrectAnswer.");
            }
        }
        else
        {
            if (string.IsNullOrWhiteSpace(resolvedCorrectAns))
            {
                errors.Add("Câu hỏi tự luận / điền khuyết thiếu CorrectAnswer.");
            }
        }

        if (!HasSubstantiveExplanation(explanation, resolvedCorrectAns))
        {
            warnings.Add(string.IsNullOrWhiteSpace(explanation)
                ? "Thiếu giải thích chi tiết (Explanation)."
                : "Giải thích còn sơ sài hoặc chỉ lặp lại đáp án; nên bổ sung lý do ngữ pháp/ngữ nghĩa.");
        }
        if (string.IsNullOrWhiteSpace(promptPinyin) && !string.IsNullOrWhiteSpace(promptHanzi))
        {
            warnings.Add("Nên bổ sung PromptPinyin cho câu có Hanzi.");
        }

        // Compute deterministic 0..100 quality score
        double score = 0;
        if (errors.Count == 0) score += 55;
        if (HasSubstantiveExplanation(explanation, resolvedCorrectAns)) score += 20;
        else if (!string.IsNullOrWhiteSpace(explanation) && explanation.Trim().Length >= 10) score += 5;
        if (!string.IsNullOrWhiteSpace(promptPinyin)) score += 10;
        if (!string.IsNullOrWhiteSpace(promptVietnamese)) score += 5;
        if (options.Count >= 4 || normalizedType is "fill-blank" or "sentence-order") score += 5;
        if (!string.IsNullOrWhiteSpace(tags)) score += 5;

        var contentHash = ComputeContentHash(
            hskLevel,
            normalizedType,
            promptHanzi,
            promptVietnamese,
            resolvedCorrectAns);

        return new QuestionValidationResult(
            IsValid: errors.Count == 0,
            Errors: errors,
            Warnings: warnings,
            QualityScore: Math.Round(Math.Clamp(score, 0, 100), 1),
            NormalizedType: normalizedType,
            NormalizedSkill: normalizedSkill,
            NormalizedDifficulty: normalizedDifficulty,
            NormalizedCorrectAnswer: resolvedCorrectAns,
            NormalizedCorrectOptionIndex: resolvedCorrectIdx,
            ContentHash: contentHash);
    }

    public static (bool IsCorrect, string GivenAnswer) GradeSubmission(
        ExerciseEntity exercise,
        int? selectedOption,
        List<string>? orderedTokens,
        List<string>? matchedPairs,
        string? textAnswer)
    {
        var normalizedType = NormalizeType(exercise.Type);
        var options = ParseOptions(exercise.OptionsJson);
        var sentenceTokens = ParseBracketedTokens(exercise.PromptHanzi);

        var hasTokenBuilder = normalizedType == "sentence-order"
            && sentenceTokens.Count > 0
            && options.Count == 0;

        if (hasTokenBuilder)
        {
            var assembled = string.Join(string.Empty, orderedTokens ?? []);
            var normUser = NormalizeAnswerText(assembled);
            var targetRaw = NormalizeAnswerText(exercise.CorrectAnswer);
            var targetStripped = NormalizeAnswerText(StripParentheticalNote(exercise.CorrectAnswer));
            var isCorrect = normUser.Length > 0 && (normUser == targetRaw || normUser == targetStripped);
            return (isCorrect, assembled);
        }

        if (normalizedType == "matching" && options.Count == 0 && (matchedPairs?.Count ?? 0) > 0)
        {
            var expectedCount = sentenceTokens.Count > 0 ? sentenceTokens.Count : Math.Max(1, matchedPairs!.Count);
            var isCorrect = matchedPairs!.Count >= expectedCount;
            return (isCorrect, isCorrect ? "matched pairs" : $"{matchedPairs.Count}/{expectedCount}");
        }

        if (options.Count > 0)
        {
            var isCorrect = selectedOption.HasValue
                && exercise.CorrectOptionIndex.HasValue
                && selectedOption.Value == exercise.CorrectOptionIndex.Value;
            var givenAnswer = selectedOption.HasValue && selectedOption.Value >= 0 && selectedOption.Value < options.Count
                ? options[selectedOption.Value]
                : string.Empty;
            return (isCorrect, givenAnswer);
        }

        var trimmed = (textAnswer ?? string.Empty).Trim();
        var userNorm = NormalizeAnswerText(trimmed);
        var cand1 = NormalizeAnswerText(exercise.CorrectAnswer);
        var cand2 = NormalizeAnswerText(StripParentheticalNote(exercise.CorrectAnswer));
        var ok = userNorm.Length > 0 && (userNorm == cand1 || (cand2.Length > 0 && userNorm == cand2));
        return (ok, trimmed);
    }
}

