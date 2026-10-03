import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="ds-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="ds-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ds-modal-header">
          <h2 id="modal-title" className="ds-modal-title">
            {title}
          </h2>
          <Button
            variant="ghost"
            isIconOnly
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            icon={<X size={18} />}
          />
        </div>

        <div style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
          {children}
        </div>

        {actions && <div className="ds-modal-actions">{actions}</div>}
      </div>
    </div>
  );
};
