using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVideoStorageOutboxAndUploadAssets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "video_storage_cleanup_jobs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StoragePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    StorageProvider = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Unknown"),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    Reason = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false, defaultValue: "VideoDeleted"),
                    RetryCount = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    NextRetryAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastError = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LeaseOwner = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LeaseExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_video_storage_cleanup_jobs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "video_upload_assets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StoragePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    StorageProvider = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Unknown"),
                    UploadedByUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    UploadStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Completed"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LinkedVideoId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ContentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false, defaultValue: 0L),
                    AssetType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Video")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_video_upload_assets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_video_upload_assets_learning_videos_LinkedVideoId",
                        column: x => x.LinkedVideoId,
                        principalTable: "learning_videos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "idx_cleanup_jobs_lease_expires",
                table: "video_storage_cleanup_jobs",
                column: "LeaseExpiresAt");

            migrationBuilder.CreateIndex(
                name: "idx_cleanup_jobs_status_retry_created",
                table: "video_storage_cleanup_jobs",
                columns: new[] { "Status", "NextRetryAt", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "idx_upload_assets_linked_video",
                table: "video_upload_assets",
                column: "LinkedVideoId");

            migrationBuilder.CreateIndex(
                name: "idx_upload_assets_status_user",
                table: "video_upload_assets",
                columns: new[] { "UploadStatus", "UploadedByUserId" });

            migrationBuilder.CreateIndex(
                name: "idx_upload_assets_storage_path",
                table: "video_upload_assets",
                column: "StoragePath");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "video_storage_cleanup_jobs");

            migrationBuilder.DropTable(
                name: "video_upload_assets");
        }
    }
}
