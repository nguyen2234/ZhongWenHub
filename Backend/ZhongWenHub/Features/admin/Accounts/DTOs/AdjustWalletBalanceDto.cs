using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Business.Users.DTOs;

public class AdjustWalletBalanceDto
{
    [Required(ErrorMessage = "Số tiền điều chỉnh là bắt buộc")]
    public decimal Amount { get; set; }

    [Required(ErrorMessage = "Lý do điều chỉnh số dư là bắt buộc")]
    [MaxLength(500, ErrorMessage = "Lý do không được vượt quá 500 ký tự")]
    public string Reason { get; set; } = string.Empty;
}
