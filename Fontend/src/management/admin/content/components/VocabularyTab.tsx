import React, { useState, useMemo } from 'react';
import { Search, Plus, Eye, Edit3, CheckSquare, Square, CheckCircle } from 'lucide-react';
import { ContentStatusBadge } from './ContentStatusBadge';
import type { ContentStatus, HskLevel, Vocabulary } from '../types';

export interface VocabularyTabProps {
  vocabularies: Vocabulary[];
  levels: HskLevel[];
  selectedLevelId: string;
  onSelectVocabulary: (vocab: Vocabulary, index?: number, list?: Vocabulary[]) => void;
  onOpenCreate: () => void;
  onBatchPublish?: (ids: string[]) => Promise<void>;
}

export const VocabularyTab: React.FC<VocabularyTabProps> = ({
  vocabularies,
  levels,
  selectedLevelId,
  onSelectVocabulary,
  onOpenCreate,
  onBatchPublish,
}) => {
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ContentStatus>('ALL');
  const [missingMeaningOnly, setMissingMeaningOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPublishingBatch, setIsPublishingBatch] = useState(false);

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

    if (missingMeaningOnly) {
      result = result.filter((v) => !v.meaningVi || v.meaningVi.trim() === '');
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
  }, [vocabularies, selectedLevelId, statusFilter, posFilter, missingMeaningOnly, search]);

  const levelMap = useMemo(() => {
    const map = new Map<string, string>();
    levels.forEach((lvl) => map.set(lvl.id, lvl.name));
    return map;
  }, [levels]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredList.length && filteredList.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredList.map((v) => v.id)));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  const selectedItems = useMemo(() => {
    return vocabularies.filter((v) => selectedIds.has(v.id));
  }, [vocabularies, selectedIds]);

  const eligibleForPublish = useMemo(() => {
    return selectedItems.filter((v) => v.meaningVi && v.meaningVi.trim() !== '');
  }, [selectedItems]);

  const missingMeaningCount = selectedItems.length - eligibleForPublish.length;

  const handleBatchPublishClick = async () => {
    if (eligibleForPublish.length === 0) {
      alert('Không có từ nào trong danh sách đã chọn có nghĩa tiếng Việt. Không thể xuất bản.');
      return;
    }

    let confirmMsg = `Bạn có chắc muốn xuất bản ${eligibleForPublish.length} từ đã chọn?`;
    if (missingMeaningCount > 0) {
      confirmMsg = `Có ${missingMeaningCount} từ chưa có nghĩa tiếng Việt và sẽ bị bỏ qua.\nBạn có chắc muốn xuất bản ${eligibleForPublish.length} từ hợp lệ?`;
    }

    if (!window.confirm(confirmMsg)) return;

    if (onBatchPublish) {
      try {
        setIsPublishingBatch(true);
        await onBatchPublish(eligibleForPublish.map((v) => v.id));
        setSelectedIds(new Set());
      } finally {
        setIsPublishingBatch(false);
      }
    }
  };

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

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              color: missingMeaningOnly ? '#b45309' : 'inherit',
              fontWeight: missingMeaningOnly ? 600 : 400,
            }}
          >
            <input
              type="checkbox"
              checked={missingMeaningOnly}
              onChange={(e) => setMissingMeaningOnly(e.target.checked)}
            />
            <span>Chưa có nghĩa tiếng Việt</span>
          </label>
        </div>

        <button
          type="button"
          className="ds-btn ds-btn-primary ds-btn-sm"
          onClick={onOpenCreate}
        >
          <Plus size={14} /> Thêm từ vựng
        </button>
      </div>

      {/* Batch Selection Banner */}
      {selectedIds.size > 0 && (
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1e40af' }}>
            <CheckSquare size={16} />
            <span>
              Đã chọn <strong>{selectedIds.size}</strong> từ
              {missingMeaningCount > 0 && (
                <span style={{ color: '#b45309', marginLeft: '6px', fontSize: '12px' }}>
                  ({missingMeaningCount} từ chưa có nghĩa tiếng Việt)
                </span>
              )}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="ds-btn ds-btn-sm"
              disabled={isPublishingBatch || eligibleForPublish.length === 0}
              style={{
                backgroundColor: eligibleForPublish.length > 0 ? '#16a34a' : '#9ca3af',
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                cursor: eligibleForPublish.length > 0 ? 'pointer' : 'not-allowed',
              }}
              onClick={handleBatchPublishClick}
            >
              <CheckCircle size={14} />
              <span>Xuất bản các từ đã chọn ({eligibleForPublish.length})</span>
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-outline ds-btn-sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Hủy chọn
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
        <div>
          Hiển thị <strong>{filteredList.length}</strong> từ vựng chuẩn
        </div>
        {filteredList.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={toggleSelectAll}>
            {selectedIds.size === filteredList.length && filteredList.length > 0 ? (
              <CheckSquare size={14} color="#2563eb" />
            ) : (
              <Square size={14} />
            )}
            <span>Chọn tất cả ({filteredList.length})</span>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="lcm-table-container">
        <table className="lcm-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={filteredList.length > 0 && selectedIds.size === filteredList.length}
                  onChange={toggleSelectAll}
                  aria-label="Chọn tất cả"
                />
              </th>
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
                <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--muted)' }}>
                  Không tìm thấy từ vựng nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              filteredList.map((vocab, index) => {
                const isSelected = selectedIds.has(vocab.id);
                return (
                  <tr
                    key={vocab.id}
                    className="lcm-row-clickable"
                    style={isSelected ? { backgroundColor: '#f0f7ff' } : undefined}
                    onClick={() => onSelectVocabulary(vocab, index, filteredList)}
                  >
                    <td style={{ textAlign: 'center' }} onClick={(e) => toggleSelect(vocab.id, e)}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        aria-label={`Chọn từ ${vocab.simplified}`}
                      />
                    </td>
                    <td className="lcm-hanzi-cell">{vocab.simplified}</td>
                    <td className="lcm-pinyin-cell">{vocab.pinyin}</td>
                    <td>
                      {vocab.meaningVi ? (
                        vocab.meaningVi
                      ) : (
                        <span style={{ color: '#d97706', fontStyle: 'italic', fontSize: '12px' }}>
                          Chưa có nghĩa (DRAFT)
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{vocab.partOfSpeech}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--background)',
                        }}
                      >
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
                          onSelectVocabulary(vocab, index, filteredList);
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
                          onSelectVocabulary(vocab, index, filteredList);
                        }}
                        title="Chỉnh sửa"
                      >
                        <Edit3 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List (shown on <= 767px) */}
      <div className="lcm-card-list">
        {filteredList.map((vocab, index) => {
          const isSelected = selectedIds.has(vocab.id);
          return (
            <div
              key={vocab.id}
              className="lcm-item-card"
              style={isSelected ? { borderColor: '#3b82f6', backgroundColor: '#f0f7ff' } : undefined}
              onClick={() => onSelectVocabulary(vocab, index, filteredList)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onClick={(e) => toggleSelect(vocab.id, e)}
                    onChange={() => {}}
                  />
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                    <span className="lcm-hanzi-cell">{vocab.simplified}</span>
                    <span className="lcm-pinyin-cell">{vocab.pinyin}</span>
                  </div>
                </div>
                <ContentStatusBadge status={vocab.status} />
              </div>

              <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                {vocab.meaningVi || (
                  <span style={{ color: '#d97706', fontStyle: 'italic', fontSize: '12px' }}>
                    Chưa có nghĩa (DRAFT)
                  </span>
                )}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)' }}>
                <span>Loại từ: {vocab.partOfSpeech}</span>
                <span>{levelMap.get(vocab.hskLevelId)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
