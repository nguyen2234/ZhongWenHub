import React from 'react';
import { Search, X, Flame } from 'lucide-react';
import { type HSKLevelNumber, type VocabularyFilterOptions } from '../types';

interface VocabularyFiltersProps {
  filters: VocabularyFilterOptions;
  onChange: (updated: Partial<VocabularyFilterOptions>) => void;
  counts: {
    total: number;
    dueToday: number;
    learning: number;
    mastered: number;
  };
}

export const VocabularyFilters: React.FC<VocabularyFiltersProps> = ({
  filters,
  onChange,
  counts,
}) => {
  const hskOptions: (HSKLevelNumber | 'all')[] = ['all', 1, 2, 3];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%' }}>
      {/* Top Search Input Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: '0 var(--space-4)',
          height: '44px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
        }}
      >
        <Search size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onChange({ searchQuery: e.target.value })}
          placeholder="Tìm theo Chữ Hán, Pinyin, hoặc nghĩa Tiếng Việt (ví dụ: 喝, kāfēi, trà)..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            fontSize: 'var(--text-sm)',
            color: 'var(--foreground)',
          }}
        />
        {filters.searchQuery && (
          <button
            type="button"
            onClick={() => onChange({ searchQuery: '' })}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: 'var(--muted)',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Row 2: Status Pills & HSK Level Selector */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
        }}
      >
        {/* Status Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <button
            type="button"
            onClick={() => onChange({ status: 'all' })}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: filters.status === 'all' ? '1.5px solid var(--primary)' : '1px solid var(--border)',
              backgroundColor: filters.status === 'all' ? 'var(--primary-light)' : 'var(--surface)',
              color: filters.status === 'all' ? 'var(--primary)' : 'var(--muted)',
              fontSize: 'var(--text-xs)',
              fontWeight: filters.status === 'all' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Tất cả ({counts.total})
          </button>

          <button
            type="button"
            onClick={() => onChange({ status: 'due' })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: filters.status === 'due' ? '1.5px solid var(--streak-border)' : '1px solid var(--border)',
              backgroundColor: filters.status === 'due' ? 'var(--streak-bg)' : 'var(--surface)',
              color: filters.status === 'due' ? 'var(--streak)' : 'var(--muted)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Flame size={14} />
            <span>Cần ôn hôm nay ({counts.dueToday})</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ status: 'learning' })}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: filters.status === 'learning' ? '1.5px solid var(--hsk2-border)' : '1px solid var(--border)',
              backgroundColor: filters.status === 'learning' ? 'var(--hsk2-bg)' : 'var(--surface)',
              color: filters.status === 'learning' ? 'var(--hsk2)' : 'var(--muted)',
              fontSize: 'var(--text-xs)',
              fontWeight: filters.status === 'learning' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Đang học ({counts.learning})
          </button>

          <button
            type="button"
            onClick={() => onChange({ status: 'mastered' })}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: filters.status === 'mastered' ? '1.5px solid var(--success-border)' : '1px solid var(--border)',
              backgroundColor: filters.status === 'mastered' ? 'var(--success-bg)' : 'var(--surface)',
              color: filters.status === 'mastered' ? 'var(--success)' : 'var(--muted)',
              fontSize: 'var(--text-xs)',
              fontWeight: filters.status === 'mastered' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Đã thuộc ({counts.mastered})
          </button>
        </div>

        {/* HSK Level Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 600 }}>
            Cấp độ:
          </span>
          <div style={{ display: 'flex', gap: '3px', backgroundColor: 'var(--surface)', padding: '2px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            {hskOptions.map((lvl) => {
              const isSelected = filters.hskLevel === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onChange({ hskLevel: lvl })}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--muted)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {lvl === 'all' ? 'Tất cả' : `HSK ${lvl}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
