path = r'D:\ZhongWenHub\Backend\src\Api\Controllers\ContentController.cs'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '''        var readiness = await _contentService.GetLessonReleaseReadinessAsync(id, cancellationToken);
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
    }'''

replacement = '''        var readiness = await _contentService.GetLessonReleaseReadinessAsync(id, cancellationToken);
        if (readiness == null)
        {
            return NotFound(new { message = $"Không tìm thấy bài học với ID {id}.", code = "LESSON_NOT_FOUND" });
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
    }'''

if target in content:
    content = content.replace(target, replacement, 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("ContentController updated successfully!")
else:
    print("Target not found!")
