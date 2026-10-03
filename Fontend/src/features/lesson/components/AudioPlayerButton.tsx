import React, { useState } from 'react';
import { Volume2, Play } from 'lucide-react';

interface AudioPlayerButtonProps {
  textToSpeak: string;
  pinyin?: string;
  isSlow?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const AudioPlayerButton: React.FC<AudioPlayerButtonProps> = ({
  textToSpeak,
  isSlow = false,
  variant = 'secondary',
  size = 'md',
  label,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'zh-CN';
      utterance.rate = isSlow ? 0.65 : 0.95;

      // Try finding a Chinese voice
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find(
        (v) => v.lang.includes('zh') || v.lang.includes('cmn') || v.name.includes('Chinese')
      );
      if (zhVoice) {
        utterance.voice = zhVoice;
      }

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback visual simulation if browser lacks speechSynthesis
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), 1200);
    }
  };

  // Sizing styles
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  if (variant === 'icon-only') {
    return (
      <button
        type="button"
        onClick={handleSpeak}
        title={isSlow ? 'Nghe chậm (0.7x)' : 'Phát âm tiếng Trung'}
        aria-label={label || 'Nghe phát âm'}
        style={{
          width: isSm ? '28px' : isLg ? '40px' : '34px',
          height: isSm ? '28px' : isLg ? '40px' : '34px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border)',
          backgroundColor: isPlaying ? 'var(--primary-light)' : 'var(--surface)',
          color: isPlaying ? 'var(--primary)' : 'var(--foreground)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          transform: isPlaying ? 'scale(1.08)' : 'scale(1)',
        }}
      >
        <Volume2 size={isSm ? 14 : isLg ? 20 : 16} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSpeak}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: isSm ? '4px 10px' : isLg ? '10px 18px' : '6px 14px',
        borderRadius: 'var(--radius-full)',
        border: variant === 'outline' ? '1.5px solid var(--primary)' : '1px solid var(--border)',
        backgroundColor:
          variant === 'primary'
            ? 'var(--primary)'
            : isPlaying
            ? 'var(--primary-light)'
            : 'var(--surface)',
        color: variant === 'primary' ? '#ffffff' : isPlaying ? 'var(--primary)' : 'var(--foreground)',
        fontSize: isSm ? 'var(--text-xs)' : isLg ? 'var(--text-base)' : 'var(--text-sm)',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        transform: isPlaying ? 'scale(1.02)' : 'none',
      }}
    >
      {isPlaying ? (
        <Volume2 size={isSm ? 14 : 16} style={{ animation: 'pulse 1s infinite' }} />
      ) : isSlow ? (
        <span style={{ fontSize: '13px' }}>🐢</span>
      ) : (
        <Play size={isSm ? 12 : 14} fill="currentColor" />
      )}
      <span>{label || (isSlow ? 'Nghe chậm' : 'Nghe phát âm')}</span>
    </button>
  );
};
