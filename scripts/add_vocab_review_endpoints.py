import sys

path = r'Backend\src\Api\Controllers\ContentController.cs'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

vocab_endpoints = """    [HttpPut("vocabularies/{id:guid}/review")]
    [HttpPut("/api/v1/admin/vocabularies/{id:guid}/review")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(VocabularyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReviewVocabulary(
        Guid id,
        [FromBody] ReviewContentDto dto,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var currentUserId = GetCurrentUserId();
        try
        {
            var updated = await _contentService.ReviewVocabularyAsync(id, dto, currentUserId, cancellationToken);
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
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("vocabularies/batch-review")]
    [HttpPost("/api/v1/admin/vocabularies/batch-review")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(BatchReviewResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BatchReviewVocabularies(
        [FromBody] BatchReviewContentDto dto,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var currentUserId = GetCurrentUserId();
        try
        {
            var result = await _contentService.BatchReviewVocabulariesAsync(dto, currentUserId, cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
"""

anchor = '    // ==========================================\r\n    // GRAMMAR\r\n    // =========================================='
if anchor not in c:
    anchor = '    // ==========================================\n    // GRAMMAR\n    // =========================================='

assert anchor in c, 'Anchor not found!'
c = c.replace(anchor, vocab_endpoints + '\r\n' + anchor, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print('Successfully inserted ReviewVocabulary & BatchReviewVocabularies into ContentController.cs')
