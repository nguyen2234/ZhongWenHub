import React, { useState, useEffect, useRef } from 'react';
import {
  MoreHorizontal,
  Eye,
  Edit2,
  CalendarCheck,
  Lock,
  Unlock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { StatusBadge } from '../../../shared/components';
import type {
  SupportAccountStatus,
  SupportStaffListItem,
  SupportStaffSort,
  SupportStaffSortField,
  SupportWorkStatus,
} from '../types/support-staff.types';
import {
  SUPPORT_SCOPE_META,
  SUPPORT_SHIFT_META,
} from '../types/support-staff.types';

export interface SupportStaffTableProps {
  staffList: SupportStaffListItem[];
  selectedIds: string[];
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectStaff: (id: string, checked: boolean) => void;
  selectedStaffId: string | null;
  onSelectStaff: (staff: SupportStaffListItem) => void;
  onEditStaff: (staff: SupportStaffListItem) => void;
  onChangeWorkStatus: (staff: SupportStaffListItem) => void;
  onToggleLockAccount: (staff: SupportStaffListItem) => void;
  sort: SupportStaffSort;
  onSortChange: (field: SupportStaffSortField) => void;
}

export const SupportStaffTable: React.FC<SupportStaffTableProps> = ({
  staffList,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectStaff,
  selectedStaffId,
  onSelectStaff,
  onEditStaff,
  onChangeWorkStatus,
  onToggleLockAccount,
  sort,
  onSortChange,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const allSelected = staffList.length > 0 && selectedIds.length === staffList.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < staffList.length;

  const renderSortIndicator = (field: SupportStaffSortField) => {
    if (sort.field !== field) {
      return <ArrowUpDown size={12} style={{ color: 'var(--muted)', opacity: 0.5 }} />;
    }
    return sort.direction === 'asc' ? (
      <ArrowUp size={12} style={{ color: 'var(--primary)' }} />
    ) : (
      <ArrowDown size={12} style={{ color: 'var(--primary)' }} />
    );
  };

  const getWorkStatusBadge = (status: SupportWorkStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <StatusBadge variant="success" label="Đang sẵn sàng" />;
      case 'BUSY':
        return <StatusBadge variant="warning" label="Đang bận" />;
      case 'OFF_DUTY':
        return <StatusBadge variant="neutral" label="Hết ca" />;
      case 'ON_LEAVE':
        return <StatusBadge variant="warning" label="Nghỉ phép" />;
    }
  };

  const getAccountStatusBadge = (status: SupportAccountStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <StatusBadge variant="info" label="TK Hoạt động" />;
      case 'LOCKED':
        return <StatusBadge variant="danger" label="TK Bị khóa" />;
      case 'PENDING':
        return <StatusBadge variant="warning" label="TK Chờ kích hoạt" />;
      case 'INACTIVE':
      default:
        return <StatusBadge variant="neutral" label="TK Ngừng HĐ" />;
    }
  };

  return (
    <div className="support-table-desktop">
      <table className="data-table" role="table" aria-label="Bảng danh sách nhân viên hỗ trợ">
        <thead>
          <tr>
            <th style={{ width: '40px', textAlign: 'center' }}>
              <input
                type="checkbox"
                aria-label="Chọn tất cả nhân viên"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={(e) => onToggleSelectAll(e.target.checked)}
              />
            </th>
            <th
              style={{ cursor: 'pointer', minWidth: '190px' }}
              onClick={() => onSortChange('name')}
              aria-sort={
                sort.field === 'name'
                  ? sort.direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                NHÂN VIÊN {renderSortIndicator('name')}
              </div>
            </th>
            <th style={{ minWidth: '160px' }}>PHẠM VI HỖ TRỢ</th>
            <th style={{ minWidth: '100px' }}>CA TRỰC</th>
            <th style={{ minWidth: '130px' }}>TRẠNG THÁI TRỰC</th>
            <th
              style={{ width: '100px', textAlign: 'center', cursor: 'pointer' }}
              onClick={() => onSortChange('openTickets')}
              aria-sort={
                sort.field === 'openTickets'
                  ? sort.direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                TICKET MỞ {renderSortIndicator('openTickets')}
              </div>
            </th>
            <th
              style={{ width: '100px', textAlign: 'center', cursor: 'pointer' }}
              onClick={() => onSortChange('resolvedTickets')}
              aria-sort={
                sort.field === 'resolvedTickets'
                  ? sort.direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                ĐÃ ĐÓNG {renderSortIndicator('resolvedTickets')}
              </div>
            </th>
            <th
              style={{ minWidth: '110px', cursor: 'pointer' }}
              onClick={() => onSortChange('lastActive')}
              aria-sort={
                sort.field === 'lastActive'
                  ? sort.direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                HOẠT ĐỘNG {renderSortIndicator('lastActive')}
              </div>
            </th>
            <th style={{ minWidth: '130px' }}>TÀI KHOẢN</th>
            <th style={{ width: '56px', textAlign: 'center' }}>
              <span className="sr-only">Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {staffList.map((staff) => {
            const isSelected = selectedIds.includes(staff.id);
            const isDrawerTarget = selectedStaffId === staff.id;
            const initials = staff.name
              .split(' ')
              .map((w) => w[0])
              .slice(-2)
              .join('')
              .toUpperCase();

            const scopeLabels = staff.supportScopes.map(
              (s) => SUPPORT_SCOPE_META[s]?.shortLabel || s
            );
            const primaryScopes = scopeLabels.slice(0, 2);
            const remainingCount = scopeLabels.length - 2;

            return (
              <tr
                key={staff.id}
                className={`support-table-row ${isDrawerTarget ? 'active-row' : ''}`}
                onClick={() => onSelectStaff(staff)}
              >
                {/* Checkbox - STOP PROPAGATION */}
                <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    aria-label={`Chọn nhân viên ${staff.name}`}
                    checked={isSelected}
                    onChange={(e) => onToggleSelectStaff(staff.id, e.target.checked)}
                  />
                </td>

                {/* Profile (Avatar, Name, Email) */}
                <td>
                  <div className="support-cell-profile">
                    <div className="support-avatar-badge" aria-hidden="true">
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="support-name-title">{staff.name}</div>
                      <div className="support-email-subtitle">{staff.email}</div>
                    </div>
                  </div>
                </td>

                {/* Scopes */}
                <td>
                  <div className="support-scope-pill-row">
                    {primaryScopes.map((scope) => (
                      <span key={scope} className="support-scope-mini-tag">
                        {scope}
                      </span>
                    ))}
                    {remainingCount > 0 && (
                      <span className="support-scope-mini-tag more">
                        +{remainingCount}
                      </span>
                    )}
                  </div>
                </td>

                {/* Shift */}
                <td>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--foreground)' }}>
                    {SUPPORT_SHIFT_META[staff.shift]?.shortLabel || staff.shift}
                  </span>
                </td>

                {/* Work Status */}
                <td>{getWorkStatusBadge(staff.workStatus)}</td>

                {/* Open Tickets */}
                <td style={{ textAlign: 'center' }}>
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 700,
                      color: staff.openTickets > 0 ? '#d97706' : 'var(--muted)',
                    }}
                  >
                    {staff.openTickets}
                  </span>
                </td>

                {/* Resolved Tickets */}
                <td style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--foreground)' }}>
                    {staff.resolvedTickets}
                  </span>
                </td>

                {/* Last Active */}
                <td>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    {staff.lastActiveAt}
                  </span>
                </td>

                {/* Account Status */}
                <td>{getAccountStatusBadge(staff.accountStatus)}</td>

                {/* Action Menu - STOP PROPAGATION */}
                <td className="support-action-cell" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="btn-row-action"
                    onClick={() => setOpenMenuId(openMenuId === staff.id ? null : staff.id)}
                    aria-label={`Mở thao tác cho ${staff.name}`}
                    aria-haspopup="true"
                    aria-expanded={openMenuId === staff.id}
                  >
                    <MoreHorizontal size={15} />
                  </button>

                  {openMenuId === staff.id && (
                    <div className="support-dropdown-popover" ref={menuRef} role="menu">
                      <button
                        type="button"
                        className="support-dropdown-item"
                        role="menuitem"
                        onClick={() => {
                          setOpenMenuId(null);
                          onSelectStaff(staff);
                        }}
                      >
                        <Eye size={13} />
                        Xem chi tiết
                      </button>

                      <button
                        type="button"
                        className="support-dropdown-item"
                        role="menuitem"
                        onClick={() => {
                          setOpenMenuId(null);
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
                          setOpenMenuId(null);
                          onEditStaff(staff);
                        }}
                      >
                        <Edit2 size={13} />
                        Chỉnh sửa hồ sơ
                      </button>

                      <div className="support-dropdown-separator" />

                      {staff.accountStatus === 'LOCKED' ? (
                        <button
                          type="button"
                          className="support-dropdown-item"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null);
                            onToggleLockAccount(staff);
                          }}
                          style={{ color: '#16a34a' }}
                        >
                          <Unlock size={13} />
                          Mở khóa tài khoản
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="support-dropdown-item danger"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null);
                            onToggleLockAccount(staff);
                          }}
                        >
                          <Lock size={13} />
                          Khóa tài khoản
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
