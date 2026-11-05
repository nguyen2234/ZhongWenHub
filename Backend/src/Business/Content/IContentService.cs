using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Content.DTOs;

namespace ZhongWenHub.Business.Content;

public interface IContentService
{
    // Courses
    Task<List<CourseDto>> GetCoursesAsync(int? hskLevel = null, string? status = null, bool publishedOnly = false, CancellationToken cancellationToken = default);
    Task<CourseDto?> GetCourseByIdAsync(Guid id, bool publishedOnly = false, CancellationToken cancellationToken = default);
    Task<CourseDto> CreateCourseAsync(CreateCourseDto dto, CancellationToken cancellationToken = default);
    Task<CourseDto?> UpdateCourseAsync(Guid id, UpdateCourseDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteCourseAsync(Guid id, CancellationToken cancellationToken = default);

    // Units
    Task<List<UnitDto>> GetUnitsAsync(Guid? courseId = null, string? status = null, bool publishedOnly = false, CancellationToken cancellationToken = default);
    Task<UnitDto?> GetUnitByIdAsync(Guid id, bool publishedOnly = false, CancellationToken cancellationToken = default);
    Task<UnitDto> CreateUnitAsync(CreateUnitDto dto, CancellationToken cancellationToken = default);
    Task<UnitDto?> UpdateUnitAsync(Guid id, UpdateUnitDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteUnitAsync(Guid id, CancellationToken cancellationToken = default);

    // Lessons
    Task<PagedResponse<LessonDto>> GetLessonsAsync(Guid? courseId = null, Guid? unitId = null, string? status = null, string? search = null, int page = 1, int pageSize = 20, bool publishedOnly = false, CancellationToken cancellationToken = default);
    Task<LessonDetailDto?> GetLessonByIdAsync(Guid id, bool publishedOnly = false, CancellationToken cancellationToken = default);
    Task<LessonDto> CreateLessonAsync(CreateLessonDto dto, CancellationToken cancellationToken = default);
    Task<LessonDto?> UpdateLessonAsync(Guid id, UpdateLessonDto dto, CancellationToken cancellationToken = default);
    Task<LessonDto?> UpdateLessonStatusAsync(Guid id, string status, CancellationToken cancellationToken = default);
    Task<bool> DeleteLessonAsync(Guid id, CancellationToken cancellationToken = default);

    // Vocabulary
    Task<PagedResponse<VocabularyDto>> GetVocabulariesAsync(int? hskLevel = null, Guid? lessonId = null, string? search = null, string? status = null, int page = 1, int pageSize = 20, bool publishedOnly = false, bool? missingMeaningVi = null, CancellationToken cancellationToken = default);
    Task<VocabularyDto?> GetVocabularyByIdAsync(Guid id, bool publishedOnly = false, CancellationToken cancellationToken = default);
    Task<VocabularyDto> CreateVocabularyAsync(CreateVocabularyDto dto, CancellationToken cancellationToken = default);
    Task<VocabularyDto?> UpdateVocabularyAsync(Guid id, UpdateVocabularyDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteVocabularyAsync(Guid id, CancellationToken cancellationToken = default);
    Task<VocabularyImportResultDto> ImportVocabulariesFromCsvAsync(Stream csvStream, bool dryRun = false, CancellationToken cancellationToken = default);
    Task<byte[]> GenerateVocabularyExcelTemplateAsync(CancellationToken cancellationToken = default);
    Task<byte[]> ExportVocabulariesExcelAsync(int? hskLevel = null, string? partOfSpeech = null, string? status = null, string? search = null, bool? missingMeaningVi = null, bool? needsReview = null, CancellationToken cancellationToken = default);
    Task<VocabularyImportResultDto> ImportVocabulariesFromExcelAsync(Stream excelStream, bool dryRun = false, CancellationToken cancellationToken = default);
    Task<BatchPublishResultDto> BatchPublishVocabulariesAsync(List<Guid> ids, CancellationToken cancellationToken = default);
    Task<BatchUpdateMeaningsResultDto> BatchUpdateMeaningsAsync(List<BatchUpdateMeaningItemDto> items, CancellationToken cancellationToken = default);

    // Grammar
    Task<PagedResponse<GrammarPointDto>> GetGrammarPointsAsync(int? hskLevel = null, string? category = null, string? search = null, string? status = null, int page = 1, int pageSize = 20, bool publishedOnly = false, CancellationToken cancellationToken = default);
    Task<GrammarPointDto?> GetGrammarPointByIdAsync(Guid id, bool publishedOnly = false, CancellationToken cancellationToken = default);
    Task<GrammarPointDto> CreateGrammarPointAsync(CreateGrammarPointDto dto, CancellationToken cancellationToken = default);
    Task<GrammarPointDto?> UpdateGrammarPointAsync(Guid id, UpdateGrammarPointDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteGrammarPointAsync(Guid id, CancellationToken cancellationToken = default);
    Task<AdminGrammarStatsDto> GetGrammarStatsAsync(CancellationToken cancellationToken = default);

    // Exercises
    Task<PagedResponse<ExerciseDto>> GetExercisesAsync(int? hskLevel = null, string? type = null, string? skill = null, Guid? lessonId = null, string? search = null, string? status = null, int page = 1, int pageSize = 20, bool publishedOnly = false, CancellationToken cancellationToken = default);
    Task<ExerciseDto?> GetExerciseByIdAsync(Guid id, bool publishedOnly = false, CancellationToken cancellationToken = default);
    Task<ExerciseDto> CreateExerciseAsync(CreateExerciseDto dto, CancellationToken cancellationToken = default);
    Task<ExerciseDto?> UpdateExerciseAsync(Guid id, UpdateExerciseDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteExerciseAsync(Guid id, CancellationToken cancellationToken = default);
    Task<AdminExerciseStatsDto> GetExerciseStatsAsync(CancellationToken cancellationToken = default);
}
