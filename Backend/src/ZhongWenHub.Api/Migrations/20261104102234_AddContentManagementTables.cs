using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddContentManagementTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "courses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    HskLevel = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "PUBLISHED"),
                    OrderIndex = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_courses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "lessons",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CourseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LessonNumber = table.Column<int>(type: "int", nullable: false),
                    TitleZh = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    TitleVi = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Pinyin = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Summary = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    DurationMinutes = table.Column<int>(type: "int", nullable: false),
                    XpReward = table.Column<int>(type: "int", nullable: false),
                    OrderIndex = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "PUBLISHED"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lessons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_lessons_courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "grammar_points",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    PinyinTitle = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    HskLevel = table.Column<int>(type: "int", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    StructureFormula = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Explanation = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Difficulty = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ExamplesJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PracticeJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "PUBLISHED"),
                    LessonId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_grammar_points", x => x.Id);
                    table.ForeignKey(
                        name: "FK_grammar_points_lessons_LessonId",
                        column: x => x.LessonId,
                        principalTable: "lessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "vocabularies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HskLevel = table.Column<int>(type: "int", nullable: false),
                    Hanzi = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Traditional = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Pinyin = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    MeaningVi = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    MeaningEn = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    PartOfSpeech = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    AudioUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ExamplesJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "PUBLISHED"),
                    LessonId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vocabularies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_vocabularies_lessons_LessonId",
                        column: x => x.LessonId,
                        principalTable: "lessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "exercises",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Skill = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    HskLevel = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Instruction = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    PromptHanzi = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PromptPinyin = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PromptVietnamese = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    AudioUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    OptionsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CorrectOptionIndex = table.Column<int>(type: "int", nullable: true),
                    CorrectAnswer = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Explanation = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    XpReward = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "PUBLISHED"),
                    LessonId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    GrammarPointId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_exercises", x => x.Id);
                    table.ForeignKey(
                        name: "FK_exercises_grammar_points_GrammarPointId",
                        column: x => x.GrammarPointId,
                        principalTable: "grammar_points",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_exercises_lessons_LessonId",
                        column: x => x.LessonId,
                        principalTable: "lessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "idx_courses_code",
                table: "courses",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_courses_hsk_level",
                table: "courses",
                column: "HskLevel");

            migrationBuilder.CreateIndex(
                name: "idx_exercises_hsk_level",
                table: "exercises",
                column: "HskLevel");

            migrationBuilder.CreateIndex(
                name: "idx_exercises_skill",
                table: "exercises",
                column: "Skill");

            migrationBuilder.CreateIndex(
                name: "idx_exercises_status",
                table: "exercises",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_exercises_GrammarPointId",
                table: "exercises",
                column: "GrammarPointId");

            migrationBuilder.CreateIndex(
                name: "IX_exercises_LessonId",
                table: "exercises",
                column: "LessonId");

            migrationBuilder.CreateIndex(
                name: "idx_grammar_points_code",
                table: "grammar_points",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_grammar_points_hsk_level",
                table: "grammar_points",
                column: "HskLevel");

            migrationBuilder.CreateIndex(
                name: "idx_grammar_points_status",
                table: "grammar_points",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_grammar_points_LessonId",
                table: "grammar_points",
                column: "LessonId");

            migrationBuilder.CreateIndex(
                name: "idx_lessons_course_number",
                table: "lessons",
                columns: new[] { "CourseId", "LessonNumber" });

            migrationBuilder.CreateIndex(
                name: "idx_lessons_status",
                table: "lessons",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "idx_vocabularies_hanzi",
                table: "vocabularies",
                column: "Hanzi");

            migrationBuilder.CreateIndex(
                name: "idx_vocabularies_hsk_level",
                table: "vocabularies",
                column: "HskLevel");

            migrationBuilder.CreateIndex(
                name: "idx_vocabularies_status",
                table: "vocabularies",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_vocabularies_LessonId",
                table: "vocabularies",
                column: "LessonId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "exercises");

            migrationBuilder.DropTable(
                name: "vocabularies");

            migrationBuilder.DropTable(
                name: "grammar_points");

            migrationBuilder.DropTable(
                name: "lessons");

            migrationBuilder.DropTable(
                name: "courses");
        }
    }
}
