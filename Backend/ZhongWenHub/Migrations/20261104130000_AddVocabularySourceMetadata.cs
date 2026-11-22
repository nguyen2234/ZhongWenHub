using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20261104130000_AddVocabularySourceMetadata")]
    public partial class AddVocabularySourceMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The migration was previously undiscoverable. Some databases already have
            // these columns and indexes even though EF has no migration history entry.
            migrationBuilder.Sql("""
                IF COLUMNPROPERTY(OBJECT_ID(N'vocabularies'), N'MeaningVi', 'AllowsNull') = 0
                    ALTER TABLE [vocabularies] ALTER COLUMN [MeaningVi] nvarchar(255) NULL;
                IF COL_LENGTH(N'vocabularies', N'SourceId') IS NULL
                    ALTER TABLE [vocabularies] ADD [SourceId] nvarchar(50) NULL;
                IF COL_LENGTH(N'vocabularies', N'Entry') IS NULL
                    ALTER TABLE [vocabularies] ADD [Entry] nvarchar(100) NULL;
                IF COL_LENGTH(N'vocabularies', N'Homograph') IS NULL
                    ALTER TABLE [vocabularies] ADD [Homograph] nvarchar(20) NULL;
                IF COL_LENGTH(N'vocabularies', N'LevelLabel') IS NULL
                    ALTER TABLE [vocabularies] ADD [LevelLabel] nvarchar(50) NULL;
                IF COL_LENGTH(N'vocabularies', N'SourcePdfPage') IS NULL
                    ALTER TABLE [vocabularies] ADD [SourcePdfPage] int NULL;
                """);

            migrationBuilder.Sql("""
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'vocabularies') AND name = N'idx_vocabularies_source_id')
                    EXEC(N'CREATE INDEX [idx_vocabularies_source_id] ON [vocabularies] ([SourceId]);');
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'vocabularies') AND name = N'idx_vocabularies_lookup')
                    EXEC(N'CREATE INDEX [idx_vocabularies_lookup] ON [vocabularies] ([HskLevel], [Hanzi], [Pinyin], [Homograph]);');
                """);
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
