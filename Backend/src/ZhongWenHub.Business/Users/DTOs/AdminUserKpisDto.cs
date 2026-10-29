namespace ZhongWenHub.Business.Users.DTOs;

public class AdminUserKpisDto
{
    public int TotalLearners { get; set; }
    public int ActiveLearners { get; set; }
    public int LockedLearners { get; set; }
    public int NewLearners30d { get; set; }
}
