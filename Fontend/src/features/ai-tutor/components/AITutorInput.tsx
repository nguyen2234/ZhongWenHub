import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';

interface AITutorInputProps {
  onSend: (text: string) => Promise<boolean> | boolean | void;
  isLoading?: boolean;
  placeholder?: string;
}

export const AITutorInput: React.FC<AITutorInputProps> = ({
  onSend,
  isLoading = false,
  placeholder = 'Hỏi bất kỳ điều gì về bài học hoặc chữ Hán...',
}) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const isSubmittingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea cleanly up to ~4 lines
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 108)}px`;
  }, [text]);

  const submitMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    try {
      const result = await onSend(trimmed);
      // Keep user draft intact when a request explicitly fails (returns false)
      if (result !== false) {
        setText('');
      }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submitMessage();
    }
  };

  const canSend = Boolean(text.trim()) && !isLoading;

  return (
    <form
      onSubmit={handleSubmit}
      className="ai-tutor-input-bar"
      style={{
        padding: '12px 16px calc(12px + env(safe-area-inset-bottom, 0px)) 16px',
        borderTop: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          backgroundColor: '#f8fafc',
          borderRadius: '22px',
          border: isFocused ? '1.5px solid #93c5fd' : '1.5px solid #e2e8f0',
          padding: '6px 8px 6px 14px',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          boxShadow: isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
        }}
      >
        <Sparkles
          size={16}
          style={{
            color: isFocused ? '#2563eb' : '#94a3b8',
            flexShrink: 0,
            marginBottom: '8px',
            transition: 'color 0.15s ease',
          }}
        />

        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          disabled={isLoading}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          aria-label="Nhập câu hỏi cho Trợ giảng AI"
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: '32px',
            maxHeight: '108px',
            padding: '6px 0',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            fontSize: 'var(--text-xs)',
            lineHeight: 1.45,
            color: '#0f172a',
            fontFamily: 'inherit',
            resize: 'none',
            overflowY: 'auto',
          }}
        />

        <button
          type="submit"
          disabled={!canSend}
          aria-label="Gửi tin nhắn"
          title="Gửi câu hỏi (Enter)"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: canSend ? 'var(--primary)' : '#cbd5e1',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: canSend ? 'pointer' : 'default',
            flexShrink: 0,
            transition: 'background-color 0.15s ease, transform 0.15s ease',
          }}
        >
          <Send size={15} />
        </button>
      </div>
    </form>
  );
};
