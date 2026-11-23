using Microsoft.AspNetCore.Http;

namespace ZhongWenHub.Business.AITutor;

public sealed class AITutorException : Exception
{
    public int StatusCode { get; }
    public string Title { get; }

    public AITutorException(int statusCode, string title, string message, Exception? innerException = null)
        : base(message, innerException)
    {
        StatusCode = statusCode;
        Title = title;
    }

    public static AITutorException MissingConfiguration() => new(
        StatusCodes.Status503ServiceUnavailable,
        "Dịch vụ AI chưa sẵn sàng",
        "Trợ giảng AI chưa được cấu hình API key trên máy chủ. Vui lòng liên hệ quản trị viên.");

    public static AITutorException UnauthorizedUser(string detail = "Phiên đăng nhập không hợp lệ hoặc tài khoản không còn hoạt động.") => new(
        StatusCodes.Status401Unauthorized,
        "Yêu cầu chưa được xác thực",
        detail);

    public static AITutorException BadRequest(string detail) => new(
        StatusCodes.Status400BadRequest,
        "Dữ liệu yêu cầu không hợp lệ",
        detail);

    public static AITutorException Timeout() => new(
        StatusCodes.Status504GatewayTimeout,
        "Quá thời gian chờ phản hồi AI",
        "Trợ giảng AI phản hồi quá thời gian quy định. Vui lòng thử lại.");

    public static AITutorException QuotaExceeded() => new(
        StatusCodes.Status429TooManyRequests,
        "Vượt quá giới hạn yêu cầu AI",
        "Dịch vụ AI đang quá tải hoặc hết hạn mức tạm thời (429). Vui lòng thử lại sau ít phút.");

    public static AITutorException ProviderUnavailable(string detail = "Không thể kết nối tới dịch vụ AI lúc này. Vui lòng thử lại sau.") => new(
        StatusCodes.Status502BadGateway,
        "Lỗi dịch vụ AI",
        detail);
}
