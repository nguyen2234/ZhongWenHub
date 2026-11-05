using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Business.Learning.DTOs;

namespace ZhongWenHub.Business.Learning;

public interface ILearningService
{
    Task<StudentLearningStateDto> GetStudentLearningStateAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<StudentLearningStateDto> UpdatePreferencesAsync(Guid userId, UpdateLearningPreferencesDto dto, CancellationToken cancellationToken = default);
    Task<List<LessonProgressDto>> GetLessonProgressesAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<LessonProgressDto> UpdateLessonStepAsync(Guid userId, string lessonId, UpdateLessonStepDto dto, CancellationToken cancellationToken = default);
    Task<StudentLearningStateDto> CompleteLessonAsync(Guid userId, string lessonId, CompleteLessonDto dto, CancellationToken cancellationToken = default);
    Task<Dictionary<string, DailyActivityDto>> GetDailyActivitiesAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<StudentLearningStateDto> RecordPracticeAttemptAsync(Guid userId, RecordPracticeAttemptDto dto, CancellationToken cancellationToken = default);
    Task<StudentLearningStateDto> RecordPracticeSessionAsync(Guid userId, PracticeSessionResultDto dto, CancellationToken cancellationToken = default);
    Task<Dictionary<string, UserVocabularyStateDto>> GetVocabularyProgressAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<StudentLearningStateDto> RecordSrsReviewAsync(Guid userId, SrsReviewRequestDto dto, CancellationToken cancellationToken = default);
    Task<StudentLearningStateDto> CompleteSrsSessionAsync(Guid userId, CompleteSrsSessionDto dto, CancellationToken cancellationToken = default);
    Task<StudentLearningStateDto> AddVocabularyAsync(Guid userId, AddVocabularyRequestDto dto, CancellationToken cancellationToken = default);
}
