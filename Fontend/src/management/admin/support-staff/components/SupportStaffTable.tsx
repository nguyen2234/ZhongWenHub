import React, { useMemo } from 'react';
import { Eye, Edit2, CalendarCheck, Lock, Unlock } from 'lucide-react';
import { StatusBadge, ManagementDataTable } from '../../../shared/components';
import type { TableColumn, RowAction } from '../../../shared/types';
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
  selectedStaffId: _selectedStaffId,
  onSelectStaff,
  onEditStaff,
  onChangeWorkStatus,
  onToggleLockAccount,
  sort,
  onSortChange,
}) => {
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

  const columns: TableColumn<SupportStaffListItem>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Nhân viên',
        sortable: true,
        sortField: 'name',
        render: (staff) => {
          const initials = staff.name
            .split(' ')
            .map((w) => w[0])
            .slice(-2)
            .join('')
            .toUpperCase();

          return (
            <div className="support-cell-profile">
              <div className="support-avatar-badge" aria-hidden="true">
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="support-name-title">{staff.name}</div>
                <div className="support-email-subtitle">{staff.email}</div>
              </div>
            </div>
          );
        },
      },
      {
        key: 'scopes',
        header: 'Phạm vi & Ca trực',
        render: (staff) => {
          const scopeLabels = staff.supportScopes.map(
            (sc) => SUPPORT_SCOPE_META[sc]?.shortLabel || sc
          );
          const shiftInfo = SUPPORT_SHIFT_META[staff.shift];

          return (
            <div className="support-scopes-cell">
              <div className="support-scope-tags-row">
                {scopeLabels.map((sc) => (
                  <span key={sc} className="support-scope-mini-tag">
                    {sc}
                  </span>
                ))}
                {shiftInfo && (
                  <span className="support-shift-mini-tag" title={shiftInfo.label}>
                    {shiftInfo.shortLabel}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        key: 'workStatus',
        header: 'Trạng thái',
        render: (staff) => (
          <div className="support-status-group">
            {getWorkStatusBadge(staff.workStatus)}
            {staff.accountStatus !== 'ACTIVE' && getAccountStatusBadge(staff.accountStatus)}
          </div>
        ),
      },
      {
        key: 'openTickets',
        header: 'Đang xử lý',
        sortable: true,
        sortField: 'openTickets',
        align: 'center',
        width: '90px',
        render: (staff) => (
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {staff.openTickets}
          </span>
        ),
      },
      {
        key: 'resolvedTickets',
        header: 'Tổng giải quyết',
        sortable: true,
        sortField: 'resolvedTickets',
        align: 'center',
        width: '120px',
        render: (staff) => (
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {staff.resolvedTickets}
          </span>
        ),
      },
      {
        key: 'lastActive',
        header: 'Hoạt động',
        sortable: true,
        sortField: 'lastActive',
        width: '130px',
        render: (staff) => (
          <span style={{ fontSize: '11px', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
            {staff.lastActiveAt}
          </span>
        ),
      },
    ],
    []
  );

  const rowActions: RowAction<SupportStaffListItem>[] = useMemo(
    () => [
      {
        key: 'view',
        label: 'Xem chi tiết',
        icon: <Eye size={15} />,
        onClick: (staff: SupportStaffListItem) => onSelectStaff(staff),
      },
      {
        key: 'edit',
        label: 'Chỉnh sửa phân công',
        icon: <Edit2 size={15} />,
        onClick: (staff: SupportStaffListItem) => onEditStaff(staff),
      },
      {
        key: 'status',
        label: 'Đổi trạng thái ca trực',
        icon: <CalendarCheck size={15} />,
        onClick: (staff: SupportStaffListItem) => onChangeWorkStatus(staff),
      },
      {
        key: 'toggle_lock',
        label: (s: SupportStaffListItem) =>
          s.accountStatus === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản',
        icon: (s: SupportStaffListItem) =>
          s.accountStatus === 'LOCKED' ? (
            <Unlock size={15} style={{ color: '#16a34a' }} />
          ) : (
            <Lock size={15} style={{ color: '#dc2626' }} />
          ),
        variant: 'danger',
        onClick: (staff: SupportStaffListItem) => onToggleLockAccount(staff),
      },
    ],
    [onSelectStaff, onEditStaff, onChangeWorkStatus, onToggleLockAccount]
  );

  return (
    <div className="support-table-desktop">
      <ManagementDataTable
        columns={columns}
        data={staffList}
        keyExtractor={(staff) => staff.id}
        selectable
        selectedIds={selectedIds}
        onSelectRow={(id, checked) => onToggleSelectStaff(String(id), checked)}
        onSelectAll={onToggleSelectAll}
        onRowClick={onSelectStaff}
        sortConfig={{ field: sort.field, direction: sort.direction }}
        onSortChange={(field) => onSortChange(field as SupportStaffSortField)}
        rowActions={rowActions}
        emptyText="Không tìm thấy nhân viên hỗ trợ nào phù hợp với bộ lọc."
        enableMobileCards={false} // SupportStaffPage handles mobile cards through SupportStaffCardList
      />
    </div>
  );
};
