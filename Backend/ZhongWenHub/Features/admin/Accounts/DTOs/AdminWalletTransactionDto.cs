namespace ZhongWenHub.Business.Users.DTOs;

public class AdminWalletTransactionDto
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceBefore { get; set; }
    public decimal BalanceAfter { get; set; }
    public string TransactionType { get; set; } = "ADMIN_ADJUST";
    public string Reason { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string CreatedAtFormatted { get; set; } = string.Empty;
}
