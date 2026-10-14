import type { ContentStatus } from './common-content.types';

/**
 * Course (Khóa học tổng quát):
 * e.g. "Giáo trình Chuẩn HSK ZhongWenHub", "Tiếng Trung Giao tiếp Cấp tốc"
 */
export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * CourseLevel: Cấp độ trong khóa học liên kết với chuẩn HskLevel
 */
export interface CourseLevel {
  id: string;
  courseId: string;
  hskLevelId: string;
  name: string; // e.g. 'HSK 1', 'HSK 2'
  orderIndex: number;
}

/**
 * Unit (Chủ đề bài học):
 */
export interface Unit {
  id: string;
  courseLevelId: string;
  unitNumber: number;
  titleZh: string;
  titleVi: string;
  description: string;
  orderIndex: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  // Computed aggregations
  lessonCount?: number;
  publishedLessonCount?: number;
}

/**
 * Lesson (Bài học cụ thể):
 */
export interface Lesson {
  id: string;
  unitId: string;
  lessonNumber: number;
  titleZh: string;
  titleVi: string;
  durationMinutes: number;
  xpReward: number;
  orderIndex: number;
  status: ContentStatus;
  summary: string;
  // Aggregated linked counts for Phase 1 inspection
  linkedVocabularyCount: number;
  linkedGrammarCount: number;
  exerciseCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Bảng liên kết N:N giữa Bài học và Từ vựng chuẩn:
 * Không sao chép toàn bộ object Vocabulary vào Lesson!
 */
export interface LessonVocabulary {
  id: string;
  lessonId: string;
  vocabularyId: string;
  displayOrder: number;
  customExampleZh?: string;
  customExampleVi?: string;
  isCoreWord: boolean;
}

/**
 * Bảng liên kết N:N giữa Bài học và Điểm ngữ pháp chuẩn:
 */
export interface LessonGrammar {
  id: string;
  lessonId: string;
  grammarPointId: string;
  displayOrder: number;
  lessonNotes?: string;
}

export interface UpdateUnitDTO {
  titleZh: string;
  titleVi: string;
  description: string;
  orderIndex: number;
  status: ContentStatus;
}

export interface UpdateLessonDTO {
  titleZh: string;
  titleVi: string;
  durationMinutes: number;
  xpReward: number;
  orderIndex: number;
  status: ContentStatus;
  summary: string;
}
