using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentLearningProgressTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "student_daily_activities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActivityDate = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Minutes = table.Column<int>(type: "int", nullable: false),
                    XpEarned = table.Column<int>(type: "int", nullable: false),
                    CompletedLessonsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExercisesCompleted = table.Column<int>(type: "int", nullable: false),
                    ReviewsCompleted = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_daily_activities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_student_daily_activities_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_learning_profiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SelectedHskLevel = table.Column<int>(type: "int", nullable: false),
                    CurrentLessonId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    XpTotal = table.Column<int>(type: "int", nullable: false),
                    StreakDays = table.Column<int>(type: "int", nullable: false),
                    LastActivityDate = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    TargetDailyMinutes = table.Column<int>(type: "int", nullable: false),
                    TargetDailyXp = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_learning_profiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_student_learning_profiles_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_lesson_progress",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LessonId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CurrentStepIndex = table.Column<int>(type: "int", nullable: false),
                    MaxUnlockedStepIndex = table.Column<int>(type: "int", nullable: false),
                    QuizScore = table.Column<int>(type: "int", nullable: true),
                    TotalQuizQuestions = table.Column<int>(type: "int", nullable: true),
                    XpEarned = table.Column<int>(type: "int", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_lesson_progress", x => x.Id);
                    table.ForeignKey(
                        name: "FK_student_lesson_progress_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_practice_attempts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExerciseId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    QuestionId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    KnowledgePointId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    TopicTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    HskLevel = table.Column<int>(type: "int", nullable: false),
                    UserAnswer = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    IsCorrect = table.Column<bool>(type: "bit", nullable: false),
                    AttemptedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_practice_attempts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_student_practice_attempts_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_vocabulary_progress",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VocabularyId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Hanzi = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Pinyin = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    FirstLearnedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NextReviewAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewCount = table.Column<int>(type: "int", nullable: false),
                    CorrectCount = table.Column<int>(type: "int", nullable: false),
                    SrsStage = table.Column<int>(type: "int", nullable: false),
                    Stability = table.Column<double>(type: "float", nullable: false),
                    Difficulty = table.Column<double>(type: "float", nullable: false),
                    IntervalDays = table.Column<int>(type: "int", nullable: false),
                    Repetitions = table.Column<int>(type: "int", nullable: false),
                    EaseFactor = table.Column<double>(type: "float", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_vocabulary_progress", x => x.Id);
                    table.ForeignKey(
                        name: "FK_student_vocabulary_progress_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_xp_transactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventId = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Amount = table.Column<int>(type: "int", nullable: false),
                    Source = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_xp_transactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_student_xp_transactions_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_daily_activities_user_date",
                table: "student_daily_activities",
                columns: new[] { "UserId", "ActivityDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_student_learning_profiles_user_id",
                table: "student_learning_profiles",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_student_lesson_progress_user_lesson",
                table: "student_lesson_progress",
                columns: new[] { "UserId", "LessonId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_practice_attempts_user_attempted",
                table: "student_practice_attempts",
                columns: new[] { "UserId", "AttemptedAt" });

            migrationBuilder.CreateIndex(
                name: "idx_vocabulary_progress_user_vocab",
                table: "student_vocabulary_progress",
                columns: new[] { "UserId", "VocabularyId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_xp_transactions_user_event",
                table: "student_xp_transactions",
                columns: new[] { "UserId", "EventId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "student_daily_activities");

            migrationBuilder.DropTable(
                name: "student_learning_profiles");

            migrationBuilder.DropTable(
                name: "student_lesson_progress");

            migrationBuilder.DropTable(
                name: "student_practice_attempts");

            migrationBuilder.DropTable(
                name: "student_vocabulary_progress");

            migrationBuilder.DropTable(
                name: "student_xp_transactions");
        }
    }
}
