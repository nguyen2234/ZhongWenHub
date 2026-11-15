using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using ZhongWenHub.Business.AILearning;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AILearning.Services.Competency;
using ZhongWenHub.Business.AILearning.Services.Speech;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Entities.AI;
using ZhongWenHub.Data.Entities.Learning;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.UnitTests;

public class AIPhase5SpeakingTests
{
    private const string ConnectionString = "Server=.\\SQLEXPRESS;Database=ZhongWenHub_Test;Trusted_Connection=True;TrustServerCertificate=True;";

    private ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(ConnectionString)
            .Options;
        return new ApplicationDbContext(options);
    }

    private async Task<ApplicationUser> EnsureTestUserAsync(ApplicationDbContext db, string username = "phase5_speaker")
    {
        var email = $"{username}@zhongwenhub.test";
        var user = await db.Users.FirstOrDefaultAsync(u => u.UserName == email);
        if (user == null)
        {
            user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = email,
                Email = email,
                DisplayName = username,
                Status = UserStatus.ACTIVE,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }

        var profile = await db.StudentLearningProfiles.FirstOrDefaultAsync(p => p.UserId == user.Id);
        if (profile == null)
        {
            profile = new StudentLearningProfile
            {
                UserId = user.Id,
                SelectedHskLevel = 1,
                StreakDays = 2,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            db.StudentLearningProfiles.Add(profile);
            await db.SaveChangesAsync();
        }

        // Clean up previous test attempts for isolation
        var oldSpeaking = await db.AiSpeakingAttempts.Where(a => a.UserId == user.Id).ToListAsync();
        if (oldSpeaking.Count > 0)
        {
            db.AiSpeakingAttempts.RemoveRange(oldSpeaking);
        }
        var oldPractice = await db.StudentPracticeAttempts.Where(a => a.UserId == user.Id && a.Category == "speaking").ToListAsync();
        if (oldPractice.Count > 0)
        {
            db.StudentPracticeAttempts.RemoveRange(oldPractice);
        }
        await db.SaveChangesAsync();

        return user;
    }

    [Fact]
    public async Task GetPracticeItems_ReturnsItemsForWordSentenceScenario()
    {
        await using var db = CreateContext();
        var stt = new MockSpeechRecognitionService();
        var pron = new AIPronunciationService();
        var service = new AISpeakingService(db, stt, pron, NullLogger<AISpeakingService>.Instance);

        // 1. Vocabulary words
        var words = await service.GetPracticeItemsAsync(1, "WORD");
        Assert.NotEmpty(words);
        Assert.All(words, w => Assert.Equal("WORD", w.PracticeType));

        // 2. Sentences
        var sentences = await service.GetPracticeItemsAsync(2, "SENTENCE");
        Assert.NotEmpty(sentences);
        Assert.All(sentences, s => Assert.Equal("SENTENCE", s.PracticeType));

        // 3. Scenarios
        var scenarios = await service.GetPracticeItemsAsync(1, "SCENARIO");
        Assert.NotEmpty(scenarios);
        Assert.All(scenarios, sc => Assert.Equal("SCENARIO", sc.PracticeType));
    }

    [Fact]
    public async Task PronunciationAssessment_AlignsCharacters_AndProvidesMetricDisclaimers()
    {
        var pron = new AIPronunciationService();

        // Target: 你好很高兴认识你
        // Recognized: 你好认识你 (missing 很高兴)
        var result = pron.EvaluatePronunciation(
            targetZh: "你好，很高兴认识你。",
            targetPinyin: "Nǐ hǎo, hěn gāoxìng rènshi nǐ.",
            targetMeaningVi: "Xin chào, rất vui được làm quen với bạn.",
            recognizedZh: "你好认识你",
            hskLevel: 1,
            practiceType: "SENTENCE");

        Assert.Equal("TRANSCRIPT_ALIGNMENT", result.AssessmentMethod);
        Assert.False(result.HasAcousticToneData, "Transcript alignment must NOT pretend acoustic tone evaluation");
        Assert.Contains("Transcript Alignment", result.ToneAssessmentNote);
        Assert.True(result.TranscriptAccuracyPercent > 0 && result.TranscriptAccuracyPercent < 100);

        // Verify word breakdown contains matched and missed
        Assert.Contains(result.WordBreakdown, w => w.Status == "MATCHED" && w.CharacterOrWord == "你");
        Assert.Contains(result.WordBreakdown, w => w.Status == "MISSED" && w.CharacterOrWord == "高");
        Assert.NotEmpty(result.EvaluationFeedbackVi);
    }

    [Fact]
    public async Task SubmitPractice_WhenSttUnavailable_ReturnsClearNotice_NeverFakeTranscript()
    {
        await using var db = CreateContext();
        var user = await EnsureTestUserAsync(db, "phase5_stt_unavailable");
        var stt = new MockSpeechRecognitionService
        {
            IsAvailable = false,
            SimulateErrorCode = "STT_UNAVAILABLE"
        };
        var pron = new AIPronunciationService();
        var service = new AISpeakingService(db, stt, pron, NullLogger<AISpeakingService>.Instance);

        using var fakeAudioStream = new MemoryStream(Encoding.UTF8.GetBytes("RIFF1234WAVEfmt "));

        var result = await service.SubmitPracticeAsync(
            user.Id,
            new SubmitSpeakingPracticeDto
            {
                PracticeType = "WORD",
                HskLevel = 1,
                TargetTextZh = "苹果",
                TargetPinyin = "píngguǒ"
            },
            fakeAudioStream,
            "audio/wav");

        Assert.False(result.IsSttAvailable);
        Assert.Empty(result.RecognizedTranscriptZh);
        Assert.Equal(0.0, result.TranscriptAccuracyPercent);
        Assert.Contains("chưa sẵn sàng", result.EvaluationFeedbackVi);
    }

    [Fact]
    public async Task SubmitPractice_WithSuccessfulAudio_LogsSpeakingPracticeAttempt_AndUpdatesCompetency()
    {
        await using var db = CreateContext();
        var user = await EnsureTestUserAsync(db, "phase5_successful_practice");
        var stt = new MockSpeechRecognitionService
        {
            IsAvailable = true,
            MockRecognizedText = "苹果"
        };
        var pron = new AIPronunciationService();
        var service = new AISpeakingService(db, stt, pron, NullLogger<AISpeakingService>.Instance);

        using var audioStream = new MemoryStream(Encoding.UTF8.GetBytes("RIFF1234WAVEfmt "));

        var result = await service.SubmitPracticeAsync(
            user.Id,
            new SubmitSpeakingPracticeDto
            {
                PracticeType = "WORD",
                HskLevel = 1,
                TargetTextZh = "苹果",
                TargetPinyin = "píngguǒ",
                TargetMeaningVi = "Quả táo",
                AudioDurationSeconds = 2
            },
            audioStream,
            "audio/wav");

        Assert.True(result.IsSttAvailable);
        Assert.Equal("苹果", result.RecognizedTranscriptZh);
        Assert.Equal(100.0, result.TranscriptAccuracyPercent);
        Assert.NotEqual(Guid.Empty, result.AttemptId);

        // Verify saved AiSpeakingAttempt has discarded audio status
        var dbAttempt = await db.AiSpeakingAttempts.FirstOrDefaultAsync(a => a.Id == result.AttemptId);
        Assert.NotNull(dbAttempt);
        Assert.Equal("PROCESSED_DISCARDED", dbAttempt.AudioStorageStatus);

        // Verify StudentPracticeAttempts has category = 'speaking'
        var practiceAttempt = await db.StudentPracticeAttempts.FirstOrDefaultAsync(a => a.ExerciseId == result.AttemptId.ToString());
        Assert.NotNull(practiceAttempt);
        Assert.Equal("speaking", practiceAttempt.Category);
        Assert.True(practiceAttempt.IsCorrect);

        // Verify Competency Profile recognizes real speaking practice data
        var competencyService = new CompetencyProfileService(db);
        var profile = await competencyService.GetCompetencyProfileAsync(user.Id);

        Assert.True(profile.HasSpeakingAudioData);
        var speakingSkill = profile.MacroSkills.FirstOrDefault(s => s.SkillCategory == "speaking");
        Assert.NotNull(speakingSkill);
        Assert.True(speakingSkill.TotalAttempts >= 1);
        Assert.True(speakingSkill.IsMeasuredRealData);
        Assert.Equal(100.0, speakingSkill.AccuracyPercent);
    }

    [Fact]
    public async Task SubmitPractice_RejectsEmptyAudioAndEmptyDirectText()
    {
        await using var db = CreateContext();
        var user = await EnsureTestUserAsync(db, "phase5_empty_sub");
        var stt = new MockSpeechRecognitionService();
        var pron = new AIPronunciationService();
        var service = new AISpeakingService(db, stt, pron, NullLogger<AISpeakingService>.Instance);

        await Assert.ThrowsAsync<AITutorException>(async () =>
        {
            await service.SubmitPracticeAsync(
                user.Id,
                new SubmitSpeakingPracticeDto
                {
                    PracticeType = "WORD",
                    TargetTextZh = "你好",
                    DirectText = null
                },
                null,
                null);
        });
    }

    [Fact]
    public async Task ConversationAudio_TranscribesAudioAndProgressesConversation()
    {
        await using var db = CreateContext();
        var user = await EnsureTestUserAsync(db, "phase5_convo_audio");
        var stt = new MockSpeechRecognitionService
        {
            IsAvailable = true,
            MockRecognizedText = "你好我想喝一杯热咖啡"
        };
        var aiProvider = new MockAIProvider(
            "{\"replyZh\":\"好的，请稍等，热咖啡马上来。\",\"replyPinyin\":\"Hǎo de, qǐng shāoděng, rè kāfēi mǎshàng lái.\",\"replyVi\":\"Được ạ, xin đợi một chút, cà phê nóng có ngay.\",\"hasError\":false,\"suggestedUserReplies\":[\"谢谢你\",\"多少钱\"]}");
        var convoService = new AIConversationService(db, aiProvider, new NoOpUsageLogger(), stt, NullLogger<AIConversationService>.Instance);

        // 1. Start conversation
        var session = await convoService.StartSessionAsync(user.Id, new StartConversationRequestDto
        {
            ScenarioCode = "cafe-order",
            HskLevel = 1
        });
        Assert.NotNull(session);
        Assert.Equal("ACTIVE", session.Status);

        // 2. Send audio message
        using var audioStream = new MemoryStream(Encoding.UTF8.GetBytes("fake audio bytes"));
        var updatedSession = await convoService.SendAudioMessageAsync(user.Id, session.Id, audioStream, "audio/webm", requestVietnamese: true);

        Assert.Equal(3, updatedSession.Messages.Count); // initial ai + user + ai reply
        Assert.Equal("你好我想喝一杯热咖啡", updatedSession.Messages[1].ContentZh);
        Assert.Equal("user", updatedSession.Messages[1].Role);
        Assert.Equal("assistant", updatedSession.Messages[2].Role);

        // 3. End session and verify speaking practice attempt logged
        var ended = await convoService.EndSessionAsync(user.Id, session.Id);
        Assert.Equal("COMPLETED", ended.Status);
        Assert.NotNull(ended.SummaryVi);

        var practiceAttempt = await db.StudentPracticeAttempts.FirstOrDefaultAsync(a => a.ExerciseId == session.Id.ToString());
        Assert.NotNull(practiceAttempt);
        Assert.Equal("speaking", practiceAttempt.Category);
    }

    [Fact]
    public async Task SpeakingStats_SummarizesCompletedAttemptsAccurately()
    {
        await using var db = CreateContext();
        var user = await EnsureTestUserAsync(db, "phase5_stats_user");
        var stt = new MockSpeechRecognitionService
        {
            IsAvailable = true,
            MockRecognizedText = "老师好"
        };
        var pron = new AIPronunciationService();
        var service = new AISpeakingService(db, stt, pron, NullLogger<AISpeakingService>.Instance);

        // Empty stats first
        var emptyStats = await service.GetStatsAsync(user.Id);
        Assert.Equal(0, emptyStats.TotalSpeakingAttempts);
        Assert.False(emptyStats.HasAudioAssessedData);

        // Submit one attempt
        await service.SubmitPracticeAsync(user.Id, new SubmitSpeakingPracticeDto
        {
            PracticeType = "WORD",
            HskLevel = 1,
            TargetTextZh = "老师",
            DirectText = "老师"
        }, null, null);

        var populatedStats = await service.GetStatsAsync(user.Id);
        Assert.Equal(1, populatedStats.TotalSpeakingAttempts);
        Assert.Equal(1, populatedStats.CompletedWords);
        Assert.True(populatedStats.HasAudioAssessedData);
    }

    private sealed class MockSpeechRecognitionService : ISpeechRecognitionService
    {
        public bool IsAvailable { get; set; } = true;
        public string ProviderName => "MockAudioSTT";
        public string MockRecognizedText { get; set; } = "你好";
        public string? SimulateErrorCode { get; set; }

        public Task<SpeechRecognitionResult> RecognizeSpeechAsync(
            Stream audioStream,
            string contentType,
            string targetLanguage = "zh-CN",
            CancellationToken cancellationToken = default)
        {
            if (!IsAvailable || !string.IsNullOrWhiteSpace(SimulateErrorCode))
            {
                return Task.FromResult(new SpeechRecognitionResult
                {
                    IsSuccess = false,
                    ErrorCode = SimulateErrorCode ?? "STT_UNAVAILABLE",
                    ErrorMessage = "Dịch vụ nhận diện giọng nói (STT Provider) chưa sẵn sàng.",
                    Provider = ProviderName
                });
            }

            return Task.FromResult(new SpeechRecognitionResult
            {
                IsSuccess = true,
                RecognizedText = MockRecognizedText,
                Confidence = 0.95,
                Provider = ProviderName
            });
        }
    }

    private sealed class MockAIProvider : IAIProvider
    {
        private readonly string _responseJson;

        public MockAIProvider(string responseJson)
        {
            _responseJson = responseJson;
        }

        public Task<AIProviderResponse> GenerateContentAsync(AIProviderRequest request, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new AIProviderResponse
            {
                RawText = _responseJson,
                Model = "mock-model",
                Provider = "Mock",
                IsMock = true
            });
        }
    }

    private sealed class NoOpUsageLogger : IAIUsageLogger
    {
        public Task LogAsync(Guid userId, string feature, AIProviderResponse? response, bool isSuccess, string? errorCode, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task EnsureWithinDailyBudgetAsync(Guid userId, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
