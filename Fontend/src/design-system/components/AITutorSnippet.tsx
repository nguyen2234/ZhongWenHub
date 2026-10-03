import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

export interface AITutorSnippetProps {
  tutorName?: string;
  message: string;
  suggestedQuestions?: string[];
  onQuestionClick?: (q: string) => void;
}

export const AITutorSnippet: React.FC<AITutorSnippetProps> = ({
  tutorName = 'Trợ giảng AI',
  message,
  suggestedQuestions = ['Giải thích từ này giúp em', 'Cho em thêm 2 ví dụ', 'Luyện tập phát âm'],
  onQuestionClick,
}) => {
  return (
    <div className="ds-ai-card">
      <div className="ds-ai-avatar">
        <Bot size={20} />
      </div>

      <div className="ds-ai-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)' }}>
          <span className="ds-ai-author">{tutorName}</span>
          <Sparkles size={14} style={{ color: 'var(--ai)' }} />
        </div>

        <p className="ds-ai-message">{message}</p>

        {suggestedQuestions && suggestedQuestions.length > 0 && (
          <div className="ds-ai-chips">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                className="ds-ai-chip"
                onClick={() => onQuestionClick && onQuestionClick(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
