import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Award, HelpCircle, ArrowRight, Play, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { StudentHomeworkSummaryDTO } from '../../types/student-homework.types';

interface HomeworkCardProps {
  homework: StudentHomeworkSummaryDTO;
  activeAttemptId?: string;
  isSubmitted?: boolean;
}

export const HomeworkCard: React.FC<HomeworkCardProps> = ({
  homework,
  activeAttemptId,
  isSubmitted,
}) => {
  const navigate = useNavigate();

  const isOverdue = homework.isOverdue;
  const isClosed = homework.isClosed;
  const hasActiveAttempt = Boolean(activeAttemptId);

  // Status badge styling
  let statusBadge = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        color: '#2563eb',
        fontSize: '11px',
        fontWeight: 600,
      }}
    >
      <Clock size={12} />
      <span>Cần làm</span>
    </span>
  );

  if (isSubmitted) {
    statusBadge = (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: '#059669',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        <CheckCircle2 size={12} />
        <span>Đã nộp</span>
      </span>
    );
  } else if (hasActiveAttempt) {
    statusBadge = (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          color: '#d97706',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        <Play size={12} />
        <span>Đang làm dở</span>
      </span>
    );
  } else if (isOverdue) {
    statusBadge = (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--danger)',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        <AlertTriangle size={12} />
        <span>Quá hạn</span>
      </span>
    );
  }

  const handleAction = () => {
    navigate(`/homework/${homework.assignmentId}`);
  };

  const handleStartRun = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/homework/${homework.assignmentId}/run`);
  };

  return (
    <div
      onClick={handleAction}
      style={{
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--primary)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
      }}
    >
      <div>
        {/* Top badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: `${homework.hskLevelColor}1A`,
                color: homework.hskLevelColor,
              }}
            >
              {homework.hskLevelName}
            </span>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--muted)',
                fontWeight: 600,
                backgroundColor: 'var(--neutral-bg)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {homework.className}
            </span>
          </div>

          {statusBadge}
        </div>

        {/* Title & Description */}
        <h3
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            color: 'var(--foreground)',
            margin: '0 0 6px 0',
            lineHeight: 1.3,
          }}
        >
          {homework.title}
        </h3>
        {homework.description && (
          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--muted)',
              margin: '0 0 12px 0',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {homework.description}
          </p>
        )}

        {/* Key Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            backgroundColor: 'var(--background)',
            borderRadius: 'var(--radius-lg)',
            padding: '8px 12px',
            fontSize: 'var(--text-xs)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)' }}>
            <HelpCircle size={14} style={{ color: 'var(--primary)' }} />
            <span>{homework.questionCount} câu hỏi</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)' }}>
            <Award size={14} style={{ color: '#d97706' }} />
            <span>{homework.totalPoints} điểm (đạt: {homework.passingPoints})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)' }}>
            <Clock size={14} style={{ color: '#2563eb' }} />
            <span>{homework.timeLimitMinutes ? `${homework.timeLimitMinutes} phút` : 'Không giới hạn'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)' }}>
            <Calendar size={14} style={{ color: isOverdue ? 'var(--danger)' : '#059669' }} />
            <span style={{ color: isOverdue ? 'var(--danger)' : 'inherit', fontWeight: isOverdue ? 600 : 'normal' }}>
              {homework.dueDate ? `Hạn: ${homework.dueDate}` : 'Không có hạn'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer & Action Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 'var(--space-2)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
          Số lần làm: {homework.maxAttempts} lần
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hasActiveAttempt ? (
            <button
              type="button"
              onClick={handleStartRun}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Tiếp tục làm</span>
              <Play size={13} fill="#ffffff" />
            </button>
          ) : homework.canStartAttempt && !isClosed ? (
            <button
              type="button"
              onClick={handleStartRun}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Làm bài</span>
              <ArrowRight size={13} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAction}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'transparent',
                color: 'var(--primary)',
                border: '1px solid var(--border)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>Xem chi tiết</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
