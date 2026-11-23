using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Security;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;
using ZhongWenHub.Business.Content;
using ZhongWenHub.Business.Content.DTOs;
using ZhongWenHub.Business.Content.Helpers;
using ZhongWenHub.Business.Content.Services.Storage;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Persistence;

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

    // Helper: Valid MP4 magic bytes header (ftyp box at offset 4)
    private static byte[] CreateValidMp4Bytes(int totalSize = 64)
    {
        var bytes = new byte[Math.Max(32, totalSize)];
        bytes[0] = 0x00; bytes[1] = 0x00; bytes[2] = 0x00; bytes[3] = 0x18; // 24 bytes box size
        bytes[4] = 0x66; bytes[5] = 0x74; bytes[6] = 0x79; bytes[7] = 0x70; // "ftyp"
        bytes[8] = 0x6D; bytes[9] = 0x70; bytes[10] = 0x34; bytes[11] = 0x32; // "mp42"
        return bytes;
    }

    // Helper: Valid JPEG magic bytes header (0xFF, 0xD8, 0xFF)
    private static byte[] CreateValidJpegBytes(int totalSize = 32)
    {
        var bytes = new byte[Math.Max(16, totalSize)];
        bytes[0] = 0xFF; bytes[1] = 0xD8; bytes[2] = 0xFF; bytes[3] = 0xE0;
        return bytes;
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
    public void YouTubeUrlParser_GenerateHqThumbnailUrl_ReturnsCorrectCdnUrl()
    {
        var url = YouTubeUrlParser.GenerateHqThumbnailUrl("4lHwBZr66so");
        Assert.Equal("https://img.youtube.com/vi/4lHwBZr66so/hqdefault.jpg", url);
    }

    // ==========================================
    // PATH SECURITY & INJECTION TESTS
    // ==========================================

    [Theory]
    [InlineData("videos/202611/video_a1b2c3d4e5f60718293a4b5c6d7e8f90.mp4", true)]
    [InlineData("local://videos/202611/video_a1b2c3d4e5f60718293a4b5c6d7e8f90.webm", true)]
    [InlineData("supabase://thumbnails/202611/thumb_a1b2c3d4e5f60718293a4b5c6d7e8f90.jpg", true)]
    [InlineData("../../../etc/passwd", false)]
    [InlineData("..\\..\\appsettings.json", false)]
    [InlineData("videos/../../appsettings.json", false)]
    [InlineData("/absolute/path/to/video.mp4", false)]
    [InlineData("C:\\Windows\\System32\\cmd.exe", false)]
    [InlineData("http://attacker.com/evil.mp4", false)]
    [InlineData("videos/arbitrary.exe", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void StoragePathSecurity_IsValidStoragePath_RejectsPathTraversalAndInvalidSchemes(string? path, bool expectedValid)
    {
        var isValid = StoragePathSecurity.IsValidStoragePath(path);
        Assert.Equal(expectedValid, isValid);
    }

    [Fact]
    public void StoragePathSecurity_ResolveAndVerifyLocalPath_ThrowsSecurityExceptionOnTraversal()
    {
        var baseDir = Path.Combine(Path.GetTempPath(), "zwh_safe_root");
        Assert.Throws<SecurityException>(() =>
            StoragePathSecurity.ResolveAndVerifyLocalPath(baseDir, "../../../outside.mp4"));
    }

    [Fact]
    public void StoragePathSecurity_Parse_CorrectlySeparatesProviderAndRelativePath()
    {
        var (supProvider, supRel) = StoragePathSecurity.Parse("supabase://videos/202611/video_a1b2c3d4e5f60718293a4b5c6d7e8f90.mp4");
        Assert.Equal("Supabase", supProvider);
        Assert.Equal("videos/202611/video_a1b2c3d4e5f60718293a4b5c6d7e8f90.mp4", supRel);

        var (locProvider, locRel) = StoragePathSecurity.Parse("local://videos/202611/video_a1b2c3d4e5f60718293a4b5c6d7e8f90.mp4");
        Assert.Equal("LocalFileSystem", locProvider);
        Assert.Equal("videos/202611/video_a1b2c3d4e5f60718293a4b5c6d7e8f90.mp4", locRel);
    }

    // ==========================================
    // MAGIC BYTES & MIME SPOOFING TESTS
    // ==========================================

    [Fact]
    public void FileSignatureValidator_ValidMp4_ReturnsTrue()
    {
        var bytes = CreateValidMp4Bytes();
        using var stream = new MemoryStream(bytes);

        var valid = FileSignatureValidator.ValidateSignature(stream, "video/mp4", out var detected);
        Assert.True(valid);
        Assert.Equal("video/mp4", detected);
    }

    [Fact]
    public void FileSignatureValidator_SpoofedMimeType_RejectsFakeFile()
    {
        // Fake text/script pretending to be video/mp4
        var fakeBytes = Encoding.UTF8.GetBytes("echo 'malicious script'; exit 0;");
        using var stream = new MemoryStream(fakeBytes);

        var valid = FileSignatureValidator.ValidateSignature(stream, "video/mp4", out var detected);
        Assert.False(valid);
        Assert.Equal("Unknown", detected);
    }

    [Fact]
    public void FileSignatureValidator_ValidJpeg_ReturnsTrue()
    {
        var bytes = CreateValidJpegBytes();
        using var stream = new MemoryStream(bytes);

        var valid = FileSignatureValidator.ValidateSignature(stream, "image/jpeg", out var detected);
        Assert.True(valid);
        Assert.Equal("image/jpeg", detected);
    }

    // ==========================================
    // DTO VALIDATION TESTS
    // ==========================================

    [Fact]
    public void CreateLearningVideoDto_WithTraversingStoragePath_FailsValidation()
    {
        var dto = new CreateLearningVideoDto
        {
            Title = "Video Test",
            SourceType = "Uploaded",
            StoragePath = "../../appsettings.json",
            ThumbnailUrl = "https://example.com/thumb.jpg",
            HskLevel = 1,
            Topic = "Giao tiếp hàng ngày",
            Status = "Draft"
        };

        var errors = ValidateDto(dto);
        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(dto.StoragePath)) &&
                                     e.ErrorMessage!.Contains("không hợp lệ hoặc chứa ký tự nguy hiểm"));
    }

    [Fact]
    public void CreateLearningVideoDto_UploadedAndPublishedWithoutStoragePath_FailsValidation()
    {
        var dto = new CreateLearningVideoDto
        {
            Title = "Video Tự Tải",
            SourceType = "Uploaded",
            StoragePath = null,
            ThumbnailUrl = "https://example.com/thumb.jpg",
            HskLevel = 1,
            Topic = "Giao tiếp hàng ngày",
            Status = "Published"
        };

        var errors = ValidateDto(dto);
        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(dto.StoragePath)));
    }

    [Fact]
    public void CreateLearningVideoDto_MissingTitle_FailsValidation()
    {
        var dto = new CreateLearningVideoDto
        {
            Title = "",
            SourceType = "YouTube",
            YouTubeVideoId = "4lHwBZr66so",
            ThumbnailUrl = "https://example.com/thumb.jpg",
            HskLevel = 1,
            Topic = "Giao tiếp"
        };

        var errors = ValidateDto(dto);
        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(dto.Title)));
    }

    // ==========================================
    // STORAGE SERVICE & PROVIDER ISOLATION TESTS
    // ==========================================

    [Fact]
    public async Task VideoStorageService_UploadVideo_RejectsOversizedFile()
    {
        var options = Options.Create(new VideoStorageOptions
        {
            MaxVideoSizeBytes = 100 // 100 bytes limit for test
        });
        var env = new DummyHostEnvironment();
        var service = new VideoStorageService(options, env, new System.Net.Http.HttpClient(), NullLogger<VideoStorageService>.Instance);

        var bytes = CreateValidMp4Bytes(200);
        using var stream = new MemoryStream(bytes);

        var result = await service.UploadVideoAsync(stream, "big.mp4", "video/mp4");

        Assert.False(result.Success);
        Assert.Contains("vượt quá giới hạn cho phép", result.ErrorMessage);
    }

    [Fact]
    public async Task VideoStorageService_UploadVideo_RejectsMimeSpoofing()
    {
        var options = Options.Create(new VideoStorageOptions());
        var env = new DummyHostEnvironment();
        var service = new VideoStorageService(options, env, new System.Net.Http.HttpClient(), NullLogger<VideoStorageService>.Instance);

        var fakeBytes = Encoding.UTF8.GetBytes("fake exe file content");
        using var stream = new MemoryStream(fakeBytes);

        var result = await service.UploadVideoAsync(stream, "evil.mp4", "video/mp4");

        Assert.False(result.Success);
        Assert.Contains("magic bytes", result.ErrorMessage, StringComparison.OrdinalIgnoreCase);
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

        var bytes = CreateValidMp4Bytes(128);
        using var stream = new MemoryStream(bytes);

        var result = await service.UploadVideoAsync(stream, "lesson1.mp4", "video/mp4");

        Assert.True(result.Success);
        Assert.NotNull(result.StoragePath);
        Assert.StartsWith("local://", result.StoragePath);
        Assert.NotNull(result.PublicUrl);

        // Verify file was written to disk
        var cleanRel = StoragePathSecurity.ExtractRelativePath(result.StoragePath);
        var filePath = Path.Combine(tempDir, "wwwroot", "uploads", cleanRel.Replace('/', Path.DirectorySeparatorChar));
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

    [Fact]
    public void VideoStorageService_GetPublicUrl_PreservesCorrectProviderScheme()
    {
        var options = Options.Create(new VideoStorageOptions
        {
            Supabase = new SupabaseStorageConfig
            {
                ProjectUrl = "https://xyzcompany.supabase.co",
                ServiceRoleKey = "fake_key",
                BucketName = "learning-videos",
                PublicBaseUrl = "https://cdn.mycompany.com/videos"
            },
            Local = new LocalStorageConfig
            {
                PublicBaseUrl = "/uploads"
            }
        });

        var env = new DummyHostEnvironment();
        var service = new VideoStorageService(options, env, new System.Net.Http.HttpClient(), NullLogger<VideoStorageService>.Instance);

        // Supabase scheme URL
        var supUrl = service.GetPublicUrl("supabase://videos/202611/video_a1b2c3d4e5f60718293a4b5c6d7e8f90.mp4");
        Assert.Equal("https://cdn.mycompany.com/videos/videos/202611/video_a1b2c3d4e5f60718293a4b5c6d7e8f90.mp4", supUrl);

        // Local scheme URL
        var locUrl = service.GetPublicUrl("local://videos/202611/video_a1b2c3d4e5f60718293a4b5c6d7e8f90.mp4");
        Assert.Equal("/uploads/videos/202611/video_a1b2c3d4e5f60718293a4b5c6d7e8f90.mp4", locUrl);
    }
}
