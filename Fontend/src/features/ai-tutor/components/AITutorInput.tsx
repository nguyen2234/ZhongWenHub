import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface AITutorInputProps {
  onSend: (text: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  contextTag?: string;
}

export const AITutorInput: React.FC<AITutorInputProps> = ({
  onSend,
  isLoading = false,
  placeholder = 'Hỏi bất kỳ điều gì về bài học hoặc chữ Hán...',
  contextTag,
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: 'var(--space-3) var(--space-4)',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        position: 'sticky',
        bottom: 0,
        zIndex: 20,
      }}
    >
      {/* Context indicator above input */}
      {contextTag && (
        <div style={{ fontSize: '10px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>Ngữ cảnh:</span>
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{contextTag}</span>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          backgroundColor: 'var(--background)',
          borderRadius: 'var(--radius-xl)',
          border: '1.5px solid var(--border)',
          padding: '4px 8px 4px 14px',
        }}
      >
        <input
          type="text"
          value={text}
          disabled={isLoading}
          onChange={(e) => setText(e.target.value)}
          placeholder={isLoading ? 'Trợ giảng đang suy nghĩ...' : placeholder}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            fontSize: 'var(--text-xs)',
            color: 'var(--foreground)',
          }}
        />

        {/* Future voice action slot ready: can add Mic button here */}

        <button
          type="submit"
          disabled={!text.trim() || isLoading}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            backgroundColor: text.trim() && !isLoading ? 'var(--primary)' : 'var(--border)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: text.trim() && !isLoading ? 'pointer' : 'default',
            transition: 'all 0.15s ease',
          }}
          title="Gửi câu hỏi"
        >
          <Send size={15} />
        </button>
      </div>
    </form>
  );
};
