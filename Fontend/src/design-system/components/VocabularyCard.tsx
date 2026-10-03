import React from 'react';
import { Volume2, Bookmark } from 'lucide-react';
import { Card } from './Card';
import { HSKLevel, type HSKLevelType } from './HSKLevel';
import { Button } from './Button';

export interface VocabularyCardProps {
  hanzi: string;
  pinyin: string;
  meaning: string;
  partOfSpeech: string;
  hskLevel?: HSKLevelType;
  exampleHanzi?: string;
  examplePinyin?: string;
  exampleMeaning?: string;
  onPlayAudio?: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

export const VocabularyCard: React.FC<VocabularyCardProps> = ({
  hanzi,
  pinyin,
  meaning,
  partOfSpeech,
  hskLevel = 1,
  exampleHanzi,
  examplePinyin,
  exampleMeaning,
  onPlayAudio,
  onBookmark,
  isBookmarked = false,
}) => {
  return (
    <Card
      style={{
        border: '1px solid var(--border-strong)',
        backgroundColor: 'var(--surface)',
      }}
    >
      {/* Header card: HSK level & bookmark */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <HSKLevel level={hskLevel} />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', backgroundColor: 'var(--neutral-bg)', padding: '2px 6px', borderRadius: '4px' }}>
            {partOfSpeech}
          </span>
        </div>

        <button
          type="button"
          onClick={onBookmark}
          aria-label={isBookmarked ? 'Bỏ lưu từ' : 'Lưu từ vựng'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: isBookmarked ? 'var(--primary)' : 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
          }}
        >
          <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Main Vocabulary Presentation */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div>
          {/* Chữ Hán to, chuẩn font chữ Hán */}
          <div
            style={{
              fontFamily: 'var(--font-hanzi)',
              fontSize: 'var(--hanzi-display-md)',
              fontWeight: 600,
              lineHeight: 1.1,
              color: 'var(--foreground)',
              letterSpacing: '0.05em',
            }}
          >
            {hanzi}
          </div>

          {/* Phiên âm Pinyin kèm thanh điệu */}
          <div
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 500,
              color: 'var(--primary)',
              marginTop: '4px',
            }}
          >
            {pinyin}
          </div>

          {/* Nghĩa tiếng Việt */}
          <div
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              color: 'var(--foreground)',
              marginTop: '6px',
            }}
          >
            {meaning}
          </div>
        </div>

        {/* Nút phát âm âm thanh audio */}
        <Button
          variant="outline"
          isIconOnly
          onClick={onPlayAudio}
          aria-label="Nghe phát âm"
          icon={<Volume2 size={18} style={{ color: 'var(--primary)' }} />}
          style={{ borderRadius: 'var(--radius-full)' }}
        />
      </div>

      {/* Câu ví dụ ngữ cảnh song ngữ Trung - Việt */}
      {exampleHanzi && (
        <div
          style={{
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: '2px' }}>
            Ví dụ ngữ cảnh:
          </div>
          <div style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--foreground)' }}>
            {exampleHanzi}
          </div>
          {examplePinyin && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              {examplePinyin}
            </div>
          )}
          {exampleMeaning && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--foreground)', fontStyle: 'italic', marginTop: '2px' }}>
              &quot;{exampleMeaning}&quot;
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
