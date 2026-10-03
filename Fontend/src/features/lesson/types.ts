export type LessonStepId =
  | 'intro'
  | 'vocabulary'
  | 'grammar'
  | 'dialogue'
  | 'listening'
  | 'exercise'
  | 'quiz'
  | 'complete';

export interface StepMetadata {
  id: LessonStepId;
  label: string;
  shortLabel: string;
  icon?: string;
}

export interface VocabularyItem {
  id: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  audioPrompt?: string;
  exampleHanzi: string;
  examplePinyin: string;
  exampleMeaning: string;
  hskLevel?: number;
  partOfSpeech?: string;
}

export interface GrammarPatternBlock {
  label: string;
  sublabel?: string;
  color?: string;
}

export interface GrammarExample {
  hanzi: string;
  pinyin: string;
  meaning: string;
}

export interface GrammarData {
  title: string;
  subtitle: string;
  patternFormula: string;
  patternBlocks: GrammarPatternBlock[];
  explanation: string;
  examples: GrammarExample[];
  commonMistake: {
    wrong: string;
    right: string;
    note: string;
  };
  quickPractice: {
    question: string;
    pinyin: string;
    blankWordTranslation: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface DialogueLine {
  id: number;
  speaker: 'A' | 'B';
  speakerName: string;
  speakerRole: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
}

export interface ListeningData {
  audioHanzi: string;
  audioPinyin: string;
  audioMeaning: string;
  prompt: string;
  options: {
    id: number;
    text: string;
    isCorrect: boolean;
  }[];
  explanation: string;
}

export type ExerciseType =
  | 'multiple-choice'
  | 'fill-blank'
  | 'sentence-order'
  | 'matching'
  | 'chinese-to-vietnamese'
  | 'vietnamese-to-chinese';

export interface MatchingPair {
  id: string;
  hanzi: string;
  meaning: string;
}

export interface ExerciseItem {
  id: number;
  type: ExerciseType;
  title: string;
  instruction: string;
  promptHanzi?: string;
  promptPinyin?: string;
  promptVietnamese?: string;
  options?: string[];
  correctOptionIndex?: number;
  matchingPairs?: MatchingPair[];
  sentenceTokens?: string[];
  correctSentence?: string;
  explanation: string;
}

export interface QuizQuestionItem {
  id: number;
  question: string;
  hanzi?: string;
  pinyin?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonData {
  id: number;
  hskLevel: number;
  unitNumber: number;
  lessonNumber: number;
  hanziTitle: string;
  pinyinTitle: string;
  vietnameseTitle: string;
  durationMinutes: number;
  xpReward: number;
  streakDays: number;
  objectives: string[];
  contextDialogueSnippet?: {
    hanzi: string;
    pinyin: string;
    meaning: string;
  };
  vocabulary: VocabularyItem[];
  grammar: GrammarData;
  dialogue: {
    title: string;
    situation: string;
    lines: DialogueLine[];
  };
  listening: ListeningData;
  exercises: ExerciseItem[];
  quiz: QuizQuestionItem[];
}
