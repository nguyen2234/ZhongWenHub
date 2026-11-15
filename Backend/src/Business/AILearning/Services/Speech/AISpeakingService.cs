using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Data.Entities.AI;
using ZhongWenHub.Data.Entities.Learning;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.AILearning.Services.Speech;

public sealed class AISpeakingService : IAISpeakingService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly ApplicationDbContext _dbContext;
    private readonly ISpeechRecognitionService _sttService;
    private readonly IAIPronunciationService _pronunciationService;
    private readonly ILogger<AISpeakingService> _logger;

    public AISpeakingService(
        ApplicationDbContext dbContext,
        ISpeechRecognitionService sttService,
        IAIPronunciationService pronunciationService,
        ILogger<AISpeakingService> logger)
    {
        _dbContext = dbContext;
        _sttService = sttService;
        _pronunciationService = pronunciationService;
        _logger = logger;
    }

    public async Task<List<SpeakingPracticeItemDto>> GetPracticeItemsAsync(
        int hskLevel,
        string practiceType,
        CancellationToken cancellationToken = default)
    {
        var targetHsk = Math.Clamp(hskLevel, 1, 6);
        var normType = practiceType?.Trim().ToUpperInvariant() switch
        {
            "SENTENCE" => "SENTENCE",
            "SCENARIO" => "SCENARIO",
            _ => "WORD"
        };

        if (normType == "WORD")
        {
            var words = await _dbContext.Vocabularies
                .AsNoTracking()
                .Where(v => v.HskLevel == targetHsk && v.Status == "PUBLISHED")
                .OrderBy(v => v.Pinyin)
                .Take(25)
                .ToListAsync(cancellationToken);

            return words.Select(w => new SpeakingPracticeItemDto
            {
                Id = w.Id.ToString(),
                PracticeType = "WORD",
                HskLevel = w.HskLevel,
                TargetTextZh = w.Hanzi,
                TargetPinyin = w.Pinyin,
                MeaningVi = w.MeaningVi,
                AudioSampleUrl = w.AudioUrl,
                ContextScenario = w.ExamplesJson,
                CulturalNoteVi = w.PartOfSpeech
            }).ToList();
        }

        if (normType == "SENTENCE")
        {
            // Core sentences suitable for HSK levels
            var sentences = GetCuratedHskSentences(targetHsk);
            return sentences;
        }

        // SCENARIO
        return GetCuratedSituationalPrompts(targetHsk);
    }

    public async Task<SpeakingAssessmentResultDto> SubmitPracticeAsync(
        Guid userId,
        SubmitSpeakingPracticeDto request,
        Stream? audioStream,
        string? contentType,
        CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw AITutorException.BadRequest("Dữ liệu nộp bài phát âm không hợp lệ.");
        }

        if (string.IsNullOrWhiteSpace(request.TargetTextZh))
        {
            throw AITutorException.BadRequest("Nội dung câu hoặc từ chuẩn không được để trống.");
        }

        var practiceType = request.PracticeType?.Trim().ToUpperInvariant() switch
        {
            "SENTENCE" => "SENTENCE",
            "SCENARIO" => "SCENARIO",
            _ => "WORD"
        };

        var targetHsk = Math.Clamp(request.HskLevel, 1, 6);
        string recognizedText;
        var sttProvider = _sttService.ProviderName;
        var isSttAvailable = _sttService.IsAvailable;

        if (audioStream != null && audioStream.Length > 0)
        {
            var sttResult = await _sttService.RecognizeSpeechAsync(
                audioStream,
                contentType ?? "audio/webm",
                "zh-CN",
                cancellationToken);

            if (!sttResult.IsSuccess)
            {
                // Never invent fake transcript when STT fails or is unconfigured
                if (sttResult.ErrorCode == "STT_UNAVAILABLE")
                {
                    return new SpeakingAssessmentResultDto
                    {
                        AttemptId = Guid.Empty,
                        PracticeType = practiceType,
                        HskLevel = targetHsk,
                        TargetTextZh = request.TargetTextZh,
                        TargetPinyin = request.TargetPinyin,
                        RecognizedTranscriptZh = string.Empty,
                        TranscriptAccuracyPercent = 0.0,
                        OverallPronunciationScore = 0.0,
                        AssessmentMethod = "TRANSCRIPT_ALIGNMENT",
                        HasAcousticToneData = false,
                        ToneAssessmentNote = "Dịch vụ nhận diện giọng nói (STT Provider) chưa sẵn sàng trên hệ thống.",
                        EvaluationFeedbackVi = "Dịch vụ nhận diện âm thanh chưa được kích hoạt hoặc chưa sẵn sàng. Bạn có thể nhập văn bản trực tiếp để thử nghiệm luồng đánh giá.",
                        WordBreakdown = new List<WordAlignmentDetailDto>(),
                        SttProvider = "None",
                        IsSttAvailable = false,
                        AttemptedAt = DateTime.UtcNow
                    };
                }

                throw AITutorException.BadRequest(sttResult.ErrorMessage ?? "Không thể nhận diện âm thanh. Vui lòng thử lại.");
            }

            recognizedText = sttResult.RecognizedText;
            sttProvider = sttResult.Provider;
        }
        else if (!string.IsNullOrWhiteSpace(request.DirectText))
        {
            // Direct text simulation / fallback flow
            recognizedText = request.DirectText.Trim();
            sttProvider = "DirectTextInput";
        }
        else
        {
            throw AITutorException.BadRequest("Vui lòng gửi tệp âm thanh ghi âm hoặc nhập văn bản trực tiếp.");
        }

        // Evaluate pronunciation via character alignment
        var evaluation = _pronunciationService.EvaluatePronunciation(
            request.TargetTextZh,
            request.TargetPinyin,
            request.TargetMeaningVi,
            recognizedText,
            targetHsk,
            practiceType,
            sttProvider,
            isSttAvailable);

        var now = DateTime.UtcNow;

        // Save AiSpeakingAttempt entity
        var attemptEntity = new AiSpeakingAttempt
        {
            UserId = userId,
            PracticeType = practiceType,
            HskLevel = targetHsk,
            TargetTextZh = request.TargetTextZh.Trim(),
            TargetPinyin = request.TargetPinyin?.Trim(),
            TargetMeaningVi = request.TargetMeaningVi?.Trim(),
            RecognizedTranscriptZh = recognizedText,
            TranscriptAccuracyPercent = evaluation.TranscriptAccuracyPercent,
            OverallPronunciationScore = evaluation.OverallPronunciationScore,
            AssessmentMethod = evaluation.AssessmentMethod,
            HasAcousticToneData = false,
            EvaluationFeedbackVi = evaluation.EvaluationFeedbackVi,
            WordBreakdownJson = JsonSerializer.Serialize(evaluation.WordBreakdown, JsonOptions),
            DurationSeconds = request.AudioDurationSeconds,
            AudioStorageStatus = "PROCESSED_DISCARDED", // Discard raw audio immediately
            AttemptedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.AiSpeakingAttempts.Add(attemptEntity);

        // Connect speaking results with StudentPracticeAttempts (SkillCategory = "speaking")
        var isPassed = evaluation.TranscriptAccuracyPercent >= 70.0;
        var practiceAttempt = new StudentPracticeAttempt
        {
            UserId = userId,
            ExerciseId = attemptEntity.Id.ToString(),
            QuestionId = null,
            KnowledgePointId = $"speaking_{practiceType.ToLowerInvariant()}_hsk{targetHsk}",
            TopicTitle = $"Luyện nói {practiceType} HSK {targetHsk}: {request.TargetTextZh.Trim()}",
            Category = "speaking",
            HskLevel = targetHsk,
            UserAnswer = recognizedText,
            IsCorrect = isPassed,
            AttemptedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.StudentPracticeAttempts.Add(practiceAttempt);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return evaluation with { AttemptId = attemptEntity.Id };
    }

    public async Task<List<SpeakingAssessmentResultDto>> GetHistoryAsync(
        Guid userId,
        int limit = 20,
        CancellationToken cancellationToken = default)
    {
        var safeLimit = Math.Clamp(limit, 1, 50);
        var attempts = await _dbContext.AiSpeakingAttempts
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.AttemptedAt)
            .Take(safeLimit)
            .ToListAsync(cancellationToken);

        return attempts.Select(a =>
        {
            var breakdown = !string.IsNullOrWhiteSpace(a.WordBreakdownJson)
                ? JsonSerializer.Deserialize<List<WordAlignmentDetailDto>>(a.WordBreakdownJson, JsonOptions) ?? new()
                : new List<WordAlignmentDetailDto>();

            return new SpeakingAssessmentResultDto
            {
                AttemptId = a.Id,
                PracticeType = a.PracticeType,
                HskLevel = a.HskLevel,
                TargetTextZh = a.TargetTextZh,
                TargetPinyin = a.TargetPinyin,
                RecognizedTranscriptZh = a.RecognizedTranscriptZh ?? string.Empty,
                TranscriptAccuracyPercent = a.TranscriptAccuracyPercent,
                OverallPronunciationScore = a.OverallPronunciationScore,
                AssessmentMethod = a.AssessmentMethod,
                HasAcousticToneData = a.HasAcousticToneData,
                ToneAssessmentNote = "Điểm số phản ánh độ khớp văn bản nhận diện (Transcript Alignment).",
                EvaluationFeedbackVi = a.EvaluationFeedbackVi ?? string.Empty,
                WordBreakdown = breakdown,
                SttProvider = "StoredAttempt",
                IsSttAvailable = true,
                AttemptedAt = a.AttemptedAt
            };
        }).ToList();
    }

    public async Task<SpeakingStatsDto> GetStatsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var attempts = await _dbContext.AiSpeakingAttempts
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .ToListAsync(cancellationToken);

        if (attempts.Count == 0)
        {
            return new SpeakingStatsDto
            {
                TotalSpeakingAttempts = 0,
                AverageAccuracyPercent = 0.0,
                CompletedWords = 0,
                CompletedSentences = 0,
                CompletedScenarios = 0,
                LastPracticedAt = null,
                HasAudioAssessedData = false
            };
        }

        var total = attempts.Count;
        var avgAcc = Math.Round(attempts.Average(a => a.TranscriptAccuracyPercent), 1);
        var words = attempts.Count(a => a.PracticeType == "WORD");
        var sentences = attempts.Count(a => a.PracticeType == "SENTENCE");
        var scenarios = attempts.Count(a => a.PracticeType == "SCENARIO");
        var last = attempts.Max(a => a.AttemptedAt);

        return new SpeakingStatsDto
        {
            TotalSpeakingAttempts = total,
            AverageAccuracyPercent = avgAcc,
            CompletedWords = words,
            CompletedSentences = sentences,
            CompletedScenarios = scenarios,
            LastPracticedAt = last,
            HasAudioAssessedData = true
        };
    }

    private static List<SpeakingPracticeItemDto> GetCuratedHskSentences(int hskLevel)
    {
        var items = new List<SpeakingPracticeItemDto>();
        switch (hskLevel)
        {
            case 1:
                items.Add(new SpeakingPracticeItemDto { Id = "s-1-1", PracticeType = "SENTENCE", HskLevel = 1, TargetTextZh = "你好，很高兴认识你。", TargetPinyin = "Nǐ hǎo, hěn gāoxìng rènshi nǐ.", MeaningVi = "Xin chào, rất vui được làm quen với bạn.", ContextScenario = "Chào hỏi" });
                items.Add(new SpeakingPracticeItemDto { Id = "s-1-2", PracticeType = "SENTENCE", HskLevel = 1, TargetTextZh = "我在学校学习汉语。", TargetPinyin = "Wǒ zài xuéxiào xuéxí Hànyǔ.", MeaningVi = "Tôi học tiếng Trung ở trường học.", ContextScenario = "Học tập" });
                items.Add(new SpeakingPracticeItemDto { Id = "s-1-3", PracticeType = "SENTENCE", HskLevel = 1, TargetTextZh = "今天天气很好，我们去喝茶吧。", TargetPinyin = "Jīntiān tiānqì hěn hǎo, wǒmen qù hē chá ba.", MeaningVi = "Hôm nay thời tiết rất đẹp, chúng ta đi uống trà đi.", ContextScenario = "Đời sống" });
                items.Add(new SpeakingPracticeItemDto { Id = "s-1-4", PracticeType = "SENTENCE", HskLevel = 1, TargetTextZh = "你想吃中国菜吗？", TargetPinyin = "Nǐ xiǎng chī Zhōngguócài ma?", MeaningVi = "Bạn muốn ăn món ăn Trung Quốc không?", ContextScenario = "Ăn uống" });
                items.Add(new SpeakingPracticeItemDto { Id = "s-1-5", PracticeType = "SENTENCE", HskLevel = 1, TargetTextZh = "这个苹果多少钱一斤？", TargetPinyin = "Zhège píngguǒ duōshao qián yì jīn?", MeaningVi = "Quả táo này bao nhiêu tiền một cân?", ContextScenario = "Mua sắm" });
                break;
            case 2:
                items.Add(new SpeakingPracticeItemDto { Id = "s-2-1", PracticeType = "SENTENCE", HskLevel = 2, TargetTextZh = "对不起，请问去火车站怎么走？", TargetPinyin = "Duìbuqǐ, qǐngwèn qù huǒchēzhàn zěnme zǒu?", MeaningVi = "Xin lỗi, cho hỏi đi đến ga xe lửa đi như thế nào?", ContextScenario = "Hỏi đường" });
                items.Add(new SpeakingPracticeItemDto { Id = "s-2-2", PracticeType = "SENTENCE", HskLevel = 2, TargetTextZh = "虽然今天很忙，但是我很快乐。", TargetPinyin = "Suīrán jīntiān hěn máng, dànshì wǒ hěn kuàilè.", MeaningVi = "Tuy hôm nay rất bận, nhưng tôi rất vui vẻ.", ContextScenario = "Cảm xúc" });
                items.Add(new SpeakingPracticeItemDto { Id = "s-2-3", PracticeType = "SENTENCE", HskLevel = 2, TargetTextZh = "这件衣服有点儿大，有小一点儿的吗？", TargetPinyin = "Zhè jiàn yīfu yǒudiǎnr dà, yǒu xiǎo yìdiǎnr de ma?", MeaningVi = "Bộ quần áo này hơi to, có cái nhỏ hơn một chút không?", ContextScenario = "Mua sắm" });
                items.Add(new SpeakingPracticeItemDto { Id = "s-2-4", PracticeType = "SENTENCE", HskLevel = 2, TargetTextZh = "医生让我多喝水，多休息。", TargetPinyin = "Yīshēng ràng wǒ duō hē shuǐ, duō xiūxi.", MeaningVi = "Bác sĩ bảo tôi uống nhiều nước, nghỉ ngơi nhiều.", ContextScenario = "Sức khỏe" });
                break;
            case 3:
                items.Add(new SpeakingPracticeItemDto { Id = "s-3-1", PracticeType = "SENTENCE", HskLevel = 3, TargetTextZh = "为了提高汉语水平，我每天都练习口语。", TargetPinyin = "Wèile tígāo Hànyǔ shuǐpíng, wǒ měitiān dōu liànxí kǒuyǔ.", MeaningVi = "Để nâng cao trình độ tiếng Trung, mỗi ngày tôi đều luyện nói.", ContextScenario = "Học tập" });
                items.Add(new SpeakingPracticeItemDto { Id = "s-3-2", PracticeType = "SENTENCE", HskLevel = 3, TargetTextZh = "这家饭馆的服务态度非常好，环境也很安静。", TargetPinyin = "Zhè jiā fànguǎn de fúwù tàidu fēicháng hǎo, huánjìng yě hěn ānjìng.", MeaningVi = "Thái độ phục vụ của quán ăn này rất tốt, môi trường cũng rất yên tĩnh.", ContextScenario = "Đánh giá" });
                items.Add(new SpeakingPracticeItemDto { Id = "s-3-3", PracticeType = "SENTENCE", HskLevel = 3, TargetTextZh = "如果明天不下雨，我们就去爬山。", TargetPinyin = "Rúguǒ míngtiān bù xià yǔ, wǒmen jiù qù pá shān.", MeaningVi = "Nếu ngày mai trời không mưa, chúng ta sẽ đi leo núi.", ContextScenario = "Kế hoạch" });
                break;
            default:
                items.Add(new SpeakingPracticeItemDto { Id = "s-4-1", PracticeType = "SENTENCE", HskLevel = hskLevel, TargetTextZh = "不管遇到多大的困难，我们都应该坚持下去。", TargetPinyin = "Bùguǎn yùdào duō dà de kùnnan, wǒmen dōu yīnggāi jiānchí xiàqù.", MeaningVi = "Dù gặp khó khăn lớn đến đâu, chúng ta đều nên kiên trì đến cùng.", ContextScenario = "Ý chí" });
                items.Add(new SpeakingPracticeItemDto { Id = "s-4-2", PracticeType = "SENTENCE", HskLevel = hskLevel, TargetTextZh = "随着科技的发展，人们的生活变得越来越方便。", TargetPinyin = "Suízhe kējì de fāzhǎn, rénmen de shēnghuó biànde yuèláiyuè fāngbiàn.", MeaningVi = "Cùng với sự phát triển của công nghệ, cuộc sống của con người ngày càng thuận tiện.", ContextScenario = "Xã hội" });
                break;
        }
        return items;
    }

    private static List<SpeakingPracticeItemDto> GetCuratedSituationalPrompts(int hskLevel)
    {
        var items = new List<SpeakingPracticeItemDto>();
        items.Add(new SpeakingPracticeItemDto
        {
            Id = "sc-1",
            PracticeType = "SCENARIO",
            HskLevel = Math.Min(hskLevel, 2),
            TargetTextZh = "服务员，请给我们两杯热咖啡和一份菜单。",
            TargetPinyin = "Fúwùyuán, qǐng gěi wǒmen liǎng bēi rè kāfēi hé yí fèn càidān.",
            MeaningVi = "Phục vụ ơi, cho chúng tôi hai cốc cà phê nóng và một cuốn thực đơn.",
            ContextScenario = "Gọi món tại nhà hàng / quán cà phê",
            CulturalNoteVi = "Cách xưng hô 服务员 (phục vụ) rất phổ biến và lịch sự tại Trung Quốc."
        });

        items.Add(new SpeakingPracticeItemDto
        {
            Id = "sc-2",
            PracticeType = "SCENARIO",
            HskLevel = Math.Min(hskLevel, 2),
            TargetTextZh = "老板，这件衬衫太贵了，能不能便宜一点儿？",
            TargetPinyin = "Lǎobǎn, zhè jiàn chènshān tài guì le, néng bu néng piányi yìdiǎnr?",
            MeaningVi = "Ông chủ ơi, chiếc áo sơ mi này đắt quá, có thể bớt một chút được không?",
            ContextScenario = "Mua sắm & Mặc cả tại chợ / cửa hàng",
            CulturalNoteVi = "Xưng hô 老板 (ông chủ) tạo cảm giác thân thiện khi mua sắm tại cửa hàng truyền thống."
        });

        items.Add(new SpeakingPracticeItemDto
        {
            Id = "sc-3",
            PracticeType = "SCENARIO",
            HskLevel = Math.Min(hskLevel, 3),
            TargetTextZh = "您好，我想预订一间大床房，住两个晚上。",
            TargetPinyin = "Nín hǎo, wǒ xiǎng yùdìng yì jiān dàchuángfáng, zhù liǎng gè wǎnshang.",
            MeaningVi = "Xin chào, tôi muốn đặt một phòng giường đôi, ở hai đêm.",
            ContextScenario = "Đặt phòng khách sạn khi đi du lịch",
            CulturalNoteVi = "Dùng 您好 (nín hǎo) thể hiện sự trang trọng, lịch sự với nhân viên lễ tân."
        });

        items.Add(new SpeakingPracticeItemDto
        {
            Id = "sc-4",
            PracticeType = "SCENARIO",
            HskLevel = Math.Max(2, hskLevel),
            TargetTextZh = "请问附近的地铁站在哪里？走路需要多长时间？",
            TargetPinyin = "Qǐngwèn fùjìn de dìtiězhàn zài nǎlǐ? Zǒulù xūyào duō cháng shíjiān?",
            MeaningVi = "Cho hỏi ga tàu điện ngầm gần đây ở đâu? Đi bộ mất bao nhiêu thời gian?",
            ContextScenario = "Hỏi đường & Giao thông công cộng",
            CulturalNoteVi = "Cụm từ 走路需要多长时间 rất thiết thực khi đi lại tại các thành phố lớn."
        });

        items.Add(new SpeakingPracticeItemDto
        {
            Id = "sc-5",
            PracticeType = "SCENARIO",
            HskLevel = Math.Max(2, hskLevel),
            TargetTextZh = "我是新来的实习生，今后请大家多多关照。",
            TargetPinyin = "Wǒ shì xīn lái de shíxíshēng, jīnhòu qǐng dàjiā duōduō guānzhào.",
            MeaningVi = "Tôi là thực tập sinh mới đến, từ nay về sau mong mọi người giúp đỡ nhiều hơn.",
            ContextScenario = "Giao tiếp công việc & Giới thiệu đồng nghiệp mới",
            CulturalNoteVi = "请多多关照 là câu chào cửa miệng rất lịch thiệp trong môi trường làm việc."
        });

        return items;
    }
}
