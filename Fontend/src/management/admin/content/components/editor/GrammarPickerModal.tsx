import React, { useState, useMemo } from 'react';
import { X, Search, Filter, Plus, Check } from 'lucide-react';
import { hskRepositoryService } from '../../services/hsk-repository.service';
import type { GrammarPoint } from '../../types';

interface GrammarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachedGrammarPointIds: string[];
  onSelectGrammars: (selectedGrammars: GrammarPoint[]) => void;
}

export const GrammarPickerModal: React.FC<GrammarPickerModalProps> = ({
  isOpen,
  onClose,
  attachedGrammarPointIds,
  onSelectGrammars,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const levels = useMemo(() => hskRepositoryService.getLevels(), []);
  const allGrammars = useMemo(() => hskRepositoryService.getGrammarPoints(), []);

  const filteredGrammars = useMemo(() => {
    return allGrammars.filter((g) => {
      if (selectedLevelId !== 'ALL' && g.hskLevelId !== selectedLevelId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = g.title.toLowerCase().includes(q);
        const matchFormula = g.structureFormula.toLowerCase().includes(q);
        const matchCode = g.code.toLowerCase().includes(q);
        const matchExplanation = g.explanation.toLowerCase().includes(q);
        if (!matchTitle && !matchFormula && !matchCode && !matchExplanation) {
          return false;
        }
      }
      return true;
    });
  }, [allGrammars, selectedLevelId, searchQuery]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    if (attachedGrammarPointIds.includes(id)) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const toAttach = allGrammars.filter((g) => selectedIds.includes(g.id));
    onSelectGrammars(toAttach);
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
        {/* Header */}
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
              Thêm Điểm Ngữ Pháp từ Kho Chuẩn
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Liên kết các cấu trúc ngữ pháp trọng tâm chuẩn hóa vào bài học.
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

        {/* Toolbar */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-6)',
            backgroundColor: 'var(--background)',
            borderBottom: '1px solid var(--border)',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
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
              placeholder="Tìm theo tên điểm ngữ pháp, cấu trúc (A + 是 + B) hoặc nội dung..."
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
              style={{ minWidth: '120px' }}
            >
              <option value="ALL">Mọi cấp độ</option>
              {levels.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grammar List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-4) var(--space-6)',
            maxHeight: '460px',
          }}
        >
          {filteredGrammars.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--muted)' }}>
              Không tìm thấy điểm ngữ pháp nào phù hợp.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {filteredGrammars.map((grammar) => {
                const isAttached = attachedGrammarPointIds.includes(grammar.id);
                const isSelected = selectedIds.includes(grammar.id);
                const lvl = levels.find((l) => l.id === grammar.hskLevelId);

                return (
                  <div
                    key={grammar.id}
                    onClick={() => !isAttached && handleToggleSelect(grammar.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
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
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={isSelected || isAttached}
                        disabled={isAttached}
                        onChange={() => {}}
                        style={{
                          width: '16px',
                          height: '16px',
                          marginTop: '4px',
                          cursor: isAttached ? 'not-allowed' : 'pointer',
                          accentColor: 'var(--primary)',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)' }}>
                            {grammar.code}
                          </span>
                          <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--foreground)' }}>
                            {grammar.title}
                          </strong>
                        </div>
                        <div
                          style={{
                            fontFamily: 'monospace',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--primary)',
                            fontWeight: 600,
                            margin: '3px 0',
                            backgroundColor: 'var(--background)',
                            display: 'inline-block',
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {grammar.structureFormula}
                        </div>
                        <p style={{ margin: '3px 0 0', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                          {grammar.explanation}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
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
                      {isAttached && (
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
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
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
            Đã chọn: <strong style={{ color: 'var(--foreground)' }}>{selectedIds.length}</strong> điểm ngữ pháp
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
