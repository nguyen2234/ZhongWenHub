// @ts-ignore
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { curriculumService } from '../management/admin/content/services/curriculum.service';
import { httpClient } from '../core/api/client/http-client';

describe('Curriculum Service — Live Sync Pagination & Safe DRAFT Lesson Creation', () => {
  const originalGet = httpClient.get.bind(httpClient);
  const originalPost = httpClient.post.bind(httpClient);

  beforeEach(() => {
    curriculumService.loadFixturesForTesting();
  });

  afterEach(() => {
    httpClient.get = originalGet;
    httpClient.post = originalPost;
    curriculumService.loadFixturesForTesting();
  });

  it('fetches all lesson pages without truncating at 100 items and preserves HSK metadata', async () => {
    const requestedPages: number[] = [];
    httpClient.get = (async (url: string, options?: any) => {
      if (url === '/content/courses') {
        return [
          {
            id: 'c-1',
            code: 'HSK1',
            title: 'Giáo trình Chuẩn HSK 1',
            hskLevel: 1,
            status: 'PUBLISHED',
            unitCount: 6,
            lessonCount: 15,
            publishedLessonCount: 3,
            draftLessonCount: 12,
            createdAt: '2026-01-01T00:00:00Z',
          },
        ];
      }
      if (url === '/content/units') {
        return [
          {
            id: 'u-1',
            courseId: 'c-1',
            unitNumber: 1,
            titleZh: '问候',
            titleVi: 'Chào hỏi',
            orderIndex: 1,
            status: 'PUBLISHED',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ];
      }
      if (url === '/content/lessons') {
        const page = options?.params?.page ?? 1;
        requestedPages.push(page);
        if (page === 1) {
          return {
            items: Array.from({ length: 100 }, (_, i) => ({
              id: `les-p1-${i + 1}`,
              courseId: 'c-1',
              unitId: 'u-1',
              lessonNumber: i + 1,
              titleZh: `第${i + 1}课`,
              titleVi: `Bài ${i + 1}`,
              pinyin: `Dì ${i + 1} kè`,
              durationMinutes: 15,
              xpReward: 50,
              orderIndex: i + 1,
              status: 'DRAFT',
              createdAt: '2026-01-01T00:00:00Z',
            })),
            totalPages: 2,
          };
        }
        return {
          items: Array.from({ length: 40 }, (_, i) => ({
            id: `les-p2-${i + 1}`,
            courseId: 'c-1',
            unitId: 'u-1',
            lessonNumber: 101 + i,
            titleZh: `第${101 + i}课`,
            titleVi: `Bài ${101 + i}`,
            pinyin: `Dì ${101 + i} kè`,
            durationMinutes: 15,
            xpReward: 50,
            orderIndex: 101 + i,
            status: 'DRAFT',
            createdAt: '2026-01-01T00:00:00Z',
          })),
          totalPages: 2,
        };
      }
      throw new Error(`Unexpected GET ${url}`);
    }) as any;

    await curriculumService.syncFromApi();
    expect(requestedPages).toEqual([1, 2]);
    const synced = curriculumService.getLessons();
    expect(synced.length).toBe(140);
    expect(synced[0].pinyin).toBe('Dì 1 kè');
    expect(synced[0].courseId).toBe('c-1');
  });

  it('always forces status=DRAFT when creating a lesson and returns server Guid ID', async () => {
    let capturedPayload: any = null;
    httpClient.post = (async (url: string, payload: any) => {
      capturedPayload = { url, payload };
      return {
        id: '99999999-aaaa-bbbb-cccc-111111111111',
        courseId: payload.courseId,
        unitId: payload.unitId,
        lessonNumber: payload.lessonNumber,
        titleZh: payload.titleZh,
        titleVi: payload.titleVi,
        pinyin: payload.pinyin,
        durationMinutes: payload.durationMinutes,
        xpReward: payload.xpReward,
        orderIndex: payload.orderIndex,
        status: 'DRAFT',
        summary: payload.summary,
        vocabularyCount: 0,
        grammarCount: 0,
        exerciseCount: 0,
        createdAt: '2026-11-11T08:00:00Z',
      };
    }) as any;

    const units = curriculumService.getUnits();
    const targetUnit = units[0];
    const created = await curriculumService.createLesson(targetUnit.id, {
      lessonNumber: 16,
      titleZh: '新课十六',
      titleVi: 'Bài mới 16',
      pinyin: 'Xīn kè shíliù',
      durationMinutes: 20,
      xpReward: 60,
      orderIndex: 16,
      status: 'PUBLISHED', // Should NEVER be sent as PUBLISHED on create
      summary: 'Kiểm thử mặc định DRAFT',
      allowExceedStandardLimit: true,
    });

    expect(capturedPayload.url).toBe('/content/lessons');
    expect(capturedPayload.payload.status).toBe('DRAFT');
    expect(capturedPayload.payload.pinyin).toBe('Xīn kè shíliù');
    expect(capturedPayload.payload.allowExceedStandardLimit).toBe(true);
    expect(created.id).toBe('99999999-aaaa-bbbb-cccc-111111111111');
    expect(created.status).toBe('DRAFT');
  });
});
