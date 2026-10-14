/**
 * Teacher AI Lesson Optimization & Curriculum Analysis Contracts
 * Provides structured diagnostic analysis of lesson materials for Chinese language teachers.
 */

export interface LessonOptimizationAnalysis {
  analysisId: string;
  lessonId: string;
  teacherId: string;
  hskLevel: string;
  overallSuitabilityScore: number; // 0 - 100
  hskLevelAppropriateness: {
    isAppropriate: boolean;
    outOfLevelHanziCount: number;
    outOfLevelHanziList: string[];
    recommendedReplacements: Array<{ original: string; suggested: string; hskLevel: string }>;
  };
  vocabularyCoverage: {
    totalWords: number;
    coreHskWordsCount: number;
    coveragePercent: number;
    missingKeyTermsVi: string[];
  };
  grammarCoverage: {
    detectedGrammarPoints: string[];
    missingPrerequisites: string[];
  };
  classWeaknessAlignment: {
    matchedClassId: string;
    addressesClassWeaknesses: boolean;
    relevanceNotesVi: string;
  };
  improvementSuggestions: string[];
  requiresTeacherApproval: boolean;
  analyzedAt: string;
}
