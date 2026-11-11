using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAdministrativeApprovalFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AdministrativeApprovalNotes",
                table: "exercises",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AdministrativeApprovalScope",
                table: "exercises",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AdministrativeApprovalSource",
                table: "exercises",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AdministrativeApprovalStatus",
                table: "exercises",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "NONE");

            migrationBuilder.AddColumn<DateTime>(
                name: "AdministrativeApprovedAt",
                table: "exercises",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HumanAcademicReviewStatus",
                table: "exercises",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "NOT_REVIEWED");

            migrationBuilder.CreateIndex(
                name: "idx_exercises_hsk_admin_approval",
                table: "exercises",
                columns: new[] { "HskLevel", "AdministrativeApprovalStatus" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_exercises_hsk_admin_approval",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "AdministrativeApprovalNotes",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "AdministrativeApprovalScope",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "AdministrativeApprovalSource",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "AdministrativeApprovalStatus",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "AdministrativeApprovedAt",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "HumanAcademicReviewStatus",
                table: "exercises");
        }
    }
}
