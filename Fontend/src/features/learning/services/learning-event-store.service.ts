import type { LearningEvent } from '../types/learning-event.types';

const STORAGE_KEY_EVENTS = 'zh_learning_telemetry_events';
const STORAGE_KEY_CONSENT = 'zh_learning_analytics_consent';
const MAX_STORED_EVENTS = 500;

/**
 * Storage adapter for educational telemetry events.
 * Implements retention limits, privacy consent control, and local persistence.
 */
export class LearningEventStore {
  /**
   * Check if user has consented to learning analytics telemetry.
   * Defaults to true, can be toggled by the user in settings.
   */
  public isAnalyticsConsentGranted(): boolean {
    try {
      const consent = localStorage.getItem(STORAGE_KEY_CONSENT);
      if (consent === null) return true; // Default opt-in
      return consent === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Set user consent for learning analytics telemetry.
   */
  public setAnalyticsConsent(granted: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEY_CONSENT, String(granted));
      if (!granted) {
        // If consent is withdrawn, clear existing telemetry events
        this.clearAnalyticsData();
      }
    } catch (e) {
      console.warn('[LearningEventStore] Failed to update analytics consent:', e);
    }
  }

  /**
   * Save a single educational event with retention management.
   * If consent is not granted, the event is immediately discarded.
   */
  public saveEvent(event: LearningEvent): void {
    if (!this.isAnalyticsConsentGranted()) {
      return; // Privacy gate: drop event if not consented
    }

    try {
      const existing = this.getAllEventsRaw();

      // Check for duplicate eventId
      if (existing.some((e) => e.eventId === event.eventId)) {
        return;
      }

      existing.push(event);

      // Enforce retention policy: prune oldest events if exceeding MAX_STORED_EVENTS
      let trimmed = existing;
      if (existing.length > MAX_STORED_EVENTS) {
        trimmed = existing.slice(existing.length - MAX_STORED_EVENTS);
      }

      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('[LearningEventStore] Error persisting telemetry event:', e);
    }
  }

  /**
   * Batch save multiple educational events.
   */
  public saveEvents(events: LearningEvent[]): void {
    if (!this.isAnalyticsConsentGranted() || events.length === 0) {
      return;
    }

    try {
      const existing = this.getAllEventsRaw();
      const existingIds = new Set(existing.map((e) => e.eventId));

      const newEvents = events.filter((e) => !existingIds.has(e.eventId));
      if (newEvents.length === 0) return;

      const combined = [...existing, ...newEvents];
      const trimmed = combined.length > MAX_STORED_EVENTS
        ? combined.slice(combined.length - MAX_STORED_EVENTS)
        : combined;

      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('[LearningEventStore] Error persisting event batch:', e);
    }
  }

  /**
   * Query recorded events with optional filtering.
   */
  public getEvents(filter?: {
    sessionId?: string;
    lessonId?: string;
    studentId?: string;
  }): LearningEvent[] {
    const all = this.getAllEventsRaw();
    if (!filter) return all;

    return all.filter((ev) => {
      if (filter.sessionId && ev.sessionId !== filter.sessionId) return false;
      if (filter.lessonId && ev.lessonId !== filter.lessonId) return false;
      if (filter.studentId && ev.studentId !== filter.studentId) return false;
      return true;
    });
  }

  /**
   * Total number of stored events currently retained.
   */
  public getEventCount(): number {
    return this.getAllEventsRaw().length;
  }

  /**
   * Clear all telemetry events without touching essential LearningState, SRS, or progress.
   */
  public clearAnalyticsData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_EVENTS);
    } catch (e) {
      console.warn('[LearningEventStore] Failed to clear telemetry data:', e);
    }
  }

  private getAllEventsRaw(): LearningEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EVENTS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

export const learningEventStore = new LearningEventStore();
