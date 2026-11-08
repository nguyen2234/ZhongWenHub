import os

path = r"Backend/src/Api/Controllers/ContentController.cs"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Grammar batch review & publish
grammar_endpoints = """
    [HttpPut("grammar/{id:guid}/review")]
    [HttpPut("/api/v1/admin/grammar/{id:guid}/review")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(GrammarPointDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReviewGrammarPoint(
        Guid id,
        [FromBody] ReviewContentDto dto,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var currentUserId = GetCurrentUserId();
        try
        {
            var updated = await _contentService.ReviewGrammarPointAsync(id, dto, currentUserId, cancellationToken);
            if (updated == null)
            {
                return NotFound(new { message = $"Không tìm thấy điểm ngữ pháp với ID {id}." });
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

    [HttpPost("grammar/batch-review")]
    [HttpPost("/api/v1/admin/grammar/batch-review")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(BatchReviewResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BatchReviewGrammarPoints(
        [FromBody] BatchReviewContentDto dto,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var currentUserId = GetCurrentUserId();
        try
        {
            var result = await _contentService.BatchReviewGrammarPointsAsync(dto, currentUserId, cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("grammar/batch-publish")]
    [HttpPost("/api/v1/admin/grammar/batch-publish")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(BatchPublishResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BatchPublishGrammarPoints(
        [FromBody] BatchPublishRequestDto dto,
        CancellationToken cancellationToken)
    {
        if (dto == null || dto.Ids == null || dto.Ids.Count == 0)
        {
            return BadRequest(new { message = "Vui lòng chọn ít nhất một điểm ngữ pháp để xuất bản." });
        }

        var currentUserId = GetCurrentUserId();
        var result = await _contentService.BatchPublishGrammarPointsAsync(dto.Ids, currentUserId, cancellationToken);
        return Ok(result);
    }
"""

marker_grammar = "DeleteGrammarPoint(Guid id, CancellationToken cancellationToken)\r\n    {\r\n        var deleted = await _contentService.DeleteGrammarPointAsync(id, cancellationToken);\r\n        if (!deleted)\r\n        {\r\n            return NotFound(new { message = $\"Không tìm thấy điểm ngữ pháp với ID {id}.\" });\r\n        }\r\n        return NoContent();\r\n    }"
if marker_grammar not in content:
    # try with LF
    marker_grammar = marker_grammar.replace("\r\n", "\n")

assert marker_grammar in content, "marker_grammar not found!"
content = content.replace(marker_grammar, marker_grammar + "\n" + grammar_endpoints)

# 2. Characters endpoints
characters_endpoints = """
    // ==========================================
    // HANZI CHARACTERS
    // ==========================================

    [HttpGet("characters")]
    [HttpGet("/api/v1/admin/characters")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResponse<HanziCharacterDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHanziCharacters(
        [FromQuery] int? hskLevel,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var items = await _contentService.GetHanziCharactersAsync(hskLevel, search, page, pageSize, cancellationToken);
        return Ok(items);
    }

    [HttpGet("characters/stats")]
    [HttpGet("/api/v1/admin/characters/stats")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AdminHanziStatsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHanziStats(CancellationToken cancellationToken)
    {
        var stats = await _contentService.GetHanziStatsAsync(cancellationToken);
        return Ok(stats);
    }

    [HttpGet("characters/{id:guid}")]
    [HttpGet("/api/v1/admin/characters/{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(HanziCharacterDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetHanziCharacterById(Guid id, CancellationToken cancellationToken)
    {
        var item = await _contentService.GetHanziCharacterByIdAsync(id, cancellationToken);
        if (item == null)
        {
            return NotFound(new { message = $"Không tìm thấy chữ Hán với ID {id}." });
        }
        return Ok(item);
    }

    [HttpPut("characters/{id:guid}")]
    [HttpPut("/api/v1/admin/characters/{id:guid}")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(HanziCharacterDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateHanziCharacter(
        Guid id,
        [FromBody] UpdateHanziCharacterDto dto,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var updated = await _contentService.UpdateHanziCharacterAsync(id, dto, cancellationToken);
        if (updated == null)
        {
            return NotFound(new { message = $"Không tìm thấy chữ Hán với ID {id}." });
        }
        return Ok(updated);
    }
}
"""

marker_end = "\r\n}\r\n"
if marker_end not in content:
    marker_end = "\n}\n"

last_brace = content.rfind(marker_end)
assert last_brace != -1, "last brace not found!"
content = content[:last_brace] + "\n" + characters_endpoints

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("[SUCCESS] ContentController.cs updated with grammar review & characters endpoints!")
