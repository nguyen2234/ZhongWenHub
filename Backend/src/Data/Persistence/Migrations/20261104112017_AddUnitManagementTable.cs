using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUnitManagementTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UnitId",
                table: "lessons",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "units",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CourseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UnitNumber = table.Column<int>(type: "int", nullable: false),
                    TitleZh = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    TitleVi = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    OrderIndex = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "PUBLISHED"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_units", x => x.Id);
                    table.ForeignKey(
                        name: "FK_units_courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_lessons_UnitId",
                table: "lessons",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "idx_units_course_number",
                table: "units",
                columns: new[] { "CourseId", "UnitNumber" });

            migrationBuilder.CreateIndex(
                name: "idx_units_status",
                table: "units",
                column: "Status");

            migrationBuilder.AddForeignKey(
                name: "FK_lessons_units_UnitId",
                table: "lessons",
                column: "UnitId",
                principalTable: "units",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_lessons_units_UnitId",
                table: "lessons");

            migrationBuilder.DropTable(
                name: "units");

            migrationBuilder.DropIndex(
                name: "IX_lessons_UnitId",
                table: "lessons");

            migrationBuilder.DropColumn(
                name: "UnitId",
                table: "lessons");
        }
    }
}
