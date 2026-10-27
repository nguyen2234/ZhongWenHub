export type ContentIssueStatus = 'NEW' | 'TRIAGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
export type ContentPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ContentIssueType = 'TYPO' | 'AUDIO_ERROR' | 'TRANSLATION_WRONG' | 'GRAMMAR_EXPLANATION' | 'BROKEN_MEDIA' | 'OTHER';
export type TargetContentType = 'VOCABULARY' | 'GRAMMAR' | 'LESSON' | 'EXERCISE' | 'VIDEO' | 'OTHER';

export interface ContentIssueHistoryDto {
  id: string;
  actorName: string;
  actorRole: 'STUDENT' | 'TEACHER' | 'SUPPORT' | 'CONTENT_MANAGER' | 'ADMIN' | 'SYSTEM';
  action: string;
  timestamp: string; // ISO 8601
}

export interface ContentIssueDto {
  id: string;
  targetContentId: string;
  targetContentType: TargetContentType;
  targetContentTitle: string;
  targetContentRoute?: string;
  title: string;
  description: string;
  issueType: ContentIssueType;
  priority: ContentPriority;
  status: ContentIssueStatus;
  reportedBy: string;
  supportStaffId?: string;
  supportStaffName: string;
  contentManagerId?: string;
  contentManagerName?: string;
  resolutionNotes?: string;
  feedbackToSupport?: string;
  resolutionVersion?: number;
  isOverdue?: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  resolvedAt?: string; // ISO 8601
  closedAt?: string; // ISO 8601
  history: ContentIssueHistoryDto[];
}

export interface CreateContentIssueDto {
  targetContentId: string;
  targetContentType: TargetContentType;
  targetContentTitle: string;
  targetContentRoute?: string;
  title: string;
  description: string;
  issueType: ContentIssueType;
  priority: ContentPriority;
  reportedBy: string;
  supportStaffId?: string;
  supportStaffName: string;
}

export interface ResolveContentIssueDto {
  resolutionNotes: string;
  feedbackToSupport: string;
  actorName?: string;
}
