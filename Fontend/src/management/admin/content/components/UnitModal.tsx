import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../design-system';
import type { ContentStatus, Unit, UpdateUnitDTO } from '../types';

export interface UnitModalProps {
  isOpen: boolean;
  unit: Unit | null;
  onClose: () => void;
  onSave: (dto: UpdateUnitDTO) => void;
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
  }, [unit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleZh.trim() || !titleVi.trim()) return;
    onSave({
      titleZh,
      titleVi,
      description,
      orderIndex,
      status,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={unit ? `Chỉnh sửa Unit #${unit.unitNumber}` : 'Thêm Unit mới'}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-2) 0' }}>
        <div className="lcm-form-group">
          <label className="lcm-form-label">Tên Unit (Hán tự) *</label>
          <input
            className="lcm-form-input"
            value={titleZh}
            onChange={(e) => setTitleZh(e.target.value)}
            placeholder="e.g. 饮食与餐厅"
            required
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
            />
          </div>

          <div className="lcm-form-group">
            <label className="lcm-form-label">Trạng thái xuất bản</label>
            <select
              className="lcm-form-input"
              value={status}
              onChange={(e) => setStatus(e.target.value as ContentStatus)}
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
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            className="ds-btn ds-btn-primary ds-btn-sm"
          >
            Lưu Unit
          </button>
        </div>
      </form>
    </Modal>
  );
};
