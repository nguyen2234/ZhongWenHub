using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Exams.DTOs;

namespace ZhongWenHub.Business.Exams;

public interface IExamService
{
    Task<PagedResponse<ExamDto>> GetExamsAsync(
        int? hskLevel,
        string? examType,
        string? status,
        string? search,
        int page,
        int pageSize,
        bool publishedOnly,
        CancellationToken cancellationToken = default);

    Task<ExamStatsDto> GetExamStatsAsync(CancellationToken cancellationToken = default);

    Task<ExamDetailDto?> GetExamByIdAsync(Guid id, bool publishedOnly, CancellationToken cancellationToken = default);

    Task<ExamDetailDto> CreateExamAsync(CreateExamDto dto, Guid? currentUserId, CancellationToken cancellationToken = default);

    Task<ExamDetailDto?> UpdateExamAsync(Guid id, UpdateExamDto dto, Guid? currentUserId, CancellationToken cancellationToken = default);

    Task<ExamDetailDto?> SetExamQuestionsAsync(Guid id, SetExamQuestionsDto dto, Guid? currentUserId, CancellationToken cancellationToken = default);

    Task<ExamDetailDto?> ReviewExamAsync(Guid id, ReviewExamDto dto, Guid? currentUserId, CancellationToken cancellationToken = default);

    Task<bool> DeleteExamAsync(Guid id, CancellationToken cancellationToken = default);
}
