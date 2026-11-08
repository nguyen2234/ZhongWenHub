path = r'D:\ZhongWenHub\Backend\src\Api\Controllers\ContentController.cs'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

target = """    [HttpPut("lessons/{id:guid}/status")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(LessonDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateLessonStatus(Guid id, [FromBody] UpdateContentStatusDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var updated = await _contentService.UpdateLessonStatusAsync(id, dto.Status, cancellationToken);
            if (updated == null)
            {
                return NotFound(new { message = $"Không tìm thấy bài học với ID {id}.", code = "LESSON_NOT_FOUND" });
            }
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message, code = "INVALID_STATUS" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message, code = "RELEASE_GATE_VALIDATION_FAILED" });
        }
    }"""

replacement = """    [HttpPut("lessons/{id:guid}/status")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(LessonDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateLessonStatus(Guid id, [FromBody] UpdateContentStatusDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var currentUserId = GetCurrentUserId();
        try
        {
            var updated = await _contentService.UpdateLessonStatusAsync(id, dto.Status, currentUserId, cancellationToken);
            if (updated == null)
            {
                return NotFound(new { message = $"Không tìm thấy bài học với ID {id}.", code = "LESSON_NOT_FOUND" });
            }
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message, code = "INVALID_STATUS" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message, code = "RELEASE_GATE_VALIDATION_FAILED" });
        }
    }

    [HttpPut("lessons/{id:guid}/review")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(LessonDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReviewLesson(Guid id, [FromBody] ReviewContentDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var currentUserId = GetCurrentUserId();
        try
        {
            var updated = await _contentService.ReviewLessonAsync(id, dto, currentUserId, cancellationToken);
            if (updated == null)
            {
                return NotFound(new { message = $"Không tìm thấy bài học với ID {id}.", code = "LESSON_NOT_FOUND" });
            }
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message, code = "INVALID_STATUS" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message, code = "RELEASE_GATE_VALIDATION_FAILED" });
        }
    }"""

if target in c:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c.replace(target, replacement, 1))
    print("ContentController updated successfully with review endpoint!")
else:
    print("Target not found in ContentController!")
