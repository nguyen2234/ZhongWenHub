using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ZhongWenHub.Api.Controllers;
using ZhongWenHub.Common.Auth;
using ZhongWenHub.Features.admin.AiProviders.DTO;

namespace ZhongWenHub.Features.admin.AiProviders;

[ApiController]
[Route("api/v1/admin/ai-providers")]
[Authorize(Policy = PolicyConstants.AdminAccess)]
public class AiProvidersController : BaseApiController
{
    private readonly IAiProviderManagementService _service;

    public AiProvidersController(IAiProviderManagementService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<AiProviderResponse>>> GetAll(CancellationToken ct)
    {
        var providers = await _service.GetAllAsync(ct);
        return Ok(providers);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AiProviderResponse>> GetById(Guid id, CancellationToken ct)
    {
        var provider = await _service.GetByIdAsync(id, ct);
        if (provider == null)
        {
            return NotFound(new { message = $"AI Provider with ID '{id}' not found." });
        }
        return Ok(provider);
    }

    [HttpPost]
    public async Task<ActionResult<AiProviderResponse>> Create([FromBody] CreateAiProviderRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var provider = await _service.CreateAsync(request, ct);
            return CreatedAtAction(nameof(GetById), new { id = provider.Id }, provider);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AiProviderResponse>> Update(Guid id, [FromBody] UpdateAiProviderRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var provider = await _service.UpdateAsync(id, request, ct);
            if (provider == null)
            {
                return NotFound(new { message = $"AI Provider with ID '{id}' not found." });
            }
            return Ok(provider);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id, CancellationToken ct)
    {
        var deleted = await _service.DeleteAsync(id, ct);
        if (!deleted)
        {
            return NotFound(new { message = $"AI Provider with ID '{id}' not found." });
        }
        return NoContent();
    }

    [HttpPatch("{id:guid}/enabled")]
    public async Task<ActionResult> ToggleEnabled(Guid id, [FromBody] ToggleEnabledRequest request, CancellationToken ct)
    {
        var updated = await _service.ToggleEnabledAsync(id, request.IsEnabled, ct);
        if (!updated)
        {
            return NotFound(new { message = $"AI Provider with ID '{id}' not found." });
        }
        return Ok(new { id, isEnabled = request.IsEnabled });
    }

    [HttpPost("{id:guid}/test")]
    public async Task<ActionResult<TestProviderResponse>> TestConnection(Guid id, CancellationToken ct)
    {
        try
        {
            var result = await _service.TestConnectionAsync(id, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = $"AI Provider with ID '{id}' not found." });
        }
    }

    [HttpPut("priorities")]
    public async Task<ActionResult> UpdatePriorities([FromBody] UpdateProviderPrioritiesRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        await _service.UpdatePrioritiesAsync(request, ct);
        return Ok(new { message = "Priorities updated successfully." });
    }

    [HttpGet("usage")]
    public async Task<ActionResult<AiUsageSummaryDto>> GetUsageSummary([FromQuery] int days = 7, CancellationToken ct = default)
    {
        var summary = await _service.GetUsageSummaryAsync(days, ct);
        return Ok(summary);
    }
}
