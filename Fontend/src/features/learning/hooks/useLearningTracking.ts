import { useState, useEffect, useCallback } from 'react';
import { learningEventService } from '../services/learning-event.service';
import { learningEventStore } from '../services/learning-event-store.service';
import type { LearningBehaviorSummary } from '../types/learning-event.types';

export function useLearningTracking() {
  const [isConsentGranted, setIsConsentGranted] = useState<boolean>(() =>
    learningEventStore.isAnalyticsConsentGranted()
  );

  useEffect(() => {
    setIsConsentGranted(learningEventStore.isAnalyticsConsentGranted());
  }, []);

  const updateConsent = useCallback((granted: boolean) => {
    learningEventStore.setAnalyticsConsent(granted);
    setIsConsentGranted(granted);
  }, []);

  const clearAnalytics = useCallback(() => {
    learningEventStore.clearAnalyticsData();
  }, []);

  const startSession = useCallback((lessonId: string, hskLevel: number, studentId?: string) => {
    return learningEventService.startSession(lessonId, hskLevel, studentId);
  }, []);

  const pauseSession = useCallback((reason?: string) => {
    learningEventService.pauseSession(reason);
  }, []);

  const resumeSession = useCallback((sessionId: string) => {
    learningEventService.resumeSession(sessionId);
  }, []);

  const completeSession = useCallback(
    (quizScore?: number, totalQuestions?: number, xpEarned?: number) => {
      learningEventService.completeSession(quizScore, totalQuestions, xpEarned);
    },
    []
  );

  const trackStepEntered = useCallback((stepId: string, stepIndex: number) => {
    learningEventService.trackStepEntered(stepId, stepIndex);
  }, []);

  const trackStepCompleted = useCallback((stepId: string, stepIndex: number) => {
    learningEventService.trackStepCompleted(stepId, stepIndex);
  }, []);

  const trackQuestionAnswered = useCallback(
    (payload: {
      questionId: string;
      attemptNumber: number;
      isCorrect: boolean;
      durationMs?: number;
      metadata?: Record<string, string | number | boolean>;
    }) => {
      learningEventService.trackQuestionAnswered(payload);
    },
    []
  );

  const trackHintRequested = useCallback((stepId?: string, questionId?: string) => {
    learningEventService.trackHintRequested(stepId, questionId);
  }, []);

  const trackPronunciationPlayed = useCallback((hanzi: string, pinyin?: string) => {
    learningEventService.trackPronunciationPlayed(hanzi, pinyin);
  }, []);

  const trackVocabularyReviewed = useCallback((vocabId: string, hanzi: string) => {
    learningEventService.trackVocabularyReviewed(vocabId, hanzi);
  }, []);

  const trackQuizSubmitted = useCallback((score: number, total: number, durationMs?: number) => {
    learningEventService.trackQuizSubmitted(score, total, durationMs);
  }, []);

  const getBehaviorSummary = useCallback((): LearningBehaviorSummary => {
    return learningEventService.generateBehaviorSummary();
  }, []);

  return {
    isConsentGranted,
    updateConsent,
    clearAnalytics,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    trackStepEntered,
    trackStepCompleted,
    trackQuestionAnswered,
    trackHintRequested,
    trackPronunciationPlayed,
    trackVocabularyReviewed,
    trackQuizSubmitted,
    getBehaviorSummary,
  };
}
