using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserLockFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LockReason",
                table: "users",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LockedAt",
                table: "users",
                type: "timestamptz",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "users",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CurrentHskLevel",
                table: "users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true,
                defaultValue: "HSK 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LockReason",
                table: "users");

            migrationBuilder.DropColumn(
                name: "LockedAt",
                table: "users");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "users");

            migrationBuilder.DropColumn(
                name: "CurrentHskLevel",
                table: "users");
        }
    }
}
