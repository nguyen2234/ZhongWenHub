using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAiPersonalizationPhase3And4 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "student_learning_goals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TargetHskLevel = table.Column<int>(type: "int", nullable: false),
                    DailyStudyMinutes = table.Column<int>(type: "int", nullable: false),
                    StudyDaysPerWeek = table.Column<int>(type: "int", nullable: false),
                    TargetDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PrioritySkillsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IntensityMode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_learning_goals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_student_learning_goals_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "personalized_learning_paths",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GoalId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    TargetHskLevel = table.Column<int>(type: "int", nullable: false),
                    CurrentEstimatedHskLevel = table.Column<int>(type: "int", nullable: true),
                    TotalEstimatedWeeks = table.Column<int>(type: "int", nullable: false),
                    TotalLessonsCount = table.Column<int>(type: "int", nullable: false),
                    CompletedLessonsCount = table.Column<int>(type: "int", nullable: false),
                    OverallProgressPercent = table.Column<double>(type: "float", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PedagogicalRationaleVi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AiFocusTipsVi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastReplannedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_personalized_learning_paths", x => x.Id);
                    table.ForeignKey(
                        name: "FK_personalized_learning_paths_student_learning_goals_GoalId",
                        column: x => x.GoalId,
                        principalTable: "student_learning_goals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_personalized_learning_paths_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "daily_learning_tasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LearningPathId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PlanDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TaskType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EstimatedMinutes = table.Column<int>(type: "int", nullable: false),
                    Priority = table.Column<int>(type: "int", nullable: false),
                    TargetSkill = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TargetHskLevel = table.Column<int>(type: "int", nullable: false),
                    ResourceId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DestinationRoute = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    CompletionStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_daily_learning_tasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_daily_learning_tasks_personalized_learning_paths_LearningPathId",
                        column: x => x.LearningPathId,
                        principalTable: "personalized_learning_paths",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_daily_learning_tasks_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "learning_path_milestones",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LearningPathId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StageOrder = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PedagogicalGoalVi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TargetSkillsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TopicsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LessonIdsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EstimatedDays = table.Column<int>(type: "int", nullable: false),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_learning_path_milestones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_learning_path_milestones_personalized_learning_paths_LearningPathId",
                        column: x => x.LearningPathId,
                        principalTable: "personalized_learning_paths",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_ai_exercise_attempts_user_exercise_unique",
                table: "ai_exercise_attempts",
                columns: new[] { "UserId", "AiExerciseId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_daily_learning_tasks_path",
                table: "daily_learning_tasks",
                column: "LearningPathId");

            migrationBuilder.CreateIndex(
                name: "idx_daily_learning_tasks_user_date",
                table: "daily_learning_tasks",
                columns: new[] { "UserId", "PlanDate" });

            migrationBuilder.CreateIndex(
                name: "idx_learning_path_milestones_path",
                table: "learning_path_milestones",
                column: "LearningPathId");

            migrationBuilder.CreateIndex(
                name: "idx_personalized_learning_paths_user",
                table: "personalized_learning_paths",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_personalized_learning_paths_GoalId",
                table: "personalized_learning_paths",
                column: "GoalId");

            migrationBuilder.CreateIndex(
                name: "idx_student_learning_goals_user",
                table: "student_learning_goals",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "daily_learning_tasks");

            migrationBuilder.DropTable(
                name: "learning_path_milestones");

            migrationBuilder.DropTable(
                name: "personalized_learning_paths");

            migrationBuilder.DropTable(
                name: "student_learning_goals");

            migrationBuilder.DropIndex(
                name: "idx_ai_exercise_attempts_user_exercise_unique",
                table: "ai_exercise_attempts");
        }
    }
}
