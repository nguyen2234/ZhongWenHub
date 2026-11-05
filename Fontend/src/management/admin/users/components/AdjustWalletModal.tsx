import React, { useState, useEffect } from 'react';
import { CreditCard, Check, AlertCircle, Plus, Minus } from 'lucide-react';
import type { UserListItem } from '../types/user.types';

export interface AdjustWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserListItem | null;
  onConfirm: (userId: string, amount: number, reason: string) => Promise<void>;
}

export const AdjustWalletModal: React.FC<AdjustWalletModalProps> = ({
  isOpen,
  onClose,
  user,
  onConfirm,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [amountStr, setAmountStr] = useState<string>('50000');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAdjustmentType('ADD');
      setAmountStr('50000');
      setReason('');
      setError(null);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const isApplicable =
    user.roles?.includes('STUDENT') ||
    user.roles?.includes('TEACHER') ||
    user.role === 'STUDENT' ||
    user.role === 'TEACHER';

  const currentBalance = user.walletBalance ?? 0;
  const rawAmount = parseFloat(amountStr) || 0;
  const signedAmount = adjustmentType === 'ADD' ? rawAmount : -rawAmount;
  const projectedBalance = currentBalance + signedAmount;
  const isNegative = projectedBalance < 0;
  const isValid = isApplicable && rawAmount > 0 && reason.trim().length >= 3 && !isNegative;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirm(user.id, signedAmount, reason.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Không thể điều chỉnh số dư ví.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(3px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjust-wallet-title"
    >
      <div
        style={{
          backgroundColor: 'var(--surface, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(15, 118, 110, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0f766e',
              }}
            >
              <CreditCard size={18} />
            </div>
            <div>
              <h3 id="adjust-wallet-title" style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
                Điều chỉnh số dư tài khoản
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--muted, #64748b)', margin: 0 }}>
                {user.name} ({user.email})
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {!isApplicable ? (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#dc2626',
                fontSize: '12px',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={18} />
              <span>Số dư chỉ áp dụng cho Học viên (STUDENT) và Giáo viên (TEACHER).</span>
            </div>
          ) : null}

          {/* Current balance card */}
          <div
            style={{
              backgroundColor: 'var(--surface-hover, #f8fafc)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: 'var(--muted, #64748b)', display: 'block' }}>
                Số dư hiện tại
              </span>
              <strong style={{ fontSize: '16px', color: '#0f766e' }}>
                {currentBalance.toLocaleString('vi-VN')} ₫
              </strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted, #64748b)', display: 'block' }}>
                Sau điều chỉnh
              </span>
              <strong style={{ fontSize: '16px', color: isNegative ? '#dc2626' : '#2563eb' }}>
                {projectedBalance.toLocaleString('vi-VN')} ₫
              </strong>
            </div>
          </div>

          {isNegative && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#dc2626',
                fontSize: '12px',
                marginBottom: '14px',
              }}
            >
              ✕ Số dư sau khi trừ không thể nhỏ hơn 0 ₫.
            </div>
          )}

          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#dc2626',
                fontSize: '12px',
                marginBottom: '14px',
              }}
            >
              ✕ {error}
            </div>
          )}

          {/* Operation type buttons */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Loại điều chỉnh *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setAdjustmentType('ADD')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px',
                  borderRadius: '6px',
                  border: adjustmentType === 'ADD' ? '2px solid #16a34a' : '1px solid var(--border, #cbd5e1)',
                  backgroundColor: adjustmentType === 'ADD' ? 'rgba(22, 163, 74, 0.08)' : 'var(--surface, #ffffff)',
                  color: adjustmentType === 'ADD' ? '#16a34a' : 'inherit',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} />
                Cộng tiền (+)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('DEDUCT')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px',
                  borderRadius: '6px',
                  border: adjustmentType === 'DEDUCT' ? '2px solid #dc2626' : '1px solid var(--border, #cbd5e1)',
                  backgroundColor: adjustmentType === 'DEDUCT' ? 'rgba(239, 68, 68, 0.08)' : 'var(--surface, #ffffff)',
                  color: adjustmentType === 'DEDUCT' ? '#dc2626' : 'inherit',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <Minus size={16} />
                Trừ tiền (-)
              </button>
            </div>
          </div>

          {/* Amount input */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Số tiền điều chỉnh (VND) *
            </label>
            <input
              type="number"
              min="1000"
              step="1000"
              className="drawer-form-input"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="Ví dụ: 50000"
              disabled={!isApplicable || isSubmitting}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Reason input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Lý do điều chỉnh (lưu vào nhật ký giao dịch) *
            </label>
            <textarea
              className="drawer-form-textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Thưởng hoàn thành cấp độ HSK 2, Hoàn học phí, Điều chỉnh số dư ban đầu..."
              disabled={!isApplicable || isSubmitting}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Footer actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="ds-btn ds-btn-outline ds-btn-sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="ds-btn ds-btn-primary ds-btn-sm"
              disabled={!isValid || isSubmitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {isSubmitting ? (
                <span>Đang lưu...</span>
              ) : (
                <>
                  <Check size={14} />
                  <span>Xác nhận điều chỉnh</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
