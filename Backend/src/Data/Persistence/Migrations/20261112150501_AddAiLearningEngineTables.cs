using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAiLearningEngineTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ai_conversation_sessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SessionType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    HskLevel = table.Column<int>(type: "int", nullable: false),
                    ScenarioCode = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    ScenarioTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ShowPinyin = table.Column<bool>(type: "bit", nullable: false),
                    ShowVietnamese = table.Column<bool>(type: "bit", nullable: false),
                    MessageCount = table.Column<int>(type: "int", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SummaryVi = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_conversation_sessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ai_conversation_sessions_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ai_generated_exercises",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HskLevel = table.Column<int>(type: "int", nullable: false),
                    LessonId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    SourceType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ExerciseType = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    OriginTag = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    AcademicStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SourceReviewNote = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PromptZh = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PromptPinyin = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PromptVi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OptionsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CorrectIndex = table.Column<int>(type: "int", nullable: true),
                    CorrectAnswer = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ExplanationVi = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MetadataJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_generated_exercises", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ai_generated_exercises_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ai_usage_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Feature = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Provider = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Model = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsMock = table.Column<bool>(type: "bit", nullable: false),
                    PromptTokens = table.Column<int>(type: "int", nullable: false),
                    CompletionTokens = table.Column<int>(type: "int", nullable: false),
                    TotalTokens = table.Column<int>(type: "int", nullable: false),
                    LatencyMs = table.Column<int>(type: "int", nullable: false),
                    Success = table.Column<bool>(type: "bit", nullable: false),
                    ErrorCode = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_usage_logs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "learning_skill_statistics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SkillCategory = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    TotalAttempts = table.Column<int>(type: "int", nullable: false),
                    CorrectAttempts = table.Column<int>(type: "int", nullable: false),
                    IncorrectAttempts = table.Column<int>(type: "int", nullable: false),
                    AccuracyPercent = table.Column<double>(type: "float", nullable: false),
                    WeakTopicsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LastAssessedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_learning_skill_statistics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_learning_skill_statistics_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ai_messages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ContentZh = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Pinyin = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ContentVi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CorrectionJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StructuredPayloadJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Model = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PromptTokens = table.Column<int>(type: "int", nullable: false),
                    CompletionTokens = table.Column<int>(type: "int", nullable: false),
                    LatencyMs = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_messages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ai_messages_ai_conversation_sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "ai_conversation_sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ai_exercise_attempts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AiExerciseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserAnswer = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    SelectedIndex = table.Column<int>(type: "int", nullable: true),
                    IsCorrect = table.Column<bool>(type: "bit", nullable: false),
                    SkillCategory = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    AttemptedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_exercise_attempts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ai_exercise_attempts_ai_generated_exercises_AiExerciseId",
                        column: x => x.AiExerciseId,
                        principalTable: "ai_generated_exercises",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_ai_sessions_user_started",
                table: "ai_conversation_sessions",
                columns: new[] { "UserId", "StartedAt" });

            migrationBuilder.CreateIndex(
                name: "idx_ai_exercise_attempts_user",
                table: "ai_exercise_attempts",
                columns: new[] { "UserId", "AttemptedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ai_exercise_attempts_AiExerciseId",
                table: "ai_exercise_attempts",
                column: "AiExerciseId");

            migrationBuilder.CreateIndex(
                name: "idx_ai_exercises_user_hsk",
                table: "ai_generated_exercises",
                columns: new[] { "UserId", "HskLevel", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "idx_ai_messages_session_created",
                table: "ai_messages",
                columns: new[] { "SessionId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "idx_ai_usage_logs_user_created",
                table: "ai_usage_logs",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "idx_learning_skill_stats_user_skill",
                table: "learning_skill_statistics",
                columns: new[] { "UserId", "SkillCategory" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ai_exercise_attempts");

            migrationBuilder.DropTable(
                name: "ai_messages");

            migrationBuilder.DropTable(
                name: "ai_usage_logs");

            migrationBuilder.DropTable(
                name: "learning_skill_statistics");

            migrationBuilder.DropTable(
                name: "ai_generated_exercises");

            migrationBuilder.DropTable(
                name: "ai_conversation_sessions");
        }
    }
}
