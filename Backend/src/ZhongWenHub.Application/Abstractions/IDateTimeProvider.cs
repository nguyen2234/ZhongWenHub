namespace ZhongWenHub.Application.Abstractions;

public interface IDateTimeProvider
{
    DateTime UtcNow { get; }
}
