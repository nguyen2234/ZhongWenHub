using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLessonVocabulariesAndNormalizedKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NormalizedHomograph",
                table: "vocabularies",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NormalizedPinyin",
                table: "vocabularies",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "lesson_vocabularies",
                columns: table => new
                {
                    LessonId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VocabularyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lesson_vocabularies", x => new { x.LessonId, x.VocabularyId });
                    table.ForeignKey(
                        name: "FK_lesson_vocabularies_lessons_LessonId",
                        column: x => x.LessonId,
                        principalTable: "lessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_lesson_vocabularies_vocabularies_VocabularyId",
                        column: x => x.VocabularyId,
                        principalTable: "vocabularies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_vocabularies_normalized_key",
                table: "vocabularies",
                columns: new[] { "HskLevel", "Hanzi", "NormalizedPinyin", "NormalizedHomograph" });

            migrationBuilder.CreateIndex(
                name: "idx_lesson_vocabularies_vocabulary_id",
                table: "lesson_vocabularies",
                column: "VocabularyId");

            migrationBuilder.Sql(@"
UPDATE vocabularies
SET
    Hanzi = LTRIM(RTRIM(Hanzi)),
    Pinyin = LTRIM(RTRIM(Pinyin)),
    NormalizedPinyin = LOWER(
        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            LTRIM(RTRIM(Pinyin)),
            N' ', N''),
            NCHAR(160), N''),
            N'''', N''),
            NCHAR(8217), N''),
            N'-', N''),
            N'·', N''),
            N'•', N''),
            N'/', N''),
            N'.', N''),
            N',', N''),
            N'(', N'')
    ),
    NormalizedHomograph = ISNULL(LTRIM(RTRIM(Homograph)), N'');

UPDATE vocabularies
SET NormalizedPinyin = REPLACE(NormalizedPinyin, N')', N'');

INSERT INTO lesson_vocabularies (LessonId, VocabularyId, SortOrder, CreatedAt)
SELECT v.LessonId, v.Id, 0, SYSUTCDATETIME()
FROM vocabularies v
INNER JOIN lessons l ON l.Id = v.LessonId
WHERE v.LessonId IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM lesson_vocabularies lv
      WHERE lv.LessonId = v.LessonId AND lv.VocabularyId = v.Id
  );
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "lesson_vocabularies");

            migrationBuilder.DropIndex(
                name: "idx_vocabularies_normalized_key",
                table: "vocabularies");

            migrationBuilder.DropColumn(
                name: "NormalizedHomograph",
                table: "vocabularies");

            migrationBuilder.DropColumn(
                name: "NormalizedPinyin",
                table: "vocabularies");
        }
    }
}
