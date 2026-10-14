import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { studentHomeworkService } from '../services/student-homework.service';
import { studentAttemptService } from '../services/student-attempt.service';
import { getCurrentStudentIdentity } from '../../auth/services/student-identity.adapter';
import type {
  StudentAssignmentDetailDTO,
  StudentAssignmentAttempt,
} from '../types/student-homework.types';
import { isExerciseTypeSupported } from '../../exercise-engine/utils/exercise-capability';
import { AssignmentRulesSummary } from '../components/detail/AssignmentRulesSummary';
import { AttemptHistoryTable } from '../components/detail/AttemptHistoryTable';

export const StudentHomeworkDetailPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const currentStudent = getCurrentStudentIdentity();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<StudentAssignmentDetailDTO | null>(null);
  const [attempts, setAttempts] = useState<StudentAssignmentAttempt[]>([]);
  const [activeAttempt, setActiveAttempt] = useState<StudentAssignmentAttempt | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const loadDetail = async () => {
    if (!assignmentId) return;

    try {
      setLoading(true);
      setError(null);

      const [detailData, attemptsData, active] = await Promise.all([
        studentHomeworkService.getAssignmentDetail(assignmentId, currentStudent.id),
        studentAttemptService.getAttemptsForStudent(currentStudent.id, assignmentId),
        studentAttemptService.getActiveAttempt(assignmentId, currentStudent.id),
      ]);

      if (!detailData) {
        setError('Không tìm thấy bài tập hoặc bạn chưa được phân bổ vào lớp học này.');
      } else {
        setDetail(detailData);
        setAttempts(attemptsData);
        setActiveAttempt(active || null);
      }
    } catch (err: any) {
      console.error('[StudentHomeworkDetailPage] Error loading detail:', err);
      setError(err?.message || 'Có lỗi xảy ra khi tải thông tin bài tập.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [assignmentId]);

  // Check for unsupported questions
  const unsupportedTypes = React.useMemo(() => {
    if (!detail?.questionTypesOverview) return [];
    return detail.questionTypesOverview
      .filter((q) => !isExerciseTypeSupported(q.type).supported)
      .map((q) => q.type);
  }, [detail]);

  const hasUnsupportedQuestions = unsupportedTypes.length > 0;

  const handleStartOrContinue = async () => {
    if (!assignmentId || !detail || hasUnsupportedQuestions) return;

    // If already active, jump straight to runner
    if (activeAttempt) {
      navigate(`/homework/${assignmentId}/run`);
      return;
    }

    try {
      setIsStarting(true);
      await studentAttemptService.startAttempt(assignmentId, currentStudent.id);
      navigate(`/homework/${assignmentId}/run`);
    } catch (err: any) {
      alert(err?.message || 'Không thể bắt đầu làm bài lúc này.');
      setIsStarting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: 'var(--space-12)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-3)',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          margin: 'var(--space-6) 0',
        }}
      >
        <Loader2 size={28} className="spin-animation" style={{ color: 'var(--primary)' }} />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', fontWeight: 500 }}>
          Đang tải thông tin bài tập...
        </span>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', margin: 'var(--space-6) 0' }}>
        <button
          type="button"
          onClick={() => navigate('/homework')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            width: 'fit-content',
          }}
        >
          <ArrowLeft size={16} />
          Quay lại danh sách bài tập
        </button>

        <div
          style={{
            padding: 'var(--space-8)',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <AlertTriangle size={32} style={{ color: 'var(--danger)' }} />
          <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--danger)' }}>
            Không thể tải bài tập
          </h3>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--muted)', maxWidth: '420px' }}>
            {error || 'Bài tập không tồn tại hoặc bạn không có quyền truy cập lớp học này.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/homework')}
            className="ds-btn ds-btn-primary"
            style={{ marginTop: 'var(--space-2)' }}
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const remainingAttempts = Math.max(0, detail.maxAttempts - detail.attemptsUsed);
  const latestSubmittedAttempt = attempts.find((a) => a.status === 'SUBMITTED' || a.status === 'GRADED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
      {/* Top Breadcrumb */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/homework')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <ArrowLeft size={16} />
          Quay lại danh sách bài tập
        </button>
      </div>

      {/* Hero Detail Card */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
        }}
      >
        {/* Top Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: `${detail.hskLevelColor}18`,
              color: detail.hskLevelColor,
              fontWeight: 700,
              fontSize: '12px',
              border: `1px solid ${detail.hskLevelColor}40`,
            }}
          >
            {detail.hskLevelName}
          </span>

          <span
            style={{
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--neutral-bg)',
              color: 'var(--foreground)',
              fontSize: '12px',
              fontWeight: 600,
              border: '1px solid var(--border)',
            }}
          >
            {detail.className} ({detail.classCode})
          </span>

          {detail.dueDate && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                color: '#d97706',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <Calendar size={13} />
              Hạn nộp: {detail.dueDate}
            </span>
          )}
        </div>

        {/* Title and Description */}
        <div>
          <h1
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 800,
              color: 'var(--foreground)',
              margin: '0 0 var(--space-2) 0',
              lineHeight: 1.25,
            }}
          >
            {detail.title}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-sm)',
              color: 'var(--muted)',
              lineHeight: 1.6,
              maxWidth: '840px',
            }}
          >
            {detail.description || 'Không có mô tả chi tiết cho bài tập này.'}
          </p>
        </div>

        {/* Action Callout Section */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--neutral-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 600 }}>
              TRẠNG THÁI BÀI LÀM
            </span>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--foreground)' }}>
              {activeAttempt
                ? `Đang có bài làm dở (Lần làm thứ ${activeAttempt.attemptNumber})`
                : remainingAttempts > 0
                ? `Bạn còn ${remainingAttempts}/${detail.maxAttempts} lần làm bài`
                : `Bạn đã sử dụng hết ${detail.maxAttempts} lần làm bài`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {activeAttempt ? (
              <button
                type="button"
                onClick={handleStartOrContinue}
                className="ds-btn ds-btn-primary"
                style={{
                  height: '42px',
                  padding: '0 20px',
                  fontWeight: 700,
                  fontSize: 'var(--text-sm)',
                  gap: '8px',
                }}
              >
                <Play size={16} />
                Tiếp tục làm bài
              </button>
            ) : hasUnsupportedQuestions ? (
              <button
                type="button"
                disabled
                className="ds-btn"
                style={{
                  height: '42px',
                  padding: '0 18px',
                  backgroundColor: 'var(--neutral-bg)',
                  color: 'var(--muted)',
                  border: '1px solid var(--border)',
                  cursor: 'not-allowed',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  gap: '8px',
                }}
              >
                <ShieldAlert size={16} />
                Không thể làm trực tuyến
              </button>
            ) : detail.canStartAttempt && remainingAttempts > 0 ? (
              <button
                type="button"
                onClick={handleStartOrContinue}
                disabled={isStarting}
                className="ds-btn ds-btn-primary"
                style={{
                  height: '42px',
                  padding: '0 24px',
                  fontWeight: 700,
                  fontSize: 'var(--text-sm)',
                  gap: '8px',
                }}
              >
                {isStarting ? <Loader2 size={16} className="spin-animation" /> : <Play size={16} />}
                Bắt đầu làm bài
              </button>
            ) : latestSubmittedAttempt ? (
              <button
                type="button"
                onClick={() => navigate(`/homework/${assignmentId}/result/${latestSubmittedAttempt.id}`)}
                className="ds-btn ds-btn-outline"
                style={{
                  height: '42px',
                  padding: '0 18px',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={16} />
                Xem kết quả đã nộp
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="ds-btn"
                style={{
                  height: '42px',
                  padding: '0 18px',
                  backgroundColor: 'var(--neutral-bg)',
                  color: 'var(--muted)',
                  border: '1px solid var(--border)',
                  cursor: 'not-allowed',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                }}
              >
                {detail.reasonIfBlocked || 'Không thể làm bài'}
              </button>
            )}
          </div>
        </div>

        {/* Unsupported Questions Warning Banner */}
        {hasUnsupportedQuestions && (
          <div
            style={{
              padding: 'var(--space-4) var(--space-5)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
            }}
          >
            <ShieldAlert size={20} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ margin: '0 0 2px 0', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--danger)' }}>
                Bài tập chứa dạng câu hỏi chưa hỗ trợ thi trực tuyến
              </h4>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--muted)', lineHeight: 1.5 }}>
                Bài tập này có các câu hỏi thuộc dạng (<strong>{unsupportedTypes.join(', ')}</strong>) hiện chỉ hỗ trợ
                luyện tập tự do hoặc nộp trực tiếp cho giáo viên. Hệ thống tạm khóa chức năng làm bài trực tuyến để đảm
                bảo tính toàn vẹn của kết quả.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Rules and Constraints Summary */}
      <div>
        <h3
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            color: 'var(--foreground)',
            margin: '0 0 var(--space-3) 0',
          }}
        >
          Quy định & Thông số bài tập
        </h3>
        <AssignmentRulesSummary detail={detail} />
      </div>

      {/* Question Types Breakdown */}
      {detail.questionTypesOverview && detail.questionTypesOverview.length > 0 && (
        <div>
          <h3
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 700,
              color: 'var(--foreground)',
              margin: '0 0 var(--space-3) 0',
            }}
          >
            Cấu trúc đề bài ({detail.questionCount} câu hỏi · {detail.totalPoints} điểm)
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 'var(--space-3)',
            }}
          >
            {detail.questionTypesOverview.map((item, idx) => {
              const supported = isExerciseTypeSupported(item.type).supported;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-3) var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Layers size={16} style={{ color: supported ? 'var(--primary)' : 'var(--danger)' }} />
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--foreground)' }}>
                      {item.type}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--foreground)' }}>
                      {item.count} câu
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>
                      {item.points} điểm
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attempt History Section */}
      <div>
        <h3
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            color: 'var(--foreground)',
            margin: '0 0 var(--space-3) 0',
          }}
        >
          Lịch sử các lần làm bài ({attempts.length}/{detail.maxAttempts})
        </h3>
        <AttemptHistoryTable attempts={attempts} assignmentId={detail.assignmentId} />
      </div>
    </div>
  );
};
