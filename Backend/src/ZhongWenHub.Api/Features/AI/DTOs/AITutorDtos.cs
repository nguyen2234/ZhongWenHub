using System.Text.Json;

namespace ZhongWenHub.Business.AITutor.DTOs;

public sealed class AITutorChatRequestDto
{
    public string? ConversationId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Mode { get; set; } = "ASK";
    public AITutorContextDto? Context { get; set; }
    public List<AITutorHistoryTurnDto>? History { get; set; }
}

public sealed class AITutorHistoryTurnDto
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

public sealed class AITutorContextDto
{
    public string? Source { get; set; }
    public int? HskLevel { get; set; }
    public JsonElement? LessonId { get; set; }
    public string? LessonTitle { get; set; }
    public string? CurrentStep { get; set; }
    public JsonElement? GrammarPointId { get; set; }
    public List<string>? GrammarPoints { get; set; }
    public List<JsonElement>? VocabularyIds { get; set; }
    public AITutorVocabularyWordDto? VocabularyWord { get; set; }
    public AITutorExerciseContextDto? ExerciseContext { get; set; }
    public List<string>? Weaknesses { get; set; }
    public string? LearningGoal { get; set; }
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
    public string? ConversationId { get; set; }
    public string Type { get; set; } = "structured";
    public string? Summary { get; set; }
    public string? MarkdownFallback { get; set; }
    public List<JsonElement> Blocks { get; set; } = new();
    public List<string> SuggestedActions { get; set; } = new();
    public AIProviderMetaDto? Meta { get; set; }
}

public sealed class AITutorSessionSummaryDto
{
    public Guid SessionId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Mode { get; set; } = "ASK";
    public int HskLevel { get; set; }
    public int MessageCount { get; set; }
    public string? LastMessageSnippet { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public sealed class CreateAITutorSessionDto
{
    public string? Title { get; set; }
    public string? Mode { get; set; } = "ASK";
    public int? HskLevel { get; set; } = 1;
}

public sealed class AITutorSessionDetailDto
{
    public Guid SessionId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Mode { get; set; } = "ASK";
    public int HskLevel { get; set; }
    public List<AITutorMessageDto> Messages { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public sealed class AITutorMessageDto
{
    public Guid Id { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Pinyin { get; set; }
    public string? StructuredPayloadJson { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class AIProviderMetaDto
{
    public string Provider { get; set; } = "Gemini";
    public string Model { get; set; } = string.Empty;
    public bool IsMock { get; set; }
    public int PromptTokens { get; set; }
    public int CompletionTokens { get; set; }
    public int TotalTokens { get; set; }
    public int LatencyMs { get; set; }
}

