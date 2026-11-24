using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddHsk30GrammarAndHanziTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SuggestedMeaningVi",
                table: "vocabularies",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CategoryType",
                table: "grammar_points",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GrammarType",
                table: "grammar_points",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RawExplanationCn",
                table: "grammar_points",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceDataset",
                table: "grammar_points",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceEntryId",
                table: "grammar_points",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "hanzi_characters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Character = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Pinyin = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SinoVietnamese = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    StrokeCount = table.Column<int>(type: "int", nullable: true),
                    Radical = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    FirstHskLevel = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_hanzi_characters", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "hanzi_level_requirements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CharacterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Character = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    HskLevel = table.Column<int>(type: "int", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    TypeName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SourceDataset = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_hanzi_level_requirements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_hanzi_level_requirements_hanzi_characters_CharacterId",
                        column: x => x.CharacterId,
                        principalTable: "hanzi_characters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_grammar_points_source_entry",
                table: "grammar_points",
                columns: new[] { "SourceDataset", "SourceEntryId" });

            migrationBuilder.CreateIndex(
                name: "idx_hanzi_characters_character",
                table: "hanzi_characters",
                column: "Character",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_hanzi_characters_first_level",
                table: "hanzi_characters",
                column: "FirstHskLevel");

            migrationBuilder.CreateIndex(
                name: "idx_hanzi_req_char_level_type",
                table: "hanzi_level_requirements",
                columns: new[] { "Character", "HskLevel", "Type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_hanzi_req_level_type",
                table: "hanzi_level_requirements",
                columns: new[] { "HskLevel", "Type" });

            migrationBuilder.CreateIndex(
                name: "IX_hanzi_level_requirements_CharacterId",
                table: "hanzi_level_requirements",
                column: "CharacterId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "hanzi_level_requirements");

            migrationBuilder.DropTable(
                name: "hanzi_characters");

            migrationBuilder.DropIndex(
                name: "idx_grammar_points_source_entry",
                table: "grammar_points");

            migrationBuilder.DropColumn(
                name: "SuggestedMeaningVi",
                table: "vocabularies");

            migrationBuilder.DropColumn(
                name: "CategoryType",
                table: "grammar_points");

            migrationBuilder.DropColumn(
                name: "GrammarType",
                table: "grammar_points");

            migrationBuilder.DropColumn(
                name: "RawExplanationCn",
                table: "grammar_points");

            migrationBuilder.DropColumn(
                name: "SourceDataset",
                table: "grammar_points");

            migrationBuilder.DropColumn(
                name: "SourceEntryId",
                table: "grammar_points");
        }
    }
}
