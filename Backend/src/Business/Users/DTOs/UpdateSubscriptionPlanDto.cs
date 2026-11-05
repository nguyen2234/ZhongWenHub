using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Business.Users.DTOs;

public class UpdateSubscriptionPlanDto
{
    [Required(ErrorMessage = "Tên gói là bắt buộc")]
    [RegularExpression("^(Free|Basic|Premium)$", ErrorMessage = "Gói chỉ có thể là Free, Basic hoặc Premium")]
    public string Plan { get; set; } = "Free";

    [Range(0, 120, ErrorMessage = "Thời hạn gói (tháng) phải từ 0 đến 120")]
    public int DurationMonths { get; set; } = 0; // 0 nghĩa là không giới hạn hoặc gói Free
}
