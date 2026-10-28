using System.Net;
using System.Text.Json;
using ZhongWenHub.Application.DTOs.Common;

namespace ZhongWenHub.Api.Middleware;

public class ProblemDetailsMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ProblemDetailsMiddleware> _logger;
    private readonly IWebHostEnvironment _env;

    public ProblemDetailsMiddleware(RequestDelegate next, ILogger<ProblemDetailsMiddleware> logger, IWebHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Đã xảy ra ngoại lệ không được xử lý: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        var detail = _env.IsDevelopment()
            ? exception.Message
            : "Đã xảy ra lỗi nội bộ trên hệ thống máy chủ. Vui lòng liên hệ bộ phận hỗ trợ.";

        var problemDetails = new ApiProblemDetailsDto
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
            Title = "Lỗi máy chủ nội bộ",
            Status = StatusCodes.Status500InternalServerError,
            Detail = detail,
            Instance = context.Request.Path,
            TraceId = context.TraceIdentifier
        };

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };

        return context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, options));
    }
}
