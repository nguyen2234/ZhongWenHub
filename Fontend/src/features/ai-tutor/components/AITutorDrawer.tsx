import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import type { AITutorContext, AITutorMessage } from '../types';
import { ContextBuilder } from '../services/ContextBuilder';
import { AITutorService } from '../services/AITutorService';
import { AITutorHeader } from './AITutorHeader';
import { AITutorMessageItem } from './AITutorMessageItem';
import { AITutorInput } from './AITutorInput';

export const AI_TUTOR_WELCOME_MESSAGE =
  'Chào bạn! Mình là Trợ giảng AI ZhongWen.\n\nBạn có thể hỏi mình về từ vựng, ngữ pháp, bài tập hoặc luyện hội thoại tiếng Trung.\n\nMình luôn sẵn sàng hỗ trợ bạn! 😊';

interface AITutorDrawerProps {
  isOpen: boolean;
  context: AITutorContext | null;
  onClose: () => void;
  onClearContext: () => void;
  initialQuestion?: string;
  onConsumeInitialQuestion?: () => void;
}

function buildContextualSuggestions(context: AITutorContext | null): string[] {
  if (context?.source === 'vocabulary' && context.vocabularyWord) {
    const { hanzi, pinyin } = context.vocabularyWord;
    return [
      `Giải thích từ "${hanzi}" (${pinyin})`,
      `Cho ví dụ đặt câu với "${hanzi}"`,
      `Phân biệt cách dùng "${hanzi}"`,
    ];
  }

  if (context?.source === 'practice' || context?.source === 'mistake') {
    return ContextBuilder.getQuickActions(context).slice(0, 3);
  }

  return [
    'Giải thích từ vựng & ngữ pháp',
    'Sửa giúp mình 1 câu tiếng Trung',
    'Luyện hội thoại tiếng Trung ngắn',
  ];
}

export const AITutorDrawer: React.FC<AITutorDrawerProps> = ({
  isOpen,
  context,
  onClose,
  onClearContext,
  initialQuestion,
  onConsumeInitialQuestion,
}) => {
  const [messages, setMessages] = useState<AITutorMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const hasInitializedWelcomeRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const forceScrollRef = useRef(false);
  const isSendingRef = useRef(false);

  const handleChatScroll = () => {
    const el = chatScrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 80;
  };

  // Smart auto-scroll: only scroll when near bottom or user just submitted a message
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    if (forceScrollRef.current || isNearBottomRef.current) {
      el.scrollTop = el.scrollHeight;
      forceScrollRef.current = false;
    }
  }, [messages, isLoading, isOpen]);

  // Close drawer cleanly on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSendMessage = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed || isSendingRef.current) return false;

      isSendingRef.current = true;
      forceScrollRef.current = true;
      setSendError(null);
      setLastFailedPrompt(null);

      const userMsgId = `msg-u-${Date.now()}`;
      const userMsg: AITutorMessage = {
        id: userMsgId,
        conversationId: 'conv-main',
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const safeContext = context || ContextBuilder.build('general');
        const response = await AITutorService.sendChatMessage({
          conversationId: 'conv-main',
          message: trimmed,
          mode: 'ASK',
          context: safeContext,
        });

        const aiMsg: AITutorMessage = {
          id: `msg-ai-${Date.now()}`,
          conversationId: 'conv-main',
          role: 'assistant',
          structuredResponse: response,
          contextSnapshot: safeContext,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMsg]);
        return true;
      } catch (err) {
        // Roll back pending user bubble so draft stays in input ready for retry without duplication
        setMessages((prev) => prev.filter((m) => m.id !== userMsgId));
        setLastFailedPrompt(trimmed);
        setSendError(AITutorService.getErrorMessage(err));
        return false;
      } finally {
        isSendingRef.current = false;
        setIsLoading(false);
      }
    },
    [context]
  );

  // Initialize welcome message ONCE per conversation & handle contextual initialQuestion
  useEffect(() => {
    if (!isOpen) return;

    if (!hasInitializedWelcomeRef.current) {
      hasInitializedWelcomeRef.current = true;
      const welcomeMsg: AITutorMessage = {
        id: `welcome-${Date.now()}`,
        conversationId: 'conv-main',
        role: 'assistant',
        content: AI_TUTOR_WELCOME_MESSAGE,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => (prev.length === 0 ? [welcomeMsg] : prev));
    }

    if (initialQuestion) {
      const promptToSend = initialQuestion;
      onConsumeInitialQuestion?.();
      void handleSendMessage(promptToSend);
    }
  }, [isOpen, initialQuestion, onConsumeInitialQuestion, handleSendMessage]);

  if (!isOpen) return null;

  const hasUserStartedChat = messages.some((m) => m.role === 'user');
  const contextualSuggestions = buildContextualSuggestions(context).slice(0, 3);
  const vocabContext = context?.source === 'vocabulary' ? context.vocabularyWord : undefined;

  return (
    <>
      {/* Backdrop for click-away */}
      <div
        className="ai-tutor-drawer-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.32)',
          zIndex: 1090,
          overscrollBehavior: 'contain',
          transition: 'opacity 0.2s ease',
        }}
        onClick={onClose}
      />

      {/* Unified Fixed Chat Drawer: 420px on desktop, full screen on mobile */}
      <aside
        className="ai-tutor-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Trợ giảng AI ZhongWen"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '420px',
          height: '100dvh',
          maxHeight: '100dvh',
          backgroundColor: '#ffffff',
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '-8px 0 32px rgba(15, 23, 42, 0.14)',
          animation: 'slideInRight 0.2s ease',
        }}
      >
        {/* Minimalist Fixed Header */}
        <AITutorHeader
          context={context}
          onClose={onClose}
          onClearContext={onClearContext}
        />

        {/* Independent Scrollable Chat Thread */}
        <div
          ref={chatScrollRef}
          onScroll={handleChatScroll}
          className="ai-tutor-messages-scroll"
          style={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Compact inline vocabulary context indicator (outside header, no HSK label) */}
          {vocabContext && (
            <div
              className="ai-tutor-vocab-context-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                color: '#334155',
              }}
            >
              <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ color: '#64748b' }}>Đang hỏi từ: </span>
                <strong style={{ color: '#0f172a' }}>
                  {vocabContext.hanzi} ({vocabContext.pinyin})
                </strong>
                {vocabContext.meaning ? (
                  <span style={{ color: '#64748b' }}> — {vocabContext.meaning}</span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClearContext}
                aria-label="Xóa ngữ cảnh từ vựng"
                title="Xóa ngữ cảnh từ vựng"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Message List */}
          {messages.map((msg) => (
            <AITutorMessageItem
              key={msg.id}
              message={msg}
              onActionClick={(act) => void handleSendMessage(act)}
            />
          ))}

          {/* Max 3 contextual suggestion pills shown ONLY before first user message */}
          {!hasUserStartedChat && !isLoading && (
            <div
              className="ai-tutor-initial-suggestions"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                paddingLeft: '40px',
              }}
            >
              {contextualSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void handleSendMessage(suggestion)}
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#334155',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.15s ease, background-color 0.15s ease',
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Typing / Processing Indicator */}
          {isLoading && (
            <div
              role="status"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '18px 18px 18px 4px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                width: 'fit-content',
                marginLeft: '40px',
                fontSize: '12px',
                color: '#64748b',
              }}
            >
              <span>Trợ giảng đang phản hồi...</span>
            </div>
          )}

          {/* Non-blocking Send Error Notice (preserves user draft in input + retry) */}
          {sendError && (
            <div
              role="alert"
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <span style={{ lineHeight: 1.4 }}>{sendError}</span>
              {lastFailedPrompt && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void handleSendMessage(lastFailedPrompt)}
                  style={{
                    flexShrink: 0,
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    border: '1px solid #fca5a5',
                    backgroundColor: '#ffffff',
                    color: '#b91c1c',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Thử lại
                </button>
              )}
            </div>
          )}
        </div>

        {/* Fixed Bottom Composer */}
        <AITutorInput
          onSend={handleSendMessage}
          isLoading={isLoading}
        />

        <style>{`
          @media (max-width: 639px) {
            .ai-tutor-drawer {
              max-width: 100vw !important;
            }
          }
        `}</style>
      </aside>
    </>
  );
};
