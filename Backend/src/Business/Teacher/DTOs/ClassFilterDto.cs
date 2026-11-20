using System;

namespace ZhongWenHub.Business.Teacher.DTOs;

public class ClassFilterDto
{
    public string? Search { get; set; }
    public string? HskLevelId { get; set; }
    public string? Status { get; set; }
    public string? LocationType { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string SortField { get; set; } = "startDate";
    public string SortDirection { get; set; } = "desc";
}
