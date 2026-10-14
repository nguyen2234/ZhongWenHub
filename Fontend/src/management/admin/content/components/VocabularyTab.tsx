import React, { useState, useMemo } from 'react';
import { Search, Plus, Eye, Edit3 } from 'lucide-react';
import { ContentStatusBadge } from './ContentStatusBadge';
import type { ContentStatus, HskLevel, Vocabulary } from '../types';

export interface VocabularyTabProps {
  vocabularies: Vocabulary[];
  levels: HskLevel[];
  selectedLevelId: string;
  onSelectVocabulary: (vocab: Vocabulary) => void;
  onOpenCreate: () => void;
}

export const VocabularyTab: React.FC<VocabularyTabProps> = ({
  vocabularies,
  levels,
  selectedLevelId,
  onSelectVocabulary,
  onOpenCreate,
}) => {
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ContentStatus>('ALL');

  const filteredList = useMemo(() => {
    let result = vocabularies;

    if (selectedLevelId !== 'ALL') {
      result = result.filter((v) => v.hskLevelId === selectedLevelId);
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((v) => v.status === statusFilter);
    }

    if (posFilter !== 'ALL') {
      result = result.filter((v) => v.partOfSpeech.toLowerCase().includes(posFilter.toLowerCase()));
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.simplified.toLowerCase().includes(q) ||
          v.traditional.toLowerCase().includes(q) ||
          v.pinyin.toLowerCase().includes(q) ||
          v.meaningVi.toLowerCase().includes(q)
      );
    }

    return result;
  }, [vocabularies, selectedLevelId, statusFilter, posFilter, search]);

  const levelMap = useMemo(() => {
    const map = new Map<string, string>();
    levels.forEach((lvl) => map.set(lvl.id, lvl.name));
    return map;
  }, [levels]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Toolbar */}
      <div className="lcm-toolbar">
        <div className="lcm-toolbar-filters">
          <div style={{ position: 'relative' }} className="lcm-search-input">
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted)',
              }}
            />
            <input
              type="text"
              className="lcm-form-input"
              style={{ width: '100%', paddingLeft: '36px' }}
              placeholder="Tìm theo chữ Hán, Pinyin, nghĩa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="lcm-select-filter"
            value={posFilter}
            onChange={(e) => setPosFilter(e.target.value)}
          >
            <option value="ALL">Tất cả loại từ</option>
            <option value="Động từ">Động từ</option>
            <option value="Danh từ">Danh từ</option>
            <option value="Tính từ">Tính từ</option>
            <option value="Đại từ">Đại từ</option>
            <option value="Trợ từ">Trợ từ / Trợ động từ</option>
          </select>

          <select
            className="lcm-select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | ContentStatus)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PUBLISHED">Đã xuất bản</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="PENDING_REVIEW">Chờ duyệt</option>
            <option value="ARCHIVED">Lưu trữ</option>
          </select>
        </div>

        <button
          type="button"
          className="ds-btn ds-btn-primary ds-btn-sm"
          onClick={onOpenCreate}
        >
          <Plus size={14} /> Thêm từ vựng
        </button>
      </div>

      {/* Results Count */}
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
        Hiển thị <strong>{filteredList.length}</strong> từ vựng chuẩn
      </div>

      {/* Desktop Table View */}
      <div className="lcm-table-container">
        <table className="lcm-table">
          <thead>
            <tr>
              <th>Hán tự</th>
              <th>Pinyin</th>
              <th>Nghĩa Việt</th>
              <th>Loại từ</th>
              <th>Cấp HSK</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--muted)' }}>
                  Không tìm thấy từ vựng nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              filteredList.map((vocab) => (
                <tr
                  key={vocab.id}
                  className="lcm-row-clickable"
                  onClick={() => onSelectVocabulary(vocab)}
                >
                  <td className="lcm-hanzi-cell">{vocab.simplified}</td>
                  <td className="lcm-pinyin-cell">{vocab.pinyin}</td>
                  <td>{vocab.meaningVi}</td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{vocab.partOfSpeech}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--background)' }}>
                      {levelMap.get(vocab.hskLevelId) || 'HSK'}
                    </span>
                  </td>
                  <td>
                    <ContentStatusBadge status={vocab.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="ds-btn ds-btn-ghost ds-btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectVocabulary(vocab);
                      }}
                      title="Xem chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      className="ds-btn ds-btn-ghost ds-btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectVocabulary(vocab);
                      }}
                      title="Chỉnh sửa"
                    >
                      <Edit3 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List (shown on <= 767px) */}
      <div className="lcm-card-list">
        {filteredList.map((vocab) => (
          <div
            key={vocab.id}
            className="lcm-item-card"
            onClick={() => onSelectVocabulary(vocab)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                <span className="lcm-hanzi-cell">{vocab.simplified}</span>
                <span className="lcm-pinyin-cell">{vocab.pinyin}</span>
              </div>
              <ContentStatusBadge status={vocab.status} />
            </div>

            <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 500 }}>
              {vocab.meaningVi}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)' }}>
              <span>Loại từ: {vocab.partOfSpeech}</span>
              <span>{levelMap.get(vocab.hskLevelId)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
