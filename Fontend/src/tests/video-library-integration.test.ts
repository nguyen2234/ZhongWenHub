import { describe, it, expect, beforeEach, afterEach, afterAll, mock } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import {
  VideoLearningService,
  videoLearningService,
  STANDARD_VIDEO_TOPICS,
  type LearningVideo,
  type LearningVideoQuery,
  VideoLibraryPage,
  VideoDetailPage,
} from '../features/videos';
import { videoManagementService } from '../management/content-manager/services/video-management.service';
import { HANBEEGO_STUDENT_NAV_GROUPS } from '../config/student-navigation.config';

describe('Video Learning Library Integration & Architecture Contract', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = originalFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  afterAll(() => {
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

  describe('3. Fail-Closed Resilience & Zero-Demo Contract (Phase B1)', () => {
    it('fetchVideoById returns typed video detail with formatted duration on 200 OK', async () => {
      const mockFetch = mock(async () => {
        return new Response(
          JSON.stringify({
            id: 'real-vid-001',
            title: 'Học tiếng Trung HSK 1 thực tế',
            description: 'Mô tả bài học thực tế',
            sourceType: 'YouTube',
            youtubeVideoId: '4lHwBZr66so',
            storagePath: null,
            thumbnailUrl: 'https://img.youtube.com/vi/4lHwBZr66so/hqdefault.jpg',
            durationSeconds: 215,
            hskLevel: 1,
            topic: 'Giao tiếp hàng ngày',
            status: 'Published',
            viewCount: 42,
            lessonId: null,
            lessonTitle: null,
            transcriptPdfPath: null,
            transcriptPdfName: 'HSK1_Real.pdf',
            transcriptPdfSizeBytes: 204800,
            transcriptPdfUrl: 'https://cdn.example.com/pdf/HSK1_Real.pdf',
            createdAt: '2026-11-19T00:00:00Z',
            updatedAt: null,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const video = await videoLearningService.fetchVideoById('real-vid-001');
      expect(video).not.toBeNull();
      expect(video?.id).toBe('real-vid-001');
      expect(video?.title).toBe('Học tiếng Trung HSK 1 thực tế');
      expect(video?.durationFormatted).toBe('03:35');
      expect(video?.viewCount).toBe(42);
      expect(video?.transcriptPdfUrl).toBe('https://cdn.example.com/pdf/HSK1_Real.pdf');
    });

    it('fetchVideoById strictly returns null on HTTP 404 (Not Found semantic)', async () => {
      const mockFetch = mock(async () => {
        return new Response(JSON.stringify({ message: 'Không tìm thấy video học tập.' }), {
          status: 404,
          statusText: 'Not Found',
        });
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const video = await videoLearningService.fetchVideoById('missing-video-id');
      expect(video).toBeNull();
    });

    it('fetchVideoById throws fail-closed Error on HTTP 500 without masking as null', async () => {
      const mockFetch = mock(async () => {
        return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
          status: 500,
          statusText: 'Internal Server Error',
        });
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      let caughtError: Error | null = null;
      try {
        await videoLearningService.fetchVideoById('vid-500');
      } catch (err) {
        caughtError = err as Error;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toContain('500');
    });

    it('fetchVideoById throws fail-closed Error on network failure/timeout without returning null', async () => {
      const mockFetch = mock(async () => {
        throw new TypeError('Failed to fetch');
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      let caughtError: Error | null = null;
      try {
        await videoLearningService.fetchVideoById('vid-network-fail');
      } catch (err) {
        caughtError = err as Error;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toContain('Failed to fetch');
    });

    it('fetchVideoById throws fail-closed Error on HTTP 401 Unauthorized', async () => {
      const mockFetch = mock(async () => {
        return new Response(null, { status: 401, statusText: 'Unauthorized' });
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      let caughtError: Error | null = null;
      try {
        await videoLearningService.fetchVideoById('vid-401');
      } catch (err) {
        caughtError = err as Error;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toContain('401');
    });

    it('fetchVideoById throws fail-closed Error on HTTP 403 Forbidden', async () => {
      const mockFetch = mock(async () => {
        return new Response(null, { status: 403, statusText: 'Forbidden' });
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      let caughtError: Error | null = null;
      try {
        await videoLearningService.fetchVideoById('vid-403');
      } catch (err) {
        caughtError = err as Error;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toContain('403');
    });

    it('fetchVideoById rejects malformed payload by throwing schema validation error', async () => {
      const mockFetch = mock(async () => {
        return new Response(JSON.stringify({ notAnId: 123 }), { status: 200 });
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      let caughtError: Error | null = null;
      try {
        await videoLearningService.fetchVideoById('vid-malformed');
      } catch (err) {
        caughtError = err as Error;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toContain('không hợp lệ');
    });

    it('fetchVideos throws fail-closed Error on HTTP 500 without returning empty list', async () => {
      const mockFetch = mock(async () => {
        return new Response(null, { status: 500, statusText: 'Internal Server Error' });
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      let caughtError: Error | null = null;
      try {
        await videoLearningService.fetchVideos({});
      } catch (err) {
        caughtError = err as Error;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toContain('500');
    });

    it('fetchVideos rejects malformed payload where items is not array', async () => {
      const mockFetch = mock(async () => {
        return new Response(JSON.stringify({ items: 'not-an-array' }), { status: 200 });
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      let caughtError: Error | null = null;
      try {
        await videoLearningService.fetchVideos({});
      } catch (err) {
        caughtError = err as Error;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toContain('không hợp lệ');
    });

    it('videoManagementService.fetchVideoById strictly returns null on 404', async () => {
      const mockFetch = mock(async () => {
        return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const video = await videoManagementService.fetchVideoById('missing-mgmt-id');
      expect(video).toBeNull();
    });

    it('videoManagementService.fetchVideoById throws fail-closed Error on HTTP 500', async () => {
      const mockFetch = mock(async () => {
        return new Response(null, { status: 500, statusText: 'Server Error' });
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      let caughtError: Error | null = null;
      try {
        await videoManagementService.fetchVideoById('mgmt-500');
      } catch (err) {
        caughtError = err as Error;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toContain('500');
    });

    it('videoManagementService.fetchVideoById throws fail-closed Error on network failure', async () => {
      const mockFetch = mock(async () => {
        throw new TypeError('Network timeout');
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      let caughtError: Error | null = null;
      try {
        await videoManagementService.fetchVideoById('mgmt-timeout');
      } catch (err) {
        caughtError = err as Error;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toContain('Network timeout');
    });

    it('videoManagementService.fetchVideoById throws on 401 and 403', async () => {
      const mockFetch401 = mock(async () => new Response(null, { status: 401 }));
      globalThis.fetch = mockFetch401 as unknown as typeof fetch;

      let caught401: Error | null = null;
      try {
        await videoManagementService.fetchVideoById('mgmt-401');
      } catch (err) {
        caught401 = err as Error;
      }
      expect(caught401?.message).toContain('401');

      const mockFetch403 = mock(async () => new Response(null, { status: 403 }));
      globalThis.fetch = mockFetch403 as unknown as typeof fetch;

      let caught403: Error | null = null;
      try {
        await videoManagementService.fetchVideoById('mgmt-403');
      } catch (err) {
        caught403 = err as Error;
      }
      expect(caught403?.message).toContain('403');
    });

    it('videoManagementService.fetchVideos rejects malformed payload where items is not array', async () => {
      const mockFetch = mock(async () => {
        return new Response(JSON.stringify({ items: 'corrupted' }), { status: 200 });
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      let caughtError: Error | null = null;
      try {
        await videoManagementService.fetchVideos({});
      } catch (err) {
        caughtError = err as Error;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toContain('không hợp lệ');
    });

    it('fetchVideoById returns null for empty or whitespace id without sending request', async () => {
      let fetchCalled = false;
      const mockFetch = mock(async () => {
        fetchCalled = true;
        return new Response(null, { status: 200 });
      });
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const res1 = await videoLearningService.fetchVideoById('');
      const res2 = await videoLearningService.fetchVideoById('   ');
      expect(res1).toBeNull();
      expect(res2).toBeNull();
      expect(fetchCalled).toBe(false);
    });

    it('videoManagementService.fetchVideoById returns null for empty or whitespace id without sending request', async () => {
      let fetchCalled = false;
      const mockFetch = mock(async () => {
        fetchCalled = true;
        return new Response(null, { status: 200 });
      });
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const res1 = await videoManagementService.fetchVideoById('');
      const res2 = await videoManagementService.fetchVideoById('   ');
      expect(res1).toBeNull();
      expect(res2).toBeNull();
      expect(fetchCalled).toBe(false);
    });

    it('supports HTML5 Video source when videoUrl is populated from storage service', () => {
      const video: LearningVideo = {
        id: 'uploaded-vid-1',
        title: 'Video tải lên thực tế',
        description: null,
        sourceType: 'Uploaded',
        youtubeVideoId: null,
        storagePath: null,
        videoUrl: 'https://storage.googleapis.com/zhongwenhub/videos/sample.mp4',
        thumbnailUrl: 'https://storage.googleapis.com/zhongwenhub/thumbs/sample.jpg',
        durationSeconds: 120,
        durationFormatted: '02:00',
        hskLevel: 2,
        topic: 'Du lịch & Đời sống',
        status: 'Published',
        viewCount: 15,
        lessonId: null,
        lessonTitle: null,
        createdAt: '2026-11-19T00:00:00Z',
        updatedAt: null,
      };

      expect(video.sourceType).toBe('Uploaded');
      expect(video.videoUrl).toBe('https://storage.googleapis.com/zhongwenhub/videos/sample.mp4');
      expect(video.youtubeVideoId).toBeNull();
    });

    it('VideoDetailPage exports properly and guarantees zero DEMO_VIDEOS fallback in production', () => {
      expect(typeof VideoDetailPage).toBe('function');
      const pagePath = path.resolve(__dirname, '../features/videos/pages/VideoDetailPage.tsx');
      const source = fs.readFileSync(pagePath, 'utf-8');
      expect(source).not.toContain('DEMO_VIDEOS');
      expect(source).not.toContain('../data/demoVideos');
    });
  });
});

