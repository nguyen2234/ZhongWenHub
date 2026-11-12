import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { PageHeader, Pagination, ConfirmDialog, ToastNotification, type ToastMessage } from '../../../shared/components';
import type {
  CreateUserDTO,
  UserFilters,
  UserListItem,
  UserSort,
  UserSortField,
} from '../types/user.types';
import { adminUserService } from '../services/user.service';
import {
  UserSummaryStrip,
  UserToolbar,
  UserTable,
  UserCardList,
  CreateUserModal,
} from '../components';
import '../components/user-management.css';

const isSoleAdmin = (user: UserListItem) => {
  return (
    user.email.toLowerCase() === 'admin@gmail.com' ||
    user.roles?.includes('ADMIN') ||
    user.role === 'ADMIN'
  );
};

export const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();

  // 1. Filter and search state
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: 'ALL',
    hskLevel: 'ALL',
    role: 'ALL',
  });

  // 2. Pagination state (default: 20 per specification)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
  });

  // 3. Sorting state
  const [sort, setSort] = useState<UserSort>({
    field: 'joinedDate',
    direction: 'desc',
  });

  // 4. Data states with reactive version trigger
  const [usersVersion, setUsersVersion] = useState(0);

  const paginatedData = useMemo(() => {
    if (usersVersion < 0) return adminUserService.getUsers(filters, pagination, sort);
    return adminUserService.getUsers(filters, pagination, sort);
  }, [filters, pagination, sort, usersVersion]);

  const kpis = useMemo(() => {
    if (usersVersion < 0) return adminUserService.getKPIs();
    return adminUserService.getKPIs();
  }, [usersVersion]);

  // 5. Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 6. Modal and notification states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [targetLockUser, setTargetLockUser] = useState<UserListItem | null>(null);
  const [isConfirmLockOpen, setIsConfirmLockOpen] = useState(false);

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);

  const triggerRefresh = useCallback(() => {
    setIsSyncing(true);
    setSyncError(null);
    adminUserService
      .syncFromBackend()
      .then((res) => {
        if (!res.success) {
          setSyncError(res.error || 'Lỗi tải dữ liệu người dùng.');
        } else {
          setSyncError(null);
        }
      })
      .catch((err) => {
        setSyncError(err?.message || 'Lỗi kết nối máy chủ.');
      })
      .finally(() => {
        setIsSyncing(false);
        setUsersVersion((v) => v + 1);
      });
  }, []);

  useEffect(() => {
    triggerRefresh();
  }, [triggerRefresh]);

  // Handle Toolbar filters change
  const handleFilterChange = (newFilters: UserFilters) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      hskLevel: 'ALL',
      role: 'ALL',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Sorting
  const handleSortChange = (field: UserSortField) => {
    setSort((prev) => {
      if (prev.field === field) {
        return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { field, direction: 'asc' };
    });
  };

  // Checkbox multi-select
  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedData.items.map((u: UserListItem) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectUser = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Page-based Navigation (Separate Pages instead of Drawer)
  const handleSelectUser = (user: UserListItem) => {
    navigate(`/management/admin/users/${user.id}`);
  };

  const handleEditFromTable = (user: UserListItem) => {
    navigate(`/management/admin/users/${user.id}/edit`);
  };

  // Lock / Unlock Confirmation
  const handleOpenLockConfirmation = (user: UserListItem) => {
    if (isSoleAdmin(user)) {
      setToast({
        type: 'error',
        message: 'Không thể vô hiệu hóa tài khoản Quản trị viên duy nhất trong hệ thống.',
      });
      return;
    }
    setTargetLockUser(user);
    setIsConfirmLockOpen(true);
  };

  const handleExecuteLockToggle = async () => {
    if (!targetLockUser) return;
    if (isSoleAdmin(targetLockUser)) {
      setToast({
        type: 'error',
        message: 'Không thể vô hiệu hóa tài khoản Quản trị viên duy nhất trong hệ thống.',
      });
      setIsConfirmLockOpen(false);
      return;
    }

    try {
      const isDeactivated = targetLockUser.status === 'LOCKED' || targetLockUser.status === 'INACTIVE';
      if (isDeactivated) {
        await adminUserService.unlockUser(targetLockUser.id);
        setToast({
          type: 'success',
          message: `Đã kích hoạt lại tài khoản ${targetLockUser.name} thành công.`,
        });
      } else {
        await adminUserService.lockUser(
          targetLockUser.id,
          'Tài khoản bị tạm khóa theo yêu cầu kiểm tra của Quản trị viên.'
        );
        setToast({
          type: 'success',
          message: `Đã vô hiệu hóa tài khoản ${targetLockUser.name}.`,
        });
      }

      setIsConfirmLockOpen(false);
      setTargetLockUser(null);
      triggerRefresh();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Không thể thực hiện thao tác.',
      });
    }
  };

  // Create User
  const handleCreateUser = async (dto: CreateUserDTO) => {
    try {
      const created = await adminUserService.createUser(dto);
      setToast({
        type: 'success',
        message: `Đã tạo tài khoản ${created.name} (${created.email}) thành công!`,
      });
      setIsCreateModalOpen(false);
      triggerRefresh();
      navigate(`/management/admin/users/${created.id}`);
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Không thể tạo tài khoản.',
      });
      throw err;
    }
  };

  const confirmDialogProps = useMemo(() => {
    if (!targetLockUser) {
      return {
        title: '',
        message: '',
        confirmLabel: 'Xác nhận',
        isDestructive: false,
      };
    }

    const isDeactivated = targetLockUser.status === 'LOCKED' || targetLockUser.status === 'INACTIVE';
    if (isDeactivated) {
      return {
        title: `Kích hoạt lại tài khoản ${targetLockUser.name}?`,
        message: `Người dùng sẽ có thể đăng nhập trở lại và tiếp tục sử dụng hệ thống đào tạo ZhongWenHub.`,
        confirmLabel: 'Kích hoạt lại tài khoản',
        isDestructive: false,
      };
    }

    return {
      title: `Vô hiệu hóa tài khoản ${targetLockUser.name}?`,
      message: `Tài khoản sẽ bị vô hiệu hóa (tạm khóa). Người dùng sẽ không thể đăng nhập cho đến khi được kích hoạt lại.`,
      confirmLabel: 'Vô hiệu hóa tài khoản',
      isDestructive: true,
    };
  }, [targetLockUser]);

  return (
    <div className="user-management-container">
      {/* 1. Page Header */}
      <PageHeader
        title="Quản lý người dùng"
        subtitle="Quản lý tài khoản học viên, giáo viên và nhân sự vận hành hệ thống đào tạo ZhongWenHub."
        actions={
          <button
            type="button"
            className="ds-btn ds-btn-primary ds-btn-sm"
            onClick={() => setIsCreateModalOpen(true)}
            aria-label="Thêm người dùng mới"
          >
            <Plus size={16} style={{ marginRight: '6px' }} />
            Thêm người dùng
          </button>
        }
      />

      {/* 2. Compact Contextual Summary Strip */}
      <UserSummaryStrip kpis={kpis} />

      {/* 3. Search & Filter Toolbar */}
      <UserToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* Error Alert with Retry Action */}
      {syncError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-lg)',
            color: '#dc2626',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{syncError}</span>
          </div>
          <button
            type="button"
            className="ds-btn ds-btn-sm"
            onClick={triggerRefresh}
            disabled={isSyncing}
            style={{
              padding: '6px 14px',
              backgroundColor: '#ffffff',
              border: '1px solid #fca5a5',
              color: '#dc2626',
              borderRadius: '6px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
            }}
          >
            <RefreshCw size={14} />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* 4. Data Table (Desktop >=768px) - Strictly 3 Actions: Xem, Sửa, Vô hiệu hóa / Kích hoạt lại */}
      <UserTable
        users={paginatedData.items}
        selectedIds={selectedIds}
        onToggleSelectAll={handleToggleSelectAll}
        onToggleSelectUser={handleToggleSelectUser}
        onSelectUser={handleSelectUser}
        onEditUser={handleEditFromTable}
        onLockUnlockUser={handleOpenLockConfirmation}
        sort={sort}
        onSortChange={handleSortChange}
        onResetFilters={handleResetFilters}
      />

      {/* 5. Mobile Cards View (<768px) */}
      <UserCardList
        users={paginatedData.items}
        onSelectUser={handleSelectUser}
        onEditUser={handleEditFromTable}
        onLockUnlockUser={handleOpenLockConfirmation}
        onResetFilters={handleResetFilters}
      />

      {/* 6. Pagination */}
      <Pagination
        currentPage={paginatedData.currentPage}
        totalPages={paginatedData.totalPages}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        pageSize={paginatedData.pageSize}
        totalItems={paginatedData.totalItems}
        pageSizeOptions={[10, 20, 50]}
        onPageSizeChange={(newSize) =>
          setPagination((prev) => ({ ...prev, pageSize: newSize, page: 1 }))
        }
        itemLabel="người dùng"
      />

      {/* 7. Destructive Action Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmLockOpen}
        title={confirmDialogProps.title}
        message={confirmDialogProps.message}
        confirmLabel={confirmDialogProps.confirmLabel}
        isDestructive={confirmDialogProps.isDestructive}
        onConfirm={handleExecuteLockToggle}
        onCancel={() => setIsConfirmLockOpen(false)}
      />

      {/* 8. Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUser}
      />

      {/* 9. Toast Notification */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default AdminUsersPage;
