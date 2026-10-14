import React, { useState, useEffect } from 'react';
import { CalendarCheck, AlertTriangle } from 'lucide-react';
import { Modal } from '../../../../design-system';
import type {
  SupportStaffDetail,
  SupportStaffListItem,
  SupportWorkStatus,
} from '../types/support-staff.types';

export interface ChangeWorkStatusModalProps {
  isOpen: boolean;
  staff: SupportStaffListItem | SupportStaffDetail | null;
  onClose: () => void;
  onConfirm: (staffId: string, newWorkStatus: SupportWorkStatus) => void;
}

interface StatusOption {
  value: SupportWorkStatus;
  title: string;
  description: string;
  badgeColor: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'AVAILABLE',
    title: 'Đang sẵn sàng (Online / Nhận ticket)',
    description: 'Nhân viên đang trực tuyến và hệ thống có thể tự động phân phối ticket mới.',
    badgeColor: '#16a34a',
  },
  {
    value: 'BUSY',
    title: 'Đang bận (Xử lý ca phức tạp)',
    description: 'Nhân viên đang tập trung xử lý các ticket tồn đọng hoặc ca hỗ trợ VIP đặc biệt.',
    badgeColor: '#d97706',
  },
  {
    value: 'OFF_DUTY',
    title: 'Hết ca trực (Ngoại tuyến)',
    description: 'Nhân viên đã hoàn thành ca làm việc trong ngày hoặc chưa tới giờ trực.',
    badgeColor: '#64748b',
  },
  {
    value: 'ON_LEAVE',
    title: 'Nghỉ phép (Tạm vắng mặt)',
    description: 'Nhân viên đang trong kỳ nghỉ phép thường niên hoặc nghỉ ốm đã đăng ký.',
    badgeColor: '#e11d48',
  },
];

export const ChangeWorkStatusModal: React.FC<ChangeWorkStatusModalProps> = ({
  isOpen,
  staff,
  onClose,
  onConfirm,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<SupportWorkStatus>('AVAILABLE');

  useEffect(() => {
    if (staff) {
      setSelectedStatus(staff.workStatus);
    }
  }, [staff]);

  if (!staff) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(staff.id, selectedStatus);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cập nhật trạng thái làm việc">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--foreground)', margin: '0 0 4px 0' }}>
            Nhân viên: <strong>{staff.name}</strong> ({staff.email})
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: 0 }}>
            Lựa chọn trạng thái trực hiện tại để điều phối luồng phân công ticket:
          </p>
        </div>

        {/* Radio option cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {STATUS_OPTIONS.map((opt) => {
            const isSelected = selectedStatus === opt.value;
            return (
              <label
                key={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'var(--surface)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <input
                  type="radio"
                  name="workStatus"
                  value={opt.value}
                  checked={isSelected}
                  onChange={() => setSelectedStatus(opt.value)}
                  style={{ marginTop: '3px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: opt.badgeColor,
                        display: 'inline-block',
                      }}
                    />
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--foreground)' }}>
                      {opt.title}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                    {opt.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        {/* Explicit Independence Notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: 'var(--radius-md)',
            fontSize: '11px',
            color: '#b45309',
          }}
        >
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          <span>
            Thao tác này <strong>chỉ thay đổi trạng thái trực</strong> và hoàn toàn <strong>không ảnh hưởng đến trạng thái tài khoản</strong> ({staff.accountStatus}).
          </span>
        </div>

        {/* Modal Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="btn btn-primary">
            <CalendarCheck size={14} style={{ display: 'inline', marginRight: 4 }} />
            Cập nhật trạng thái trực
          </button>
        </div>
      </form>
    </Modal>
  );
};
