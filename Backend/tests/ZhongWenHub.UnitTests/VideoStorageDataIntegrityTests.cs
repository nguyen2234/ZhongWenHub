using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;
using ZhongWenHub.Business.Content;
using ZhongWenHub.Business.Content.DTOs;
using ZhongWenHub.Business.Content.Services.Storage;
using ZhongWenHub.Business.Users;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.UnitTests;

public class VideoStorageDataIntegrityTests
{
    private class FakeCurrentUserService : ICurrentUserService
    {
        public Guid? UserId { get; set; } = null;
        public string? Username { get; set; } = "test-user";
        public string? Email { get; set; } = "test@example.com";
        public bool IsAuthenticated { get; set; } = true;
        public IReadOnlyList<string> Roles { get; set; } = new List<string>();
    }

    private class FakeVideoStorageService : IVideoStorageService
    {
        public bool IsConfigured => true;
        public string ProviderName => "FakeStorage";
        public bool ShouldDeleteSucceed { get; set; } = true;
        public bool ShouldFileExist { get; set; } = true;
        public bool ThrowOnDelete { get; set; } = false;
        public List<string> DeletedPaths { get; } = new();

        public Task<StorageUploadResult> UploadVideoAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default) =>
            Task.FromResult(StorageUploadResult.Succeeded($"videos/{fileName}", $"https://storage/{fileName}", stream.Length, contentType));

        public Task<StorageUploadResult> UploadThumbnailAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default) =>
            Task.FromResult(StorageUploadResult.Succeeded($"thumbnails/{fileName}", $"https://storage/{fileName}", stream.Length, contentType));

        public Task<StorageUploadResult> UploadPdfAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default) =>
            Task.FromResult(StorageUploadResult.Succeeded($"transcripts/{fileName}", $"https://storage/{fileName}", stream.Length, contentType));

        public Task<bool> DeleteFileAsync(string storagePath, CancellationToken cancellationToken = default)
        {
            if (ThrowOnDelete) throw new IOException("Storage connection timeout");
            DeletedPaths.Add(storagePath);
            return Task.FromResult(ShouldDeleteSucceed);
        }

        public Task<bool> FileExistsAsync(string storagePath, CancellationToken cancellationToken = default) =>
            Task.FromResult(ShouldFileExist);

        public string GetPublicUrl(string storagePath) => $"https://storage/{storagePath}";
    }

    private static ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    // =========================================================================
    // 1. UPLOAD ASSET OWNERSHIP & CLAIM VALIDATION TESTS
    // =========================================================================

    [Fact]
    public async Task UploadAssetService_RegisterUpload_CreatesCompletedAssetWith24hExpiry()
    {
        using var context = CreateInMemoryDbContext();
        var service = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);

        var asset = await service.RegisterUploadAsync(
            storagePath: "videos/202611/test.mp4",
            provider: "LocalFileSystem",
            userId: "user-123",
            contentType: "video/mp4",
            fileSize: 1024);

        Assert.NotNull(asset);
        Assert.Equal("videos/202611/test.mp4", asset.StoragePath);
        Assert.Equal("user-123", asset.UploadedByUserId);
        Assert.Equal(VideoUploadAssetStatus.Completed, asset.UploadStatus);
        Assert.True(asset.ExpiresAt > DateTime.UtcNow.AddHours(23));
    }

    [Fact]
    public async Task UploadAssetService_ValidateAndClaim_ValidAsset_AssignsLinkedStatusAndVideoId()
    {
        using var context = CreateInMemoryDbContext();
        var service = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);
        var videoId = Guid.NewGuid();

        var asset = await service.RegisterUploadAsync(
            storagePath: "videos/202611/valid.mp4",
            provider: "LocalFileSystem",
            userId: "user-teacher-1",
            contentType: "video/mp4",
            fileSize: 2048);

        var claimed = await service.ValidateAndClaimAssetAsync(
            asset.Id, "user-teacher-1", isAdmin: false, videoId: videoId);

        Assert.Equal(VideoUploadAssetStatus.Linked, claimed.UploadStatus);
        Assert.Equal(videoId, claimed.LinkedVideoId);
    }

    [Fact]
    public async Task UploadAssetService_ValidateAndClaim_ExpiredAsset_ThrowsInvalidOperationException()
    {
        using var context = CreateInMemoryDbContext();
        var service = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);

        var asset = new VideoUploadAsset
        {
            Id = Guid.NewGuid(),
            StoragePath = "videos/202611/expired.mp4",
            StorageProvider = "LocalFileSystem",
            UploadedByUserId = "user-teacher-1",
            UploadStatus = VideoUploadAssetStatus.Completed,
            CreatedAt = DateTime.UtcNow.AddHours(-25),
            ExpiresAt = DateTime.UtcNow.AddMinutes(-5), // Expired
            ContentType = "video/mp4",
            FileSizeBytes = 1000
        };
        context.VideoUploadAssets.Add(asset);
        await context.SaveChangesAsync();

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ValidateAndClaimAssetAsync(asset.Id, "user-teacher-1", isAdmin: false, videoId: Guid.NewGuid()));

        Assert.Contains("hết hạn", ex.Message);
    }

    [Fact]
    public async Task UploadAssetService_ValidateAndClaim_UnownedByNonAdmin_ThrowsUnauthorizedAccessException()
    {
        using var context = CreateInMemoryDbContext();
        var service = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);

        var asset = await service.RegisterUploadAsync(
            storagePath: "videos/202611/other.mp4",
            provider: "LocalFileSystem",
            userId: "user-owner",
            contentType: "video/mp4",
            fileSize: 1000);

        // Attacker attempts to claim someone else's asset
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.ValidateAndClaimAssetAsync(asset.Id, "user-attacker", isAdmin: false, videoId: Guid.NewGuid()));

        Assert.Contains("quyền sở hữu", ex.Message);
    }

    [Fact]
    public async Task UploadAssetService_ValidateAndClaim_AdminCanClaimNonOwnerAsset()
    {
        using var context = CreateInMemoryDbContext();
        var service = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);
        var videoId = Guid.NewGuid();

        var asset = await service.RegisterUploadAsync(
            storagePath: "videos/202611/admin_override.mp4",
            provider: "LocalFileSystem",
            userId: "user-teacher",
            contentType: "video/mp4",
            fileSize: 1000);

        // Admin claiming teacher asset is permitted
        var claimed = await service.ValidateAndClaimAssetAsync(
            asset.Id, "admin-user", isAdmin: true, videoId: videoId);

        Assert.Equal(VideoUploadAssetStatus.Linked, claimed.UploadStatus);
        Assert.Equal(videoId, claimed.LinkedVideoId);
    }

    [Fact]
    public async Task UploadAssetService_ValidateAndClaim_AlreadyLinkedToDifferentVideo_ThrowsInvalidOperationException()
    {
        using var context = CreateInMemoryDbContext();
        var service = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);
        var existingVideoId = Guid.NewGuid();
        var newVideoId = Guid.NewGuid();

        var asset = new VideoUploadAsset
        {
            Id = Guid.NewGuid(),
            StoragePath = "videos/202611/double_link.mp4",
            StorageProvider = "LocalFileSystem",
            UploadedByUserId = "user-1",
            UploadStatus = VideoUploadAssetStatus.Linked,
            LinkedVideoId = existingVideoId,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        };
        context.VideoUploadAssets.Add(asset);
        await context.SaveChangesAsync();

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ValidateAndClaimAssetAsync(asset.Id, "user-1", isAdmin: false, videoId: newVideoId));

        Assert.Contains("đã được liên kết với một video khác", ex.Message);
    }

    // =========================================================================
    // 2. STORAGE CLEANUP QUEUE & CONCURRENCY LEASE TESTS
    // =========================================================================

    [Fact]
    public async Task StorageCleanupService_ProcessPendingCleanups_DeletesPhysicalFileAndMarksCompleted()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService { ShouldDeleteSucceed = true };
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);

        var job = new VideoStorageCleanupJob
        {
            Id = Guid.NewGuid(),
            StoragePath = "videos/202611/orphan1.mp4",
            Status = VideoStorageCleanupStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.VideoStorageCleanupJobs.Add(job);
        await context.SaveChangesAsync();

        var processed = await cleanupService.ProcessPendingCleanupsAsync(batchSize: 10);

        Assert.Equal(1, processed);
        Assert.Contains("videos/202611/orphan1.mp4", fakeStorage.DeletedPaths);

        var updatedJob = await context.VideoStorageCleanupJobs.FindAsync(job.Id);
        Assert.NotNull(updatedJob);
        Assert.Equal(VideoStorageCleanupStatus.Completed, updatedJob.Status);
        Assert.Null(updatedJob.LeaseOwner);
        Assert.NotNull(updatedJob.ProcessedAt);
    }

    [Fact]
    public async Task StorageCleanupService_ProcessPendingCleanups_CrossReferencedFile_SkipsPhysicalDeleteAndMarksCompleted()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService();
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);

        var sharedPath = "videos/202611/shared.mp4";

        var activeVideo = new LearningVideo
        {
            Id = Guid.NewGuid(),
            Title = "Active Video",
            StoragePath = sharedPath,
            ThumbnailUrl = "https://thumb.jpg",
            CreatedAt = DateTime.UtcNow
        };
        context.LearningVideos.Add(activeVideo);

        var job = new VideoStorageCleanupJob
        {
            Id = Guid.NewGuid(),
            StoragePath = sharedPath,
            Status = VideoStorageCleanupStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.VideoStorageCleanupJobs.Add(job);
        await context.SaveChangesAsync();

        var processed = await cleanupService.ProcessPendingCleanupsAsync(batchSize: 10);

        // Physical delete should NOT be called!
        Assert.DoesNotContain(sharedPath, fakeStorage.DeletedPaths);

        var updatedJob = await context.VideoStorageCleanupJobs.FindAsync(job.Id);
        Assert.NotNull(updatedJob);
        Assert.Equal(VideoStorageCleanupStatus.Completed, updatedJob.Status);
        Assert.Contains("Skipped physical deletion", updatedJob.LastError);
    }

    [Fact]
    public async Task StorageCleanupService_ProcessPendingCleanups_FailedDelete_IncrementsRetryAndSetsBackoff()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService { ThrowOnDelete = true };
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);

        var job = new VideoStorageCleanupJob
        {
            Id = Guid.NewGuid(),
            StoragePath = "videos/202611/fail.mp4",
            Status = VideoStorageCleanupStatus.Pending,
            RetryCount = 0,
            CreatedAt = DateTime.UtcNow
        };
        context.VideoStorageCleanupJobs.Add(job);
        await context.SaveChangesAsync();

        var processed = await cleanupService.ProcessPendingCleanupsAsync(batchSize: 10);

        Assert.Equal(0, processed);
        var updatedJob = await context.VideoStorageCleanupJobs.FindAsync(job.Id);
        Assert.NotNull(updatedJob);
        Assert.Equal(1, updatedJob.RetryCount);
        Assert.Equal(VideoStorageCleanupStatus.Pending, updatedJob.Status);
        Assert.NotNull(updatedJob.NextRetryAt);
        Assert.True(updatedJob.NextRetryAt > DateTime.UtcNow);
        Assert.Contains("Storage connection timeout", updatedJob.LastError);
    }

    [Fact]
    public async Task StorageCleanupService_ProcessPendingCleanups_MaxRetriesReached_MarksFailed()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService { ShouldDeleteSucceed = false };
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);

        var job = new VideoStorageCleanupJob
        {
            Id = Guid.NewGuid(),
            StoragePath = "videos/202611/max_fail.mp4",
            Status = VideoStorageCleanupStatus.Pending,
            RetryCount = 4, // 5th attempt will fail
            CreatedAt = DateTime.UtcNow
        };
        context.VideoStorageCleanupJobs.Add(job);
        await context.SaveChangesAsync();

        var processed = await cleanupService.ProcessPendingCleanupsAsync(batchSize: 10);

        Assert.Equal(0, processed);
        var updatedJob = await context.VideoStorageCleanupJobs.FindAsync(job.Id);
        Assert.NotNull(updatedJob);
        Assert.Equal(5, updatedJob.RetryCount);
        Assert.Equal(VideoStorageCleanupStatus.Failed, updatedJob.Status);
    }

    // =========================================================================
    // 3. TRANSACTIONAL OUTBOX IN LEARNING VIDEO SERVICE TESTS
    // =========================================================================

    [Fact]
    public async Task LearningVideoService_DeleteVideo_EnqueuesCleanupJobInOutbox()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService();
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);
        var uploadAssetService = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);
        var fakeUser = new FakeCurrentUserService { Username = "admin-1", Roles = new List<string> { RoleConstants.Admin } };

        var videoService = new LearningVideoService(
            context,
            fakeStorage,
            cleanupService,
            uploadAssetService,
            Options.Create(new VideoStorageOptions()),
            NullLogger<LearningVideoService>.Instance,
            fakeUser);

        var video = new LearningVideo
        {
            Id = Guid.NewGuid(),
            Title = "Video cần xóa",
            SourceType = "Uploaded",
            StoragePath = "videos/202611/delete_me.mp4",
            ThumbnailUrl = "https://example.com/thumb.jpg",
            CreatedAt = DateTime.UtcNow
        };
        context.LearningVideos.Add(video);
        await context.SaveChangesAsync();

        var deleted = await videoService.DeleteVideoAsync(video.Id);

        Assert.True(deleted);
        Assert.Null(await context.LearningVideos.FindAsync(video.Id));

        var outboxJob = await context.VideoStorageCleanupJobs
            .FirstOrDefaultAsync(j => j.StoragePath == "videos/202611/delete_me.mp4");

        Assert.NotNull(outboxJob);
        Assert.Equal(VideoStorageCleanupStatus.Pending, outboxJob.Status);
        Assert.Equal("VideoDeleted", outboxJob.Reason);
    }

    [Fact]
    public async Task LearningVideoService_UpdateVideo_ReplacedStorageFile_EnqueuesOldFileCleanupJob()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService();
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);
        var uploadAssetService = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);
        var fakeUser = new FakeCurrentUserService { Username = "teacher-1", Roles = new List<string> { RoleConstants.Teacher } };

        var videoService = new LearningVideoService(
            context,
            fakeStorage,
            cleanupService,
            uploadAssetService,
            Options.Create(new VideoStorageOptions()),
            NullLogger<LearningVideoService>.Instance,
            fakeUser);

        var video = new LearningVideo
        {
            Id = Guid.NewGuid(),
            Title = "Video ban đầu",
            SourceType = "Uploaded",
            StoragePath = "videos/202611/old_file.mp4",
            ThumbnailUrl = "https://example.com/thumb.jpg",
            Status = "Draft",
            CreatedAt = DateTime.UtcNow
        };
        context.LearningVideos.Add(video);
        await context.SaveChangesAsync();

        var newAsset = await uploadAssetService.RegisterUploadAsync(
            storagePath: "videos/202611/new_file.mp4",
            provider: "FakeStorage",
            userId: "teacher-1",
            contentType: "video/mp4",
            fileSize: 5000);

        var updateDto = new UpdateLearningVideoDto
        {
            Title = "Video đã thay đổi file",
            SourceType = "Uploaded",
            UploadId = newAsset.Id,
            ThumbnailUrl = "https://example.com/thumb.jpg",
            DurationSeconds = 120,
            HskLevel = 1,
            Topic = "Giao tiếp hàng ngày",
            Status = "Draft"
        };

        var updated = await videoService.UpdateVideoAsync(video.Id, updateDto);

        Assert.Equal("videos/202611/new_file.mp4", updated.StoragePath);

        var cleanupJob = await context.VideoStorageCleanupJobs
            .FirstOrDefaultAsync(j => j.StoragePath == "videos/202611/old_file.mp4");

        Assert.NotNull(cleanupJob);
        Assert.Equal(VideoStorageCleanupStatus.Pending, cleanupJob.Status);
        Assert.Equal("VideoReplaced", cleanupJob.Reason);

        var linkedAsset = await context.VideoUploadAssets.FindAsync(newAsset.Id);
        Assert.NotNull(linkedAsset);
        Assert.Equal(VideoUploadAssetStatus.Linked, linkedAsset.UploadStatus);
        Assert.Equal(video.Id, linkedAsset.LinkedVideoId);
    }

    // =========================================================================
    // 4. WAVE 1 SECURITY REGRESSION TESTS: STORAGE CLEANUP SAFETY & PDF OWNERSHIP
    // =========================================================================

    [Fact]
    public async Task UploadAssetService_ValidateAndClaim_MismatchedAssetType_ThrowsInvalidOperationException()
    {
        using var context = CreateInMemoryDbContext();
        var service = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);

        var asset = await service.RegisterUploadAsync(
            storagePath: "videos/202611/video_11111111111111111111111111111111.mp4",
            provider: "FakeStorage",
            userId: "teacher-1",
            contentType: "video/mp4",
            fileSize: 2048,
            assetType: "Video");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ValidateAndClaimAssetAsync(
                asset.Id, "teacher-1", isAdmin: false, videoId: Guid.NewGuid(), expectedAssetType: "PdfTranscript"));

        Assert.Contains("Loại tệp không khớp", ex.Message);
    }

    [Fact]
    public async Task UploadAssetService_ValidateAndClaim_PathTraversal_ThrowsArgumentException()
    {
        using var context = CreateInMemoryDbContext();
        var service = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);

        var asset = new VideoUploadAsset
        {
            Id = Guid.NewGuid(),
            StoragePath = "videos/../secret.mp4",
            StorageProvider = "FakeStorage",
            UploadedByUserId = "teacher-1",
            ContentType = "video/mp4",
            FileSizeBytes = 100,
            AssetType = "Video",
            UploadStatus = VideoUploadAssetStatus.Completed,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow
        };
        context.VideoUploadAssets.Add(asset);
        await context.SaveChangesAsync();

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            service.ValidateAndClaimAssetAsync(
                asset.Id, "teacher-1", isAdmin: false, videoId: Guid.NewGuid()));

        Assert.Contains("không hợp lệ hoặc chứa ký tự nguy hiểm", ex.Message);
    }

    [Fact]
    public async Task StorageCleanupService_ProcessPendingCleanups_TranscriptPdfReferencedByVideo_SkipsPhysicalDelete()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService();
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);

        var transcriptPdfPath = "transcripts/videos/202611/transcript_11111111111111111111111111111111.pdf";

        var video = new LearningVideo
        {
            Id = Guid.NewGuid(),
            Title = "Video có PDF đính kèm",
            StoragePath = "videos/202611/video_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4",
            TranscriptPdfPath = transcriptPdfPath,
            ThumbnailUrl = "https://thumb.jpg",
            CreatedAt = DateTime.UtcNow
        };
        context.LearningVideos.Add(video);

        var job = new VideoStorageCleanupJob
        {
            Id = Guid.NewGuid(),
            StoragePath = transcriptPdfPath,
            Status = VideoStorageCleanupStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.VideoStorageCleanupJobs.Add(job);
        await context.SaveChangesAsync();

        var processed = await cleanupService.ProcessPendingCleanupsAsync(batchSize: 10);

        Assert.Equal(0, processed);
        Assert.DoesNotContain(transcriptPdfPath, fakeStorage.DeletedPaths);

        var updatedJob = await context.VideoStorageCleanupJobs.FindAsync(job.Id);
        Assert.NotNull(updatedJob);
        Assert.Equal(VideoStorageCleanupStatus.Completed, updatedJob.Status);
        Assert.Contains("Skipped physical deletion", updatedJob.LastError);
    }

    [Fact]
    public async Task StorageCleanupService_ProcessPendingCleanups_TranscriptPdfSharedByTwoVideos_SkipsPhysicalDelete()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService();
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);

        var sharedPdfPath = "transcripts/videos/202611/transcript_22222222222222222222222222222222.pdf";

        var video1 = new LearningVideo
        {
            Id = Guid.NewGuid(),
            Title = "Video 1 dùng chung PDF",
            StoragePath = "videos/202611/video_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.mp4",
            TranscriptPdfPath = sharedPdfPath,
            ThumbnailUrl = "https://thumb.jpg",
            CreatedAt = DateTime.UtcNow
        };
        var video2 = new LearningVideo
        {
            Id = Guid.NewGuid(),
            Title = "Video 2 dùng chung PDF",
            StoragePath = "videos/202611/video_cccccccccccccccccccccccccccccccc.mp4",
            TranscriptPdfPath = sharedPdfPath,
            ThumbnailUrl = "https://thumb.jpg",
            CreatedAt = DateTime.UtcNow
        };
        context.LearningVideos.AddRange(video1, video2);

        var job = new VideoStorageCleanupJob
        {
            Id = Guid.NewGuid(),
            StoragePath = sharedPdfPath,
            Status = VideoStorageCleanupStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.VideoStorageCleanupJobs.Add(job);
        await context.SaveChangesAsync();

        var processed = await cleanupService.ProcessPendingCleanupsAsync(batchSize: 10);

        Assert.Equal(0, processed);
        Assert.DoesNotContain(sharedPdfPath, fakeStorage.DeletedPaths);

        var updatedJob = await context.VideoStorageCleanupJobs.FindAsync(job.Id);
        Assert.NotNull(updatedJob);
        Assert.Equal(VideoStorageCleanupStatus.Completed, updatedJob.Status);
    }

    [Fact]
    public async Task StorageCleanupService_ProcessPendingCleanups_TranscriptPdfUnreferenced_DeletesPhysicalFile()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService { ShouldDeleteSucceed = true };
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);

        var orphanPdfPath = "transcripts/videos/202611/transcript_33333333333333333333333333333333.pdf";

        var job = new VideoStorageCleanupJob
        {
            Id = Guid.NewGuid(),
            StoragePath = orphanPdfPath,
            Status = VideoStorageCleanupStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.VideoStorageCleanupJobs.Add(job);
        await context.SaveChangesAsync();

        var processed = await cleanupService.ProcessPendingCleanupsAsync(batchSize: 10);

        Assert.Equal(1, processed);
        Assert.Contains(orphanPdfPath, fakeStorage.DeletedPaths);

        var updatedJob = await context.VideoStorageCleanupJobs.FindAsync(job.Id);
        Assert.NotNull(updatedJob);
        Assert.Equal(VideoStorageCleanupStatus.Completed, updatedJob.Status);
        Assert.Null(updatedJob.LastError);
    }

    [Fact]
    public async Task StorageCleanupService_ProcessPendingCleanups_ActiveUnlinkedUploadAsset_SkipsPhysicalDelete()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService();
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);

        var assetPath = "transcripts/videos/202611/transcript_active_unlinked.pdf";

        var activeAsset = new VideoUploadAsset
        {
            Id = Guid.NewGuid(),
            StoragePath = assetPath,
            StorageProvider = "FakeStorage",
            UploadedByUserId = "user-1",
            ContentType = "application/pdf",
            FileSizeBytes = 1024,
            AssetType = "PdfTranscript",
            UploadStatus = VideoUploadAssetStatus.Completed,
            ExpiresAt = DateTime.UtcNow.AddHours(2), // Still active and in-flight!
            CreatedAt = DateTime.UtcNow
        };
        context.VideoUploadAssets.Add(activeAsset);

        var job = new VideoStorageCleanupJob
        {
            Id = Guid.NewGuid(),
            StoragePath = assetPath,
            Status = VideoStorageCleanupStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.VideoStorageCleanupJobs.Add(job);
        await context.SaveChangesAsync();

        var processed = await cleanupService.ProcessPendingCleanupsAsync(batchSize: 10);

        Assert.Equal(0, processed);
        Assert.DoesNotContain(assetPath, fakeStorage.DeletedPaths);

        var updatedJob = await context.VideoStorageCleanupJobs.FindAsync(job.Id);
        Assert.NotNull(updatedJob);
        Assert.Equal(VideoStorageCleanupStatus.Completed, updatedJob.Status);
    }

    [Fact]
    public async Task StorageCleanupService_ProcessPendingCleanups_DeleteReturnsFalse_FileAlreadyGone_MarksCompletedWithoutRetry()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService
        {
            ShouldDeleteSucceed = false,
            ShouldFileExist = false // File was already deleted or not found
        };
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);

        var alreadyDeletedPath = "videos/202611/video_already_gone.mp4";

        var job = new VideoStorageCleanupJob
        {
            Id = Guid.NewGuid(),
            StoragePath = alreadyDeletedPath,
            Status = VideoStorageCleanupStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.VideoStorageCleanupJobs.Add(job);
        await context.SaveChangesAsync();

        var processed = await cleanupService.ProcessPendingCleanupsAsync(batchSize: 10);

        Assert.Equal(1, processed);
        var updatedJob = await context.VideoStorageCleanupJobs.FindAsync(job.Id);
        Assert.NotNull(updatedJob);
        Assert.Equal(VideoStorageCleanupStatus.Completed, updatedJob.Status);
        Assert.Contains("File already deleted or not found in storage", updatedJob.LastError);
    }

    [Fact]
    public async Task LearningVideoService_CreateVideo_WithTranscriptUploadId_MismatchedAssetType_ThrowsInvalidOperationException()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService();
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);
        var uploadAssetService = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);
        var fakeUser = new FakeCurrentUserService { Username = "teacher-1", Roles = new List<string> { RoleConstants.Teacher } };

        var videoService = new LearningVideoService(
            context,
            fakeStorage,
            cleanupService,
            uploadAssetService,
            Options.Create(new VideoStorageOptions()),
            NullLogger<LearningVideoService>.Instance,
            fakeUser);

        // Upload registered as "Video", NOT "PdfTranscript"
        var videoAsset = await uploadAssetService.RegisterUploadAsync(
            storagePath: "videos/202611/video_11111111111111111111111111111111.mp4",
            provider: "FakeStorage",
            userId: "teacher-1",
            contentType: "video/mp4",
            fileSize: 5000,
            assetType: "Video");

        var dto = new CreateLearningVideoDto
        {
            Title = "Video kiểm tra sai AssetType PDF",
            SourceType = "YouTube",
            YouTubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            ThumbnailUrl = "https://example.com/thumb.jpg",
            DurationSeconds = 180,
            HskLevel = 2,
            Topic = "HSK 2",
            Status = "Draft",
            TranscriptUploadId = videoAsset.Id // Attacker passes a Video asset ID as transcript PDF!
        };

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            videoService.CreateVideoAsync(dto));

        Assert.Contains("Loại tệp không khớp", ex.Message);
    }

    [Fact]
    public async Task LearningVideoService_CreateVideo_WithDirectTranscriptPdfPath_MaliciousTraversal_ThrowsArgumentException()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService();
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);
        var uploadAssetService = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);
        var fakeUser = new FakeCurrentUserService { Username = "teacher-1", Roles = new List<string> { RoleConstants.Teacher } };

        var videoService = new LearningVideoService(
            context,
            fakeStorage,
            cleanupService,
            uploadAssetService,
            Options.Create(new VideoStorageOptions()),
            NullLogger<LearningVideoService>.Instance,
            fakeUser);

        var dto = new CreateLearningVideoDto
        {
            Title = "Video kiểm tra path traversal",
            SourceType = "YouTube",
            YouTubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            ThumbnailUrl = "https://example.com/thumb.jpg",
            DurationSeconds = 180,
            HskLevel = 2,
            Topic = "HSK 2",
            Status = "Draft",
            TranscriptPdfPath = "../../secret.pdf"
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            videoService.CreateVideoAsync(dto));

        Assert.Contains("không hợp lệ hoặc chứa ký tự nguy hiểm", ex.Message);
    }

    [Fact]
    public async Task LearningVideoService_CreateVideo_WithDirectTranscriptPdfPath_OwnedByOtherUser_ThrowsUnauthorizedAccessException()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService();
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);
        var uploadAssetService = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);

        // Teacher A uploads a PDF
        var victimPdfPath = "transcripts/videos/202611/transcript_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.pdf";
        await uploadAssetService.RegisterUploadAsync(
            storagePath: victimPdfPath,
            provider: "FakeStorage",
            userId: "teacher-A",
            contentType: "application/pdf",
            fileSize: 1024,
            assetType: "PdfTranscript");

        // Teacher B tries to create video using Teacher A's PDF path
        var fakeUserB = new FakeCurrentUserService { Username = "teacher-B", Roles = new List<string> { RoleConstants.Teacher } };
        var videoService = new LearningVideoService(
            context,
            fakeStorage,
            cleanupService,
            uploadAssetService,
            Options.Create(new VideoStorageOptions()),
            NullLogger<LearningVideoService>.Instance,
            fakeUserB);

        var dto = new CreateLearningVideoDto
        {
            Title = "Video chiếm quyền PDF của người khác",
            SourceType = "YouTube",
            YouTubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            ThumbnailUrl = "https://example.com/thumb.jpg",
            DurationSeconds = 180,
            HskLevel = 3,
            Topic = "HSK 3",
            Status = "Draft",
            TranscriptPdfPath = victimPdfPath
        };

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            videoService.CreateVideoAsync(dto));

        Assert.Contains("Bạn không có quyền", ex.Message);
    }

    [Fact]
    public async Task LearningVideoService_UpdateVideo_RetainingExistingTranscriptPdfPath_SucceedsWithoutUploadId()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService();
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);
        var uploadAssetService = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);
        var fakeUser = new FakeCurrentUserService { Username = "teacher-1", Roles = new List<string> { RoleConstants.Teacher } };

        var videoService = new LearningVideoService(
            context,
            fakeStorage,
            cleanupService,
            uploadAssetService,
            Options.Create(new VideoStorageOptions()),
            NullLogger<LearningVideoService>.Instance,
            fakeUser);

        var existingPdfPath = "transcripts/videos/202611/transcript_44444444444444444444444444444444.pdf";

        var video = new LearningVideo
        {
            Id = Guid.NewGuid(),
            Title = "Video ban đầu",
            SourceType = "YouTube",
            YouTubeVideoId = "dQw4w9WgXcQ",
            TranscriptPdfPath = existingPdfPath,
            TranscriptPdfName = "lesson1.pdf",
            TranscriptPdfSizeBytes = 2048,
            ThumbnailUrl = "https://example.com/thumb.jpg",
            Status = "Draft",
            CreatedAt = DateTime.UtcNow
        };
        context.LearningVideos.Add(video);
        await context.SaveChangesAsync();

        // Updating only title and HSK level, sending existing TranscriptPdfPath with no TranscriptUploadId
        var updateDto = new UpdateLearningVideoDto
        {
            Title = "Video đã đổi tiêu đề",
            SourceType = "YouTube",
            YouTubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            ThumbnailUrl = "https://example.com/thumb.jpg",
            DurationSeconds = 180,
            HskLevel = 3,
            Topic = "HSK 3",
            Status = "Draft",
            TranscriptPdfPath = existingPdfPath,
            TranscriptUploadId = null
        };

        var updated = await videoService.UpdateVideoAsync(video.Id, updateDto);

        Assert.Equal("Video đã đổi tiêu đề", updated.Title);
        Assert.Equal(3, updated.HskLevel);
        Assert.Equal(existingPdfPath, updated.TranscriptPdfPath);
        Assert.Equal("lesson1.pdf", updated.TranscriptPdfName);
    }

    [Fact]
    public async Task LearningVideoService_UpdateVideo_WithDirectTranscriptPdfPath_MaliciousTraversal_ThrowsArgumentException()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService();
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);
        var uploadAssetService = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);
        var fakeUser = new FakeCurrentUserService { Username = "teacher-1", Roles = new List<string> { RoleConstants.Teacher } };

        var videoService = new LearningVideoService(
            context,
            fakeStorage,
            cleanupService,
            uploadAssetService,
            Options.Create(new VideoStorageOptions()),
            NullLogger<LearningVideoService>.Instance,
            fakeUser);

        var video = new LearningVideo
        {
            Id = Guid.NewGuid(),
            Title = "Video ban đầu",
            SourceType = "YouTube",
            YouTubeVideoId = "dQw4w9WgXcQ",
            TranscriptPdfPath = "transcripts/videos/202611/transcript_11111111111111111111111111111111.pdf",
            ThumbnailUrl = "https://example.com/thumb.jpg",
            Status = "Draft",
            CreatedAt = DateTime.UtcNow
        };
        context.LearningVideos.Add(video);
        await context.SaveChangesAsync();

        var updateDto = new UpdateLearningVideoDto
        {
            Title = "Video cập nhật",
            SourceType = "YouTube",
            YouTubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            ThumbnailUrl = "https://example.com/thumb.jpg",
            DurationSeconds = 180,
            HskLevel = 2,
            Topic = "HSK 2",
            Status = "Draft",
            TranscriptPdfPath = "../../etc/passwd.pdf"
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            videoService.UpdateVideoAsync(video.Id, updateDto));

        Assert.Contains("không hợp lệ hoặc chứa ký tự nguy hiểm", ex.Message);
    }

    [Fact]
    public async Task LearningVideoService_UpdateVideo_WithDirectTranscriptPdfPath_OwnedByOtherUser_ThrowsUnauthorizedAccessException()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService();
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);
        var uploadAssetService = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);

        var victimPdfPath = "transcripts/videos/202611/transcript_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.pdf";
        await uploadAssetService.RegisterUploadAsync(
            storagePath: victimPdfPath,
            provider: "FakeStorage",
            userId: "teacher-A",
            contentType: "application/pdf",
            fileSize: 1024,
            assetType: "PdfTranscript");

        var fakeUserB = new FakeCurrentUserService { Username = "teacher-B", Roles = new List<string> { RoleConstants.Teacher } };
        var videoService = new LearningVideoService(
            context,
            fakeStorage,
            cleanupService,
            uploadAssetService,
            Options.Create(new VideoStorageOptions()),
            NullLogger<LearningVideoService>.Instance,
            fakeUserB);

        var video = new LearningVideo
        {
            Id = Guid.NewGuid(),
            Title = "Video của teacher B",
            SourceType = "YouTube",
            YouTubeVideoId = "dQw4w9WgXcQ",
            TranscriptPdfPath = "transcripts/videos/202611/transcript_old.pdf",
            ThumbnailUrl = "https://example.com/thumb.jpg",
            Status = "Draft",
            CreatedAt = DateTime.UtcNow
        };
        context.LearningVideos.Add(video);
        await context.SaveChangesAsync();

        var updateDto = new UpdateLearningVideoDto
        {
            Title = "Video cập nhật",
            SourceType = "YouTube",
            YouTubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            ThumbnailUrl = "https://example.com/thumb.jpg",
            DurationSeconds = 180,
            HskLevel = 2,
            Topic = "HSK 2",
            Status = "Draft",
            TranscriptPdfPath = victimPdfPath // Trying to hijack teacher A's PDF
        };

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            videoService.UpdateVideoAsync(video.Id, updateDto));

        Assert.Contains("Bạn không có quyền", ex.Message);
    }

    [Fact]
    public async Task LearningVideoService_UpdateVideo_ReplacedTranscriptPdf_EnqueuesCleanupJobAndMarksAssetDeleted()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService();
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);
        var uploadAssetService = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);
        var fakeUser = new FakeCurrentUserService { Username = "teacher-1", Roles = new List<string> { RoleConstants.Teacher } };

        var videoService = new LearningVideoService(
            context,
            fakeStorage,
            cleanupService,
            uploadAssetService,
            Options.Create(new VideoStorageOptions()),
            NullLogger<LearningVideoService>.Instance,
            fakeUser);

        var oldPdfPath = "transcripts/videos/202611/transcript_old_pdf.pdf";
        var video = new LearningVideo
        {
            Id = Guid.NewGuid(),
            Title = "Video có PDF cũ",
            SourceType = "YouTube",
            YouTubeVideoId = "dQw4w9WgXcQ",
            TranscriptPdfPath = oldPdfPath,
            ThumbnailUrl = "https://example.com/thumb.jpg",
            Status = "Draft",
            CreatedAt = DateTime.UtcNow
        };
        context.LearningVideos.Add(video);

        // Old upload asset was linked to this video
        var oldAsset = new VideoUploadAsset
        {
            Id = Guid.NewGuid(),
            StoragePath = oldPdfPath,
            StorageProvider = "FakeStorage",
            UploadedByUserId = "teacher-1",
            ContentType = "application/pdf",
            FileSizeBytes = 1000,
            AssetType = "PdfTranscript",
            UploadStatus = VideoUploadAssetStatus.Linked,
            LinkedVideoId = video.Id,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow
        };
        context.VideoUploadAssets.Add(oldAsset);
        await context.SaveChangesAsync();

        // Teacher uploads new PDF
        var newPdfPath = "transcripts/videos/202611/transcript_new_pdf.pdf";
        var newAsset = await uploadAssetService.RegisterUploadAsync(
            storagePath: newPdfPath,
            provider: "FakeStorage",
            userId: "teacher-1",
            contentType: "application/pdf",
            fileSize: 2000,
            assetType: "PdfTranscript");

        var updateDto = new UpdateLearningVideoDto
        {
            Title = "Video thay đổi PDF",
            SourceType = "YouTube",
            YouTubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            ThumbnailUrl = "https://example.com/thumb.jpg",
            DurationSeconds = 180,
            HskLevel = 2,
            Topic = "HSK 2",
            Status = "Draft",
            TranscriptUploadId = newAsset.Id
        };

        var updated = await videoService.UpdateVideoAsync(video.Id, updateDto);

        Assert.Equal(newPdfPath, updated.TranscriptPdfPath);

        // Verify old PDF cleanup job was queued
        var cleanupJob = await context.VideoStorageCleanupJobs
            .FirstOrDefaultAsync(j => j.StoragePath == oldPdfPath);
        Assert.NotNull(cleanupJob);
        Assert.Equal(VideoStorageCleanupStatus.Pending, cleanupJob.Status);
        Assert.Equal("TranscriptPdfReplaced", cleanupJob.Reason);

        // Verify old asset marked as Deleted
        var updatedOldAsset = await context.VideoUploadAssets.FindAsync(oldAsset.Id);
        Assert.NotNull(updatedOldAsset);
        Assert.Equal(VideoUploadAssetStatus.Deleted, updatedOldAsset.UploadStatus);

        // Verify new asset marked as Linked
        var updatedNewAsset = await context.VideoUploadAssets.FindAsync(newAsset.Id);
        Assert.NotNull(updatedNewAsset);
        Assert.Equal(VideoUploadAssetStatus.Linked, updatedNewAsset.UploadStatus);
        Assert.Equal(video.Id, updatedNewAsset.LinkedVideoId);
    }

    // =========================================================================
    // 5. FAIL-CLOSED USER CONTEXT & ROLE REGRESSION TESTS
    // =========================================================================

    [Fact]
    public async Task LearningVideoService_MissingUserContext_DefaultsToNonAdmin_ThrowsUnauthorizedAccessException()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService();
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);
        var uploadAssetService = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);

        // Explicitly null currentUserService (missing context)
        var videoService = new LearningVideoService(
            context,
            fakeStorage,
            cleanupService,
            uploadAssetService,
            Options.Create(new VideoStorageOptions()),
            NullLogger<LearningVideoService>.Instance,
            currentUserService: null);

        var dto = new CreateLearningVideoDto
        {
            Title = "Video không có user context",
            SourceType = "Uploaded",
            StoragePath = "videos/202611/video_11111111111111111111111111111111.mp4",
            ThumbnailUrl = "https://example.com/thumb.jpg",
            DurationSeconds = 120,
            HskLevel = 1,
            Topic = "Giao tiếp hàng ngày",
            Status = "Draft"
        };

        // Fail-closed: Must NOT default to admin, must reject unverified storage path
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            videoService.CreateVideoAsync(dto));

        Assert.Contains("Bạn không có quyền", ex.Message);
    }

    [Fact]
    public async Task LearningVideoService_UnauthenticatedUser_DefaultsToNonAdmin_ThrowsUnauthorizedAccessException()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService();
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);
        var uploadAssetService = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);

        // Unauthenticated user claiming Admin role in token payload
        var unauthenticatedUser = new FakeCurrentUserService
        {
            Username = "anonymous",
            IsAuthenticated = false,
            Roles = new List<string> { RoleConstants.Admin } // Token forged / unauthenticated
        };

        var videoService = new LearningVideoService(
            context,
            fakeStorage,
            cleanupService,
            uploadAssetService,
            Options.Create(new VideoStorageOptions()),
            NullLogger<LearningVideoService>.Instance,
            unauthenticatedUser);

        var dto = new CreateLearningVideoDto
        {
            Title = "Video chưa xác thực",
            SourceType = "YouTube",
            YouTubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            TranscriptPdfPath = "transcripts/videos/202611/transcript_11111111111111111111111111111111.pdf",
            ThumbnailUrl = "https://example.com/thumb.jpg",
            DurationSeconds = 180,
            HskLevel = 2,
            Topic = "HSK 2",
            Status = "Draft"
        };

        // Fail-closed: IsAuthenticated=false forces isAdmin=false, rejecting unverified PDF path
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            videoService.CreateVideoAsync(dto));

        Assert.Contains("Bạn không có quyền", ex.Message);
    }

    [Fact]
    public async Task LearningVideoService_TeacherUser_CanClaimOwnAsset_CannotClaimRawPath()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService();
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);
        var uploadAssetService = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);

        var teacherUser = new FakeCurrentUserService
        {
            Username = "teacher-verified",
            IsAuthenticated = true,
            Roles = new List<string> { RoleConstants.Teacher }
        };

        var videoService = new LearningVideoService(
            context,
            fakeStorage,
            cleanupService,
            uploadAssetService,
            Options.Create(new VideoStorageOptions()),
            NullLogger<LearningVideoService>.Instance,
            teacherUser);

        // 1. Teacher can claim their own upload asset
        var ownPdfPath = "transcripts/videos/202611/transcript_own_teacher.pdf";
        var ownAsset = await uploadAssetService.RegisterUploadAsync(
            storagePath: ownPdfPath,
            provider: "FakeStorage",
            userId: "teacher-verified",
            contentType: "application/pdf",
            fileSize: 1024,
            assetType: "PdfTranscript");

        var validDto = new CreateLearningVideoDto
        {
            Title = "Video của giáo viên",
            SourceType = "YouTube",
            YouTubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            TranscriptUploadId = ownAsset.Id,
            ThumbnailUrl = "https://example.com/thumb.jpg",
            DurationSeconds = 180,
            HskLevel = 2,
            Topic = "HSK 2",
            Status = "Draft"
        };

        var created = await videoService.CreateVideoAsync(validDto);
        Assert.NotNull(created);
        Assert.Equal(ownPdfPath, created.TranscriptPdfPath);

        // 2. Teacher CANNOT use arbitrary raw storage path without an asset
        var rawPathDto = new CreateLearningVideoDto
        {
            Title = "Video giáo viên dùng raw path",
            SourceType = "Uploaded",
            StoragePath = "videos/202611/video_44444444444444444444444444444444.mp4",
            ThumbnailUrl = "https://example.com/thumb.jpg",
            DurationSeconds = 120,
            HskLevel = 1,
            Topic = "Giao tiếp hàng ngày",
            Status = "Draft"
        };

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            videoService.CreateVideoAsync(rawPathDto));

        Assert.Contains("Bạn không có quyền", ex.Message);
    }

    [Fact]
    public async Task LearningVideoService_AdminUser_CanAssignVerifiedRawPath()
    {
        using var context = CreateInMemoryDbContext();
        var fakeStorage = new FakeVideoStorageService();
        var cleanupService = new StorageCleanupService(context, fakeStorage, NullLogger<StorageCleanupService>.Instance);
        var uploadAssetService = new UploadAssetService(context, NullLogger<UploadAssetService>.Instance);

        var adminUser = new FakeCurrentUserService
        {
            Username = "super-admin",
            IsAuthenticated = true,
            Roles = new List<string> { RoleConstants.Admin }
        };

        var videoService = new LearningVideoService(
            context,
            fakeStorage,
            cleanupService,
            uploadAssetService,
            Options.Create(new VideoStorageOptions()),
            NullLogger<LearningVideoService>.Instance,
            adminUser);

        var adminPath = "videos/202611/video_33333333333333333333333333333333.mp4";
        var dto = new CreateLearningVideoDto
        {
            Title = "Video do Admin gán đường dẫn",
            SourceType = "Uploaded",
            StoragePath = adminPath,
            ThumbnailUrl = "https://example.com/thumb.jpg",
            DurationSeconds = 300,
            HskLevel = 4,
            Topic = "Du lịch & Đời sống",
            Status = "Draft"
        };

        // Admin has permission to assign valid backend storage path directly
        var created = await videoService.CreateVideoAsync(dto);
        Assert.NotNull(created);
        Assert.Equal(adminPath, created.StoragePath);
    }
}
