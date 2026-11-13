import { describe, it, expect, beforeEach, mock } from 'bun:test';
import {
  VideoLearningService,
  videoLearningService,
  STANDARD_VIDEO_TOPICS,
  type LearningVideo,
  type LearningVideoQuery,
  VideoLibraryPage,
} from '../features/videos';
import { HANBEEGO_STUDENT_NAV_GROUPS } from '../config/student-navigation.config';

describe('Video Learning Library Integration & Architecture Contract', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('1. Navigation & Routing Contract', () => {
    it('has "Học qua video" item mapped to /videos in KHÓA HỌC group of Student Sidebar', () => {
      const coursesGroup = HANBEEGO_STUDENT_NAV_GROUPS.find((g) => g.id === 'courses');
      expect(coursesGroup).toBeDefined();

      const videoItem = coursesGroup?.items.find((i) => i.id === 'videos');
      expect(videoItem).toBeDefined();
      expect(videoItem?.path).toBe('/videos');
      expect(videoItem?.label).toBe('Học qua video');
      expect(videoItem?.matchPrefixes).toContain('/videos');
    });

    it('exports VideoLibraryPage component properly', () => {
      expect(typeof VideoLibraryPage).toBe('function');
    });
  });

  describe('2. VideoLearningService Contract & Parameter Serialization', () => {
    it('serializes search, hskLevel, topic, sourceType, and pagination into query string', async () => {
      let interceptedUrl = '';
      const mockFetch = mock(async (url: string | URL | Request) => {
        interceptedUrl = String(url);
        return new Response(
          JSON.stringify({
            items: [
              {
                id: '11111111-1111-1111-1111-111111111111',
                title: 'Học tiếng Trung HSK 1 qua video YouTube',
                description: 'Đàm thoại cơ bản',
                sourceType: 'YouTube',
                youtubeVideoId: '4lHwBZr66so',
                storagePath: null,
                thumbnailUrl: 'https://img.youtube.com/vi/4lHwBZr66so/hqdefault.jpg',
                durationSeconds: 180,
                durationFormatted: '03:00',
                hskLevel: 1,
                topic: 'Giao tiếp hàng ngày',
                status: 'Published',
                viewCount: 150,
                lessonId: null,
                lessonTitle: null,
                createdAt: '2026-11-13T10:00:00Z',
                updatedAt: null,
              },
            ],
            totalItems: 1,
            page: 2,
            pageNumber: 2,
            pageSize: 12,
            totalPages: 1,
            hasPreviousPage: true,
            hasNextPage: false,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const service = new VideoLearningService();
      const query: LearningVideoQuery = {
        search: 'chào hỏi',
        hskLevel: 1,
        topic: 'Giao tiếp hàng ngày',
        sourceType: 'YouTube',
        page: 2,
        pageSize: 12,
      };

      const result = await service.fetchVideos(query);

      expect(interceptedUrl).toContain('/videos?');
      expect(interceptedUrl).toContain('search=ch%C3%A0o+h%E1%BB%8Fi');
      expect(interceptedUrl).toContain('hskLevel=1');
      expect(interceptedUrl).toContain('sourceType=YouTube');
      expect(interceptedUrl).toContain('page=2');
      expect(interceptedUrl).toContain('pageSize=12');

      expect(result.items.length).toBe(1);
      expect(result.items[0].sourceType).toBe('YouTube');
      expect(result.items[0].youtubeVideoId).toBe('4lHwBZr66so');
      expect(result.totalItems).toBe(1);
      expect(result.page).toBe(2);
    });

    it('returns null on 404 for non-existent or unpublished video in fetchVideoById', async () => {
      const mockFetch = mock(async () => {
        return new Response(JSON.stringify({ message: 'Không tìm thấy video.' }), {
          status: 404,
          statusText: 'Not Found',
        });
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const video = await videoLearningService.fetchVideoById('non-existent-id');
      expect(video).toBeNull();
    });

    it('falls back to standard topics when topic endpoint fails', async () => {
      const mockFetch = mock(async () => {
        return new Response(null, { status: 500 });
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const topics = await videoLearningService.fetchTopics();
      expect(topics).toEqual(STANDARD_VIDEO_TOPICS);
      expect(topics).toContain('Giao tiếp hàng ngày');
      expect(topics).toContain('Luyện thi HSK');
    });

    it('supports both YouTube and Uploaded video models in typed DTO', () => {
      const ytVideo: LearningVideo = {
        id: 'vid-yt',
        title: 'Video YouTube',
        description: 'Mô tả',
        sourceType: 'YouTube',
        youtubeVideoId: 'abc12345678',
        storagePath: null,
        thumbnailUrl: 'https://example.com/yt.jpg',
        durationSeconds: 240,
        durationFormatted: '04:00',
        hskLevel: 2,
        topic: 'Giao tiếp hàng ngày',
        status: 'Published',
        viewCount: 10,
        lessonId: null,
        lessonTitle: null,
        createdAt: '2026-11-13T10:00:00Z',
        updatedAt: null,
      };

      const uploadedVideo: LearningVideo = {
        id: 'vid-up',
        title: 'Video tự tải lên',
        description: 'Mô tả',
        sourceType: 'Uploaded',
        youtubeVideoId: null,
        storagePath: 'videos/hsk3/story.mp4',
        thumbnailUrl: 'https://example.com/up.jpg',
        durationSeconds: 360,
        durationFormatted: '06:00',
        hskLevel: 3,
        topic: 'Du lịch & Đời sống',
        status: 'Published',
        viewCount: 5,
        lessonId: null,
        lessonTitle: null,
        createdAt: '2026-11-13T10:00:00Z',
        updatedAt: null,
      };

      expect(ytVideo.sourceType).toBe('YouTube');
      expect(ytVideo.youtubeVideoId).toBe('abc12345678');
      expect(uploadedVideo.sourceType).toBe('Uploaded');
      expect(uploadedVideo.storagePath).toBe('videos/hsk3/story.mp4');
    });

    it('normalizes PascalCase youTubeVideoId from backend response to match frontend interface', async () => {
      const mockFetch = mock(async () => {
        return new Response(
          JSON.stringify({
            items: [
              {
                id: 'vid-case-test',
                title: 'Test PascalCase YouTube ID',
                sourceType: 'YouTube',
                youTubeVideoId: 'k38L07o_9zM', // PascalCase as serialized by some JSON engines
                durationSeconds: 150,
                status: 'Published',
              },
            ],
            totalItems: 1,
            page: 1,
            pageSize: 12,
            totalPages: 1,
          }),
          { status: 200 }
        );
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const service = new VideoLearningService();
      const res = await service.fetchVideos({});
      expect(res.items.length).toBe(1);
      expect(res.items[0].youtubeVideoId).toBe('k38L07o_9zM');
      expect(res.items[0].durationFormatted).toBe('02:30');
    });
  });
});

