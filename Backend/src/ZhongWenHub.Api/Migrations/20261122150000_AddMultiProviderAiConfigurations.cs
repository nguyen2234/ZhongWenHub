using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMultiProviderAiConfigurations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AiProviderConfigurations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ProviderType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    BaseUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    EncryptedApiKey = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DefaultModel = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CapabilitiesJson = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    Priority = table.Column<int>(type: "int", nullable: false),
                    TimeoutSeconds = table.Column<int>(type: "int", nullable: false),
                    MaxRetries = table.Column<int>(type: "int", nullable: false),
                    MaxTokens = table.Column<int>(type: "int", nullable: true),
                    Temperature = table.Column<double>(type: "float", nullable: true),
                    LastHealthStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    LastHealthMessage = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    LastCheckedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiProviderConfigurations", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AiProviderConfigurations_IsEnabled",
                table: "AiProviderConfigurations",
                column: "IsEnabled");

            migrationBuilder.CreateIndex(
                name: "IX_AiProviderConfigurations_Priority",
                table: "AiProviderConfigurations",
                column: "Priority");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AiProviderConfigurations");
        }
    }
}
