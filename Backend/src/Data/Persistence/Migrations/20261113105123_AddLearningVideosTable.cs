using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLearningVideosTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "learning_videos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    SourceType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "YouTube"),
                    YouTubeVideoId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    StoragePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ThumbnailUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    DurationSeconds = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    HskLevel = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    Topic = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false, defaultValue: "Giao tiếp hàng ngày"),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Draft"),
                    ViewCount = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    LessonId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_learning_videos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_learning_videos_lessons_LessonId",
                        column: x => x.LessonId,
                        principalTable: "lessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "idx_learning_videos_hsk_level",
                table: "learning_videos",
                column: "HskLevel");

            migrationBuilder.CreateIndex(
                name: "idx_learning_videos_source_type",
                table: "learning_videos",
                column: "SourceType");

            migrationBuilder.CreateIndex(
                name: "idx_learning_videos_status",
                table: "learning_videos",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "idx_learning_videos_status_hsk_created",
                table: "learning_videos",
                columns: new[] { "Status", "HskLevel", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "idx_learning_videos_topic",
                table: "learning_videos",
                column: "Topic");

            migrationBuilder.CreateIndex(
                name: "IX_learning_videos_LessonId",
                table: "learning_videos",
                column: "LessonId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "learning_videos");
        }
    }
}
