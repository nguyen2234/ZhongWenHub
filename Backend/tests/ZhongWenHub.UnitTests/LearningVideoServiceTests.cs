using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Xunit;
using ZhongWenHub.Business.Content.DTOs;

namespace ZhongWenHub.UnitTests;

public class LearningVideoServiceTests
{
    private static IList<ValidationResult> ValidateDto(object dto)
    {
        var context = new ValidationContext(dto);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(dto, context, results, validateAllProperties: true);
        return results;
    }

    [Fact]
    public void CreateLearningVideoDto_ValidYouTubeVideo_PassesValidation()
    {
        var dto = new CreateLearningVideoDto
        {
            Title = "HSK 1 - Chào hỏi và giới thiệu bản thân",
            Description = "Bài học video đàm thoại sơ cấp",
            SourceType = "YouTube",
            YouTubeVideoId = "4lHwBZr66so",
            ThumbnailUrl = "https://img.youtube.com/vi/4lHwBZr66so/hqdefault.jpg",
            DurationSeconds = 180,
            HskLevel = 1,
            Topic = "Giao tiếp hàng ngày",
            Status = "Published"
        };

        var errors = ValidateDto(dto);

        Assert.Empty(errors);
    }

    [Fact]
    public void CreateLearningVideoDto_YouTubeWithoutVideoId_FailsValidation()
    {
        var dto = new CreateLearningVideoDto
        {
            Title = "Video thiếu ID",
            SourceType = "YouTube",
            YouTubeVideoId = null,
            ThumbnailUrl = "https://example.com/thumb.jpg",
            DurationSeconds = 120,
            HskLevel = 2,
            Topic = "Giao tiếp hàng ngày",
            Status = "Draft"
        };

        var errors = ValidateDto(dto);

        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(dto.YouTubeVideoId)));
    }

    [Fact]
    public void CreateLearningVideoDto_UploadedPublishedWithoutStoragePath_FailsValidation()
    {
        var dto = new CreateLearningVideoDto
        {
            Title = "Video tự tải lên chưa có file",
            SourceType = "Uploaded",
            StoragePath = null, // Missing storage path
            ThumbnailUrl = "https://example.com/thumb.jpg",
            DurationSeconds = 300,
            HskLevel = 3,
            Topic = "Du lịch & Đời sống",
            Status = "Published" // Cannot publish without storage path
        };

        var errors = ValidateDto(dto);

        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(dto.StoragePath)));
    }

    [Fact]
    public void CreateLearningVideoDto_UploadedDraftWithoutStoragePath_AllowedInDraft()
    {
        var dto = new CreateLearningVideoDto
        {
            Title = "Video tự tải lên đang soạn thảo",
            SourceType = "Uploaded",
            StoragePath = null,
            ThumbnailUrl = "https://example.com/thumb.jpg",
            DurationSeconds = 300,
            HskLevel = 3,
            Topic = "Du lịch & Đời sống",
            Status = "Draft" // Draft allows storage path to be uploaded later
        };

        var errors = ValidateDto(dto);

        Assert.Empty(errors);
    }

    [Fact]
    public void CreateLearningVideoDto_InvalidSourceType_FailsValidation()
    {
        var dto = new CreateLearningVideoDto
        {
            Title = "Video nguồn không hợp lệ",
            SourceType = "Vimeo", // Only YouTube or Uploaded permitted
            ThumbnailUrl = "https://example.com/thumb.jpg",
            DurationSeconds = 120,
            HskLevel = 1,
            Topic = "Giao tiếp hàng ngày"
        };

        var errors = ValidateDto(dto);

        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(dto.SourceType)));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(7)]
    [InlineData(-1)]
    public void CreateLearningVideoDto_HskLevelOutOfRange_FailsValidation(int invalidLevel)
    {
        var dto = new CreateLearningVideoDto
        {
            Title = "HSK level test",
            SourceType = "YouTube",
            YouTubeVideoId = "abc12345678",
            ThumbnailUrl = "https://example.com/thumb.jpg",
            HskLevel = invalidLevel,
            Topic = "Giao tiếp hàng ngày"
        };

        var errors = ValidateDto(dto);

        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(dto.HskLevel)));
    }

    [Theory]
    [InlineData(0, "00:00")]
    [InlineData(45, "00:45")]
    [InlineData(180, "03:00")]
    [InlineData(754, "12:34")]
    [InlineData(3600, "01:00:00")]
    [InlineData(3665, "01:01:05")]
    public void LearningVideoDto_FormatDuration_FormatsAccurately(int seconds, string expected)
    {
        var formatted = LearningVideoDto.FormatDuration(seconds);
        Assert.Equal(expected, formatted);
    }

    [Fact]
    public void LearningVideoDto_JsonSerialization_SerializesYoutubeVideoIdInLowercaseCamelCase()
    {
        var dto = new LearningVideoDto
        {
            Id = Guid.NewGuid(),
            Title = "Test Serializer",
            SourceType = "YouTube",
            YouTubeVideoId = "dQw4w9WgXcQ",
            ThumbnailUrl = "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
        };

        var json = System.Text.Json.JsonSerializer.Serialize(dto, new System.Text.Json.JsonSerializerOptions
        {
            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
        });

        Assert.Contains("\"youtubeVideoId\":\"dQw4w9WgXcQ\"", json);
    }
}

