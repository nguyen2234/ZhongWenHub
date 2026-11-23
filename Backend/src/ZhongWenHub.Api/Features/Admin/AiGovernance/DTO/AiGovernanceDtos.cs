using System;

namespace ZhongWenHub.Features.admin.AiGovernance.DTO;

public class AiFeatureGovernanceDto
{
    public Guid Id { get; set; }
    public string FeatureGroup { get; set; } = string.Empty;
    public string DisplayNameVi { get; set; } = string.Empty;
    public string? DescriptionVi { get; set; }
    public bool IsEnabled { get; set; }
    public long DailyTokenQuota { get; set; }
    public long MonthlyTokenQuota { get; set; }
    public int UserDailyRequestLimit { get; set; }
    public int MaxTokensPerRequest { get; set; }
    public long TokensUsedToday { get; set; }
    public long TokensUsedThisMonth { get; set; }
    public int RequestsToday { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class UpdateAiFeatureGovernanceDto
{
    public bool IsEnabled { get; set; } = true;
    public long DailyTokenQuota { get; set; } = 500_000;
    public long MonthlyTokenQuota { get; set; } = 15_000_000;
    public int UserDailyRequestLimit { get; set; } = 25;
    public int MaxTokensPerRequest { get; set; } = 2048;
}
