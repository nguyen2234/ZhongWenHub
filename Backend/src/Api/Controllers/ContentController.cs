using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ZhongWenHub.Business.Authorization;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Content;
using ZhongWenHub.Business.Content.DTOs;
using ZhongWenHub.Data.Constants;

namespace ZhongWenHub.Api.Controllers;

[ApiController]
[Route("api/v1/content")]
public class ContentController : BaseApiController
{
    private readonly IContentService _contentService;
    private readonly ILogger<ContentController> _logger;

    public ContentController(IContentService contentService, ILogger<ContentController> logger)
    {
        _contentService = contentService;
        _logger = logger;
    }

    private bool IsStaff()
    {
        return User.IsInRole(RoleConstants.Admin)
            || User.IsInRole(RoleConstants.SuperAdmin)
            || User.IsInRole(RoleConstants.ContentManager);
    }

    // ==========================================
    // COURSES
    // ==========================================

    [HttpGet("courses")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<CourseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCourses(
        [FromQuery] int? hskLevel,
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var publishedOnly = !IsStaff();
        var courses = await _contentService.GetCoursesAsync(hskLevel, status, publishedOnly, cancellationToken);
        return Ok(courses);
    }

    [HttpGet("courses/{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CourseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCourseById(Guid id, CancellationToken cancellationToken)
    {
        var publishedOnly = !IsStaff();
        var course = await _contentService.GetCourseByIdAsync(id, publishedOnly, cancellationToken);
        if (course == null)
        {
            return NotFound(new { message = $"Không tìm thấy khóa học với ID {id}." });
        }
        return Ok(course);
    }

    [HttpPost("courses")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(CourseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateCourse([FromBody] CreateCourseDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var created = await _contentService.CreateCourseAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetCourseById), new { id = created.Id }, created);
    }

    [HttpPut("courses/{id:guid}")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(CourseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCourse(Guid id, [FromBody] UpdateCourseDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var updated = await _contentService.UpdateCourseAsync(id, dto, cancellationToken);
        if (updated == null)
        {
            return NotFound(new { message = $"Không tìm thấy khóa học với ID {id}." });
        }
        return Ok(updated);
    }

    [HttpDelete("courses/{id:guid}")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCourse(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _contentService.DeleteCourseAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound(new { message = $"Không tìm thấy khóa học với ID {id}." });
        }
        return NoContent();
    }

    // ==========================================
    // UNITS
    // ==========================================

    [HttpGet("units")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<UnitDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnits(
        [FromQuery] Guid? courseId,
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var publishedOnly = !IsStaff();
        var units = await _contentService.GetUnitsAsync(courseId, status, publishedOnly, cancellationToken);
        return Ok(units);
    }

    [HttpGet("units/{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(UnitDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUnitById(Guid id, CancellationToken cancellationToken)
    {
        var publishedOnly = !IsStaff();
        var unit = await _contentService.GetUnitByIdAsync(id, publishedOnly, cancellationToken);
        if (unit == null)
        {
            return NotFound(new { message = $"Không tìm thấy Unit với ID {id}." });
        }
        return Ok(unit);
    }

    [HttpPost("units")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(UnitDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateUnit([FromBody] CreateUnitDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var created = await _contentService.CreateUnitAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetUnitById), new { id = created.Id }, created);
    }

    [HttpPut("units/{id:guid}")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(UnitDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUnit(Guid id, [FromBody] UpdateUnitDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var updated = await _contentService.UpdateUnitAsync(id, dto, cancellationToken);
        if (updated == null)
        {
            return NotFound(new { message = $"Không tìm thấy Unit với ID {id}." });
        }
        return Ok(updated);
    }

    [HttpDelete("units/{id:guid}")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUnit(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _contentService.DeleteUnitAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound(new { message = $"Không tìm thấy Unit với ID {id}." });
        }
        return NoContent();
    }

    // ==========================================
    // LESSONS
    // ==========================================

    [HttpGet("lessons")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResponse<LessonDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLessons(
        [FromQuery] Guid? courseId,
        [FromQuery] Guid? unitId,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var publishedOnly = !IsStaff();
        var lessons = await _contentService.GetLessonsAsync(courseId, unitId, status, search, page, pageSize, publishedOnly, cancellationToken);
        return Ok(lessons);
    }

    [HttpGet("lessons/{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LessonDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLessonById(Guid id, CancellationToken cancellationToken)
    {
        var publishedOnly = !IsStaff();
        var lesson = await _contentService.GetLessonByIdAsync(id, publishedOnly, cancellationToken);
        if (lesson == null)
        {
            return NotFound(new { message = $"Không tìm thấy bài học với ID {id}." });
        }
        return Ok(lesson);
    }

    [HttpPost("lessons")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(LessonDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateLesson([FromBody] CreateLessonDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var created = await _contentService.CreateLessonAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetLessonById), new { id = created.Id }, created);
    }

    [HttpPut("lessons/{id:guid}")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(LessonDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateLesson(Guid id, [FromBody] UpdateLessonDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var updated = await _contentService.UpdateLessonAsync(id, dto, cancellationToken);
        if (updated == null)
        {
            return NotFound(new { message = $"Không tìm thấy bài học với ID {id}." });
        }
        return Ok(updated);
    }

    [HttpPut("lessons/{id:guid}/status")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(LessonDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateLessonStatus(Guid id, [FromBody] UpdateContentStatusDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var updated = await _contentService.UpdateLessonStatusAsync(id, dto.Status, cancellationToken);
        if (updated == null)
        {
            return NotFound(new { message = $"Không tìm thấy bài học với ID {id}." });
        }
        return Ok(updated);
    }

    [HttpDelete("lessons/{id:guid}")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteLesson(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _contentService.DeleteLessonAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound(new { message = $"Không tìm thấy bài học với ID {id}." });
        }
        return NoContent();
    }

    // ==========================================
    // VOCABULARY
    // ==========================================

    [HttpGet("vocabularies")]
    [HttpGet("/api/v1/admin/vocabularies")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResponse<VocabularyDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVocabularies(
        [FromQuery] int? hskLevel,
        [FromQuery] Guid? lessonId,
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] bool? missingMeaningVi,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var publishedOnly = !IsStaff();
        var items = await _contentService.GetVocabulariesAsync(hskLevel, lessonId, search, status, page, pageSize, publishedOnly, missingMeaningVi, cancellationToken);
        return Ok(items);
    }

    [HttpGet("vocabularies/{id:guid}")]
    [HttpGet("/api/v1/admin/vocabularies/{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VocabularyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetVocabularyById(Guid id, CancellationToken cancellationToken)
    {
        var publishedOnly = !IsStaff();
        var item = await _contentService.GetVocabularyByIdAsync(id, publishedOnly, cancellationToken);
        if (item == null)
        {
            return NotFound(new { message = $"Không tìm thấy từ vựng với ID {id}." });
        }
        return Ok(item);
    }

    [HttpPost("vocabularies")]
    [HttpPost("/api/v1/admin/vocabularies")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(VocabularyDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateVocabulary([FromBody] CreateVocabularyDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var created = await _contentService.CreateVocabularyAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetVocabularyById), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("vocabularies/{id:guid}")]
    [HttpPut("/api/v1/admin/vocabularies/{id:guid}")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(VocabularyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateVocabulary(Guid id, [FromBody] UpdateVocabularyDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var updated = await _contentService.UpdateVocabularyAsync(id, dto, cancellationToken);
            if (updated == null)
            {
                return NotFound(new { message = $"Không tìm thấy từ vựng với ID {id}." });
            }
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("vocabularies/import-csv")]
    [HttpPost("/api/v1/admin/vocabularies/import-csv")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(VocabularyImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [RequestSizeLimit(50 * 1024 * 1024)]
    public async Task<IActionResult> ImportVocabulariesCsv(
        IFormFile? file,
        [FromQuery] bool dryRun = false,
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Vui lòng chọn file CSV để tải lên." });
        }

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Định dạng file không hợp lệ. Vui lòng chọn file .csv." });
        }

        try
        {
            using var stream = file.OpenReadStream();
            var result = await _contentService.ImportVocabulariesFromCsvAsync(stream, dryRun, cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("vocabularies/import-preview")]
    [HttpPost("/api/v1/admin/vocabularies/import-preview")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(VocabularyImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [RequestSizeLimit(50 * 1024 * 1024)]
    public async Task<IActionResult> PreviewVocabulariesCsv(
        IFormFile? file,
        CancellationToken cancellationToken = default)
    {
        return await ImportVocabulariesCsv(file, dryRun: true, cancellationToken);
    }

    [HttpGet("vocabularies/import-template")]
    [HttpGet("/api/v1/admin/vocabularies/import-template")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> DownloadVocabularyExcelTemplate(CancellationToken cancellationToken)
    {
        var bytes = await _contentService.GenerateVocabularyExcelTemplateAsync(cancellationToken);
        return File(
            bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Mau_Import_TuVung_HSK.xlsx");
    }

    [HttpGet("vocabularies/export-excel")]
    [HttpGet("/api/v1/admin/vocabularies/export-excel")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportVocabulariesExcel(
        [FromQuery] int? hskLevel = null,
        [FromQuery] string? partOfSpeech = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] bool? missingMeaningVi = null,
        [FromQuery] bool? needsReview = null,
        CancellationToken cancellationToken = default)
    {
        var bytes = await _contentService.ExportVocabulariesExcelAsync(hskLevel, partOfSpeech, status, search, missingMeaningVi, needsReview, cancellationToken);
        var fileName = $"ZhongWenHub_TuVung_HSK_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
        return File(
            bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileName);
    }

    [HttpPost("vocabularies/import-excel/preview")]
    [HttpPost("/api/v1/admin/vocabularies/import-excel/preview")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(VocabularyImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [RequestSizeLimit(50 * 1024 * 1024)]
    public async Task<IActionResult> PreviewVocabulariesExcel(
        IFormFile? file,
        CancellationToken cancellationToken = default)
    {
        return await ImportVocabulariesExcel(file, dryRun: true, cancellationToken);
    }

    [HttpPost("vocabularies/import-excel")]
    [HttpPost("/api/v1/admin/vocabularies/import-excel")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(VocabularyImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [RequestSizeLimit(50 * 1024 * 1024)]
    public async Task<IActionResult> ImportVocabulariesExcel(
        IFormFile? file,
        [FromQuery] bool dryRun = false,
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Vui lòng chọn file Excel để tải lên." });
        }

        if (!file.FileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Định dạng file không hợp lệ. Vui lòng chọn file .xlsx." });
        }

        try
        {
            using var stream = file.OpenReadStream();
            var result = await _contentService.ImportVocabulariesFromExcelAsync(stream, dryRun, cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("vocabularies/{id:guid}")]
    [HttpDelete("/api/v1/admin/vocabularies/{id:guid}")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteVocabulary(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _contentService.DeleteVocabularyAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound(new { message = $"Không tìm thấy từ vựng với ID {id}." });
        }
        return NoContent();
    }

    [HttpPost("vocabularies/batch-publish")]
    [HttpPost("/api/v1/admin/vocabularies/batch-publish")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(BatchPublishResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BatchPublishVocabularies(
        [FromBody] BatchPublishRequestDto dto,
        CancellationToken cancellationToken)
    {
        if (dto == null || dto.Ids == null || dto.Ids.Count == 0)
        {
            return BadRequest(new { message = "Vui lòng chọn ít nhất một từ vựng để xuất bản." });
        }

        var result = await _contentService.BatchPublishVocabulariesAsync(dto.Ids, cancellationToken);
        return Ok(result);
    }

    [HttpPost("vocabularies/batch-update-meanings")]
    [HttpPost("/api/v1/admin/vocabularies/batch-update-meanings")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(BatchUpdateMeaningsResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BatchUpdateMeanings(
        [FromBody] BatchUpdateMeaningsRequestDto dto,
        CancellationToken cancellationToken)
    {
        if (dto == null || dto.Items == null || dto.Items.Count == 0)
        {
            return BadRequest(new { message = "Danh sách cập nhật nghĩa từ vựng không được để trống." });
        }

        var result = await _contentService.BatchUpdateMeaningsAsync(dto.Items, cancellationToken);
        return Ok(result);
    }

    // ==========================================
    // GRAMMAR
    // ==========================================

    [HttpGet("grammar")]
    [HttpGet("/api/v1/admin/grammar")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResponse<GrammarPointDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetGrammarPoints(
        [FromQuery] int? hskLevel,
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var publishedOnly = !IsStaff();
        var items = await _contentService.GetGrammarPointsAsync(hskLevel, category, search, status, page, pageSize, publishedOnly, cancellationToken);
        return Ok(items);
    }

    [HttpGet("grammar/stats")]
    [HttpGet("/api/v1/admin/grammar/stats")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AdminGrammarStatsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetGrammarStats(CancellationToken cancellationToken)
    {
        var stats = await _contentService.GetGrammarStatsAsync(cancellationToken);
        return Ok(stats);
    }

    [HttpGet("grammar/{id:guid}")]
    [HttpGet("/api/v1/admin/grammar/{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(GrammarPointDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetGrammarPointById(Guid id, CancellationToken cancellationToken)
    {
        var publishedOnly = !IsStaff();
        var item = await _contentService.GetGrammarPointByIdAsync(id, publishedOnly, cancellationToken);
        if (item == null)
        {
            return NotFound(new { message = $"Không tìm thấy điểm ngữ pháp với ID {id}." });
        }
        return Ok(item);
    }

    [HttpPost("grammar")]
    [HttpPost("/api/v1/admin/grammar")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(GrammarPointDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateGrammarPoint([FromBody] CreateGrammarPointDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var created = await _contentService.CreateGrammarPointAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetGrammarPointById), new { id = created.Id }, created);
    }

    [HttpPut("grammar/{id:guid}")]
    [HttpPut("/api/v1/admin/grammar/{id:guid}")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(GrammarPointDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateGrammarPoint(Guid id, [FromBody] UpdateGrammarPointDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var updated = await _contentService.UpdateGrammarPointAsync(id, dto, cancellationToken);
        if (updated == null)
        {
            return NotFound(new { message = $"Không tìm thấy điểm ngữ pháp với ID {id}." });
        }
        return Ok(updated);
    }

    [HttpDelete("grammar/{id:guid}")]
    [HttpDelete("/api/v1/admin/grammar/{id:guid}")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteGrammarPoint(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _contentService.DeleteGrammarPointAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound(new { message = $"Không tìm thấy điểm ngữ pháp với ID {id}." });
        }
        return NoContent();
    }

    // ==========================================
    // EXERCISES
    // ==========================================

    [HttpGet("exercises")]
    [HttpGet("/api/v1/admin/exercises")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResponse<ExerciseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetExercises(
        [FromQuery] int? hskLevel,
        [FromQuery] string? type,
        [FromQuery] string? skill,
        [FromQuery] Guid? lessonId,
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var publishedOnly = !IsStaff();
        var items = await _contentService.GetExercisesAsync(hskLevel, type, skill, lessonId, search, status, page, pageSize, publishedOnly, cancellationToken);
        return Ok(items);
    }

    [HttpGet("exercises/stats")]
    [HttpGet("/api/v1/admin/exercises/stats")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AdminExerciseStatsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetExerciseStats(CancellationToken cancellationToken)
    {
        var stats = await _contentService.GetExerciseStatsAsync(cancellationToken);
        return Ok(stats);
    }

    [HttpGet("exercises/{id:guid}")]
    [HttpGet("/api/v1/admin/exercises/{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ExerciseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetExerciseById(Guid id, CancellationToken cancellationToken)
    {
        var publishedOnly = !IsStaff();
        var item = await _contentService.GetExerciseByIdAsync(id, publishedOnly, cancellationToken);
        if (item == null)
        {
            return NotFound(new { message = $"Không tìm thấy bài tập với ID {id}." });
        }
        return Ok(item);
    }

    [HttpPost("exercises")]
    [HttpPost("/api/v1/admin/exercises")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(ExerciseDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateExercise([FromBody] CreateExerciseDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var created = await _contentService.CreateExerciseAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetExerciseById), new { id = created.Id }, created);
    }

    [HttpPut("exercises/{id:guid}")]
    [HttpPut("/api/v1/admin/exercises/{id:guid}")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(ExerciseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateExercise(Guid id, [FromBody] UpdateExerciseDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var updated = await _contentService.UpdateExerciseAsync(id, dto, cancellationToken);
        if (updated == null)
        {
            return NotFound(new { message = $"Không tìm thấy bài tập với ID {id}." });
        }
        return Ok(updated);
    }

    [HttpDelete("exercises/{id:guid}")]
    [HttpDelete("/api/v1/admin/exercises/{id:guid}")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteExercise(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _contentService.DeleteExerciseAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound(new { message = $"Không tìm thấy bài tập với ID {id}." });
        }
        return NoContent();
    }
}
