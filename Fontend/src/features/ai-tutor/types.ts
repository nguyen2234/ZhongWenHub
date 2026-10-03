import type { SharedExerciseItem } from '../exercise-engine';

export type AITutorSource = 'dashboard' | 'lesson' | 'vocabulary' | 'practice' | 'mistake' | 'general';

export type AITutorMode = 'ASK' | 'EXPLAIN' | 'CORRECT' | 'PRACTICE' | 'CONVERSATION';

export interface ExerciseContext {
  exerciseId: number | string;
  question: string;
  userAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
  promptHanzi?: string;
  promptPinyin?: string;
  promptVietnamese?: string;
}

export interface AITutorContext {
  source: AITutorSource;
  hskLevel?: number;
  lessonId?: number;
  lessonTitle?: string;
  currentStep?: string;
  grammarPoints?: string[];
  vocabularyIds?: number[];
  vocabularyWord?: {
    hanzi: string;
    pinyin: string;
    meaning: string;
  };
  exerciseContext?: ExerciseContext;
  weaknesses?: string[];
  languagePreference?: 'Vietnamese' | 'English';
}

// Structured Blocks Types for Language Learning
export interface AIExplanationBlockData {
  type: 'explanation';
  title?: string;
  content: string;
  note?: string;
}

export interface AIChineseExampleData {
  type: 'chinese_example';
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  audioPrompt?: string;
  highlightWords?: string[];
}

export interface AIGrammarPatternData {
  type: 'grammar_pattern';
  pattern: string;
  formula: string;
  explanation: string;
  examples: {
    hanzi: string;
    pinyin: string;
    vietnamese: string;
  }[];
  commonMistake?: {
    wrong: string;
    right: string;
    reason: string;
  };
}

export interface AICorrectionBlockData {
  type: 'correction';
  originalSentence: string;
  correctedSentence: string;
  pinyin: string;
  vietnamese: string;
  explanation: string;
  diffItems: {
    type: 'same' | 'added' | 'removed' | 'changed';
    text: string;
  }[];
}

export interface AIPracticeBlockData {
  type: 'practice';
  instruction: string;
  exercise: SharedExerciseItem;
}

export interface AIVocabularyBlockData {
  type: 'vocabulary';
  hanzi: string;
  pinyin: string;
  meaning: string;
  hskLevel: number;
  examples: {
    hanzi: string;
    pinyin: string;
    vietnamese: string;
  }[];
  synonyms?: string[];
  antonyms?: string[];
}

export type AIResponseBlock =
  | AIExplanationBlockData
  | AIChineseExampleData
  | AIGrammarPatternData
  | AICorrectionBlockData
  | AIPracticeBlockData
  | AIVocabularyBlockData;

export interface StructuredAIResponse {
  type: 'structured' | 'markdown';
  summary?: string;
  markdownFallback?: string;
  blocks: AIResponseBlock[];
  suggestedActions: string[];
}

export interface AITutorMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content?: string;
  structuredResponse?: StructuredAIResponse;
  contextSnapshot?: AITutorContext;
  createdAt: string;
  feedback?: 'like' | 'dislike';
}

export interface AITutorConversation {
  id: string;
  userId: string;
  mode: AITutorMode;
  context: AITutorContext;
  messages: AITutorMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationTurn {
  id: string;
  speaker: 'ai' | 'user';
  hanzi: string;
  pinyin: string;
  vietnamese: string;
}

export interface ScenarioConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  aiRole: string;
  userRole: string;
  initialMessage: {
    hanzi: string;
    pinyin: string;
    vietnamese: string;
  };
}
