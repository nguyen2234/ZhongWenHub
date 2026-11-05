namespace ZhongWenHub.Data.Entities;

public class UserWallet : BaseEntity
{
    public Guid UserId { get; set; }
    public decimal Balance { get; set; } = 0m;
    public string Currency { get; set; } = "VND";

    // Navigation
    public ApplicationUser User { get; set; } = null!;
    public ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();
}
