namespace ZhongWenHub.Business.Authentication;

public class JwtSettings
{
    public const string SectionName = "JwtSettings";

    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "ZhongWenHub";
    public string Audience { get; set; } = "ZhongWenHub-Client";
    public int AccessTokenExpirationMinutes { get; set; } = 15;
    public int RefreshTokenExpirationDays { get; set; } = 7;
    public int RefreshTokenExpirationDaysRememberMe { get; set; } = 30;
}
