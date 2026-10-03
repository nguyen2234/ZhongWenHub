import React from 'react';
import { CheckCircle2, XCircle, Lightbulb, Sparkles } from 'lucide-react';
import type { AIExplanationContext } from '../types';

interface AnswerFeedbackProps {
  isCorrect: boolean;
  explanation: string;
  userAnswerText?: string;
  correctAnswerText?: string;
  grammarPoint?: string;
  xpEarned?: number;
  aiContext?: AIExplanationContext;
  onAskAI?: (context: AIExplanationContext) => void;
}

export const AnswerFeedback: React.FC<AnswerFeedbackProps> = ({
  isCorrect,
  explanation,
  userAnswerText,
  correctAnswerText,
  grammarPoint,
  xpEarned = 2,
  aiContext,
  onAskAI,
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
        gap: 'var(--space-2-5)',
        marginTop: 'var(--space-4)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {/* Header status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {isCorrect ? (
            <CheckCircle2 size={22} style={{ color: 'var(--success)', flexShrink: 0 }} />
          ) : (
            <XCircle size={22} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          )}
          <span
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 700,
              color: isCorrect ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {isCorrect ? 'Chính xác!' : 'Chưa chính xác'}
          </span>
        </div>

        {isCorrect && (
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              color: 'var(--primary)',
              backgroundColor: 'var(--primary-light)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            +{xpEarned} XP
          </span>
        )}
      </div>

      {/* Answer comparison for incorrect */}
      {!isCorrect && correctAnswerText && (
        <div
          style={{
            fontSize: 'var(--text-xs)',
            backgroundColor: 'var(--surface)',
            padding: 'var(--space-2-5) var(--space-3)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--danger-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div>
            <span style={{ color: 'var(--muted)' }}>Đáp án đúng: </span>
            <strong style={{ color: 'var(--success)', fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-sm)' }}>
              {correctAnswerText}
            </strong>
          </div>
          {userAnswerText && (
            <div>
              <span style={{ color: 'var(--muted)' }}>Bạn đã chọn: </span>
              <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>
                {userAnswerText}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Grammar point badge if available */}
      {grammarPoint && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--primary)',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            Điểm ngữ pháp: {grammarPoint}
          </span>
        </div>
      )}

      {/* Explanation text */}
      {explanation && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-2)',
            fontSize: 'var(--text-xs)',
            color: 'var(--foreground)',
            lineHeight: 1.5,
          }}
        >
          <Lightbulb
            size={15}
            style={{ color: isCorrect ? 'var(--success)' : 'var(--danger)', marginTop: '2px', flexShrink: 0 }}
          />
          <span>{explanation}</span>
        </div>
      )}

      {/* AI Tutor Entry Point (Only for incorrect or exploration) */}
      {!isCorrect && aiContext && (
        <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-start' }}>
          <button
            type="button"
            onClick={() => onAskAI?.(aiContext)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--primary)',
              color: 'var(--primary)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            title="Nhận giải thích sâu từ trợ lý AI về lỗi này"
          >
            <Sparkles size={13} style={{ color: 'var(--primary)' }} />
            <span>✨ Hỏi AI tại sao?</span>
          </button>
        </div>
      )}
    </div>
  );
};
