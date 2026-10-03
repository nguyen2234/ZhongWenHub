import React from 'react';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';

interface AnswerFeedbackProps {
  isCorrect: boolean;
  explanation: string;
  userAnswerText?: string;
  correctAnswerText?: string;
}

export const AnswerFeedback: React.FC<AnswerFeedbackProps> = ({
  isCorrect,
  explanation,
  userAnswerText,
  correctAnswerText,
}) => {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: isCorrect ? 'var(--success-bg)' : 'var(--danger-bg)',
        border: `1.5px solid ${isCorrect ? 'var(--success-border)' : 'var(--danger-border)'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        marginTop: 'var(--space-4)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {isCorrect ? (
          <CheckCircle2 size={20} style={{ color: 'var(--success)', flexShrink: 0 }} />
        ) : (
          <XCircle size={20} style={{ color: 'var(--danger)', flexShrink: 0 }} />
        )}
        <span
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            color: isCorrect ? 'var(--success)' : 'var(--danger)',
          }}
        >
          {isCorrect ? 'Chính xác! Làm rất tốt 🎉' : 'Chưa chính xác'}
        </span>
      </div>

      {!isCorrect && correctAnswerText && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--foreground)', marginTop: '2px' }}>
          <span>Đáp án đúng: </span>
          <strong style={{ color: 'var(--primary)' }}>{correctAnswerText}</strong>
          {userAnswerText && (
            <span style={{ color: 'var(--muted)', marginLeft: '8px' }}>
              (Bạn chọn: {userAnswerText})
            </span>
          )}
        </div>
      )}

      {explanation && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-1-5)',
            fontSize: 'var(--text-xs)',
            color: 'var(--foreground)',
            lineHeight: 1.5,
            marginTop: '2px',
          }}
        >
          <Lightbulb
            size={14}
            style={{ color: isCorrect ? 'var(--success)' : 'var(--danger)', marginTop: '2px', flexShrink: 0 }}
          />
          <span>{explanation}</span>
        </div>
      )}
    </div>
  );
};
