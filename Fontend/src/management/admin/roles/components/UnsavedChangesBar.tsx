import React from 'react';
import { AlertCircle, RotateCcw, Save } from 'lucide-react';

export interface UnsavedChangesBarProps {
  roleName: string;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export const UnsavedChangesBar: React.FC<UnsavedChangesBarProps> = ({
  roleName,
  isSaving,
  onCancel,
  onSave,
}) => {
  return (
    <div className="rpm-unsaved-bar" role="alert">
      <div className="rpm-unsaved-info">
        <AlertCircle size={18} className="rpm-unsaved-icon" />
        <p className="rpm-unsaved-text">
          Có thay đổi quyền chưa lưu cho vai trò <strong>{roleName}</strong>
        </p>
      </div>

      <div className="rpm-unsaved-actions">
        <button
          type="button"
          className="rpm-btn-revert"
          onClick={onCancel}
          disabled={isSaving}
        >
          <RotateCcw size={13} style={{ marginRight: '6px', verticalAlign: '-1px' }} />
          Hủy thay đổi
        </button>
        <button
          type="button"
          className="rpm-btn-save"
          onClick={onSave}
          disabled={isSaving}
        >
          <Save size={13} style={{ marginRight: '6px', verticalAlign: '-1px' }} />
          {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
        </button>
      </div>
    </div>
  );
};
