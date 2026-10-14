import React, { useState, useMemo } from 'react';
import { Search, Eye, Edit3 } from 'lucide-react';
import { ContentStatusBadge } from './ContentStatusBadge';
import type { ChineseCharacter, ContentStatus, HskLevel } from '../types';

export interface CharacterTabProps {
  characters: ChineseCharacter[];
  levels: HskLevel[];
  selectedLevelId: string;
  onSelectCharacter: (char: ChineseCharacter) => void;
}

export const CharacterTab: React.FC<CharacterTabProps> = ({
  characters,
  levels,
  selectedLevelId,
  onSelectCharacter,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ContentStatus>('ALL');

  const filteredList = useMemo(() => {
    let result = characters;

    if (selectedLevelId !== 'ALL') {
      result = result.filter((c) => c.hskLevelId === selectedLevelId);
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.character.includes(q) ||
          c.pinyin.toLowerCase().includes(q) ||
          c.sinoVietnamese.toLowerCase().includes(q) ||
          c.meaningVi.toLowerCase().includes(q)
      );
    }

    return result;
  }, [characters, selectedLevelId, statusFilter, search]);

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
              placeholder="Tìm chữ Hán, Pinyin, âm Hán Việt..."
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
            <option value="PENDING_REVIEW">Chờ duyệt</option>
            <option value="ARCHIVED">Lưu trữ</option>
          </select>
        </div>
      </div>

      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
        Hiển thị <strong>{filteredList.length}</strong> chữ Hán chuẩn
      </div>

      {/* Desktop Table View */}
      <div className="lcm-table-container">
        <table className="lcm-table">
          <thead>
            <tr>
              <th>Chữ Hán</th>
              <th>Pinyin</th>
              <th>Hán Việt</th>
              <th>Nghĩa giải thích</th>
              <th>Bộ thủ</th>
              <th>Số nét</th>
              <th>Cấp HSK</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--muted)' }}>
                  Không tìm thấy chữ Hán nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              filteredList.map((char) => (
                <tr
                  key={char.id}
                  className="lcm-row-clickable"
                  onClick={() => onSelectCharacter(char)}
                >
                  <td className="lcm-hanzi-cell">{char.character}</td>
                  <td className="lcm-pinyin-cell">{char.pinyin}</td>
                  <td><strong>{char.sinoVietnamese}</strong></td>
                  <td>{char.meaningVi}</td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{char.radical}</span>
                  </td>
                  <td>{char.strokeCount} nét</td>
                  <td>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--background)' }}>
                      {levelMap.get(char.hskLevelId) || 'HSK'}
                    </span>
                  </td>
                  <td>
                    <ContentStatusBadge status={char.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="ds-btn ds-btn-ghost ds-btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCharacter(char);
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
                        onSelectCharacter(char);
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
        {filteredList.map((char) => (
          <div
            key={char.id}
            className="lcm-item-card"
            onClick={() => onSelectCharacter(char)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
                <span className="lcm-hanzi-cell" style={{ fontSize: '1.4rem' }}>{char.character}</span>
                <span className="lcm-pinyin-cell">{char.pinyin}</span>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>({char.sinoVietnamese})</span>
              </div>
              <ContentStatusBadge status={char.status} />
            </div>

            <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
              {char.meaningVi}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)' }}>
              <span>Bộ: {char.radical} · {char.strokeCount} nét</span>
              <span>{levelMap.get(char.hskLevelId)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
