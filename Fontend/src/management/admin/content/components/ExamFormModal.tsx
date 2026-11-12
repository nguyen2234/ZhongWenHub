import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { CreateExamInput, ExamSummary, ExamType, UpdateExamInput } from '../types/exam-repository.types';

export interface ExamFormModalProps {
  isOpen: boolean;
  exam: ExamSummary | null;
  onClose: () => void;
  onSave: (payload: CreateExamInput | UpdateExamInput) => Promise<void>;
}

const EXAM_TYPES: Array<{ value: ExamType; label: string }> = [
  { value: 'MOCK', label: 'Đề thi thử HSK' },
  { value: 'PRACTICE', label: 'Đề luyện tập tổng hợp' },
  { value: 'PLACEMENT', label: 'Kiểm tra đầu vào' },
  { value: 'MIDTERM', label: 'Kiểm tra giữa khóa' },
  { value: 'FINAL', label: 'Kiểm tra cuối khóa' },
];

export const ExamFormModal: React.FC<ExamFormModalProps> = ({
  isOpen,
  exam,
  onClose,
  onSave,
}) => {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [hskLevel, setHskLevel] = useState(1);
  const [examType, setExamType] = useState<ExamType>('MOCK');
  const [durationMinutes, setDurationMinutes] = useState(40);
  const [passingScore, setPassingScore] = useState(120);
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (exam) {
        setCode(exam.code);
        setTitle(exam.title);
        setHskLevel(exam.hskLevel);
        setExamType(exam.examType);
        setDurationMinutes(exam.durationMinutes);
        setPassingScore(exam.passingScore);
        setDescription(exam.description ?? '');
        setInstructions(exam.instructions ?? '');
      } else {
        setCode('HSK1-MOCK-01');
        setTitle('');
        setHskLevel(1);
        setExamType('MOCK');
        setDurationMinutes(40);
        setPassingScore(120);
        setDescription('');
        setInstructions('Đọc kỹ đề bài và hoàn thành tất cả các phần trong thời gian quy định.');
      }
    }
  }, [isOpen, exam]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) {
      setError('Vui lòng nhập đầy đủ mã đề thi và tên đề thi.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        code: code.trim().toUpperCase(),
        title: title.trim(),
        hskLevel,
        examType,
        durationMinutes,
        passingScore,
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Không thể lưu đề thi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="lcm-drawer-overlay" onClick={onClose}>
      <div
        className="lcm-drawer-content"
        style={{ maxWidth: '580px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lcm-drawer-header">
          <h3 className="lcm-drawer-title">
            {exam ? `Sửa đề thi: ${exam.code}` : 'Tạo đề thi mới (Kho đề thi)'}
          </h3>
          <button
            type="button"
            className="ds-btn ds-btn-ghost ds-btn-sm"
            onClick={onClose}
            disabled={isSaving}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="lcm-drawer-body">
          {error && (
            <div
              style={{
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger, #ef4444)',
                fontSize: 'var(--text-xs)',
                marginBottom: 'var(--space-3)',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                Mã đề thi *
              </label>
              <input
                type="text"
                className="ds-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: HSK1-MOCK-01"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                Cấp độ HSK 2.0 *
              </label>
              <select
                className="lcm-select-filter"
                style={{ width: '100%' }}
                value={hskLevel}
                onChange={(e) => setHskLevel(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6].map((lvl) => (
                  <option key={lvl} value={lvl}>
                    HSK {lvl}{lvl >= 5 ? ' (Chuẩn bị)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-3)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
              Tên đề thi *
            </label>
            <input
              type="text"
              className="ds-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Đề thi thử HSK 1 chuẩn — Bộ đề 01"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                Loại đề
              </label>
              <select
                className="lcm-select-filter"
                style={{ width: '100%' }}
                value={examType}
                onChange={(e) => setExamType(e.target.value as ExamType)}
              >
                {EXAM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                Thời lượng (phút)
              </label>
              <input
                type="number"
                className="ds-input"
                min={1}
                max={240}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                Điểm đạt
              </label>
              <input
                type="number"
                className="ds-input"
                min={0}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-3)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
              Mô tả ngắn
            </label>
            <textarea
              className="ds-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả phạm vi từ vựng, ngữ pháp và đối tượng học viên..."
            />
          </div>

          <div style={{ marginBottom: 'var(--space-3)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
              Hướng dẫn làm bài
            </label>
            <textarea
              className="ds-input"
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Quy định thời gian, cấu trúc điểm từng phần..."
            />
          </div>

          <div className="lcm-drawer-footer" style={{ padding: 'var(--space-3) 0 0 0' }}>
            <button
              type="button"
              className="ds-btn ds-btn-outline ds-btn-sm"
              onClick={onClose}
              disabled={isSaving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="ds-btn ds-btn-primary ds-btn-sm"
              disabled={isSaving}
            >
              <Save size={14} /> {isSaving ? 'Đang lưu...' : exam ? 'Cập nhật đề thi' : 'Tạo đề thi (Bản nháp)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

