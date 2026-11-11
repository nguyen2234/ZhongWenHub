using System.Text.Json;

namespace ZhongWenHub.Business.AITutor.DTOs;

public sealed class AITutorChatRequestDto
{
    public string? ConversationId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Mode { get; set; } = "ASK";
    public AITutorContextDto? Context { get; set; }
}

public sealed class AITutorContextDto
{
    public string? Source { get; set; }
    public int? HskLevel { get; set; }
    public JsonElement? LessonId { get; set; }
    public string? LessonTitle { get; set; }
    public string? CurrentStep { get; set; }
    public List<string>? GrammarPoints { get; set; }
    public List<JsonElement>? VocabularyIds { get; set; }
    public AITutorVocabularyWordDto? VocabularyWord { get; set; }
    public AITutorExerciseContextDto? ExerciseContext { get; set; }
    public List<string>? Weaknesses { get; set; }
    public string? LanguagePreference { get; set; }
}

public sealed class AITutorVocabularyWordDto
{
    public string? Hanzi { get; set; }
    public string? Pinyin { get; set; }
    public string? Meaning { get; set; }
}

public sealed class AITutorExerciseContextDto
{
    public JsonElement? ExerciseId { get; set; }
    public string? Question { get; set; }
    public string? UserAnswer { get; set; }
    public string? CorrectAnswer { get; set; }
    public string? Explanation { get; set; }
    public string? PromptHanzi { get; set; }
    public string? PromptPinyin { get; set; }
    public string? PromptVietnamese { get; set; }
}

public sealed class AITutorChatResponseDto
{
    public string Type { get; set; } = "structured";
    public string? Summary { get; set; }
    public string? MarkdownFallback { get; set; }
    public List<JsonElement> Blocks { get; set; } = new();
    public List<string> SuggestedActions { get; set; } = new();
}
