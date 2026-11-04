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
    // LESSONS
    // ==========================================

    [HttpGet("lessons")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResponse<LessonDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLessons(
        [FromQuery] Guid? courseId,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var publishedOnly = !IsStaff();
        var lessons = await _contentService.GetLessonsAsync(courseId, status, search, page, pageSize, publishedOnly, cancellationToken);
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
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResponse<VocabularyDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVocabularies(
        [FromQuery] int? hskLevel,
        [FromQuery] Guid? lessonId,
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var publishedOnly = !IsStaff();
        var items = await _contentService.GetVocabulariesAsync(hskLevel, lessonId, search, status, page, pageSize, publishedOnly, cancellationToken);
        return Ok(items);
    }

    [HttpGet("vocabularies/{id:guid}")]
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
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(VocabularyDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateVocabulary([FromBody] CreateVocabularyDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var created = await _contentService.CreateVocabularyAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetVocabularyById), new { id = created.Id }, created);
    }

    [HttpPut("vocabularies/{id:guid}")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(VocabularyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateVocabulary(Guid id, [FromBody] UpdateVocabularyDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var updated = await _contentService.UpdateVocabularyAsync(id, dto, cancellationToken);
        if (updated == null)
        {
            return NotFound(new { message = $"Không tìm thấy từ vựng với ID {id}." });
        }
        return Ok(updated);
    }

    [HttpDelete("vocabularies/{id:guid}")]
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

