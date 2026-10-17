/**
 * Learning Behavior Analytics & Event Tracking Types
 * Specification for educational event logging and telemetry
 */

export type LearningEventType =
  | 'practice_session_started'
  | 'practice_session_resumed'
  | 'practice_session_paused'
  | 'practice_session_completed'
  | 'practice_step_entered'
  | 'practice_step_completed'
  | 'question_answered'
  | 'question_retried'
  | 'hint_requested'
  | 'pronunciation_played'
  | 'vocabulary_reviewed'
  | 'quiz_submitted'
  | 'video_session_started'
  | 'video_played'
  | 'video_paused'
  | 'video_seeked'
  | 'subtitle_selected'
  | 'subtitle_repeated'
  | 'pinyin_toggled'
  | 'translation_toggled'
  | 'speaking_practice_started'
  | 'speaking_practice_completed'
  | 'vocabulary_saved'
  | 'video_session_completed';

export interface LearningEvent {
  /** Unique identifier for this event */
  eventId: string;
  /** Schema version for future-proof upgrades */
  schemaVersion: string;
  /** Session ID grouping activities in one continuous or resumed practice */
  sessionId: string;
  /** Student identifier (or local anonymous ID) */
  studentId: string;
  /** Curriculum lesson ID */
  lessonId: string;
  /** HSK level number */
  hskLevel: number;
  /** Specific step identifier (e.g. 'intro', 'vocabulary', 'quiz') */
  stepId?: string;
  /** Question identifier if applicable */
  questionId?: string;
  /** Educational event type */
  eventType: LearningEventType;
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Active interaction duration in milliseconds (measured, non-negative) */
  durationMs: number;
  /** Attempt sequence number for quiz/exercise questions (1-indexed) */
  attemptNumber?: number;
  /** Correctness result if applicable */
  correctness?: boolean;
  /** Whitelisted educational metadata (never sensitive user inputs) */
  metadata?: Record<string, string | number | boolean>;
}

export interface LearningBehaviorSummary {
  studentId: string;
  periodStart: number;
  periodEnd: number;
  /** Total active learning duration in ms (excluding idle & background tab time) */
  activeLearningTimeMs: number;
  totalAttempts: number;
  correctAttempts: number;
  /** Accuracy rate between 0.0 and 1.0 */
  accuracyRate: number;
  /** Skills or categories where accuracy was lower than target */
  weakSkillTags: string[];
  hintUsageCount: number;
  completedSessions: number;
  averageStepTimeMs: number;
}
