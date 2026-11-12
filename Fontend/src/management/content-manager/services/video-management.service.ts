import type {
  VideoContent,
  VideoFilters,
  CreateVideoDTO,
  UpdateVideoDTO,
  TranscriptSegment,
} from '../types/video.types';

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
        textZh: '五块钱一斤，新鲜又甜。',
        pinyin: 'Wǔ kuài qián yì jīn, xīnxiān yòu tián.',
        textVi: 'Năm tệ một cân, tươi và ngọt lắm.',
      },
      {
        id: 'ts-203',
        startTime: 9.3,
        endTime: 13.0,
        startFormatted: '00:09.300',
        endFormatted: '00:13.000',
        textZh: '太贵了，可以便宜一点儿吗？',
        pinyin: 'Tài guì le, kěyǐ piányi yìdiǎnr ma?',
        textVi: 'Đắt quá, có thể giảm giá một chút không?',
      },
      {
        id: 'ts-204',
        startTime: 13.5,
        endTime: 17.5,
        startFormatted: '00:13.500',
        endFormatted: '00:17.500',
        textZh: '给你四块五吧，买两斤怎么样？',
        pinyin: 'Gěi nǐ sì kuài wǔ ba, mǎi liǎng jīn zěnmeyàng?',
        textVi: 'Bán cho bạn bốn tệ rưỡi nhé, mua hai cân thế nào?',
      },
    ],
  },
  {
    id: 'VID-103',
    title: 'Hành trình trải nghiệm tàu cao tốc Bắc Kinh - Thượng Hải',
    description: 'Khám phá văn hóa di chuyển hiện đại của Trung Quốc và các mẫu câu hữu ích khi đi ga tàu, mua vé, tìm chỗ ngồi.',
    hskLevel: 3,
    topic: 'Du lịch & Giao thông',
    duration: 310,
    durationFormatted: '05:10',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=600&q=80&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    lessonId: 'les-8',
    lessonTitle: 'HSK 3 - Bài 2: Đi du lịch (旅游)',
    status: 'REVIEW',
    tags: ['Tàu cao tốc', 'Ga tàu', 'Du lịch', 'HSK 3'],
    viewCount: 640,
    createdAt: '2026-10-05T11:00:00Z',
    updatedAt: '2026-10-25T16:30:00Z',
    transcripts: [
      {
        id: 'ts-301',
        startTime: 1.0,
        endTime: 5.5,
        startFormatted: '00:01.000',
        endFormatted: '00:05.500',
        textZh: '中国的高铁速度非常快，每小时达到350公里。',
        pinyin: 'Zhōngguó de gāotiě sùdù fēicháng kuài, měi xiǎoshí dádào 350 gōnglǐ.',
        textVi: 'Tốc độ tàu cao tốc Trung Quốc rất nhanh, đạt 350 km mỗi giờ.',
      },
      {
        id: 'ts-302',
        startTime: 6.0,
        endTime: 10.2,
        startFormatted: '00:06.000',
        endFormatted: '00:10.200',
        textZh: '从北京到上海，只需要四个多小时。',
        pinyin: 'Cóng Běijīng dào Shànghǎi, zhǐ xūyào sì gè duō xiǎoshí.',
        textVi: 'Từ Bắc Kinh đến Thượng Hải, chỉ cần hơn bốn tiếng.',
      },
    ],
  },
  {
    id: 'VID-104',
    title: 'Kỹ năng phỏng vấn tuyển dụng tại các tập đoàn công nghệ',
    description: 'Chuẩn bị phỏng vấn tiếng Trung chuyên nghiệp: giới thiệu bản thân, giải quyết vấn đề, đàm phán đãi ngộ.',
    hskLevel: 4,
    topic: 'Công sở & Nghề nghiệp',
    duration: 360,
    durationFormatted: '06:00',
    thumbnailUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    status: 'DRAFT',
    tags: ['Phỏng vấn', 'Công sở', 'HSK 4', 'CV'],
    viewCount: 120,
    createdAt: '2026-10-20T14:00:00Z',
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

class VideoManagementService {
  private videos: VideoContent[] = structuredClone(INITIAL_VIDEOS);

  resetToInitial(): void {
    this.videos = structuredClone(INITIAL_VIDEOS);
  }

  getVideos(filters?: VideoFilters): VideoContent[] {
    let result = structuredClone(this.videos);

    if (filters?.hskLevel && filters.hskLevel !== 'ALL') {
      result = result.filter((v) => v.hskLevel === filters.hskLevel);
    }
    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((v) => v.status === filters.status);
    }
    if (filters?.topic && filters.topic !== 'ALL') {
      result = result.filter((v) => v.topic === filters.topic);
    }
    if (filters?.search?.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.id.toLowerCase().includes(q) ||
          v.title.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.tags.some((t) => t.toLowerCase().includes(q)) ||
          v.transcripts.some(
            (ts) =>
              ts.textZh.toLowerCase().includes(q) ||
              ts.pinyin.toLowerCase().includes(q) ||
              ts.textVi.toLowerCase().includes(q)
          )
      );
    }

    return result;
  }

  getVideoById(id: string): VideoContent | undefined {
    const video = this.videos.find((v) => v.id === id);
    return video ? structuredClone(video) : undefined;
  }

  createVideo(dto: CreateVideoDTO): VideoContent {
    const newId = `VID-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const duration = dto.duration || 180;
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const durationFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const newVideo: VideoContent = {
      id: newId,
      title: dto.title,
      description: dto.description,
      hskLevel: dto.hskLevel,
      topic: dto.topic,
      duration,
      durationFormatted,
      thumbnailUrl: dto.thumbnailUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80&auto=format&fit=crop',
      videoUrl: dto.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      lessonId: dto.lessonId,
      lessonTitle: dto.lessonTitle,
      status: dto.status || 'DRAFT',
      tags: dto.tags.length > 0 ? [...dto.tags] : ['Học liệu video'],
      viewCount: 0,
      transcripts: dto.transcripts ? structuredClone(dto.transcripts) : [],
      createdAt: now,
      updatedAt: now,
    };

    this.videos.unshift(newVideo);
    return structuredClone(newVideo);
  }

  updateVideo(id: string, dto: UpdateVideoDTO): VideoContent {
    const index = this.videos.findIndex((v) => v.id === id);
    if (index === -1) throw new Error(`Không tìm thấy video với ID: ${id}`);

    const existing = this.videos[index];
    const now = new Date().toISOString();

    let durationFormatted = existing.durationFormatted;
    if (dto.duration && dto.duration !== existing.duration) {
      const mins = Math.floor(dto.duration / 60);
      const secs = dto.duration % 60;
      durationFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    const updated: VideoContent = {
      ...existing,
      ...dto,
      tags: dto.tags ? [...dto.tags] : [...existing.tags],
      transcripts: dto.transcripts ? structuredClone(dto.transcripts) : structuredClone(existing.transcripts),
      durationFormatted,
      updatedAt: now,
    };

    this.videos[index] = updated;
    return structuredClone(updated);
  }

  deleteVideo(id: string): boolean {
    const index = this.videos.findIndex((v) => v.id === id);
    if (index === -1) return false;
    this.videos.splice(index, 1);
    return true;
  }

  updateTranscript(id: string, transcripts: TranscriptSegment[]): VideoContent {
    const index = this.videos.findIndex((v) => v.id === id);
    if (index === -1) throw new Error(`Không tìm thấy video: ${id}`);

    const now = new Date().toISOString();
    const updated: VideoContent = {
      ...this.videos[index],
      transcripts: structuredClone(transcripts),
      updatedAt: now,
    };
    this.videos[index] = updated;
    return structuredClone(updated);
  }
}

export const videoManagementService = new VideoManagementService();
