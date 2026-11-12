using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.QuestionBank.DTOs;

namespace ZhongWenHub.Business.QuestionBank;

public interface IQuestionBankService
{
    Task<PagedResponse<QuestionBankItemDto>> GetQuestionBankAsync(
        int? hskLevel,
        string? skill,
        string? type,
        string? difficulty,
        string? status,
        string? reviewStatus,
        Guid? lessonId,
        Guid? grammarPointId,
        Guid? vocabularyId,
        string? tag,
        string? search,
        int page = 1,
        int pageSize = 20,
        string? administrativeApprovalStatus = null,
        CancellationToken cancellationToken = default);

    Task<QuestionBankItemDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<QuestionBankItemDto> CreateAsync(CreateQuestionBankItemDto dto, CancellationToken cancellationToken = default);
    Task<QuestionBankItemDto?> UpdateAsync(Guid id, UpdateQuestionBankItemDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task<QuestionBankStatsDto> GetStatsAsync(CancellationToken cancellationToken = default);
    Task<CheckDuplicatesResultDto> CheckDuplicatesAsync(CheckDuplicatesRequestDto dto, CancellationToken cancellationToken = default);

    Task<ImportQuestionsResultDto> ImportQuestionsAsync(
        ImportQuestionsRequestDto dto,
        CancellationToken cancellationToken = default);

    Task<List<QuestionBankItemDto>> ExportQuestionsAsync(
        int? hskLevel,
        string? skill,
        string? status,
        string? reviewStatus,
        int limit = 1000,
        CancellationToken cancellationToken = default);

    Task<GenerateQuestionsResultDto> GenerateQuestionsAsync(
        GenerateQuestionsRequestDto dto,
        CancellationToken cancellationToken = default);

    Task<QuestionBankItemDto?> ReviewAsync(
        Guid id,
        Guid reviewerId,
        ReviewQuestionRequestDto dto,
        CancellationToken cancellationToken = default);

    Task<BatchActionResultDto> BatchReviewAsync(
        Guid reviewerId,
        BatchReviewQuestionsRequestDto dto,
        CancellationToken cancellationToken = default);

    Task<QuestionBankItemDto?> PublishAsync(
        Guid id,
        Guid reviewerId,
        CancellationToken cancellationToken = default);

    Task<BatchActionResultDto> BatchPublishAsync(
        Guid reviewerId,
        List<Guid> questionIds,
        CancellationToken cancellationToken = default);

    Task<BulkAdministrativeApprovalResultDto> BulkAdministrativeApproveAsync(
        Guid actingUserId,
        BulkAdministrativeApprovalRequestDto dto,
        CancellationToken cancellationToken = default);

    Task<ReportQuestionResultDto?> ReportQuestionAsync(
        Guid id,
        Guid reporterUserId,
        ReportQuestionRequestDto dto,
        CancellationToken cancellationToken = default);

    // Student Adaptive Learning & Practice Sessions
    Task<AdaptiveRecommendationsResponseDto> GetAdaptiveRecommendationsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<PracticeSessionDto> CreatePracticeSessionAsync(
        Guid userId,
        CreatePracticeSessionRequestDto dto,
        CancellationToken cancellationToken = default);

    Task<PracticeSessionDto?> GetPracticeSessionAsync(
        Guid userId,
        Guid sessionId,
        CancellationToken cancellationToken = default);

    Task<SubmitPracticeSessionResultDto> SubmitPracticeSessionAsync(
        Guid userId,
        Guid sessionId,
        SubmitPracticeSessionRequestDto dto,
        CancellationToken cancellationToken = default);

    Task<List<PracticeSessionHistoryItemDto>> GetPracticeHistoryAsync(
        Guid userId,
        int limit = 20,
        CancellationToken cancellationToken = default);
}

