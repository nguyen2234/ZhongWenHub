using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Content.DTOs;
using ZhongWenHub.Business.Content.Helpers;
using ZhongWenHub.Business.Content.Services.Storage;
using ZhongWenHub.Business.Users;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.Content;

public class LearningVideoService : ILearningVideoService
{
    private readonly ApplicationDbContext _context;
    private readonly IVideoStorageService _storageService;
    private readonly IStorageCleanupService _cleanupService;
    private readonly IUploadAssetService _uploadAssetService;
    private readonly ICurrentUserService? _currentUserService;
    private readonly VideoStorageOptions _storageOptions;
    private readonly ILogger<LearningVideoService> _logger;

    public static readonly IReadOnlyList<string> StandardTopics = new[]
    {
        "Giao tiếp hàng ngày",
        "Ẩm thực & Mua sắm",
        "Du lịch & Đời sống",
        "Ngữ pháp thực dụng",
        "Luyện thi HSK",
        "Văn hóa & Phong tục"
    };

    public LearningVideoService(
        ApplicationDbContext context,
        IVideoStorageService storageService,
        IStorageCleanupService cleanupService,
        IUploadAssetService uploadAssetService,
        IOptions<VideoStorageOptions> storageOptions,
        ILogger<LearningVideoService> logger,
        ICurrentUserService? currentUserService = null)
    {
        _context = context;
        _storageService = storageService;
        _cleanupService = cleanupService;
        _uploadAssetService = uploadAssetService;
        _storageOptions = storageOptions.Value;
        _logger = logger;
        _currentUserService = currentUserService;
    }

    private (string userId, bool isAdmin) GetCurrentUserInfo()
    {
        var userId = _currentUserService?.UserId?.ToString()
            ?? _currentUserService?.Username
            ?? "system";
        var isAdmin = _currentUserService?.Roles?.Contains(RoleConstants.Admin) ?? true;
        return (userId, isAdmin);
    }

    public async Task<PagedResponse<LearningVideoDto>> GetVideosAsync(
        LearningVideoQueryDto query,
        bool publishedOnly = true,
        CancellationToken cancellationToken = default)
    {
        var q = _context.LearningVideos
            .AsNoTracking()
            .Include(v => v.Lesson)
            .AsQueryable();

        // Security gate: non-staff users strictly only see Published videos
        if (publishedOnly)
        {
            q = q.Where(v => v.Status == "Published");
        }

        // HSK Level filter (1-6)
        if (query.HskLevel.HasValue && query.HskLevel.Value >= 1 && query.HskLevel.Value <= 6)
        {
            q = q.Where(v => v.HskLevel == query.HskLevel.Value);
        }

        // Topic filter
        if (!string.IsNullOrWhiteSpace(query.Topic) && !string.Equals(query.Topic, "all", StringComparison.OrdinalIgnoreCase))
        {
            var topic = query.Topic.Trim();
            q = q.Where(v => v.Topic == topic);
        }

        // Source Type filter
        if (!string.IsNullOrWhiteSpace(query.SourceType) && !string.Equals(query.SourceType, "all", StringComparison.OrdinalIgnoreCase))
        {
            var src = query.SourceType.Trim();
            q = q.Where(v => v.SourceType == src);
        }

        // Search query
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            q = q.Where(v =>
                EF.Functions.Like(v.Title, $"%{search}%") ||
                (v.Description != null && EF.Functions.Like(v.Description, $"%{search}%")));
        }

        // Newest first
        q = q.OrderByDescending(v => v.CreatedAt);

        var totalItems = await q.CountAsync(cancellationToken);

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 50);

        var entities = await q
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = entities.Select(v => MapToDto(v, isPublicView: publishedOnly)).ToList();

        return new PagedResponse<LearningVideoDto>(items, totalItems, page, pageSize);
    }

    public async Task<PagedResponse<LearningVideoDto>> GetAdminVideosAsync(
        LearningVideoAdminQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var q = _context.LearningVideos
            .AsNoTracking()
            .Include(v => v.Lesson)
            .AsQueryable();

        // Status filter for management: Draft, Published, Hidden
        if (!string.IsNullOrWhiteSpace(query.Status) && !string.Equals(query.Status, "all", StringComparison.OrdinalIgnoreCase))
        {
            var status = query.Status.Trim();
            q = q.Where(v => v.Status == status);
        }

        // HSK Level filter (1-6)
        if (query.HskLevel.HasValue && query.HskLevel.Value >= 1 && query.HskLevel.Value <= 6)
        {
            q = q.Where(v => v.HskLevel == query.HskLevel.Value);
        }

        // Topic filter
        if (!string.IsNullOrWhiteSpace(query.Topic) && !string.Equals(query.Topic, "all", StringComparison.OrdinalIgnoreCase))
        {
            var topic = query.Topic.Trim();
            q = q.Where(v => v.Topic == topic);
        }

        // Source Type filter
        if (!string.IsNullOrWhiteSpace(query.SourceType) && !string.Equals(query.SourceType, "all", StringComparison.OrdinalIgnoreCase))
        {
            var src = query.SourceType.Trim();
            q = q.Where(v => v.SourceType == src);
        }

        // Search query
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            q = q.Where(v =>
                EF.Functions.Like(v.Title, $"%{search}%") ||
                (v.Description != null && EF.Functions.Like(v.Description, $"%{search}%")));
        }

        // Newest first
        q = q.OrderByDescending(v => v.CreatedAt);

        var totalItems = await q.CountAsync(cancellationToken);

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 50);

        var entities = await q
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = entities.Select(v => MapToDto(v, isPublicView: false)).ToList();

        return new PagedResponse<LearningVideoDto>(items, totalItems, page, pageSize);
    }

    public async Task<LearningVideoDto?> GetVideoByIdAsync(
        Guid id,
        bool isStaff = false,
        CancellationToken cancellationToken = default)
    {
        var entity = await _context.LearningVideos
            .Include(v => v.Lesson)
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

        if (entity == null)
        {
            return null;
        }

        // If not staff, non-published videos are strictly hidden (404)
        if (!isStaff && !string.Equals(entity.Status, "Published", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        // Increment view count if non-staff view
        if (!isStaff)
        {
            entity.ViewCount++;
            await _context.SaveChangesAsync(cancellationToken);
        }

        return MapToDto(entity, isPublicView: !isStaff);
    }

    public Task<List<string>> GetAvailableTopicsAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(StandardTopics.ToList());
    }

    public async Task<LearningVideoDto> CreateVideoAsync(
        CreateLearningVideoDto dto,
        CancellationToken cancellationToken = default)
    {
        var isYouTube = string.Equals(dto.SourceType, "YouTube", StringComparison.OrdinalIgnoreCase);

        // Auto-extract YouTube ID from URL if provided
        string? resolvedYouTubeId = dto.YouTubeVideoId?.Trim();
        if (isYouTube && !string.IsNullOrWhiteSpace(dto.YouTubeUrl))
        {
            var extractedId = YouTubeUrlParser.ExtractVideoId(dto.YouTubeUrl);
            if (string.IsNullOrWhiteSpace(extractedId))
            {
                throw new ArgumentException("Đường dẫn YouTube không hợp lệ hoặc từ miền không được tin cậy.");
            }
            resolvedYouTubeId = extractedId;
        }
        else if (isYouTube && !string.IsNullOrWhiteSpace(resolvedYouTubeId))
        {
            var validatedId = YouTubeUrlParser.ExtractVideoId(resolvedYouTubeId);
            if (string.IsNullOrWhiteSpace(validatedId))
            {
                throw new ArgumentException("YouTube Video ID không hợp lệ (phải gồm 11 ký tự chuẩn).");
            }
            resolvedYouTubeId = validatedId;
        }

        dto.YouTubeVideoId = resolvedYouTubeId;

        // Auto-generate high-quality YouTube thumbnail if empty
        if (isYouTube && !string.IsNullOrWhiteSpace(resolvedYouTubeId) && string.IsNullOrWhiteSpace(dto.ThumbnailUrl))
        {
            dto.ThumbnailUrl = YouTubeUrlParser.GenerateHqThumbnailUrl(resolvedYouTubeId);
        }

        // Validate DTO attributes
        var validationContext = new ValidationContext(dto);
        var validationResults = new List<ValidationResult>();
        if (!Validator.TryValidateObject(dto, validationContext, validationResults, validateAllProperties: true))
        {
            var firstError = validationResults.FirstOrDefault()?.ErrorMessage ?? "Dữ liệu video không hợp lệ.";
            throw new ArgumentException(firstError);
        }

        // Validate linked lesson existence if specified
        if (dto.LessonId.HasValue)
        {
            var lessonExists = await _context.Lessons.AnyAsync(l => l.Id == dto.LessonId.Value, cancellationToken);
            if (!lessonExists)
            {
                throw new ArgumentException("Bài học liên kết không tồn tại trong hệ thống giáo trình.");
            }
        }

        var normalizedStatus = NormalizeStatus(dto.Status);
        var (currentUserId, isAdmin) = GetCurrentUserInfo();
        var videoId = Guid.NewGuid();
        VideoUploadAsset? claimedAsset = null;
        string? resolvedStoragePath = null;

        if (!isYouTube)
        {
            if (dto.UploadId.HasValue)
            {
                claimedAsset = await _uploadAssetService.ValidateAndClaimAssetAsync(
                    dto.UploadId.Value, currentUserId, isAdmin, videoId, cancellationToken);
                resolvedStoragePath = claimedAsset.StoragePath;
            }
            else if (!string.IsNullOrWhiteSpace(dto.StoragePath))
            {
                var trimmedPath = dto.StoragePath.Trim();
                if (!StoragePathSecurity.IsValidStoragePath(trimmedPath))
                {
                    throw new ArgumentException("Đường dẫn lưu trữ (StoragePath) không hợp lệ hoặc chứa ký tự nguy hiểm.");
                }

                var matchingAsset = await _context.VideoUploadAssets
                    .FirstOrDefaultAsync(a => a.StoragePath == trimmedPath, cancellationToken);
                if (matchingAsset != null)
                {
                    claimedAsset = await _uploadAssetService.ValidateAndClaimAssetAsync(
                        matchingAsset.Id, currentUserId, isAdmin, videoId, cancellationToken);
                    resolvedStoragePath = claimedAsset.StoragePath;
                }
                else
                {
                    if (!isAdmin)
                    {
                        throw new UnauthorizedAccessException("Bạn không có quyền sử dụng tệp tải lên chưa được xác thực quyền sở hữu.");
                    }
                    resolvedStoragePath = trimmedPath;
                }
            }

            if (string.Equals(normalizedStatus, "Published", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(resolvedStoragePath))
            {
                throw new InvalidOperationException("Không thể tạo video ở trạng thái Published: Chưa có tệp video được tải lên.");
            }
        }

        var entity = new LearningVideo
        {
            Id = videoId,
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim(),
            SourceType = isYouTube ? "YouTube" : "Uploaded",
            YouTubeVideoId = isYouTube ? resolvedYouTubeId : null,
            StoragePath = resolvedStoragePath,
            ThumbnailUrl = dto.ThumbnailUrl.Trim(),
            DurationSeconds = Math.Max(0, dto.DurationSeconds),
            HskLevel = Math.Clamp(dto.HskLevel, 1, 6),
            Topic = dto.Topic.Trim(),
            Status = normalizedStatus,
            ViewCount = 0,
            LessonId = dto.LessonId,
            CreatedAt = DateTime.UtcNow
        };

        // Transactional Outbox Pattern
        var isRelational = false;
        try { isRelational = _context.Database.IsRelational(); } catch { }
        await using var transaction = isRelational ? await _context.Database.BeginTransactionAsync(cancellationToken) : null;

        try
        {
            _context.LearningVideos.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            if (transaction != null)
            {
                await transaction.CommitAsync(cancellationToken);
            }
        }
        catch
        {
            if (transaction != null)
            {
                await transaction.RollbackAsync(cancellationToken);
            }
            throw;
        }

        return MapToDto(entity, isPublicView: false);
    }

    public async Task<LearningVideoDto> UpdateVideoAsync(
        Guid id,
        UpdateLearningVideoDto dto,
        CancellationToken cancellationToken = default)
    {
        var entity = await _context.LearningVideos
            .Include(v => v.Lesson)
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

        if (entity == null)
        {
            throw new KeyNotFoundException("Không tìm thấy video học tập cần cập nhật.");
        }

        var isYouTube = string.Equals(dto.SourceType, "YouTube", StringComparison.OrdinalIgnoreCase);

        // Auto-extract YouTube ID from URL if provided
        string? resolvedYouTubeId = dto.YouTubeVideoId?.Trim();
        if (isYouTube && !string.IsNullOrWhiteSpace(dto.YouTubeUrl))
        {
            var extractedId = YouTubeUrlParser.ExtractVideoId(dto.YouTubeUrl);
            if (string.IsNullOrWhiteSpace(extractedId))
            {
                throw new ArgumentException("Đường dẫn YouTube không hợp lệ hoặc từ miền không được tin cậy.");
            }
            resolvedYouTubeId = extractedId;
        }
        else if (isYouTube && !string.IsNullOrWhiteSpace(resolvedYouTubeId))
        {
            var validatedId = YouTubeUrlParser.ExtractVideoId(resolvedYouTubeId);
            if (string.IsNullOrWhiteSpace(validatedId))
            {
                throw new ArgumentException("YouTube Video ID không hợp lệ (phải gồm 11 ký tự chuẩn).");
            }
            resolvedYouTubeId = validatedId;
        }

        dto.YouTubeVideoId = resolvedYouTubeId;

        if (isYouTube && !string.IsNullOrWhiteSpace(resolvedYouTubeId) && string.IsNullOrWhiteSpace(dto.ThumbnailUrl))
        {
            dto.ThumbnailUrl = YouTubeUrlParser.GenerateHqThumbnailUrl(resolvedYouTubeId);
        }

        // Validate DTO
        var validationContext = new ValidationContext(dto);
        var validationResults = new List<ValidationResult>();
        if (!Validator.TryValidateObject(dto, validationContext, validationResults, validateAllProperties: true))
        {
            var firstError = validationResults.FirstOrDefault()?.ErrorMessage ?? "Dữ liệu cập nhật video không hợp lệ.";
            throw new ArgumentException(firstError);
        }

        // Validate linked lesson existence
        if (dto.LessonId.HasValue && dto.LessonId != entity.LessonId)
        {
            var lessonExists = await _context.Lessons.AnyAsync(l => l.Id == dto.LessonId.Value, cancellationToken);
            if (!lessonExists)
            {
                throw new ArgumentException("Bài học liên kết không tồn tại trong hệ thống giáo trình.");
            }
        }

        var oldStoragePath = entity.StoragePath;
        var (currentUserId, isAdmin) = GetCurrentUserInfo();
        string? newStoragePath = null;
        VideoUploadAsset? claimedAsset = null;

        if (!isYouTube)
        {
            if (dto.UploadId.HasValue)
            {
                claimedAsset = await _uploadAssetService.ValidateAndClaimAssetAsync(
                    dto.UploadId.Value, currentUserId, isAdmin, entity.Id, cancellationToken);
                newStoragePath = claimedAsset.StoragePath;
            }
            else if (!string.IsNullOrWhiteSpace(dto.StoragePath))
            {
                var trimmedPath = dto.StoragePath.Trim();
                if (!StoragePathSecurity.IsValidStoragePath(trimmedPath))
                {
                    throw new ArgumentException("Đường dẫn lưu trữ mới (StoragePath) không hợp lệ hoặc chứa ký tự nguy hiểm.");
                }

                if (string.Equals(trimmedPath, oldStoragePath, StringComparison.OrdinalIgnoreCase))
                {
                    newStoragePath = oldStoragePath;
                }
                else
                {
                    var matchingAsset = await _context.VideoUploadAssets
                        .FirstOrDefaultAsync(a => a.StoragePath == trimmedPath, cancellationToken);
                    if (matchingAsset != null)
                    {
                        claimedAsset = await _uploadAssetService.ValidateAndClaimAssetAsync(
                            matchingAsset.Id, currentUserId, isAdmin, entity.Id, cancellationToken);
                        newStoragePath = claimedAsset.StoragePath;
                    }
                    else
                    {
                        if (!isAdmin)
                        {
                            throw new UnauthorizedAccessException("Bạn không có quyền thay đổi sang tệp lưu trữ chưa xác minh quyền sở hữu.");
                        }
                        newStoragePath = trimmedPath;
                    }
                }
            }
            else
            {
                newStoragePath = oldStoragePath;
            }
        }

        var normalizedStatus = NormalizeStatus(dto.Status);
        if (!isYouTube && string.Equals(normalizedStatus, "Published", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(newStoragePath))
        {
            throw new InvalidOperationException("Không thể xuất bản video khi chưa có tệp lưu trữ hợp lệ.");
        }

        entity.Title = dto.Title.Trim();
        entity.Description = dto.Description?.Trim();
        entity.SourceType = isYouTube ? "YouTube" : "Uploaded";
        entity.YouTubeVideoId = isYouTube ? resolvedYouTubeId : null;
        entity.StoragePath = newStoragePath;
        entity.ThumbnailUrl = dto.ThumbnailUrl.Trim();
        entity.DurationSeconds = Math.Max(0, dto.DurationSeconds);
        entity.HskLevel = Math.Clamp(dto.HskLevel, 1, 6);
        entity.Topic = dto.Topic.Trim();
        entity.Status = normalizedStatus;
        entity.LessonId = dto.LessonId;
        entity.UpdatedAt = DateTime.UtcNow;

        // Transactional Outbox: atomic commit of video change + cleanup outbox job insertion
        var isRelational = false;
        try { isRelational = _context.Database.IsRelational(); } catch { }
        await using var transaction = isRelational ? await _context.Database.BeginTransactionAsync(cancellationToken) : null;

        try
        {
            if (!string.IsNullOrWhiteSpace(oldStoragePath) &&
                !string.Equals(oldStoragePath, newStoragePath, StringComparison.OrdinalIgnoreCase))
            {
                var cleanupJob = new VideoStorageCleanupJob
                {
                    Id = Guid.NewGuid(),
                    StoragePath = oldStoragePath,
                    StorageProvider = _storageService.ProviderName,
                    Status = VideoStorageCleanupStatus.Pending,
                    Reason = "VideoReplaced",
                    CreatedAt = DateTime.UtcNow
                };
                _context.VideoStorageCleanupJobs.Add(cleanupJob);
            }

            await _context.SaveChangesAsync(cancellationToken);

            if (transaction != null)
            {
                await transaction.CommitAsync(cancellationToken);
            }
        }
        catch
        {
            if (transaction != null)
            {
                await transaction.RollbackAsync(cancellationToken);
            }
            throw;
        }

        return MapToDto(entity, isPublicView: false);
    }

    public async Task<LearningVideoDto> UpdateStatusAsync(
        Guid id,
        string newStatus,
        CancellationToken cancellationToken = default)
    {
        var entity = await _context.LearningVideos
            .Include(v => v.Lesson)
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

        if (entity == null)
        {
            throw new KeyNotFoundException("Không tìm thấy video học tập cần cập nhật trạng thái.");
        }

        var normalized = NormalizeStatus(newStatus);

        // Validation before publishing
        if (string.Equals(normalized, "Published", StringComparison.OrdinalIgnoreCase))
        {
            if (string.Equals(entity.SourceType, "YouTube", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrWhiteSpace(entity.YouTubeVideoId))
                {
                    throw new InvalidOperationException("Không thể xuất bản video YouTube thiếu YouTube Video ID.");
                }
            }
            else if (string.Equals(entity.SourceType, "Uploaded", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrWhiteSpace(entity.StoragePath))
                {
                    throw new InvalidOperationException("Không thể xuất bản video tự tải lên khi chưa có đường dẫn tệp (StoragePath).");
                }

                // Verify file exists on storage provider before publishing
                var fileExists = await _storageService.FileExistsAsync(entity.StoragePath, cancellationToken);
                if (!fileExists)
                {
                    throw new InvalidOperationException($"Không thể xuất bản video: tệp lưu trữ '{entity.StoragePath}' không tồn tại trên hệ thống lưu trữ.");
                }
            }

            if (string.IsNullOrWhiteSpace(entity.ThumbnailUrl))
            {
                throw new InvalidOperationException("Không thể xuất bản video khi chưa có ảnh đại diện (ThumbnailUrl).");
            }
        }

        entity.Status = normalized;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(entity, isPublicView: false);
    }

    public async Task<bool> DeleteVideoAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.LearningVideos.FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
        if (entity == null)
        {
            return false;
        }

        var storagePath = entity.StoragePath;

        // Transactional Outbox Pattern: Atomic deletion + Cleanup job registration
        var isRelational = false;
        try { isRelational = _context.Database.IsRelational(); } catch { }
        await using var transaction = isRelational ? await _context.Database.BeginTransactionAsync(cancellationToken) : null;

        try
        {
            if (!string.IsNullOrWhiteSpace(storagePath))
            {
                var cleanupJob = new VideoStorageCleanupJob
                {
                    Id = Guid.NewGuid(),
                    StoragePath = storagePath,
                    StorageProvider = _storageService.ProviderName,
                    Status = VideoStorageCleanupStatus.Pending,
                    Reason = "VideoDeleted",
                    CreatedAt = DateTime.UtcNow
                };
                _context.VideoStorageCleanupJobs.Add(cleanupJob);
            }

            var linkedAssets = await _context.VideoUploadAssets
                .Where(a => a.LinkedVideoId == entity.Id)
                .ToListAsync(cancellationToken);
            foreach (var asset in linkedAssets)
            {
                asset.UploadStatus = VideoUploadAssetStatus.Deleted;
            }

            _context.LearningVideos.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);

            if (transaction != null)
            {
                await transaction.CommitAsync(cancellationToken);
            }
        }
        catch
        {
            if (transaction != null)
            {
                await transaction.RollbackAsync(cancellationToken);
            }
            throw;
        }

        return true;
    }

    public VideoStorageStatusDto GetStorageStatus()
    {
        return new VideoStorageStatusDto
        {
            IsConfigured = _storageService.IsConfigured,
            ProviderName = _storageService.ProviderName,
            MaxVideoSizeBytes = _storageOptions.MaxVideoSizeBytes,
            MaxThumbnailSizeBytes = _storageOptions.MaxThumbnailSizeBytes,
            AllowedVideoMimeTypes = _storageOptions.AllowedVideoMimeTypes,
            AllowedThumbnailMimeTypes = _storageOptions.AllowedThumbnailMimeTypes
        };
    }

    private static string NormalizeStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return "Draft";

        if (string.Equals(status, "Published", StringComparison.OrdinalIgnoreCase)) return "Published";
        if (string.Equals(status, "Hidden", StringComparison.OrdinalIgnoreCase)) return "Hidden";
        return "Draft";
    }

    private LearningVideoDto MapToDto(LearningVideo v, bool isPublicView)
    {
        var videoUrl = !string.IsNullOrWhiteSpace(v.StoragePath)
            ? _storageService.GetPublicUrl(v.StoragePath)
            : null;

        return new LearningVideoDto
        {
            Id = v.Id,
            Title = v.Title,
            Description = v.Description,
            SourceType = v.SourceType,
            YouTubeVideoId = v.YouTubeVideoId,
            // Mask internal StoragePath for public student view
            StoragePath = isPublicView ? null : v.StoragePath,
            VideoUrl = videoUrl,
            ThumbnailUrl = v.ThumbnailUrl,
            DurationSeconds = v.DurationSeconds,
            HskLevel = v.HskLevel,
            Topic = v.Topic,
            Status = v.Status,
            ViewCount = v.ViewCount,
            LessonId = v.LessonId,
            LessonTitle = v.Lesson != null ? v.Lesson.TitleZh : null,
            CreatedAt = v.CreatedAt,
            UpdatedAt = v.UpdatedAt
        };
    }
}
