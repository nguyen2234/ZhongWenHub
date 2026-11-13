export interface LearningVideo {
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
}

export interface LearningVideoQuery {
  search?: string;
  hskLevel?: number | 'all';
  topic?: string;
  sourceType?: string;
  page?: number;
  pageSize?: number;
}

export interface PagedVideoResponse {
  items: LearningVideo[];
  totalItems: number;
  page: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

