import React, { useState } from 'react';
import { Eye, EyeOff, Play, Users } from 'lucide-react';
import { type DialogueLine } from '../types';
import { AudioPlayerButton } from '../components/AudioPlayerButton';

interface DialogueStepProps {
  dialogue: {
    title: string;
    situation: string;
    lines: DialogueLine[];
  };
}

export const DialogueStep: React.FC<DialogueStepProps> = ({ dialogue }) => {
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [activeSpeakingLineId, setActiveSpeakingLineId] = useState<number | null>(null);

  const handlePlayFullDialogue = (isSlow = false) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    let currentIndex = 0;
    const playNext = () => {
      if (currentIndex >= dialogue.lines.length) {
        setActiveSpeakingLineId(null);
        return;
      }

      const line = dialogue.lines[currentIndex];
      setActiveSpeakingLineId(line.id);

      const utterance = new SpeechSynthesisUtterance(line.hanzi);
      utterance.lang = 'zh-CN';
      utterance.rate = isSlow ? 0.7 : 0.95;

      utterance.onend = () => {
        currentIndex++;
        setTimeout(playNext, 400); // short pause between sentences
      };
      utterance.onerror = () => {
        setActiveSpeakingLineId(null);
      };

      window.speechSynthesis.speak(utterance);
    };

    playNext();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* Dialogue Header & Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-3)',
          paddingBottom: 'var(--space-3)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={16} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
              {dialogue.title}
            </h2>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '2px' }}>
            {dialogue.situation}
          </div>
        </div>

        {/* Global Controls: Play All, Slow, Toggle Pinyin, Toggle Vietnamese */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button
            type="button"
            onClick={() => handlePlayFullDialogue(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              border: 'none',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Play size={12} fill="currentColor" />
            <span>Nghe toàn bộ</span>
          </button>

          <button
            type="button"
            onClick={() => handlePlayFullDialogue(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--surface)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>🐢 Chậm</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPinyin((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: showPinyin ? 'var(--surface)' : 'var(--background)',
              color: showPinyin ? 'var(--foreground)' : 'var(--muted)',
              border: '1px solid var(--border)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {showPinyin ? <Eye size={12} /> : <EyeOff size={12} />}
            <span>Pinyin</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMeaning((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: showMeaning ? 'var(--surface)' : 'var(--background)',
              color: showMeaning ? 'var(--foreground)' : 'var(--muted)',
              border: '1px solid var(--border)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {showMeaning ? <Eye size={12} /> : <EyeOff size={12} />}
            <span>Tiếng Việt</span>
          </button>
        </div>
      </div>

      {/* Dialogue Conversation Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {dialogue.lines.map((line) => {
          const isSpeakerA = line.speaker === 'A';
          const isCurrentlySpeaking = activeSpeakingLineId === line.id;

          return (
            <div
              key={line.id}
              style={{
                display: 'flex',
                gap: 'var(--space-3)',
                alignItems: 'flex-start',
                flexDirection: isSpeakerA ? 'row' : 'row-reverse',
              }}
            >
              {/* Avatar / Speaker badge */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isSpeakerA ? 'var(--primary-light)' : 'var(--hsk2-bg)',
                  border: `1.5px solid ${isSpeakerA ? 'var(--primary)' : 'var(--hsk2-border)'}`,
                  color: isSpeakerA ? 'var(--primary)' : 'var(--hsk2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: '2px',
                }}
                title={`${line.speakerName} (${line.speakerRole})`}
              >
                {line.speaker}
              </div>

              {/* Speech Bubble */}
              <div
                style={{
                  maxWidth: '82%',
                  padding: 'var(--space-3-5) var(--space-4)',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: isCurrentlySpeaking
                    ? 'rgba(67, 56, 202, 0.08)'
                    : isSpeakerA
                    ? 'var(--surface)'
                    : 'rgba(240, 253, 250, 0.7)',
                  border: isCurrentlySpeaking
                    ? '2px solid var(--primary)'
                    : `1px solid ${isSpeakerA ? 'var(--border)' : 'var(--hsk2-border)'}`,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                {/* Speaker role tag & Line audio buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: isSpeakerA ? 'var(--primary)' : 'var(--hsk2)' }}>
                    {line.speakerName} ({line.speakerRole})
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AudioPlayerButton textToSpeak={line.hanzi} variant="icon-only" size="sm" />
                    <AudioPlayerButton textToSpeak={line.hanzi} isSlow variant="icon-only" size="sm" />
                  </div>
                </div>

                {/* 1. Hanzi */}
                <div
                  style={{
                    fontFamily: 'var(--font-hanzi)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 700,
                    color: 'var(--foreground)',
                    letterSpacing: '0.02em',
                    lineHeight: 1.3,
                  }}
                >
                  {line.hanzi}
                </div>

                {/* 2. Pinyin (toggleable) */}
                {showPinyin && (
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--primary)',
                      fontWeight: 600,
                      marginTop: '3px',
                    }}
                  >
                    {line.pinyin}
                  </div>
                )}

                {/* 3. Vietnamese meaning (toggleable) */}
                {showMeaning && (
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--muted)',
                      marginTop: '4px',
                      fontStyle: 'italic',
                    }}
                  >
                    &quot;{line.meaning}&quot;
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
