// @ts-ignore
import { describe, it, expect, beforeEach } from 'bun:test';
import {
  addVocabularyToSrs,
  introduceLessonVocabulary,
  type AddVocabularyPayload,
} from '../features/learning/services/learning-srs.service';
import { createInitialStudentLearningState } from '../features/learning/services/learning-storage.service';
import { DEMO_VIDEOS } from '../features/videos/data/demoVideos';
import { HSK_CURRICULUM } from '../features/learning/data/curriculumData';

// Polyfill localStorage for testing environment
const mockStorage: Record<string, string> = {};
if (typeof globalThis.localStorage === 'undefined') {
  const localStorageMock = {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      for (const k of Object.keys(mockStorage)) {
        delete mockStorage[k];
      }
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
}

describe('Phase FE-5.1: Functional Audit and Stabilization Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /* =========================================================================
     1. SRS PERSISTENCE & DUPLICATE PREVENTION
     ========================================================================= */
  describe('1. Vocabulary & SRS Persistence', () => {
    it('successfully introduces a new vocabulary word into SRS queue with 0 initial repetitions', () => {
      const state = createInitialStudentLearningState('usr-test');
      const payload: AddVocabularyPayload = {
        hanzi: '飞机',
        pinyin: 'fēijī',
        meaning: 'Máy bay',
        hskLevel: 2,
        source: 'Video: Giao thông',
      };

      const result = addVocabularyToSrs(state, payload);

      expect(result.isNew).toBe(true);
      expect(result.updatedState.userVocabStates[result.vocabularyId]).toBeDefined();
      expect(result.updatedState.userVocabStates[result.vocabularyId].status).toBe('learning');
      expect(result.updatedState.userVocabStates[result.vocabularyId].isDueToday).toBe(true);
      expect(result.updatedState.userSrsStates[result.vocabularyId]).toBeDefined();
      expect(result.updatedState.userSrsStates[result.vocabularyId].repetitions).toBe(0);
      expect(result.updatedState.userSrsStates[result.vocabularyId].interval).toBe(1);
    });

    it('prevents duplicate vocabulary addition for the same Hanzi', () => {
      const state = createInitialStudentLearningState('usr-test');
      const payload: AddVocabularyPayload = {
        hanzi: '车站',
        pinyin: 'chēzhàn',
        meaning: 'Bến xe, nhà ga',
        hskLevel: 2,
      };

      const firstAdd = addVocabularyToSrs(state, payload);
      expect(firstAdd.isNew).toBe(true);

      // Attempt second addition of identical word
      const duplicateAdd = addVocabularyToSrs(firstAdd.updatedState, payload);
      expect(duplicateAdd.isNew).toBe(false);
      // State remains identical
      expect(Object.keys(duplicateAdd.updatedState.userVocabStates).length).toBe(
        Object.keys(firstAdd.updatedState.userVocabStates).length
      );
    });

    it('retains preexisting vocabulary states without resetting progress', () => {
      let state = createInitialStudentLearningState('usr-test');
      state = introduceLessonVocabulary(state, 'les-8');

      const existingVocabCount = Object.keys(state.userVocabStates).length;
      expect(existingVocabCount).toBeGreaterThan(0);

      const payload: AddVocabularyPayload = {
        hanzi: '高铁',
        pinyin: 'gāotiě',
        meaning: 'Tàu cao tốc',
        hskLevel: 3,
      };

      const result = addVocabularyToSrs(state, payload);
      expect(result.isNew).toBe(true);
      expect(Object.keys(result.updatedState.userVocabStates).length).toBe(existingVocabCount + 1);
    });
  });

  /* =========================================================================
     2. VIDEO PLAYER STATES & PLAYABILITY
     ========================================================================= */
  describe('2. Video Player States & Source Differentiation', () => {
    it('distinguishes playable video with valid videoUrl from preview-only videos', () => {
      const playable = DEMO_VIDEOS.find((v) => v.id === 'vid-1');
      expect(playable).toBeDefined();
      expect(playable?.hasPlayableVideo).toBe(true);
      expect(playable?.videoUrl).toBeDefined();
      expect(playable?.videoUrl?.startsWith('http')).toBe(true);
      expect(playable?.videoStatus).toBe('ready');

      const previewOnly = DEMO_VIDEOS.find((v) => v.id === 'vid-2');
      expect(previewOnly).toBeDefined();
      expect(previewOnly?.hasPlayableVideo).toBe(false);
      expect(previewOnly?.videoUrl).toBeUndefined();
      expect(previewOnly?.videoStatus).toBe('preview_only');
    });

    it('correctly reports non-playable state when videoUrl is missing or undefined', () => {
      const nonPlayableVideos = DEMO_VIDEOS.filter((v) => !v.hasPlayableVideo || !v.videoUrl);
      expect(nonPlayableVideos.length).toBeGreaterThan(0);
      nonPlayableVideos.forEach((v) => {
        expect(v.videoUrl).toBeUndefined();
        expect(v.hasPlayableVideo).toBe(false);
      });
    });
  });

  /* =========================================================================
     3. SUBTITLE SEEKING & SYNC LOGIC
     ========================================================================= */
  describe('3. Subtitle Seeking and Synchronization', () => {
    it('correctly maps currentTime to active subtitle line', () => {
      const video = DEMO_VIDEOS[0];
      expect(video.subtitles.length).toBeGreaterThan(0);

      // Test midpoint of first subtitle (0 to 4s)
      const time1 = 2;
      const sub1Index = video.subtitles.findIndex(
        (s) => time1 >= s.startTime && time1 <= s.endTime
      );
      expect(sub1Index).toBe(0);
      expect(video.subtitles[sub1Index].hanzi).toBe('你好！很高兴认识你。');

      // Test midpoint of second subtitle (4 to 9s)
      const time2 = 6;
      const sub2Index = video.subtitles.findIndex(
        (s) => time2 >= s.startTime && time2 <= s.endTime
      );
      expect(sub2Index).toBe(1);
      expect(video.subtitles[sub2Index].hanzi).toBe('我叫明英，我是越南人。');
    });

    it('returns -1 when currentTime is out of range', () => {
      const video = DEMO_VIDEOS[0];
      const timeOutOfRange = 9999;
      const subIndex = video.subtitles.findIndex(
        (s) => timeOutOfRange >= s.startTime && timeOutOfRange <= s.endTime
      );
      expect(subIndex).toBe(-1);
    });
  });

  /* =========================================================================
     4. REAL LEARNING METRICS: DYNAMIC HSK PROGRESS
     ========================================================================= */
  describe('4. Dynamic HSK Progress Calculation', () => {
    it('computes 0% progress for levels without completed lessons rather than hardcoded 65%', () => {
      const state = createInitialStudentLearningState('usr-test');
      const curLevel1 = HSK_CURRICULUM[1];
      const lessons = curLevel1.units.flatMap((u) => u.lessons);

      const completedCount = lessons.filter(
        (l) => state.lessonProgress[l.id]?.status === 'COMPLETED'
      ).length;

      const progressPercent = Math.round((completedCount / curLevel1.totalLessons) * 100);

      expect(completedCount).toBe(0);
      expect(progressPercent).toBe(0);
      expect(progressPercent).not.toBe(65);
    });

    it('correctly reflects real progress when lessons are marked COMPLETED', () => {
      const state = createInitialStudentLearningState('usr-test');
      const curLevel1 = HSK_CURRICULUM[1];
      const lessons = curLevel1.units.flatMap((u) => u.lessons);

      // Simulate completing 3 lessons in HSK 1
      state.lessonProgress[lessons[0].id] = {
        userId: 'usr-test',
        lessonId: lessons[0].id,
        status: 'COMPLETED',
        currentStepIndex: 5,
        maxUnlockedStepIndex: 5,
        xpEarned: 50,
        updatedAt: new Date().toISOString(),
      };
      state.lessonProgress[lessons[1].id] = {
        userId: 'usr-test',
        lessonId: lessons[1].id,
        status: 'COMPLETED',
        currentStepIndex: 5,
        maxUnlockedStepIndex: 5,
        xpEarned: 50,
        updatedAt: new Date().toISOString(),
      };
      state.lessonProgress[lessons[2].id] = {
        userId: 'usr-test',
        lessonId: lessons[2].id,
        status: 'COMPLETED',
        currentStepIndex: 5,
        maxUnlockedStepIndex: 5,
        xpEarned: 50,
        updatedAt: new Date().toISOString(),
      };

      const completedCount = lessons.filter(
        (l) => state.lessonProgress[l.id]?.status === 'COMPLETED'
      ).length;

      const progressPercent = Math.round((completedCount / curLevel1.totalLessons) * 100);

      expect(completedCount).toBe(3);
      expect(progressPercent).toBe(Math.round((3 / curLevel1.totalLessons) * 100));
      expect(progressPercent).toBeGreaterThan(0);
    });
  });

  /* =========================================================================
     5. REAL STREAK & WEEKDAY CALCULATION
     ========================================================================= */
  describe('5. Real Weekday Streak Calculation', () => {
    it('computes week day activity from dailyActivityHistory', () => {
      const state = createInitialStudentLearningState('usr-test');
      const todayStr = new Date().toISOString().split('T')[0];

      // Reset activity history to only have today's activity
      state.dailyActivityHistory = {
        [todayStr]: {
          date: todayStr,
          minutes: 15,
          xpEarned: 40,
          completedLessons: ['les-8'],
          exercisesCompleted: 5,
          reviewsCompleted: 10,
        },
      };

      const now = new Date();
      const currentDayOfWeek = now.getDay();
      const dayIndex = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

      const monday = new Date(now);
      monday.setDate(now.getDate() - dayIndex);

      const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      const weekdays = labels.map((label, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const act = state.dailyActivityHistory[dateStr];
        const hasAct = Boolean(act && (act.minutes > 0 || act.xpEarned > 0));
        return { label, date: dateStr, active: hasAct, isToday: i === dayIndex };
      });

      const todayPill = weekdays.find((w) => w.isToday);
      expect(todayPill).toBeDefined();
      expect(todayPill?.active).toBe(true);

      // Days with no activity remain inactive
      const inactiveDays = weekdays.filter((w) => !w.isToday);
      inactiveDays.forEach((w) => {
        expect(w.active).toBe(false);
      });
    });
  });

  /* =========================================================================
     6. VIDEO FILTERING & EMPTY STATE DETECTION
     ========================================================================= */
  describe('6. Video Filtering and Dataset Compatibility', () => {
    it('filters videos accurately by HSK level', () => {
      const hsk1Videos = DEMO_VIDEOS.filter((v) => v.hskLevel === 1);
      expect(hsk1Videos.length).toBeGreaterThan(0);
      hsk1Videos.forEach((v) => expect(v.hskLevel).toBe(1));

      const hsk2Videos = DEMO_VIDEOS.filter((v) => v.hskLevel === 2);
      expect(hsk2Videos.length).toBeGreaterThan(0);
      hsk2Videos.forEach((v) => expect(v.hskLevel).toBe(2));
    });

    it('filters videos accurately by topic (food, daily, travel)', () => {
      const foodVideos = DEMO_VIDEOS.filter((v) => v.topic === 'food');
      expect(foodVideos.length).toBeGreaterThan(0);
      foodVideos.forEach((v) => expect(v.topic).toBe('food'));

      const travelVideos = DEMO_VIDEOS.filter((v) => v.topic === 'travel');
      expect(travelVideos.length).toBeGreaterThan(0);
      travelVideos.forEach((v) => expect(v.topic).toBe('travel'));
    });

    it('returns empty array when search query matches no items', () => {
      const query = 'xyz123_non_existent_topic';
      const results = DEMO_VIDEOS.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.chineseTitle.includes(query) ||
          v.description.toLowerCase().includes(query)
      );
      expect(results.length).toBe(0);
    });
  });
});
