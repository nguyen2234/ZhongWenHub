import React, { useState } from 'react';
import { Volume2, Headphones } from 'lucide-react';
import { type ListeningData } from '../types';
import { AudioPlayerButton } from '../components/AudioPlayerButton';
import { AnswerFeedback } from '../components/AnswerFeedback';

interface ListeningStepProps {
  listening: ListeningData;
  onAnswerSelected?: (isCorrect: boolean) => void;
}

export const ListeningStep: React.FC<ListeningStepProps> = ({ listening, onAnswerSelected }) => {
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const selectedOption = listening.options.find((o) => o.id === selectedOptionId);
  const isCorrect = selectedOption?.isCorrect ?? false;
  const correctOption = listening.options.find((o) => o.isCorrect);

  const handleSelect = (id: number) => {
    if (!hasSubmitted) {
      setSelectedOptionId(id);
    }
  };

  const handleCheck = () => {
    if (selectedOptionId !== null) {
      setHasSubmitted(true);
      onAnswerSelected?.(isCorrect);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', width: '100%', alignItems: 'center' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 10px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
          <Headphones size={14} />
          <span>LUYỆN NGHE PHẢN XẠ</span>
        </div>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 'var(--space-1) 0', color: 'var(--foreground)' }}>
          {listening.prompt}
        </h2>
      </div>

      {/* Dominant Audio Player Box */}
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-2xl)',
          backgroundColor: 'var(--surface)',
          border: '1.5px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-4)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(67, 56, 202, 0.2)',
          }}
        >
          <Volume2 size={34} />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <AudioPlayerButton
            textToSpeak={listening.audioHanzi}
            variant="primary"
            size="lg"
            label="Phát đoạn ghi âm"
          />
          <AudioPlayerButton
            textToSpeak={listening.audioHanzi}
            isSlow
            variant="outline"
            size="lg"
            label="Nghe chậm (0.7x)"
          />
        </div>

        {/* Reveal transcript after answering */}
        {hasSubmitted && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--background)',
              border: '1px dashed var(--border)',
              width: '100%',
              textAlign: 'center',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>NỘI DUNG GHI ÂM:</div>
            <div style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)', marginTop: '2px' }}>
              {listening.audioHanzi}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', fontWeight: 600 }}>
              {listening.audioPinyin}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic' }}>
              &quot;{listening.audioMeaning}&quot;
            </div>
          </div>
        )}
      </div>

      {/* Answer Options */}
      <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
          CHỌN ĐÁP ÁN ĐÚNG:
        </span>

        {listening.options.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          let borderCol = 'var(--border)';
          let bgCol = 'var(--surface)';

          if (hasSubmitted) {
            if (opt.isCorrect) {
              borderCol = 'var(--success-border)';
              bgCol = 'var(--success-bg)';
            } else if (isSelected && !opt.isCorrect) {
              borderCol = 'var(--danger-border)';
              bgCol = 'var(--danger-bg)';
            }
          } else if (isSelected) {
            borderCol = 'var(--primary)';
            bgCol = 'var(--primary-light)';
          }

          return (
            <button
              key={opt.id}
              type="button"
              disabled={hasSubmitted}
              onClick={() => handleSelect(opt.id)}
              style={{
                padding: 'var(--space-3-5) var(--space-4)',
                borderRadius: 'var(--radius-xl)',
                border: `1.5px solid ${borderCol}`,
                backgroundColor: bgCol,
                color: 'var(--foreground)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                cursor: hasSubmitted ? 'default' : 'pointer',
                textAlign: 'left',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: isSelected ? '5px solid var(--primary)' : '2px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  flexShrink: 0,
                }}
              />
              <span>{opt.text}</span>
            </button>
          );
        })}
      </div>

      {/* Check / Feedback */}
      <div style={{ width: '100%', maxWidth: '560px' }}>
        {!hasSubmitted ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
            <button
              type="button"
              disabled={selectedOptionId === null}
              onClick={handleCheck}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: selectedOptionId === null ? 'var(--border)' : 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: 'var(--text-sm)',
                cursor: selectedOptionId === null ? 'default' : 'pointer',
              }}
            >
              Kiểm tra đáp án
            </button>
          </div>
        ) : (
          <AnswerFeedback
            isCorrect={isCorrect}
            explanation={listening.explanation}
            correctAnswerText={correctOption?.text}
            userAnswerText={selectedOption?.text}
          />
        )}
      </div>
    </div>
  );
};
