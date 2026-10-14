import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import { studentHomeworkService } from '../services/student-homework.service';
import { studentAttemptService } from '../services/student-attempt.service';
import { getCurrentStudentIdentity } from '../../auth/services/student-identity.adapter';
import type {
  StudentAssignmentRunnerDTO,
  StudentAssignmentAttempt,
  StudentQuestionAnswer,
} from '../types/student-homework.types';
import { useAssignmentRunner } from '../hooks/useAssignmentRunner';
import { RunnerHeader } from '../components/runner/RunnerHeader';
import { RunnerQuestionHost } from '../components/runner/RunnerQuestionHost';
import { RunnerQuestionPalette } from '../components/runner/RunnerQuestionPalette';
import { SubmitConfirmModal } from '../components/runner/SubmitConfirmModal';

export const StudentAssignmentRunnerPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const currentStudent = getCurrentStudentIdentity();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runnerData, setRunnerData] = useState<StudentAssignmentRunnerDTO | null>(null);
  const [attempt, setAttempt] = useState<StudentAssignmentAttempt | null>(null);

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Initialize runner data and attempt
  useEffect(() => {
    let isMounted = true;

    async function initRunner() {
      if (!assignmentId) return;

      try {
        setLoading(true);
        setError(null);

        // 1. Fetch runner question package
        const data = await studentHomeworkService.getAssignmentRunner(assignmentId, currentStudent.id);
        if (!data) {
          throw new Error('Không thể tải đề bài hoặc bạn không có quyền truy cập bài tập này.');
        }

        // 2. Check for unsupported questions
        const unsupported = data.questions.filter((q) => !q.isSupported);
        if (unsupported.length > 0) {
          throw new Error(
            `Bài tập chứa ${unsupported.length} câu hỏi thuộc dạng chưa hỗ trợ thi trực tuyến (${unsupported
              .map((q) => q.exerciseType)
              .join(', ')}). Không thể tiến hành làm bài.`
          );
        }

        // 3. Resolve active attempt or start new attempt
        let activeAttempt = await studentAttemptService.getActiveAttempt(assignmentId, currentStudent.id);
        if (!activeAttempt) {
          activeAttempt = await studentAttemptService.startAttempt(assignmentId, currentStudent.id);
        }

        // If attempt is already submitted or expired, navigate to result
        if (activeAttempt.status === 'SUBMITTED' || activeAttempt.status === 'EXPIRED') {
          navigate(`/homework/${assignmentId}/result/${activeAttempt.id}`, { replace: true });
          return;
        }

        if (isMounted) {
          setRunnerData(data);
          setAttempt(activeAttempt);
        }
      } catch (err: any) {
        console.error('[StudentAssignmentRunnerPage] Init error:', err);
        if (isMounted) {
          setError(err?.message || 'Không thể khởi động phiên làm bài.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initRunner();

    return () => {
      isMounted = false;
    };
  }, [assignmentId]);

  // Submission handler
  const handleFinalSubmit = useCallback(
    async (finalAnswers: Record<string, StudentQuestionAnswer>) => {
      if (!attempt || !assignmentId) return;

      try {
        setIsSubmitting(true);
        const submitted = await studentAttemptService.submitAttempt(
          attempt.id,
          currentStudent.id,
          finalAnswers
        );
        navigate(`/homework/${assignmentId}/result/${submitted.id}`, { replace: true });
      } catch (err: any) {
        console.error('[StudentAssignmentRunnerPage] Submit error:', err);
        alert(err?.message || 'Có lỗi xảy ra khi nộp bài. Vui lòng kiểm tra lại kết nối và thử lại.');
      } finally {
        setIsSubmitting(false);
        setIsSubmitModalOpen(false);
      }
    },
    [attempt, assignmentId, navigate, currentStudent.id]
  );

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-3)',
          backgroundColor: 'var(--background)',
        }}
      >
        <Loader2 size={36} className="spin-animation" style={{ color: 'var(--primary)' }} />
        <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)' }}>
          Đang chuẩn bị đề bài thi...
        </h3>
        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
          Hệ thống đang chuẩn bị câu hỏi và thiết lập phiên làm bài bảo mật.
        </p>
      </div>
    );
  }

  if (error || !runnerData || !attempt) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-4)',
          backgroundColor: 'var(--background)',
        }}
      >
        <div
          style={{
            maxWidth: '460px',
            width: '100%',
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border)',
            padding: 'var(--space-6)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-4)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldAlert size={26} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--danger)' }}>
              Không thể vào làm bài
            </h3>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--muted)', lineHeight: 1.5 }}>
              {error || 'Có lỗi xảy ra trong quá trình thiết lập bài làm.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(assignmentId ? `/homework/${assignmentId}` : '/homework')}
            className="ds-btn ds-btn-primary"
            style={{ width: '100%' }}
          >
            Quay lại chi tiết bài tập
          </button>
        </div>
      </div>
    );
  }

  return (
    <ActiveRunnerEngine
      runnerData={runnerData}
      attempt={attempt}
      onBack={() => setShowExitConfirm(true)}
      showExitConfirm={showExitConfirm}
      setShowExitConfirm={setShowExitConfirm}
      isSubmitModalOpen={isSubmitModalOpen}
      setIsSubmitModalOpen={setIsSubmitModalOpen}
      isSubmitting={isSubmitting}
      onSubmitFinal={handleFinalSubmit}
    />
  );
};

interface ActiveRunnerEngineProps {
  runnerData: StudentAssignmentRunnerDTO;
  attempt: StudentAssignmentAttempt;
  onBack: () => void;
  showExitConfirm: boolean;
  setShowExitConfirm: (val: boolean) => void;
  isSubmitModalOpen: boolean;
  setIsSubmitModalOpen: (val: boolean) => void;
  isSubmitting: boolean;
  onSubmitFinal: (answers: Record<string, StudentQuestionAnswer>) => Promise<void>;
}

const ActiveRunnerEngine: React.FC<ActiveRunnerEngineProps> = ({
  runnerData,
  attempt,
  onBack,
  showExitConfirm,
  setShowExitConfirm,
  isSubmitModalOpen,
  setIsSubmitModalOpen,
  isSubmitting,
  onSubmitFinal,
}) => {
  const navigate = useNavigate();

  const runner = useAssignmentRunner({
    runnerData,
    attempt,
    onSubmit: onSubmitFinal,
  });

  const questionIds = React.useMemo(() => {
    return runnerData.questions.map((q) => q.id);
  }, [runnerData.questions]);

  const currentQ = runner.currentQuestion;

  const handleConfirmSubmit = async () => {
    await runner.flushSave();
    await onSubmitFinal(runner.answers);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--background)',
      }}
    >
      {/* 1. DISTRACTION-FREE RUNNER HEADER */}
      <RunnerHeader
        title={runnerData.title}
        classNameText={runnerData.className}
        answeredCount={runner.answeredCount}
        totalQuestions={runner.totalQuestions}
        progressPercent={runner.progressPercent}
        formattedTime={runner.formattedTime}
        isWarning5Min={runner.isWarning5Min}
        isWarning1Min={runner.isWarning1Min}
        isExpired={runner.isExpired}
        autosaveStatus={runner.autosaveStatus}
        lastSavedAt={runner.lastSavedAt}
        onBack={onBack}
        onSubmitClick={() => setIsSubmitModalOpen(true)}
      />

      {/* 2. MAIN RUNNER BODY */}
      <main
        style={{
          flex: 1,
          maxWidth: '1360px',
          margin: '0 auto',
          padding: 'var(--space-6) var(--space-4)',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: 'var(--space-6)',
          alignItems: 'start',
          boxSizing: 'border-box',
        }}
      >
        {/* Left Column: Question Host & Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minWidth: 0 }}>
          {currentQ && (
            <RunnerQuestionHost
              question={currentQ}
              questionIndex={runner.currentIndex}
              totalQuestions={runner.totalQuestions}
              currentAnswer={runner.answers[currentQ.id]}
              isFlagged={runner.flaggedIds.has(currentQ.id)}
              onAnswerChange={(val) => runner.updateAnswer(currentQ.id, val, currentQ.exerciseType)}
              onToggleFlag={() => runner.toggleFlag(currentQ.id)}
              onNext={runner.goToNext}
              onPrev={runner.goToPrev}
              isFirst={runner.currentIndex === 0}
              isLast={runner.currentIndex === runner.totalQuestions - 1}
            />
          )}
        </div>

        {/* Right Column: Question Navigation Palette */}
        <aside style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <RunnerQuestionPalette
            totalQuestions={runner.totalQuestions}
            currentIndex={runner.currentIndex}
            answers={runner.answers}
            flaggedIds={runner.flaggedIds}
            questionIds={questionIds}
            onSelectIndex={runner.jumpToQuestion}
          />
        </aside>
      </main>

      {/* 3. SUBMISSION CONFIRMATION MODAL */}
      <SubmitConfirmModal
        isOpen={isSubmitModalOpen}
        totalQuestions={runner.totalQuestions}
        answeredCount={runner.answeredCount}
        unansweredCount={runner.unansweredCount}
        flaggedCount={runner.flaggedCount}
        remainingTime={runner.formattedTime}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmSubmit}
        onClose={() => setIsSubmitModalOpen(false)}
      />

      {/* 4. EXIT CONFIRMATION MODAL */}
      {showExitConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
          }}
        >
          <div
            style={{
              maxWidth: '440px',
              width: '100%',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border)',
              padding: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertCircle size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)' }}>
                Tạm dừng phiên làm bài?
              </h3>
            </div>

            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--muted)', lineHeight: 1.5 }}>
              Tiến độ câu trả lời đã được tự động lưu. Tuy nhiên, <strong>đồng hồ thời gian làm bài vẫn tiếp tục đếm ngược</strong> và
              không tạm dừng khi bạn thoát ra ngoài.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="ds-btn ds-btn-outline"
                style={{ height: '38px', fontSize: 'var(--text-xs)' }}
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={() => navigate(`/homework/${runnerData.assignmentId}`)}
                className="ds-btn ds-btn-primary"
                style={{ height: '38px', fontSize: 'var(--text-xs)' }}
              >
                Rời khỏi phòng thi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
