BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113151257_AddVideoStorageOutboxAndUploadAssets'
)
BEGIN
    CREATE TABLE [video_storage_cleanup_jobs] (
        [Id] uniqueidentifier NOT NULL,
        [StoragePath] nvarchar(500) NOT NULL,
        [StorageProvider] nvarchar(50) NOT NULL DEFAULT N'Unknown',
        [Status] nvarchar(50) NOT NULL DEFAULT N'Pending',
        [Reason] nvarchar(100) NOT NULL DEFAULT N'VideoDeleted',
        [RetryCount] int NOT NULL DEFAULT 0,
        [NextRetryAt] datetime2 NULL,
        [LastError] nvarchar(2000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [ProcessedAt] datetime2 NULL,
        [LeaseOwner] nvarchar(100) NULL,
        [LeaseExpiresAt] datetime2 NULL,
        CONSTRAINT [PK_video_storage_cleanup_jobs] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113151257_AddVideoStorageOutboxAndUploadAssets'
)
BEGIN
    CREATE TABLE [video_upload_assets] (
        [Id] uniqueidentifier NOT NULL,
        [StoragePath] nvarchar(500) NOT NULL,
        [StorageProvider] nvarchar(50) NOT NULL DEFAULT N'Unknown',
        [UploadedByUserId] nvarchar(450) NOT NULL,
        [UploadStatus] nvarchar(50) NOT NULL DEFAULT N'Completed',
        [CreatedAt] datetime2 NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [LinkedVideoId] uniqueidentifier NULL,
        [ContentType] nvarchar(100) NOT NULL,
        [FileSizeBytes] bigint NOT NULL DEFAULT CAST(0 AS bigint),
        [AssetType] nvarchar(50) NOT NULL DEFAULT N'Video',
        CONSTRAINT [PK_video_upload_assets] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_video_upload_assets_learning_videos_LinkedVideoId] FOREIGN KEY ([LinkedVideoId]) REFERENCES [learning_videos] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113151257_AddVideoStorageOutboxAndUploadAssets'
)
BEGIN
    CREATE INDEX [idx_cleanup_jobs_lease_expires] ON [video_storage_cleanup_jobs] ([LeaseExpiresAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113151257_AddVideoStorageOutboxAndUploadAssets'
)
BEGIN
    CREATE INDEX [idx_cleanup_jobs_status_retry_created] ON [video_storage_cleanup_jobs] ([Status], [NextRetryAt], [CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113151257_AddVideoStorageOutboxAndUploadAssets'
)
BEGIN
    CREATE INDEX [idx_upload_assets_linked_video] ON [video_upload_assets] ([LinkedVideoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113151257_AddVideoStorageOutboxAndUploadAssets'
)
BEGIN
    CREATE INDEX [idx_upload_assets_status_user] ON [video_upload_assets] ([UploadStatus], [UploadedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113151257_AddVideoStorageOutboxAndUploadAssets'
)
BEGIN
    CREATE INDEX [idx_upload_assets_storage_path] ON [video_upload_assets] ([StoragePath]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113151257_AddVideoStorageOutboxAndUploadAssets'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261113151257_AddVideoStorageOutboxAndUploadAssets', N'10.0.14');
END;

COMMIT;
GO

