// @ts-ignore
import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { videoManagementService } from '../management/content-manager/services/video-management.service';
import { managementRoutes } from '../app/router/management.routes';

describe('Video Learning Phase 2: Management & Cloud Upload Integration Tests', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('1. YouTube URL Parser & HQ Thumbnail Generator', () => {
    it('correctly extracts 11-char ID from various standard YouTube URL formats', () => {
      const urls = [
        { url: 'https://www.youtube.com/watch?v=4lHwBZr66so', expected: '4lHwBZr66so' },
        { url: 'https://m.youtube.com/watch?v=4lHwBZr66so&t=20s', expected: '4lHwBZr66so' },
        { url: 'https://youtu.be/4lHwBZr66so', expected: '4lHwBZr66so' },
        { url: 'https://www.youtube.com/embed/4lHwBZr66so', expected: '4lHwBZr66so' },
        { url: 'https://www.youtube.com/shorts/4lHwBZr66so', expected: '4lHwBZr66so' },
        { url: '4lHwBZr66so', expected: '4lHwBZr66so' },
      ];

      for (const item of urls) {
        const id = videoManagementService.parseYouTubeUrl(item.url);
        expect(id).toBe(item.expected);
      }
    });

    it('rejects malicious or invalid URLs', () => {
      const invalidUrls = [
        'https://malicious-site.com/watch?v=4lHwBZr66so',
        'https://youtube.com.attacker.org/4lHwBZr66so',
        'http://not-youtube.com/v/123',
        'too-short',
        '',
      ];

      for (const url of invalidUrls) {
        const id = videoManagementService.parseYouTubeUrl(url);
        expect(id).toBeNull();
      }
    });

    it('generates standard high-quality YouTube thumbnail URL', () => {
      const thumb = videoManagementService.getYouTubeHqThumbnail('4lHwBZr66so');
      expect(thumb).toBe('https://img.youtube.com/vi/4lHwBZr66so/hqdefault.jpg');
    });
  });

  describe('2. VideoManagementService Real API Contracts', () => {
    it('fetchVideos sends request to /api/v1/videos/manage with query params', async () => {
      let interceptedUrl = '';

      const mockFetch = mock(async (input: RequestInfo | URL) => {
        interceptedUrl = String(input);
        return new Response(
          JSON.stringify({
            items: [
              {
                id: 'vid-admin-1',
                title: 'Video Quản Trị HSK 1',
                sourceType: 'YouTube',
                youtubeVideoId: '4lHwBZr66so',
                status: 'Draft',
                durationSeconds: 180,
                durationFormatted: '03:00',
                hskLevel: 1,
                topic: 'Giao tiếp hàng ngày',
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

      const res = await videoManagementService.fetchVideos({
        search: 'Quản trị',
        hskLevel: 1,
        status: 'Draft',
        sourceType: 'YouTube',
        page: 1,
      });

      expect(interceptedUrl).toContain('/videos/manage?');
      expect(interceptedUrl).toContain('search=Qu%E1%BA%A3n+tr%E1%BB%8B');
      expect(interceptedUrl).toContain('status=Draft');
      expect(interceptedUrl).toContain('sourceType=YouTube');
      expect(res.items.length).toBe(1);
      expect(res.items[0].status).toBe('Draft');
    });

    it('createVideoApi sends POST request to /api/v1/videos/manage with payload', async () => {
      let interceptedBody = '';
      let interceptedMethod = '';

      const mockFetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
        interceptedMethod = init?.method || '';
        interceptedBody = String(init?.body || '');
        return new Response(
          JSON.stringify({
            id: 'new-vid-id',
            title: 'Video Mới',
            sourceType: 'YouTube',
            youtubeVideoId: '4lHwBZr66so',
            status: 'Draft',
          }),
          { status: 201 }
        );
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const created = await videoManagementService.createVideoApi({
        title: 'Video Mới',
        sourceType: 'YouTube',
        youtubeUrl: 'https://www.youtube.com/watch?v=4lHwBZr66so',
        hskLevel: 1,
        topic: 'Giao tiếp hàng ngày',
        status: 'Draft',
      });

      expect(interceptedMethod).toBe('POST');
      expect(interceptedBody).toContain('Video Mới');
      expect(created.id).toBe('new-vid-id');
    });

    it('updateStatus sends PATCH request to /api/v1/videos/manage/:id/status', async () => {
      let interceptedUrl = '';
      let interceptedMethod = '';
      let interceptedBody = '';

      const mockFetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
        interceptedUrl = String(input);
        interceptedMethod = init?.method || '';
        interceptedBody = String(init?.body || '');
        return new Response(
          JSON.stringify({
            id: 'test-vid-id',
            title: 'Video chuyển trạng thái',
            status: 'Published',
          }),
          { status: 200 }
        );
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const updated = await videoManagementService.updateStatus('test-vid-id', 'Published');

      expect(interceptedMethod).toBe('PATCH');
      expect(interceptedUrl).toContain('/videos/manage/test-vid-id/status');
      expect(interceptedBody).toContain('Published');
      expect(updated.status).toBe('Published');
    });

    it('deleteVideoApi sends DELETE request to /api/v1/videos/manage/:id', async () => {
      let interceptedUrl = '';
      let interceptedMethod = '';

      const mockFetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
        interceptedUrl = String(input);
        interceptedMethod = init?.method || '';
        return new Response(null, { status: 204 });
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const deleted = await videoManagementService.deleteVideoApi('del-id-123');
      expect(interceptedMethod).toBe('DELETE');
      expect(interceptedUrl).toContain('/videos/manage/del-id-123');
      expect(deleted).toBe(true);
    });

    it('getStorageStatus returns provider information from backend', async () => {
      const mockFetch = mock(async () => {
        return new Response(
          JSON.stringify({
            isConfigured: true,
            providerName: 'LocalFileSystem',
            maxVideoSizeBytes: 104857600,
            maxThumbnailSizeBytes: 5242880,
            allowedVideoMimeTypes: ['video/mp4'],
            allowedThumbnailMimeTypes: ['image/jpeg', 'image/png'],
          }),
          { status: 200 }
        );
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const status = await videoManagementService.getStorageStatus();
      expect(status.isConfigured).toBe(true);
      expect(status.providerName).toBe('LocalFileSystem');
      expect(status.maxVideoSizeBytes).toBe(104857600);
    });
  });

  describe('3. Routing & Role Protection Contracts', () => {
    it('defines /management/videos redirecting to /management/content-manager/videos', () => {
      const rootMgmt = managementRoutes.find((r) => r.path === '/management');
      expect(rootMgmt).toBeDefined();

      const children = rootMgmt?.children || [];
      const videosRedirect = children.find((c) => c.path === 'videos');
      expect(videosRedirect).toBeDefined();
    });

    it('protects /management/content-manager/videos with CONTENT_MANAGER and ADMIN roles', () => {
      const rootMgmt = managementRoutes.find((r) => r.path === '/management');
      const contentManagerBranch = rootMgmt?.children?.find((c) => c.path === 'content-manager');
      expect(contentManagerBranch).toBeDefined();

      const videosRoute = contentManagerBranch?.children?.find((c) => c.path === 'videos');
      expect(videosRoute).toBeDefined();
    });
  });
});
