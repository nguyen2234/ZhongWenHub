using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;
using ZhongWenHub.Business.Content.DTOs;
using ZhongWenHub.Business.Content.Helpers;
using ZhongWenHub.Business.Content.Services.Storage;

namespace ZhongWenHub.UnitTests;

public class VideoManagementAndStorageTests
{
    private class DummyHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Development";
        public string ApplicationName { get; set; } = "ZhongWenHub.UnitTests";
        public string ContentRootPath { get; set; } = Path.Combine(Path.GetTempPath(), "zwh_test_storage");
        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } = null!;
    }

    private static IList<ValidationResult> ValidateDto(object dto)
    {
        var context = new ValidationContext(dto);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(dto, context, results, validateAllProperties: true);
        return results;
    }

    [Theory]
    [InlineData("https://www.youtube.com/watch?v=4lHwBZr66so", "4lHwBZr66so")]
    [InlineData("https://m.youtube.com/watch?v=4lHwBZr66so&t=20s", "4lHwBZr66so")]
    [InlineData("https://youtu.be/4lHwBZr66so", "4lHwBZr66so")]
    [InlineData("https://www.youtube.com/embed/4lHwBZr66so", "4lHwBZr66so")]
    [InlineData("https://www.youtube.com/shorts/4lHwBZr66so", "4lHwBZr66so")]
    [InlineData("4lHwBZr66so", "4lHwBZr66so")]
    public void YouTubeUrlParser_ValidUrls_ExtractsCorrectVideoId(string input, string expectedId)
    {
        var extracted = YouTubeUrlParser.ExtractVideoId(input);
        Assert.Equal(expectedId, extracted);
    }

    [Theory]
    [InlineData("https://malicious-site.com/watch?v=4lHwBZr66so")]
    [InlineData("https://youtube.com.evil.com/4lHwBZr66so")]
    [InlineData("not-a-valid-id")]
    [InlineData("short")]
    [InlineData("too-long-video-id-12345678")]
    [InlineData("")]
    [InlineData(null)]
    public void YouTubeUrlParser_InvalidUrls_ReturnsNull(string? input)
    {
        var extracted = YouTubeUrlParser.ExtractVideoId(input);
        Assert.Null(extracted);
    }

    [Fact]
    public void YouTubeUrlParser_GenerateHqThumbnailUrl_ProducesStandardFormat()
    {
        var url = YouTubeUrlParser.GenerateHqThumbnailUrl("4lHwBZr66so");
        Assert.Equal("https://img.youtube.com/vi/4lHwBZr66so/hqdefault.jpg", url);
    }

    [Fact]
    public void CreateLearningVideoDto_WithYouTubeUrl_PassesValidation()
    {
        var dto = new CreateLearningVideoDto
        {
            Title = "Video đàm thoại HSK 1",
            SourceType = "YouTube",
            YouTubeUrl = "https://www.youtube.com/watch?v=k38L07o_9zM",
            ThumbnailUrl = "https://img.youtube.com/vi/k38L07o_9zM/hqdefault.jpg",
            DurationSeconds = 120,
            HskLevel = 1,
            Topic = "Giao tiếp hàng ngày",
            Status = "Draft"
        };

        var errors = ValidateDto(dto);
        Assert.Empty(errors);
    }

    [Fact]
    public void CreateLearningVideoDto_YouTubeWithoutUrlOrId_FailsValidation()
    {
        var dto = new CreateLearningVideoDto
        {
            Title = "Video thiếu nguồn",
            SourceType = "YouTube",
            YouTubeUrl = null,
            YouTubeVideoId = null,
            ThumbnailUrl = "https://example.com/thumb.jpg",
            DurationSeconds = 100,
            HskLevel = 2,
            Topic = "Giao tiếp hàng ngày"
        };

        var errors = ValidateDto(dto);
        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(dto.YouTubeVideoId)));
    }

    [Fact]
    public void UpdateLearningVideoDto_PublishedUploadedWithoutStoragePath_FailsValidation()
    {
        var dto = new UpdateLearningVideoDto
        {
            Title = "Video Upload thiếu tệp",
            SourceType = "Uploaded",
            StoragePath = null,
            ThumbnailUrl = "https://example.com/thumb.jpg",
            DurationSeconds = 150,
            HskLevel = 3,
            Topic = "Du lịch & Đời sống",
            Status = "Published"
        };

        var errors = ValidateDto(dto);
        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(dto.StoragePath)));
    }

    [Theory]
    [InlineData("Draft")]
    [InlineData("Published")]
    [InlineData("Hidden")]
    public void UpdateVideoStatusDto_ValidStatus_PassesValidation(string status)
    {
        var dto = new UpdateVideoStatusDto { Status = status };
        var errors = ValidateDto(dto);
        Assert.Empty(errors);
    }

    [Theory]
    [InlineData("InvalidStatus")]
    [InlineData("Deleted")]
    [InlineData("")]
    public void UpdateVideoStatusDto_InvalidStatus_FailsValidation(string status)
    {
        var dto = new UpdateVideoStatusDto { Status = status };
        var errors = ValidateDto(dto);
        Assert.NotEmpty(errors);
    }

    [Fact]
    public async Task VideoStorageService_UploadVideo_RejectsInvalidMimeType()
    {
        var options = Options.Create(new VideoStorageOptions());
        var env = new DummyHostEnvironment();
        var service = new VideoStorageService(options, env, new System.Net.Http.HttpClient(), NullLogger<VideoStorageService>.Instance);

        var bytes = Encoding.UTF8.GetBytes("fake executable binary content");
        using var stream = new MemoryStream(bytes);

        var result = await service.UploadVideoAsync(stream, "script.exe", "application/x-msdownload");

        Assert.False(result.Success);
        Assert.Contains("không được hỗ trợ", result.ErrorMessage);
    }

    [Fact]
    public async Task VideoStorageService_UploadVideo_RejectsOversizedFile()
    {
        var options = Options.Create(new VideoStorageOptions
        {
            MaxVideoSizeBytes = 100 // 100 bytes limit for test
        });
        var env = new DummyHostEnvironment();
        var service = new VideoStorageService(options, env, new System.Net.Http.HttpClient(), NullLogger<VideoStorageService>.Instance);

        var bytes = new byte[200];
        using var stream = new MemoryStream(bytes);

        var result = await service.UploadVideoAsync(stream, "big.mp4", "video/mp4");

        Assert.False(result.Success);
        Assert.Contains("vượt quá giới hạn cho phép", result.ErrorMessage);
    }

    [Fact]
    public async Task VideoStorageService_LocalStorage_SuccessfullySavesAndDeletesFile()
    {
        var tempDir = Path.Combine(Path.GetTempPath(), $"zwh_storage_test_{Guid.NewGuid():N}");
        var env = new DummyHostEnvironment { ContentRootPath = tempDir };
        var options = Options.Create(new VideoStorageOptions
        {
            Provider = "Local",
            Local = new LocalStorageConfig { Enabled = true, BaseUploadDirectory = "uploads" }
        });

        var service = new VideoStorageService(options, env, new System.Net.Http.HttpClient(), NullLogger<VideoStorageService>.Instance);

        var content = "dummy mp4 stream content";
        var bytes = Encoding.UTF8.GetBytes(content);
        using var stream = new MemoryStream(bytes);

        var result = await service.UploadVideoAsync(stream, "lesson1.mp4", "video/mp4");

        Assert.True(result.Success);
        Assert.NotNull(result.StoragePath);
        Assert.NotNull(result.PublicUrl);

        // Verify file was written to disk
        var filePath = Path.Combine(tempDir, "wwwroot", "uploads", result.StoragePath.Replace('/', Path.DirectorySeparatorChar));
        Assert.True(File.Exists(filePath));

        // Delete file
        var deleted = await service.DeleteFileAsync(result.StoragePath);
        Assert.True(deleted);
        Assert.False(File.Exists(filePath));

        // Cleanup temp folder
        if (Directory.Exists(tempDir))
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }
}
