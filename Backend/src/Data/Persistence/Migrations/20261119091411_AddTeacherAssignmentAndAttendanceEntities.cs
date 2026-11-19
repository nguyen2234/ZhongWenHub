using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTeacherAssignmentAndAttendanceEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "teaching_assignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TeacherId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false, defaultValue: ""),
                    HskLevelId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "level-hsk-1"),
                    LessonId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "DRAFT"),
                    TimeLimitMinutes = table.Column<int>(type: "int", nullable: false),
                    MaxAttempts = table.Column<int>(type: "int", nullable: false),
                    RetakePolicy = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "HIGHEST_SCORE"),
                    PassingPoints = table.Column<double>(type: "float", nullable: false),
                    AllowLateSubmission = table.Column<bool>(type: "bit", nullable: false),
                    LatePenaltyPercent = table.Column<int>(type: "int", nullable: false),
                    ShuffleQuestions = table.Column<bool>(type: "bit", nullable: false),
                    ShowCorrectAnswers = table.Column<bool>(type: "bit", nullable: false),
                    PublishedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ClosedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teaching_assignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_teaching_assignments_lessons_LessonId",
                        column: x => x.LessonId,
                        principalTable: "lessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_teaching_assignments_users_TeacherId",
                        column: x => x.TeacherId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "teaching_class_attendances",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClassId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ScheduleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    StudentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AttendanceDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "PRESENT"),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    RecordedByTeacherId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teaching_class_attendances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_teaching_class_attendances_teaching_class_schedules_ScheduleId",
                        column: x => x.ScheduleId,
                        principalTable: "teaching_class_schedules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_teaching_class_attendances_teaching_classes_ClassId",
                        column: x => x.ClassId,
                        principalTable: "teaching_classes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_teaching_class_attendances_users_RecordedByTeacherId",
                        column: x => x.RecordedByTeacherId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_teaching_class_attendances_users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "assignment_questions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssignmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuestionBankItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Prompt = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    QuestionType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "SINGLE_CHOICE"),
                    OptionsJson = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    CorrectAnswer = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Explanation = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Points = table.Column<double>(type: "float", nullable: false),
                    OrderIndex = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_assignment_questions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_assignment_questions_teaching_assignments_AssignmentId",
                        column: x => x.AssignmentId,
                        principalTable: "teaching_assignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "assignment_targets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssignmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClassId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_assignment_targets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_assignment_targets_teaching_assignments_AssignmentId",
                        column: x => x.AssignmentId,
                        principalTable: "teaching_assignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_assignment_targets_teaching_classes_ClassId",
                        column: x => x.ClassId,
                        principalTable: "teaching_classes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_assignment_submissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssignmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StudentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClassId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AttemptNumber = table.Column<int>(type: "int", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "IN_PROGRESS"),
                    Score = table.Column<double>(type: "float", nullable: false),
                    MaxScore = table.Column<double>(type: "float", nullable: false),
                    IsPassed = table.Column<bool>(type: "bit", nullable: false),
                    TimeSpentSeconds = table.Column<int>(type: "int", nullable: false),
                    StudentAnswersJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FeedbackNote = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    GradedByTeacherId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    GradedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_assignment_submissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_student_assignment_submissions_teaching_assignments_AssignmentId",
                        column: x => x.AssignmentId,
                        principalTable: "teaching_assignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_student_assignment_submissions_teaching_classes_ClassId",
                        column: x => x.ClassId,
                        principalTable: "teaching_classes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_student_assignment_submissions_users_GradedByTeacherId",
                        column: x => x.GradedByTeacherId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_student_assignment_submissions_users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "idx_assignment_questions_assignment_order",
                table: "assignment_questions",
                columns: new[] { "AssignmentId", "OrderIndex" });

            migrationBuilder.CreateIndex(
                name: "idx_assignment_targets_assignment_class_unique",
                table: "assignment_targets",
                columns: new[] { "AssignmentId", "ClassId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_assignment_targets_class",
                table: "assignment_targets",
                column: "ClassId");

            migrationBuilder.CreateIndex(
                name: "idx_student_submissions_assignment_student_attempt_unique",
                table: "student_assignment_submissions",
                columns: new[] { "AssignmentId", "StudentId", "AttemptNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_student_submissions_class_status",
                table: "student_assignment_submissions",
                columns: new[] { "ClassId", "Status" });

            migrationBuilder.CreateIndex(
                name: "idx_student_submissions_status",
                table: "student_assignment_submissions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "idx_student_submissions_student",
                table: "student_assignment_submissions",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_student_assignment_submissions_GradedByTeacherId",
                table: "student_assignment_submissions",
                column: "GradedByTeacherId");

            migrationBuilder.CreateIndex(
                name: "idx_teaching_assignments_hsk_level",
                table: "teaching_assignments",
                column: "HskLevelId");

            migrationBuilder.CreateIndex(
                name: "idx_teaching_assignments_lesson",
                table: "teaching_assignments",
                column: "LessonId");

            migrationBuilder.CreateIndex(
                name: "idx_teaching_assignments_status",
                table: "teaching_assignments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "idx_teaching_assignments_teacher",
                table: "teaching_assignments",
                column: "TeacherId");

            migrationBuilder.CreateIndex(
                name: "idx_teaching_class_attendances_class_date",
                table: "teaching_class_attendances",
                columns: new[] { "ClassId", "AttendanceDate" });

            migrationBuilder.CreateIndex(
                name: "idx_teaching_class_attendances_class_student_date_unique",
                table: "teaching_class_attendances",
                columns: new[] { "ClassId", "StudentId", "AttendanceDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_teaching_class_attendances_student",
                table: "teaching_class_attendances",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_teaching_class_attendances_RecordedByTeacherId",
                table: "teaching_class_attendances",
                column: "RecordedByTeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_teaching_class_attendances_ScheduleId",
                table: "teaching_class_attendances",
                column: "ScheduleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "assignment_questions");

            migrationBuilder.DropTable(
                name: "assignment_targets");

            migrationBuilder.DropTable(
                name: "student_assignment_submissions");

            migrationBuilder.DropTable(
                name: "teaching_class_attendances");

            migrationBuilder.DropTable(
                name: "teaching_assignments");
        }
    }
}
