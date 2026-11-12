namespace ZhongWenHub.Data.Entities.Content;

public class HanziLevelRequirementEntity : BaseEntity
{
    public Guid CharacterId { get; set; }
    public HanziCharacterEntity? CharacterEntity { get; set; }

    public string Character { get; set; } = string.Empty;
    public int HskLevel { get; set; } = 1;
    public int Type { get; set; } = 1; // 1: 手写字 (Handwriting), 2: 识字 (Recognition)
    public string TypeName { get; set; } = "Handwriting";
    public string? SourceDataset { get; set; } = "HSK 3.0 (2025-11)";
}
