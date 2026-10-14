import React, { useState, useEffect } from 'react';
import { X, Edit3, Save, Plus, Trash2 } from 'lucide-react';
import { ContentStatusBadge } from './ContentStatusBadge';
import type {
  ContentStatus,
  GrammarExample,
  GrammarPoint,
  HskLevel,
  UpdateGrammarDTO,
} from '../types';

export interface GrammarDetailDrawerProps {
  isOpen: boolean;
  grammar: GrammarPoint | null;
  levels: HskLevel[];
  onClose: () => void;
  onSave: (id: string, dto: UpdateGrammarDTO) => void;
}

export const GrammarDetailDrawer: React.FC<GrammarDetailDrawerProps> = ({
  isOpen,
  grammar,
  levels,
  onClose,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [structureFormula, setStructureFormula] = useState('');
  const [explanation, setExplanation] = useState('');
  const [hskLevelId, setHskLevelId] = useState('');
  const [status, setStatus] = useState<ContentStatus>('PUBLISHED');
  const [examples, setExamples] = useState<GrammarExample[]>([]);

  useEffect(() => {
    if (grammar) {
      setCode(grammar.code);
      setTitle(grammar.title);
      setStructureFormula(grammar.structureFormula);
      setExplanation(grammar.explanation);
      setHskLevelId(grammar.hskLevelId);
      setStatus(grammar.status);
      setExamples(grammar.examples.map((e) => ({ ...e })));
      setIsEditing(false);
    }
  }, [grammar]);

  if (!isOpen || !grammar) return null;

  const handleSave = () => {
    onSave(grammar.id, {
      code,
      title,
      structureFormula,
      explanation,
      hskLevelId,
      status,
      examples,
      commonMistake: grammar.commonMistake,
    });
    setIsEditing(false);
  };

  const handleAddExample = () => {
    setExamples([...examples, { zh: '', pinyin: '', meaningVi: '' }]);
  };

  const handleRemoveExample = (idx: number) => {
    setExamples(examples.filter((_, i) => i !== idx));
  };

  const handleExampleChange = (idx: number, field: keyof GrammarExample, val: string) => {
    setExamples(examples.map((e, i) => (i === idx ? { ...e, [field]: val } : e)));
  };

  const currentLevel = levels.find((l) => l.id === hskLevelId);

  return (
    <div className="lcm-drawer-overlay" onClick={onClose}>
      <div className="lcm-drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="lcm-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h3 className="lcm-drawer-title">
              {code}: {title}
            </h3>
            <ContentStatusBadge status={status} />
          </div>
          <button
            type="button"
            className="ds-btn ds-btn-ghost ds-btn-sm"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="lcm-drawer-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-3)' }}>
              <div className="lcm-form-group">
                <label className="lcm-form-label">Mã điểm ngữ pháp *</label>
                {isEditing ? (
                  <input
                    className="lcm-form-input"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                ) : (
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{code}</span>
                )}
              </div>

              <div className="lcm-form-group">
                <label className="lcm-form-label">Tiêu đề ngữ pháp *</label>
                {isEditing ? (
                  <input
                    className="lcm-form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                ) : (
                  <span style={{ fontWeight: 600 }}>{title}</span>
                )}
              </div>
            </div>

            <div className="lcm-form-group">
              <label className="lcm-form-label">Công thức cấu trúc (Formula) *</label>
              {isEditing ? (
                <input
                  className="lcm-form-input"
                  value={structureFormula}
                  onChange={(e) => setStructureFormula(e.target.value)}
                />
              ) : (
                <div style={{ padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
                  {structureFormula}
                </div>
              )}
            </div>

            <div className="lcm-form-group">
              <label className="lcm-form-label">Giải thích chi tiết</label>
              {isEditing ? (
                <textarea
                  className="lcm-form-input"
                  rows={3}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                />
              ) : (
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', lineHeight: 1.5, color: 'var(--foreground)' }}>
                  {explanation}
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="lcm-form-group">
                <label className="lcm-form-label">Cấp độ HSK</label>
                {isEditing ? (
                  <select
                    className="lcm-form-input"
                    value={hskLevelId}
                    onChange={(e) => setHskLevelId(e.target.value)}
                  >
                    {levels.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        {lvl.name} ({lvl.levelCode})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span><strong>{currentLevel?.name || 'HSK'}</strong></span>
                )}
              </div>

              <div className="lcm-form-group">
                <label className="lcm-form-label">Trạng thái xuất bản</label>
                {isEditing ? (
                  <select
                    className="lcm-form-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ContentStatus)}
                  >
                    <option value="DRAFT">Bản nháp</option>
                    <option value="PENDING_REVIEW">Chờ duyệt</option>
                    <option value="PUBLISHED">Đã xuất bản</option>
                    <option value="ARCHIVED">Lưu trữ</option>
                  </select>
                ) : (
                  <ContentStatusBadge status={status} />
                )}
              </div>
            </div>

            {/* Ví dụ mẫu */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>
                  Ví dụ minh họa ({examples.length})
                </h4>
                {isEditing && (
                  <button
                    type="button"
                    className="ds-btn ds-btn-ghost ds-btn-sm"
                    onClick={handleAddExample}
                    style={{ padding: '2px 8px', fontSize: '11px' }}
                  >
                    <Plus size={12} /> Thêm câu ví dụ
                  </button>
                )}
              </div>

              {examples.map((ex, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--background)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-1)',
                  }}
                >
                  {isEditing ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600 }}>Ví dụ #{idx + 1}</span>
                        <button
                          type="button"
                          className="ds-btn ds-btn-ghost ds-btn-sm"
                          onClick={() => handleRemoveExample(idx)}
                          style={{ padding: '2px 4px', color: '#dc2626' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <input
                        className="lcm-form-input"
                        placeholder="Chữ Hán: 他是我的老师。"
                        value={ex.zh}
                        onChange={(e) => handleExampleChange(idx, 'zh', e.target.value)}
                      />
                      <input
                        className="lcm-form-input"
                        placeholder="Pinyin: Tā shì wǒ de lǎoshī."
                        value={ex.pinyin}
                        onChange={(e) => handleExampleChange(idx, 'pinyin', e.target.value)}
                      />
                      <input
                        className="lcm-form-input"
                        placeholder="Nghĩa Việt: Thầy ấy là giáo viên của tôi."
                        value={ex.meaningVi}
                        onChange={(e) => handleExampleChange(idx, 'meaningVi', e.target.value)}
                      />
                    </>
                  ) : (
                    <div>
                      <p style={{ fontFamily: 'var(--font-hanzi)', fontWeight: 600, margin: '0 0 2px 0' }}>{ex.zh}</p>
                      <p style={{ color: 'var(--primary)', fontSize: '12px', margin: '0 0 2px 0' }}>{ex.pinyin}</p>
                      <p style={{ color: 'var(--muted)', fontSize: '12px', margin: 0 }}>{ex.meaningVi}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lcm-drawer-footer">
          {isEditing ? (
            <>
              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                onClick={() => setIsEditing(false)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                onClick={handleSave}
              >
                <Save size={14} /> Lưu thay đổi
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                onClick={onClose}
              >
                Đóng
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 size={14} /> Chỉnh sửa
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
