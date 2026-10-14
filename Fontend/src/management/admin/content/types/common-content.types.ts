export type ContentStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export interface ContentStatusConfig {
  label: string;
  variant: 'neutral' | 'warning' | 'primary' | 'danger' | 'success';
}

export const CONTENT_STATUS_CONFIG: Record<ContentStatus, ContentStatusConfig> = {
  DRAFT: { label: 'Bản nháp', variant: 'neutral' },
  PENDING_REVIEW: { label: 'Chờ duyệt', variant: 'warning' },
  PUBLISHED: { label: 'Đã xuất bản', variant: 'success' },
  ARCHIVED: { label: 'Lưu trữ', variant: 'danger' },
};
