import { httpClient } from '../../../core/api/client/http-client';
import type { AiConversationSession } from './ai-learning-engine.service';

export interface SpeakingPracticeItem {
  id: string;
  practiceType: 'WORD' | 'SENTENCE' | 'SCENARIO';
  hskLevel: number;
  targetTextZh: string;
  targetPinyin: string;
  meaningVi: string;
  audioSampleUrl?: string;
  contextScenario?: string;
  culturalNoteVi?: string;
}

export interface WordAlignmentDetail {
  characterOrWord: string;
  pinyin?: string;
  status: 'MATCHED' | 'MISSED' | 'SUBSTITUTED' | 'EXTRA';
  tipVi?: string;
}

export interface SpeakingAssessmentResult {
  attemptId: string;
  practiceType: string;
  hskLevel: number;
  targetTextZh: string;
  targetPinyin?: string;
  recognizedTranscriptZh: string;
  transcriptAccuracyPercent: number;
  overallPronunciationScore: number;
  assessmentMethod: string;
  hasAcousticToneData: boolean;
  toneAssessmentNote: string;
  evaluationFeedbackVi: string;
  wordBreakdown: WordAlignmentDetail[];
  suggestedNextPractice?: string;
  sttProvider: string;
  isSttAvailable: boolean;
  sttConfidence?: number | null;
  sttConfidenceStatus?: string;
  isDirectTextInput?: boolean;
  attemptedAt: string;
}

export interface SpeakingStats {
  totalSpeakingAttempts: number;
  averageAccuracyPercent: number;
  completedWords: number;
  completedSentences: number;
  completedScenarios: number;
  lastPracticedAt?: string;
  hasAudioAssessedData: boolean;
  disclaimerNoteVi: string;
}

export interface SubmitSpeakingPayload {
  practiceType: string;
  hskLevel: number;
  targetTextZh: string;
  targetPinyin?: string;
  targetMeaningVi?: string;
  directText?: string;
  audioDurationSeconds?: number;
}

export const speakingService = {
  getSpeakingItems: (hskLevel = 1, type: 'WORD' | 'SENTENCE' | 'SCENARIO' = 'WORD') =>
    httpClient.get<SpeakingPracticeItem[]>(`/ai/speaking/items?hskLevel=${hskLevel}&type=${type}`),

  submitSpeakingPracticeFormData: async (formData: FormData): Promise<SpeakingAssessmentResult> => {
    // Uses native fetch or httpClient with multipart
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetch('/api/v1/ai/speaking/submit', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Lỗi nộp bài luyện nói' }));
      throw new Error(err.detail || err.title || 'Lỗi nộp bài luyện nói');
    }
    return res.json();
  },

  submitSpeakingPracticeJson: (payload: SubmitSpeakingPayload) =>
    httpClient.post<SpeakingAssessmentResult>('/ai/speaking/submit-json', payload),

  getSpeakingHistory: (limit = 20) =>
    httpClient.get<SpeakingAssessmentResult[]>(`/ai/speaking/history?limit=${limit}`),

  getSpeakingStats: () =>
    httpClient.get<SpeakingStats>('/ai/speaking/stats'),

  sendConversationAudioMessage: async (
    sessionId: string,
    audioBlob: Blob,
    requestVietnamese = false
  ): Promise<AiConversationSession> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('requestVietnamese', String(requestVietnamese));

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetch(`/api/v1/ai/conversations/${sessionId}/messages/audio`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Lỗi gửi tin nhắn âm thanh' }));
      throw new Error(err.detail || err.title || 'Lỗi gửi tin nhắn âm thanh');
    }
    return res.json();
  },
};

