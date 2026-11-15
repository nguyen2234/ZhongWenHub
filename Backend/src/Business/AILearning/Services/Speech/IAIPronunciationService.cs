using System.Collections.Generic;
using ZhongWenHub.Business.AILearning.DTOs;

namespace ZhongWenHub.Business.AILearning.Services.Speech;

public interface IAIPronunciationService
{
    SpeakingAssessmentResultDto EvaluatePronunciation(
        string targetZh,
        string? targetPinyin,
        string? targetMeaningVi,
        string recognizedZh,
        int hskLevel,
        string practiceType = "WORD",
        string sttProvider = "GeminiAudioSTT",
        bool isSttAvailable = true);
}

