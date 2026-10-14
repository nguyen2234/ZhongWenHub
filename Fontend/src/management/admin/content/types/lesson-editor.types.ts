import type { ContentStatus } from './common-content.types';
import type { Vocabulary } from './vocabulary.types';
import type { GrammarPoint } from './grammar.types';
import type { SharedExerciseItem } from '../../../../features/exercise-engine/types';

/**
 * Trạng thái độ hoàn thiện của từng mục trong trình soạn thảo Admin.
 * Lưu ý: Đây là trạng thái BIÊN TẬP NỘI DUNG (Content Authoring),
 * TUYỆT ĐỐI KHÔNG dùng trạng thái học viên (LOCKED, IN_PROGRESS, COMPLETED).
 */
export type AuthoringCompletenessStatus = 'COMPLETE' | 'INCOMPLETE' | 'WARNING';

/**
 * 7 phân đoạn cấu trúc bài học trong Studio
 */
export type EditorSectionKey =
  | 'intro'
  | 'vocabulary'
  | 'grammar'
  | 'dialogue'
  | 'listening'
  | 'practice'
  | 'quiz';

/**
 * Section 1: Giới thiệu & Siêu dữ liệu bài học
 */
export interface LessonIntroData {
  titleZh: string;
  titleVi: string;
  pinyinTitle?: string;
  summary: string;
  durationMinutes: number;
  xpReward: number;
  objectives: string[];
  contextDialogueSnippet?: {
    hanzi: string;
    pinyin: string;
    meaningVi: string;
  };
}

/**
 * Section 2: Liên kết từ vựng chuẩn (LessonVocabulary N:N)
 * Không sao chép toàn bộ Vocabulary vào bài học!
 */
export interface LessonVocabularyItem {
  id: string;
  lessonId: string;
  vocabularyId: string;
  displayOrder: number;
  isCoreWord: boolean;
  customExampleZh?: string;
  customExamplePinyin?: string;
  customExampleVi?: string;
  // Tham chiếu đã được nối (hydrated) từ kho HSK phục vụ hiển thị
  vocabulary?: Vocabulary;
}

/**
 * Section 3: Liên kết điểm ngữ pháp chuẩn (LessonGrammar N:N)
 */
export interface LessonGrammarItem {
  id: string;
  lessonId: string;
  grammarPointId: string;
  displayOrder: number;
  lessonNotes?: string;
  quickPractice?: {
    question: string;
    pinyin?: string;
    blankWordTranslation?: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  // Tham chiếu đã được nối từ kho HSK phục vụ hiển thị
  grammarPoint?: GrammarPoint;
}

/**
 * Section 4: Hội thoại thực tế
 */
export interface DialogueLineItem {
  id: string;
  dialogueId: string;
  speakerName: string;
  speakerRole?: string;
  zh: string;
  pinyin: string;
  meaningVi: string;
  audioUrl?: string;
  displayOrder: number;
}

export interface LessonDialogueData {
  id: string;
  lessonId: string;
  title: string;
  situationZh: string;
  situationVi: string;
  audioUrl?: string;
  lines: DialogueLineItem[];
}

/**
 * Section 5: Luyện nghe hiểu
 */
export interface LessonListeningItem {
  id: string;
  lessonId: string;
  title: string;
  audioUrl: string;
  transcriptZh?: string;
  transcriptPinyin?: string;
  transcriptVi?: string;
  prompt?: string;
  options?: Array<{
    id: number;
    text: string;
    isCorrect: boolean;
  }>;
  explanation?: string;
  displayOrder: number;
}

/**
 * Section 6 & 7: Bài tập & Câu hỏi trắc nghiệm
 * QUAN TRỌNG: Luyện tập (PRACTICE) và Kiểm tra (QUIZ) dùng CHUNG Exercise Engine (SharedExerciseItem)
 * Không được tạo mô hình câu hỏi Quiz độc lập!
 */
export interface LessonExerciseItem {
  id: string;
  lessonId: string;
  exerciseId: string;
  section: 'PRACTICE' | 'QUIZ';
  displayOrder: number;
  points?: number; // Chỉ định điểm số trong bài kiểm tra (mặc định 10)
  exercise: SharedExerciseItem;
}

/**
 * Bản nháp toàn diện tổng hợp 7 phần (Aggregate Draft Root)
 */
export interface LessonEditorDraft {
  lessonId: string;
  unitId: string;
  lessonNumber: number;
  status: ContentStatus;
  intro: LessonIntroData;
  vocabularies: LessonVocabularyItem[];
  grammars: LessonGrammarItem[];
  dialogue: LessonDialogueData;
  listenings: LessonListeningItem[];
  exercises: LessonExerciseItem[];
  updatedAt: string;
}

/**
 * Vấn đề kiểm tra tính hợp lệ
 */
export interface ValidationIssue {
  section: EditorSectionKey;
  severity: 'ERROR' | 'WARNING';
  message: string;
}

export interface SectionValidationResult {
  status: AuthoringCompletenessStatus;
  issues: string[];
}

export interface LessonValidationSummary {
  overallStatus: 'COMPLETE' | 'INCOMPLETE' | 'WARNING';
  sections: Record<EditorSectionKey, SectionValidationResult>;
  totalErrors: number;
  totalWarnings: number;
}
