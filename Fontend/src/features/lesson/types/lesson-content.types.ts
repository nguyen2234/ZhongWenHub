/**
 * Shared Normalized Lesson Content Contracts (DTOs)
 * Compatible with future Spring Boot REST API & JSON transport
 */

export interface HskLevelRefDTO {
  id: string;
  code: string;
  name: string;
  standardCode: string;
  standardVersion: string;
}

export interface LessonIntroDTO {
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

export interface LessonVocabularyDTO {
  id: string;
  lessonId: string;
  vocabularyId: string;
  simplified: string;
  traditional?: string;
  pinyin: string;
  meaningVi: string;
  partOfSpeech?: string;
  audioUrl?: string;
  isCoreWord: boolean;
  displayOrder: number;
  customExampleZh?: string;
  customExamplePinyin?: string;
  customExampleVi?: string;
}

export interface GrammarExampleDTO {
  zh: string;
  pinyin: string;
  meaningVi: string;
}

export interface GrammarMistakeDTO {
  wrong: string;
  right: string;
  note: string;
}

export interface GrammarQuickPracticeDTO {
  question: string;
  pinyin?: string;
  blankWordTranslation?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonGrammarDTO {
  id: string;
  lessonId: string;
  grammarPointId: string;
  code: string;
  title: string;
  explanation: string;
  structureFormula: string;
  displayOrder: number;
  lessonNotes?: string;
  examples: GrammarExampleDTO[];
  commonMistake?: GrammarMistakeDTO;
  quickPractice?: GrammarQuickPracticeDTO;
}

export interface DialogueLineDTO {
  id: string;
  speakerName: string;
  speakerRole?: string;
  zh: string;
  pinyin: string;
  meaningVi: string;
  audioUrl?: string;
  displayOrder: number;
}

export interface LessonDialogueDTO {
  id: string;
  title: string;
  situationZh?: string;
  situationVi?: string;
  audioUrl?: string;
  lines: DialogueLineDTO[];
}

export interface ListeningOptionDTO {
  id: number;
  text: string;
  isCorrect: boolean;
}

export interface LessonListeningDTO {
  id: string;
  title: string;
  audioUrl?: string;
  transcriptZh?: string;
  transcriptPinyin?: string;
  transcriptVi?: string;
  prompt?: string;
  options?: ListeningOptionDTO[];
  explanation?: string;
  displayOrder: number;
}

export type ExerciseTypeDTO =
  | 'multiple-choice'
  | 'fill-blank'
  | 'sentence-order'
  | 'matching'
  | 'listen-choice'
  | 'chinese-to-vietnamese'
  | 'vietnamese-to-chinese'
  | 'pronunciation'
  | 'speaking'
  | 'hanzi-writing';

export interface ExerciseMatchingPairDTO {
  id: string;
  hanzi: string;
  meaning: string;
}

/**
 * Neutral Exercise DTO for transport.
 * Spring Boot & REST JSON friendly; does NOT depend on React UI types.
 */
export interface ExerciseDTO {
  id: string;
  type: ExerciseTypeDTO;
  title: string;
  instruction: string;
  promptHanzi?: string;
  promptPinyin?: string;
  promptVietnamese?: string;
  audioUrl?: string;
  options?: string[];
  correctOptionIndex?: number;
  matchingPairs?: ExerciseMatchingPairDTO[];
  sentenceTokens?: string[];
  correctSentence?: string;
  explanation: string;
  xpReward?: number;
}

export interface LessonExerciseDTO {
  id: string;
  lessonId: string;
  exerciseId: string;
  section: 'PRACTICE' | 'QUIZ';
  displayOrder: number;
  points?: number;
  exercise: ExerciseDTO;
}

export type LessonContentStatus = 'DRAFT' | 'REVIEW' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

/**
 * Normalized Lesson Content Aggregate DTO
 * Does NOT contain user progress, streak, or SRS metrics.
 */
export interface LessonDetailDTO {
  id: string;
  courseLevelId: string;
  unitId: string;
  unitNumber?: number;
  lessonNumber: number;
  status: LessonContentStatus;
  hskLevel: HskLevelRefDTO;
  intro: LessonIntroDTO;
  vocabularies: LessonVocabularyDTO[];
  grammars: LessonGrammarDTO[];
  dialogue: LessonDialogueDTO;
  listenings: LessonListeningDTO[];
  exercises: LessonExerciseDTO[];
  createdAt?: string;
  updatedAt?: string;
}
