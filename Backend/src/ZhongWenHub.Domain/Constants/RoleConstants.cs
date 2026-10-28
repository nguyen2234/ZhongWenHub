namespace ZhongWenHub.Domain.Constants;

public static class RoleConstants
{
    public const string SuperAdmin = "SUPER_ADMIN";
    public const string Admin = "ADMIN";
    public const string ContentManager = "CONTENT_MANAGER";
    public const string Teacher = "TEACHER";
    public const string Support = "SUPPORT";
    public const string Student = "STUDENT";

    public static readonly IReadOnlyList<string> AllRoles = new[]
    {
        SuperAdmin,
        Admin,
        ContentManager,
        Teacher,
        Support,
        Student
    };
}
