import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../design-system';
import type { ContentStatus, Unit, UpdateUnitDTO } from '../types';

export interface UnitModalProps {
  isOpen: boolean;
  unit: Unit | null;
  onClose: () => void;
  onSave: (dto: UpdateUnitDTO) => Promise<void> | void;
}

export const UnitModal: React.FC<UnitModalProps> = ({
  isOpen,
  unit,
  onClose,
  onSave,
}) => {
  const [titleZh, setTitleZh] = useState('');
  const [titleVi, setTitleVi] = useState('');
  const [description, setDescription] = useState('');
  const [orderIndex, setOrderIndex] = useState(1);
  const [status, setStatus] = useState<ContentStatus>('PUBLISHED');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (unit) {
      setTitleZh(unit.titleZh);
      setTitleVi(unit.titleVi);
      setDescription(unit.description);
      setOrderIndex(unit.orderIndex);
      setStatus(unit.status);
    } else {
      setTitleZh('');
      setTitleVi('');
      setDescription('');
      setOrderIndex(1);
      setStatus('PUBLISHED');
    }
    setSubmitError(null);
    setIsSubmitting(false);
  }, [unit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleZh.trim() || !titleVi.trim()) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSave({
        titleZh,
        titleVi,
        description,
        orderIndex,
        status,
      });
      onClose();
    } catch (err: any) {
      setSubmitError(err?.message || 'Không thể lưu Unit vào máy chủ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={unit ? `Chỉnh sửa Unit #${unit.unitNumber}` : 'Thêm Unit mới'}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-2) 0' }}>
        {submitError && (
          <div
            style={{
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger, #ef4444)',
              fontSize: 'var(--text-xs)',
            }}
          >
            {submitError}
          </div>
        )}

        <div className="lcm-form-group">
          <label className="lcm-form-label">Tên Unit (Hán tự) *</label>
          <input
            className="lcm-form-input"
            value={titleZh}
            onChange={(e) => setTitleZh(e.target.value)}
            placeholder="e.g. 饮食与餐厅"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="lcm-form-group">
          <label className="lcm-form-label">Tên Unit (Tiếng Việt) *</label>
          <input
            className="lcm-form-input"
            value={titleVi}
            onChange={(e) => setTitleVi(e.target.value)}
            placeholder="e.g. Ẩm thực & Nhà hàng"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="lcm-form-group">
          <label className="lcm-form-label">Mô tả chủ đề</label>
          <textarea
            className="lcm-form-input"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả nội dung trọng tâm của Unit..."
            disabled={isSubmitting}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div className="lcm-form-group">
            <label className="lcm-form-label">Thứ tự hiển thị</label>
            <input
              type="number"
              className="lcm-form-input"
              value={orderIndex}
              onChange={(e) => setOrderIndex(Number(e.target.value))}
              disabled={isSubmitting}
            />
          </div>

          <div className="lcm-form-group">
            <label className="lcm-form-label">Trạng thái xuất bản</label>
            <select
              className="lcm-form-input"
              value={status}
              onChange={(e) => setStatus(e.target.value as ContentStatus)}
              disabled={isSubmitting}
            >
              <option value="PUBLISHED">Đã xuất bản</option>
              <option value="DRAFT">Bản nháp</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            className="ds-btn ds-btn-primary ds-btn-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu Unit'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
