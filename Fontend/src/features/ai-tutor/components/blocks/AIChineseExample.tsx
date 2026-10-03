import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import type { AIChineseExampleData } from '../../types';

interface AIChineseExampleProps {
  data: AIChineseExampleData;
}

export const AIChineseExample: React.FC<AIChineseExampleProps> = ({ data }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = () => {
    setIsPlaying(true);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(data.hanzi);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlaying(false), 1200);
    }
  };

  return (
    <div
      style={{
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--background)',
        border: '1.5px solid var(--border)',
        padding: 'var(--space-3-5) var(--space-4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
      }}
    >
      {/* Chinese Typography Hierarchy: Hanzi (Largest) -> Pinyin -> Vietnamese */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {/* 1. Hanzi (Top visual priority) */}
        <div
          style={{
            fontFamily: 'var(--font-hanzi)',
            fontSize: 'var(--text-lg)',
            fontWeight: 700,
            color: 'var(--foreground)',
            letterSpacing: '0.5px',
          }}
        >
          {data.hanzi}
        </div>

        {/* 2. Pinyin (Secondary) */}
        <div
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--primary)',
          }}
        >
          {data.pinyin}
        </div>

        {/* 3. Vietnamese Meaning (Tertiary) */}
        <div
          style={{
            fontSize: '11px',
            color: 'var(--muted)',
            fontStyle: 'italic',
          }}
        >
          &quot;{data.vietnamese}&quot;
        </div>
      </div>

      {/* Audio Button */}
      <button
        type="button"
        onClick={handleSpeak}
        style={{
          width: '34px',
          height: '34px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border)',
          backgroundColor: isPlaying ? 'var(--primary)' : 'var(--surface)',
          color: isPlaying ? '#ffffff' : 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.15s ease',
        }}
        title="Nghe phát âm"
      >
        <Volume2 size={16} />
      </button>
    </div>
  );
};
