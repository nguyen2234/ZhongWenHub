using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace ZhongWenHub.Data.Persistence;

public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();

        // Locate Api directory containing appsettings.json
        var candidates = new[]
        {
            Path.Combine(Directory.GetCurrentDirectory(), "Backend", "src", "Api"),
            Path.Combine(Directory.GetCurrentDirectory(), "src", "Api"),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "Api"),
            Directory.GetCurrentDirectory(),
            AppContext.BaseDirectory
        };

        var basePath = candidates.FirstOrDefault(p => File.Exists(Path.Combine(p, "appsettings.json")))
            ?? Directory.GetCurrentDirectory();

        var configuration = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Chuỗi kết nối 'DefaultConnection' chưa được cấu hình. " +
                "Vui lòng cấu hình trong appsettings.json của project Api hoặc thiết lập biến môi trường ConnectionStrings__DefaultConnection.");
        }

        optionsBuilder.UseNpgsql(connectionString, npgsqlOptions =>
        {
            npgsqlOptions.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
        });

        return new ApplicationDbContext(optionsBuilder.Options);
    }
}
