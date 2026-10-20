import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type {
  CreateAdminGrammarDTO,
  AdminGrammarExample,
  GrammarCategory,
} from '../types/admin-content.types';

export interface AdminCreateGrammarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateAdminGrammarDTO) => void;
}

const CATEGORIES: GrammarCategory[] = [
  'cơ bản',
  'câu chữ',
  'trợ từ',
  'liên từ',
  'bổ ngữ',
  'phó từ',
];

export const AdminCreateGrammarModal: React.FC<AdminCreateGrammarModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [pinyinTitle, setPinyinTitle] = useState('');
  const [hskLevel, setHskLevel] = useState<number>(1);
  const [category, setCategory] = useState<GrammarCategory>('cơ bản');
  const [structureFormula, setStructureFormula] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<'Dễ' | 'Trung bình' | 'Khá'>('Dễ');
  const [examples, setExamples] = useState<AdminGrammarExample[]>([
    { zh: '', pinyin: '', meaningVi: '' },
  ]);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAddExample = () => {
    setExamples((prev) => [...prev, { zh: '', pinyin: '', meaningVi: '' }]);
  };

  const handleRemoveExample = (idx: number) => {
    if (examples.length <= 1) return;
    setExamples((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleExampleChange = (idx: number, field: keyof AdminGrammarExample, val: string) => {
    setExamples((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tên điểm ngữ pháp.');
      return;
    }
    if (!structureFormula.trim()) {
      setErrorMsg('Vui lòng nhập công thức cấu trúc.');
      return;
    }
    if (!explanation.trim()) {
      setErrorMsg('Vui lòng nhập giải thích ngữ nghĩa.');
      return;
    }

    const validExamples = examples.filter((ex) => ex.zh.trim());
    if (validExamples.length === 0) {
      setErrorMsg('Cần ít nhất 1 ví dụ câu tiếng Trung.');
      return;
    }

    // Default status: strictly DRAFT per requirement
    onSubmit({
      code: code.trim(),
      title: title.trim(),
      pinyinTitle: pinyinTitle.trim(),
      hskLevel,
      category,
      structureFormula: structureFormula.trim(),
      explanation: explanation.trim(),
      difficulty,
      status: 'DRAFT',
      examples: validExamples,
    });

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--background)',
          }}
        >
          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>
              Tạo mới Điểm ngữ pháp
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
              Nội dung tạo mới sẽ ở trạng thái Bản nháp (DRAFT) để kiểm duyệt trước khi xuất bản
            </span>
          </div>
          <button type="button" className="ds-btn ds-btn-ghost" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {errorMsg && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: 'var(--radius-sm)',
                color: '#991B1B',
                fontSize: 'var(--text-xs)',
              }}
            >
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Cấp độ HSK *
              </label>
              <select
                className="ds-input"
                value={hskLevel}
                onChange={(e) => setHskLevel(Number(e.target.value))}
                style={{ width: '100%', height: '36px' }}
              >
                {[1, 2, 3, 4, 5, 6].map((l) => (
                  <option key={l} value={l}>
                    HSK {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Mã định danh (tùy chọn)
              </label>
              <input
                type="text"
                className="ds-input"
                placeholder="e.g. HSK1_G04 (Tự sinh nếu trống)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{ width: '100%', height: '36px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Tên điểm ngữ pháp *
              </label>
              <input
                type="text"
                className="ds-input"
                placeholder="e.g. Cấu trúc câu hỏi với 吗"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', height: '36px' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Phiên âm Pinyin
              </label>
              <input
                type="text"
                className="ds-input"
                placeholder="e.g. ma zì jù"
                value={pinyinTitle}
                onChange={(e) => setPinyinTitle(e.target.value)}
                style={{ width: '100%', height: '36px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Danh mục *
              </label>
              <select
                className="ds-input"
                value={category}
                onChange={(e) => setCategory(e.target.value as GrammarCategory)}
                style={{ width: '100%', height: '36px' }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Độ khó
              </label>
              <select
                className="ds-input"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'Dễ' | 'Trung bình' | 'Khá')}
                style={{ width: '100%', height: '36px' }}
              >
                <option value="Dễ">Dễ</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Khá">Khá</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Công thức cấu trúc *
            </label>
            <input
              type="text"
              className="ds-input"
              placeholder="e.g. Câu trần thuật + 吗？"
              value={structureFormula}
              onChange={(e) => setStructureFormula(e.target.value)}
              style={{ width: '100%', height: '36px', fontFamily: 'monospace' }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Giải thích ngữ nghĩa tiếng Việt *
            </label>
            <textarea
              className="ds-input"
              rows={3}
              placeholder="Giải thích cách dùng, hoàn cảnh áp dụng và quy tắc biến điệu..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
              required
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600 }}>Ví dụ câu minh họa *</label>
              <button
                type="button"
                className="ds-btn ds-btn-secondary"
                onClick={handleAddExample}
                style={{ height: '26px', fontSize: '11px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={10} />
                <span>Thêm</span>
              </button>
            </div>

            {examples.map((ex, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px',
                  backgroundColor: 'var(--background)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  marginBottom: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: 'var(--muted)' }}>Ví dụ #{idx + 1}</span>
                  {examples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExample(idx)}
                      style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  className="ds-input"
                  placeholder="Chữ Hán: 你好吗？"
                  value={ex.zh}
                  onChange={(e) => handleExampleChange(idx, 'zh', e.target.value)}
                  style={{ width: '100%', height: '28px', fontSize: '11px' }}
                />
                <input
                  type="text"
                  className="ds-input"
                  placeholder="Pinyin: Nǐ hǎo ma?"
                  value={ex.pinyin}
                  onChange={(e) => handleExampleChange(idx, 'pinyin', e.target.value)}
                  style={{ width: '100%', height: '28px', fontSize: '11px' }}
                />
                <input
                  type="text"
                  className="ds-input"
                  placeholder="Nghĩa: Bạn khỏe không?"
                  value={ex.meaningVi}
                  onChange={(e) => handleExampleChange(idx, 'meaningVi', e.target.value)}
                  style={{ width: '100%', height: '28px', fontSize: '11px' }}
                />
              </div>
            ))}
          </div>

          <div
            style={{
              paddingTop: 'var(--space-3)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
            }}
          >
            <button type="button" className="ds-btn ds-btn-secondary" onClick={onClose} style={{ height: '34px' }}>
              Hủy
            </button>
            <button type="submit" className="ds-btn ds-btn-primary" style={{ height: '34px' }}>
              Tạo điểm ngữ pháp (Nháp)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
