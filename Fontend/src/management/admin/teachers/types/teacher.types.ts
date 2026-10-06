export type { PaginatedResponse } from '../../../shared/types';

export type TeacherAccountStatus = 'ACTIVE' | 'PENDING' | 'LOCKED' | 'INACTIVE';
export type TeacherTeachingStatus = 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';

export type TeachingLevel =
  | 'HSK 1'
  | 'HSK 2'
  | 'HSK 3'
  | 'HSK 4'
  | 'HSK 5'
  | 'HSK 6'
  | 'HSK 7–9';

export type TeacherSpecialization =
  | 'GRAMMAR'
  | 'VOCABULARY'
  | 'PRONUNCIATION'
  | 'CONVERSATION'
  | 'LISTENING'
  | 'WRITING'
  | 'HSKK'
  | 'HSK_EXAM';

export const SPECIALIZATION_META: Record<TeacherSpecialization, { label: string; shortLabel: string }> = {
  GRAMMAR: { label: 'Ngữ pháp', shortLabel: 'Ngữ pháp' },
  VOCABULARY: { label: 'Từ vựng', shortLabel: 'Từ vựng' },
  PRONUNCIATION: { label: 'Phát âm & Thanh điệu', shortLabel: 'Phát âm' },
  CONVERSATION: { label: 'Hội thoại khẩu ngữ', shortLabel: 'Khẩu ngữ' },
  LISTENING: { label: 'Luyện nghe phản xạ', shortLabel: 'Luyện nghe' },
  WRITING: { label: 'Luyện viết đoạn văn', shortLabel: 'Luyện viết' },
  HSKK: { label: 'Khẩu ngữ HSKK', shortLabel: 'HSKK' },
  HSK_EXAM: { label: 'Luyện thi chứng chỉ HSK', shortLabel: 'Luyện thi' },
};

export interface TeacherProfessionalProfile {
  teachingLevels: TeachingLevel[];
  specializations: TeacherSpecialization[];
  qualifications: string;
  experienceYears: number;
  bio?: string;
}

export interface TeacherClassSummary {
  id: string;
  name: string;
  level: TeachingLevel;
  studentCount: number;
  schedule: string;
}

export interface TeacherTeachingSummary {
  classCount: number;
  studentCount: number;
  lessonCount: number;
  assignmentCount: number;
  assignedClasses: TeacherClassSummary[];
}

export interface TeacherRecentActivity {
  id: string;
  actionText: string;
  targetName: string;
  timeAgo: string;
  timestamp: string;
}

export interface TeacherListItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  accountStatus: TeacherAccountStatus;
  teachingStatus: TeacherTeachingStatus;
  teachingLevels: TeachingLevel[];
  specializations: TeacherSpecialization[];
  classCount: number;
  studentCount: number;
  lessonCount: number;
  joinedAt: string;
  joinedDateRaw: string;
  lastActiveAt: string;
  lastActiveDateRaw: string;
}

export interface TeacherDetail extends TeacherListItem {
  profile: TeacherProfessionalProfile;
  teachingSummary: TeacherTeachingSummary;
  recentActivities: TeacherRecentActivity[];
  lockReason?: string;
  lockedAt?: string;
  notes?: string;
}

export interface TeacherSummaryKPIs {
  totalTeachers: number;
  activeTeaching: number;
  onLeaveTeaching: number;
  activeClasses: number;
}

export interface TeacherFilters {
  search: string;
  accountStatus: 'ALL' | TeacherAccountStatus;
  teachingStatus: 'ALL' | TeacherTeachingStatus;
  teachingLevel: 'ALL' | TeachingLevel;
  specialization: 'ALL' | TeacherSpecialization;
}

export type TeacherSortField = 'name' | 'joinedDate' | 'lastActive' | 'classCount' | 'studentCount';
export type SortDirection = 'asc' | 'desc';

export interface TeacherSort {
  field: TeacherSortField;
  direction: SortDirection;
}

export interface CreateTeacherDTO {
  name: string;
  email: string;
  phone?: string;
  teachingLevels: TeachingLevel[];
  specializations: TeacherSpecialization[];
  qualifications: string;
  experienceYears: number;
  teachingStatus: TeacherTeachingStatus;
  bio?: string;
  notes?: string;
}

export interface UpdateTeacherDTO {
  name: string;
  email: string;
  phone?: string;
  teachingLevels: TeachingLevel[];
  specializations: TeacherSpecialization[];
  qualifications: string;
  experienceYears: number;
  teachingStatus: TeacherTeachingStatus;
  accountStatus?: TeacherAccountStatus;
  bio?: string;
  notes?: string;
}
