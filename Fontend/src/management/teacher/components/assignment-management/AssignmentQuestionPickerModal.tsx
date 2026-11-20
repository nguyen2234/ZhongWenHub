import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, CheckSquare, Square, Check, HelpCircle } from 'lucide-react';
import type { SharedExerciseItem } from '../../../../features/exercise-engine/types';
import { assignmentService } from '../../services';

interface AssignmentQuestionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  alreadySelectedIds: Array<string | number>;
  onConfirm: (selectedQuestions: SharedExerciseItem[]) => void;
  currentHskLevelId?: string;
}

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  'multiple-choice': 'Trắc nghiệm',
  'fill-blank': 'Điền vào chỗ trống',
  'sentence-order': 'Sắp xếp câu',
  'matching': 'Ghép nối thẻ',
  'listen-choice': 'Nghe và chọn',
  'chinese-to-vietnamese': 'Dịch Hán - Việt',
  'vietnamese-to-chinese': 'Dịch Việt - Hán',
  'pronunciation': 'Luyện phát âm',
  'speaking': 'Nói & Ghi âm',
  'hanzi-writing': 'Viết chữ Hán',
};

export const AssignmentQuestionPickerModal: React.FC<AssignmentQuestionPickerModalProps> = ({
  isOpen,
  onClose,
  alreadySelectedIds,
  onConfirm,
}) => {
  const [catalog, setCatalog] = useState<SharedExerciseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [hskFilter, setHskFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [previewItem, setPreviewItem] = useState<SharedExerciseItem | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);
    assignmentService
      .getQuestionCatalog()
      .then((items) => {
        if (!mounted) return;
        setCatalog(items);
        // Pre-select already picked questions
        setSelectedIds(new Set(alreadySelectedIds));
        if (items.length > 0) {
          setPreviewItem(items[0]);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, alreadySelectedIds]);

  // Filter catalog
  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      // Search keyword
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchPrompt = item.promptHanzi?.toLowerCase().includes(q) ?? false;
        const matchPinyin = item.promptPinyin?.toLowerCase().includes(q) ?? false;
        const matchMeaning = item.promptVietnamese?.toLowerCase().includes(q) ?? false;
        if (!matchTitle && !matchPrompt && !matchPinyin && !matchMeaning) return false;
      }

      // HSK Level filter
      if (hskFilter !== 'ALL') {
        const lvlNum = parseInt(hskFilter, 10);
        if (item.hskLevel !== lvlNum) return false;
      }

      // Type filter
      if (typeFilter !== 'ALL' && item.type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [catalog, search, hskFilter, typeFilter]);

  const toggleSelect = (id: string | number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAllFiltered = () => {
    const next = new Set(selectedIds);
    const allFilteredSelected = filteredCatalog.every((c) => next.has(c.id));
    if (allFilteredSelected) {
      filteredCatalog.forEach((c) => next.delete(c.id));
    } else {
      filteredCatalog.forEach((c) => next.add(c.id));
    }
    setSelectedIds(next);
  };

  const handleConfirm = () => {
    const picked = catalog.filter((c) => selectedIds.has(c.id));
    onConfirm(picked);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="tp-modal-backdrop" onClick={onClose}>
      <div
        className="tp-picker-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
      >
        {/* Header */}
        <div className="tp-drawer-header">
          <div>
            <h3 id="picker-title" className="tp-drawer-title">
              Ngân hàng câu hỏi (Shared Exercise Catalog)
            </h3>
            <p className="tp-drawer-subtitle">
              Chọn câu hỏi chuẩn hoá từ ngân hàng bài tập để đưa vào bài tập về nhà.
            </p>
          </div>
          <button
            type="button"
            className="ds-btn ds-btn-ghost"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar in Modal */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            backgroundColor: 'var(--background)',
          }}
        >
          {/* Search */}
          <div className="tp-search-box" style={{ flex: '1 1 200px' }}>
            <Search size={16} className="tp-search-icon" />
            <input
              type="text"
              className="tp-input tp-search-input"
              placeholder="Tìm theo tên câu hỏi, chữ Hán, Pinyin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* HSK Level filter */}
          <select
            className="tp-select"
            value={hskFilter}
            onChange={(e) => setHskFilter(e.target.value)}
            style={{ width: 'auto' }}
            aria-label="Lọc cấp HSK câu hỏi"
          >
            <option value="ALL">Mọi cấp HSK</option>
            <option value="1">HSK 1</option>
            <option value="2">HSK 2</option>
            <option value="3">HSK 3</option>
            <option value="4">HSK 4</option>
            <option value="7">HSK 7-9</option>
          </select>

          {/* Exercise Type filter */}
          <select
            className="tp-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ width: 'auto' }}
            aria-label="Lọc dạng bài tập"
          >
            <option value="ALL">Mọi dạng bài</option>
            {Object.entries(EXERCISE_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* Select All Toggle */}
          <button
            type="button"
            className="ds-btn ds-btn-secondary"
            onClick={handleSelectAllFiltered}
            style={{ fontSize: '12px' }}
          >
            <CheckSquare size={14} />
            <span>Chọn / Bỏ chọn lọc</span>
          </button>
        </div>

        {/* Split Body: Left List, Right Preview */}
        <div className="tp-picker-split">
          {/* Left Column: Question List */}
          <div className="tp-picker-list-pane">
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div className="tp-empty-state" style={{ minHeight: '200px' }}>
                  <div className="tp-loading-spinner" />
                  <p className="tp-empty-state-text" style={{ marginTop: '10px' }}>
                    Đang tải danh mục câu hỏi...
                  </p>
                </div>
              ) : filteredCatalog.length === 0 ? (
                <div className="tp-empty-state" style={{ minHeight: '200px' }}>
                  <p className="tp-empty-state-text">
                    Không tìm thấy câu hỏi phù hợp với điều kiện tìm kiếm.
                  </p>
                </div>
              ) : (
                filteredCatalog.map((item) => {
                  const isChecked = selectedIds.has(item.id);
                  const isActive = previewItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`tp-picker-item ${isActive ? 'tp-picker-item--active' : ''}`}
                      onClick={() => setPreviewItem(item)}
                    >
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          color: isChecked ? 'var(--primary)' : 'var(--muted-foreground)',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(item.id);
                        }}
                        aria-label={isChecked ? 'Bỏ chọn' : 'Chọn câu hỏi'}
                      >
                        {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '4px',
                            flexWrap: 'wrap',
                          }}
                        >
                          {item.hskLevel && (
                            <span
                              className="tp-badge"
                              style={{
                                fontSize: '10px',
                                backgroundColor: '#eef2ff',
                                color: '#4338ca',
                                fontWeight: 600,
                              }}
                            >
                              HSK {item.hskLevel}
                            </span>
                          )}
                          <span
                            className="tp-badge"
                            style={{
                              fontSize: '10px',
                              backgroundColor: '#f3f4f6',
                              color: '#4b5563',
                            }}
                          >
                            {EXERCISE_TYPE_LABELS[item.type] || item.type}
                          </span>
                          {item.difficulty && (
                            <span
                              style={{
                                fontSize: '10px',
                                color:
                                  item.difficulty === 'easy'
                                    ? '#059669'
                                    : item.difficulty === 'medium'
                                    ? '#d97706'
                                    : '#dc2626',
                                textTransform: 'capitalize',
                                fontWeight: 500,
                              }}
                            >
                              • {item.difficulty}
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: 'var(--text-sm)',
                            fontWeight: 500,
                            color: 'var(--foreground)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.title}
                        </div>

                        {item.promptHanzi && (
                          <div
                            style={{
                              fontSize: 'var(--text-xs)',
                              color: 'var(--muted-foreground)',
                              marginTop: '2px',
                            }}
                          >
                            {item.promptHanzi} {item.promptPinyin ? `(${item.promptPinyin})` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Live Preview */}
          <div className="tp-picker-preview-pane">
            {previewItem ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    className="tp-badge"
                    style={{
                      fontSize: '11px',
                      backgroundColor: '#eef2ff',
                      color: '#4338ca',
                      fontWeight: 600,
                    }}
                  >
                    HSK {previewItem.hskLevel ?? '—'}
                  </span>
                  <span
                    className="tp-badge"
                    style={{ fontSize: '11px', backgroundColor: '#f3f4f6', color: '#374151' }}
                  >
                    {EXERCISE_TYPE_LABELS[previewItem.type] || previewItem.type}
                  </span>
                </div>

                <h4 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600 }}>
                  {previewItem.title}
                </h4>

                {previewItem.instruction && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 'var(--text-xs)',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    {previewItem.instruction}
                  </p>
                )}

                {/* Question Prompts Box */}
                {(previewItem.promptHanzi || previewItem.promptVietnamese) && (
                  <div
                    style={{
                      padding: 'var(--space-3)',
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    {previewItem.promptHanzi && (
                      <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)' }}>
                        {previewItem.promptHanzi}
                      </div>
                    )}
                    {previewItem.promptPinyin && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', fontStyle: 'italic' }}>
                        {previewItem.promptPinyin}
                      </div>
                    )}
                    {previewItem.promptVietnamese && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                        Nghĩa: {previewItem.promptVietnamese}
                      </div>
                    )}
                  </div>
                )}

                {/* Options preview (if multiple choice) */}
                {previewItem.options && previewItem.options.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted-foreground)' }}>
                      Phương án lựa chọn:
                    </span>
                    {previewItem.options.map((opt, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '6px 10px',
                          fontSize: 'var(--text-xs)',
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        {String.fromCharCode(65 + i)}. {opt}
                      </div>
                    ))}
                  </div>
                )}

                {/* Matching Pairs (if matching) */}
                {previewItem.matchingPairs && previewItem.matchingPairs.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted-foreground)' }}>
                      Cặp thẻ ghép nối:
                    </span>
                    {previewItem.matchingPairs.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          fontSize: 'var(--text-xs)',
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{p.hanzi}</span>
                        <span style={{ color: 'var(--muted-foreground)' }}>{p.meaning}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sentence tokens (if sentence order) */}
                {previewItem.sentenceTokens && previewItem.sentenceTokens.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted-foreground)' }}>
                      Các từ cần sắp xếp:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {previewItem.sentenceTokens.map((t, idx) => (
                        <span
                          key={idx}
                          className="tp-badge"
                          style={{
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Snapshot Security Notice */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    padding: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    color: '#64748b',
                    marginTop: 'auto',
                  }}
                >
                  <HelpCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>
                    Khi phát hành bài tập, hệ thống sẽ tạo snapshot đóng băng câu hỏi này. Đáp án đúng được lưu an toàn trong hệ thống và không lộ ra ngoài.
                  </span>
                </div>
              </div>
            ) : (
              <div className="tp-empty-state" style={{ minHeight: '200px' }}>
                <p className="tp-empty-state-text">
                  Nhấp vào một câu hỏi ở danh sách bên trái để xem nội dung chi tiết.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="tp-drawer-footer">
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
            Đã chọn{' '}
            <strong style={{ color: 'var(--foreground)' }}>{selectedIds.size}</strong> câu hỏi
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="ds-btn ds-btn-secondary"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-primary"
              onClick={handleConfirm}
            >
              <Check size={16} />
              <span>Thêm {selectedIds.size} câu vào bài tập</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
