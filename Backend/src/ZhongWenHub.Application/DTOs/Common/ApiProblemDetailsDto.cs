namespace ZhongWenHub.Application.DTOs.Common;

public class ApiProblemDetailsDto
{
    public string Type { get; set; } = "https://tools.ietf.org/html/rfc7231#section-6.5.1";
    public string Title { get; set; } = "An error occurred while processing your request.";
    public int Status { get; set; } = 400;
    public string? Detail { get; set; }
    public string? Instance { get; set; }
    public IDictionary<string, string[]>? Errors { get; set; }
    public string? TraceId { get; set; }
}
