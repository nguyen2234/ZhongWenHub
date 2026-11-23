using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAiPersonalizationPhase5Speaking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ai_speaking_attempts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PracticeType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    HskLevel = table.Column<int>(type: "int", nullable: false),
                    TargetTextZh = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    TargetPinyin = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    TargetMeaningVi = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    RecognizedTranscriptZh = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    TranscriptAccuracyPercent = table.Column<double>(type: "float", nullable: false),
                    OverallPronunciationScore = table.Column<double>(type: "float", nullable: false),
                    AssessmentMethod = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    HasAcousticToneData = table.Column<bool>(type: "bit", nullable: false),
                    EvaluationFeedbackVi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    WordBreakdownJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DurationSeconds = table.Column<int>(type: "int", nullable: false),
                    AudioStorageStatus = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    AttemptedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_speaking_attempts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ai_speaking_attempts_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_ai_speaking_attempts_user_type",
                table: "ai_speaking_attempts",
                columns: new[] { "UserId", "PracticeType", "AttemptedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ai_speaking_attempts");
        }
    }
}
