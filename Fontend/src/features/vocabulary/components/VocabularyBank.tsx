import React, { useState, useMemo, useEffect } from 'react';
import { Flame, Play, BookOpen, Layers, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import {
  type VocabularyItem,
  type VocabularyFilterOptions,
  type HSKLevelNumber,
  type VocabularyExample,
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
import { httpClient } from '../../../core/api/client/http-client';
import { defaultApiConfig } from '../../../core/api/client/api-config';

interface VocabularyBankProps {
  onStartReviewSession: () => void;
  onReviewSingleWord: (word: VocabularyItem) => void;
}

function parseExamplesJson(raw: string | undefined): VocabularyExample[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => ({
      hanzi: item.zh || item.hanzi || item.chinese || '',
      pinyin: item.pinyin || '',
      meaning: item.meaningVi || item.meaning || item.vietnamese || '',
    }));
  } catch {
    return [];
  }
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

  // Async Data State
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleFilterChange = (updated: Partial<VocabularyFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
    setPage(1);
  };

  // Fetch Live Vocabulary from Backend SQL Server
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    // In unit test environment without real browser window
    if (defaultApiConfig.useMock && typeof window === 'undefined') {
      let filtered = [...INITIAL_VOCABULARY_LIST];
      if (filters.hskLevel !== 'all') {
        filtered = filtered.filter((v) => v.hskLevel === filters.hskLevel);
      }
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (v) =>
            v.hanzi.includes(q) ||
            v.pinyin.toLowerCase().includes(q) ||
            v.primaryMeaning.toLowerCase().includes(q)
        );
      }
      const start = (page - 1) * pageSize;
      const paged = filtered.slice(start, start + pageSize);
      setItems(paged);
      setTotalItems(filtered.length);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));
      setLoading(false);
      return;
    }

    const queryParams: Record<string, string | number | undefined> = {
      page,
      pageSize,
    };
    if (filters.hskLevel !== 'all') {
      queryParams.hskLevel = filters.hskLevel;
    }
    if (filters.searchQuery.trim()) {
      queryParams.search = filters.searchQuery.trim();
    }

    httpClient
      .get<any>('/content/vocabularies', { params: queryParams })
      .then((res) => {
        if (!isMounted) return;
        const rawItems = Array.isArray(res) ? res : (res?.items || []);
        const total = res?.totalItems ?? rawItems.length;
        const pages = res?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));

        const mapped: VocabularyItem[] = rawItems.map((dto: any) => {
          const examples = parseExamplesJson(dto.examplesJson);
          return {
            id: dto.id,
            hanzi: dto.hanzi || '',
            pinyin: dto.pinyin || '',
            primaryMeaning: dto.meaningVi || '',
            meanings: dto.meaningVi ? [dto.meaningVi] : [],
            wordType: dto.partOfSpeech || 'Từ vựng',
            hskLevel: (dto.hskLevel || 1) as HSKLevelNumber,
            lessonId: dto.lessonId || 0,
            lessonSource: dto.levelLabel
              ? `HSK ${dto.hskLevel} · ${dto.levelLabel}`
              : `HSK ${dto.hskLevel} chuẩn quốc tế`,
            examples,
          };
        });

        setItems(mapped);
        setTotalItems(total);
        setTotalPages(pages);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('[VocabularyBank] Error fetching vocabularies:', err);
        setError('Không thể kết nối đến kho từ vựng SQL Server. Vui lòng thử lại.');
        // Fallback to offline fixture if backend unreachable
        setItems(INITIAL_VOCABULARY_LIST);
        setTotalItems(INITIAL_VOCABULARY_LIST.length);
        setTotalPages(1);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [filters.hskLevel, filters.searchQuery, page]);

  // Counts for filter bar
  const counts = useMemo(() => {
    let due = 0;
    let learning = 0;
    let mastered = 0;

    for (const v of items) {
      const state = INITIAL_USER_VOCAB_STATES[v.id];
      if (state?.isDueToday) due++;
      if (state?.status === 'learning' || state?.status === 'reviewing') learning++;
      if (state?.status === 'mastered') mastered++;
    }

    return {
      total: totalItems,
      dueToday: due > 0 ? due : Math.min(items.length, 5),
      learning,
      mastered,
    };
  }, [items, totalItems]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* =====================================================================
          1. FOCUSED SRS ACTION HERO BANNER
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

      {/* Error Notice */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: '#FFF0F1',
            border: '1px solid #fed7da',
            color: '#E60012',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* =====================================================================
          3. VOCABULARY CARDS GRID
          ===================================================================== */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen size={16} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
              Danh sách từ vựng ({totalItems} mục xuất bản)
            </h3>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
            Chạm thẻ để xem chi tiết & câu ví dụ
          </span>
        </div>

        {loading && items.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px', color: '#64748b' }}>
            <Loader2 size={32} style={{ animation: 'grammarSpin 1s linear infinite', color: 'var(--primary, #E60012)' }} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Đang tải danh sách từ vựng từ SQL Server...</span>
          </div>
        ) : items.length === 0 ? (
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
              {filters.hskLevel !== 'all'
                ? `Cấp độ HSK ${filters.hskLevel} hiện chưa có từ vựng xuất bản nào phù hợp với bộ lọc hiện tại.`
                : 'Thử tìm từ khóa khác hoặc điều chỉnh lại bộ lọc cấp độ HSK.'}
            </div>
            <button
              type="button"
              onClick={() => handleFilterChange({ searchQuery: '', hskLevel: 'all', status: 'all' })}
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
            {items.map((vocab) => (
              <VocabularyCard
                key={vocab.id}
                vocabulary={vocab}
                userState={INITIAL_USER_VOCAB_STATES[vocab.id]}
                onClick={() => setSelectedWord(vocab)}
              />
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginTop: 'var(--space-6)',
              padding: '12px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
            }}
            aria-label="Phân trang từ vựng"
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: '#ffffff',
                color: page <= 1 ? '#94a3b8' : '#334155',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '12px',
              }}
            >
              <ChevronLeft size={16} />
              <span>Trước</span>
            </button>

            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
              Trang {page} / {totalPages} ({totalItems} từ vựng)
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: '#ffffff',
                color: page >= totalPages ? '#94a3b8' : '#334155',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '12px',
              }}
            >
              <span>Sau</span>
              <ChevronRight size={16} />
            </button>
          </nav>
        )}
      </div>

      {/* =====================================================================
          4. VOCABULARY DETAIL SLIDE DRAWER
          ==================================================================== */}
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

export default VocabularyBank;
