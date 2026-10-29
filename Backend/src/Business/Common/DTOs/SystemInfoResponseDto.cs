namespace ZhongWenHub.Business.Common.DTOs;

public class SystemInfoResponseDto
{
    public string AppName { get; set; } = "ZhongWenHub Backend";
    public string Version { get; set; } = "1.0.0-be1";
    public string Environment { get; set; } = "Development";
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
    public string DatabaseStatus { get; set; } = "Healthy";
    public string DotNetVersion { get; set; } = System.Environment.Version.ToString();
}
