namespace ZhongWenHub.Business.Users.DTOs;

public class AdminDashboardStatsDto
{
    public int TotalStudents { get; set; }
    public int TotalTeachers { get; set; }
    public int TotalStaff { get; set; }
    public int TotalCourses { get; set; }
    public int TotalClasses { get; set; }
    public int PendingSupportTickets { get; set; }
    public int ActiveUsers { get; set; }
    public int LockedUsers { get; set; }
    public int NewUsers30d { get; set; }
}
