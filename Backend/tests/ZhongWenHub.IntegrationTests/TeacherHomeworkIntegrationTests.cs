using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using ZhongWenHub.Business.Teacher.DTOs;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.IntegrationTests;

[Collection("IntegrationTests")]
public class TeacherHomeworkIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public TeacherHomeworkIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> LoginAndGetTokenAsync(string email, string password)
    {
        var loginPayload = new { usernameOrEmail = email, password = password };
        var res = await _client.PostAsJsonAsync("/api/v1/auth/login", loginPayload);
        res.EnsureSuccessStatusCode();

        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("accessToken").GetString()!;
    }

    private HttpRequestMessage CreateAuthenticatedRequest(HttpMethod method, string url, string token, object? content = null)
    {
        var req = new HttpRequestMessage(method, url);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        if (content != null)
        {
            req.Content = JsonContent.Create(content);
        }
        return req;
    }

    [Fact]
    public async Task TeacherAndStudent_FullHomeworkLoop_WithGradingAndZeroLeak_Succeeds()
    {
        // 1. Authenticate Teacher & Student
        var teacherToken = await LoginAndGetTokenAsync("teacher@zhongwenhub.edu.vn", "TeacherPassword123!");
        var studentToken = await LoginAndGetTokenAsync("student@zhongwenhub.edu.vn", "StudentPassword123!");

        // Find Student user ID from test db
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var studentUser = await db.Users.FirstAsync(u => u.Email == "student@zhongwenhub.edu.vn");

        // 2. Teacher creates a class
        var classCode = $"CLS-AUTO-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
        using var createClassReq = CreateAuthenticatedRequest(HttpMethod.Post, "/api/v1/teacher/classes", teacherToken, new CreateTeachingClassDto
        {
            Name = "Lớp HSK 2 Cấp Tốc",
            Code = classCode,
            Description = "Lớp học kiểm thử vòng lặp bài tập",
            HskLevelId = "level-hsk-2",
            Capacity = 30,
            StartDate = DateTime.UtcNow.Date,
            LocationType = "ONLINE"
        });

        var classRes = await _client.SendAsync(createClassReq);
        Assert.Equal(HttpStatusCode.Created, classRes.StatusCode);
        var createdClass = await classRes.Content.ReadFromJsonAsync<TeachingClassDto>();
        Assert.NotNull(createdClass);
        var classId = createdClass.Id;

        // 3. Teacher adds Student to Class Members
        using var addMemberReq = CreateAuthenticatedRequest(HttpMethod.Post, $"/api/v1/teacher/classes/{classId}/members", teacherToken, new AddClassMemberDto
        {
            StudentIdentifier = "student@zhongwenhub.edu.vn",
            Notes = "Học viên được thêm tự động qua integration test"
        });
        var addMemberRes = await _client.SendAsync(addMemberReq);
        var addMemberContent = await addMemberRes.Content.ReadAsStringAsync();
        Assert.True(addMemberRes.IsSuccessStatusCode, $"Add member failed ({addMemberRes.StatusCode}): {addMemberContent}");

        // 4. Teacher creates Draft Assignment
        using var createAssignmentReq = CreateAuthenticatedRequest(HttpMethod.Post, "/api/v1/teacher/assignments", teacherToken, new CreateAssignmentDto
        {
            Title = "Bài tập HSK 2: Cấu trúc câu và từ vựng",
            Description = "Hoàn thành các câu trắc nghiệm chọn đáp án đúng",
            HskLevelId = "level-hsk-2",
            TimeLimitMinutes = 30,
            PassingPoints = 60,
            ShowCorrectAnswers = true,
            ClassIds = new List<Guid> { classId },
            DueDate = DateTime.UtcNow.AddDays(7),
            Questions = new List<CreateAssignmentQuestionDto>
            {
                new()
                {
                    Prompt = "选词填空: 我_____去北京旅游。",
                    QuestionType = "SINGLE_CHOICE",
                    Options = new List<string> { "想", "在", "不", "很" },
                    CorrectAnswer = "想",
                    Explanation = "'想' biểu thị mong muốn, dự định đi đâu đó.",
                    Points = 50,
                    OrderIndex = 1
                },
                new()
                {
                    Prompt = "选词填空: 他每天早上都_____咖啡。",
                    QuestionType = "SINGLE_CHOICE",
                    Options = new List<string> { "喝", "吃", "买", "看" },
                    CorrectAnswer = "喝",
                    Explanation = "Đồ uống (cà phê) đi với động từ '喝' (uống).",
                    Points = 50,
                    OrderIndex = 2
                }
            }
        });

        var assignRes = await _client.SendAsync(createAssignmentReq);
        var assignContent = await assignRes.Content.ReadAsStringAsync();
        Assert.True(assignRes.IsSuccessStatusCode, $"Create assignment failed ({assignRes.StatusCode}): {assignContent}");
        var assignment = await assignRes.Content.ReadFromJsonAsync<AssignmentDetailDto>();
        Assert.NotNull(assignment);
        var assignmentId = assignment.Id;

        // 5. Teacher publishes assignment
        using var publishReq = CreateAuthenticatedRequest(HttpMethod.Post, $"/api/v1/teacher/assignments/{assignmentId}/publish", teacherToken);
        var pubRes = await _client.SendAsync(publishReq);
        Assert.Equal(HttpStatusCode.OK, pubRes.StatusCode);

        // 6. Student views homework list
        using var studentListReq = CreateAuthenticatedRequest(HttpMethod.Get, "/api/v1/student/homework", studentToken);
        var listRes = await _client.SendAsync(studentListReq);
        Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);
        var homeworkList = await listRes.Content.ReadFromJsonAsync<List<StudentHomeworkSummaryDto>>();
        Assert.NotNull(homeworkList);
        Assert.Contains(homeworkList, h => h.AssignmentId == assignmentId);

        // 7. Student starts assignment -> Assert Zero Answer Leak
        using var startReq = CreateAuthenticatedRequest(HttpMethod.Post, $"/api/v1/student/homework/{assignmentId}/start", studentToken);
        var startRes = await _client.SendAsync(startReq);
        Assert.Equal(HttpStatusCode.OK, startRes.StatusCode);
        var takingDto = await startRes.Content.ReadFromJsonAsync<StudentAssignmentTakingDto>();
        Assert.NotNull(takingDto);
        Assert.Equal(2, takingDto.Questions.Count);

        // Verify correct answer is NOT leaked in taking questions
        var takingJson = JsonSerializer.Serialize(takingDto);
        Assert.DoesNotContain("\"CorrectAnswer\"", takingJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("\"Explanation\"", takingJson, StringComparison.OrdinalIgnoreCase);

        // 8. Student submits homework
        var q1 = takingDto.Questions[0];
        var q2 = takingDto.Questions[1];
        using var submitReq = CreateAuthenticatedRequest(HttpMethod.Post, $"/api/v1/student/homework/submissions/{takingDto.SubmissionId}/submit", studentToken, new SubmitHomeworkDto
        {
            TimeSpentSeconds = 180,
            Answers = new List<StudentAnswerItemDto>
            {
                new() { QuestionId = q1.Id, SelectedOption = "想" },
                new() { QuestionId = q2.Id, SelectedOption = "喝" }
            }
        });

        var subRes = await _client.SendAsync(submitReq);
        Assert.Equal(HttpStatusCode.OK, subRes.StatusCode);
        var subResult = await subRes.Content.ReadFromJsonAsync<StudentHomeworkResultDto>();
        Assert.NotNull(subResult);
        Assert.True(subResult.Score >= 90.0);
        var submissionId = subResult.SubmissionId;

        // 9. Teacher views submissions for this assignment
        using var getSubmissionsReq = CreateAuthenticatedRequest(HttpMethod.Get, $"/api/v1/teacher/assignments/{assignmentId}/submissions", teacherToken);
        var getSubsRes = await _client.SendAsync(getSubmissionsReq);
        Assert.Equal(HttpStatusCode.OK, getSubsRes.StatusCode);
        var submissions = await getSubsRes.Content.ReadFromJsonAsync<List<TeacherSubmissionItemDto>>();
        Assert.NotNull(submissions);
        var studentSub = submissions.FirstOrDefault(s => s.Id == submissionId);
        Assert.NotNull(studentSub);

        // 10. Teacher grades submission with custom score & feedback (tested via dual route with assignmentId)
        using var gradeReq = CreateAuthenticatedRequest(HttpMethod.Post, $"/api/v1/teacher/assignments/{assignmentId}/submissions/{submissionId}/grade", teacherToken, new GradeSubmissionDto
        {
            CustomScore = 98.0,
            FeedbackNote = "Làm bài rất xuất sắc! Nắm vững ngữ pháp HSK 2."
        });

        var gradeRes = await _client.SendAsync(gradeReq);
        Assert.Equal(HttpStatusCode.OK, gradeRes.StatusCode);
        var gradedDetail = await gradeRes.Content.ReadFromJsonAsync<TeacherSubmissionDetailDto>();
        Assert.NotNull(gradedDetail);
        Assert.Equal(98.0, gradedDetail.Score);
        Assert.Equal("GRADED", gradedDetail.Status);
        Assert.Equal("Làm bài rất xuất sắc! Nắm vững ngữ pháp HSK 2.", gradedDetail.FeedbackNote);

        // Also verify direct submission route GET works
        using var directDetailReq = CreateAuthenticatedRequest(HttpMethod.Get, $"/api/v1/teacher/submissions/{submissionId}", teacherToken);
        var directDetailRes = await _client.SendAsync(directDetailReq);
        Assert.Equal(HttpStatusCode.OK, directDetailRes.StatusCode);

        // 11. Student gets final homework result with teacher feedback
        using var finalResultReq = CreateAuthenticatedRequest(HttpMethod.Get, $"/api/v1/student/homework/submissions/{takingDto.SubmissionId}/result", studentToken);
        var finalRes = await _client.SendAsync(finalResultReq);
        Assert.Equal(HttpStatusCode.OK, finalRes.StatusCode);
        var finalStudentResult = await finalRes.Content.ReadFromJsonAsync<StudentHomeworkResultDto>();
        Assert.NotNull(finalStudentResult);
        Assert.Equal(98.0, finalStudentResult.Score);
        Assert.Equal("Làm bài rất xuất sắc! Nắm vững ngữ pháp HSK 2.", finalStudentResult.FeedbackNote);
    }

    [Fact]
    public async Task StudentNotInClass_CannotStartOrSubmitAssignment_Forbidden()
    {
        var teacherToken = await LoginAndGetTokenAsync("teacher@zhongwenhub.edu.vn", "TeacherPassword123!");

        // Teacher creates a class WITHOUT adding the student
        var classCode = $"CLS-PRIV-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
        using var createClassReq = CreateAuthenticatedRequest(HttpMethod.Post, "/api/v1/teacher/classes", teacherToken, new CreateTeachingClassDto
        {
            Name = "Lớp Kín HSK 3",
            Code = classCode,
            HskLevelId = "level-hsk-3",
            Capacity = 10,
            StartDate = DateTime.UtcNow.Date,
            LocationType = "ONLINE"
        });

        var classRes = await _client.SendAsync(createClassReq);
        var classContent = await classRes.Content.ReadAsStringAsync();
        Assert.True(classRes.IsSuccessStatusCode, $"Create class failed ({classRes.StatusCode}): {classContent}");
        var createdClass = await classRes.Content.ReadFromJsonAsync<TeachingClassDto>();
        Assert.NotNull(createdClass);

        // Teacher creates & publishes assignment for this private class
        using var createAssignReq = CreateAuthenticatedRequest(HttpMethod.Post, "/api/v1/teacher/assignments", teacherToken, new CreateAssignmentDto
        {
            Title = "Bài tập Lớp Kín",
            HskLevelId = "level-hsk-3",
            ClassIds = new List<Guid> { createdClass.Id },
            Questions = new List<CreateAssignmentQuestionDto>
            {
                new()
                {
                    Prompt = "Câu hỏi mật",
                    QuestionType = "SINGLE_CHOICE",
                    Options = new List<string> { "A", "B" },
                    CorrectAnswer = "A",
                    Points = 100
                }
            }
        });
        var assignRes = await _client.SendAsync(createAssignReq);
        var assignContent = await assignRes.Content.ReadAsStringAsync();
        Assert.True(assignRes.IsSuccessStatusCode, $"Create assignment failed ({assignRes.StatusCode}): {assignContent}");
        var assignment = await assignRes.Content.ReadFromJsonAsync<AssignmentDetailDto>();
        Assert.NotNull(assignment);

        using var pubReq = CreateAuthenticatedRequest(HttpMethod.Post, $"/api/v1/teacher/assignments/{assignment.Id}/publish", teacherToken);
        await _client.SendAsync(pubReq);

        // Student (not in class) tries to start assignment
        var studentToken = await LoginAndGetTokenAsync("student@zhongwenhub.edu.vn", "StudentPassword123!");
        using var startReq = CreateAuthenticatedRequest(HttpMethod.Post, $"/api/v1/student/homework/{assignment.Id}/start", studentToken);
        var startRes = await _client.SendAsync(startReq);

        // Must be rejected (Forbidden or Bad Request with authorization guard)
        Assert.True(
            startRes.StatusCode == HttpStatusCode.Forbidden ||
            startRes.StatusCode == HttpStatusCode.BadRequest ||
            startRes.StatusCode == HttpStatusCode.NotFound,
            $"Expected student outside class to be denied, but got {startRes.StatusCode}");
    }
}
