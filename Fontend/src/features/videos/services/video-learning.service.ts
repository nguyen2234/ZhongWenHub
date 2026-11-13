import type { LearningVideo, LearningVideoQuery, PagedVideoResponse } from '../types/video-learning.types';
import { authTokenService } from '../../../core/api/client/auth-token.service';

function getApiUrl(endpoint: string): string {
  const base = (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1';
  const cleanBase = base.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${cleanBase}/${cleanEndpoint}`;
}

function getAuthHeaders(): HeadersInit {
  const token = authTokenService.getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const STANDARD_VIDEO_TOPICS: string[] = [
  'Giao tiếp hàng ngày',
  'Ẩm thực & Mua sắm',
  'Du lịch & Đời sống',
  'Ngữ pháp thực dụng',
  'Luyện thi HSK',
  'Văn hóa & Phong tục',
];

export class VideoLearningService {
  /**
   * Fetch paginated list of published learning videos with search and filters
   */
  public async fetchVideos(query: LearningVideoQuery = {}): Promise<PagedVideoResponse> {
    const params = new URLSearchParams();

    if (query.page && query.page > 0) {
      params.append('page', String(query.page));
    }
    if (query.pageSize && query.pageSize > 0) {
      params.append('pageSize', String(query.pageSize));
    }
    if (query.search?.trim()) {
      params.append('search', query.search.trim());
    }
    if (query.hskLevel && query.hskLevel !== 'all') {
      params.append('hskLevel', String(query.hskLevel));
    }
    if (query.topic && query.topic !== 'all') {
      params.append('topic', query.topic.trim());
    }
    if (query.sourceType && query.sourceType !== 'all') {
      params.append('sourceType', query.sourceType.trim());
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/videos?${queryString}` : '/videos';

    const response = await fetch(getApiUrl(endpoint), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Lỗi tải danh sách video (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    const rawItems: any[] = data.items || [];
    const items: LearningVideo[] = rawItems.map((item) => ({
      ...item,
      youtubeVideoId: item.youtubeVideoId ?? item.youTubeVideoId ?? null,
      durationFormatted: item.durationFormatted ?? VideoLearningService.formatDuration(item.durationSeconds ?? 0),
    }));

    return {
      items,
      totalItems: data.totalItems ?? 0,
      page: data.page ?? data.pageNumber ?? 1,
      pageNumber: data.pageNumber ?? data.page ?? 1,
      pageSize: data.pageSize ?? 12,
      totalPages: data.totalPages ?? 0,
      hasPreviousPage: !!data.hasPreviousPage,
      hasNextPage: !!data.hasNextPage,
    };
  }

  /**
   * Format duration seconds to MM:SS or HH:MM:SS
   */
  public static formatDuration(seconds: number): string {
    const s = Math.max(0, seconds || 0);
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const remainingSeconds = s % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  /**
   * Fetch single video detail by ID
   */
  public async fetchVideoById(id: string): Promise<LearningVideo | null> {
    try {
      const response = await fetch(getApiUrl(`/videos/${id}`), {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error(`Lỗi tải video (${response.status})`);
      }

      const item = (await response.json()) as any;
      return {
        ...item,
        youtubeVideoId: item.youtubeVideoId ?? item.youTubeVideoId ?? null,
        durationFormatted: item.durationFormatted ?? VideoLearningService.formatDuration(item.durationSeconds ?? 0),
      } as LearningVideo;
    } catch (err) {
      console.warn('[VideoLearningService] Error fetching video by id:', err);
      return null;
    }
  }

  /**
   * Fetch available video topics
   */
  public async fetchTopics(): Promise<string[]> {
    try {
      const response = await fetch(getApiUrl('/videos/topics'), {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        return STANDARD_VIDEO_TOPICS;
      }

      const list = await response.json();
      return Array.isArray(list) && list.length > 0 ? list : STANDARD_VIDEO_TOPICS;
    } catch {
      return STANDARD_VIDEO_TOPICS;
    }
  }
}

export const videoLearningService = new VideoLearningService();

