using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AILearning.Services.Competency;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Entities.Learning;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.AILearning.Services.Diagnostic;

public sealed class DiagnosticAssessmentService : IDiagnosticAssessmentService
{
    private readonly ApplicationDbContext _dbContext;

    public DiagnosticAssessmentService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private sealed record InternalDiagnosticQuestion(
        string Id,
        int HskLevel,
        string SkillCategory,
        string TopicTitle,
        string PromptZh,
        string? PromptPinyin,
        string? PromptVi,
        List<string> Options,
        int CorrectIndex,
        string ExplanationVi);

    // Standard curated 12-question adaptive HSK diagnostic pool
    private static readonly List<InternalDiagnosticQuestion> DiagnosticPool = new()
    {
        // HSK 1
        new("diag-1-01", 1, "vocabulary", "Chào hỏi cơ bản", "你好！", "Nǐ hǎo!", "Xin chào!",
            new() { "Xin chào", "Tạm biệt", "Cảm ơn", "Xin lỗi" }, 0,
            "\"你好\" (Nǐ hǎo) là lời chào thông dụng nhất trong tiếng Trung, tương đương \"Xin chào\"."),

        new("diag-1-02", 1, "grammar", "Phó từ 也", "我是老师，他___是老师。", "Wǒ shì lǎoshī, tā ___ shì lǎoshī.", "Tôi là giáo viên, anh ấy ___ là giáo viên.",
            new() { "也", "不", "很", "都" }, 0,
            "Phó từ \"也\" (yě - cũng) đứng trước động từ để biểu thị sự đồng nhất."),

        new("diag-1-03", 1, "reading", "Đọc hiểu câu đơn", "我喝茶，不喝咖啡。", "Wǒ hē chá, bù hē kāfēi.", "Tôi uống trà, không uống cà phê.",
            new() { "Trà", "Cà phê", "Nước ngọt", "Nước lọc" }, 0,
            "Câu nêu rõ \"我喝茶\" (Tôi uống trà), \"不喝咖啡\" (Không uống cà phê)."),

        // HSK 2
        new("diag-2-01", 2, "vocabulary", "Từ vựng thời tiết", "今天天气很___，我们去公园吧。", "Jīntiān tiānqì hěn ___, wǒmen qù gōngyuán ba.", "Thời tiết hôm nay rất ___, chúng ta đi công viên nhé.",
            new() { "晴", "累", "贵", "忙" }, 0,
            "\"晴\" (qíng - nắng/đẹp trời) phù hợp nhất với ngữ cảnh rủ đi công viên."),

        new("diag-2-02", 2, "grammar", "Cấu trúc 是...的", "这本书___昨天买的。", "Zhè běn shū ___ zuótiān mǎi de.", "Cuốn sách này ___ mua hôm qua.",
            new() { "是", "在", "有", "让" }, 0,
            "Cấu trúc nhấn mạnh thời gian/địa điểm/phương thức trong quá khứ dùng \"是...的\"."),

        new("diag-2-03", 2, "reading", "Liên từ 虽然...但是", "他虽然生病了，但是仍然去上班。", "Tā suīrán shēngbìng le, dànshì réngrán qù shàngbān.", "Anh ấy tuy bị ốm, nhưng vẫn đi làm.",
            new() { "Có đi làm", "Nghỉ ở nhà", "Đi bệnh viện", "Đi du lịch" }, 0,
            "Liên từ \"但是仍然去上班\" biểu thị hành động thực tế là anh ấy vẫn đi làm."),

        // HSK 3
        new("diag-3-01", 3, "vocabulary", "Tính từ miêu tả", "请大家保持___，会议马上开始。", "Qǐng dàjiā bǎochí ___, huìyì mǎshàng kāishǐ.", "Xin mọi người giữ ___, cuộc họp sắp bắt đầu.",
            new() { "安静", "热情", "满意", "奇怪" }, 0,
            "\"保持安静\" (bǎochí ānjìng) là cụm từ cố định mang nghĩa \"giữ yên lặng / giữ trật tự\"."),

        new("diag-3-02", 3, "grammar", "Câu chữ 把", "他把那杯水___了。", "Tā bǎ nà bēi shuǐ ___ le.", "Anh ấy đã ___ cốc nước đó rồi.",
            new() { "喝完", "喝着", "喝过", "喝看" }, 0,
            "Trong câu chữ 把, vị ngữ cần mang thành phần bổ ngữ kết quả, ở đây \"喝完\" (uống hết) là chuẩn xác."),

        new("diag-3-03", 3, "reading", "Cấu trúc 只要...就", "只要坚持每天练习，汉语水平就会逐步提高。", "Zhǐyào jiānchí měitiān liànxí, hànyǔ shuǐpíng jiù huì zhúbù tígāo.", "Chỉ cần kiên trì luyện tập mỗi ngày, trình độ tiếng Trung sẽ dần nâng cao.",
            new() { "Kiên trì luyện tập mỗi ngày", "Học thật nhiều ngữ pháp khó", "Đi du học ngay", "Chỉ nghe nhạc" }, 0,
            "Đoạn văn nêu rõ điều kiện đủ: \"只要坚持每天练习\" (Chỉ cần kiên trì luyện tập mỗi ngày)."),

        // HSK 4
        new("diag-4-01", 4, "vocabulary", "Từ vựng trừu tượng", "无论面对多大的困难，我们都应该充满___。", "Wúlùn miànduì duō dà de kùnnan, wǒmen dōu yīnggāi chōngmǎn ___.", "Bất luận đối mặt khó khăn lớn thế nào, chúng ta đều nên tràn đầy ___.",
            new() { "信心", "经验", "消息", "礼貌" }, 0,
            "\"充满信心\" (chōngmǎn xìnxīn) nghĩa là \"tràn đầy tự tin/lòng tin\", phù hợp nhất với việc vượt qua khó khăn."),

        new("diag-4-02", 4, "grammar", "Liên từ 不仅...而且", "这个问题不仅引起了专家们的注意，___得到了社会的广泛关注。", "Zhège wèntí bùjǐn yǐnqǐ le zhuānjiāmen de zhùyì, ___ dédào le shèhuì de guǎngfàn guānzhù.", "Vấn đề này không chỉ thu hút sự chú ý của chuyên gia, ___ nhận được sự quan tâm rộng rãi của xã hội.",
            new() { "而且", "否则", "反而", "既然" }, 0,
            "Cặp liên từ tăng tiến chuẩn HSK 4 là \"不仅...而且...\" (không những... mà còn...)."),

        new("diag-4-03", 4, "reading", "Nghị luận HSK 4", "成功的关键不仅在于天赋，更在于面对挫折时的毅力与坚持。", "Chénggōng de guānjiàn bùjǐn zàiyú tiānfù, gèng zàiyú miànduì cuòzhé shí de yìlì yǔ jiānchí.", "Mấu chốt của thành công không chỉ ở thiên phú, mà càng ở nghị lực và sự kiên trì khi đối mặt nghịch cảnh.",
            new() { "Sự kiên trì khi gặp trắc trở", "Thiên phú bẩm sinh", "Sự may mắn ngẫu nhiên", "Tốc độ hoàn thành" }, 0,
            "Tác giả nhấn mạnh vế sau \"更在于面对挫折时的毅力与坚持\" (quan trọng hơn ở sự kiên trì đối mặt trắc trở).")
    };

    public async Task<DiagnosticSessionStartDto> StartSessionAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var session = new QuestionBankPracticeSessionEntity
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Mode = "diagnostic",
            Status = "IN_PROGRESS",
            TotalQuestions = DiagnosticPool.Count,
            ExerciseIdsJson = JsonSerializer.Serialize(DiagnosticPool.Select(q => q.Id).ToList()),
            StartedAt = DateTime.UtcNow
        };

        _dbContext.QuestionBankPracticeSessions.Add(session);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Map to DTO strictly without answers or explanations (Zero answer leak)
        var questionDtos = DiagnosticPool.Select(q => new DiagnosticQuestionDto
        {
            Id = q.Id,
            HskLevel = q.HskLevel,
            SkillCategory = q.SkillCategory,
            TopicTitle = q.TopicTitle,
            PromptZh = q.PromptZh,
            PromptPinyin = q.PromptPinyin,
            PromptVi = q.PromptVi,
            Options = q.Options.ToList()
        }).ToList();

        return new DiagnosticSessionStartDto
        {
            SessionId = session.Id,
            TotalQuestions = questionDtos.Count,
            Questions = questionDtos,
            StartedAt = session.StartedAt
        };
    }

    public async Task<DiagnosticResultDto> SubmitAssessmentAsync(Guid userId, DiagnosticSubmissionDto submission, CancellationToken cancellationToken = default)
    {
        var session = await _dbContext.QuestionBankPracticeSessions
            .FirstOrDefaultAsync(s => s.Id == submission.SessionId && s.UserId == userId, cancellationToken);

        if (session == null)
        {
            throw new KeyNotFoundException("Không tìm thấy phiên làm bài khảo sát định vị.");
        }

        // Anti-duplicate submission check
        if (session.Status == "COMPLETED")
        {
            throw new InvalidOperationException("Phiên làm bài này đã được nộp và chấm điểm trước đó.");
        }

        var detailedQuestions = new List<DiagnosticQuestionResultDto>();
        var userAnswersDict = submission.Answers.ToDictionary(a => a.QuestionId, a => a.SelectedIndex);
        var practiceAttempts = new List<StudentPracticeAttempt>();

        int totalCorrect = 0;
        var now = DateTime.UtcNow;

        var hskStats = new Dictionary<int, (int Correct, int Total)>
        {
            { 1, (0, 0) },
            { 2, (0, 0) },
            { 3, (0, 0) },
            { 4, (0, 0) }
        };

        var skillStats = new Dictionary<string, (int Correct, int Total)>();

        foreach (var q in DiagnosticPool)
        {
            var userIndex = userAnswersDict.TryGetValue(q.Id, out var idx) ? idx : -1;
            var isCorrect = userIndex == q.CorrectIndex;

            if (isCorrect) totalCorrect++;

            // Tally HSK stats
            if (!hskStats.ContainsKey(q.HskLevel)) hskStats[q.HskLevel] = (0, 0);
            var (c, t) = hskStats[q.HskLevel];
            hskStats[q.HskLevel] = (c + (isCorrect ? 1 : 0), t + 1);

            // Tally Skill stats
            if (!skillStats.ContainsKey(q.SkillCategory)) skillStats[q.SkillCategory] = (0, 0);
            var (sc, st) = skillStats[q.SkillCategory];
            skillStats[q.SkillCategory] = (sc + (isCorrect ? 1 : 0), st + 1);

            detailedQuestions.Add(new DiagnosticQuestionResultDto
            {
                QuestionId = q.Id,
                HskLevel = q.HskLevel,
                SkillCategory = q.SkillCategory,
                TopicTitle = q.TopicTitle,
                PromptZh = q.PromptZh,
                Options = q.Options.ToList(),
                UserSelectedIndex = userIndex,
                CorrectIndex = q.CorrectIndex,
                IsCorrect = isCorrect,
                ExplanationVi = q.ExplanationVi
            });

            // Persist as verified student practice attempt to immediately calibrate BKT profile
            practiceAttempts.Add(new StudentPracticeAttempt
            {
                UserId = userId,
                ExerciseId = q.Id,
                QuestionId = q.Id,
                Category = q.SkillCategory,
                HskLevel = q.HskLevel,
                TopicTitle = q.TopicTitle,
                KnowledgePointId = q.Id,
                UserAnswer = userIndex >= 0 && userIndex < q.Options.Count ? q.Options[userIndex] : string.Empty,
                IsCorrect = isCorrect,
                AttemptedAt = now
            });
        }

        // Psychometric HSK level estimation logic
        var estimatedHsk = 1;
        var hsk1Acc = hskStats[1].Total > 0 ? (hskStats[1].Correct * 1.0 / hskStats[1].Total) : 0;
        var hsk2Acc = hskStats[2].Total > 0 ? (hskStats[2].Correct * 1.0 / hskStats[2].Total) : 0;
        var hsk3Acc = hskStats[3].Total > 0 ? (hskStats[3].Correct * 1.0 / hskStats[3].Total) : 0;
        var hsk4Acc = hskStats[4].Total > 0 ? (hskStats[4].Correct * 1.0 / hskStats[4].Total) : 0;

        if (hsk4Acc >= 0.66 && hsk3Acc >= 0.66)
        {
            estimatedHsk = 4;
        }
        else if (hsk3Acc >= 0.66 && hsk2Acc >= 0.66)
        {
            estimatedHsk = 3;
        }
        else if (hsk2Acc >= 0.66 && hsk1Acc >= 0.66)
        {
            estimatedHsk = 2;
        }
        else
        {
            estimatedHsk = 1;
        }

        var confidence = BktAlgorithm.ComputeConfidence(DiagnosticPool.Count, confidenceHalfCount: 8.0);
        var accuracy = Math.Round(totalCorrect * 100.0 / DiagnosticPool.Count, 1);

        // Update session in database
        session.Status = "COMPLETED";
        session.CorrectCount = totalCorrect;
        session.Accuracy = accuracy;
        session.TimeSpentSeconds = submission.TimeSpentSeconds;
        session.AnswersJson = JsonSerializer.Serialize(userAnswersDict);
        session.CompletedAt = now;

        // Persist practice attempts into SQL Server
        _dbContext.StudentPracticeAttempts.AddRange(practiceAttempts);

        // Update student learning profile with evaluated HSK level
        var profile = await _dbContext.StudentLearningProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (profile != null)
        {
            profile.SelectedHskLevel = estimatedHsk;
            profile.LastActivityDate = now.ToString("yyyy-MM-dd");
        }
        else
        {
            _dbContext.StudentLearningProfiles.Add(new StudentLearningProfile
            {
                UserId = userId,
                SelectedHskLevel = estimatedHsk,
                TargetDailyMinutes = 20,
                StreakDays = 1,
                LastActivityDate = now.ToString("yyyy-MM-dd")
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var skillBreakdown = skillStats.ToDictionary(
            k => k.Key,
            v => v.Value.Total > 0 ? Math.Round(v.Value.Correct * 100.0 / v.Value.Total, 1) : 0.0);

        var hskBreakdown = hskStats.ToDictionary(
            k => k.Key,
            v => v.Value.Total > 0 ? Math.Round(v.Value.Correct * 100.0 / v.Value.Total, 1) : 0.0);

        var summary = $"Định vị thành công: Trình độ khuyến nghị là HSK {estimatedHsk} với độ tin cậy {Math.Round(confidence * 100)}% (Đúng {totalCorrect}/{DiagnosticPool.Count} câu, độ chính xác {accuracy}%).";

        return new DiagnosticResultDto
        {
            SessionId = session.Id,
            EstimatedHskLevel = estimatedHsk,
            ConfidenceScore = confidence,
            TotalQuestions = DiagnosticPool.Count,
            CorrectCount = totalCorrect,
            AccuracyPercent = accuracy,
            TimeSpentSeconds = submission.TimeSpentSeconds,
            AssessmentSummaryVi = summary,
            SkillAccuracyPercent = skillBreakdown,
            HskLevelAccuracyPercent = hskBreakdown,
            DetailedQuestions = detailedQuestions,
            CompletedAt = now
        };
    }

    public async Task<DiagnosticResultDto?> GetLatestResultAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var latestSession = await _dbContext.QuestionBankPracticeSessions
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.Mode == "diagnostic" && s.Status == "COMPLETED")
            .OrderByDescending(s => s.CompletedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (latestSession == null || string.IsNullOrWhiteSpace(latestSession.AnswersJson))
        {
            return null;
        }

        var userAnswersDict = JsonSerializer.Deserialize<Dictionary<string, int>>(latestSession.AnswersJson)
            ?? new Dictionary<string, int>();

        int totalCorrect = 0;
        var detailedQuestions = new List<DiagnosticQuestionResultDto>();
        var hskStats = new Dictionary<int, (int Correct, int Total)>
        {
            { 1, (0, 0) }, { 2, (0, 0) }, { 3, (0, 0) }, { 4, (0, 0) }
        };
        var skillStats = new Dictionary<string, (int Correct, int Total)>();

        foreach (var q in DiagnosticPool)
        {
            var userIndex = userAnswersDict.TryGetValue(q.Id, out var idx) ? idx : -1;
            var isCorrect = userIndex == q.CorrectIndex;
            if (isCorrect) totalCorrect++;

            if (!hskStats.ContainsKey(q.HskLevel)) hskStats[q.HskLevel] = (0, 0);
            var (c, t) = hskStats[q.HskLevel];
            hskStats[q.HskLevel] = (c + (isCorrect ? 1 : 0), t + 1);

            if (!skillStats.ContainsKey(q.SkillCategory)) skillStats[q.SkillCategory] = (0, 0);
            var (sc, st) = skillStats[q.SkillCategory];
            skillStats[q.SkillCategory] = (sc + (isCorrect ? 1 : 0), st + 1);

            detailedQuestions.Add(new DiagnosticQuestionResultDto
            {
                QuestionId = q.Id,
                HskLevel = q.HskLevel,
                SkillCategory = q.SkillCategory,
                TopicTitle = q.TopicTitle,
                PromptZh = q.PromptZh,
                Options = q.Options.ToList(),
                UserSelectedIndex = userIndex,
                CorrectIndex = q.CorrectIndex,
                IsCorrect = isCorrect,
                ExplanationVi = q.ExplanationVi
            });
        }

        var hsk1Acc = hskStats[1].Total > 0 ? (hskStats[1].Correct * 1.0 / hskStats[1].Total) : 0;
        var hsk2Acc = hskStats[2].Total > 0 ? (hskStats[2].Correct * 1.0 / hskStats[2].Total) : 0;
        var hsk3Acc = hskStats[3].Total > 0 ? (hskStats[3].Correct * 1.0 / hskStats[3].Total) : 0;
        var hsk4Acc = hskStats[4].Total > 0 ? (hskStats[4].Correct * 1.0 / hskStats[4].Total) : 0;

        var estimatedHsk = 1;
        if (hsk4Acc >= 0.66 && hsk3Acc >= 0.66) estimatedHsk = 4;
        else if (hsk3Acc >= 0.66 && hsk2Acc >= 0.66) estimatedHsk = 3;
        else if (hsk2Acc >= 0.66 && hsk1Acc >= 0.66) estimatedHsk = 2;

        var confidence = BktAlgorithm.ComputeConfidence(DiagnosticPool.Count, confidenceHalfCount: 8.0);
        var accuracy = Math.Round(totalCorrect * 100.0 / DiagnosticPool.Count, 1);

        return new DiagnosticResultDto
        {
            SessionId = latestSession.Id,
            EstimatedHskLevel = estimatedHsk,
            ConfidenceScore = confidence,
            TotalQuestions = DiagnosticPool.Count,
            CorrectCount = totalCorrect,
            AccuracyPercent = accuracy,
            TimeSpentSeconds = latestSession.TimeSpentSeconds,
            AssessmentSummaryVi = $"Định vị: Trình độ khuyến nghị là HSK {estimatedHsk} với độ tin cậy {Math.Round(confidence * 100)}%.",
            SkillAccuracyPercent = skillStats.ToDictionary(k => k.Key, v => v.Value.Total > 0 ? Math.Round(v.Value.Correct * 100.0 / v.Value.Total, 1) : 0.0),
            HskLevelAccuracyPercent = hskStats.ToDictionary(k => k.Key, v => v.Value.Total > 0 ? Math.Round(v.Value.Correct * 100.0 / v.Value.Total, 1) : 0.0),
            DetailedQuestions = detailedQuestions,
            CompletedAt = latestSession.CompletedAt ?? latestSession.StartedAt
        };
    }
}
