using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVocabularySourceMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "MeaningVi",
                table: "vocabularies",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255);

            migrationBuilder.AddColumn<string>(
                name: "SourceId",
                table: "vocabularies",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Entry",
                table: "vocabularies",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Homograph",
                table: "vocabularies",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LevelLabel",
                table: "vocabularies",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SourcePdfPage",
                table: "vocabularies",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "idx_vocabularies_source_id",
                table: "vocabularies",
                column: "SourceId");

            migrationBuilder.CreateIndex(
                name: "idx_vocabularies_lookup",
                table: "vocabularies",
                columns: new[] { "HskLevel", "Hanzi", "Pinyin", "Homograph" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_vocabularies_source_id",
                table: "vocabularies");

            migrationBuilder.DropIndex(
                name: "idx_vocabularies_lookup",
                table: "vocabularies");

            migrationBuilder.DropColumn(
                name: "SourceId",
                table: "vocabularies");

            migrationBuilder.DropColumn(
                name: "Entry",
                table: "vocabularies");

            migrationBuilder.DropColumn(
                name: "Homograph",
                table: "vocabularies");

            migrationBuilder.DropColumn(
                name: "LevelLabel",
                table: "vocabularies");

            migrationBuilder.DropColumn(
                name: "SourcePdfPage",
                table: "vocabularies");

            migrationBuilder.AlterColumn<string>(
                name: "MeaningVi",
                table: "vocabularies",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255,
                oldNullable: true);
        }
    }
}
