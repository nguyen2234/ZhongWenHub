using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ZhongWenHub.Business.Common.DTOs;

namespace ZhongWenHub.IntegrationTests;

public class SystemEndpointsIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public SystemEndpointsIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task RootHealthCheck_Returns200Healthy()
    {
        var response = await _client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Equal("Healthy", body);
    }

    [Fact]
    public async Task SystemInfo_Returns200WithDatabaseStatusHealthy()
    {
        var response = await _client.GetAsync("/api/v1/system/info");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var info = await response.Content.ReadFromJsonAsync<SystemInfoResponseDto>(_jsonOptions);
        Assert.NotNull(info);
        Assert.Equal("ZhongWenHub Backend (BE-1)", info.AppName);
        Assert.Contains("Healthy", info.DatabaseStatus);
        Assert.NotEmpty(info.DotNetVersion);
    }
}
