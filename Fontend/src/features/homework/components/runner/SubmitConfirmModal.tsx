import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, Bookmark, Send, Loader2, X } from 'lucide-react';

interface SubmitConfirmModalProps {
  isOpen: boolean;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  flaggedCount: number;
  remainingTime: string;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  isOpen,
  totalQuestions,
  answeredCount,
  unansweredCount,
  flaggedCount,
  remainingTime,
  isSubmitting,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const hasUnanswered = unansweredCount > 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
              Xác nhận nộp bài tập
            </h2>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '2px' }}>
              Vui lòng kiểm tra lại tiến độ làm bài của bạn trước khi gửi.
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--muted)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning if unanswered */}
        {hasUnanswered && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-2)',
            }}
          >
            <AlertTriangle size={18} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--foreground)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--danger)' }}>Cảnh báo:</strong> Bạn vẫn còn{' '}
              <strong style={{ color: 'var(--danger)' }}>{unansweredCount} câu hỏi</strong> chưa hoàn thành. Các câu chưa trả lời sẽ không nhận được điểm.
            </div>
          </div>
        )}

        {/* Summary Breakdown Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--space-3)',
            backgroundColor: 'var(--background)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} style={{ color: '#059669' }} />
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Đã trả lời</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--foreground)' }}>
                {answeredCount}/{totalQuestions} câu
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} style={{ color: hasUnanswered ? 'var(--danger)' : 'var(--muted)' }} />
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Chưa trả lời</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: hasUnanswered ? 'var(--danger)' : 'var(--foreground)' }}>
                {unansweredCount} câu
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bookmark size={16} style={{ color: '#d97706' }} />
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Đã gắn cờ</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--foreground)' }}>
                {flaggedCount} câu
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} style={{ color: 'var(--primary)' }} />
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Thời gian còn</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--foreground)' }}>
                {remainingTime}
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.5 }}>
          Sau khi nộp bài, bạn sẽ không thể chỉnh sửa đáp án cho lần làm này. Bài làm sẽ được gửi đến giảng viên để chấm điểm.
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: '4px' }}>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'transparent',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            Tiếp tục làm bài
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(67, 56, 202, 0.25)',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Đang nộp bài...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Xác nhận nộp</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
