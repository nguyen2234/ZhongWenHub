import React, { useMemo } from 'react';
import { Eye, Edit3, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { UserListItem, UserSort, UserSortField } from '../types/user.types';
import type { TableColumn, RowAction } from '../../../shared/types';
import { ManagementDataTable, StatusBadge } from '../../../shared/components';

export interface UserTableProps {
  users: UserListItem[];
  selectedUserId?: string;
  selectedIds: string[];
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectUser: (id: string, checked: boolean) => void;
  onSelectUser: (user: UserListItem) => void;
  onEditUser: (user: UserListItem) => void;
  onLockUnlockUser: (user: UserListItem) => void;
  sort?: UserSort;
  onSortChange?: (field: UserSortField) => void;
  onResetFilters?: () => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  selectedUserId: _selectedUserId,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectUser,
  onSelectUser,
  onEditUser,
  onLockUnlockUser,
  sort,
  onSortChange,
  onResetFilters,
}) => {
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getStatusVariant = (status: UserListItem['status']) => {
    switch (status) {
      case 'ACTIVE':
        return { variant: 'success' as const, label: 'Hoạt động' };
      case 'PENDING':
        return { variant: 'warning' as const, label: 'Chờ duyệt' };
      case 'LOCKED':
        return { variant: 'danger' as const, label: 'Bị khóa' };
      case 'INACTIVE':
      default:
        return { variant: 'neutral' as const, label: 'Ngưng HĐ' };
    }
  };

  const columns: TableColumn<UserListItem>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Học viên',
        sortable: true,
        sortField: 'name',
        render: (user) => (
          <div className="user-cell-profile">
            <div className="user-avatar-badge">{getInitials(user.name)}</div>
            <div>
              <div className="user-name-title">{user.name}</div>
              <div className="user-email-subtitle">{user.email}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'hskLevel',
        header: 'Trình độ',
        sortable: true,
        sortField: 'hskLevel',
        width: '90px',
        render: (user) => (
          <span
            style={{
              display: 'inline-block',
              fontWeight: 700,
              fontSize: '11px',
              padding: '1px 8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--surface-hover)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            }}
          >
            {user.hskLevel}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Trạng thái',
        width: '120px',
        render: (user) => {
          const statusInfo = getStatusVariant(user.status);
          return (
            <StatusBadge
              label={statusInfo.label}
              variant={statusInfo.variant}
              size="sm"
            />
          );
        },
      },
      {
        key: 'progress',
        header: 'Tiến độ học',
        sortable: true,
        sortField: 'progress',
        width: '140px',
        render: (user) => (
          <div className="table-progress-wrap">
            <div className="table-progress-bar">
              <div
                className="table-progress-fill"
                style={{ width: `${user.progressPercentage}%` }}
              />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground)' }}>
              {user.progressPercentage}%
            </span>
          </div>
        ),
      },
      {
        key: 'joinedDate',
        header: 'Ngày tham gia',
        sortable: true,
        sortField: 'joinedDate',
        width: '130px',
        render: (user) => (
          <span style={{ color: 'var(--muted)', fontSize: '11px', fontVariantNumeric: 'tabular-nums' }}>
            {user.joinedAt}
          </span>
        ),
      },
      {
        key: 'lastActive',
        header: 'Hoạt động gần nhất',
        sortable: true,
        sortField: 'lastActive',
        width: '140px',
        render: (user) => (
          <span style={{ color: 'var(--muted)', fontSize: '11px', fontVariantNumeric: 'tabular-nums' }}>
            {user.lastActiveAt}
          </span>
        ),
      },
    ],
    []
  );

  const rowActions: RowAction<UserListItem>[] = useMemo(
    () => [
      {
        key: 'view',
        label: 'Xem chi tiết',
        icon: <Eye size={15} />,
        onClick: (user: UserListItem) => onSelectUser(user),
      },
      {
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: <Edit3 size={15} />,
        onClick: (user: UserListItem) => onEditUser(user),
      },
      {
        key: 'toggle_lock',
        label: (u: UserListItem) => (u.status === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'),
        icon: (u: UserListItem) =>
          u.status === 'LOCKED' ? (
            <ShieldCheck size={15} style={{ color: '#16a34a' }} />
          ) : (
            <ShieldAlert size={15} style={{ color: '#dc2626' }} />
          ),
        variant: 'danger',
        onClick: (user: UserListItem) => onLockUnlockUser(user),
      },
    ],
    [onSelectUser, onEditUser, onLockUnlockUser]
  );

  return (
    <div className="user-table-desktop">
      <ManagementDataTable
        columns={columns}
        data={users}
        keyExtractor={(user) => user.id}
        selectable
        selectedIds={selectedIds}
        onSelectRow={(id, checked) => onToggleSelectUser(String(id), checked)}
        onSelectAll={onToggleSelectAll}
        onRowClick={onSelectUser}
        sortConfig={sort ? { field: sort.field, direction: sort.direction } : undefined}
        onSortChange={(field) => onSortChange && onSortChange(field as UserSortField)}
        rowActions={rowActions}
        emptyText="Không có học viên phù hợp với bộ lọc hiện tại."
        onClearFilters={onResetFilters}
        enableMobileCards={false} // AdminUsersPage handles mobile cards through UserCardList
      />
    </div>
  );
};
