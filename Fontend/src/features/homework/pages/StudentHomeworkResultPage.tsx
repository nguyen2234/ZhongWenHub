import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { studentAttemptService } from '../services/student-attempt.service';
import { getCurrentStudentIdentity } from '../../auth/services/student-identity.adapter';
import type { StudentAssignmentAttempt } from '../types/student-homework.types';

export const StudentHomeworkResultPage: React.FC = () => {
  const { assignmentId, attemptId } = useParams<{ assignmentId: string; attemptId: string }>();
  const navigate = useNavigate();
  const currentStudent = getCurrentStudentIdentity();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<{
    attempt: StudentAssignmentAttempt;
    assignmentTitle: string;
    className: string;
    totalQuestions: number;
    answeredCount: number;
  } | null>(null);

  useEffect(() => {
    async function loadSummary() {
      if (!attemptId) return;

      try {
        setLoading(true);
        setError(null);
        const data = await studentAttemptService.getAttemptSummary(attemptId, currentStudent.id);
        if (!data) {
          setError('Không tìm thấy thông tin lượt nộp bài này.');
        } else {
          setSummaryData(data);
        }
      } catch (err: any) {
        console.error('[StudentHomeworkResultPage] Error loading summary:', err);
        setError(err?.message || 'Có lỗi xảy ra khi tải thông tin kết quả.');
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [attemptId, currentStudent.id]);

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
          Đang xác nhận biên nhận nộp bài...
        </span>
      </div>
    );
  }

  if (error || !summaryData) {
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
          <AlertCircle size={32} style={{ color: 'var(--danger)' }} />
          <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--danger)' }}>
            Không tìm thấy lượt làm bài
          </h3>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
            {error || 'Lượt nộp bài này không tồn tại hoặc bạn không có quyền xem.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/homework')}
            className="ds-btn ds-btn-primary"
            style={{ marginTop: 'var(--space-2)' }}
          >
            Về danh sách bài tập
          </button>
        </div>
      </div>
    );
  }

  const { attempt, assignmentTitle, className, totalQuestions, answeredCount } = summaryData;

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatTimeSpent = (secs: number) => {
    if (!secs || secs < 60) return `${secs || 0} giây`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m} phút ${s > 0 ? `${s}s` : ''}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        maxWidth: '800px',
        margin: '0 auto',
        paddingBottom: 'var(--space-10)',
      }}
    >
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

      {/* Main Submission Receipt Card */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Success Banner Header */}
        <div
          style={{
            backgroundColor: 'var(--primary)',
            padding: 'var(--space-6)',
            color: '#ffffff',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-1)',
            }}
          >
            <CheckCircle2 size={32} color="#ffffff" />
          </div>
          <h2 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 800 }}>
            {attempt.status === 'EXPIRED' ? 'Đã thu bài thi (Hết giờ)' : 'Nộp bài tập thành công!'}
          </h2>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', opacity: 0.9 }}>
            Biên nhận điện tử cho lượt nộp bài của bạn đã được ghi nhận vào hệ thống
          </p>
        </div>

        {/* Details Content */}
        <div
          style={{
            padding: 'var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-5)',
          }}
        >
          {/* Assignment Title & Class Info */}
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-4)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 600 }}>BÀI TẬP</span>
            <h3 style={{ margin: '4px 0 2px 0', fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--foreground)' }}>
              {assignmentTitle}
            </h3>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Lớp: <strong>{className}</strong> · Học viên: <strong>{currentStudent.fullName}</strong>
            </span>
          </div>

          {/* Submission Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--neutral-bg)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-3) var(--space-4)',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>LẦN LÀM BÀI</div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--foreground)', marginTop: '2px' }}>
                Lần làm #{attempt.attemptNumber}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--neutral-bg)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-3) var(--space-4)',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>SỐ CÂU ĐÃ TRẢ LỜI</div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                {answeredCount} / {totalQuestions} câu
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--neutral-bg)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-3) var(--space-4)',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>THỜI GIAN LÀM BÀI</div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--foreground)', marginTop: '2px' }}>
                {formatTimeSpent(attempt.timeSpentSeconds)}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--neutral-bg)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-3) var(--space-4)',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>THỜI ĐIỂM NỘP BÀI</div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--foreground)', marginTop: '4px' }}>
                {formatDateTime(attempt.submittedAt)}
              </div>
            </div>
          </div>

          {/* Official Grading Status Notice (Phase 2B.2 Strict Scope) */}
          <div
            style={{
              padding: 'var(--space-4) var(--space-5)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
            }}
          >
            <ShieldCheck size={22} style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ margin: '0 0 2px 0', fontSize: 'var(--text-sm)', fontWeight: 800, color: '#1d4ed8' }}>
                Đã nộp bài. Đang chờ chấm điểm.
              </h4>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--muted)', lineHeight: 1.5 }}>
                Hệ thống và giáo viên bộ môn sẽ tiến hành đánh giá bài làm. Điểm số chính thức và nhận xét chi tiết sẽ
                được công bố sau khi kết thúc đợt nộp bài. Đáp án và giải thích câu hỏi không hiển thị trước thời điểm
                công bố kết quả.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              marginTop: 'var(--space-2)',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/homework')}
              className="ds-btn ds-btn-primary"
              style={{ height: '42px', padding: '0 20px', fontWeight: 700, fontSize: 'var(--text-sm)' }}
            >
              Về danh sách bài tập
            </button>

            {assignmentId && (
              <button
                type="button"
                onClick={() => navigate(`/homework/${assignmentId}`)}
                className="ds-btn ds-btn-outline"
                style={{ height: '42px', padding: '0 20px', fontWeight: 600, fontSize: 'var(--text-sm)' }}
              >
                Xem chi tiết bài tập
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
