import React, { useState } from 'react';
import { MoreHorizontal, Eye, Edit2, CalendarCheck, Lock, Unlock } from 'lucide-react';
import { StatusBadge } from '../../../shared/components';
import type {
  SupportAccountStatus,
  SupportStaffListItem,
  SupportWorkStatus,
} from '../types/support-staff.types';
import {
  SUPPORT_SCOPE_META,
  SUPPORT_SHIFT_META,
} from '../types/support-staff.types';

export interface SupportStaffCardListProps {
  staffList: SupportStaffListItem[];
  onSelectStaff: (staff: SupportStaffListItem) => void;
  onEditStaff: (staff: SupportStaffListItem) => void;
  onChangeWorkStatus: (staff: SupportStaffListItem) => void;
  onToggleLockAccount: (staff: SupportStaffListItem) => void;
}

export const SupportStaffCardList: React.FC<SupportStaffCardListProps> = ({
  staffList,
  onSelectStaff,
  onEditStaff,
  onChangeWorkStatus,
  onToggleLockAccount,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const getWorkStatusBadge = (status: SupportWorkStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <StatusBadge variant="success" label="Sẵn sàng" size="sm" />;
      case 'BUSY':
        return <StatusBadge variant="warning" label="Đang bận" size="sm" />;
      case 'OFF_DUTY':
        return <StatusBadge variant="neutral" label="Hết ca" size="sm" />;
      case 'ON_LEAVE':
        return <StatusBadge variant="warning" label="Nghỉ phép" size="sm" />;
    }
  };

  const getAccountStatusBadge = (status: SupportAccountStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <StatusBadge variant="info" label="TK Hoạt động" size="sm" />;
      case 'LOCKED':
        return <StatusBadge variant="danger" label="TK Bị khóa" size="sm" />;
      case 'PENDING':
        return <StatusBadge variant="warning" label="TK Chờ duyệt" size="sm" />;
      default:
        return <StatusBadge variant="neutral" label="TK Ngừng HĐ" size="sm" />;
    }
  };

  return (
    <div
      className="support-cards-mobile"
      role="feed"
      aria-label="Danh sách nhân viên hỗ trợ dạng thẻ di động"
    >
      {staffList.map((staff) => {
        const initials = staff.name
          .split(' ')
          .map((w) => w[0])
          .slice(-2)
          .join('')
          .toUpperCase();

        const scopeLabels = staff.supportScopes.map(
          (s) => SUPPORT_SCOPE_META[s]?.shortLabel || s
        );

        return (
          <div
            key={staff.id}
            className="support-mobile-card"
            onClick={() => onSelectStaff(staff)}
            role="article"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectStaff(staff);
              }
            }}
          >
            {/* Header */}
            <div className="support-mobile-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="support-avatar-badge" aria-hidden="true">
                  {initials}
                </div>
                <div>
                  <div className="support-name-title">{staff.name}</div>
                  <div className="support-email-subtitle">{staff.email}</div>
                </div>
              </div>

              {/* Action Button */}
              <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="btn-row-action"
                  onClick={() =>
                    setActiveMenuId(activeMenuId === staff.id ? null : staff.id)
                  }
                  aria-label={`Thao tác thẻ ${staff.name}`}
                >
                  <MoreHorizontal size={15} />
                </button>

                {activeMenuId === staff.id && (
                  <div className="support-dropdown-popover" role="menu">
                    <button
                      type="button"
                      className="support-dropdown-item"
                      role="menuitem"
                      onClick={() => {
                        setActiveMenuId(null);
                        onSelectStaff(staff);
                      }}
                    >
                      <Eye size={13} />
                      Chi tiết
                    </button>
                    <button
                      type="button"
                      className="support-dropdown-item"
                      role="menuitem"
                      onClick={() => {
                        setActiveMenuId(null);
                        onChangeWorkStatus(staff);
                      }}
                    >
                      <CalendarCheck size={13} />
                      Đổi trạng thái trực
                    </button>
                    <button
                      type="button"
                      className="support-dropdown-item"
                      role="menuitem"
                      onClick={() => {
                        setActiveMenuId(null);
                        onEditStaff(staff);
                      }}
                    >
                      <Edit2 size={13} />
                      Chỉnh sửa
                    </button>
                    <div className="support-dropdown-separator" />
                    {staff.accountStatus === 'LOCKED' ? (
                      <button
                        type="button"
                        className="support-dropdown-item"
                        role="menuitem"
                        onClick={() => {
                          setActiveMenuId(null);
                          onToggleLockAccount(staff);
                        }}
                        style={{ color: '#16a34a' }}
                      >
                        <Unlock size={13} />
                        Mở khóa TK
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="support-dropdown-item danger"
                        role="menuitem"
                        onClick={() => {
                          setActiveMenuId(null);
                          onToggleLockAccount(staff);
                        }}
                      >
                        <Lock size={13} />
                        Khóa TK
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Badges Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {getWorkStatusBadge(staff.workStatus)}
              {getAccountStatusBadge(staff.accountStatus)}
              <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: 'auto' }}>
                {SUPPORT_SHIFT_META[staff.shift]?.shortLabel || staff.shift}
              </span>
            </div>

            {/* Scopes */}
            <div className="support-scope-pill-row">
              {scopeLabels.map((lbl) => (
                <span key={lbl} className="support-scope-mini-tag">
                  {lbl}
                </span>
              ))}
            </div>

            {/* Meta Grid */}
            <div className="support-mobile-meta-grid">
              <div>
                Ticket mở:{' '}
                <strong style={{ color: staff.openTickets > 0 ? '#d97706' : 'var(--foreground)' }}>
                  {staff.openTickets}
                </strong>
              </div>
              <div>
                Đã giải quyết: <strong>{staff.resolvedTickets}</strong>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                Hoạt động: <span>{staff.lastActiveAt}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
