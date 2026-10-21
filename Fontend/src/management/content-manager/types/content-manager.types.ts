export type ModerationContentType = 'HSK_CHARACTER' | 'CURRICULUM_LESSON' | 'GRAMMAR_POINT' | 'EXERCISE_QUESTION';

export type ModerationStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export type ContentIssueType =
  | 'WRONG_MEANING'
  | 'WRONG_PINYIN'
  | 'WRONG_ANSWER'
  | 'AUDIO_ERROR'
  | 'DISPLAY_ERROR'
  | 'OTHER';

export type ContentIssueStatus =
  | 'NEW'
  | 'TRIAGED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED';

export type ContentPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ContentAuditLogEntry {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'PUBLISH' | 'UNPUBLISH' | 'ARCHIVE' | 'RESTORE' | 'ISSUE_RESOLVED';
  actorName: string;
  actorRole: string;
  timestamp: string;
  notes?: string;
  previousVersion?: number;
  newVersion?: number;
}

export interface ModerationItem {
  id: string;
  contentId: string;
  contentType: ModerationContentType;
  title: string;
  hskLevel: number; // 1 to 6
  authorName: string;
  authorRole: 'TEACHER' | 'CONTENT_MANAGER';
  status: ModerationStatus;
  priority: ContentPriority;
  version: number;
  submittedAt: string;
  updatedAt: string;
  publishedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  changesSummary: string;
  diffSummary?: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
  previewData: {
    title: string;
    subtitle?: string;
    hanzi?: string;
    pinyin?: string;
    meaning?: string;
    examples?: { chinese: string; pinyin: string; vietnamese: string }[];
    structure?: string;
    questionText?: string;
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
    audioUrl?: string;
  };
}

export interface ContentIssueActivity {
  id: string;
  actorName: string;
  actorRole: 'SUPPORT' | 'CONTENT_MANAGER' | 'STUDENT';
  action: string;
  timestamp: string;
  message?: string;
}

export interface ContentIssue {
  id: string; // e.g. 'ISS-2026-001'
  title: string;
  description: string;
  issueType: ContentIssueType;
  priority: ContentPriority;
  targetContentId: string;
  targetContentType: ModerationContentType;
  targetContentTitle: string;
  targetContentRoute: string; // deep link into edit/preview
  reportedBy: string; // Student name or student ID
  supportStaffId: string;
  supportStaffName: string;
  contentManagerId?: string;
  contentManagerName?: string;
  status: ContentIssueStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  resolutionNotes?: string;
  resolutionVersion?: number;
  feedbackToSupport?: string;
  isOverdue?: boolean;
  history: ContentIssueActivity[];
}

export interface VersionSnapshot {
  id: string;
  contentId: string;
  contentType: ModerationContentType;
  contentTitle: string;
  version: number;
  status: ModerationStatus;
  changedBy: string;
  changedByRole: string;
  changeType: 'CREATE' | 'UPDATE' | 'PUBLISH' | 'UNPUBLISH' | 'RESTORE' | 'ISSUE_FIX';
  summary: string;
  timestamp: string;
  snapshotPayload: Record<string, any>;
}

export interface QualityMetrics {
  totalItems: number;
  pendingReviewCount: number;
  publishedCount: number;
  archivedCount: number;
  newIssuesCount: number;
  inProgressIssuesCount: number;
  overdueIssuesCount: number;
  resolvedIssuesCount: number;
  accuracyRate: number; // e.g. 98.4%
  avgResolutionHours: number; // e.g. 3.2 hours
  hskDistribution: {
    level: number;
    count: number;
    verifiedPercent: number;
  }[];
}
