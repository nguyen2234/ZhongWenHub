import React, { useState, useEffect } from 'react';
import { Sparkles, Check, AlertCircle } from 'lucide-react';
import type { UserListItem } from '../types/user.types';

export interface UpdateSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserListItem | null;
  onConfirm: (userId: string, plan: string, durationMonths: number) => Promise<void>;
}

export const UpdateSubscriptionModal: React.FC<UpdateSubscriptionModalProps> = ({
  isOpen,
  onClose,
  user,
  onConfirm,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'Free' | 'Basic' | 'Premium'>('Free');
  const [durationMonths, setDurationMonths] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      const current = (user.plan as any) || 'Free';
      setSelectedPlan(['Free', 'Basic', 'Premium'].includes(current) ? current : 'Free');
      setDurationMonths(current === 'Free' ? 0 : 3);
      setError(null);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const isApplicable =
    user.roles?.includes('STUDENT') ||
    user.roles?.includes('TEACHER') ||
    user.role === 'STUDENT' ||
    user.role === 'TEACHER';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApplicable || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirm(user.id, selectedPlan, selectedPlan === 'Free' ? 0 : durationMonths);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Không thể cập nhật gói sử dụng.');
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
      aria-labelledby="update-sub-title"
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
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9333ea',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h3 id="update-sub-title" style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
                Thay đổi gói sử dụng
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
              <span>Gói sử dụng chỉ áp dụng cho Học viên (STUDENT) và Giáo viên (TEACHER).</span>
            </div>
          ) : null}

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

          {/* Plan selection */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
              Chọn gói dịch vụ *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {(['Free', 'Basic', 'Premium'] as const).map((plan) => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  disabled={!isApplicable || isSubmitting}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '8px',
                    border: selectedPlan === plan ? '2px solid #9333ea' : '1px solid var(--border, #cbd5e1)',
                    backgroundColor: selectedPlan === plan ? 'rgba(168, 85, 247, 0.06)' : 'var(--surface, #ffffff)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '13px', color: selectedPlan === plan ? '#9333ea' : 'inherit' }}>
                    {plan}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted, #64748b)', marginTop: '2px' }}>
                    {plan === 'Free' ? 'Cơ bản' : plan === 'Basic' ? 'Nâng cao' : 'Toàn diện'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration selection (if not Free) */}
          {selectedPlan !== 'Free' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Thời hạn kích hoạt gói *
              </label>
              <select
                className="drawer-form-select"
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                disabled={!isApplicable || isSubmitting}
                style={{ width: '100%' }}
              >
                <option value={1}>1 tháng (30 ngày)</option>
                <option value={3}>3 tháng (Quý)</option>
                <option value={6}>6 tháng (Bán niên)</option>
                <option value={12}>12 tháng (1 năm)</option>
                <option value={0}>Không giới hạn thời hạn</option>
              </select>
            </div>
          )}

          <div
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.06)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '11px',
              color: '#1e40af',
              marginBottom: '16px',
            }}
          >
            ℹ Thao tác này cập nhật gói sử dụng trực tiếp trên SQL Server và không tự động phát sinh giao dịch thanh toán.
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
              disabled={!isApplicable || isSubmitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {isSubmitting ? (
                <span>Đang lưu...</span>
              ) : (
                <>
                  <Check size={14} />
                  <span>Xác nhận cập nhật gói</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
