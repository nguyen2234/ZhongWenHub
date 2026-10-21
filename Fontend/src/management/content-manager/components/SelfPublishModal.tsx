import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, BookOpen, AlertCircle } from 'lucide-react';
import type { ModerationContentType } from '../types/content-manager.types';

export interface SelfPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (payload: {
    contentId: string;
    contentType: ModerationContentType;
    title: string;
    hskLevel: number;
    previewData: {
      title: string;
      hanzi?: string;
      pinyin?: string;
      meaning?: string;
      structure?: string;
      explanation?: string;
    };
    changesSummary: string;
  }) => void;
}

export const SelfPublishModal: React.FC<SelfPublishModalProps> = ({
  isOpen,
  onClose,
  onPublish,
}) => {
  const [contentType, setContentType] = useState<ModerationContentType>('GRAMMAR_POINT');
  const [hskLevel, setHskLevel] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [contentId, setContentId] = useState('');
  const [hanzi, setHanzi] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [meaning, setMeaning] = useState('');
  const [structure, setStructure] = useState('');
  const [summary, setSummary] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContentId('');
      setHanzi('');
      setPinyin('');
      setMeaning('');
      setStructure('');
      setSummary('');
      setErrorMsg('');
    }
  }, [isOpen]);

  // Handle ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề học liệu.');
      return;
    }
    if (!contentId.trim()) {
      setErrorMsg('Vui lòng nhập mã định danh duy nhất (Content ID).');
      return;
    }
    if (!summary.trim()) {
      setErrorMsg('Vui lòng nhập tóm tắt mục tiêu xuất bản.');
      return;
    }

    onPublish({
      contentId: contentId.trim(),
      contentType,
      title: title.trim(),
      hskLevel,
      changesSummary: summary.trim(),
      previewData: {
        title: title.trim(),
        hanzi: hanzi.trim() || undefined,
        pinyin: pinyin.trim() || undefined,
        meaning: meaning.trim() || undefined,
        structure: structure.trim() || undefined,
      },
    });

    onClose();
  };

  return (
    <div
      className="cm-drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Tự xuất bản học liệu mới"
      style={{ alignItems: 'center', justifyContent: 'center', padding: '16px' }}
    >
      <div
        className="cm-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: 0,
        }}
      >
        {/* Header */}
        <div className="cm-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary-light, #FFF0F1)',
                color: 'var(--primary, #E60012)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--foreground)' }}>
                Tự xuất bản học liệu mới
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Quyền hạn Content Manager: Trực tiếp phát hành không cần Admin duyệt
              </span>
            </div>
          </div>
          <button
            type="button"
            className="cm-btn cm-btn-secondary cm-btn-sm"
            onClick={onClose}
            aria-label="Đóng biểu mẫu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {errorMsg && (
            <div style={{ padding: '8px 12px', backgroundColor: '#fff1f2', borderRadius: '8px', color: '#be123c', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={15} />
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                Loại học liệu <span style={{ color: '#E60012' }}>*</span>
              </label>
              <select
                className="cm-select"
                style={{ width: '100%' }}
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ModerationContentType)}
              >
                <option value="GRAMMAR_POINT">Điểm ngữ pháp</option>
                <option value="HSK_CHARACTER">Chữ Hán & Từ vựng</option>
                <option value="CURRICULUM_LESSON">Bài học giáo trình</option>
                <option value="EXERCISE_QUESTION">Câu hỏi ngân hàng đề</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                Cấp độ HSK <span style={{ color: '#E60012' }}>*</span>
              </label>
              <select
                className="cm-select"
                style={{ width: '100%' }}
                value={hskLevel}
                onChange={(e) => setHskLevel(Number(e.target.value))}
              >
                <option value={1}>HSK 1</option>
                <option value={2}>HSK 2</option>
                <option value={3}>HSK 3</option>
                <option value={4}>HSK 4</option>
                <option value={5}>HSK 5</option>
                <option value={6}>HSK 6</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
              Tiêu đề học liệu <span style={{ color: '#E60012' }}>*</span>
            </label>
            <input
              type="text"
              className="cm-input"
              style={{ width: '100%' }}
              placeholder="Ví dụ: Cấu trúc câu chữ 把 biểu thị sự xử trí"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
              Mã định danh duy nhất (Content ID) <span style={{ color: '#E60012' }}>*</span>
            </label>
            <input
              type="text"
              className="cm-input"
              style={{ width: '100%' }}
              placeholder="Ví dụ: grammar-hsk3-ba-advanced"
              value={contentId}
              onChange={(e) => setContentId(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                Chữ Hán minh họa (Hanzi)
              </label>
              <input
                type="text"
                className="cm-input"
                style={{ width: '100%', fontFamily: 'var(--font-hanzi)' }}
                placeholder="Ví dụ: 我把门关上。"
                value={hanzi}
                onChange={(e) => setHanzi(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                Phiên âm Pinyin
              </label>
              <input
                type="text"
                className="cm-input"
                style={{ width: '100%' }}
                placeholder="Ví dụ: Wǒ bǎ mén guān shàng."
                value={pinyin}
                onChange={(e) => setPinyin(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
              Dịch nghĩa tiếng Việt
            </label>
            <input
              type="text"
              className="cm-input"
              style={{ width: '100%' }}
              placeholder="Ví dụ: Tôi đóng cửa lại."
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
            />
          </div>

          {contentType === 'GRAMMAR_POINT' && (
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                Công thức cấu trúc
              </label>
              <input
                type="text"
                className="cm-input"
                style={{ width: '100%' }}
                placeholder="Ví dụ: S + 把 + O + V + Thành phần khác"
                value={structure}
                onChange={(e) => setStructure(e.target.value)}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
              Tóm tắt lý do xuất bản (Audit Log) <span style={{ color: '#E60012' }}>*</span>
            </label>
            <textarea
              className="cm-input"
              style={{ width: '100%', height: '56px', padding: '8px 12px', resize: 'vertical' }}
              placeholder="Ví dụ: Bổ sung điểm ngữ pháp HSK 3 còn thiếu theo đề cương giáo trình."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          {/* Modal Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              className="cm-btn cm-btn-secondary"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="cm-btn cm-btn-primary"
            >
              <CheckCircle2 size={16} />
              Tự xuất bản ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
