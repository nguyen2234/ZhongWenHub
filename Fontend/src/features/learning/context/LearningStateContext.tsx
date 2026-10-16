import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type {
  StudentLearningState,
  PracticeAttemptRecord,
  WeakKnowledgeRecord,
  LearningRecommendation,
} from '../types/learning-state.types';
import type {
  UpdateLessonStepProgressPayload,
  CompleteLessonPayload,
} from '../../lesson/types/lesson-progress.types';
import type { PracticeSessionResult } from '../../practice/types';
import type { SRSRating } from '../../vocabulary/types';
import { learningStateService } from '../services/learning-state.service';
import { findLessonMetadata, type CurriculumLesson } from '../data/curriculumData';
import { getLocalDateString } from '../services/learning-storage.service';
import { useCurrentStudent } from '../../auth/services/student-identity.adapter';

export interface LearningStateContextType {
  state: StudentLearningState;
  currentHskLevel: number;
  currentLessonId: string;
  currentLesson: CurriculumLesson | undefined;
  completedLessonIds: string[];
  xpTotal: number;
  streakDays: number;
  dueVocabCount: number;
  learnedVocabCount: number;
  masteredVocabCount: number;
  weakKnowledge: WeakKnowledgeRecord[];
  recommendations: LearningRecommendation[];
  dailyGoal: {
    targetMinutes: number;
    targetXp: number;
    currentMinutes: number;
    currentXp: number;
    minutesPercent: number;
    xpPercent: number;
    isGoalMet: boolean;
  };
  selectHskLevel: (level: number) => void;
  startLesson: (lessonId: string) => void;
  updateLessonStep: (payload: UpdateLessonStepProgressPayload) => void;
  completeLesson: (payload: CompleteLessonPayload) => void;
  restartLesson: (lessonId: string) => void;
  recordPracticeAttempt: (attempt: PracticeAttemptRecord) => void;
  recordPracticeSession: (result: PracticeSessionResult) => void;
  recordSrsReview: (vocabId: string, rating: SRSRating) => void;
  completeSrsSession: (sessionXp?: number, count?: number) => void;
  resetDemoProgress: () => void;
  switchStudent: (studentId: string) => void;
}

const LearningStateContext = createContext<LearningStateContextType | null>(null);

export const LearningStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { studentId } = useCurrentStudent();
  const [state, setState] = useState<StudentLearningState>(() => learningStateService.getState());

  // Keep state synced with service subscriptions and active student changes
  useEffect(() => {
    learningStateService.switchStudent(studentId);
    setState(learningStateService.getState());

    const unsubscribe = learningStateService.subscribe((updated) => {
      setState(updated);
    });

    return () => {
      unsubscribe();
    };
  }, [studentId]);

  const selectHskLevel = useCallback((level: number) => {
    learningStateService.selectHskLevel(level);
  }, []);

  const startLesson = useCallback((lessonId: string) => {
    learningStateService.startLesson(lessonId);
  }, []);

  const updateLessonStep = useCallback((payload: UpdateLessonStepProgressPayload) => {
    learningStateService.updateLessonStep(payload);
  }, []);

  const completeLesson = useCallback((payload: CompleteLessonPayload) => {
    learningStateService.completeLesson(payload);
  }, []);

  const restartLesson = useCallback((lessonId: string) => {
    learningStateService.resetLessonProgress(lessonId);
  }, []);

  const recordPracticeAttempt = useCallback((attempt: PracticeAttemptRecord) => {
    learningStateService.recordPracticeAttempt(attempt);
  }, []);

  const recordPracticeSession = useCallback((result: PracticeSessionResult) => {
    learningStateService.recordPracticeSession(result);
  }, []);

  const recordSrsReview = useCallback((vocabId: string, rating: SRSRating) => {
    learningStateService.recordSrsReview(vocabId, rating);
  }, []);

  const completeSrsSession = useCallback((sessionXp: number = 30, count: number = 0) => {
    learningStateService.completeSrsSession(sessionXp, count);
  }, []);

  const resetDemoProgress = useCallback(() => {
    learningStateService.resetDemoProgress();
  }, []);

  const switchStudent = useCallback((newStudentId: string) => {
    learningStateService.switchStudent(newStudentId);
  }, []);

  // Computed values
  const currentLesson = useMemo(() => {
    return findLessonMetadata(state.currentLessonId);
  }, [state.currentLessonId]);

  const dueVocabCount = useMemo(() => {
    return Object.values(state.userVocabStates).filter((v) => v.isDueToday).length;
  }, [state.userVocabStates]);

  const learnedVocabCount = useMemo(() => {
    return Object.keys(state.userVocabStates).length;
  }, [state.userVocabStates]);

  const masteredVocabCount = useMemo(() => {
    return Object.values(state.userVocabStates).filter((v) => v.status === 'mastered').length;
  }, [state.userVocabStates]);

  const weakKnowledge = useMemo(() => {
    return learningStateService.getWeakKnowledge();
  }, [state.exerciseAttempts]);

  const recommendations = useMemo(() => {
    return learningStateService.getRecommendations();
  }, [state, weakKnowledge]);

  const dailyGoal = useMemo(() => {
    const todayStr = getLocalDateString();
    const todayActivity = state.dailyActivityHistory[todayStr] || {
      date: todayStr,
      minutes: 0,
      xpEarned: 0,
      completedLessons: [],
      exercisesCompleted: 0,
      reviewsCompleted: 0,
    };

    const targetMinutes = state.dailyGoal.targetMinutes || 30;
    const targetXp = state.dailyGoal.targetXp || 100;
    const currentMinutes = todayActivity.minutes || 0;
    const currentXp = todayActivity.xpEarned || 0;

    const minutesPercent = Math.min(100, Math.round((currentMinutes / targetMinutes) * 100));
    const xpPercent = Math.min(100, Math.round((currentXp / targetXp) * 100));
    const isGoalMet = currentMinutes >= targetMinutes || currentXp >= targetXp;

    return {
      targetMinutes,
      targetXp,
      currentMinutes,
      currentXp,
      minutesPercent,
      xpPercent,
      isGoalMet,
    };
  }, [state.dailyActivityHistory, state.dailyGoal]);

  const contextValue = useMemo<LearningStateContextType>(
    () => ({
      state,
      currentHskLevel: state.selectedHskLevel,
      currentLessonId: state.currentLessonId,
      currentLesson,
      completedLessonIds: state.completedLessonIds,
      xpTotal: state.xpTotal,
      streakDays: state.streakDays,
      dueVocabCount,
      learnedVocabCount,
      masteredVocabCount,
      weakKnowledge,
      recommendations,
      dailyGoal,
      selectHskLevel,
      startLesson,
      updateLessonStep,
      completeLesson,
      restartLesson,
      recordPracticeAttempt,
      recordPracticeSession,
      recordSrsReview,
      completeSrsSession,
      resetDemoProgress,
      switchStudent,
    }),
    [
      state,
      currentLesson,
      dueVocabCount,
      learnedVocabCount,
      masteredVocabCount,
      weakKnowledge,
      recommendations,
      dailyGoal,
      selectHskLevel,
      startLesson,
      updateLessonStep,
      completeLesson,
      restartLesson,
      recordPracticeAttempt,
      recordPracticeSession,
      recordSrsReview,
      completeSrsSession,
      resetDemoProgress,
      switchStudent,
    ]
  );

  return (
    <LearningStateContext.Provider value={contextValue}>
      {children}
    </LearningStateContext.Provider>
  );
};

export function useLearningState(): LearningStateContextType {
  const ctx = useContext(LearningStateContext);
  if (!ctx) {
    throw new Error('useLearningState must be used within a LearningStateProvider');
  }
  return ctx;
}
