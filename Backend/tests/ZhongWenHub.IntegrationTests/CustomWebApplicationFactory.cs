using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ZhongWenHub.Infrastructure.Persistence;

namespace ZhongWenHub.IntegrationTests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    public const string TestConnectionString =
        "Host=localhost;Port=5432;Database=zhongwenhub_test;Username=postgres;Password=postgres";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = TestConnectionString,
                ["JwtSettings:Secret"] = "ZhongWenHub_IntegrationTest_Super_Secret_Key_32_Bytes_Long_2026!"
            });
        });

        builder.ConfigureServices(services =>
        {
            // Remove existing ApplicationDbContext descriptor
            var dbContextDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
            if (dbContextDescriptor != null)
            {
                services.Remove(dbContextDescriptor);
            }

            // Register PostgreSQL with test database
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseNpgsql(TestConnectionString);
            });
        });
    }

    public HttpClient CreateNoCookieClient()
    {
        return CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = false
        });
    }
}
