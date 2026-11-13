export type VideoStatus =
  | 'Draft'
  | 'Published'
  | 'Hidden'
  | 'DRAFT'
  | 'PUBLISHED'
  | 'HIDDEN'
  | 'REVIEW';

export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  startFormatted: string;
  endFormatted: string;
  textZh: string;
  pinyin: string;
  textVi: string;
}

export interface LearningVideoItem {
  id: string;
  title: string;
  description: string | null;
  sourceType: 'YouTube' | 'Uploaded' | string;
  youtubeVideoId: string | null;
  youTubeVideoId?: string | null;
  storagePath: string | null;
  thumbnailUrl: string;
  durationSeconds: number;
  durationFormatted: string;
  hskLevel: number;
  topic: string;
  status: 'Draft' | 'Published' | 'Hidden' | string;
  viewCount: number;
  lessonId: string | null;
  lessonTitle: string | null;
  createdAt: string;
  updatedAt: string | null;
  duration?: number;
  videoUrl?: string;
  tags?: string[];
  transcripts?: TranscriptSegment[];
}

// Backward-compatibility alias
export type VideoContent = LearningVideoItem;

export interface VideoAdminQuery {
  search?: string;
  hskLevel?: number | 'all' | 'ALL';
  topic?: string | 'all' | 'ALL';
  sourceType?: string | 'all' | 'ALL';
  status?: string | 'all' | 'ALL';
  page?: number;
  pageSize?: number;
}

export type VideoFilters = VideoAdminQuery;

export interface PagedAdminVideoResponse {
  items: LearningVideoItem[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateVideoPayload {
  title: string;
  description?: string;
  sourceType: 'YouTube' | 'Uploaded';
  youtubeUrl?: string;
  youtubeVideoId?: string;
  storagePath?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  hskLevel: number;
  topic: string;
  status: 'Draft' | 'Published' | 'Hidden';
  lessonId?: string | null;
}

export interface UpdateVideoPayload extends Partial<CreateVideoPayload> {}

// Backward-compatibility DTOs
export interface CreateVideoDTO {
  title: string;
  description?: string;
  sourceType?: 'YouTube' | 'Uploaded';
  youtubeUrl?: string;
  youtubeVideoId?: string;
  storagePath?: string;
  thumbnailUrl?: string;
  duration?: number;
  durationSeconds?: number;
  hskLevel?: number;
  topic?: string;
  status?: string;
  lessonId?: string | null;
  videoUrl?: string;
  lessonTitle?: string;
  tags?: string[];
  transcripts?: TranscriptSegment[];
}

export interface UpdateVideoDTO extends Partial<CreateVideoDTO> {}

export interface StorageStatus {
  isConfigured: boolean;
  providerName: string;
  maxVideoSizeBytes: number;
  maxThumbnailSizeBytes: number;
  allowedVideoMimeTypes: string[];
  allowedThumbnailMimeTypes: string[];
}

export interface StorageUploadResponse {
  success: boolean;
  storagePath: string;
  publicUrl: string;
  fileSizeBytes: number;
  contentType: string;
  errorMessage?: string;
}
