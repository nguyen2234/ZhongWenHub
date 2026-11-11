using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EnforceVocabularyUniqueCanonicalKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_vocabularies_normalized_key",
                table: "vocabularies");

            migrationBuilder.CreateIndex(
                name: "UQ_vocabularies_active_canonical_key",
                table: "vocabularies",
                columns: new[] { "HskLevel", "Hanzi", "NormalizedPinyin", "NormalizedHomograph" },
                unique: true,
                filter: "[Status] <> N'ARCHIVED'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UQ_vocabularies_active_canonical_key",
                table: "vocabularies");

            migrationBuilder.CreateIndex(
                name: "idx_vocabularies_normalized_key",
                table: "vocabularies",
                columns: new[] { "HskLevel", "Hanzi", "NormalizedPinyin", "NormalizedHomograph" });
        }
    }
}
