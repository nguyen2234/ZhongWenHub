import React from 'react';
import { X, Play, Clock, Sparkles } from 'lucide-react';
import { type VocabularyItem, type UserVocabularyState, type SRSState } from '../types';
import { AudioPlayerButton } from '../../lesson/components/AudioPlayerButton';
import { Button, HSKLevel } from '../../../design-system';
import { useAITutor, ContextBuilder } from '../../ai-tutor';

interface VocabularyDetailDrawerProps {
  vocabulary: VocabularyItem | null;
  userState?: UserVocabularyState;
  srsState?: SRSState;
  onClose: () => void;
  onReviewSingleWord: (word: VocabularyItem) => void;
}

export const VocabularyDetailDrawer: React.FC<VocabularyDetailDrawerProps> = ({
  vocabulary,
  userState,
  srsState,
  onClose,
  onReviewSingleWord,
}) => {
  const { openAITutor } = useAITutor();
  if (!vocabulary) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 60,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Drawer */}
      <aside
        aria-label="Chi tiết từ vựng"
        className="ai-tutor-drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--surface)',
          zIndex: 70,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.15)',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <HSKLevel level={vocabulary.hskLevel} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 600 }}>
              {vocabulary.wordType}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={18} />
          </button>
        </header>

        {/* Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-5)',
          }}
        >
          {/* Main Word Hero */}
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-hanzi)',
                fontSize: 'var(--hanzi-display-md)',
                fontWeight: 700,
                color: 'var(--foreground)',
                lineHeight: 1.15,
                margin: 'var(--space-1) 0',
              }}
            >
              {vocabulary.hanzi}
            </div>

            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--primary)', marginBottom: 'var(--space-1)' }}>
              {vocabulary.pinyin}
            </div>

            <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--foreground)' }}>
              {vocabulary.primaryMeaning}
            </div>

            {/* Audio buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <AudioPlayerButton textToSpeak={vocabulary.hanzi} variant="primary" label="Phát âm chuẩn" size="md" />
              <AudioPlayerButton textToSpeak={vocabulary.hanzi} isSlow variant="outline" label="Nghe chậm" size="md" />
            </div>
          </div>

          {/* Detailed Meanings */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              CÁC NGHĨA PHỔ BIẾN
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {vocabulary.meanings.map((m, i) => (
                <span
                  key={i}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--foreground)',
                  }}
                >
                  {i + 1}. {m}
                </span>
              ))}
            </div>
          </div>

          {/* Example Sentences */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              CÂU VÍ DỤ MINH HỌA
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2-5)' }}>
              {vocabulary.examples.map((ex, i) => (
                <div
                  key={i}
                  style={{
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--foreground)' }}>
                      {ex.hanzi}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                      {ex.pinyin}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic' }}>
                      &quot;{ex.meaning}&quot;
                    </div>
                  </div>
                  <AudioPlayerButton textToSpeak={ex.hanzi} variant="icon-only" size="sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Memory & Spaced Repetition Stats Card */}
          <div
            style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
              fontSize: 'var(--text-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--foreground)' }}>
              <Clock size={15} style={{ color: 'var(--primary)' }} />
              <span>TRẠNG THÁI GHI NHỚ (SPACED REPETITION)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
              <span>Trạng thái:</span>
              <strong style={{ color: userState?.isDueToday ? 'var(--streak)' : 'var(--success)' }}>
                {userState?.isDueToday ? '🔥 Cần ôn tập hôm nay' : userState?.status === 'mastered' ? 'Đã nhớ vững' : 'Đang học'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
              <span>Bài học gốc:</span>
              <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{vocabulary.lessonSource}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
              <span>Số lần đã ôn tập:</span>
              <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{userState?.reviewCount || 0} lần</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
              <span>Khoảng cách lặp lại:</span>
              <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{srsState?.interval ? `${srsState.interval} ngày` : 'Mới học'}</span>
            </div>

            {userState?.lastReviewedAt && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                <span>Lần ôn gần nhất:</span>
                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{userState.lastReviewedAt}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Action CTA */}
        <footer
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <Button
            variant="primary"
            icon={<Play size={16} fill="currentColor" />}
            onClick={() => onReviewSingleWord(vocabulary)}
            style={{ width: '100%', minHeight: '44px', fontWeight: 700 }}
          >
            ÔN TỪ NÀY (FLASHCARD)
          </Button>

          <button
            type="button"
            onClick={() => {
              const ctx = ContextBuilder.build('vocabulary', {
                hskLevel: vocabulary.hskLevel,
                vocabularyWord: {
                  hanzi: vocabulary.hanzi,
                  pinyin: vocabulary.pinyin,
                  meaning: vocabulary.primaryMeaning,
                },
              });
              onClose();
              openAITutor(ctx, `Giải thích chi tiết và phân biệt từ "${vocabulary.hanzi}" (${vocabulary.pinyin}) giúp em.`);
            }}
            style={{
              width: '100%',
              padding: '9px 0',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--primary)',
              color: 'var(--primary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} />
            <span>✨ HỎI AI VỀ TỪ NÀY</span>
          </button>
        </footer>
      </aside>
    </>
  );
};
