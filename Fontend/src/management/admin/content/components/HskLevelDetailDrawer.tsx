import React, { useState, useEffect } from 'react';
import { X, Edit3, Save } from 'lucide-react';
import { Badge } from '../../../../design-system';
import type { HskLevel, UpdateHskLevelDTO } from '../types';

export interface HskLevelDetailDrawerProps {
  isOpen: boolean;
  level: HskLevel | null;
  onClose: () => void;
  onSave: (id: string, dto: UpdateHskLevelDTO) => void;
}

export const HskLevelDetailDrawer: React.FC<HskLevelDetailDrawerProps> = ({
  isOpen,
  level,
  onClose,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [targetVocabularyCount, setTargetVocabularyCount] = useState(0);
  const [targetCharacterCount, setTargetCharacterCount] = useState(0);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (level) {
      setName(level.name);
      setTargetVocabularyCount(level.targetVocabularyCount);
      setTargetCharacterCount(level.targetCharacterCount);
      setActive(level.active);
      setIsEditing(false);
    }
  }, [level]);

  if (!isOpen || !level) return null;

  const handleSave = () => {
    onSave(level.id, {
      name,
      targetVocabularyCount,
      targetCharacterCount,
      active,
    });
    setIsEditing(false);
  };

  return (
    <div className="lcm-drawer-overlay" onClick={onClose}>
      <div className="lcm-drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="lcm-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h3 className="lcm-drawer-title">Cấu hình Cấp độ: {name}</h3>
            <Badge variant={active ? 'primary' : 'neutral'}>
              {active ? 'Đang kích hoạt' : 'Tạm khóa'}
            </Badge>
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
          <div style={{ padding: 'var(--space-3)', backgroundColor: '#eff6ff', borderRadius: 'var(--radius-md)', fontSize: '12px', color: '#1e40af' }}>
            ℹ️ <strong>Cấp độ hệ thống:</strong> Cấp độ HSK là cấu hình nền tảng, không hỗ trợ thao tác xóa để bảo vệ tính toàn vẹn của các bài học và từ vựng liên kết.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="lcm-form-group">
              <label className="lcm-form-label">Mã định danh cấp độ (Level Code)</label>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '6px 12px', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                {level.levelCode}
              </span>
            </div>

            <div className="lcm-form-group">
              <label className="lcm-form-label">Tên hiển thị cấp độ</label>
              {isEditing ? (
                <input
                  className="lcm-form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              ) : (
                <span style={{ fontWeight: 600 }}>{name}</span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="lcm-form-group">
                <label className="lcm-form-label">Định mức từ vựng mục tiêu</label>
                {isEditing ? (
                  <input
                    type="number"
                    className="lcm-form-input"
                    value={targetVocabularyCount}
                    onChange={(e) => setTargetVocabularyCount(Number(e.target.value))}
                  />
                ) : (
                  <span><strong>{targetVocabularyCount.toLocaleString('vi-VN')}</strong> từ</span>
                )}
              </div>

              <div className="lcm-form-group">
                <label className="lcm-form-label">Định mức chữ Hán mục tiêu</label>
                {isEditing ? (
                  <input
                    type="number"
                    className="lcm-form-input"
                    value={targetCharacterCount}
                    onChange={(e) => setTargetCharacterCount(Number(e.target.value))}
                  />
                ) : (
                  <span><strong>{targetCharacterCount.toLocaleString('vi-VN')}</strong> chữ</span>
                )}
              </div>
            </div>

            <div className="lcm-form-group">
              <label className="lcm-form-label">Trạng thái áp dụng</label>
              {isEditing ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                  <span style={{ fontSize: 'var(--text-sm)' }}>Kích hoạt cấp độ này cho hệ thống</span>
                </label>
              ) : (
                <span>{active ? 'Đang mở cho giảng dạy' : 'Tạm ẩn'}</span>
              )}
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
                <Save size={14} /> Lưu cấu hình
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
                <Edit3 size={14} /> Sửa cấu hình
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
