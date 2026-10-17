import type {
  LearningEvent,
  LearningEventType,
  LearningBehaviorSummary,
} from '../types/learning-event.types';
import { learningEventStore } from './learning-event-store.service';

const SCHEMA_VERSION = '1.0.0';
const DEFAULT_STUDENT_ID = 'student-local-anon';
const IDLE_TIMEOUT_MS = 60000; // 60 seconds inactivity pauses the clock

export class LearningEventService {
  private currentSessionId: string | null = null;
  private currentLessonId: string | null = null;
  private currentHskLevel = 1;
  private currentStudentId = DEFAULT_STUDENT_ID;
  private currentStepId: string | null = null;

  // Active time tracking
  private activeTimeAccumulatorMs = 0;
  private lastActiveTimestamp = 0;
  private isTimerPaused = true;
  private stepStartTimestamp = 0;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private isVisibilityListenerAttached = false;
  private isCompletedSessionLogged = false;

  constructor() {
    this.setupVisibilityAndIdleHandling();
  }

  /**
   * Set the active student ID.
   */
  public setStudentId(studentId: string): void {
    this.currentStudentId = studentId || DEFAULT_STUDENT_ID;
  }

  /**
   * Current active session ID.
   */
  public getSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Start a new practice session for a lesson.
   */
  public startSession(lessonId: string, hskLevel: number, studentId?: string): string {
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.currentSessionId = sessionId;
    this.currentLessonId = lessonId;
    this.currentHskLevel = hskLevel;
    if (studentId) this.currentStudentId = studentId;

    this.activeTimeAccumulatorMs = 0;
    this.lastActiveTimestamp = Date.now();
    this.stepStartTimestamp = Date.now();
    this.isTimerPaused = false;
    this.isCompletedSessionLogged = false;

    this.recordEvent({
      eventType: 'practice_session_started',
      lessonId,
      hskLevel,
      durationMs: 0,
    });

    return sessionId;
  }

  /**
   * Resume an existing paused session.
   */
  public resumeSession(sessionId: string): void {
    if (this.currentSessionId !== sessionId) {
      this.currentSessionId = sessionId;
    }
    this.isTimerPaused = false;
    this.lastActiveTimestamp = Date.now();
    this.resetIdleTimer();

    this.recordEvent({
      eventType: 'practice_session_resumed',
      durationMs: 0,
    });
  }

  /**
   * Pause the active practice session (e.g. when modal closes or user navigates away).
   */
  public pauseSession(reason = 'modal_closed'): void {
    if (!this.currentSessionId) return;

    this.flushActiveTime();
    this.isTimerPaused = true;

    this.recordEvent({
      eventType: 'practice_session_paused',
      durationMs: this.activeTimeAccumulatorMs,
      metadata: { reason },
    });
  }

  /**
   * Complete the session (idempotent, only logs once per session).
   */
  public completeSession(quizScore?: number, totalQuestions?: number, xpEarned?: number): void {
    if (!this.currentSessionId || this.isCompletedSessionLogged) return;

    this.flushActiveTime();
    this.isTimerPaused = true;
    this.isCompletedSessionLogged = true;

    const metadata: Record<string, string | number | boolean> = {};
    if (typeof quizScore === 'number') metadata.quizScore = quizScore;
    if (typeof totalQuestions === 'number') metadata.totalQuestions = totalQuestions;
    if (typeof xpEarned === 'number') metadata.xpEarned = xpEarned;

    this.recordEvent({
      eventType: 'practice_session_completed',
      durationMs: this.activeTimeAccumulatorMs,
      metadata,
    });
  }

  /**
   * Track entering a practice step.
   */
  public trackStepEntered(stepId: string, stepIndex: number): void {
    this.flushActiveTime();
    this.currentStepId = stepId;
    this.stepStartTimestamp = Date.now();
    this.resetIdleTimer();

    this.recordEvent({
      eventType: 'practice_step_entered',
      stepId,
      metadata: { stepIndex: stepIndex + 1 },
      durationMs: 0,
    });
  }

  /**
   * Track completing a practice step.
   */
  public trackStepCompleted(stepId: string, stepIndex: number): void {
    this.flushActiveTime();
    const duration = Math.max(0, Date.now() - this.stepStartTimestamp);

    this.recordEvent({
      eventType: 'practice_step_completed',
      stepId,
      durationMs: duration,
      metadata: { stepIndex: stepIndex + 1 },
    });
  }

  /**
   * Track student response to a question or interactive prompt.
   */
  public trackQuestionAnswered(payload: {
    questionId: string;
    attemptNumber: number;
    isCorrect: boolean;
    durationMs?: number;
    metadata?: Record<string, string | number | boolean>;
  }): void {
    this.resetIdleTimer();
    this.recordEvent({
      eventType: 'question_answered',
      questionId: payload.questionId,
      attemptNumber: payload.attemptNumber,
      correctness: payload.isCorrect,
      durationMs: Math.max(0, payload.durationMs ?? 0),
      metadata: payload.metadata,
    });
  }

  /**
   * Track when a question is retried.
   */
  public trackQuestionRetried(payload: { questionId: string; attemptNumber: number }): void {
    this.resetIdleTimer();
    this.recordEvent({
      eventType: 'question_retried',
      questionId: payload.questionId,
      attemptNumber: payload.attemptNumber,
      durationMs: 0,
    });
  }

  /**
   * Track request for hint or explanation assistance.
   */
  public trackHintRequested(stepId?: string, questionId?: string): void {
    this.resetIdleTimer();
    this.recordEvent({
      eventType: 'hint_requested',
      stepId: stepId || this.currentStepId || undefined,
      questionId,
      durationMs: 0,
    });
  }

  /**
   * Track audio pronunciation playback.
   */
  public trackPronunciationPlayed(hanzi: string, pinyin?: string): void {
    this.resetIdleTimer();
    this.recordEvent({
      eventType: 'pronunciation_played',
      durationMs: 0,
      metadata: { hanzi, pinyin: pinyin || '' },
    });
  }

  /**
   * Track vocabulary reviewed in flashcard or list.
   */
  public trackVocabularyReviewed(vocabId: string, hanzi: string): void {
    this.resetIdleTimer();
    this.recordEvent({
      eventType: 'vocabulary_reviewed',
      durationMs: 0,
      metadata: { vocabId, hanzi },
    });
  }

  /**
   * Track quiz submission.
   */
  public trackQuizSubmitted(score: number, total: number, durationMs = 0): void {
    this.resetIdleTimer();
    this.recordEvent({
      eventType: 'quiz_submitted',
      durationMs: Math.max(0, durationMs),
      metadata: { score, total, percentage: Math.round((score / (total || 1)) * 100) },
    });
  }

  /**
   * Retrieve total accumulated active learning time for current session.
   */
  public getActiveTimeMs(): number {
    this.flushActiveTime();
    return this.activeTimeAccumulatorMs;
  }

  /**
   * Synthesize aggregated summary for future AI personalization.
   */
  public generateBehaviorSummary(
    events?: LearningEvent[],
    studentId?: string
  ): LearningBehaviorSummary {
    const evts = events || learningEventStore.getEvents({ studentId: studentId || this.currentStudentId });
    const targetStudent = studentId || this.currentStudentId;

    if (evts.length === 0) {
      return {
        studentId: targetStudent,
        periodStart: Date.now(),
        periodEnd: Date.now(),
        activeLearningTimeMs: 0,
        totalAttempts: 0,
        correctAttempts: 0,
        accuracyRate: 1,
        weakSkillTags: [],
        hintUsageCount: 0,
        completedSessions: 0,
        averageStepTimeMs: 0,
      };
    }

    let minTime = Infinity;
    let maxTime = -Infinity;
    let totalAttempts = 0;
    let correctAttempts = 0;
    let hintCount = 0;
    let completedSessions = 0;
    let totalStepTime = 0;
    let stepCompletedCount = 0;
    const incorrectTagsCount: Record<string, number> = {};

    evts.forEach((ev) => {
      if (ev.timestamp < minTime) minTime = ev.timestamp;
      if (ev.timestamp > maxTime) maxTime = ev.timestamp;

      if (ev.eventType === 'question_answered') {
        totalAttempts++;
        if (ev.correctness === true) {
          correctAttempts++;
        } else if (ev.correctness === false) {
          const tag = (ev.metadata?.category as string) || (ev.stepId as string) || 'general';
          incorrectTagsCount[tag] = (incorrectTagsCount[tag] || 0) + 1;
        }
      }

      if (ev.eventType === 'hint_requested') {
        hintCount++;
      }

      if (ev.eventType === 'practice_session_completed') {
        completedSessions++;
      }

      if (ev.eventType === 'practice_step_completed') {
        totalStepTime += ev.durationMs;
        stepCompletedCount++;
      }
    });

    const accuracyRate = totalAttempts > 0 ? +(correctAttempts / totalAttempts).toFixed(3) : 1;
    const weakSkillTags = Object.entries(incorrectTagsCount)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);

    const averageStepTimeMs = stepCompletedCount > 0
      ? Math.round(totalStepTime / stepCompletedCount)
      : 0;

    return {
      studentId: targetStudent,
      periodStart: minTime === Infinity ? Date.now() : minTime,
      periodEnd: maxTime === -Infinity ? Date.now() : maxTime,
      activeLearningTimeMs: totalStepTime,
      totalAttempts,
      correctAttempts,
      accuracyRate,
      weakSkillTags,
      hintUsageCount: hintCount,
      completedSessions,
      averageStepTimeMs,
    };
  }

  // --- Private Helpers ---

  private recordEvent(partial: {
    eventType: LearningEventType;
    lessonId?: string;
    hskLevel?: number;
    stepId?: string;
    questionId?: string;
    durationMs?: number;
    attemptNumber?: number;
    correctness?: boolean;
    metadata?: Record<string, string | number | boolean>;
  }): void {
    const event: LearningEvent = {
      eventId: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      schemaVersion: SCHEMA_VERSION,
      sessionId: this.currentSessionId || `unattached-${Date.now()}`,
      studentId: this.currentStudentId,
      lessonId: partial.lessonId || this.currentLessonId || 'unknown-lesson',
      hskLevel: partial.hskLevel || this.currentHskLevel || 1,
      stepId: partial.stepId || this.currentStepId || undefined,
      questionId: partial.questionId,
      eventType: partial.eventType,
      timestamp: Date.now(),
      durationMs: Math.max(0, partial.durationMs ?? 0),
      attemptNumber: partial.attemptNumber,
      correctness: partial.correctness,
      metadata: partial.metadata,
    };

    learningEventStore.saveEvent(event);
  }

  private flushActiveTime(): void {
    if (this.isTimerPaused) return;
    const now = Date.now();
    const elapsed = Math.max(0, now - this.lastActiveTimestamp);
    // Discard spikes if user was idle
    if (elapsed < IDLE_TIMEOUT_MS) {
      this.activeTimeAccumulatorMs += elapsed;
    }
    this.lastActiveTimestamp = now;
  }

  private setupVisibilityAndIdleHandling(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined' || this.isVisibilityListenerAttached) return;

    // Handle tab visibility change (Page Visibility API)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushActiveTime();
        this.isTimerPaused = true;
      } else if (this.currentSessionId && !this.isCompletedSessionLogged) {
        this.lastActiveTimestamp = Date.now();
        this.isTimerPaused = false;
        this.resetIdleTimer();
      }
    });

    // Reset idle timeout on key educational interactions
    const onUserInteraction = () => {
      if (this.isTimerPaused && this.currentSessionId && !this.isCompletedSessionLogged && document.visibilityState === 'visible') {
        this.lastActiveTimestamp = Date.now();
        this.isTimerPaused = false;
      }
      this.resetIdleTimer();
    };

    window.addEventListener('pointerdown', onUserInteraction, { passive: true });
    window.addEventListener('keydown', onUserInteraction, { passive: true });

    this.isVisibilityListenerAttached = true;
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.flushActiveTime();
      this.isTimerPaused = true;
    }, IDLE_TIMEOUT_MS);
  }
}

export const learningEventService = new LearningEventService();
