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
        public bool ThrowOnDelete { get; set; } = false;
        public List<string> DeletedPaths { get; } = new();

        public Task<StorageUploadResult> UploadVideoAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default) =>
            Task.FromResult(StorageUploadResult.Succeeded($"videos/{fileName}", $"https://storage/{fileName}", stream.Length, contentType));

        public Task<StorageUploadResult> UploadThumbnailAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default) =>
            Task.FromResult(StorageUploadResult.Succeeded($"thumbnails/{fileName}", $"https://storage/{fileName}", stream.Length, contentType));

        public Task<bool> DeleteFileAsync(string storagePath, CancellationToken cancellationToken = default)
        {
            if (ThrowOnDelete) throw new IOException("Storage connection timeout");
            DeletedPaths.Add(storagePath);
            return Task.FromResult(ShouldDeleteSucceed);
        }

        public Task<bool> FileExistsAsync(string storagePath, CancellationToken cancellationToken = default) =>
            Task.FromResult(true);

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
}
