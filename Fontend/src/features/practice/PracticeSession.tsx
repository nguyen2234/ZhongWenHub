import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Zap, AlertCircle, Sparkles } from 'lucide-react';
import { useLearningState } from '../learning';
import { ExerciseRenderer, gradeExerciseSubmission } from '../exercise-engine';
import { ContextBuilder, useAITutor } from '../ai-tutor';
import { PracticeResult } from './components/PracticeResult';
import {
  practiceQuestionBankService,
  type BackendQuestionResultItem,
  type PracticeQuestionItem,
  type SubmitPracticeAnswerPayload,
} from './services/practice-question-bank.service';
import type { PracticeMode, PracticeSessionResult } from './types';
import './practice-center.css';

interface PracticeSessionProps {
  mode: PracticeMode;
  title: string;
  subtitle: string;
  hskLevel: number;
  exercises: PracticeQuestionItem[];
  backendSessionId?: string;
  onExit: () => void;
  onContinueRecommended?: () => void;
  onReviewMistakes?: () => void;
}

export const PracticeSession: React.FC<PracticeSessionProps> = ({
  mode,
  title,
  subtitle,
  hskLevel,
  exercises,
  backendSessionId,
  onExit,
  onContinueRecommended,
  onReviewMistakes,
}) => {
  const { recordPracticeAttempt, recordPracticeSession, state: learningState, syncWithServer } = useLearningState();
  const { openAITutor } = useAITutor();

  const isBackendGraded = Boolean(backendSessionId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [orderedTokens, setOrderedTokens] = useState<string[]>([]);
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState<string>('');

  // Store answers across questions when backend-graded session is active (zero answer leak before submit)
  const [collectedAnswers, setCollectedAnswers] = useState<Record<string, SubmitPracticeAnswerPayload>>({});
  const [isSubmittingBackend, setIsSubmittingBackend] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [backendQuestionResults, setBackendQuestionResults] = useState<BackendQuestionResultItem[] | undefined>(
    undefined
  );

  const [hasChecked, setHasChecked] = useState(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
  const [startTime] = useState(() => Date.now());
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeList, setMistakeList] = useState<{ exercise: PracticeQuestionItem; answer: string }[]>([]);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [completedResult, setCompletedResult] = useState<PracticeSessionResult | null>(null);

  const currentExercise = exercises[currentIndex];

  useEffect(() => {
    if (!currentExercise) return;
    const saved = collectedAnswers[String(currentExercise.id)];
    setSelectedOption(saved?.selectedOption ?? null);
    setTextAnswer(saved?.textAnswer ?? '');
    setMatchedPairs(saved?.matchedPairs ?? []);
    setSelectedLeft(null);
    setSelectedRight(null);
    setHasChecked(false);
    setIsCurrentCorrect(false);
    setSubmitError(null);

    const usesTokens =
      currentExercise.type === 'sentence-order' &&
      Array.isArray(currentExercise.sentenceTokens) &&
      currentExercise.sentenceTokens.length > 0 &&
      (!currentExercise.options || currentExercise.options.length === 0);

    if (usesTokens && currentExercise.sentenceTokens) {
      if (saved?.orderedTokens && saved.orderedTokens.length > 0) {
        setOrderedTokens(saved.orderedTokens);
        setAvailableTokens([]);
      } else {
        setOrderedTokens([]);
        const shuffled = [...currentExercise.sentenceTokens];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setAvailableTokens(shuffled);
      }
    } else {
      setOrderedTokens([]);
      setAvailableTokens([]);
    }
  }, [currentIndex, currentExercise]);

  if (!exercises || exercises.length === 0) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--muted)' }}>
        Không tìm thấy câu hỏi phù hợp cho phiên luyện tập này.
        <br />
        <button type="button" className="ds-btn ds-btn-primary" style={{ marginTop: 'var(--space-4)' }} onClick={onExit}>
          Quay lại Trung tâm luyện tập
        </button>
      </div>
    );
  }

  const handleSelectToken = (token: string, idx: number) => {
    if (hasChecked) return;
    setOrderedTokens((prev) => [...prev, token]);
    setAvailableTokens((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveToken = (token: string, idx: number) => {
    if (hasChecked) return;
    setAvailableTokens((prev) => [...prev, token]);
    setOrderedTokens((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleLeftClick = (id: string) => {
    if (hasChecked || matchedPairs.includes(id)) return;
    setSelectedLeft(id);
    if (selectedRight) checkMatchingPair(id, selectedRight);
  };

  const handleRightClick = (id: string) => {
    if (hasChecked || matchedPairs.includes(id)) return;
    setSelectedRight(id);
    if (selectedLeft) checkMatchingPair(selectedLeft, id);
  };

  const checkMatchingPair = (leftId: string, rightId: string) => {
    if (leftId === rightId) {
      const updated = [...matchedPairs, leftId];
      setMatchedPairs(updated);
      setSelectedLeft(null);
      setSelectedRight(null);

      if (!isBackendGraded && updated.length === (currentExercise.matchingPairs?.length || 0)) {
        setIsCurrentCorrect(true);
        setHasChecked(true);
        setCorrectCount((prev) => prev + 1);
        recordPracticeAttempt({
          id: `att-${Date.now()}-${currentExercise.id}`,
          studentId: learningState.studentId,
          exerciseId: String(currentExercise.id),
          knowledgePointId: currentExercise.grammarPoint || currentExercise.title || `ex-${currentExercise.id}`,
          topicTitle: currentExercise.grammarPoint || currentExercise.title,
          category: (currentExercise.skill as any) || 'vocabulary',
          hskLevel: currentExercise.hskLevel || hskLevel,
          userAnswer: 'matched pairs',
          isCorrect: true,
          attemptedAt: new Date().toISOString(),
        });
      }
    } else {
      setTimeout(() => {
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 400);
    }
  };

  const handleCheck = () => {
    if (!currentExercise || hasChecked || isBackendGraded) return;

    const { isCorrect: right, givenAnswer } = gradeExerciseSubmission(currentExercise, {
      selectedOption,
      orderedTokens,
      matchedPairs,
      textAnswer,
    });

    setIsCurrentCorrect(right);
    setHasChecked(true);

    recordPracticeAttempt({
      id: `att-${Date.now()}-${currentExercise.id}`,
      studentId: learningState.studentId,
      exerciseId: String(currentExercise.id),
      knowledgePointId: currentExercise.grammarPoint || currentExercise.title || `ex-${currentExercise.id}`,
      topicTitle: currentExercise.grammarPoint || currentExercise.title,
      category: (currentExercise.skill as any) || 'grammar',
      hskLevel: currentExercise.hskLevel || hskLevel,
      userAnswer: String(givenAnswer),
      isCorrect: right,
      attemptedAt: new Date().toISOString(),
    });

    if (right) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setMistakeList((prev) => [...prev, { exercise: currentExercise, answer: givenAnswer }]);
    }
  };

  const saveCurrentAnswerSnapshot = (): Record<string, SubmitPracticeAnswerPayload> => {
    const qId = String(currentExercise.id);
    const updated: Record<string, SubmitPracticeAnswerPayload> = {
      ...collectedAnswers,
      [qId]: {
        questionId: qId,
        selectedOption,
        orderedTokens,
        matchedPairs,
        textAnswer,
      },
    };
    setCollectedAnswers(updated);
    return updated;
  };

  const handleBackendAdvanceOrSubmit = async () => {
    const snapshot = saveCurrentAnswerSnapshot();

    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    if (!backendSessionId) return;
    setIsSubmittingBackend(true);
    setSubmitError(null);
    try {
      const totalTimeSec = Math.max(5, Math.round((Date.now() - startTime) / 1000));
      const payload = exercises.map(
        (ex) =>
          snapshot[String(ex.id)] || {
            questionId: String(ex.id),
            selectedOption: null,
          }
      );

      const res = await practiceQuestionBankService.submitPracticeSession(backendSessionId, payload, totalTimeSec);
      const wrongResults = res.questionResults.filter((r) => !r.isCorrect);
      const weakMap: Record<string, number> = {};
      wrongResults.forEach((w) => {
        const key = w.title || `Kỹ năng ${w.skill}`;
        weakMap[key] = (weakMap[key] || 0) + 1;
      });

      const finalResult: PracticeSessionResult = {
        sessionId: res.sessionId,
        mode,
        skillTitle: title,
        hskLevel,
        totalQuestions: res.totalQuestions,
        correctAnswers: res.correctCount,
        accuracy: Math.round(res.accuracy),
        timeSpentSeconds: res.timeSpentSeconds,
        xpEarned: res.xpAwarded,
        weakPoints: Object.entries(weakMap).map(([t, count]) => ({ title: t, count })),
        mistakeIds: wrongResults.map((w) => w.questionId),
      };

      setBackendQuestionResults(res.questionResults);
      setCompletedResult(finalResult);
      setSessionCompleted(true);
      if (syncWithServer) {
        void syncWithServer();
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Không thể nộp bài lên máy chủ. Vui lòng thử lại.');
    } finally {
      setIsSubmittingBackend(false);
    }
  };

  const handleNext = () => {
    if (isBackendGraded) {
      void handleBackendAdvanceOrSubmit();
      return;
    }

    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      const totalTimeSec = Math.max(5, Math.round((Date.now() - startTime) / 1000));
      const accuracyPct = Math.round((correctCount / exercises.length) * 100);
      const earnedXp = Math.min(100, Math.max(5, correctCount * 5));

      const weakPointsMap: Record<string, number> = {};
      mistakeList.forEach((m) => {
        const point = m.exercise.grammarPoint || m.exercise.title;
        weakPointsMap[point] = (weakPointsMap[point] || 0) + 1;
      });

      const finalResult: PracticeSessionResult = {
        sessionId: 'sess-' + Date.now(),
        mode,
        skillTitle: title,
        hskLevel,
        totalQuestions: exercises.length,
        correctAnswers: correctCount,
        accuracy: accuracyPct,
        timeSpentSeconds: totalTimeSec,
        xpEarned: earnedXp,
        weakPoints: Object.entries(weakPointsMap).map(([t, count]) => ({ title: t, count })),
        mistakeIds: mistakeList.map((m) => m.exercise.id),
      };

      setCompletedResult(finalResult);
      setSessionCompleted(true);
      recordPracticeSession(finalResult);
    }
  };

  const usesTokenBuilder =
    currentExercise?.type === 'sentence-order' &&
    Array.isArray(currentExercise.sentenceTokens) &&
    currentExercise.sentenceTokens.length > 0 &&
    (!currentExercise.options || currentExercise.options.length === 0);

  const hasOptions = Array.isArray(currentExercise?.options) && (currentExercise?.options.length ?? 0) > 0;

  const canProceed = usesTokenBuilder
    ? orderedTokens.length > 0 && availableTokens.length === 0
    : currentExercise?.type === 'matching' && (!hasOptions)
    ? matchedPairs.length === (currentExercise.matchingPairs?.length || 0)
    : hasOptions
    ? selectedOption !== null
    : textAnswer.trim().length > 0;

  if (sessionCompleted && completedResult) {
    return (
      <PracticeResult
        result={completedResult}
        questionResults={backendQuestionResults}
        onContinueRecommended={() => {
          if (onContinueRecommended) onContinueRecommended();
          else onExit();
        }}
        onReviewMistakes={() => {
          if (onReviewMistakes) onReviewMistakes();
          else onExit();
        }}
        onBackToCenter={onExit}
      />
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / exercises.length) * 100);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          height: '60px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          padding: '0 var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            type="button"
            onClick={onExit}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
              color: 'var(--muted)',
              cursor: 'pointer',
            }}
            title="Thoát phiên luyện tập"
          >
            <X size={18} />
          </button>

          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--foreground)' }}>{title}</div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 500 }}>
              {subtitle} · HSK {currentExercise?.hskLevel || hskLevel}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            minWidth: '140px',
            maxWidth: '280px',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
            {currentIndex + 1} / {exercises.length}
          </span>
          <div
            style={{
              flex: 1,
              height: '7px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--border)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                backgroundColor: 'var(--primary)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.25s ease',
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            color: 'var(--streak)',
            backgroundColor: 'var(--streak-bg)',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
          }}
        >
          <Zap size={13} />
          <span>{isBackendGraded ? 'Chấm Server' : '+20 XP'}</span>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'var(--space-6) var(--space-4) 170px var(--space-4)',
          maxWidth: '680px',
          width: '100%',
          margin: '0 auto',
          gap: '12px',
        }}
      >
        {currentExercise.selectionReasonLabel && (
          <div
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              color: '#1E40AF',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} />
            <span>Adaptive: {currentExercise.selectionReasonLabel}</span>
          </div>
        )}

        {submitError && (
          <div
            role="alert"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#991B1B',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertCircle size={15} />
            <span>{submitError}</span>
          </div>
        )}

        <div
          style={{
            width: '100%',
            borderRadius: 'var(--radius-2xl)',
            backgroundColor: 'var(--surface)',
            border: '1.5px solid var(--border)',
            padding: 'var(--space-6)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          <ExerciseRenderer
            exercise={currentExercise}
            mode={isBackendGraded ? 'exam' : 'practice'}
            hasChecked={hasChecked}
            isCorrect={isCurrentCorrect}
            textAnswer={textAnswer}
            onTextAnswerChange={setTextAnswer}
            selectedOption={selectedOption}
            onSelectOption={setSelectedOption}
            orderedTokens={orderedTokens}
            availableTokens={availableTokens}
            onSelectToken={handleSelectToken}
            onRemoveToken={handleRemoveToken}
            matchedPairs={matchedPairs}
            selectedLeft={selectedLeft}
            selectedRight={selectedRight}
            onLeftClick={handleLeftClick}
            onRightClick={handleRightClick}
            onAskAI={(ctx) => {
              const aiCtx = ContextBuilder.build('practice', {
                hskLevel,
                lessonTitle: title,
                grammarPoints: ctx.grammarPoint ? [ctx.grammarPoint] : undefined,
                exerciseContext: {
                  exerciseId: ctx.exerciseId,
                  question: ctx.question,
                  userAnswer: ctx.userAnswer,
                  correctAnswer: ctx.correctAnswer,
                  explanation: ctx.explanation,
                },
              });
              openAITutor(aiCtx, `Giải thích câu hỏi "${ctx.question}" giúp tôi.`);
            }}
          />
        </div>
      </main>

      <footer className="practice-session-footer">
        <div
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isBackendGraded && currentIndex > 0 && (
              <button
                type="button"
                className="ds-btn ds-btn-ghost"
                onClick={() => {
                  saveCurrentAnswerSnapshot();
                  setCurrentIndex((prev) => Math.max(0, prev - 1));
                }}
              >
                Quay lại
              </button>
            )}
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              {isBackendGraded
                ? 'Đáp án sẽ được chấm bảo mật khi nộp bài'
                : hasChecked
                ? isCurrentCorrect
                  ? '🎉 Hoàn hảo!'
                  : '⚠️ Hãy xem lại giải thích'
                : 'Chọn câu trả lời để kiểm tra'}
            </span>
          </div>

          <div>
            {!isBackendGraded && !hasChecked ? (
              <button
                type="button"
                disabled={!canProceed}
                onClick={handleCheck}
                style={{
                  minWidth: '140px',
                  padding: '12px 28px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: canProceed ? 'var(--primary)' : 'var(--border)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  cursor: canProceed ? 'pointer' : 'not-allowed',
                }}
              >
                KIỂM TRA
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmittingBackend || (isBackendGraded && !canProceed)}
                onClick={handleNext}
                style={{
                  minWidth: '165px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '12px 26px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor:
                    isSubmittingBackend || (isBackendGraded && !canProceed) ? 'var(--border)' : 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  cursor: isSubmittingBackend || (isBackendGraded && !canProceed) ? 'not-allowed' : 'pointer',
                }}
              >
                <span>
                  {isSubmittingBackend
                    ? 'Đang chấm điểm...'
                    : currentIndex < exercises.length - 1
                    ? 'CÂU TIẾP THEO'
                    : isBackendGraded
                    ? 'NỘP BÀI & CHẤM ĐIỂM'
                    : 'XEM KẾT QUẢ'}
                </span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
