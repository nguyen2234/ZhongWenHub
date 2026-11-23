namespace ZhongWenHub.Data.Entities;

public class WalletTransaction : BaseEntity
{
    public Guid WalletId { get; set; }
    public Guid UserId { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceBefore { get; set; }
    public decimal BalanceAfter { get; set; }
    public string TransactionType { get; set; } = "ADMIN_ADJUST";
    public string Reason { get; set; } = string.Empty;
    public Guid? PerformedByAdminId { get; set; }

    // Navigation
    public UserWallet Wallet { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;
}
