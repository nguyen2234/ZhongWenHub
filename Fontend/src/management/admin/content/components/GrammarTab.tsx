import React, { useState, useMemo } from 'react';
import { Search, Eye, Edit3 } from 'lucide-react';
import { ContentStatusBadge } from './ContentStatusBadge';
import type { ContentStatus, GrammarPoint, HskLevel } from '../types';

export interface GrammarTabProps {
  grammarPoints: GrammarPoint[];
  levels: HskLevel[];
  selectedLevelId: string;
  onSelectGrammar: (grammar: GrammarPoint) => void;
}

export const GrammarTab: React.FC<GrammarTabProps> = ({
  grammarPoints,
  levels,
  selectedLevelId,
  onSelectGrammar,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ContentStatus>('ALL');

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
            <option value="PUBLISHED">Đã xuất bản</option>
            <option value="DRAFT">Bản nháp</option>
          </select>
        </div>
      </div>

      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
        Hiển thị <strong>{filteredList.length}</strong> điểm ngữ pháp chuẩn
      </div>

      {/* Desktop Table View */}
      <div className="lcm-table-container">
        <table className="lcm-table">
          <thead>
            <tr>
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
                <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--muted)' }}>
                  Không tìm thấy điểm ngữ pháp nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              filteredList.map((g) => (
                <tr
                  key={g.id}
                  className="lcm-row-clickable"
                  onClick={() => onSelectGrammar(g)}
                >
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px' }}>
                      {g.code}
                    </span>
                  </td>
                  <td><strong>{g.title}</strong></td>
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
                      title="Xem chi tiết"
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
