using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ZhongWenHub.Api.Controllers;
using ZhongWenHub.Common.Auth;
using ZhongWenHub.Features.admin.AiGovernance.DTO;

namespace ZhongWenHub.Features.admin.AiGovernance;

[ApiController]
[Route("api/v1/admin/ai-governance")]
[Authorize(Policy = PolicyConstants.AdminAccess)]
public class AiGovernanceController : BaseApiController
{
    private readonly IAiTokenGovernanceService _governanceService;

    public AiGovernanceController(IAiTokenGovernanceService governanceService)
    {
        _governanceService = governanceService;
    }

    [HttpGet("overview")]
    [ProducesResponseType(typeof(List<AiFeatureGovernanceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOverview(CancellationToken ct)
    {
        var overview = await _governanceService.GetGovernanceOverviewAsync(ct);
        return Ok(overview);
    }

    [HttpPut("{featureGroup}")]
    [ProducesResponseType(typeof(AiFeatureGovernanceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update(
        string featureGroup,
        [FromBody] UpdateAiFeatureGovernanceDto dto,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(featureGroup))
        {
            return BadRequest(new { message = "Feature group cannot be empty." });
        }

        var result = await _governanceService.UpdateGovernanceAsync(featureGroup.Trim().ToUpperInvariant(), dto, ct);
        return Ok(result);
    }
}
