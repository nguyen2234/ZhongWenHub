export interface TranscriptSegmentDto {
  id: string;
  startTime: number;
  endTime: number;
  startFormatted: string; // "MM:SS.mmm"
  endFormatted: string;   // "MM:SS.mmm"
  textZh: string;
  pinyin: string;
  textVi: string;
}

export interface VideoContentDto {
  id: string;
  title: string;
  description: string;
  hskLevel: number;
  topic: string;
  duration: number; // in seconds
  durationFormatted: string; // "MM:SS"
  thumbnailUrl: string;
  videoUrl: string;
  lessonId?: string;
  lessonTitle?: string;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  tags: string[];
  viewCount: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  transcripts: TranscriptSegmentDto[];
}

export interface CreateVideoDto {
  title: string;
  description: string;
  hskLevel: number;
  topic: string;
  duration: number;
  thumbnailUrl?: string;
  videoUrl: string;
  lessonId?: string;
  lessonTitle?: string;
  status?: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  tags: string[];
  transcripts?: TranscriptSegmentDto[];
}

export interface UpdateVideoDto {
  title?: string;
  description?: string;
  hskLevel?: number;
  topic?: string;
  duration?: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  lessonId?: string;
  lessonTitle?: string;
  status?: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  tags?: string[];
  transcripts?: TranscriptSegmentDto[];
}
