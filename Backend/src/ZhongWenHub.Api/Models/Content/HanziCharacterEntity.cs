namespace ZhongWenHub.Data.Entities.Content;

public class HanziCharacterEntity : BaseEntity
{
    public string Character { get; set; } = string.Empty;
    public string? Pinyin { get; set; }
    public string? SinoVietnamese { get; set; }
    public string? MeaningVi { get; set; }
    public int? StrokeCount { get; set; }
    public string? Radical { get; set; }
    public int FirstHskLevel { get; set; } = 1;

    public ICollection<HanziLevelRequirementEntity> LevelRequirements { get; set; } = new List<HanziLevelRequirementEntity>();
}
