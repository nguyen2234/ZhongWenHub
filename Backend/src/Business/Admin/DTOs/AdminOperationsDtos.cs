using System;
using System.Collections.Generic;

namespace ZhongWenHub.Business.Admin.DTOs;

public class AdminAIServiceStatusDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public int? LatencyMs { get; set; }
    public string? Uptime { get; set; }
    public double? UsagePercent { get; set; }
    public string Status { get; set; } = "IDLE";
    public string Description { get; set; } = string.Empty;
    public int TotalEvents { get; set; }
}

public class AdminAIOperationsStatsDto
{
    public int TotalRequests { get; set; }
    public int AverageLatencyMs { get; set; }
    public double SuccessRate { get; set; }
    public int TotalTokens { get; set; }
    public List<AdminAIServiceStatusDto> Services { get; set; } = new();
}

public class AdminHskLevelDistributionDto
{
    public string Level { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
    public string Color { get; set; } = string.Empty;
}

public class AdminSkillMetricDto
{
    public string Skill { get; set; } = string.Empty;
    public int Hours { get; set; }
    public int AvgScore { get; set; }
}

public class AdminAnalyticsReportDto
{
    public int ActiveStudents { get; set; }
    public double CompletionRate { get; set; }
    public int LearningHours { get; set; }
    public double RetentionRate { get; set; }
    public List<AdminHskLevelDistributionDto> HskDistribution { get; set; } = new();
    public List<AdminSkillMetricDto> SkillMetrics { get; set; } = new();
}

public class AdminSystemSettingsDto
{
    public string PlatformName { get; set; } = "ZhongWenHub (中文社)";
    public string ContactEmail { get; set; } = "admin@zhongwenhub.edu.vn";
    public string Slogan { get; set; } = "Nền tảng đào tạo HSK và Tiếng Trung Thương mại Thông minh";
    public string DefaultLanguage { get; set; } = "vi-VN";
    public string Timezone { get; set; } = "Asia/Ho_Chi_Minh";
    public int MaxLoginAttempts { get; set; } = 5;
    public int SessionTimeoutMinutes { get; set; } = 60;
    public bool Require2FA { get; set; } = false;
    public string SystemNotice { get; set; } = "Hệ thống hoạt động ổn định trên nền tảng ASP.NET Core 10 & SQL Server.";
    public bool IsMaintenanceMode { get; set; } = false;
    public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;
}
