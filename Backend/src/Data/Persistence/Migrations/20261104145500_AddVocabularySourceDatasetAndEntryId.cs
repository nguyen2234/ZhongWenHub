using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVocabularySourceDatasetAndEntryId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SourceDataset",
                table: "vocabularies",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceEntryId",
                table: "vocabularies",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "idx_vocabularies_source_dataset_entry",
                table: "vocabularies",
                columns: new[] { "SourceDataset", "SourceEntryId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_vocabularies_source_dataset_entry",
                table: "vocabularies");

            migrationBuilder.DropColumn(
                name: "SourceDataset",
                table: "vocabularies");

            migrationBuilder.DropColumn(
                name: "SourceEntryId",
                table: "vocabularies");
        }
    }
}
