// @ts-ignore
import { describe, it, expect, beforeEach } from 'bun:test';
import { demoVideos } from '../features/videos/data/demoVideos';
import {
  Html5VideoAdapter,
  PreviewVideoAdapter,
  YouTubeIFrameAdapter,
} from '../features/videos/adapters';
import type { VideoSubtitleLine } from '../features/videos/types';
import {
  learningEventStore,
} from '../features/learning/services/learning-event-store.service';
import type { LearningEvent } from '../features/learning/types/learning-event.types';

describe('FE-7: Interactive Chinese Video Learning', () => {
  beforeEach(() => {
    localStorage.clear();
    learningEventStore.setAnalyticsConsent(true);
  });

  describe('1. Video Dataset & Verified Source Classification', () => {
    it('should contain verified YouTube podcast video with embeddable permissions', () => {
      const ytVideo = demoVideos.find((v) => v.id === 'vid-yt-1');
      expect(ytVideo).toBeDefined();
      expect(ytVideo?.videoSourceType).toBe('youtube');
      expect(ytVideo?.youtubeVideoId).toBe('4lHwBZr66so');
      expect(ytVideo?.hasPlayableVideo).toBe(true);
      expect(ytVideo?.hasCaptions).toBe(true);
      expect(ytVideo?.subtitles.length).toBeGreaterThan(0);
      expect(ytVideo?.subtitles[0].hanzi).toBeDefined();
      expect(ytVideo?.subtitles[0].pinyin).toBeDefined();
      expect(ytVideo?.subtitles[0].vietnamese).toBeDefined();
    });

    it('should distinguish preview study materials from direct video streams', () => {
      const previewVideo = demoVideos.find((v) => v.id === 'vid-2');
      expect(previewVideo).toBeDefined();
      expect(previewVideo?.videoSourceType).toBe('preview');
      expect(previewVideo?.externalSourceUrl).toContain('drive.google.com');
      expect(previewVideo?.sourceNote).toContain('PDF');
      expect(previewVideo?.hasPlayableVideo).toBe(false);
      expect(previewVideo?.hasCaptions).toBe(true);
    });

    it('should provide complete subtitles with token breakdown for vocabulary learning', () => {
      const vid1 = demoVideos.find((v) => v.id === 'vid-1');
      expect(vid1).toBeDefined();
      expect(vid1?.videoSourceType).toBe('html5');
      expect(vid1?.subtitles.length).toBeGreaterThan(0);

      const firstLine = vid1?.subtitles[0];
      expect(firstLine?.tokens).toBeDefined();
      expect(firstLine?.tokens?.length).toBeGreaterThan(0);
      expect(firstLine?.tokens?.[0].hanzi).toBeDefined();
      expect(firstLine?.tokens?.[0].pinyin).toBeDefined();
      expect(firstLine?.tokens?.[0].meaning).toBeDefined();
    });
  });

  describe('2. Video Player Adapters Interface & Behavior', () => {
    it('PreviewVideoAdapter should simulate playback and time subscription', () => {
      const adapter = new PreviewVideoAdapter(120);

      expect(adapter.getDuration()).toBe(120);
      expect(adapter.getCurrentTime()).toBe(0);
      expect(adapter.getPlaybackState()).toBe('paused');

      let receivedTime = 0;
      adapter.subscribeToTimeUpdates((t) => {
        receivedTime = t;
      });

      adapter.seekTo(15);
      expect(adapter.getCurrentTime()).toBe(15);
      expect(receivedTime).toBe(15);

      adapter.play();
      expect(adapter.getPlaybackState()).toBe('playing');

      adapter.pause();
      expect(adapter.getPlaybackState()).toBe('paused');

      adapter.destroy();
    });

    it('Html5VideoAdapter should implement standard player controls and cleanup', () => {
      // Mock HTMLVideoElement
      const listeners: Record<string, Function[]> = {};
      const mockVideoElement = {
        currentTime: 0,
        duration: 90,
        playbackRate: 1.0,
        play: () => Promise.resolve(),
        pause: () => {},
        addEventListener: (event: string, cb: Function) => {
          if (!listeners[event]) listeners[event] = [];
          listeners[event].push(cb);
        },
        removeEventListener: (event: string, cb: Function) => {
          if (listeners[event]) {
            listeners[event] = listeners[event].filter((f) => f !== cb);
          }
        },
      } as unknown as HTMLVideoElement;

      let currentTimeReceived = 0;
      const adapter = new Html5VideoAdapter(mockVideoElement);
      adapter.subscribeToTimeUpdates((t) => {
        currentTimeReceived = t;
      });

      expect(adapter.getDuration()).toBe(90);

      adapter.seekTo(25);
      expect(mockVideoElement.currentTime).toBe(25);

      adapter.setPlaybackRate(1.25);
      expect(mockVideoElement.playbackRate).toBe(1.25);

      // Trigger mock timeupdate event
      mockVideoElement.currentTime = 30;
      if (listeners['timeupdate']) {
        listeners['timeupdate'].forEach((fn) => fn());
      }
      expect(currentTimeReceived).toBe(30);

      adapter.destroy();
      // Listeners should be cleaned up
      expect(listeners['timeupdate'].length).toBe(0);
    });

    it('YouTubeIFrameAdapter should conform to standard VideoPlayerAdapter interface', () => {
      const adapter = new YouTubeIFrameAdapter('test-yt-container', '4lHwBZr66so');

      expect(typeof adapter.play).toBe('function');
      expect(typeof adapter.pause).toBe('function');
      expect(typeof adapter.seekTo).toBe('function');
      expect(typeof adapter.getCurrentTime).toBe('function');
      expect(typeof adapter.getDuration).toBe('function');
      expect(typeof adapter.setPlaybackRate).toBe('function');
      expect(typeof adapter.destroy).toBe('function');

      adapter.destroy();
    });
  });

  describe('3. Subtitle Timestamp Synchronization & Loop Boundary Logic', () => {
    const sampleSubtitles: VideoSubtitleLine[] = [
      {
        id: 'sub-1',
        startTime: 0,
        endTime: 4.5,
        hanzi: '你好，欢迎来到北京！',
        pinyin: 'Nǐ hǎo, huānyíng lái dào Běijīng!',
        vietnamese: 'Xin chào, chào mừng bạn đến với Bắc Kinh!',
      },
      {
        id: 'sub-2',
        startTime: 5.0,
        endTime: 8.5,
        hanzi: '今天天气非常晴朗。',
        pinyin: 'Jīntiān tiānqì fēicháng qínglǎng.',
        vietnamese: 'Hôm nay thời tiết rất trong xanh.',
      },
      {
        id: 'sub-3',
        startTime: 9.0,
        endTime: 13.0,
        hanzi: '我们一起去故宫看看吧。',
        pinyin: 'Wǒmen yīqǐ qù Gùgōng kànkan ba.',
        vietnamese: 'Chúng ta cùng nhau đi Cố Cung xem nhé.',
      },
    ];

    it('should find active subtitle line based on current playback time', () => {
      const findActive = (time: number) =>
        sampleSubtitles.find((sub) => time >= sub.startTime && time <= sub.endTime);

      expect(findActive(2.0)?.id).toBe('sub-1');
      expect(findActive(4.8)).toBeUndefined(); // Gap between sub-1 and sub-2
      expect(findActive(6.5)?.id).toBe('sub-2');
      expect(findActive(10.0)?.id).toBe('sub-3');
    });

    it('should correctly determine repeat loop boundaries', () => {
      const targetSub = sampleSubtitles[1]; // sub-2 (5.0 to 8.5)
      const isLoopActive = true;

      const shouldRewind = (currentTime: number, loopSub: VideoSubtitleLine | null, looping: boolean) => {
        if (!looping || !loopSub) return false;
        return currentTime >= loopSub.endTime;
      };

      expect(shouldRewind(7.0, targetSub, isLoopActive)).toBe(false);
      expect(shouldRewind(8.5, targetSub, isLoopActive)).toBe(true);
      expect(shouldRewind(8.6, targetSub, isLoopActive)).toBe(true);
      expect(shouldRewind(8.6, targetSub, false)).toBe(false);
    });
  });

  describe('4. Video Library Filter Logic', () => {
    it('should filter by HSK level correctly', () => {
      const hsk1Videos = demoVideos.filter((v) => v.hskLevel === 1);
      const hsk2Videos = demoVideos.filter((v) => v.hskLevel === 2);
      const hsk3Videos = demoVideos.filter((v) => v.hskLevel === 3);

      expect(hsk1Videos.length).toBeGreaterThan(0);
      expect(hsk2Videos.length).toBeGreaterThan(0);
      expect(hsk3Videos.length).toBeGreaterThan(0);
      expect(hsk1Videos.every((v) => v.hskLevel === 1)).toBe(true);
    });

    it('should filter by topic correctly', () => {
      const travelVideos = demoVideos.filter((v) => v.topic === 'travel');
      expect(travelVideos.length).toBeGreaterThan(0);
      expect(travelVideos.every((v) => v.topic === 'travel')).toBe(true);
    });

    it('should filter by captions and speaking practice flags', () => {
      const withCaptions = demoVideos.filter((v) => v.hasCaptions);
      const withSpeaking = demoVideos.filter((v) => v.hasSpeakingPractice);

      expect(withCaptions.length).toBe(demoVideos.length); // all demo videos have curated transcript
      expect(withSpeaking.length).toBeGreaterThan(0);
    });

    it('should search across Vietnamese, Chinese, and Pinyin terms', () => {
      const query = 'Bắc Kinh';
      const results = demoVideos.filter((v) => {
        const q = query.toLowerCase();
        return (
          v.title.toLowerCase().includes(q) ||
          (v.chineseTitle && v.chineseTitle.includes(q)) ||
          v.description.toLowerCase().includes(q)
        );
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((v) => v.title.includes('Bắc Kinh'))).toBe(true);
      expect(results.every((v) =>
        v.title.toLowerCase().includes('bắc kinh') ||
        (v.chineseTitle && v.chineseTitle.includes('北京')) ||
        v.description.toLowerCase().includes('bắc kinh')
      )).toBe(true);
    });
  });

  describe('5. SRS Vocabulary Persistence from Subtitles', () => {
    it('should save vocabulary item to localStorage SRS store without duplication', () => {
      const STORAGE_KEY = 'zhongwenhub_srs_deck_v1';
      const initialDeck: any[] = [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDeck));

      const newWord = {
        id: 'srs-token-beijing',
        hanzi: '北京',
        pinyin: 'Běijīng',
        vietnamese: 'Bắc Kinh (thủ đô Trung Quốc)',
        hskLevel: 1,
        addedAt: Date.now(),
      };

      // Add first time
      const deck = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!deck.some((item: any) => item.hanzi === newWord.hanzi)) {
        deck.push(newWord);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
      }

      let stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored.length).toBe(1);
      expect(stored[0].hanzi).toBe('北京');

      // Attempt duplicate addition
      if (!stored.some((item: any) => item.hanzi === newWord.hanzi)) {
        stored.push(newWord);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      }

      const storedAfterDuplicate = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(storedAfterDuplicate.length).toBe(1); // No duplicates
    });
  });

  describe('6. Educational Behavior Telemetry for Interactive Video Learning', () => {
    it('should record comprehensive video learning session events', () => {
      const sessionId = 'video-sess-fe7-1';

      // 1. Session start
      const startEv: LearningEvent = {
        eventId: 'v-ev-start',
        schemaVersion: '1.0.0',
        sessionId,
        studentId: 'student-tester',
        lessonId: 'vid-yt-1',
        hskLevel: 2,
        eventType: 'video_session_started',
        timestamp: Date.now(),
        durationMs: 0,
      };
      learningEventStore.saveEvent(startEv);

      // 2. Subtitle selected for loop practice
      const loopEv: LearningEvent = {
        eventId: 'v-ev-loop',
        schemaVersion: '1.0.0',
        sessionId,
        studentId: 'student-tester',
        lessonId: 'vid-yt-1',
        hskLevel: 2,
        eventType: 'subtitle_repeated',
        timestamp: Date.now() + 10000,
        durationMs: 4500,
        metadata: { interactionCount: 3 }, // Repeated 3 times
      };
      learningEventStore.saveEvent(loopEv);

      // 3. Speaking practice completed
      const speakEv: LearningEvent = {
        eventId: 'v-ev-speak',
        schemaVersion: '1.0.0',
        sessionId,
        studentId: 'student-tester',
        lessonId: 'vid-yt-1',
        hskLevel: 2,
        eventType: 'speaking_practice_completed',
        timestamp: Date.now() + 25000,
        durationMs: 6200,
      };
      learningEventStore.saveEvent(speakEv);

      // 4. Vocabulary saved to SRS
      const vocabEv: LearningEvent = {
        eventId: 'v-ev-vocab',
        schemaVersion: '1.0.0',
        sessionId,
        studentId: 'student-tester',
        lessonId: 'vid-yt-1',
        hskLevel: 2,
        eventType: 'vocabulary_saved',
        timestamp: Date.now() + 35000,
        durationMs: 0,
      };
      learningEventStore.saveEvent(vocabEv);

      // 5. Session completed
      const endEv: LearningEvent = {
        eventId: 'v-ev-end',
        schemaVersion: '1.0.0',
        sessionId,
        studentId: 'student-tester',
        lessonId: 'vid-yt-1',
        hskLevel: 2,
        eventType: 'video_session_completed',
        timestamp: Date.now() + 60000,
        durationMs: 60000,
      };
      learningEventStore.saveEvent(endEv);

      const savedEvents = learningEventStore.getEvents({ sessionId });
      expect(savedEvents.length).toBe(5);

      const eventTypes = savedEvents.map((e) => e.eventType);
      expect(eventTypes).toContain('video_session_started');
      expect(eventTypes).toContain('subtitle_repeated');
      expect(eventTypes).toContain('speaking_practice_completed');
      expect(eventTypes).toContain('vocabulary_saved');
      expect(eventTypes).toContain('video_session_completed');
    });

    it('should drop video telemetry when analytics consent is false', () => {
      learningEventStore.setAnalyticsConsent(false);

      const blockedEv: LearningEvent = {
        eventId: 'v-ev-blocked',
        schemaVersion: '1.0.0',
        sessionId: 'sess-blocked',
        studentId: 'student-tester',
        lessonId: 'vid-yt-1',
        hskLevel: 2,
        eventType: 'video_session_started',
        timestamp: Date.now(),
        durationMs: 0,
      };
      learningEventStore.saveEvent(blockedEv);

      const events = learningEventStore.getEvents({ sessionId: 'sess-blocked' });
      expect(events.length).toBe(0);
    });
  });
});
