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

const getRoleBadgeInfo = (roles?: string[]) => {
  const primaryRole = roles && roles.length > 0 ? roles[0].toUpperCase() : 'STUDENT';
  switch (primaryRole) {
    case 'ADMIN':
      return { label: 'Quản trị viên', bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' };
    case 'TEACHER':
      return { label: 'Giáo viên', bg: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' };
    case 'CONTENT_MANAGER':
      return { label: 'Quản lý ND', bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706' };
    case 'SUPPORT':
      return { label: 'Hỗ trợ viên', bg: 'rgba(13, 148, 136, 0.1)', color: '#0d9488' };
    case 'STUDENT':
    default:
      return { label: 'Học viên', bg: 'rgba(100, 116, 139, 0.1)', color: '#475569' };
  }
};

const isWalletAndPlanEligible = (user: UserListItem) => {
  const primaryRole = (user.roles?.[0] || user.role || 'STUDENT').toUpperCase();
  return primaryRole === 'STUDENT' || primaryRole === 'TEACHER';
};

const isSoleAdmin = (user: UserListItem) => {
  return (
    user.email.toLowerCase() === 'admin@gmail.com' ||
    user.roles?.includes('ADMIN') ||
    user.role === 'ADMIN'
  );
};

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
        header: 'Người dùng',
        sortable: true,
        sortField: 'name',
        render: (user: UserListItem) => (
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
        key: 'role',
        header: 'Vai trò',
        width: '120px',
        render: (user: UserListItem) => {
          const roleBadge = getRoleBadgeInfo(user.roles || (user.role ? [user.role] : undefined));
          return (
            <span
              style={{
                display: 'inline-block',
                fontWeight: 700,
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: roleBadge.bg,
                color: roleBadge.color,
              }}
            >
              {roleBadge.label}
            </span>
          );
        },
      },
      {
        key: 'status',
        header: 'Trạng thái',
        width: '110px',
        render: (user: UserListItem) => {
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
        key: 'walletBalance',
        header: 'Số dư tài khoản',
        width: '140px',
        render: (user: UserListItem) => {
          if (!isWalletAndPlanEligible(user)) {
            return (
              <span style={{ color: 'var(--muted)', fontSize: '11px', fontStyle: 'italic' }}>
                Không áp dụng
              </span>
            );
          }
          const formatted = (user.walletBalance ?? 0).toLocaleString('vi-VN') + ' ₫';
          return (
            <span
              style={{
                fontWeight: 700,
                fontSize: '12px',
                color: (user.walletBalance ?? 0) > 0 ? '#16a34a' : 'var(--foreground)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatted}
            </span>
          );
        },
      },
      {
        key: 'plan',
        header: 'Gói hiện tại',
        width: '120px',
        render: (user: UserListItem) => {
          if (!isWalletAndPlanEligible(user)) {
            return (
              <span style={{ color: 'var(--muted)', fontSize: '11px', fontStyle: 'italic' }}>
                Không áp dụng
              </span>
            );
          }
          const plan = user.plan || 'Free';
          let planBg = 'rgba(100, 116, 139, 0.1)';
          let planColor = '#475569';
          if (plan === 'Premium') {
            planBg = 'rgba(245, 158, 11, 0.15)';
            planColor = '#d97706';
          } else if (plan === 'Basic') {
            planBg = 'rgba(59, 130, 246, 0.12)';
            planColor = '#2563eb';
          }

          return (
            <span
              style={{
                display: 'inline-block',
                fontWeight: 700,
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: planBg,
                color: planColor,
                border: '1px solid currentColor',
              }}
            >
              {plan}
            </span>
          );
        },
      },
      {
        key: 'hskLevel',
        header: 'Trình độ',
        sortable: true,
        sortField: 'hskLevel',
        width: '90px',
        render: (user: UserListItem) => (
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
        key: 'joinedDate',
        header: 'Ngày tham gia',
        sortable: true,
        sortField: 'joinedDate',
        width: '130px',
        render: (user: UserListItem) => (
          <span style={{ color: 'var(--muted)', fontSize: '11px', fontVariantNumeric: 'tabular-nums' }}>
            {user.joinedAt}
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
        label: 'Xem',
        icon: <Eye size={15} />,
        onClick: (user: UserListItem) => onSelectUser(user),
      },
      {
        key: 'edit',
        label: 'Sửa',
        icon: <Edit3 size={15} />,
        onClick: (user: UserListItem) => onEditUser(user),
      },
      {
        key: 'toggle_status',
        label: (u: UserListItem) =>
          u.status === 'LOCKED' || u.status === 'INACTIVE' ? 'Kích hoạt lại' : 'Vô hiệu hóa',
        icon: (u: UserListItem) =>
          u.status === 'LOCKED' || u.status === 'INACTIVE' ? (
            <ShieldCheck size={15} style={{ color: '#16a34a' }} />
          ) : (
            <ShieldAlert size={15} style={{ color: '#dc2626' }} />
          ),
        variant: 'danger',
        disabled: (u: UserListItem) => isSoleAdmin(u),
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
        keyExtractor={(user: UserListItem) => user.id}
        selectable
        selectedIds={selectedIds}
        onSelectRow={(id, checked) => onToggleSelectUser(String(id), checked)}
        onSelectAll={onToggleSelectAll}
        onRowClick={onSelectUser}
        sortConfig={sort ? { field: sort.field, direction: sort.direction } : undefined}
        onSortChange={(field) => onSortChange && onSortChange(field as UserSortField)}
        rowActions={rowActions}
        emptyText="Không có người dùng phù hợp với bộ lọc hiện tại."
        onClearFilters={onResetFilters}
        enableMobileCards={false}
      />
    </div>
  );
};
