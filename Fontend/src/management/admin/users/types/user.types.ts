export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'PENDING';

export type HskLevelCode =
  | 'HSK 1'
  | 'HSK 2'
  | 'HSK 3'
  | 'HSK 4'
  | 'HSK 5'
  | 'HSK 6'
  | 'HSK 7–9';

export interface UserLearningSummary {
  currentHsk: HskLevelCode;
  totalXp: number;
  streakDays: number;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  vocabularyMastered: number;
  srsReviewDue: number;
  lastStudySession: string;
}

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  hskLevel: HskLevelCode;
  status: UserStatus;
  progressPercentage: number;
  joinedAt: string;
  joinedDateRaw: string;
  lastActiveAt: string;
  lastActiveDateRaw: string;
}

export interface UserDetail extends UserListItem {
  phone?: string;
  notes?: string;
  lockReason?: string;
  lockedAt?: string;
  learningSummary: UserLearningSummary;
}

export interface UserSummaryKPIs {
  totalLearners: number;
  activeLearners: number;
  lockedLearners: number;
  newLearners30d: number;
}

export interface UserFilters {
  search: string;
  status: 'ALL' | UserStatus;
  hskLevel: 'ALL' | HskLevelCode;
}

export type UserSortField = 'name' | 'joinedDate' | 'lastActive' | 'hskLevel' | 'progress';
export type SortDirection = 'asc' | 'desc';

export interface UserSort {
  field: UserSortField;
  direction: SortDirection;
}

export type { PaginatedResponse } from '../../../shared/types';

export interface CreateUserDTO {
  name: string;
  email: string;
  initialHsk: HskLevelCode;
  status: UserStatus;
  notes?: string;
}

export interface UpdateUserDTO {
  name: string;
  email: string;
  hskLevel: HskLevelCode;
  status: UserStatus;
  notes?: string;
}
