with open("Backend/src/Api/Controllers/ContentController.cs", "r", encoding="utf-8") as f:
    s = f.read()

target = "private bool IsStaff()\n    {\n        return User.IsInRole(RoleConstants.Admin)\n            || User.IsInRole(RoleConstants.ContentManager);\n    }"
target_crlf = target.replace("\n", "\r\n")

replacement = """private bool IsStaff()
    {
        return User.IsInRole(RoleConstants.Admin)
            || User.IsInRole(RoleConstants.ContentManager);
    }

    private Guid? GetCurrentUserId()
    {
        var idStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(idStr, out var id) ? id : null;
    }"""
replacement_crlf = replacement.replace("\n", "\r\n")

if target_crlf in s:
    s = s.replace(target_crlf, replacement_crlf)
elif target in s:
    s = s.replace(target, replacement)
else:
    raise Exception("target not found!")

with open("Backend/src/Api/Controllers/ContentController.cs", "w", encoding="utf-8") as f:
    f.write(s)

print("[SUCCESS] Added GetCurrentUserId to ContentController.cs")
