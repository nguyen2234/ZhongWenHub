export type VideoStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED';

export interface TranscriptSegment {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  startFormatted: string; // "mm:ss.ms"
  endFormatted: string; // "mm:ss.ms"
  textZh: string;
  pinyin: string;
  textVi: string;
}

export interface VideoContent {
  id: string;
  title: string;
  description: string;
  hskLevel: number; // 1 - 6
  topic: string;
  duration: number; // in seconds
  durationFormatted: string; // e.g. "03:45"
  thumbnailUrl: string;
  videoUrl: string;
  lessonId?: string;
  lessonTitle?: string;
  status: VideoStatus;
  tags: string[];
  viewCount: number;
  transcripts: TranscriptSegment[];
  createdAt: string;
  updatedAt: string;
}

export interface VideoFilters {
  search?: string;
  hskLevel?: number | 'ALL';
  status?: VideoStatus | 'ALL';
  topic?: string | 'ALL';
}

export interface CreateVideoDTO {
  title: string;
  description: string;
  hskLevel: number;
  topic: string;
  duration?: number;
  videoUrl: string;
  thumbnailUrl?: string;
  lessonId?: string;
  lessonTitle?: string;
  status: VideoStatus;
  tags: string[];
  transcripts?: TranscriptSegment[];
}

export interface UpdateVideoDTO extends Partial<CreateVideoDTO> {}
