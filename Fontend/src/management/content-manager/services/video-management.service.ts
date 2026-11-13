import type {
  VideoContent,
  VideoFilters,
  CreateVideoDTO,
  UpdateVideoDTO,
  TranscriptSegment,
  LearningVideoItem,
  VideoAdminQuery,
  PagedAdminVideoResponse,
  CreateVideoPayload,
  UpdateVideoPayload,
  StorageStatus,
  StorageUploadResponse,
} from '../types/video.types';
import { authTokenService } from '../../../core/api/client/auth-token.service';

function getApiUrl(endpoint: string): string {
  const base = (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1';
  const cleanBase = base.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${cleanBase}/${cleanEndpoint}`;
}

function getAuthHeaders(isFormData = false): HeadersInit {
  const token = authTokenService.getAccessToken();
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export function secondsToTimestamp(sec: number): string {
  const mins = Math.floor(sec / 60);
  const remainingSec = sec % 60;
  const wholeSec = Math.floor(remainingSec);
  const ms = Math.floor((remainingSec - wholeSec) * 1000);
  return `${String(mins).padStart(2, '0')}:${String(wholeSec).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

export function timestampToSeconds(timestamp: string): number {
  const parts = timestamp.trim().split(':');
  if (parts.length !== 2) return 0;
  const mins = parseInt(parts[0], 10) || 0;
  const secParts = parts[1].split('.');
  const secs = parseInt(secParts[0], 10) || 0;
  const ms = secParts.length > 1 ? parseInt(secParts[1].padEnd(3, '0').slice(0, 3), 10) || 0 : 0;
  return mins * 60 + secs + ms / 1000;
}

const INITIAL_VIDEOS: VideoContent[] = [
  {
    id: 'VID-101',
    title: 'Giao tiếp hàng ngày: Chào hỏi và giới thiệu bản thân',
    description: 'Video hội thoại cơ bản dành cho người mới bắt đầu học tiếng Trung HSK 1. Hướng dẫn phát âm chuẩn Bắc Kinh.',
    sourceType: 'YouTube',
    youtubeVideoId: '4lHwBZr66so',
    storagePath: null,
    durationSeconds: 180,
    hskLevel: 1,
    topic: 'Giao tiếp hàng ngày',
    duration: 180,
    durationFormatted: '03:00',
    thumbnailUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    lessonId: 'les-1',
    lessonTitle: 'HSK 1 - Bài 1: Chào hỏi (你好)',
    status: 'PUBLISHED',
    tags: ['Chào hỏi', 'Phát âm', 'HSK 1', 'Người mới'],
    viewCount: 1420,
    createdAt: '2026-09-15T08:30:00Z',
    updatedAt: '2026-10-18T14:20:00Z',
    transcripts: [
      {
        id: 'ts-1',
        startTime: 1.0,
        endTime: 4.2,
        startFormatted: '00:01.000',
        endFormatted: '00:04.200',
        textZh: '你好！很高兴认识你。',
        pinyin: 'Nǐ hǎo! Hěn gāoxìng rènshí nǐ.',
        textVi: 'Xin chào! Rất vui được làm quen với bạn.',
      },
      {
        id: 'ts-2',
        startTime: 4.5,
        endTime: 8.8,
        startFormatted: '00:04.500',
        endFormatted: '00:08.800',
        textZh: '我叫李明，我是中国人。',
        pinyin: 'Wǒ jiào Lǐ Míng, wǒ shì Zhōngguó rén.',
        textVi: 'Tôi tên là Lý Minh, tôi là người Trung Quốc.',
      },
      {
        id: 'ts-3',
        startTime: 9.2,
        endTime: 12.5,
        startFormatted: '00:09.200',
        endFormatted: '00:12.500',
        textZh: '你叫什么名字？',
        pinyin: 'Nǐ jiào shénme míngzì?',
        textVi: 'Bạn tên là gì?',
      },
      {
        id: 'ts-4',
        startTime: 13.0,
        endTime: 17.6,
        startFormatted: '00:13.000',
        endFormatted: '00:17.600',
        textZh: '我叫阮文安，我是越南留学生。',
        pinyin: 'Wǒ jiào Ruǎn Wén\'ān, wǒ shì Yuènán liúxuéshēng.',
        textVi: 'Tôi tên là Nguyễn Văn An, tôi là du học sinh Việt Nam.',
      },
      {
        id: 'ts-5',
        startTime: 18.0,
        endTime: 21.4,
        startFormatted: '00:18.000',
        endFormatted: '00:21.400',
        textZh: '欢迎你来北京学习汉语！',
        pinyin: 'Huānyíng nǐ lái Běijīng xuéxí Hànyǔ!',
        textVi: 'Chào mừng bạn đến Bắc Kinh học tiếng Hán!',
      },
    ],
  },
  {
    id: 'VID-102',
    title: 'Đi siêu thị và mặc cả bằng tiếng Trung',
    description: 'Tình huống thực tế khi mua sắm, hỏi giá, trả giá và thanh toán tiền mặt/WeChat Pay.',
    sourceType: 'YouTube',
    youtubeVideoId: 'k38L07o_9zM',
    storagePath: null,
    durationSeconds: 245,
    hskLevel: 2,
    topic: 'Mua sắm & Đời sống',
    duration: 245,
    durationFormatted: '04:05',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    lessonId: 'les-5',
    lessonTitle: 'HSK 2 - Bài 3: Mua sắm (买东西)',
    status: 'PUBLISHED',
    tags: ['Mua sắm', 'Hỏi giá', 'Tiền tệ', 'HSK 2'],
    viewCount: 980,
    createdAt: '2026-09-20T10:15:00Z',
    updatedAt: '2026-10-22T09:10:00Z',
    transcripts: [
      {
        id: 'ts-201',
        startTime: 1.2,
        endTime: 4.8,
        startFormatted: '00:01.200',
        endFormatted: '00:04.800',
        textZh: '请问，这个苹果一斤多少钱？',
        pinyin: 'Qǐngwèn, zhège píngguǒ yì jīn duōshǎo qián?',
        textVi: 'Xin hỏi, táo này bao nhiêu tiền một cân?',
      },
      {
        id: 'ts-202',
        startTime: 5.2,
        endTime: 8.9,
        startFormatted: '00:05.200',
        endFormatted: '00:08.900',
        textZh: '五块钱一斤，很甜很新鲜。',
        pinyin: 'Wǔ kuài qián yì jīn, hěn tián hěn xīnxiān.',
        textVi: 'Năm tệ một cân, rất ngọt và tươi.',
      },
      {
        id: 'ts-203',
        startTime: 9.3,
        endTime: 13.1,
        startFormatted: '00:09.300',
        endFormatted: '00:13.100',
        textZh: '太贵了！四块钱可以吗？',
        pinyin: 'Tài guì le! Sì kuài qián kěyǐ ma?',
        textVi: 'Đắt quá! Bốn tệ được không?',
      },
    ],
  },
  {
    id: 'VID-103',
    title: 'Đặt phòng khách sạn và hỏi đường khi du lịch Trung Quốc',
    description: 'Kỹ năng giao tiếp HSK 3 cần thiết khi du lịch: làm thủ tục check-in, hỏi đường xe bus, tàu điện ngầm.',
    sourceType: 'Uploaded',
    youtubeVideoId: null,
    storagePath: 'videos/hsk3/travel.mp4',
    durationSeconds: 310,
    hskLevel: 3,
    topic: 'Du lịch & Đời sống',
    duration: 310,
    durationFormatted: '05:10',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&q=80&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    lessonId: 'les-12',
    lessonTitle: 'HSK 3 - Bài 5: Du lịch (旅游)',
    status: 'PUBLISHED',
    tags: ['Du lịch', 'Khách sạn', 'Hỏi đường', 'HSK 3'],
    viewCount: 650,
    createdAt: '2026-10-01T15:00:00Z',
    updatedAt: '2026-10-25T16:30:00Z',
    transcripts: [
      {
        id: 'ts-301',
        startTime: 1.0,
        endTime: 4.5,
        startFormatted: '00:01.000',
        endFormatted: '00:04.500',
        textZh: '你好，我在网上预订了一个大床房。',
        pinyin: 'Nǐ hǎo, wǒ zài wǎngshàng yùdìng le yí ge dàchuáng fáng.',
        textVi: 'Xin chào, tôi đã đặt phòng một giường lớn qua mạng.',
      },
      {
        id: 'ts-302',
        startTime: 5.0,
        endTime: 8.5,
        startFormatted: '00:05.000',
        endFormatted: '00:08.500',
        textZh: '好的，请出示您的护照和预订确认单。',
        pinyin: 'Hǎode, qǐng chūshì nín de hùzhào hé yùdìng quèrèndān.',
        textVi: 'Vâng, xin vui lòng xuất trình hộ chiếu và phiếu xác nhận đặt phòng.',
      },
    ],
  },
  {
    id: 'VID-104',
    title: 'Phỏng vấn xin việc bằng tiếng Trung chuyên nghiệp',
    description: 'Chuẩn bị phỏng vấn công ty Trung Quốc: giới thiệu kinh nghiệm, đàm phán lương và trả lời tình huống.',
    sourceType: 'YouTube',
    youtubeVideoId: 'dQw4w9WgXcQ',
    storagePath: null,
    durationSeconds: 420,
    hskLevel: 4,
    topic: 'Công việc & Phỏng vấn',
    duration: 420,
    durationFormatted: '07:00',
    thumbnailUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    lessonId: 'les-25',
    lessonTitle: 'HSK 4 - Bài 8: Xin việc (找工作)',
    status: 'DRAFT',
    tags: ['Phỏng vấn', 'Công việc', 'CV', 'HSK 4'],
    viewCount: 320,
    createdAt: '2026-10-10T09:00:00Z',
    updatedAt: '2026-10-26T11:45:00Z',
    transcripts: [
      {
        id: 'ts-401',
        startTime: 0.8,
        endTime: 5.0,
        startFormatted: '00:00.800',
        endFormatted: '00:05.000',
        textZh: '请用两分钟时间简要介绍一下您的工作背景。',
        pinyin: 'Qǐng yòng liǎng fēnzhōng shíjiān jiǎnyào jièshào yíxià nín de gōngzuò bèijǐng.',
        textVi: 'Xin mời dùng hai phút để giới thiệu ngắn gọn về kinh nghiệm làm việc của bạn.',
      },
    ],
  },
];

export class VideoManagementService {
  private syncVideos: VideoContent[] = structuredClone(INITIAL_VIDEOS);

  // ==========================================
  // REAL BACKEND API CLIENT METHODS
  // ==========================================

  public parseYouTubeUrl(url: string): string | null {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }

    const regex =
      /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/i;
    const match = trimmed.match(regex);
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }

    return null;
  }

  public getYouTubeHqThumbnail(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }

  public async fetchVideos(query: VideoAdminQuery = {}): Promise<PagedAdminVideoResponse> {
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
    if (query.hskLevel && String(query.hskLevel).toUpperCase() !== 'ALL') {
      params.append('hskLevel', String(query.hskLevel));
    }
    if (query.topic && String(query.topic).toUpperCase() !== 'ALL') {
      params.append('topic', query.topic.trim());
    }
    if (query.sourceType && String(query.sourceType).toUpperCase() !== 'ALL') {
      params.append('sourceType', query.sourceType.trim());
    }
    if (query.status && String(query.status).toUpperCase() !== 'ALL') {
      params.append('status', query.status.trim());
    }

    const qs = params.toString();
    const endpoint = qs ? `/videos/manage?${qs}` : '/videos/manage';

    const response = await fetch(getApiUrl(endpoint), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Lỗi tải danh sách video quản trị (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    const rawItems: any[] = data.items || [];
    const items: LearningVideoItem[] = rawItems.map((item) => ({
      ...item,
      youtubeVideoId: item.youtubeVideoId ?? item.youTubeVideoId ?? null,
      durationFormatted: item.durationFormatted ?? '00:00',
    }));

    return {
      items,
      totalItems: data.totalItems ?? 0,
      page: data.page ?? data.pageNumber ?? 1,
      pageSize: data.pageSize ?? 12,
      totalPages: Math.max(1, data.totalPages ?? 1),
      hasPreviousPage: !!data.hasPreviousPage,
      hasNextPage: !!data.hasNextPage,
    };
  }

  public async fetchVideoById(id: string): Promise<LearningVideoItem | null> {
    try {
      const response = await fetch(getApiUrl(`/videos/manage/${id}`), {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(`Lỗi tải video (${response.status})`);
      }

      const item = (await response.json()) as any;
      return {
        ...item,
        youtubeVideoId: item.youtubeVideoId ?? item.youTubeVideoId ?? null,
        durationFormatted: item.durationFormatted ?? '00:00',
      };
    } catch (err) {
      console.warn('[VideoManagementService] Error fetching video:', err);
      return null;
    }
  }

  public async createVideoApi(payload: CreateVideoPayload): Promise<LearningVideoItem> {
    const response = await fetch(getApiUrl('/videos/manage'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const message = errorJson.message || `Lỗi tạo video (${response.status})`;
      throw new Error(message);
    }

    return (await response.json()) as LearningVideoItem;
  }

  public async updateVideoApi(id: string, payload: UpdateVideoPayload): Promise<LearningVideoItem> {
    const response = await fetch(getApiUrl(`/videos/manage/${id}`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const message = errorJson.message || `Lỗi cập nhật video (${response.status})`;
      throw new Error(message);
    }

    return (await response.json()) as LearningVideoItem;
  }

  public async updateStatus(id: string, status: 'Draft' | 'Published' | 'Hidden'): Promise<LearningVideoItem> {
    const response = await fetch(getApiUrl(`/videos/manage/${id}/status`), {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const message = errorJson.message || `Lỗi chuyển trạng thái video (${response.status})`;
      throw new Error(message);
    }

    return (await response.json()) as LearningVideoItem;
  }

  public async deleteVideoApi(id: string): Promise<boolean> {
    const response = await fetch(getApiUrl(`/videos/manage/${id}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (response.status === 404) return false;
    if (!response.ok) {
      throw new Error(`Lỗi xóa video (${response.status})`);
    }

    return true;
  }

  public async uploadVideoFile(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<StorageUploadResponse> {
    const token = authTokenService.getAccessToken();
    const url = getApiUrl('/videos/manage/upload-video');

    if (onProgress && typeof XMLHttpRequest !== 'undefined') {
      return new Promise<StorageUploadResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && e.total > 0) {
            const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
            onProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress(100);
            try {
              resolve(JSON.parse(xhr.responseText) as StorageUploadResponse);
            } catch {
              reject(new Error('Phản hồi từ máy chủ không hợp lệ.'));
            }
          } else {
            try {
              const errObj = JSON.parse(xhr.responseText);
              reject(new Error(errObj.message || `Lỗi tải lên video (${xhr.status})`));
            } catch {
              reject(new Error(`Lỗi tải lên video (${xhr.status})`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Lỗi kết nối khi tải lên video.'));

        const formData = new FormData();
        formData.append('file', file);
        xhr.send(formData);
      });
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.message || `Lỗi tải lên video (${response.status})`);
    }

    return (await response.json()) as StorageUploadResponse;
  }

  public async uploadThumbnailFile(file: File): Promise<StorageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(getApiUrl('/videos/manage/upload-thumbnail'), {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.message || `Lỗi tải lên thumbnail (${response.status})`);
    }

    return (await response.json()) as StorageUploadResponse;
  }

  public async getStorageStatus(): Promise<StorageStatus> {
    try {
      const response = await fetch(getApiUrl('/videos/manage/storage-status'), {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        return {
          isConfigured: false,
          providerName: 'Unconfigured',
          maxVideoSizeBytes: 104857600,
          maxThumbnailSizeBytes: 5242880,
          allowedVideoMimeTypes: ['video/mp4'],
          allowedThumbnailMimeTypes: ['image/jpeg', 'image/png'],
        };
      }

      return (await response.json()) as StorageStatus;
    } catch {
      return {
        isConfigured: false,
        providerName: 'Unconfigured',
        maxVideoSizeBytes: 104857600,
        maxThumbnailSizeBytes: 5242880,
        allowedVideoMimeTypes: ['video/mp4'],
        allowedThumbnailMimeTypes: ['image/jpeg', 'image/png'],
      };
    }
  }

  public async fetchTopics(): Promise<string[]> {
    try {
      const response = await fetch(getApiUrl('/videos/topics'), {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) return ['Giao tiếp hàng ngày', 'Luyện thi HSK'];
      return (await response.json()) as string[];
    } catch {
      return ['Giao tiếp hàng ngày', 'Luyện thi HSK'];
    }
  }

  // ==========================================
  // SYNCHRONOUS FIXTURE METHODS (FOR FE-13 TEST COMPATIBILITY)
  // ==========================================

  public resetToInitial(): void {
    this.syncVideos = structuredClone(INITIAL_VIDEOS);
  }

  public getVideos(filters?: VideoFilters): VideoContent[] {
    let result = structuredClone(this.syncVideos);

    if (filters?.hskLevel && String(filters.hskLevel).toUpperCase() !== 'ALL') {
      result = result.filter((v) => v.hskLevel === filters.hskLevel);
    }
    if (filters?.status && String(filters.status).toUpperCase() !== 'ALL') {
      const st = String(filters.status).toUpperCase();
      result = result.filter((v) => String(v.status).toUpperCase() === st);
    }
    if (filters?.topic && String(filters.topic).toUpperCase() !== 'ALL') {
      result = result.filter((v) => v.topic === filters.topic);
    }
    if (filters?.search?.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.id.toLowerCase().includes(q) ||
          v.title.toLowerCase().includes(q) ||
          (v.description && v.description.toLowerCase().includes(q)) ||
          (v.tags && v.tags.some((t: string) => t.toLowerCase().includes(q))) ||
          (v.transcripts &&
            v.transcripts.some(
              (ts: any) =>
                ts.textZh?.toLowerCase().includes(q) ||
                ts.pinyin?.toLowerCase().includes(q) ||
                ts.textVi?.toLowerCase().includes(q)
            ))
      );
    }

    return result;
  }

  public getVideoById(id: string): VideoContent | undefined {
    const video = this.syncVideos.find((v) => v.id === id);
    return video ? structuredClone(video) : undefined;
  }

  public createVideo(dto: CreateVideoDTO): VideoContent {
    const newId = `VID-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const duration = dto.duration || dto.durationSeconds || 180;
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const durationFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const newVideo: VideoContent = {
      id: newId,
      title: dto.title,
      description: dto.description || '',
      sourceType: dto.sourceType || 'Uploaded',
      youtubeVideoId: dto.youtubeVideoId || null,
      storagePath: dto.storagePath || null,
      hskLevel: dto.hskLevel || 1,
      topic: dto.topic || 'Giao tiếp hàng ngày',
      duration,
      durationSeconds: duration,
      durationFormatted,
      thumbnailUrl: dto.thumbnailUrl || 'https://example.com/thumb.jpg',
      videoUrl: dto.videoUrl || 'https://example.com/sample.mp4',
      lessonId: dto.lessonId || null,
      lessonTitle: dto.lessonTitle || null,
      status: dto.status || 'DRAFT',
      tags: dto.tags && dto.tags.length > 0 ? [...dto.tags] : ['Học liệu video'],
      viewCount: 0,
      transcripts: dto.transcripts ? structuredClone(dto.transcripts) : [],
      createdAt: now,
      updatedAt: now,
    };

    this.syncVideos.unshift(newVideo);
    return structuredClone(newVideo);
  }

  public updateVideo(id: string, dto: UpdateVideoDTO): VideoContent {
    const index = this.syncVideos.findIndex((v) => v.id === id);
    if (index === -1) throw new Error(`Không tìm thấy video với ID: ${id}`);

    const existing = this.syncVideos[index];
    const now = new Date().toISOString();

    const updated: VideoContent = {
      ...existing,
      ...dto,
      tags: dto.tags ? [...dto.tags] : [...(existing.tags || [])],
      transcripts: dto.transcripts ? structuredClone(dto.transcripts) : structuredClone(existing.transcripts || []),
      updatedAt: now,
    };

    this.syncVideos[index] = updated;
    return structuredClone(updated);
  }

  public deleteVideo(id: string): boolean {
    const index = this.syncVideos.findIndex((v) => v.id === id);
    if (index === -1) return false;
    this.syncVideos.splice(index, 1);
    return true;
  }

  public updateTranscript(id: string, transcripts: TranscriptSegment[]): VideoContent {
    const index = this.syncVideos.findIndex((v) => v.id === id);
    if (index === -1) throw new Error(`Không tìm thấy video: ${id}`);

    const now = new Date().toISOString();
    const updated: VideoContent = {
      ...this.syncVideos[index],
      transcripts: structuredClone(transcripts),
      updatedAt: now,
    };
    this.syncVideos[index] = updated;
    return structuredClone(updated);
  }
}

export const videoManagementService = new VideoManagementService();
