namespace ZhongWenHub.Application.DTOs.Common;

public class PaginationQuery
{
    private const int MaxPageSize = 100;
    private int _pageSize = 20;

    public int PageNumber { get; set; } = 1;

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : (value <= 0 ? 1 : value);
    }

    public string? Search { get; set; }
    public string? SortBy { get; set; }
    public string SortDirection { get; set; } = "desc";
}
