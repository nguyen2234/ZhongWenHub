import React from 'react';
import { MoreHorizontal, Eye, Edit3, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { UserListItem } from '../types/user.types';
import { StatusBadge, EmptyState } from '../../../shared/components';

export interface UserCardListProps {
  users: UserListItem[];
  selectedUserId?: string;
  onSelectUser: (user: UserListItem) => void;
  onEditUser: (user: UserListItem) => void;
  onLockUnlockUser: (user: UserListItem) => void;
  onResetFilters?: () => void;
}

export const UserCardList: React.FC<UserCardListProps> = ({
  users,
  selectedUserId,
  onSelectUser,
  onEditUser,
  onLockUnlockUser,
  onResetFilters,
}) => {
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);

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

  if (users.length === 0) {
    return (
      <div className="user-cards-mobile" style={{ padding: '16px 0' }}>
        <EmptyState
          title="Không tìm thấy người dùng"
          description="Không có học viên phù hợp với bộ lọc hiện tại."
          action={
            onResetFilters && (
              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                onClick={onResetFilters}
              >
                Đặt lại bộ lọc
              </button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="user-cards-mobile">
      {users.map((user) => {
        const isSelected = selectedUserId === user.id;
        const statusInfo = getStatusVariant(user.status);
        const isMenuOpen = activeMenuId === user.id;

        return (
          <div
            key={user.id}
            className="user-mobile-card"
            style={{
              borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
              backgroundColor: isSelected ? '#f8faff' : 'var(--surface)',
            }}
            onClick={() => onSelectUser(user)}
          >
            <div className="user-mobile-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="user-avatar-badge">{getInitials(user.name)}</div>
                <div>
                  <div className="user-name-title">{user.name}</div>
                  <div className="user-email-subtitle">{user.email}</div>
                </div>
              </div>

              <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="btn-row-action"
                  onClick={() => setActiveMenuId(isMenuOpen ? null : user.id)}
                  aria-label="Thao tác"
                >
                  <MoreHorizontal size={16} />
                </button>

                {isMenuOpen && (
                  <div className="action-dropdown-popover" style={{ top: '100%', right: 0 }}>
                    <button
                      type="button"
                      className="action-menu-item"
                      onClick={() => {
                        setActiveMenuId(null);
                        onSelectUser(user);
                      }}
                    >
                      <Eye size={13} style={{ color: 'var(--muted)' }} />
                      Chi tiết
                    </button>
                    <button
                      type="button"
                      className="action-menu-item"
                      onClick={() => {
                        setActiveMenuId(null);
                        onEditUser(user);
                      }}
                    >
                      <Edit3 size={13} style={{ color: 'var(--muted)' }} />
                      Chỉnh sửa
                    </button>
                    <div className="action-menu-separator" />
                    <button
                      type="button"
                      className={`action-menu-item ${user.status === 'LOCKED' ? '' : 'danger'}`}
                      onClick={() => {
                        setActiveMenuId(null);
                        onLockUnlockUser(user);
                      }}
                    >
                      {user.status === 'LOCKED' ? (
                        <>
                          <ShieldCheck size={13} style={{ color: '#16a34a' }} />
                          Mở khóa
                        </>
                      ) : (
                        <>
                          <ShieldAlert size={13} />
                          Khóa tài khoản
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
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
              <StatusBadge label={statusInfo.label} variant={statusInfo.variant} size="sm" />
              <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: 'auto' }}>
                Tiến độ: <strong>{user.progressPercentage}%</strong>
              </span>
            </div>

            {/* Mini Progress Track */}
            <div className="table-progress-bar" style={{ height: '4px' }}>
              <div
                className="table-progress-fill"
                style={{ width: `${user.progressPercentage}%` }}
              />
            </div>

            <div className="user-mobile-meta-grid">
              <div>
                <span>Tham gia: </span>
                <strong style={{ color: 'var(--foreground)' }}>{user.joinedAt}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span>Hoạt động: </span>
                <strong style={{ color: 'var(--foreground)' }}>{user.lastActiveAt}</strong>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
