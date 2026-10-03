import React, { useState, useEffect, useRef } from 'react';
import type { AITutorContext, AITutorMessage, AITutorMode } from '../types';
import { ContextBuilder } from '../services/ContextBuilder';
import { AITutorService } from '../services/AITutorService';
import { AITutorHeader } from './AITutorHeader';
import { AITutorMessageItem } from './AITutorMessageItem';
import { AITutorInput } from './AITutorInput';
import { ConversationScenario } from './ConversationScenario';

interface AITutorDrawerProps {
  isOpen: boolean;
  context: AITutorContext | null;
  onClose: () => void;
  onClearContext: () => void;
  initialQuestion?: string;
}

export const AITutorDrawer: React.FC<AITutorDrawerProps> = ({
  isOpen,
  context,
  onClose,
  onClearContext,
  initialQuestion,
}) => {
  const [messages, setMessages] = useState<AITutorMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AITutorMode>('ASK');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const initialTriggered = useRef(false);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load greeting or initial trigger when opening
  useEffect(() => {
    if (isOpen) {
      if (initialQuestion && !initialTriggered.current) {
        initialTriggered.current = true;
        handleSendMessage(initialQuestion);
      } else if (messages.length === 0) {
        // Welcome message
        const welcomeMsg: AITutorMessage = {
          id: 'welcome-' + Date.now(),
          conversationId: 'conv-main',
          role: 'assistant',
          content: context?.exerciseContext
            ? `Chào bạn! Mình là Trợ giảng AI. Bạn có thắc mắc gì về bài tập "${context.exerciseContext.question}" hay cấu trúc ${context.grammarPoints?.[0] || 'này'} không?`
            : 'Chào bạn! Mình là Trợ giảng AI ZhongWen. Hãy hỏi bất kỳ thắc mắc nào về chữ Hán, ngữ pháp, hoặc yêu cầu mình sửa câu nhé! ✨',
          createdAt: new Date().toISOString(),
        };
        setMessages([welcomeMsg]);
      }
    } else {
      initialTriggered.current = false;
    }
  }, [isOpen, initialQuestion]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: AITutorMessage = {
      id: 'msg-u-' + Date.now(),
      conversationId: 'conv-main',
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const safeContext = context || ContextBuilder.build('general');
      const response = await AITutorService.sendChatMessage({
        conversationId: 'conv-main',
        message: text,
        mode,
        context: safeContext,
      });

      const aiMsg: AITutorMessage = {
        id: 'msg-ai-' + Date.now(),
        conversationId: 'conv-main',
        role: 'assistant',
        structuredResponse: response,
        contextSnapshot: safeContext,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: AITutorMessage = {
        id: 'msg-err-' + Date.now(),
        conversationId: 'conv-main',
        role: 'assistant',
        content: 'Trợ giảng AI hiện chưa phản hồi được. Vui lòng kiểm tra lại kết nối và thử lại.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const quickActions = ContextBuilder.getQuickActions(context);

  return (
    <>
      {/* Backdrop for click-away */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 90,
          transition: 'opacity 0.2s ease',
        }}
        onClick={onClose}
      />

      {/* Drawer Container: 430px on desktop, full-width bottom sheet on mobile */}
      <aside
        className="ai-tutor-drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '430px',
          backgroundColor: 'var(--surface)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          animation: 'slideInRight 0.25s ease',
        }}
      >
        {/* Header */}
        <AITutorHeader
          context={context}
          onClose={onClose}
          onClearContext={onClearContext}
        />

        {/* Mode Selector Tabs (ASK, CORRECT, CONVERSATION) */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--background)',
            padding: '2px 8px',
          }}
        >
          <button
            type="button"
            onClick={() => setMode('ASK')}
            style={{
              flex: 1,
              padding: '6px 0',
              border: 'none',
              borderBottom: mode === 'ASK' ? '2px solid var(--primary)' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: mode === 'ASK' ? 'var(--primary)' : 'var(--muted)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Hỏi đáp & Giải thích
          </button>
          <button
            type="button"
            onClick={() => setMode('CONVERSATION')}
            style={{
              flex: 1,
              padding: '6px 0',
              border: 'none',
              borderBottom: mode === 'CONVERSATION' ? '2px solid var(--primary)' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: mode === 'CONVERSATION' ? 'var(--primary)' : 'var(--muted)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            💬 Luyện hội thoại
          </button>
        </div>

        {/* Scrollable Chat Canvas */}
        <div
          ref={chatScrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-3) var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          {/* Conversation Scenario Mode */}
          {mode === 'CONVERSATION' && (
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <ConversationScenario />
            </div>
          )}

          {/* Quick Action Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '4px 0' }}>
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(action)}
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
                  textAlign: 'left',
                }}
              >
                💡 {action}
              </button>
            ))}
          </div>

          {/* Message List */}
          {messages.map((msg) => (
            <AITutorMessageItem
              key={msg.id}
              message={msg}
              onActionClick={(act) => handleSendMessage(act)}
            />
          ))}

          {/* Loading Skeleton / Typing indicator */}
          {isLoading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                width: 'fit-content',
                margin: 'var(--space-2) 0',
              }}
            >
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic' }}>
                ✨ Trợ giảng đang phân tích ngữ cảnh...
              </span>
            </div>
          )}
        </div>

        {/* Sticky Input Bar */}
        <AITutorInput
          onSend={handleSendMessage}
          isLoading={isLoading}
          contextTag={context?.grammarPoints?.[0] || (context?.lessonTitle ? 'Bài 8' : undefined)}
        />
      </aside>
    </>
  );
};
