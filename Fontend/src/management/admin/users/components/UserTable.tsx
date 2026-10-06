import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, ArrowUpDown, ShieldAlert, ShieldCheck, Eye, Edit3 } from 'lucide-react';
import type { UserListItem, UserSort, UserSortField } from '../types/user.types';
import { StatusBadge, EmptyState } from '../../../shared/components';

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
  selectedUserId,
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
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [activeMenuId]);

  const allSelected = users.length > 0 && users.every((u) => selectedIds.includes(u.id));
  const someSelected = users.some((u) => selectedIds.includes(u.id)) && !allSelected;

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

  const renderSortableHeader = (field: UserSortField, label: string) => {
    const isSorted = sort?.field === field;
    return (
      <button
        type="button"
        onClick={() => onSortChange && onSortChange(field)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          padding: 0,
          font: 'inherit',
          color: isSorted ? 'var(--primary)' : 'inherit',
          fontWeight: isSorted ? 700 : 600,
          cursor: 'pointer',
        }}
        aria-label={`Sắp xếp theo ${label}`}
      >
        {label}
        <ArrowUpDown size={12} style={{ opacity: isSorted ? 1 : 0.4 }} />
      </button>
    );
  };

  return (
    <div className="user-table-desktop">
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
            <th style={{ width: '40px', padding: '10px 14px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={(e) => onToggleSelectAll(e.target.checked)}
                aria-label="Chọn tất cả học viên trong trang"
                style={{ cursor: 'pointer' }}
              />
            </th>
            <th style={{ padding: '10px 14px', minWidth: '220px' }}>
              {renderSortableHeader('name', 'Học viên')}
            </th>
            <th style={{ padding: '10px 14px', width: '90px' }}>
              {renderSortableHeader('hskLevel', 'Trình độ')}
            </th>
            <th style={{ padding: '10px 14px', width: '120px' }}>Trạng thái</th>
            <th style={{ padding: '10px 14px', width: '140px' }}>
              {renderSortableHeader('progress', 'Tiến độ học')}
            </th>
            <th style={{ padding: '10px 14px', width: '130px' }}>
              {renderSortableHeader('joinedDate', 'Ngày tham gia')}
            </th>
            <th style={{ padding: '10px 14px', width: '140px' }}>
              {renderSortableHeader('lastActive', 'Hoạt động gần nhất')}
            </th>
            <th style={{ padding: '10px 14px', width: '60px', textAlign: 'center' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ padding: '24px', textAlign: 'center' }}>
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
              </td>
            </tr>
          ) : (
            users.map((user) => {
              const isSelected = selectedUserId === user.id;
              const isChecked = selectedIds.includes(user.id);
              const statusInfo = getStatusVariant(user.status);
              const isMenuOpen = activeMenuId === user.id;

              return (
                <tr
                  key={user.id}
                  className={`user-table-row ${isSelected ? 'active-row' : ''}`.trim()}
                  onClick={() => onSelectUser(user)}
                >
                  {/* Checkbox */}
                  <td
                    style={{ padding: '12px 14px', textAlign: 'center' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onToggleSelectUser(user.id, e.target.checked)}
                      aria-label={`Chọn học viên ${user.name}`}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>

                  {/* Profile info */}
                  <td style={{ padding: '12px 14px' }}>
                    <div className="user-cell-profile">
                      <div className="user-avatar-badge">{getInitials(user.name)}</div>
                      <div>
                        <div className="user-name-title">{user.name}</div>
                        <div className="user-email-subtitle">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* HSK Level */}
                  <td style={{ padding: '12px 14px' }}>
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
                  </td>

                  {/* Status Badge */}
                  <td style={{ padding: '12px 14px' }}>
                    <StatusBadge
                      label={statusInfo.label}
                      variant={statusInfo.variant}
                      size="sm"
                    />
                  </td>

                  {/* Progress */}
                  <td style={{ padding: '12px 14px' }}>
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
                  </td>

                  {/* Joined Date */}
                  <td style={{ padding: '12px 14px', color: 'var(--muted)', fontSize: '11px' }}>
                    {user.joinedAt}
                  </td>

                  {/* Last Active */}
                  <td style={{ padding: '12px 14px', color: 'var(--muted)', fontSize: '11px' }}>
                    {user.lastActiveAt}
                  </td>

                  {/* Action Menu */}
                  <td
                    style={{ padding: '12px 14px', textAlign: 'center' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="action-menu-wrapper" ref={isMenuOpen ? menuRef : null}>
                      <button
                        type="button"
                        className="btn-row-action"
                        onClick={() => setActiveMenuId(isMenuOpen ? null : user.id)}
                        aria-label={`Thao tác với ${user.name}`}
                        aria-expanded={isMenuOpen}
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {isMenuOpen && (
                        <div className="action-dropdown-popover" role="menu">
                          <button
                            type="button"
                            className="action-menu-item"
                            onClick={() => {
                              setActiveMenuId(null);
                              onSelectUser(user);
                            }}
                            role="menuitem"
                          >
                            <Eye size={13} style={{ color: 'var(--muted)' }} />
                            Xem chi tiết
                          </button>
                          <button
                            type="button"
                            className="action-menu-item"
                            onClick={() => {
                              setActiveMenuId(null);
                              onEditUser(user);
                            }}
                            role="menuitem"
                          >
                            <Edit3 size={13} style={{ color: 'var(--muted)' }} />
                            Chỉnh sửa
                          </button>
                          <div className="action-menu-separator" />
                          <button
                            type="button"
                            className={`action-menu-item ${user.status === 'LOCKED' ? '' : 'danger'}`.trim()}
                            onClick={() => {
                              setActiveMenuId(null);
                              onLockUnlockUser(user);
                            }}
                            role="menuitem"
                          >
                            {user.status === 'LOCKED' ? (
                              <>
                                <ShieldCheck size={13} style={{ color: '#16a34a' }} />
                                Mở khóa tài khoản
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
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
