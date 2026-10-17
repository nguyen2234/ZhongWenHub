// @ts-ignore
import { describe, it, expect, beforeEach } from 'bun:test';
import {
  learningEventStore,
  LearningEventStore,
} from '../features/learning/services/learning-event-store.service';
import { LearningEventService } from '../features/learning/services/learning-event.service';
import type { LearningEvent } from '../features/learning/types/learning-event.types';
import { LessonPracticeModal } from '../features/lesson/components/LessonPracticeModal';

describe('FE-6.2: Stable Practice Modal & Learning Behavior Telemetry', () => {
  beforeEach(() => {
    // Reset test storage
    localStorage.clear();
    learningEventStore.setAnalyticsConsent(true);
  });

  describe('1. Learning Telemetry Storage & Privacy Consent', () => {
    it('should save educational events when consent is granted', () => {
      const mockEvent: LearningEvent = {
        eventId: 'ev-test-1',
        schemaVersion: '1.0.0',
        sessionId: 'sess-1',
        studentId: 'student-test',
        lessonId: 'les-hsk1-1',
        hskLevel: 1,
        eventType: 'question_answered',
        timestamp: Date.now(),
        durationMs: 3500,
        attemptNumber: 1,
        correctness: true,
      };

      learningEventStore.saveEvent(mockEvent);
      const events = learningEventStore.getEvents({ sessionId: 'sess-1' });

      expect(events.length).toBe(1);
      expect(events[0].eventId).toBe('ev-test-1');
      expect(events[0].correctness).toBe(true);
    });

    it('should drop educational events when analytics consent is withdrawn', () => {
      learningEventStore.setAnalyticsConsent(false);
      expect(learningEventStore.isAnalyticsConsentGranted()).toBe(false);

      const mockEvent: LearningEvent = {
        eventId: 'ev-test-blocked',
        schemaVersion: '1.0.0',
        sessionId: 'sess-blocked',
        studentId: 'student-test',
        lessonId: 'les-hsk1-1',
        hskLevel: 1,
        eventType: 'practice_session_started',
        timestamp: Date.now(),
        durationMs: 0,
      };

      learningEventStore.saveEvent(mockEvent);
      expect(learningEventStore.getEvents().length).toBe(0);
    });

    it('should prevent duplicate event logging by eventId', () => {
      const mockEvent: LearningEvent = {
        eventId: 'ev-unique-id',
        schemaVersion: '1.0.0',
        sessionId: 'sess-1',
        studentId: 'student-test',
        lessonId: 'les-hsk1-1',
        hskLevel: 1,
        eventType: 'hint_requested',
        timestamp: Date.now(),
        durationMs: 0,
      };

      learningEventStore.saveEvent(mockEvent);
      learningEventStore.saveEvent(mockEvent); // Repeat

      expect(learningEventStore.getEvents().length).toBe(1);
    });

    it('should clear telemetry events without clearing critical learning progress', () => {
      // Set non-telemetry learning state
      localStorage.setItem('zh_user_streak', '12');

      const mockEvent: LearningEvent = {
        eventId: 'ev-clear-test',
        schemaVersion: '1.0.0',
        sessionId: 'sess-1',
        studentId: 'student-test',
        lessonId: 'les-hsk1-1',
        hskLevel: 1,
        eventType: 'pronunciation_played',
        timestamp: Date.now(),
        durationMs: 0,
      };
      learningEventStore.saveEvent(mockEvent);
      expect(learningEventStore.getEvents().length).toBe(1);

      learningEventStore.clearAnalyticsData();
      expect(learningEventStore.getEvents().length).toBe(0);
      expect(localStorage.getItem('zh_user_streak')).toBe('12');
    });

    it('should enforce retention limit (max 500 events)', () => {
      const store = new LearningEventStore();
      const events: LearningEvent[] = [];

      for (let i = 0; i < 520; i++) {
        events.push({
          eventId: `ev-bulk-${i}`,
          schemaVersion: '1.0.0',
          sessionId: 'sess-bulk',
          studentId: 'student-test',
          lessonId: 'les-hsk1-1',
          hskLevel: 1,
          eventType: 'question_answered',
          timestamp: Date.now() + i,
          durationMs: 100,
        });
      }

      store.saveEvents(events);
      expect(store.getEventCount()).toBeLessThanOrEqual(500);
      expect(store.getEventCount()).toBe(500);
    });
  });

  describe('2. Educational Session Lifecycle & Behavior Tracking', () => {
    it('should start a practice session and record practice_session_started', () => {
      const service = new LearningEventService();
      const sessionId = service.startSession('les-hsk1-1', 1, 'student-user-1');

      expect(sessionId).toBeDefined();
      expect(sessionId.startsWith('sess-')).toBe(true);

      const events = learningEventStore.getEvents({ sessionId });
      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events[0].eventType).toBe('practice_session_started');
      expect(events[0].lessonId).toBe('les-hsk1-1');
      expect(events[0].hskLevel).toBe(1);
    });

    it('should track step transitions and measure step durations without negative numbers', () => {
      const service = new LearningEventService();
      const sessionId = service.startSession('les-hsk1-1', 1);

      service.trackStepEntered('step-intro', 0);
      service.trackStepCompleted('step-intro', 0);
      service.trackStepEntered('step-vocabulary', 1);

      const events = learningEventStore.getEvents({ sessionId });
      const enteredEvents = events.filter((e) => e.eventType === 'practice_step_entered');
      const completedEvents = events.filter((e) => e.eventType === 'practice_step_completed');

      expect(enteredEvents.length).toBe(2);
      expect(completedEvents.length).toBe(1);
      expect(completedEvents[0].durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should ensure completion event is idempotent per session', () => {
      const service = new LearningEventService();
      const sessionId = service.startSession('les-hsk1-1', 1);

      service.completeSession(5, 5, 50);
      service.completeSession(5, 5, 50); // Duplicate call

      const events = learningEventStore.getEvents({ sessionId });
      const completedEvents = events.filter((e) => e.eventType === 'practice_session_completed');

      expect(completedEvents.length).toBe(1);
      expect(completedEvents[0].metadata?.quizScore).toBe(5);
      expect(completedEvents[0].metadata?.xpEarned).toBe(50);
    });

    it('should generate behavior summary for future AI personalization preparation', () => {
      const service = new LearningEventService();
      service.setStudentId('student-ai-test');
      service.startSession('les-hsk1-1', 1, 'student-ai-test');

      // Record several questions with one mistake
      service.trackQuestionAnswered({
        questionId: 'q1',
        attemptNumber: 1,
        isCorrect: true,
        durationMs: 2000,
        metadata: { category: 'vocabulary' },
      });
      service.trackQuestionAnswered({
        questionId: 'q2',
        attemptNumber: 1,
        isCorrect: false,
        durationMs: 3000,
        metadata: { category: 'grammar_syntax' },
      });
      service.trackQuestionAnswered({
        questionId: 'q2',
        attemptNumber: 2,
        isCorrect: true,
        durationMs: 1500,
        metadata: { category: 'grammar_syntax' },
      });
      service.trackHintRequested('step-quiz', 'q2');
      service.completeSession(4, 5, 50);

      const summary = service.generateBehaviorSummary(undefined, 'student-ai-test');

      expect(summary.studentId).toBe('student-ai-test');
      expect(summary.totalAttempts).toBe(3);
      expect(summary.correctAttempts).toBe(2);
      expect(summary.accuracyRate).toBe(0.667);
      expect(summary.hintUsageCount).toBe(1);
      expect(summary.completedSessions).toBe(1);
      expect(summary.weakSkillTags).toContain('grammar_syntax');
    });
  });

  describe('3. Practice Modal Component & Architecture', () => {
    it('should export LessonPracticeModal as a valid React component', () => {
      expect(LessonPracticeModal).toBeDefined();
      expect(typeof LessonPracticeModal).toBe('function');
    });
  });
});
