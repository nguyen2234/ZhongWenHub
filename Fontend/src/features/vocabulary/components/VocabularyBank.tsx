import React, { useState, useMemo } from 'react';
import { Flame, Play, BookOpen, Layers } from 'lucide-react';
import {
  type VocabularyItem,
  type VocabularyFilterOptions,
} from '../types';
import {
  INITIAL_VOCABULARY_LIST,
  INITIAL_USER_VOCAB_STATES,
  INITIAL_SRS_STATES,
} from '../data/vocabularyBank';
import { VocabularyCard } from './VocabularyCard';
import { VocabularyFilters } from './VocabularyFilters';
import { VocabularyDetailDrawer } from './VocabularyDetailDrawer';
import { Button } from '../../../design-system';

interface VocabularyBankProps {
  onStartReviewSession: () => void;
  onReviewSingleWord: (word: VocabularyItem) => void;
}

export const VocabularyBank: React.FC<VocabularyBankProps> = ({
  onStartReviewSession,
  onReviewSingleWord,
}) => {
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);

  // Filters state
  const [filters, setFilters] = useState<VocabularyFilterOptions>({
    searchQuery: '',
    hskLevel: 'all',
    status: 'all',
  });

  const handleFilterChange = (updated: Partial<VocabularyFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  // Counts
  const counts = useMemo(() => {
    let due = 0;
    let learning = 0;
    let mastered = 0;

    for (const v of INITIAL_VOCABULARY_LIST) {
      const state = INITIAL_USER_VOCAB_STATES[v.id];
      if (state?.isDueToday) due++;
      if (state?.status === 'learning' || state?.status === 'reviewing') learning++;
      if (state?.status === 'mastered') mastered++;
    }

    return {
      total: INITIAL_VOCABULARY_LIST.length,
      dueToday: due,
      learning,
      mastered,
    };
  }, []);

  // Filtered List
  const filteredVocabulary = useMemo(() => {
    return INITIAL_VOCABULARY_LIST.filter((item) => {
      const state = INITIAL_USER_VOCAB_STATES[item.id];

      // HSK Level filter
      if (filters.hskLevel !== 'all' && item.hskLevel !== filters.hskLevel) {
        return false;
      }

      // Status filter
      if (filters.status === 'due' && !state?.isDueToday) return false;
      if (filters.status === 'learning' && state?.status !== 'learning' && state?.status !== 'reviewing') return false;
      if (filters.status === 'mastered' && state?.status !== 'mastered') return false;

      // Search Query filter (Hanzi, Pinyin, Vietnamese)
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchHanzi = item.hanzi.includes(q);
        const matchPinyin = item.pinyin.toLowerCase().includes(q);
        const matchMeaning =
          item.primaryMeaning.toLowerCase().includes(q) ||
          item.meanings.some((m) => m.toLowerCase().includes(q));

        if (!matchHanzi && !matchPinyin && !matchMeaning) {
          return false;
        }
      }

      return true;
    });
  }, [filters]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      
      {/* =====================================================================
          1. FOCUSED SRS ACTION HERO BANNER
          (Không biến thành dashboard phức tạp, chỉ ưu tiên 18 từ cần ôn hôm nay)
          ===================================================================== */}
      <section
        style={{
          padding: 'var(--space-5) var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--surface)',
          border: '2px solid var(--streak-border)',
          boxShadow: '0 4px 18px rgba(234, 88, 12, 0.08)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--streak-bg)',
              color: 'var(--streak)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Flame size={26} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                {counts.dueToday} từ cần ôn tập hôm nay
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: 'var(--streak-bg)',
                  color: 'var(--streak)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                Spaced Repetition
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Thuật toán ngắt quãng đã tính toán các từ chuẩn bị rơi vào vùng quên. Ôn tập ngay để chuyển vào bộ nhớ dài hạn!
            </p>
          </div>
        </div>

        {/* Primary CTA */}
        <Button
          variant="primary"
          icon={<Play size={18} fill="currentColor" />}
          onClick={onStartReviewSession}
          style={{
            minHeight: '46px',
            padding: '0 var(--space-6)',
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            backgroundColor: 'var(--streak)',
            boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)',
          }}
        >
          BẮT ĐẦU ÔN ({counts.dueToday} TỪ) ➜
        </Button>
      </section>

      {/* =====================================================================
          2. FILTERS & SEARCH BAR
          ===================================================================== */}
      <VocabularyFilters
        filters={filters}
        onChange={handleFilterChange}
        counts={counts}
      />

      {/* =====================================================================
          3. VOCABULARY CARDS GRID
          ===================================================================== */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen size={16} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
              Danh sách từ vựng ({filteredVocabulary.length} kết quả)
            </h3>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
            Chạm thẻ để xem chi tiết & câu ví dụ
          </span>
        </div>

        {filteredVocabulary.length === 0 ? (
          /* Empty Search State */
          <div
            style={{
              padding: 'var(--space-8)',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--surface)',
              border: '1px dashed var(--border)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <Layers size={32} style={{ color: 'var(--muted)' }} />
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--foreground)' }}>
              Không tìm thấy từ vựng phù hợp
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Thử tìm từ khóa khác hoặc điều chỉnh lại bộ lọc cấp độ HSK.
            </div>
            <button
              type="button"
              onClick={() => setFilters({ searchQuery: '', hskLevel: 'all', status: 'all' })}
              style={{
                marginTop: 'var(--space-2)',
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
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 'var(--space-3-5)',
            }}
          >
            {filteredVocabulary.map((vocab) => (
              <VocabularyCard
                key={vocab.id}
                vocabulary={vocab}
                userState={INITIAL_USER_VOCAB_STATES[vocab.id]}
                onClick={() => setSelectedWord(vocab)}
              />
            ))}
          </div>
        )}
      </div>

      {/* =====================================================================
          4. VOCABULARY DETAIL SLIDE DRAWER
          ===================================================================== */}
      <VocabularyDetailDrawer
        vocabulary={selectedWord}
        userState={selectedWord ? INITIAL_USER_VOCAB_STATES[selectedWord.id] : undefined}
        srsState={selectedWord ? INITIAL_SRS_STATES[selectedWord.id] : undefined}
        onClose={() => setSelectedWord(null)}
        onReviewSingleWord={(word) => {
          setSelectedWord(null);
          onReviewSingleWord(word);
        }}
      />
    </div>
  );
};
