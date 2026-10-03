import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { type VocabularyItem } from '../types';
import { AudioPlayerButton } from '../components/AudioPlayerButton';

interface VocabularyStepProps {
  vocabulary: VocabularyItem[];
  onWordIndexChange?: (wordHanzi: string) => void;
}

export const VocabularyStep: React.FC<VocabularyStepProps> = ({ vocabulary, onWordIndexChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedWords, setSavedWords] = useState<Record<number, boolean>>({});

  const currentWord = vocabulary[currentIndex];

  const toggleSaveWord = (id: number) => {
    setSavedWords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const newIdx = currentIndex - 1;
      setCurrentIndex(newIdx);
      onWordIndexChange?.(vocabulary[newIdx].hanzi);
    }
  };

  const handleNext = () => {
    if (currentIndex < vocabulary.length - 1) {
      const newIdx = currentIndex + 1;
      setCurrentIndex(newIdx);
      onWordIndexChange?.(vocabulary[newIdx].hanzi);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%', alignItems: 'center' }}>
      
      {/* Top Progression Indicator for Vocabulary Sub-stepper */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '580px' }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
          TỪ VỰNG TRỌNG TÂM ({currentIndex + 1} / {vocabulary.length})
        </span>

        {/* Mini dot indicators */}
        <div style={{ display: 'flex', gap: '5px' }}>
          {vocabulary.map((w, idx) => (
            <button
              key={w.id}
              type="button"
              onClick={() => {
                setCurrentIndex(idx);
                onWordIndexChange?.(w.hanzi);
              }}
              style={{
                width: idx === currentIndex ? '18px' : '8px',
                height: '8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: idx === currentIndex ? 'var(--primary)' : 'var(--border)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: 0,
              }}
              title={`Từ ${idx + 1}: ${w.hanzi}`}
            />
          ))}
        </div>
      </div>

      {/* Main Vocabulary Showcase Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '580px',
          borderRadius: 'var(--radius-2xl)',
          backgroundColor: 'var(--surface)',
          border: '1.5px solid var(--border)',
          padding: 'var(--space-6) var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          position: 'relative',
        }}
      >
        {/* Part of speech pill */}
        {currentWord.partOfSpeech && (
          <span
            style={{
              padding: '2px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--neutral-bg)',
              color: 'var(--muted)',
              fontSize: '11px',
              fontWeight: 600,
              marginBottom: 'var(--space-2)',
            }}
          >
            {currentWord.partOfSpeech} • HSK {currentWord.hskLevel || 1}
          </span>
        )}

        {/* 1. Hanzi (Dominant visual focus) */}
        <div
          style={{
            fontFamily: 'var(--font-hanzi)',
            fontSize: 'var(--hanzi-display-lg)',
            fontWeight: 700,
            color: 'var(--foreground)',
            lineHeight: 1.1,
            letterSpacing: '0.04em',
            margin: 'var(--space-1) 0',
          }}
        >
          {currentWord.hanzi}
        </div>

        {/* 2. Pinyin with tone marks */}
        <div
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 700,
            color: 'var(--primary)',
            letterSpacing: '0.02em',
            marginBottom: 'var(--space-1)',
          }}
        >
          {currentWord.pinyin}
        </div>

        {/* 3. Vietnamese translation */}
        <div
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 600,
            color: 'var(--foreground)',
            marginBottom: 'var(--space-4)',
          }}
        >
          {currentWord.meaning}
        </div>

        {/* Audio buttons: Normal & Slow */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
          <AudioPlayerButton textToSpeak={currentWord.hanzi} variant="primary" label="Nghe phát âm" size="md" />
          <AudioPlayerButton textToSpeak={currentWord.hanzi} isSlow variant="outline" label="Nghe chậm" size="md" />
        </div>

        {/* Example Sentence Container */}
        <div
          style={{
            width: '100%',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
              CÂU VÍ DỤ MINH HỌA
            </span>
            <AudioPlayerButton textToSpeak={currentWord.exampleHanzi} variant="icon-only" size="sm" />
          </div>

          <div
            style={{
              fontFamily: 'var(--font-hanzi)',
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              color: 'var(--foreground)',
            }}
          >
            {currentWord.exampleHanzi}
          </div>

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', fontWeight: 600 }}>
            {currentWord.examplePinyin}
          </div>

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic' }}>
            &quot;{currentWord.exampleMeaning}&quot;
          </div>
        </div>

        {/* Bookmark / Add to Flashcard button */}
        <div style={{ marginTop: 'var(--space-4)', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => toggleSaveWord(currentWord.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border)',
              backgroundColor: savedWords[currentWord.id] ? 'var(--xp-bg)' : 'var(--surface)',
              color: savedWords[currentWord.id] ? 'var(--xp)' : 'var(--muted)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {savedWords[currentWord.id] ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            <span>{savedWords[currentWord.id] ? 'Đã lưu vào Flashcard' : '+ Thêm vào Flashcard'}</span>
          </button>
        </div>
      </div>

      {/* Mini Controls to Switch Words within Vocabulary Step */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '580px', marginTop: 'var(--space-1)' }}>
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={handlePrev}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: currentIndex === 0 ? 'var(--muted)' : 'var(--foreground)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            cursor: currentIndex === 0 ? 'default' : 'pointer',
            opacity: currentIndex === 0 ? 0.4 : 1,
          }}
        >
          <ChevronLeft size={16} />
          <span>Từ trước</span>
        </button>

        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', alignSelf: 'center' }}>
          {currentIndex + 1} / {vocabulary.length} từ
        </span>

        <button
          type="button"
          disabled={currentIndex === vocabulary.length - 1}
          onClick={handleNext}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: currentIndex === vocabulary.length - 1 ? 'var(--muted)' : 'var(--foreground)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            cursor: currentIndex === vocabulary.length - 1 ? 'default' : 'pointer',
            opacity: currentIndex === vocabulary.length - 1 ? 0.4 : 1,
          }}
        >
          <span>Từ tiếp</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
