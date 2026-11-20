namespace ZhongWenHub.Business.Common;

public interface IDateTimeProvider
{
    DateTime UtcNow { get; }
}
