using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Business.Authorization;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Content;
using ZhongWenHub.Business.Content.DTOs;
using ZhongWenHub.Business.Content.Services.Storage;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Entities.Content;

namespace ZhongWenHub.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class VideosController : BaseApiController
{
    private readonly ILearningVideoService _videoService;
    private readonly IVideoStorageService _storageService;
    private readonly IStorageCleanupService _cleanupService;
    private readonly IUploadAssetService _uploadAssetService;
    private readonly ILogger<VideosController> _logger;

    public VideosController(
        ILearningVideoService videoService,
        IVideoStorageService storageService,
        IStorageCleanupService cleanupService,
        IUploadAssetService uploadAssetService,
        ILogger<VideosController> logger)
    {
        _videoService = videoService;
        _storageService = storageService;
        _cleanupService = cleanupService;
        _uploadAssetService = uploadAssetService;
        _logger = logger;
    }

    private bool IsStaff()
    {
        return User.IsInRole(RoleConstants.Admin) || User.IsInRole(RoleConstants.ContentManager);
    }

    // ==========================================
    // PUBLIC STUDENT ENDPOINTS
    // ==========================================

    /// <summary>
    /// Lấy danh sách video học tiếng Trung có phân trang, tìm kiếm và lọc theo HSK, chủ đề, nguồn video
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResponse<LearningVideoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVideos(
        [FromQuery] LearningVideoQueryDto query,
        CancellationToken cancellationToken)
    {
        var publishedOnly = !IsStaff();
        var result = await _videoService.GetVideosAsync(query, publishedOnly, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Lấy chi tiết một video học tiếng Trung theo Id
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LearningVideoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetVideoById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var video = await _videoService.GetVideoByIdAsync(id, IsStaff(), cancellationToken);
        if (video == null)
        {
            return NotFound(new { message = "Không tìm thấy video học tập." });
        }

        return Ok(video);
    }

    /// <summary>
    /// Lấy danh sách các chủ đề video khả dụng
    /// </summary>
    [HttpGet("topics")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTopics(CancellationToken cancellationToken)
    {
        var topics = await _videoService.GetAvailableTopicsAsync(cancellationToken);
        return Ok(topics);
    }

    // ==========================================
    // MANAGEMENT ENDPOINTS (ADMIN / CONTENT_MANAGER)
    // ==========================================

    /// <summary>
    /// Lấy danh sách video quản trị (bao gồm Draft, Published, Hidden)
    /// </summary>
    [HttpGet("manage")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(PagedResponse<LearningVideoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAdminVideos(
        [FromQuery] LearningVideoAdminQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _videoService.GetAdminVideosAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Lấy thông tin chi tiết video quản trị theo Id
    /// </summary>
    [HttpGet("manage/{id:guid}")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(LearningVideoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAdminVideoById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var video = await _videoService.GetVideoByIdAsync(id, isStaff: true, cancellationToken);
        if (video == null)
        {
            return NotFound(new { message = "Không tìm thấy video học tập." });
        }

        return Ok(video);
    }

    /// <summary>
    /// Tạo mới một video học tập
    /// </summary>
    [HttpPost("manage")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(LearningVideoDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateVideo(
        [FromBody] CreateLearningVideoDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var created = await _videoService.CreateVideoAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetAdminVideoById), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật thông tin một video học tập
    /// </summary>
    [HttpPut("manage/{id:guid}")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(LearningVideoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateVideo(
        Guid id,
        [FromBody] UpdateLearningVideoDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var updated = await _videoService.UpdateVideoAsync(id, dto, cancellationToken);
            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Đổi trạng thái xuất bản của video (Draft / Published / Hidden)
    /// </summary>
    [HttpPatch("manage/{id:guid}/status")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(LearningVideoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateVideoStatusDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var updated = await _videoService.UpdateStatusAsync(id, dto.Status, cancellationToken);
            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Xóa một video học tập và dọn dẹp an toàn tệp lưu trữ liên quan
    /// </summary>
    [HttpDelete("manage/{id:guid}")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteVideo(
        Guid id,
        CancellationToken cancellationToken)
    {
        var deleted = await _videoService.DeleteVideoAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound(new { message = "Không tìm thấy video học tập cần xóa." });
        }

        return NoContent();
    }

    /// <summary>
    /// Tải lên tệp video nhị phân (hỗ trợ MP4, WebM, QuickTime - tối đa 100MB)
    /// </summary>
    [HttpPost("manage/upload-video")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(104857600)]
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)]
    [ProducesResponseType(typeof(StorageUploadResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadVideoFile(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Vui lòng chọn tệp video hợp lệ để tải lên." });
        }

        await using var stream = file.OpenReadStream();
        var result = await _storageService.UploadVideoAsync(stream, file.FileName, file.ContentType, cancellationToken);

        if (!result.Success)
        {
            return BadRequest(new { message = result.ErrorMessage });
        }

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.Identity?.Name
            ?? "system";

        var asset = await _uploadAssetService.RegisterUploadAsync(
            result.StoragePath!,
            _storageService.ProviderName,
            userId,
            file.ContentType,
            file.Length,
            assetType: "Video",
            cancellationToken: cancellationToken);

        result.UploadId = asset.Id;
        return Ok(result);
    }

    /// <summary>
    /// Tải lên ảnh đại diện thumbnail (hỗ trợ JPEG, PNG, WebP - tối đa 5MB)
    /// </summary>
    [HttpPost("manage/upload-thumbnail")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(5242880)]
    [RequestFormLimits(MultipartBodyLengthLimit = 5242880)]
    [ProducesResponseType(typeof(StorageUploadResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadThumbnailFile(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Vui lòng chọn ảnh đại diện hợp lệ để tải lên." });
        }

        await using var stream = file.OpenReadStream();
        var result = await _storageService.UploadThumbnailAsync(stream, file.FileName, file.ContentType, cancellationToken);

        if (!result.Success)
        {
            return BadRequest(new { message = result.ErrorMessage });
        }

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.Identity?.Name
            ?? "system";

        var asset = await _uploadAssetService.RegisterUploadAsync(
            result.StoragePath!,
            _storageService.ProviderName,
            userId,
            file.ContentType,
            file.Length,
            assetType: "Thumbnail",
            cancellationToken: cancellationToken);

        result.UploadId = asset.Id;
        return Ok(result);
    }

    /// <summary>
    /// Lấy thông tin cấu hình và giới hạn lưu trữ video hiện tại
    /// </summary>
    [HttpGet("manage/storage-status")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(VideoStorageStatusDto), StatusCodes.Status200OK)]
    public IActionResult GetStorageStatus()
    {
        var status = _videoService.GetStorageStatus();
        return Ok(status);
    }

    /// <summary>
    /// Danh sách các tác vụ dọn dẹp tệp lưu trữ đang chờ xử lý
    /// </summary>
    [HttpGet("manage/cleanups")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(IReadOnlyList<VideoStorageCleanupJob>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingCleanups(CancellationToken cancellationToken)
    {
        var jobs = await _cleanupService.GetPendingCleanupsAsync(cancellationToken);
        return Ok(jobs);
    }

    /// <summary>
    /// Kích hoạt thủ công tiến trình thử lại các tác vụ dọn dẹp thất bại
    /// </summary>
    [HttpPost("manage/cleanups/retry")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> RetryCleanups(CancellationToken cancellationToken)
    {
        var processed = await _cleanupService.ProcessPendingCleanupsAsync(cancellationToken);
        return Ok(new { processedCount = processed, message = $"Đã xử lý xong {processed} tác vụ dọn dẹp." });
    }
}
