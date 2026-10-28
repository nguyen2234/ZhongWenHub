namespace ZhongWenHub.Application.Abstractions;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Username { get; }
    string? Email { get; }
    bool IsAuthenticated { get; }
    IReadOnlyList<string> Roles { get; }
}
