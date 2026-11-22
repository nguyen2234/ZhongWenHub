using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace ZhongWenHub.Business.Users;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var sub = User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? User?.FindFirstValue("sub");
            return Guid.TryParse(sub, out var guid) ? guid : null;
        }
    }

    public string? Username => User?.FindFirstValue("username") ?? User?.Identity?.Name;

    public string? Email => User?.FindFirstValue(ClaimTypes.Email) ?? User?.FindFirstValue("email");

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public IReadOnlyList<string> Roles => User?.FindAll(ClaimTypes.Role)
        .Concat(User.FindAll("roles"))
        .Select(c => c.Value)
        .Distinct()
        .ToList() ?? new List<string>();
}
