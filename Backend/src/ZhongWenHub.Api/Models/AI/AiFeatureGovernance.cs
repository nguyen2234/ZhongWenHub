using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZhongWenHub.Data.Entities.AI;

[Table("AiFeatureGovernances")]
public class AiFeatureGovernance : BaseEntity
{
    [Required]
    [MaxLength(50)]
    public string FeatureGroup { get; set; } = string.Empty; // AI_LETTER_WRITING, AI_TUTOR, AI_CONVERSATION

    [Required]
    [MaxLength(100)]
    public string DisplayNameVi { get; set; } = string.Empty;

    public bool IsEnabled { get; set; } = true;

    public long DailyTokenQuota { get; set; } = 500_000;

    public long MonthlyTokenQuota { get; set; } = 15_000_000;

    public int UserDailyRequestLimit { get; set; } = 25;

    public int MaxTokensPerRequest { get; set; } = 2048;

    [MaxLength(500)]
    public string? DescriptionVi { get; set; }
}
