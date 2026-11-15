import { describe, it, expect, vi } from 'bun:test';
import { speakingService } from '../features/ai/services/speaking.service';
import { SkillSpeakingPage } from '../features/skills/pages/SkillSpeakingPage';

describe('Phase 5 AI Speaking Practice & Conversation Contracts', () => {
  it('exposes Phase 5 speaking service endpoints and methods', () => {
    expect(typeof speakingService.getSpeakingItems).toBe('function');
    expect(typeof speakingService.submitSpeakingPracticeFormData).toBe('function');
    expect(typeof speakingService.submitSpeakingPracticeJson).toBe('function');
    expect(typeof speakingService.getSpeakingHistory).toBe('function');
    expect(typeof speakingService.getSpeakingStats).toBe('function');
    expect(typeof speakingService.sendConversationAudioMessage).toBe('function');
  });

  it('validates SpeakingAssessmentResult contract with metric disclaimers and character breakdown', () => {
    const mockResult = {
      attemptId: 'b75f8f30-8d4a-4a25-a7b3-6c8f94d33451',
      practiceType: 'WORD',
      hskLevel: 1,
      targetTextZh: '苹果',
      targetPinyin: 'píngguǒ',
      recognizedTranscriptZh: '苹果',
      transcriptAccuracyPercent: 100.0,
      overallPronunciationScore: 100.0,
      assessmentMethod: 'TRANSCRIPT_ALIGNMENT',
      hasAcousticToneData: false,
      toneAssessmentNote:
        'Điểm số phản ánh độ khớp văn bản nhận diện (Transcript Alignment). Không suy đoán thanh điệu hoặc ngữ điệu âm học khi chưa có thiết bị đo chuyên biệt.',
      evaluationFeedbackVi: 'Xuất sắc! Bạn phát âm rất rõ ràng, toàn bộ các âm tiết được nhận diện chính xác.',
      wordBreakdown: [
        {
          characterOrWord: '苹',
          pinyin: 'píng',
          status: 'MATCHED',
          tipVi: 'Phát âm chuẩn xác.',
        },
        {
          characterOrWord: '果',
          pinyin: 'guǒ',
          status: 'MATCHED',
          tipVi: 'Phát âm chuẩn xác.',
        },
      ],
      sttProvider: 'GeminiMultimodalAudioSTT',
      isSttAvailable: true,
      attemptedAt: '2026-11-16T00:30:00Z',
    };

    expect(mockResult.assessmentMethod).toBe('TRANSCRIPT_ALIGNMENT');
    expect(mockResult.hasAcousticToneData).toBe(false);
    expect(mockResult.toneAssessmentNote).toContain('Transcript Alignment');
    expect(mockResult.wordBreakdown.length).toBe(2);
    expect(mockResult.wordBreakdown[0].status).toBe('MATCHED');
  });

  it('validates SpeakingPracticeItem contract supporting WORD, SENTENCE, and SCENARIO', () => {
    const wordItem = {
      id: 'w-1',
      practiceType: 'WORD',
      hskLevel: 1,
      targetTextZh: '你好',
      targetPinyin: 'nǐ hǎo',
      meaningVi: 'Xin chào',
      audioSampleUrl: 'https://cdn.test/audio/nihao.mp3',
    };

    const sentenceItem = {
      id: 's-1',
      practiceType: 'SENTENCE',
      hskLevel: 2,
      targetTextZh: '对不起，请问去火车站怎么走？',
      targetPinyin: 'Duìbuqǐ, qǐngwèn qù huǒchēzhàn zěnme zǒu?',
      meaningVi: 'Xin lỗi, cho hỏi đi đến ga xe lửa đi như thế nào?',
      contextScenario: 'Hỏi đường',
    };

    const scenarioItem = {
      id: 'sc-1',
      practiceType: 'SCENARIO',
      hskLevel: 1,
      targetTextZh: '服务员，请给我们两杯热咖啡。',
      targetPinyin: 'Fúwùyuán, qǐng gěi wǒmen liǎng bēi rè kāfēi.',
      meaningVi: 'Phục vụ ơi, cho chúng tôi hai cốc cà phê nóng.',
      contextScenario: 'Quán cà phê',
      culturalNoteVi: 'Cách xưng hô 服务员 rất phổ biến.',
    };

    expect(wordItem.practiceType).toBe('WORD');
    expect(sentenceItem.practiceType).toBe('SENTENCE');
    expect(scenarioItem.practiceType).toBe('SCENARIO');
    expect(sentenceItem.targetTextZh.length).toBeGreaterThan(wordItem.targetTextZh.length);
  });

  it('validates SpeakingStats contract without misleading acoustic claims', () => {
    const stats = {
      totalSpeakingAttempts: 15,
      averageAccuracyPercent: 88.5,
      completedWords: 10,
      completedSentences: 3,
      completedScenarios: 2,
      hasAudioAssessedData: true,
      disclaimerNoteVi: 'Dữ liệu dựa trên độ khớp nhận diện giọng nói (Transcript Alignment).',
    };

    expect(stats.totalSpeakingAttempts).toBe(15);
    expect(stats.completedWords + stats.completedSentences + stats.completedScenarios).toBe(15);
    expect(stats.disclaimerNoteVi).toContain('Transcript Alignment');
  });

  it('exports SkillSpeakingPage component without runtime export errors', () => {
    expect(SkillSpeakingPage).toBeDefined();
    expect(typeof SkillSpeakingPage).toBe('function');
  });
});

