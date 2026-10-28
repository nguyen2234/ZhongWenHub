using ZhongWenHub.Application.Abstractions;

namespace ZhongWenHub.Application.Services;

public class DateTimeProvider : IDateTimeProvider
{
    public DateTime UtcNow => DateTime.UtcNow;
}
