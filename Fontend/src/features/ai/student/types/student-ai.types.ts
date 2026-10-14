/**
 * Student AI Personalized Learning Data Contracts
 * Supports evidence-based learner modeling, adaptive path recommendations, and diagnostic AI grading.
 */

export interface LearningEvidence {
  evidenceId: string;
  evidenceSource: 'PRACTICE_CENTER' | 'HOMEWORK' | 'SRS_REVIEW' | 'LESSON_STEP' | 'AI_TUTOR_CHAT';
  sourceReferenceId: string;
  knowledgePointId: string;
  knowledgePointTitle: string;
  skill: 'READING' | 'LISTENING' | 'GRAMMAR' | 'VOCABULARY' | 'TRANSLATION';
  outcome: 'CORRECT' | 'INCORRECT' | 'PARTIAL';
  confidenceScore: number; // 0.0 - 1.0
  recordedAt: string;
}

export interface KnowledgeMastery {
  knowledgePointId: string;
  title: string;
  hskLevel: string;
  masteryPercent: number; // 0 - 100
  totalAttempts: number;
  lastPracticedAt: string;
}

export interface WeakKnowledgeItem {
  id: string;
  title: string;
  category: 'GRAMMAR' | 'VOCABULARY' | 'PINYIN' | 'LISTENING';
  hskLevel: string;
  errorFrequency: number;
  explanationVi: string;
  recommendedAction: string;
}

export interface AIPracticeRecommendation {
  recommendationId: string;
  hskLevel: string;
  focusArea: string;
  suggestedExerciseTypes: string[];
  reasonVi: string;
  estimatedMinutes: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AIGradingRequest {
  studentId: string;
  assignmentId: string;
  exerciseId: string;
  exerciseType: string;
  hskLevel: string;
  prompt: string;
  studentAnswer: string;
  referenceAnswer?: string;
  rubricCriteria?: string[];
}

export interface AIGradingResult {
  evaluationId: string;
  studentId: string;
  exerciseId: string;
  answerId: string;
  hskLevel: string;
  skillCategory: 'GRAMMAR' | 'VOCABULARY' | 'WRITING' | 'TRANSLATION';
  suggestedScore: number;
  maxScore: number;
  grammarErrors: Array<{
    segment: string;
    correction: string;
    ruleExplanationVi: string;
  }>;
  vocabularyErrors: Array<{
    term: string;
    betterAlternative: string;
    contextVi: string;
  }>;
  feedback: string;
  improvementSuggestions: string[];
  confidence: number;
  modelVersion: string;
  evaluationTimestamp: string;
}

export interface AdaptiveLearningRecommendation {
  recommendationId: string;
  studentId: string;
  currentHskLevel: string;
  nextRecommendedStep: {
    type: 'REVIEW_WEAK_POINT' | 'ADVANCE_LESSON' | 'SPEED_PRACTICE';
    title: string;
    targetRoute: string;
  };
  rationale: string;
  generatedAt: string;
}

export interface StudentLearningProfile {
  studentId: string;
  targetHskLevel: string;
  currentMasteryAverage: number;
  totalEvidenceCount: number;
  recentWeakPoints: WeakKnowledgeItem[];
  masteryBreakdown: KnowledgeMastery[];
  activeRecommendations: AIPracticeRecommendation[];
  updatedAt: string;
}
