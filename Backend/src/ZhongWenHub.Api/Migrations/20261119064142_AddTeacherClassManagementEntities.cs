using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTeacherClassManagementEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TranscriptPdfName",
                table: "learning_videos",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TranscriptPdfPath",
                table: "learning_videos",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "TranscriptPdfSizeBytes",
                table: "learning_videos",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "teaching_classes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TeacherId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false, defaultValue: ""),
                    HskLevelId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "level-hsk-1"),
                    CourseId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "UPCOMING"),
                    Capacity = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LocationType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "ONLINE"),
                    MeetingUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    RoomLocation = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    IsArchived = table.Column<bool>(type: "bit", nullable: false),
                    ArchivedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teaching_classes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_teaching_classes_courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_teaching_classes_users_TeacherId",
                        column: x => x.TeacherId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "teaching_class_members",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClassId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StudentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EnrolledAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "ACTIVE"),
                    AttendanceRate = table.Column<double>(type: "float", nullable: false),
                    CompletedAssignmentsCount = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teaching_class_members", x => x.Id);
                    table.ForeignKey(
                        name: "FK_teaching_class_members_teaching_classes_ClassId",
                        column: x => x.ClassId,
                        principalTable: "teaching_classes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_teaching_class_members_users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "teaching_class_schedules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClassId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DayOfWeek = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "MONDAY"),
                    StartTime = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false, defaultValue: "19:00"),
                    EndTime = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false, defaultValue: "20:30"),
                    Timezone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Asia/Ho_Chi_Minh"),
                    LocationType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "ONLINE"),
                    MeetingUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    RoomLocation = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teaching_class_schedules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_teaching_class_schedules_teaching_classes_ClassId",
                        column: x => x.ClassId,
                        principalTable: "teaching_classes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_teaching_class_members_class_student_unique",
                table: "teaching_class_members",
                columns: new[] { "ClassId", "StudentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_teaching_class_members_status",
                table: "teaching_class_members",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "idx_teaching_class_members_student",
                table: "teaching_class_members",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "idx_teaching_class_schedules_class",
                table: "teaching_class_schedules",
                column: "ClassId");

            migrationBuilder.CreateIndex(
                name: "idx_teaching_classes_archived",
                table: "teaching_classes",
                column: "IsArchived");

            migrationBuilder.CreateIndex(
                name: "idx_teaching_classes_code_unique",
                table: "teaching_classes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_teaching_classes_hsk_level",
                table: "teaching_classes",
                column: "HskLevelId");

            migrationBuilder.CreateIndex(
                name: "idx_teaching_classes_status",
                table: "teaching_classes",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "idx_teaching_classes_teacher",
                table: "teaching_classes",
                column: "TeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_teaching_classes_CourseId",
                table: "teaching_classes",
                column: "CourseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "teaching_class_members");

            migrationBuilder.DropTable(
                name: "teaching_class_schedules");

            migrationBuilder.DropTable(
                name: "teaching_classes");

            migrationBuilder.DropColumn(
                name: "TranscriptPdfName",
                table: "learning_videos");

            migrationBuilder.DropColumn(
                name: "TranscriptPdfPath",
                table: "learning_videos");

            migrationBuilder.DropColumn(
                name: "TranscriptPdfSizeBytes",
                table: "learning_videos");
        }
    }
}
