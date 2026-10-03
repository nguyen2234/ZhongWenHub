import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import type { AITutorMessage } from '../types';
import { AIBlockRenderer } from './blocks/AIBlockRenderer';

interface AITutorMessageItemProps {
  message: AITutorMessage;
  onActionClick?: (action: string) => void;
}

export const AITutorMessageItem: React.FC<AITutorMessageItemProps> = ({
  message,
  onActionClick,
}) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          margin: 'var(--space-2) 0',
        }}
      >
        <div
          style={{
            maxWidth: '85%',
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            padding: '10px 14px',
            borderRadius: '16px 16px 4px 16px',
            fontSize: 'var(--text-xs)',
            lineHeight: 1.5,
            fontWeight: 500,
            wordBreak: 'break-word',
            boxShadow: '0 2px 8px rgba(67, 56, 202, 0.25)',
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant Response with Structured Blocks
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2-5)',
        margin: 'var(--space-3) 0',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {/* If structured blocks are present */}
      {message.structuredResponse?.blocks && message.structuredResponse.blocks.length > 0 ? (
        message.structuredResponse.blocks.map((block, idx) => (
          <AIBlockRenderer key={idx} block={block} />
        ))
      ) : (
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: '16px 16px 16px 4px',
            fontSize: 'var(--text-xs)',
            color: 'var(--foreground)',
            lineHeight: 1.6,
          }}
        >
          {message.content || 'Tôi có thể hỗ trợ gì cho bạn trong bài học này?'}
        </div>
      )}

      {/* Suggested Next Action Chips */}
      {message.structuredResponse?.suggestedActions &&
        message.structuredResponse.suggestedActions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
            {message.structuredResponse.suggestedActions.map((act, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onActionClick?.(act)}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                ✨ {act}
              </button>
            ))}
          </div>
        )}

      {/* Subtle Feedback & Safety indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: 'var(--muted)',
          padding: '0 4px',
        }}
      >
        <span>Nội dung do trợ giảng AI tổng hợp</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted)', padding: '2px' }}
            title="Câu trả lời hữu ích"
          >
            <ThumbsUp size={12} />
          </button>
          <button
            type="button"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted)', padding: '2px' }}
            title="Chưa đúng hoặc chưa rõ"
          >
            <ThumbsDown size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
