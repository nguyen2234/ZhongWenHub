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

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261115170022_AddAiPersonalizationPhase3And4'
)
BEGIN
    CREATE TABLE [student_learning_goals] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [TargetHskLevel] int NOT NULL,
        [DailyStudyMinutes] int NOT NULL,
        [StudyDaysPerWeek] int NOT NULL,
        [TargetDate] datetime2 NULL,
        [PrioritySkillsJson] nvarchar(max) NOT NULL,
        [IntensityMode] nvarchar(50) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_student_learning_goals] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_student_learning_goals_users_UserId] FOREIGN KEY ([UserId]) REFERENCES [users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261115170022_AddAiPersonalizationPhase3And4'
)
BEGIN
    CREATE TABLE [personalized_learning_paths] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [GoalId] uniqueidentifier NULL,
        [Title] nvarchar(250) NOT NULL,
        [TargetHskLevel] int NOT NULL,
        [CurrentEstimatedHskLevel] int NULL,
        [TotalEstimatedWeeks] int NOT NULL,
        [TotalLessonsCount] int NOT NULL,
        [CompletedLessonsCount] int NOT NULL,
        [OverallProgressPercent] float NOT NULL,
        [Status] nvarchar(50) NOT NULL,
        [PedagogicalRationaleVi] nvarchar(max) NULL,
        [AiFocusTipsVi] nvarchar(max) NULL,
        [GeneratedAt] datetime2 NOT NULL,
        [LastReplannedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_personalized_learning_paths] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_personalized_learning_paths_student_learning_goals_GoalId] FOREIGN KEY ([GoalId]) REFERENCES [student_learning_goals] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_personalized_learning_paths_users_UserId] FOREIGN KEY ([UserId]) REFERENCES [users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261115170022_AddAiPersonalizationPhase3And4'
)
BEGIN
    CREATE TABLE [daily_learning_tasks] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [LearningPathId] uniqueidentifier NULL,
        [PlanDate] datetime2 NOT NULL,
        [TaskType] nvarchar(50) NOT NULL,
        [Title] nvarchar(250) NOT NULL,
        [Description] nvarchar(max) NULL,
        [EstimatedMinutes] int NOT NULL,
        [Priority] int NOT NULL,
        [TargetSkill] nvarchar(50) NOT NULL,
        [TargetHskLevel] int NOT NULL,
        [ResourceId] nvarchar(100) NULL,
        [DestinationRoute] nvarchar(250) NOT NULL,
        [CompletionStatus] nvarchar(50) NOT NULL,
        [CompletedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_daily_learning_tasks] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_daily_learning_tasks_personalized_learning_paths_LearningPathId] FOREIGN KEY ([LearningPathId]) REFERENCES [personalized_learning_paths] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_daily_learning_tasks_users_UserId] FOREIGN KEY ([UserId]) REFERENCES [users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261115170022_AddAiPersonalizationPhase3And4'
)
BEGIN
    CREATE TABLE [learning_path_milestones] (
        [Id] uniqueidentifier NOT NULL,
        [LearningPathId] uniqueidentifier NOT NULL,
        [StageOrder] int NOT NULL,
        [Title] nvarchar(250) NOT NULL,
        [Description] nvarchar(max) NULL,
        [PedagogicalGoalVi] nvarchar(max) NULL,
        [TargetSkillsJson] nvarchar(max) NOT NULL,
        [TopicsJson] nvarchar(max) NOT NULL,
        [LessonIdsJson] nvarchar(max) NOT NULL,
        [EstimatedDays] int NOT NULL,
        [IsCompleted] bit NOT NULL,
        [CompletedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_learning_path_milestones] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_learning_path_milestones_personalized_learning_paths_LearningPathId] FOREIGN KEY ([LearningPathId]) REFERENCES [personalized_learning_paths] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261115170022_AddAiPersonalizationPhase3And4'
)
BEGIN
    CREATE UNIQUE INDEX [idx_ai_exercise_attempts_user_exercise_unique] ON [ai_exercise_attempts] ([UserId], [AiExerciseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261115170022_AddAiPersonalizationPhase3And4'
)
BEGIN
    CREATE INDEX [idx_daily_learning_tasks_path] ON [daily_learning_tasks] ([LearningPathId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261115170022_AddAiPersonalizationPhase3And4'
)
BEGIN
    CREATE INDEX [idx_daily_learning_tasks_user_date] ON [daily_learning_tasks] ([UserId], [PlanDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261115170022_AddAiPersonalizationPhase3And4'
)
BEGIN
    CREATE INDEX [idx_learning_path_milestones_path] ON [learning_path_milestones] ([LearningPathId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261115170022_AddAiPersonalizationPhase3And4'
)
BEGIN
    CREATE INDEX [idx_personalized_learning_paths_user] ON [personalized_learning_paths] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261115170022_AddAiPersonalizationPhase3And4'
)
BEGIN
    CREATE INDEX [IX_personalized_learning_paths_GoalId] ON [personalized_learning_paths] ([GoalId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261115170022_AddAiPersonalizationPhase3And4'
)
BEGIN
    CREATE UNIQUE INDEX [idx_student_learning_goals_user] ON [student_learning_goals] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261115170022_AddAiPersonalizationPhase3And4'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261115170022_AddAiPersonalizationPhase3And4', N'10.0.14');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261115173345_AddAiPersonalizationPhase5Speaking'
)
BEGIN
    CREATE TABLE [ai_speaking_attempts] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [PracticeType] nvarchar(30) NOT NULL,
        [HskLevel] int NOT NULL,
        [TargetTextZh] nvarchar(500) NOT NULL,
        [TargetPinyin] nvarchar(500) NULL,
        [TargetMeaningVi] nvarchar(500) NULL,
        [RecognizedTranscriptZh] nvarchar(1000) NULL,
        [TranscriptAccuracyPercent] float NOT NULL,
        [OverallPronunciationScore] float NOT NULL,
        [AssessmentMethod] nvarchar(40) NOT NULL,
        [HasAcousticToneData] bit NOT NULL,
        [EvaluationFeedbackVi] nvarchar(max) NULL,
        [WordBreakdownJson] nvarchar(max) NULL,
        [DurationSeconds] int NOT NULL,
        [AudioStorageStatus] nvarchar(30) NOT NULL,
        [AttemptedAt] datetime2 NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_ai_speaking_attempts] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ai_speaking_attempts_users_UserId] FOREIGN KEY ([UserId]) REFERENCES [users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261115173345_AddAiPersonalizationPhase5Speaking'
)
BEGIN
    CREATE INDEX [idx_ai_speaking_attempts_user_type] ON [ai_speaking_attempts] ([UserId], [PracticeType], [AttemptedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261115173345_AddAiPersonalizationPhase5Speaking'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261115173345_AddAiPersonalizationPhase5Speaking', N'10.0.14');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261119064142_AddTeacherClassManagementEntities'
)
BEGIN
    ALTER TABLE [learning_videos] ADD [TranscriptPdfName] nvarchar(255) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261119064142_AddTeacherClassManagementEntities'
)
BEGIN
    ALTER TABLE [learning_videos] ADD [TranscriptPdfPath] nvarchar(500) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261119064142_AddTeacherClassManagementEntities'
)
BEGIN
    ALTER TABLE [learning_videos] ADD [TranscriptPdfSizeBytes] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261119064142_AddTeacherClassManagementEntities'
)
BEGIN
    CREATE TABLE [teaching_classes] (
        [Id] uniqueidentifier NOT NULL,
        [TeacherId] uniqueidentifier NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Code] nvarchar(50) NOT NULL,
        [Description] nvarchar(2000) NOT NULL DEFAULT N'',
        [HskLevelId] nvarchar(50) NOT NULL DEFAULT N'level-hsk-1',
        [CourseId] uniqueidentifier NULL,
        [Status] nvarchar(20) NOT NULL DEFAULT N'UPCOMING',
        [Capacity] int NOT NULL,
        [StartDate] datetime2 NOT NULL,
        [EndDate] datetime2 NULL,
        [LocationType] nvarchar(20) NOT NULL DEFAULT N'ONLINE',
        [MeetingUrl] nvarchar(500) NULL,
        [RoomLocation] nvarchar(200) NULL,
        [IsArchived] bit NOT NULL,
        [ArchivedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_teaching_classes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_teaching_classes_courses_CourseId] FOREIGN KEY ([CourseId]) REFERENCES [courses] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_teaching_classes_users_TeacherId] FOREIGN KEY ([TeacherId]) REFERENCES [users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261119064142_AddTeacherClassManagementEntities'
)
BEGIN
    CREATE TABLE [teaching_class_members] (
        [Id] uniqueidentifier NOT NULL,
        [ClassId] uniqueidentifier NOT NULL,
        [StudentId] uniqueidentifier NOT NULL,
        [EnrolledAt] datetime2 NOT NULL,
        [Status] nvarchar(20) NOT NULL DEFAULT N'ACTIVE',
        [AttendanceRate] float NOT NULL,
        [CompletedAssignmentsCount] int NOT NULL,
        [Notes] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_teaching_class_members] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_teaching_class_members_teaching_classes_ClassId] FOREIGN KEY ([ClassId]) REFERENCES [teaching_classes] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_teaching_class_members_users_StudentId] FOREIGN KEY ([StudentId]) REFERENCES [users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261119064142_AddTeacherClassManagementEntities'
)
BEGIN
    CREATE TABLE [teaching_class_schedules] (
        [Id] uniqueidentifier NOT NULL,
        [ClassId] uniqueidentifier NOT NULL,
        [DayOfWeek] nvarchar(20) NOT NULL DEFAULT N'MONDAY',
        [StartTime] nvarchar(10) NOT NULL DEFAULT N'19:00',
        [EndTime] nvarchar(10) NOT NULL DEFAULT N'20:30',
        [Timezone] nvarchar(50) NOT NULL DEFAULT N'Asia/Ho_Chi_Minh',
        [LocationType] nvarchar(20) NOT NULL DEFAULT N'ONLINE',
        [MeetingUrl] nvarchar(500) NULL,
        [RoomLocation] nvarchar(200) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_teaching_class_schedules] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_teaching_class_schedules_teaching_classes_ClassId] FOREIGN KEY ([ClassId]) REFERENCES [teaching_classes] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261119064142_AddTeacherClassManagementEntities'
)
BEGIN
    CREATE UNIQUE INDEX [idx_teaching_class_members_class_student_unique] ON [teaching_class_members] ([ClassId], [StudentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261119064142_AddTeacherClassManagementEntities'
)
BEGIN
    CREATE INDEX [idx_teaching_class_members_status] ON [teaching_class_members] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261119064142_AddTeacherClassManagementEntities'
)
BEGIN
    CREATE INDEX [idx_teaching_class_members_student] ON [teaching_class_members] ([StudentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261119064142_AddTeacherClassManagementEntities'
)
BEGIN
    CREATE INDEX [idx_teaching_class_schedules_class] ON [teaching_class_schedules] ([ClassId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261119064142_AddTeacherClassManagementEntities'
)
BEGIN
    CREATE INDEX [idx_teaching_classes_archived] ON [teaching_classes] ([IsArchived]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261119064142_AddTeacherClassManagementEntities'
)
BEGIN
    CREATE UNIQUE INDEX [idx_teaching_classes_code_unique] ON [teaching_classes] ([Code]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261119064142_AddTeacherClassManagementEntities'
)
BEGIN
    CREATE INDEX [idx_teaching_classes_hsk_level] ON [teaching_classes] ([HskLevelId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261119064142_AddTeacherClassManagementEntities'
)
BEGIN
    CREATE INDEX [idx_teaching_classes_status] ON [teaching_classes] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261119064142_AddTeacherClassManagementEntities'
)
BEGIN
    CREATE INDEX [idx_teaching_classes_teacher] ON [teaching_classes] ([TeacherId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261119064142_AddTeacherClassManagementEntities'
)
BEGIN
    CREATE INDEX [IX_teaching_classes_CourseId] ON [teaching_classes] ([CourseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261119064142_AddTeacherClassManagementEntities'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261119064142_AddTeacherClassManagementEntities', N'10.0.14');
END;

COMMIT;
GO

