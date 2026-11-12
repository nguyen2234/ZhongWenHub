using ZhongWenHub.Business.Common.DTOs;

namespace ZhongWenHub.UnitTests;

public class PagedResponseTests
{
    [Fact]
    public void PagedResponse_CalculatesCorrectPagesAndFlags()
    {
        var items = new List<string> { "item1", "item2" };
        var response = new PagedResponse<string>(items, totalItems: 42, pageNumber: 1, pageSize: 10);

        Assert.Equal(42, response.TotalItems);
        Assert.Equal(1, response.PageNumber);
        Assert.Equal(10, response.PageSize);
        Assert.Equal(5, response.TotalPages);
        Assert.False(response.HasPreviousPage);
        Assert.True(response.HasNextPage);
    }

    [Fact]
    public void PagedResponse_MiddlePage_HasBothPreviousAndNext()
    {
        var items = new List<string> { "item1" };
        var response = new PagedResponse<string>(items, totalItems: 30, pageNumber: 2, pageSize: 10);

        Assert.Equal(3, response.TotalPages);
        Assert.True(response.HasPreviousPage);
        Assert.True(response.HasNextPage);
    }

    [Fact]
    public void PagedResponse_LastPage_HasPreviousButNoNext()
    {
        var items = new List<string> { "item1" };
        var response = new PagedResponse<string>(items, totalItems: 30, pageNumber: 3, pageSize: 10);

        Assert.True(response.HasPreviousPage);
        Assert.False(response.HasNextPage);
    }

    [Fact]
    public void PaginationQuery_ClampsMaxPageSize()
    {
        var query = new PaginationQuery
        {
            PageSize = 200
        };

        Assert.Equal(100, query.PageSize);
    }
}
