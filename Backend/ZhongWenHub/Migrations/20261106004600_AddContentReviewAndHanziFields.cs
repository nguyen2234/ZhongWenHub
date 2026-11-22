using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddContentReviewAndHanziFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "vocabularies",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReviewedByUserId",
                table: "vocabularies",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAt",
                table: "vocabularies",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewNotes",
                table: "vocabularies",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "grammar_points",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReviewedByUserId",
                table: "grammar_points",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAt",
                table: "grammar_points",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewNotes",
                table: "grammar_points",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MeaningVi",
                table: "hanzi_characters",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "vocabularies");

            migrationBuilder.DropColumn(
                name: "ReviewedByUserId",
                table: "vocabularies");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "vocabularies");

            migrationBuilder.DropColumn(
                name: "ReviewNotes",
                table: "vocabularies");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "grammar_points");

            migrationBuilder.DropColumn(
                name: "ReviewedByUserId",
                table: "grammar_points");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "grammar_points");

            migrationBuilder.DropColumn(
                name: "ReviewNotes",
                table: "grammar_points");

            migrationBuilder.DropColumn(
                name: "MeaningVi",
                table: "hanzi_characters");
        }
    }
}
