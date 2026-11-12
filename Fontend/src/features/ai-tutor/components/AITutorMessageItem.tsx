import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react';
import type { AITutorMessage } from '../types';
import { AIBlockRenderer } from './blocks/AIBlockRenderer';
import { StickerIllustration } from '../../../design-system';

interface AITutorMessageItemProps {
  message: AITutorMessage;
  onActionClick?: (action: string) => void;
}

/**
 * Render inline **bold** segments safely without dangerouslySetInnerHTML.
 */
function renderInlineSegments(line: string): React.ReactNode[] {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} style={{ fontWeight: 700, color: '#0f172a' }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function renderFormattedContent(content: string): React.ReactNode {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (keyPrefix: string) => {
    if (listItems.length === 0) return;
    elements.push(
      <ul
        key={`list-${keyPrefix}`}
        style={{
          margin: '4px 0',
          paddingLeft: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {listItems.map((item, i) => (
          <li key={i}>{renderInlineSegments(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((rawLine, index) => {
    const trimmed = rawLine.trim();
    const bulletMatch = trimmed.match(/^(?:[-•*]|\d+\.)\s+(.+)$/);

    if (bulletMatch) {
      listItems.push(bulletMatch[1]);
      return;
    }

    flushList(String(index));

    if (!trimmed) {
      elements.push(<div key={`gap-${index}`} style={{ height: '6px' }} />);
    } else {
      elements.push(
        <p key={`p-${index}`} style={{ margin: 0 }}>
          {renderInlineSegments(rawLine)}
        </p>
      );
    }
  });

  flushList('end');
  return elements;
}

function getCopyableMessageText(message: AITutorMessage): string {
  if (message.content) return message.content;
  const blocks = message.structuredResponse?.blocks ?? [];
  const parts = blocks
    .map((block) => {
      if (block.type === 'explanation') return `${block.title ? `${block.title}\n` : ''}${block.content}`;
      if (block.type === 'chinese_example') return `${block.hanzi}\n${block.pinyin}\n${block.vietnamese}`;
      if (block.type === 'correction') return `${block.correctedSentence}\n${block.pinyin}\n${block.explanation}`;
      if (block.type === 'practice') return `${block.instruction}\n${block.exercise.promptHanzi ?? ''}`;
      return '';
    })
    .filter(Boolean);
  return (
    parts.join('\n\n') ||
    message.structuredResponse?.markdownFallback ||
    message.structuredResponse?.summary ||
    ''
  );
}

export const AITutorMessageItem: React.FC<AITutorMessageItemProps> = ({
  message,
  onActionClick,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleCopy = async () => {
    const textToCopy = getCopyableMessageText(message);
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be unavailable in restricted contexts
    }
  };

  if (isUser) {
    return (
      <div
        className="ai-tutor-message-user"
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          width: '100%',
        }}
      >
        <div
          style={{
            maxWidth: '82%',
            backgroundColor: '#e0ecff',
            color: '#0f172a',
            border: '1px solid #c7dafa',
            padding: '10px 14px',
            borderRadius: '18px 18px 4px 18px',
            fontSize: 'var(--text-xs)',
            lineHeight: 1.55,
            fontWeight: 500,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  const isWelcomeMessage = message.id.startsWith('welcome-');
  const hasStructuredBlocks = Boolean(
    message.structuredResponse?.blocks && message.structuredResponse.blocks.length > 0
  );

  // Assistant Message (Left-aligned with preserved AI character icon)
  return (
    <div
      className="ai-tutor-message-assistant"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        width: '100%',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '10px',
          backgroundColor: '#f1f5f9',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '2px',
          overflow: 'hidden',
        }}
      >
        <StickerIllustration name="aiTutor" size="xs" decorative />
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {hasStructuredBlocks ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {message.structuredResponse!.blocks.map((block, idx) => (
              <AIBlockRenderer key={idx} block={block} />
            ))}
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              padding: '12px 14px',
              borderRadius: '18px 18px 18px 4px',
              fontSize: 'var(--text-xs)',
              color: '#0f172a',
              lineHeight: 1.6,
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {renderFormattedContent(
              message.content ||
                message.structuredResponse?.markdownFallback ||
                'Mình có thể hỗ trợ gì cho bạn hôm nay?'
            )}
          </div>
        )}

        {/* Follow-up suggestions (compact, max 3) */}
        {message.structuredResponse?.suggestedActions &&
          message.structuredResponse.suggestedActions.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {message.structuredResponse.suggestedActions.slice(0, 3).map((act, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onActionClick?.(act)}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '5px 10px',
                    borderRadius: '9999px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    color: '#334155',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease, color 0.15s ease',
                    textAlign: 'left',
                  }}
                >
                  {act}
                </button>
              ))}
            </div>
          )}

        {/* Copy & Feedback actions */}
        {!isWelcomeMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              color: '#64748b',
              padding: '0 2px',
            }}
          >
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Sao chép phản hồi"
              title="Sao chép"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: copied ? '#16a34a' : '#64748b',
                padding: '2px 4px',
                fontSize: '11px',
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>

            <button
              type="button"
              onClick={() => setFeedback((prev) => (prev === 'up' ? null : 'up'))}
              aria-label="Phản hồi hữu ích"
              aria-pressed={feedback === 'up'}
              title="Hữu ích"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: feedback === 'up' ? '#2563eb' : '#64748b',
                padding: '2px',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <ThumbsUp size={12} />
            </button>

            <button
              type="button"
              onClick={() => setFeedback((prev) => (prev === 'down' ? null : 'down'))}
              aria-label="Phản hồi chưa rõ"
              aria-pressed={feedback === 'down'}
              title="Chưa đúng hoặc chưa rõ"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: feedback === 'down' ? '#dc2626' : '#64748b',
                padding: '2px',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <ThumbsDown size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
