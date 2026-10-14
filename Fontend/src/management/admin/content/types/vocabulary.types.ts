import type { ContentStatus } from './common-content.types';

/**
 * Trong kiến trúc quan hệ Spring Data JPA + SQL Server:
 * Bảng `vocabulary_examples` liên kết 1:N với bảng `vocabularies`.
 * Không lưu trữ ví dụ dưới dạng một blob JSON phi chuẩn.
 */
export interface VocabularyExample {
  id: string;
  vocabularyId?: string;
  zh: string;
  pinyin: string;
  meaningVi: string;
  displayOrder: number;
}

/**
 * Thực thể Từ vựng Chuẩn HSK (Standard Reference Vocabulary).
 * Tách biệt hoàn toàn khỏi Lesson, không chứa lessonId, studentProgress, SRS.
 */
export interface Vocabulary {
  id: string;
  hskLevelId: string;
  simplified: string;
  traditional: string;
  pinyin: string;
  meaningVi: string;
  meaningEn: string;
  partOfSpeech: string;
  audioUrl?: string;
  examples: VocabularyExample[];
  status: ContentStatus;
  source: string; // e.g. 'HSK 3.0 Standard Vocabulary List'
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyFilters {
  search: string;
  hskLevelId: string; // 'ALL' or specific levelId
  partOfSpeech: string;
  status: 'ALL' | ContentStatus;
}

export interface CreateVocabularyDTO {
  hskLevelId: string;
  simplified: string;
  traditional: string;
  pinyin: string;
  meaningVi: string;
  meaningEn: string;
  partOfSpeech: string;
  audioUrl?: string;
  examples: Omit<VocabularyExample, 'id'>[];
  status: ContentStatus;
}

export interface UpdateVocabularyDTO {
  hskLevelId: string;
  simplified: string;
  traditional: string;
  pinyin: string;
  meaningVi: string;
  meaningEn: string;
  partOfSpeech: string;
  audioUrl?: string;
  examples: VocabularyExample[];
  status: ContentStatus;
}
