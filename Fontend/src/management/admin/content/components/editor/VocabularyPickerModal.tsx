import React, { useState, useMemo } from 'react';
import { X, Search, Filter, Plus, Check } from 'lucide-react';
import { hskRepositoryService } from '../../services/hsk-repository.service';
import type { Vocabulary } from '../../types';

interface VocabularyPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachedVocabularyIds: string[];
  onSelectVocabularies: (selectedVocabs: Vocabulary[]) => void;
}

export const VocabularyPickerModal: React.FC<VocabularyPickerModalProps> = ({
  isOpen,
  onClose,
  attachedVocabularyIds,
  onSelectVocabularies,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState<string>('ALL');
  const [selectedPos, setSelectedPos] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const levels = useMemo(() => hskRepositoryService.getLevels(), []);
  const allVocabularies = useMemo(() => hskRepositoryService.getVocabularies(), []);

  // Filter vocabulary list
  const filteredVocabularies = useMemo(() => {
    return allVocabularies.filter((v) => {
      if (selectedLevelId !== 'ALL' && v.hskLevelId !== selectedLevelId) {
        return false;
      }
      if (selectedPos !== 'ALL' && v.partOfSpeech !== selectedPos) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSimplified = v.simplified.toLowerCase().includes(q);
        const matchPinyin = v.pinyin.toLowerCase().includes(q);
        const matchMeaning = v.meaningVi.toLowerCase().includes(q);
        if (!matchSimplified && !matchPinyin && !matchMeaning) {
          return false;
        }
      }
      return true;
    });
  }, [allVocabularies, selectedLevelId, selectedPos, searchQuery]);

  // Unique parts of speech for filter
  const partsOfSpeech = useMemo(() => {
    const set = new Set<string>();
    allVocabularies.forEach((v) => {
      if (v.partOfSpeech) set.add(v.partOfSpeech);
    });
    return Array.from(set);
  }, [allVocabularies]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    if (attachedVocabularyIds.includes(id)) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const toAttach = allVocabularies.filter((v) => selectedIds.includes(v.id));
    onSelectVocabularies(toAttach);
    setSelectedIds([]);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(3px)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.18)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-6)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--foreground)' }}>
              Thêm từ vựng từ Kho HSK Chuẩn
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Chọn từ vựng chuẩn hóa để liên kết vào bài học. Không nhân bản dữ liệu kho gốc.
            </p>
          </div>
          <button
            type="button"
            className="ds-btn ds-btn-ghost ds-btn-sm"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-6)',
            backgroundColor: 'var(--background)',
            borderBottom: '1px solid var(--border)',
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            gap: 'var(--space-3)',
            alignItems: 'center',
          }}
        >
          <div style={{ position: 'relative' }}>
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
              placeholder="Tìm theo chữ Hán, Pinyin hoặc nghĩa tiếng Việt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Filter size={15} style={{ color: 'var(--muted)' }} />
            <select
              className="lcm-form-select"
              value={selectedLevelId}
              onChange={(e) => setSelectedLevelId(e.target.value)}
              style={{ minWidth: '110px' }}
            >
              <option value="ALL">Mọi cấp độ</option>
              {levels.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.name}
                </option>
              ))}
            </select>
          </div>

          <select
            className="lcm-form-select"
            value={selectedPos}
            onChange={(e) => setSelectedPos(e.target.value)}
            style={{ minWidth: '120px' }}
          >
            <option value="ALL">Mọi từ loại</option>
            {partsOfSpeech.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        {/* Vocabulary Items List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-4) var(--space-6)',
            maxHeight: '460px',
          }}
        >
          {filteredVocabularies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--muted)' }}>
              Không tìm thấy từ vựng nào phù hợp với bộ lọc.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {filteredVocabularies.map((vocab) => {
                const isAttached = attachedVocabularyIds.includes(vocab.id);
                const isSelected = selectedIds.includes(vocab.id);
                const lvl = levels.find((l) => l.id === vocab.hskLevelId);

                return (
                  <div
                    key={vocab.id}
                    onClick={() => !isAttached && handleToggleSelect(vocab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-lg)',
                      border: `1.5px solid ${
                        isAttached
                          ? 'var(--border)'
                          : isSelected
                          ? 'var(--primary)'
                          : 'var(--border)'
                      }`,
                      backgroundColor: isAttached
                        ? 'var(--surface-sunken, #f8fafc)'
                        : isSelected
                        ? 'var(--primary-light)'
                        : 'var(--surface)',
                      cursor: isAttached ? 'not-allowed' : 'pointer',
                      opacity: isAttached ? 0.65 : 1,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <input
                        type="checkbox"
                        checked={isSelected || isAttached}
                        disabled={isAttached}
                        onChange={() => {}}
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: isAttached ? 'not-allowed' : 'pointer',
                          accentColor: 'var(--primary)',
                        }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-hanzi)',
                              fontSize: 'var(--text-xl)',
                              fontWeight: 700,
                              color: 'var(--foreground)',
                            }}
                          >
                            {vocab.simplified}
                          </span>
                          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--primary)', fontWeight: 600 }}>
                            {vocab.pinyin}
                          </span>
                          {vocab.partOfSpeech && (
                            <span
                              style={{
                                fontSize: 'var(--text-2xs)',
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'var(--background)',
                                border: '1px solid var(--border)',
                                color: 'var(--muted)',
                              }}
                            >
                              {vocab.partOfSpeech}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '2px' }}>
                          {vocab.meaningVi}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      {lvl && (
                        <span
                          style={{
                            fontSize: 'var(--text-xs)',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--background)',
                            border: '1px solid var(--border)',
                            color: lvl.colorToken || 'var(--foreground)',
                          }}
                        >
                          {lvl.name}
                        </span>
                      )}
                      {isAttached ? (
                        <span
                          style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Check size={14} /> Đã có trong bài
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-6)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--background)',
          }}
        >
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
            Đã chọn: <strong style={{ color: 'var(--foreground)' }}>{selectedIds.length}</strong> từ vựng
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button type="button" className="ds-btn ds-btn-outline ds-btn-sm" onClick={onClose}>
              Hủy bỏ
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-primary ds-btn-sm"
              disabled={selectedIds.length === 0}
              onClick={handleConfirm}
            >
              <Plus size={15} /> Thêm vào bài học ({selectedIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
