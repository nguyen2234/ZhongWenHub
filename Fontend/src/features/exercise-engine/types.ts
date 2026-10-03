// Shared Exercise Engine Types for Lesson, Practice Center, and Mistake Review

export type ExerciseType =
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

export type SkillCategory =
  | 'vocabulary'
  | 'grammar'
  | 'listening'
  | 'reading'
  | 'sentence'
  | 'comprehensive';

export interface MatchingPair {
  id: string;
  hanzi: string;
  meaning: string;
}

export interface SharedExerciseItem {
  id: number | string;
  type: ExerciseType;
  title: string;
  instruction: string;
  hskLevel?: number;
  unitId?: number;
  lessonId?: number;
  skill?: SkillCategory;
  difficulty?: 'easy' | 'medium' | 'hard';
  
  // Prompts & media
  promptHanzi?: string;
  promptPinyin?: string;
  promptVietnamese?: string;
  audioUrl?: string;
  
  // Options & Tokens
  options?: string[];
  correctOptionIndex?: number;
  matchingPairs?: MatchingPair[];
  sentenceTokens?: string[];
  correctSentence?: string;
  
  // Explanations & Context
  explanation: string;
  grammarPoint?: string;
  vocabularyIds?: number[];
  xpReward?: number;
}

// User attempt tracking for Adaptive Learning & Mistake review
export interface ExerciseAttempt {
  exerciseId: number | string;
  userId: string;
  answer: string | number | string[];
  isCorrect: boolean;
  responseTimeMs: number;
  attemptedAt: string;
}

// AI Tutor context package
export interface AIExplanationContext {
  exerciseId: number | string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  grammarPoint?: string;
  vocabularyIds?: number[];
  hskLevel?: number;
  lessonId?: number;
}
