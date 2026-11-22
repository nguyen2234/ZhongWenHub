using Microsoft.EntityFrameworkCore;

namespace ZhongWenHub.Data.Persistence;

public class ApplicationDbContext : ZhongWenHub.Data.AppDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public ApplicationDbContext(DbContextOptions<ZhongWenHub.Data.AppDbContext> options)
        : base(options)
    {
    }
}
