with open('Backend/src/Api/Controllers/ContentController.cs', 'r', encoding='utf-8') as f:
    text = f.read()

target = """    [HttpPut("lessons/{id:guid}/status")]
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
    }"""

replacement = """    [HttpGet("lessons/{id:guid}/release-readiness")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(LessonReleaseReadinessDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLessonReleaseReadiness(Guid id, CancellationToken cancellationToken)
    {
        var readiness = await _contentService.GetLessonReleaseReadinessAsync(id, cancellationToken);
        if (readiness == null)
        {
            return NotFound(new { message = $"Không tìm thấy bài học với ID {id}." });
        }
        return Ok(readiness);
    }

    [HttpPut("lessons/{id:guid}/status")]
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
                return NotFound(new { message = $"Không tìm thấy bài học với ID {id}." });
            }
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message, code = "RELEASE_GATE_VALIDATION_FAILED" });
        }
    }"""

if target in text:
    new_text = text.replace(target, replacement, 1)
    with open('Backend/src/Api/Controllers/ContentController.cs', 'w', encoding='utf-8') as f:
        f.write(new_text)
    print('Replacement successful in ContentController.cs')
else:
    print('Target not found in ContentController.cs')
