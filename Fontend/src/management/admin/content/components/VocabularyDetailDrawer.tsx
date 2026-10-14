import React, { useState, useEffect } from 'react';
import { X, Edit3, Save, Plus, Trash2 } from 'lucide-react';
import { ContentStatusBadge } from './ContentStatusBadge';
import type {
  ContentStatus,
  HskLevel,
  UpdateVocabularyDTO,
  Vocabulary,
  VocabularyExample,
} from '../types';

export interface VocabularyDetailDrawerProps {
  isOpen: boolean;
  vocabulary: Vocabulary | null;
  levels: HskLevel[];
  onClose: () => void;
  onSave: (id: string, dto: UpdateVocabularyDTO) => void;
}

export const VocabularyDetailDrawer: React.FC<VocabularyDetailDrawerProps> = ({
  isOpen,
  vocabulary,
  levels,
  onClose,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [simplified, setSimplified] = useState('');
  const [traditional, setTraditional] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [meaningVi, setMeaningVi] = useState('');
  const [meaningEn, setMeaningEn] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [hskLevelId, setHskLevelId] = useState('');
  const [status, setStatus] = useState<ContentStatus>('PUBLISHED');
  const [examples, setExamples] = useState<VocabularyExample[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (vocabulary) {
      setSimplified(vocabulary.simplified);
      setTraditional(vocabulary.traditional);
      setPinyin(vocabulary.pinyin);
      setMeaningVi(vocabulary.meaningVi);
      setMeaningEn(vocabulary.meaningEn);
      setPartOfSpeech(vocabulary.partOfSpeech);
      setAudioUrl(vocabulary.audioUrl || '');
      setHskLevelId(vocabulary.hskLevelId);
      setStatus(vocabulary.status);
      setExamples(vocabulary.examples.map((e) => ({ ...e })));
      setIsEditing(false);
      setErrors({});
    }
  }, [vocabulary]);

  if (!isOpen || !vocabulary) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!simplified.trim()) errs.simplified = 'Hán tự không được để trống';
    if (!pinyin.trim()) errs.pinyin = 'Pinyin không được để trống';
    if (!meaningVi.trim()) errs.meaningVi = 'Nghĩa tiếng Việt không được để trống';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(vocabulary.id, {
      hskLevelId,
      simplified,
      traditional: traditional || simplified,
      pinyin,
      meaningVi,
      meaningEn,
      partOfSpeech,
      audioUrl: audioUrl || undefined,
      examples,
      status,
    });
    setIsEditing(false);
  };

  const handleAddExample = () => {
    setExamples([
      ...examples,
      {
        id: `ex-temp-${Date.now()}`,
        zh: '',
        pinyin: '',
        meaningVi: '',
        displayOrder: examples.length + 1,
      },
    ]);
  };

  const handleRemoveExample = (index: number) => {
    setExamples(examples.filter((_, i) => i !== index));
  };

  const handleExampleChange = (index: number, field: keyof VocabularyExample, value: string) => {
    setExamples(
      examples.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    );
  };

  const currentLevel = levels.find((l) => l.id === hskLevelId);

  return (
    <div className="lcm-drawer-overlay" onClick={onClose}>
      <div className="lcm-drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="lcm-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h3 className="lcm-drawer-title">
              {simplified} <span style={{ fontSize: 'var(--text-sm)', color: 'var(--primary)', fontWeight: 500 }}>({pinyin})</span>
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
          {/* Section: Thông tin cơ bản */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>
              1. Thông tin từ vựng
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="lcm-form-group">
                <label className="lcm-form-label">Hán tự giản thể *</label>
                {isEditing ? (
                  <>
                    <input
                      className="lcm-form-input"
                      value={simplified}
                      onChange={(e) => setSimplified(e.target.value)}
                    />
                    {errors.simplified && <span style={{ color: '#dc2626', fontSize: '11px' }}>{errors.simplified}</span>}
                  </>
                ) : (
                  <span style={{ fontFamily: 'var(--font-hanzi)', fontSize: '1.25rem', fontWeight: 700 }}>{simplified}</span>
                )}
              </div>

              <div className="lcm-form-group">
                <label className="lcm-form-label">Hán tự phồn thể</label>
                {isEditing ? (
                  <input
                    className="lcm-form-input"
                    value={traditional}
                    onChange={(e) => setTraditional(e.target.value)}
                  />
                ) : (
                  <span style={{ fontFamily: 'var(--font-hanzi)', fontSize: '1.25rem' }}>{traditional || simplified}</span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="lcm-form-group">
                <label className="lcm-form-label">Phiên âm Pinyin *</label>
                {isEditing ? (
                  <>
                    <input
                      className="lcm-form-input"
                      value={pinyin}
                      onChange={(e) => setPinyin(e.target.value)}
                    />
                    {errors.pinyin && <span style={{ color: '#dc2626', fontSize: '11px' }}>{errors.pinyin}</span>}
                  </>
                ) : (
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{pinyin}</span>
                )}
              </div>

              <div className="lcm-form-group">
                <label className="lcm-form-label">Từ loại</label>
                {isEditing ? (
                  <input
                    className="lcm-form-input"
                    value={partOfSpeech}
                    onChange={(e) => setPartOfSpeech(e.target.value)}
                    placeholder="e.g. Động từ, Danh từ..."
                  />
                ) : (
                  <span>{partOfSpeech || 'Chưa phân loại'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Section: Giải nghĩa */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>
              2. Giải nghĩa
            </h4>

            <div className="lcm-form-group">
              <label className="lcm-form-label">Nghĩa tiếng Việt *</label>
              {isEditing ? (
                <>
                  <input
                    className="lcm-form-input"
                    value={meaningVi}
                    onChange={(e) => setMeaningVi(e.target.value)}
                  />
                  {errors.meaningVi && <span style={{ color: '#dc2626', fontSize: '11px' }}>{errors.meaningVi}</span>}
                </>
              ) : (
                <span style={{ fontWeight: 600 }}>{meaningVi}</span>
              )}
            </div>

            <div className="lcm-form-group">
              <label className="lcm-form-label">Nghĩa tiếng Anh</label>
              {isEditing ? (
                <input
                  className="lcm-form-input"
                  value={meaningEn}
                  onChange={(e) => setMeaningEn(e.target.value)}
                />
              ) : (
                <span style={{ color: 'var(--muted)' }}>{meaningEn || 'None'}</span>
              )}
            </div>
          </div>

          {/* Section: Cấp độ HSK & Trạng thái */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>
              3. Cấp độ HSK & Trạng thái
            </h4>

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
          </div>

          {/* Section: Ví dụ minh họa (Relational Examples) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>
                4. Ví dụ minh họa ({examples.length})
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

            {examples.length === 0 ? (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
                Chưa có câu ví dụ nào.
              </p>
            ) : (
              examples.map((ex, idx) => (
                <div
                  key={ex.id || idx}
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--background)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  {isEditing ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                        placeholder="Chữ Hán: 我想喝茶。"
                        value={ex.zh}
                        onChange={(e) => handleExampleChange(idx, 'zh', e.target.value)}
                      />
                      <input
                        className="lcm-form-input"
                        placeholder="Pinyin: Wǒ xiǎng hē chá."
                        value={ex.pinyin}
                        onChange={(e) => handleExampleChange(idx, 'pinyin', e.target.value)}
                      />
                      <input
                        className="lcm-form-input"
                        placeholder="Dịch nghĩa: Tôi muốn uống trà."
                        value={ex.meaningVi}
                        onChange={(e) => handleExampleChange(idx, 'meaningVi', e.target.value)}
                      />
                    </>
                  ) : (
                    <div>
                      <p style={{ fontFamily: 'var(--font-hanzi)', fontWeight: 600, margin: '0 0 2px 0', fontSize: 'var(--text-sm)' }}>{ex.zh}</p>
                      <p style={{ color: 'var(--primary)', fontSize: '12px', margin: '0 0 2px 0' }}>{ex.pinyin}</p>
                      <p style={{ color: 'var(--muted)', fontSize: '12px', margin: 0 }}>{ex.meaningVi}</p>
                    </div>
                  )}
                </div>
              ))
            )}
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
