using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAiTokenGovernance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AiFeatureGovernances",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FeatureGroup = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DisplayNameVi = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    DailyTokenQuota = table.Column<long>(type: "bigint", nullable: false),
                    MonthlyTokenQuota = table.Column<long>(type: "bigint", nullable: false),
                    UserDailyRequestLimit = table.Column<int>(type: "int", nullable: false),
                    MaxTokensPerRequest = table.Column<int>(type: "int", nullable: false),
                    DescriptionVi = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiFeatureGovernances", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AiFeatureGovernances_FeatureGroup",
                table: "AiFeatureGovernances",
                column: "FeatureGroup",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AiFeatureGovernances");
        }
    }
}
