using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using ZhongWenHub.Business.AILearning.DTOs;
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

    private sealed record VettedQuestionItem(
        string Id,
        int HskLevel,
        string SkillCategory,
        string TopicTitle,
        string PromptZh,
        string? PromptPinyin,
        string? PromptVi,
        List<string> Options,
        string CorrectAnswer,
        string ExplanationVi);

    // Curated bank of 24 vetted HSK questions (6 per HSK level 1–4)
    // PromptVi is strictly an instructional directive - NEVER reveals translation or answers.
    private static readonly List<VettedQuestionItem> MasterPool = new()
    {
        // ================= HSK 1 =================
        new("pl-1-voc-01", 1, "vocabulary", "Chào hỏi cơ bản", "你好！", "Nǐ hǎo!", "Chọn nghĩa tiếng Việt tương ứng:",
            new() { "Tạm biệt", "Xin chào", "Cảm ơn", "Không có gì" }, "Xin chào",
            "\"你好\" (Nǐ hǎo) là lời chào thông dụng nhất trong tiếng Trung, có nghĩa là \"Xin chào\"."),

        new("pl-1-voc-02", 1, "vocabulary", "Từ xưng hô", "___是老师。", "___ shì lǎoshī.", "Chọn đại từ nhân xưng thích hợp điền vào chỗ trống:",
            new() { "吃", "喝", "他", "大" }, "他",
            "\"他\" (tā - anh ấy) là đại từ nhân xưng làm chủ ngữ phù hợp với vị ngữ \"是老师\"."),

        new("pl-1-gra-01", 1, "grammar", "Phó từ 也", "我是学生，他___是学生。", "Wǒ shì xuésheng, tā ___ shì xuésheng.", "Chọn phó từ thích hợp điền vào chỗ trống:",
            new() { "很", "不", "也", "都" }, "也",
            "Phó từ \"也\" (yě - cũng) đứng trước động từ để biểu thị sự tương đồng/đồng nhất."),

        new("pl-1-gra-02", 1, "grammar", "Động từ năng nguyện", "我___说汉语。", "Wǒ ___ shuō hànyǔ.", "Chọn trợ động từ biểu thị năng lực:",
            new() { "会", "在", "去", "吃" }, "会",
            "Động từ năng nguyện \"会\" (huì) biểu thị khả năng đạt được thông qua học tập."),

        new("pl-1-rea-01", 1, "reading", "Đọc hiểu câu đơn", "我喝茶，不喝咖啡。", "Wǒ hē chá, bù hē kāfēi.", "Người nói muốn uống gì?",
            new() { "Cà phê", "Trà", "Nước ngọt", "Nước lọc" }, "Trà",
            "Câu nêu rõ \"我喝茶\" (Tôi uống trà), đối lập với \"不喝咖啡\" (Không uống cà phê)."),

        new("pl-1-pin-01", 1, "pinyin", "Thanh điệu và phiên âm", "Chữ \"苹\" (trong 苹果) có phiên âm pinyin chính xác là gì?", null, "Chọn phiên âm chuẩn kèm thanh điệu:",
            new() { "pǐng", "bǐng", "pīng", "píng" }, "píng",
            "Chữ \"苹\" có phiên âm thanh 2 là \"píng\" (trong 苹果 píngguǒ - quả táo)."),

        // ================= HSK 2 =================
        new("pl-2-voc-01", 2, "vocabulary", "Thời tiết", "今天天气很___，我们去公园吧。", "Jīntiān tiānqì hěn ___, wǒmen qù gōngyuán ba.", "Chọn tính từ thích hợp điền vào chỗ trống:",
            new() { "累", "晴", "贵", "忙" }, "晴",
            "\"晴\" (qíng - nắng/trời đẹp) phù hợp nhất với ngữ cảnh rủ bạn đi dạo công viên."),

        new("pl-2-voc-02", 2, "vocabulary", "Động từ chỉ phương hướng", "请进，请___。", "Qǐng jìn, qǐng ___.", "Chọn động từ lịch sự khi đón khách:",
            new() { "走", "坐", "跑", "买" }, "坐",
            "Cụm từ lịch thiệp thông dụng: \"请进，请坐\" (Xin mời vào, xin mời ngồi)."),

        new("pl-2-gra-01", 2, "grammar", "Cấu trúc nhấn mạnh 是...的", "这本书___昨天买的。", "Zhè běn shū ___ zuótiān mǎi de.", "Chọn từ điền vào cấu trúc nhấn mạnh thời gian quá khứ:",
            new() { "在", "是", "有", "让" }, "是",
            "Cấu trúc \"是... của\" dùng để nhấn mạnh thời gian, địa điểm hoặc phương thức của hành vi đã xảy ra."),

        new("pl-2-gra-02", 2, "grammar", "So sánh hơn 比", "他比我___两岁。", "Tā bǐ wǒ ___ liǎng suì.", "Chọn từ chỉ độ tuổi thích hợp:",
            new() { "高", "大", "长", "远" }, "大",
            "Khi so sánh độ tuổi lớn hơn trong khẩu ngữ tiếng Trung dùng \"大\" (lớn/nhiều tuổi hơn)."),

        new("pl-2-rea-01", 2, "reading", "Đọc hiểu câu ghép", "他虽然生病了，但是仍然去上班。", "Tā suīrán shēngbìng le, dànshì réngrán qù shàngbān.", "Theo nội dung câu, anh ấy đã làm gì?",
            new() { "Nghỉ ở nhà dưỡng bệnh", "Vẫn đi làm việc", "Đi bệnh viện khám", "Đi du lịch" }, "Vẫn đi làm việc",
            "Liên từ chuyển ngoặt \"但是仍然去上班\" khẳng định thực tế anh ấy vẫn đến công ty làm việc."),

        new("pl-2-han-01", 2, "hanzi", "Bộ thủ chữ Hán", "Bộ thủ của chữ \"校\" (xiào - trường học) là bộ gì?", null, "Chọn bộ thủ đúng:",
            new() { "Bộ Thảo (艹)", "Bộ Thủy (氵)", "Bộ Mộc (木)", "Bộ Nhân (亻)" }, "Bộ Mộc (木)",
            "Chữ \"校\" có bộ Mộc (木) bên trái, biểu thị nghĩa liên quan đến gỗ/cây cối thời cổ."),

        // ================= HSK 3 =================
        new("pl-3-voc-01", 3, "vocabulary", "Tính từ miêu tả", "请大家保持___，会议马上开始。", "Qǐng dàjiā bǎochí ___, huìyì mǎshàng kāishǐ.", "Chọn từ ghép thích hợp điền vào chỗ trống:",
            new() { "热情", "安静", "满意", "奇怪" }, "安静",
            "\"保持安静\" (bǎochí ānjìng) là cụm từ chuẩn xác mang nghĩa \"giữ yên lặng / trật tự\"."),

        new("pl-3-voc-02", 3, "vocabulary", "Cụm từ cố định", "他对中国历史非常___。", "Tā duì zhōngguó lìshǐ fēicháng ___.", "Chọn cụm biểu thị sự quan tâm, thích thú:",
            new() { "感兴趣", "有意思", "好玩儿", "关系" }, "感兴趣",
            "Cấu trúc \"对...感兴趣\" (duì... gǎn xìngqù) biểu thị sự hứng thú đối với một lĩnh vực."),

        new("pl-3-gra-01", 3, "grammar", "Câu chữ 把", "他把那杯水___了。", "Tā bǎ nà bēi shuǐ ___ le.", "Chọn kết cấu vị ngữ chuẩn cho câu chữ 把:",
            new() { "喝着", "喝完", "喝过", "喝看" }, "喝完",
            "Vị ngữ câu chữ 把 bắt buộc mang thành phần bổ ngữ kết quả, ở đây \"喝完\" (uống hết) là chính xác."),

        new("pl-3-gra-02", 3, "grammar", "Liên từ giả thiết", "___遇到多大困难，我们都要坚持下去。", "___ yùdào duō dà kùnnan, wǒmen dōu yào jiānchí xiàqù.", "Chọn liên từ thích hợp:",
            new() { "即使", "除了", "虽然", "因为" }, "即使",
            "Cặp liên từ nhượng bộ giả thiết chuẩn là \"即使...也/都...\" (Cho dù... cũng...)."),

        new("pl-3-rea-01", 3, "reading", "Đọc hiểu đoạn văn", "只要坚持每天练习，汉语水平就会逐步提高。", "Zhǐyào jiānchí měitiān liànxí, hànyǔ shuǐpíng jiù huì zhúbù tígāo.", "Theo đoạn văn, điều kiện để nâng cao trình độ tiếng Trung là gì?",
            new() { "Chỉ cần học thuộc ngữ pháp", "Cần kiên trì luyện tập mỗi ngày", "Đi du học nước ngoài ngay", "Chỉ xem phim Trung Quốc" }, "Cần kiên trì luyện tập mỗi ngày",
            "Đoạn văn nêu rõ điều kiện đủ: \"只要坚持每天练习\" (Chỉ cần kiên trì luyện tập mỗi ngày)."),

        new("pl-3-lis-01", 3, "listening", "Hội thoại chỉ đường", "问：去火车站怎么走？答：一直往前走，在第二个路口向左拐。", null, "Người hướng dẫn chỉ đường như thế nào?",
            new() { "Rẽ phải ở ngã tư đầu", "Đi thẳng rồi rẽ trái ở ngã rẽ thứ hai", "Quay đầu xe ngay lập tức", "Đi xe buýt số 1" }, "Đi thẳng rồi rẽ trái ở ngã rẽ thứ hai",
            "Chỉ dẫn nêu rõ: \"一直往前走\" (đi thẳng về phía trước), \"第二个路口向左拐\" (rẽ trái ở ngã rẽ thứ hai)."),

        // ================= HSK 4 =================
        new("pl-4-voc-01", 4, "vocabulary", "Từ vựng trừu tượng", "无论面对多大的困难，我们都应该充满___。", "Wúlùn miànduì duō dà de kùnnan, wǒmen dōu yīnggāi chōngmǎn ___.", "Chọn danh từ thích hợp điền vào chỗ trống:",
            new() { "经验", "信心", "消息", "礼貌" }, "信心",
            "Cụm kết hợp từ chuẩn: \"充满信心\" (chōngmǎn xìnxīn - tràn đầy tự tin/lòng tin)."),

        new("pl-4-voc-02", 4, "vocabulary", "Văn phong học thuật", "这篇文章的语言十分___，值得大家学习。", "Zhè piān wénzhāng de yǔyán shífēn ___, zhídé dàjiā xuéxí.", "Chọn tính từ miêu tả bài viết xuất sắc:",
            new() { "流利", "幽默", "精彩", "复杂" }, "精彩",
            "\"精彩\" (jīngcǎi - đặc sắc, xuất sắc) là tính từ đánh giá chất lượng cao của tác phẩm/bài viết."),

        new("pl-4-gra-01", 4, "grammar", "Liên từ tăng tiến", "这个问题不仅引起了专家们的注意，___得到了社会的广泛关注。", "Zhège wèntí bùjǐn yǐnqǐ le zhuānjiāmen de zhùyì, ___ dédào le shèhuì de guǎngfàn guānzhù.", "Chọn liên từ đi liền với \"不仅\":",
            new() { "否则", "而且", "反而", "既然" }, "而且",
            "Cặp liên từ tăng tiến chuẩn HSK 4 là \"不仅...而且...\" (Không những... mà còn...)."),

        new("pl-4-gra-02", 4, "grammar", "Kết hợp từ chuẩn", "随着经济的快速发展，人们的生活水平有了显著的___。", "Suízhe jīngjì de kuàisù fāzhǎn, rénmen de shēnghuó shuǐpíng yǒule xiǎnzhù de ___.", "Chọn danh từ kết hợp chuẩn với '水平':",
            new() { "增加", "提高", "扩大", "发展" }, "提高",
            "Cụm kết hợp cố định trong tiếng Trung là \"水平提高\" (trình độ/mức sống được nâng cao)."),

        new("pl-4-rea-01", 4, "reading", "Nghị luận HSK 4", "成功的关键不仅在于天赋，更在于面对挫折时的毅力与坚持。", "Chénggōng de guānjiàn bùjǐn zàiyú tiānfù, gèng zàiyú miànduì cuòzhé shí de yìlì yǔ jiānchí.", "Yếu tố nào được tác giả nhấn mạnh là then chốt của thành công?",
            new() { "Thiên phú bẩm sinh vượt trội", "Nghị lực và sự kiên trì khi gặp khó khăn", "Sự may mắn và cơ hội ngẫu nhiên", "Tốc độ làm việc nhanh chóng" }, "Nghị lực và sự kiên trì khi gặp khó khăn",
            "Tác giả nhấn mạnh vế sau \"更在于面对挫折时的毅力与坚持\" (quan trọng hơn ở nghị lực và kiên trì khi gặp trắc trở)."),

        new("pl-4-rea-02", 4, "reading", "Ẩn dụ triết lý", "友谊就像一棵树，需要真诚与信任去浇灌，才能枝繁叶茂。", "Yǒuyì jiù xiàng yì kē shù, xūyào zhēnchéng yǔ xìnrèn qù jiāoguàn, cáinéng zhīfányèmào.", "Theo đoạn văn, tình bạn cần điều gì để duy trì bền vững?",
            new() { "Cần nhiều tiền bạc chăm sóc", "Cần sự chân thành và tin tưởng", "Tự nhiên phát triển không cần chăm sóc", "Chỉ tồn tại trong thời gian ngắn" }, "Cần sự chân thành và tin tưởng",
            "Đoạn văn khẳng định điều kiện nuôi dưỡng tình bạn: \"需要真诚与信任去浇灌\" (Cần sự chân thành và tin tưởng tưới tắm).")
    };

    public async Task<DiagnosticSessionStartDto> StartSessionAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        // 1. Pick 3 questions per level (HSK 1 to 4) randomly from the vetted pool
        var selectedQuestions = new List<VettedQuestionItem>();
        for (int level = 1; level <= 4; level++)
        {
            var levelPool = MasterPool.Where(q => q.HskLevel == level).ToList();
            var sampled = levelPool.OrderBy(_ => Random.Shared.Next()).Take(3).ToList();
            selectedQuestions.AddRange(sampled);
        }

        // 2. Shuffle overall question order
        var shuffledQuestions = selectedQuestions.OrderBy(_ => Random.Shared.Next()).ToList();

        // 3. For each question, shuffle its options and compute the new CorrectIndex in this session
        var snapshotItems = new List<SessionQuestionSnapshotItem>();
        var clientQuestionDtos = new List<DiagnosticQuestionDto>();

        foreach (var q in shuffledQuestions)
        {
            var shuffledOptions = q.Options.OrderBy(_ => Random.Shared.Next()).ToList();
            var newCorrectIndex = shuffledOptions.IndexOf(q.CorrectAnswer);

            var snapshot = new SessionQuestionSnapshotItem
            {
                QuestionId = q.Id,
                HskLevel = q.HskLevel,
                SkillCategory = q.SkillCategory,
                TopicTitle = q.TopicTitle,
                PromptZh = q.PromptZh,
                PromptPinyin = q.PromptPinyin,
                PromptVi = q.PromptVi,
                Options = shuffledOptions,
                CorrectIndex = newCorrectIndex,
                ExplanationVi = q.ExplanationVi
            };
            snapshotItems.Add(snapshot);

            // Zero-Answer-Leak DTO for Frontend: strictly no correct answer or explanation
            clientQuestionDtos.Add(new DiagnosticQuestionDto
            {
                Id = q.Id,
                HskLevel = q.HskLevel,
                SkillCategory = q.SkillCategory,
                TopicTitle = q.TopicTitle,
                PromptZh = q.PromptZh,
                PromptPinyin = q.PromptPinyin,
                PromptVi = q.PromptVi,
                Options = shuffledOptions
            });
        }

        // 4. Save session snapshot in DB
        var session = new QuestionBankPracticeSessionEntity
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Mode = "diagnostic",
            Status = "IN_PROGRESS",
            TotalQuestions = clientQuestionDtos.Count,
            ExerciseIdsJson = JsonSerializer.Serialize(snapshotItems),
            StartedAt = DateTime.UtcNow
        };

        _dbContext.QuestionBankPracticeSessions.Add(session);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new DiagnosticSessionStartDto
        {
            SessionId = session.Id,
            AssessmentType = "HSK_PLACEMENT_SCREENING",
            TotalQuestions = clientQuestionDtos.Count,
            MaxDurationMinutes = 60,
            Questions = clientQuestionDtos,
            StartedAt = session.StartedAt
        };
    }

    public async Task<DiagnosticResultDto> SubmitAssessmentAsync(Guid userId, DiagnosticSubmissionDto submission, CancellationToken cancellationToken = default)
    {
        // -------------------------------------------------------------------------
        // STEP 1: VALIDATE ENTIRE PAYLOAD & PARAMETERS BEFORE ANY STATUS CHANGE
        // -------------------------------------------------------------------------
        if (submission == null || submission.SessionId == Guid.Empty)
        {
            throw new ArgumentException("SessionId không hợp lệ.", nameof(submission));
        }

        if (submission.Answers == null || submission.Answers.Count == 0)
        {
            throw new ArgumentException("Danh sách câu trả lời không được để trống.", nameof(submission));
        }

        var questionIdsInSubmission = submission.Answers.Select(a => a.QuestionId).ToList();
        if (questionIdsInSubmission.Count != questionIdsInSubmission.Distinct().Count())
        {
            throw new ArgumentException("Payload chứa câu trả lời bị lặp QuestionId.", nameof(submission));
        }

        // -------------------------------------------------------------------------
        // STEP 2: FETCH SESSION & VERIFY OWNERSHIP, STATUS, TIMEOUT BEFORE TRANSACTION
        // -------------------------------------------------------------------------
        var session = await _dbContext.QuestionBankPracticeSessions
            .FirstOrDefaultAsync(s => s.Id == submission.SessionId, cancellationToken);

        if (session == null)
        {
            throw new KeyNotFoundException("Không tìm thấy phiên làm bài khảo sát định vị.");
        }

        if (session.UserId != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền nộp bài cho phiên khảo sát của người dùng khác.");
        }

        if (session.Status != "IN_PROGRESS")
        {
            throw new InvalidOperationException("Phiên làm bài này đã hoàn thành hoặc không còn ở trạng thái nhận bài.");
        }

        var now = DateTime.UtcNow;

        if (now - session.StartedAt > TimeSpan.FromMinutes(60))
        {
            session.Status = "EXPIRED";
            await _dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Phiên làm bài đã hết thời hạn 60 phút. Vui lòng bắt đầu phiên mới.");
        }

        // -------------------------------------------------------------------------
        // STEP 3: DESERIALIZE & VALIDATE SNAPSHOT INTEGRITY BEFORE ANY STATUS CHANGE
        // -------------------------------------------------------------------------
        List<SessionQuestionSnapshotItem> snapshots;
        try
        {
            snapshots = JsonSerializer.Deserialize<List<SessionQuestionSnapshotItem>>(session.ExerciseIdsJson)
                ?? new List<SessionQuestionSnapshotItem>();
        }
        catch
        {
            throw new InvalidOperationException("Dữ liệu đề thi của phiên bị lỗi hoặc không thể phục hồi.");
        }

        if (snapshots.Count == 0)
        {
            throw new InvalidOperationException("Phiên làm bài không có câu hỏi hợp lệ trong snapshot đề thi.");
        }

        var snapshotMap = snapshots.ToDictionary(s => s.QuestionId);

        // Validate that every submitted question belongs to this session's snapshot
        // and every selected index is within bounds: [-1, Options.Count - 1]
        var userAnswersDict = new Dictionary<string, int>();
        foreach (var answer in submission.Answers)
        {
            if (!snapshotMap.TryGetValue(answer.QuestionId, out var qSnapshot))
            {
                throw new ArgumentException($"Câu hỏi '{answer.QuestionId}' không thuộc phiên kiểm tra này.");
            }

            if (answer.SelectedIndex < -1 || answer.SelectedIndex >= qSnapshot.Options.Count)
            {
                throw new ArgumentException($"Lựa chọn '{answer.SelectedIndex}' không hợp lệ cho câu hỏi '{answer.QuestionId}'.");
            }

            userAnswersDict[answer.QuestionId] = answer.SelectedIndex;
        }

        // -------------------------------------------------------------------------
        // STEP 4: GRADE AND BUILD ATTEMPTS IN-MEMORY
        // -------------------------------------------------------------------------
        var detailedQuestions = new List<DiagnosticQuestionResultDto>();
        var practiceAttempts = new List<StudentPracticeAttempt>();

        int totalCorrect = 0;
        var hskStats = new Dictionary<int, (int Correct, int Total)>
        {
            { 1, (0, 0) }, { 2, (0, 0) }, { 3, (0, 0) }, { 4, (0, 0) }
        };
        var skillStats = new Dictionary<string, (int Correct, int Total)>();

        foreach (var q in snapshots)
        {
            var userIndex = userAnswersDict.TryGetValue(q.QuestionId, out var idx) ? idx : -1;
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
                QuestionId = q.QuestionId,
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

            practiceAttempts.Add(new StudentPracticeAttempt
            {
                UserId = userId,
                ExerciseId = q.QuestionId,
                QuestionId = q.QuestionId,
                Category = q.SkillCategory,
                HskLevel = q.HskLevel,
                TopicTitle = q.TopicTitle,
                KnowledgePointId = q.QuestionId,
                UserAnswer = userIndex >= 0 && userIndex < q.Options.Count ? q.Options[userIndex] : string.Empty,
                IsCorrect = isCorrect,
                AttemptedAt = now
            });
        }

        // Psychometric Screening estimation criteria (requires >= 2/3 on level and lower levels)
        var hsk1Acc = hskStats[1].Total > 0 ? (hskStats[1].Correct * 1.0 / hskStats[1].Total) : 0;
        var hsk2Acc = hskStats[2].Total > 0 ? (hskStats[2].Correct * 1.0 / hskStats[2].Total) : 0;
        var hsk3Acc = hskStats[3].Total > 0 ? (hskStats[3].Correct * 1.0 / hskStats[3].Total) : 0;
        var hsk4Acc = hskStats[4].Total > 0 ? (hskStats[4].Correct * 1.0 / hskStats[4].Total) : 0;

        int estimatedHsk;
        if (hsk4Acc >= 0.66 && hsk3Acc >= 0.66 && hsk2Acc >= 0.66)
        {
            estimatedHsk = 4;
        }
        else if (hsk3Acc >= 0.66 && hsk2Acc >= 0.66 && hsk1Acc >= 0.66)
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

        // Transparent preliminary screening index (honest ~0.45 for 12 screening items)
        var totalQuestions = snapshots.Count;
        var confidence = 0.45;
        var accuracy = Math.Round(totalCorrect * 100.0 / totalQuestions, 1);
        var serializedAnswers = JsonSerializer.Serialize(userAnswersDict);

        // -------------------------------------------------------------------------
        // STEP 5: ATOMIC TRANSACTION: STATUS UPDATE + ATTEMPTS + PROFILE INTEGRITY
        // -------------------------------------------------------------------------
        var isRelational = _dbContext.Database.IsRelational();
        IDbContextTransaction? transaction = null;

        if (isRelational)
        {
            transaction = await _dbContext.Database.BeginTransactionAsync(IsolationLevel.RepeatableRead, cancellationToken);
        }

        try
        {
            if (isRelational)
            {
                // Atomic conditional UPDATE on SQL Server:
                // Only 1 concurrent request can succeed in transitioning IN_PROGRESS -> COMPLETED
                var rowsAffected = await _dbContext.Database.ExecuteSqlInterpolatedAsync(
                    $"UPDATE question_bank_practice_sessions SET Status = 'COMPLETED', HskLevel = {estimatedHsk}, CorrectCount = {totalCorrect}, Accuracy = {accuracy}, TimeSpentSeconds = {submission.TimeSpentSeconds}, AnswersJson = {serializedAnswers}, CompletedAt = {now} WHERE Id = {submission.SessionId} AND UserId = {userId} AND Status = 'IN_PROGRESS'",
                    cancellationToken);

                if (rowsAffected == 0)
                {
                    var refreshed = await _dbContext.QuestionBankPracticeSessions.AsNoTracking()
                        .FirstOrDefaultAsync(s => s.Id == submission.SessionId, cancellationToken);

                    if (refreshed?.Status == "COMPLETED")
                    {
                        throw new InvalidOperationException("Phiên làm bài này đã được nộp và chấm điểm trước đó.");
                    }

                    throw new InvalidOperationException("Không thể hoàn tất nộp bài do phiên đã kết thúc hoặc có xung đột đồng thời.");
                }
            }
            else
            {
                // In-Memory test database fallback
                if (session.Status != "IN_PROGRESS")
                {
                    throw new InvalidOperationException("Phiên làm bài này đã được nộp và chấm điểm trước đó.");
                }

                session.Status = "COMPLETED";
                session.HskLevel = estimatedHsk;
                session.CorrectCount = totalCorrect;
                session.Accuracy = accuracy;
                session.TimeSpentSeconds = submission.TimeSpentSeconds;
                session.AnswersJson = serializedAnswers;
                session.CompletedAt = now;
            }

            // Persist all 12 student practice attempts atomically
            _dbContext.StudentPracticeAttempts.AddRange(practiceAttempts);

            // Update LastActivityDate WITHOUT modifying SelectedHskLevel
            var profile = await _dbContext.StudentLearningProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

            if (profile != null)
            {
                profile.LastActivityDate = now.ToString("yyyy-MM-dd");
            }
            else
            {
                _dbContext.StudentLearningProfiles.Add(new StudentLearningProfile
                {
                    UserId = userId,
                    SelectedHskLevel = 1, // Default goal for new accounts
                    TargetDailyMinutes = 20,
                    StreakDays = 1,
                    LastActivityDate = now.ToString("yyyy-MM-dd")
                });
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            if (transaction != null)
            {
                await transaction.CommitAsync(cancellationToken);
            }
        }
        catch
        {
            if (transaction != null)
            {
                await transaction.RollbackAsync(cancellationToken);
            }
            throw;
        }
        finally
        {
            if (transaction != null)
            {
                await transaction.DisposeAsync();
            }
        }

        // -------------------------------------------------------------------------
        // STEP 6: COMPOSE RESULT DTO WITH HONEST LIMITATIONS DISCLAIMER
        // -------------------------------------------------------------------------
        var skillBreakdown = skillStats.ToDictionary(
            k => k.Key,
            v => v.Value.Total > 0 ? Math.Round(v.Value.Correct * 100.0 / v.Value.Total, 1) : 0.0);

        var hskBreakdown = hskStats.ToDictionary(
            k => k.Key,
            v => v.Value.Total > 0 ? Math.Round(v.Value.Correct * 100.0 / v.Value.Total, 1) : 0.0);

        var summary = $"Ước tính sơ bộ: Trình độ gợi ý là HSK {estimatedHsk} (Đúng {totalCorrect}/{totalQuestions} câu, độ chính xác {accuracy}%). Mục tiêu học tập bạn tự chọn vẫn được bảo toàn nguyên vẹn.";
        var limitations = $"Kết quả là ước tính sàng lọc sơ bộ dựa trên {totalQuestions} câu hỏi trắc nghiệm (3 câu cho mỗi cấp HSK 1–4). Do số lượng câu hỏi ít và mang tính định hướng ban đầu, chỉ số tin cậy chỉ đạt mức sơ bộ (~{Math.Round(confidence * 100)}%). Đây không phải chứng chỉ HSK hay kết quả đánh giá năng lực toàn diện đã kiểm chứng chuẩn hóa. Để xác định chính xác trình độ và điểm mạnh/yếu, học viên cần tiếp tục luyện tập chuyên sâu các kỹ năng Nghe, Nói, Đọc, Viết trong lộ trình học.";

        return new DiagnosticResultDto
        {
            SessionId = session.Id,
            AssessmentType = "HSK_PLACEMENT_SCREENING",
            EstimatedHskLevel = estimatedHsk,
            ConfidenceScore = confidence,
            TotalQuestions = totalQuestions,
            CorrectCount = totalCorrect,
            AccuracyPercent = accuracy,
            TimeSpentSeconds = submission.TimeSpentSeconds,
            AssessmentSummaryVi = summary,
            AssessmentLimitationsVi = limitations,
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

        if (latestSession == null || string.IsNullOrWhiteSpace(latestSession.AnswersJson) || string.IsNullOrWhiteSpace(latestSession.ExerciseIdsJson))
        {
            return null;
        }

        var userAnswersDict = JsonSerializer.Deserialize<Dictionary<string, int>>(latestSession.AnswersJson)
            ?? new Dictionary<string, int>();

        var snapshots = JsonSerializer.Deserialize<List<SessionQuestionSnapshotItem>>(latestSession.ExerciseIdsJson)
            ?? new List<SessionQuestionSnapshotItem>();

        if (snapshots.Count == 0) return null;

        int totalCorrect = 0;
        var detailedQuestions = new List<DiagnosticQuestionResultDto>();
        var hskStats = new Dictionary<int, (int Correct, int Total)>
        {
            { 1, (0, 0) }, { 2, (0, 0) }, { 3, (0, 0) }, { 4, (0, 0) }
        };
        var skillStats = new Dictionary<string, (int Correct, int Total)>();

        foreach (var q in snapshots)
        {
            var userIndex = userAnswersDict.TryGetValue(q.QuestionId, out var idx) ? idx : -1;
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
                QuestionId = q.QuestionId,
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

        var estimatedHsk = latestSession.HskLevel ?? 1;
        var totalQuestions = snapshots.Count;
        var confidence = 0.45;
        var accuracy = latestSession.Accuracy > 0 ? latestSession.Accuracy : Math.Round(totalCorrect * 100.0 / totalQuestions, 1);

        var skillBreakdown = skillStats.ToDictionary(
            k => k.Key,
            v => v.Value.Total > 0 ? Math.Round(v.Value.Correct * 100.0 / v.Value.Total, 1) : 0.0);

        var hskBreakdown = hskStats.ToDictionary(
            k => k.Key,
            v => v.Value.Total > 0 ? Math.Round(v.Value.Correct * 100.0 / v.Value.Total, 1) : 0.0);

        var summary = $"Ước tính sơ bộ: Trình độ gợi ý là HSK {estimatedHsk} (Đúng {totalCorrect}/{totalQuestions} câu, độ chính xác {accuracy}%). Mục tiêu học tập bạn tự chọn vẫn được bảo toàn nguyên vẹn.";
        var limitations = $"Kết quả là ước tính sàng lọc sơ bộ dựa trên {totalQuestions} câu hỏi trắc nghiệm (3 câu cho mỗi cấp HSK 1–4). Do số lượng câu hỏi ít và mang tính định hướng ban đầu, chỉ số tin cậy chỉ đạt mức sơ bộ (~{Math.Round(confidence * 100)}%).";

        return new DiagnosticResultDto
        {
            SessionId = latestSession.Id,
            AssessmentType = "HSK_PLACEMENT_SCREENING",
            EstimatedHskLevel = estimatedHsk,
            ConfidenceScore = confidence,
            TotalQuestions = totalQuestions,
            CorrectCount = totalCorrect,
            AccuracyPercent = accuracy,
            TimeSpentSeconds = latestSession.TimeSpentSeconds,
            AssessmentSummaryVi = summary,
            AssessmentLimitationsVi = limitations,
            SkillAccuracyPercent = skillBreakdown,
            HskLevelAccuracyPercent = hskBreakdown,
            DetailedQuestions = detailedQuestions,
            CompletedAt = latestSession.CompletedAt ?? DateTime.UtcNow
        };
    }

    public async Task<bool> ApplyConfirmedTargetHskAsync(Guid userId, int confirmedHskLevel, CancellationToken cancellationToken = default)
    {
        if (confirmedHskLevel < 1 || confirmedHskLevel > 6)
        {
            throw new ArgumentOutOfRangeException(nameof(confirmedHskLevel), "Cấp độ HSK mục tiêu phải từ 1 đến 6.");
        }

        var profile = await _dbContext.StudentLearningProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        if (profile == null)
        {
            profile = new StudentLearningProfile
            {
                UserId = userId,
                SelectedHskLevel = confirmedHskLevel,
                LastActivityDate = today
            };
            _dbContext.StudentLearningProfiles.Add(profile);
        }
        else
        {
            profile.SelectedHskLevel = confirmedHskLevel;
            profile.LastActivityDate = today;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
