import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, AlertTriangle, ArrowRight, Play } from 'lucide-react';
import type { StudentAssignmentAttempt } from '../../types/student-homework.types';

interface AttemptHistoryTableProps {
  attempts: StudentAssignmentAttempt[];
  assignmentId: string;
}

export const AttemptHistoryTable: React.FC<AttemptHistoryTableProps> = ({ attempts, assignmentId }) => {
  const navigate = useNavigate();

  if (attempts.length === 0) {
    return (
      <div
        style={{
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--background)',
          border: '1px dashed var(--border)',
          textAlign: 'center',
          color: 'var(--muted)',
          fontSize: 'var(--text-sm)',
        }}
      >
        Bạn chưa làm bài tập này lần nào. Hãy nhấn nút &quot;Bắt đầu làm bài&quot; phía trên.
      </div>
    );
  }

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeSpent = (secs?: number) => {
    if (!secs) return '< 1 phút';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s} giây`;
    return `${m} phút ${s > 0 ? `${s}s` : ''}`;
  };

  return (
    <div
      style={{
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        backgroundColor: 'var(--surface)',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--muted)' }}>Lần làm</th>
            <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--muted)' }}>Trạng thái</th>
            <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--muted)' }}>Bắt đầu</th>
            <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--muted)' }}>Nộp lúc</th>
            <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--muted)' }}>Số câu đã làm</th>
            <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--muted)', textAlign: 'right' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((attempt) => {
            const answeredCount = Object.keys(attempt.answers).length;

            let statusBadge = (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: '#2563eb',
                  fontWeight: 600,
                }}
              >
                <Clock size={11} />
                <span>Đang làm dở</span>
              </span>
            );

            if (attempt.status === 'SUBMITTED') {
              statusBadge = (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#059669',
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={11} />
                  <span>Đã nộp{attempt.isLate ? ' (muộn)' : ''}</span>
                </span>
              );
            } else if (attempt.status === 'EXPIRED') {
              statusBadge = (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--danger)',
                    fontWeight: 600,
                  }}
                >
                  <AlertTriangle size={11} />
                  <span>Hết giờ</span>
                </span>
              );
            }

            return (
              <tr
                key={attempt.id}
                style={{
                  borderBottom: '1px solid var(--border)',
                  transition: 'background-color 0.1s ease',
                }}
              >
                <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--foreground)' }}>
                  Lần {attempt.attemptNumber}
                </td>
                <td style={{ padding: '12px 14px' }}>{statusBadge}</td>
                <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>{formatDateTime(attempt.startedAt)}</td>
                <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>{formatDateTime(attempt.submittedAt)}</td>
                <td style={{ padding: '12px 14px', color: 'var(--foreground)', fontWeight: 600 }}>
                  {answeredCount} câu · <span style={{ color: 'var(--muted)', fontWeight: 500 }}>{formatTimeSpent(attempt.timeSpentSeconds)}</span>
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                  {attempt.status === 'IN_PROGRESS' ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/homework/${assignmentId}/run`)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--primary)',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <span>Tiếp tục</span>
                      <Play size={11} fill="#ffffff" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(`/homework/${assignmentId}/result/${attempt.id}`)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'transparent',
                        color: 'var(--primary)',
                        border: '1px solid var(--border)',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <span>Xem nộp</span>
                      <ArrowRight size={11} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
