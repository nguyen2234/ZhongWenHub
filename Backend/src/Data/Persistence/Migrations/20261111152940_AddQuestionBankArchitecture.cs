using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestionBankArchitecture : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContentHash",
                table: "exercises",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Difficulty",
                table: "exercises",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "MEDIUM");

            migrationBuilder.AddColumn<double>(
                name: "QualityScore",
                table: "exercises",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewNotes",
                table: "exercises",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewStatus",
                table: "exercises",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "DRAFT");

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAt",
                table: "exercises",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReviewedByUserId",
                table: "exercises",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceId",
                table: "exercises",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceLicense",
                table: "exercises",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tags",
                table: "exercises",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VocabularyId",
                table: "exercises",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "question_bank_practice_sessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HskLevel = table.Column<int>(type: "int", nullable: true),
                    Skill = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Difficulty = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Mode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "random"),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "IN_PROGRESS"),
                    TotalQuestions = table.Column<int>(type: "int", nullable: false),
                    CorrectCount = table.Column<int>(type: "int", nullable: false),
                    XpAwarded = table.Column<int>(type: "int", nullable: false),
                    Accuracy = table.Column<double>(type: "float", nullable: false),
                    TimeSpentSeconds = table.Column<int>(type: "int", nullable: false),
                    ExerciseIdsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SelectionReasonsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AnswersJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_question_bank_practice_sessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_question_bank_practice_sessions_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_practice_attempts_user_hsk_correct",
                table: "student_practice_attempts",
                columns: new[] { "UserId", "HskLevel", "IsCorrect" });

            migrationBuilder.CreateIndex(
                name: "idx_exercises_content_hash",
                table: "exercises",
                column: "ContentHash");

            migrationBuilder.CreateIndex(
                name: "idx_exercises_hsk_skill_diff_status",
                table: "exercises",
                columns: new[] { "HskLevel", "Skill", "Difficulty", "Status" });

            migrationBuilder.CreateIndex(
                name: "idx_exercises_review_status",
                table: "exercises",
                column: "ReviewStatus");

            migrationBuilder.CreateIndex(
                name: "idx_exercises_source_id",
                table: "exercises",
                column: "SourceId");

            migrationBuilder.CreateIndex(
                name: "idx_exercises_type",
                table: "exercises",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "idx_exercises_vocab_id",
                table: "exercises",
                column: "VocabularyId");

            migrationBuilder.CreateIndex(
                name: "idx_qb_practice_sessions_user_started",
                table: "question_bank_practice_sessions",
                columns: new[] { "UserId", "StartedAt" });

            migrationBuilder.AddForeignKey(
                name: "FK_exercises_vocabularies_VocabularyId",
                table: "exercises",
                column: "VocabularyId",
                principalTable: "vocabularies",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            // Preserve and classify the 337 existing published curriculum exercises
            migrationBuilder.Sql(@"
                UPDATE exercises
                SET ReviewStatus = 'APPROVED',
                    SourceId = COALESCE(SourceId, 'curriculum-seed'),
                    SourceLicense = COALESCE(SourceLicense, 'INTERNAL_AUTHORED'),
                    QualityScore = COALESCE(QualityScore, 100.0),
                    Difficulty = CASE
                        WHEN HskLevel = 1 THEN 'EASY'
                        WHEN HskLevel >= 4 THEN 'HARD'
                        ELSE 'MEDIUM'
                    END
                WHERE Status = 'PUBLISHED' AND ReviewStatus = 'DRAFT';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_exercises_vocabularies_VocabularyId",
                table: "exercises");

            migrationBuilder.DropTable(
                name: "question_bank_practice_sessions");

            migrationBuilder.DropIndex(
                name: "idx_practice_attempts_user_hsk_correct",
                table: "student_practice_attempts");

            migrationBuilder.DropIndex(
                name: "idx_exercises_content_hash",
                table: "exercises");

            migrationBuilder.DropIndex(
                name: "idx_exercises_hsk_skill_diff_status",
                table: "exercises");

            migrationBuilder.DropIndex(
                name: "idx_exercises_review_status",
                table: "exercises");

            migrationBuilder.DropIndex(
                name: "idx_exercises_source_id",
                table: "exercises");

            migrationBuilder.DropIndex(
                name: "idx_exercises_type",
                table: "exercises");

            migrationBuilder.DropIndex(
                name: "idx_exercises_vocab_id",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "ContentHash",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "Difficulty",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "QualityScore",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "ReviewNotes",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "ReviewStatus",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "ReviewedByUserId",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "SourceId",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "SourceLicense",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "Tags",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "VocabularyId",
                table: "exercises");
        }
    }
}
