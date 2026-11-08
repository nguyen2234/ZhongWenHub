path = "Fontend/src/management/admin/content/components/GrammarTab.tsx"

new_code = '''import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Edit3, ExternalLink, CheckCircle, CheckSquare, Square } from 'lucide-react';
import { ContentStatusBadge } from './ContentStatusBadge';
import type { ContentStatus, GrammarPoint, HskLevel } from '../types';

export interface GrammarTabProps {
  grammarPoints: GrammarPoint[];
  levels: HskLevel[];
  selectedLevelId: string;
  onSelectGrammar: (grammar: GrammarPoint) => void;
  onBatchPublish?: (ids: string[]) => Promise<void>;
  onBatchReview?: (ids: string[], status: ContentStatus, notes?: string) => Promise<void>;
}

export const GrammarTab: React.FC<GrammarTabProps> = ({
  grammarPoints,
  levels,
  selectedLevelId,
  onSelectGrammar,
  onBatchPublish,
  onBatchReview,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ContentStatus>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const filteredList = useMemo(() => {
    let result = grammarPoints;

    if (selectedLevelId !== 'ALL') {
      result = result.filter((g) => g.hskLevelId === selectedLevelId);
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((g) => g.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (g) =>
          g.code.toLowerCase().includes(q) ||
          g.title.toLowerCase().includes(q) ||
          g.structureFormula.toLowerCase().includes(q) ||
          g.explanation.toLowerCase().includes(q)
      );
    }

    return result;
  }, [grammarPoints, selectedLevelId, statusFilter, search]);

  const levelMap = useMemo(() => {
    const map = new Map<string, string>();
    levels.forEach((lvl) => map.set(lvl.id, lvl.name));
    return map;
  }, [levels]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredList.length && filteredList.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredList.map((g) => g.id)));
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

  const handleBatchPublishClick = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Bạn có chắc muốn phê duyệt & xuất bản ${selectedIds.size} điểm ngữ pháp đã chọn?`)) return;

    if (onBatchPublish) {
      try {
        setIsBatchProcessing(true);
        await onBatchPublish(Array.from(selectedIds));
        setSelectedIds(new Set());
      } finally {
        setIsBatchProcessing(false);
      }
    }
  };

  const handleBatchReviewClick = async (targetStatus: ContentStatus) => {
    if (selectedIds.size === 0) return;
    const actionLabel = targetStatus === 'PENDING_REVIEW' ? 'Chờ duyệt' : 'Bản nháp (DRAFT)';
    const notes = window.prompt(`Nhập ghi chú kiểm duyệt cho ${selectedIds.size} điểm ngữ pháp chuyển sang ${actionLabel}:`, '') || undefined;

    if (onBatchReview) {
      try {
        setIsBatchProcessing(true);
        await onBatchReview(Array.from(selectedIds), targetStatus, notes);
        setSelectedIds(new Set());
      } finally {
        setIsBatchProcessing(false);
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
              placeholder="Tìm theo mã cấu trúc, tiêu đề..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="lcm-select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | ContentStatus)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING_REVIEW">Chờ duyệt (PENDING_REVIEW)</option>
            <option value="PUBLISHED">Đã xuất bản (PUBLISHED)</option>
            <option value="DRAFT">Bản nháp (DRAFT)</option>
            <option value="ARCHIVED">Lưu trữ (ARCHIVED)</option>
          </select>
        </div>

        <button
          type="button"
          className="ds-btn ds-btn-secondary"
          onClick={() => {
            const hskParam = selectedLevelId === 'ALL' ? '' : `?hsk=${selectedLevelId.replace('level-hsk-', '')}`;
            navigate(`/management/admin/grammar${hskParam}`);
          }}
          style={{
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: 'var(--text-xs)',
            flexShrink: 0,
          }}
          title="Mở Bảng Quản lý Ngữ pháp chuyên biệt (HSK 1 - 6)"
        >
          <ExternalLink size={14} color="var(--primary)" />
          <span>Mở Quản lý Ngữ pháp (HSK 1 - 6)</span>
        </button>
      </div>

      {/* Batch Actions Bar */}
      {selectedIds.size > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#166534' }}>
              Đã chọn {selectedIds.size} điểm ngữ pháp
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="ds-btn ds-btn-sm"
              disabled={isBatchProcessing}
              style={{
                backgroundColor: '#16a34a',
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                cursor: 'pointer',
              }}
              onClick={handleBatchPublishClick}
            >
              <CheckCircle size={14} />
              <span>Phê duyệt & Xuất bản ({selectedIds.size})</span>
            </button>

            <button
              type="button"
              className="ds-btn ds-btn-sm"
              disabled={isBatchProcessing}
              style={{
                backgroundColor: '#d97706',
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                cursor: 'pointer',
              }}
              onClick={() => handleBatchReviewClick('PENDING_REVIEW')}
            >
              <span>Chuyển Chờ duyệt ({selectedIds.size})</span>
            </button>

            <button
              type="button"
              className="ds-btn ds-btn-sm ds-btn-outline"
              disabled={isBatchProcessing}
              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
              onClick={() => handleBatchReviewClick('DRAFT')}
            >
              <span>Trả về Nháp ({selectedIds.size})</span>
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

      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
        Hiển thị <strong>{filteredList.length}</strong> điểm ngữ pháp chuẩn
      </div>

      {/* Desktop Table View */}
      <div className="lcm-table-container">
        <table className="lcm-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <span
                  onClick={toggleSelectAll}
                  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                  title="Chọn tất cả"
                >
                  {selectedIds.size > 0 && selectedIds.size === filteredList.length ? (
                    <CheckSquare size={16} color="var(--primary)" />
                  ) : (
                    <Square size={16} color="var(--muted)" />
                  )}
                </span>
              </th>
              <th>Mã</th>
              <th>Tiêu đề ngữ pháp</th>
              <th>Công thức cấu trúc</th>
              <th>Cấp HSK</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--muted)' }}>
                  Không tìm thấy điểm ngữ pháp nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              filteredList.map((g) => (
                <tr
                  key={g.id}
                  className="lcm-row-clickable"
                  onClick={() => onSelectGrammar(g)}
                  style={{ backgroundColor: selectedIds.has(g.id) ? '#f8fafc' : undefined }}
                >
                  <td style={{ textAlign: 'center' }} onClick={(e) => toggleSelect(g.id, e)}>
                    {selectedIds.has(g.id) ? (
                      <CheckSquare size={16} color="var(--primary)" />
                    ) : (
                      <Square size={16} color="var(--muted)" />
                    )}
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px' }}>
                      {g.code}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <strong>{g.title}</strong>
                      {g.reviewedAt && (
                        <span style={{ fontSize: '11px', color: '#16a34a' }}>
                          ✓ Đã duyệt: {new Date(g.reviewedAt).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)', backgroundColor: 'var(--background)', padding: '2px 6px', borderRadius: '4px' }}>
                      {g.structureFormula}
                    </code>
                  </td>
                  <td>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--background)' }}>
                      {levelMap.get(g.hskLevelId) || 'HSK'}
                    </span>
                  </td>
                  <td>
                    <ContentStatusBadge status={g.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="ds-btn ds-btn-ghost ds-btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectGrammar(g);
                      }}
                      title="Xem chi tiết & Kiểm duyệt"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      className="ds-btn ds-btn-ghost ds-btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectGrammar(g);
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

      {/* Mobile Card List */}
      <div className="lcm-card-list">
        {filteredList.map((g) => (
          <div
            key={g.id}
            className="lcm-item-card"
            onClick={() => onSelectGrammar(g)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px', color: 'var(--primary)' }}>
                {g.code}
              </span>
              <ContentStatusBadge status={g.status} />
            </div>

            <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              {g.title}
            </p>

            <div style={{ padding: '4px 8px', backgroundColor: 'var(--background)', borderRadius: '4px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              {g.structureFormula}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '11px', color: 'var(--muted)' }}>
              <span>{levelMap.get(g.hskLevelId)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
'''

with open(path, "w", encoding="utf-8") as f:
    f.write(new_code)

print("[SUCCESS] GrammarTab.tsx updated with multi-selection & batch review!")
