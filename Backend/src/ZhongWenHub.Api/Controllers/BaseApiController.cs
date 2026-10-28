using Microsoft.AspNetCore.Mvc;
using ZhongWenHub.Application.DTOs.Common;

namespace ZhongWenHub.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    protected IActionResult ProblemDetailsResult(int statusCode, string title, string detail, IDictionary<string, string[]>? errors = null)
    {
        var problem = new ApiProblemDetailsDto
        {
            Type = $"https://httpstatuses.com/{statusCode}",
            Title = title,
            Status = statusCode,
            Detail = detail,
            Instance = HttpContext.Request.Path,
            Errors = errors,
            TraceId = HttpContext.TraceIdentifier
        };

        return StatusCode(statusCode, problem);
    }
}
