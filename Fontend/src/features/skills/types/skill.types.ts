export type SkillType = 'listening' | 'speaking' | 'reading' | 'writing';

export interface ListeningExercise {
  id: string;
  title: string;
  hskLevel: number;
  audioText: string;
  transcriptPinyin: string;
  transcriptVietnamese: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface SpeakingPrompt {
  id: string;
  scenario: string;
  hskLevel: number;
  promptText: string;
  targetPinyin: string;
  targetVietnamese: string;
  hints: string[];
}

export interface ReadingPassage {
  id: string;
  title: string;
  hskLevel: number;
  contentChinese: string;
  contentPinyin: string;
  contentVietnamese: string;
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export interface WritingExercise {
  id: string;
  type: 'character-stroke' | 'sentence-order';
  hskLevel: number;
  hanzi?: string;
  pinyin?: string;
  meaning?: string;
  strokeCount?: number;
  radicals?: string;
  scrambledWords?: string[];
  correctSentence?: string;
  targetVietnamese?: string;
}
