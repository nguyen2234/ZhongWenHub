using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Business.AILearning.DTOs;

public class GenerateLetterRequestDto
{
    [Required(ErrorMessage = "Chủ đề thư không được để trống.")]
    [MaxLength(200, ErrorMessage = "Chủ đề thư tối đa 200 ký tự.")]
    public string Topic { get; set; } = string.Empty;

    [MaxLength(50)]
    public string RecipientType { get; set; } = "friend"; // friend, teacher, employer, business_partner, company

    [Range(1, 6, ErrorMessage = "Trình độ HSK phải từ 1 đến 6.")]
    public int HskLevel { get; set; } = 3;

    [MaxLength(30)]
    public string Tone { get; set; } = "polite"; // casual, polite, formal

    [MaxLength(30)]
    public string Length { get; set; } = "medium"; // short, medium, detailed

    [MaxLength(1000)]
    public string? KeyPoints { get; set; }

    [MaxLength(2000)]
    public string? UserDraftText { get; set; }
}

public class LetterVocabularyHighlightDto
{
    public string WordZh { get; set; } = string.Empty;
    public string Pinyin { get; set; } = string.Empty;
    public string MeaningVi { get; set; } = string.Empty;
    public string UsageNoteVi { get; set; } = string.Empty;
}

public class LetterGrammarPatternDto
{
    public string PatternZh { get; set; } = string.Empty;
    public string Pinyin { get; set; } = string.Empty;
    public string MeaningVi { get; set; } = string.Empty;
    public string ExampleSentence { get; set; } = string.Empty;
}

public class LetterCorrectionDto
{
    public string OriginalText { get; set; } = string.Empty;
    public string CorrectedText { get; set; } = string.Empty;
    public string ReasonVi { get; set; } = string.Empty;
}

public class GeneratedLetterResponseDto
{
    public Guid SessionId { get; set; }
    public string TitleZh { get; set; } = string.Empty;
    public string SalutationZh { get; set; } = string.Empty;
    public string BodyZh { get; set; } = string.Empty;
    public string ClosingZh { get; set; } = string.Empty;
    public string SignOffZh { get; set; } = string.Empty;
    public string FullLetterZh { get; set; } = string.Empty;
    public string FullLetterPinyin { get; set; } = string.Empty;
    public string FullLetterVi { get; set; } = string.Empty;
    public List<LetterVocabularyHighlightDto> KeyVocabulary { get; set; } = new();
    public List<LetterGrammarPatternDto> KeyPatterns { get; set; } = new();
    public List<LetterCorrectionDto> UserDraftCorrections { get; set; } = new();
    public string PedagogicalAdviceVi { get; set; } = string.Empty;
    public int EstimatedHskLevel { get; set; }
    public int TotalTokensUsed { get; set; }
    public string ModelUsed { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class LetterSummaryDto
{
    public Guid SessionId { get; set; }
    public string TitleZh { get; set; } = string.Empty;
    public string ScenarioCode { get; set; } = string.Empty;
    public int HskLevel { get; set; }
    public string SnippetZh { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
