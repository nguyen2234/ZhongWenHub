import React, { useState } from 'react';
import { Volume2, RotateCw } from 'lucide-react';
import { HSKLevel, type HSKLevelType } from './HSKLevel';
import { Button } from './Button';

export interface FlashcardProps {
  hanzi: string;
  pinyin: string;
  meaning: string;
  partOfSpeech: string;
  hskLevel?: HSKLevelType;
  exampleSentence?: string;
  exampleMeaning?: string;
  onRate?: (rating: 'again' | 'hard' | 'good' | 'easy') => void;
  onPlayAudio?: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({
  hanzi,
  pinyin,
  meaning,
  partOfSpeech,
  hskLevel = 1,
  exampleSentence,
  exampleMeaning,
  onRate,
  onPlayAudio,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-2xl)',
        border: '1.5px solid var(--border-strong)',
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        minHeight: '340px',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top Header info */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <HSKLevel level={hskLevel} />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
          {isFlipped ? 'Mặt sau (Giải nghĩa)' : 'Mặt trước (Nhận diện)'}
        </span>
        <Button
          variant="ghost"
          isIconOnly
          onClick={() => setIsFlipped((prev) => !prev)}
          icon={<RotateCw size={16} />}
          aria-label="Lật thẻ"
        />
      </div>

      {/* Main Flashcard Content Area */}
      <div
        style={{
          margin: 'var(--space-4) 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-2)',
          cursor: 'pointer',
          width: '100%',
        }}
        onClick={() => setIsFlipped((prev) => !prev)}
      >
        {/* Chữ Hán to trong khung mô phỏng ô điền chữ */}
        <div
          style={{
            width: '120px',
            height: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--background)',
            border: '1px dashed var(--border-strong)',
            position: 'relative',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-hanzi)',
              fontSize: 'var(--hanzi-display-lg)',
              color: 'var(--foreground)',
              lineHeight: 1,
            }}
          >
            {hanzi}
          </span>
        </div>

        {/* Nút nghe âm thanh */}
        <div style={{ marginTop: 'var(--space-2)' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onPlayAudio) onPlayAudio();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              border: 'none',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Volume2 size={16} /> Nghe phát âm
          </button>
        </div>

        {/* Mặt sau hiển thị Pinyin & Nghĩa */}
        {isFlipped ? (
          <div style={{ marginTop: 'var(--space-3)', width: '100%' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--primary)' }}>
              {pinyin}
            </div>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)', marginTop: '2px' }}>
              {meaning} <span style={{ fontSize: 'var(--text-xs)', fontWeight: 400, color: 'var(--muted)' }}>({partOfSpeech})</span>
            </div>

            {exampleSentence && (
              <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-2)', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)' }}>
                <div style={{ fontFamily: 'var(--font-hanzi)', fontWeight: 500 }}>{exampleSentence}</div>
                {exampleMeaning && <div style={{ color: 'var(--muted)', marginTop: '2px' }}>{exampleMeaning}</div>}
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 'var(--space-3)' }}>
            Chạm vào thẻ để lật xem phiên âm & nghĩa
          </div>
        )}
      </div>

      {/* Spaced Repetition Evaluation Buttons (khi đã lật mặt sau) */}
      {isFlipped ? (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 500 }}>
            Đánh giá độ nhớ (Spaced Repetition):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-1-5)' }}>
            <button
              type="button"
              onClick={() => onRate && onRate('again')}
              style={{
                padding: '6px 4px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--danger-border)',
                backgroundColor: 'var(--danger-bg)',
                color: 'var(--danger)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <div>Lặp lại</div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>&lt; 1 phút</div>
            </button>

            <button
              type="button"
              onClick={() => onRate && onRate('hard')}
              style={{
                padding: '6px 4px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--warning-border)',
                backgroundColor: 'var(--warning-bg)',
                color: 'var(--warning)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <div>Khó</div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>10 phút</div>
            </button>

            <button
              type="button"
              onClick={() => onRate && onRate('good')}
              style={{
                padding: '6px 4px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--success-border)',
                backgroundColor: 'var(--success-bg)',
                color: 'var(--success)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <div>Tốt</div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>1 ngày</div>
            </button>

            <button
              type="button"
              onClick={() => onRate && onRate('easy')}
              style={{
                padding: '6px 4px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--hsk1-border)',
                backgroundColor: 'var(--hsk1-bg)',
                color: 'var(--hsk1)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <div>Dễ</div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>4 ngày</div>
            </button>
          </div>
        </div>
      ) : (
        <Button variant="outline" style={{ width: '100%' }} onClick={() => setIsFlipped(true)}>
          Lật xem đáp án
        </Button>
      )}
    </div>
  );
};
