import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { PageHeader, Pagination, ConfirmDialog, ToastNotification, type ToastMessage } from '../../../shared/components';
import type {
  CreateUserDTO,
  UpdateUserDTO,
  UserDetail,
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
  UserDetailDrawer,
  CreateUserModal,
  ResetPasswordModal,
  AdjustWalletModal,
  UpdateSubscriptionModal,
} from '../components';
import '../components/user-management.css';

export const AdminUsersPage: React.FC = () => {
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
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 6. Modal and notification states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [targetLockUser, setTargetLockUser] = useState<UserListItem | UserDetail | null>(null);
  const [isConfirmLockOpen, setIsConfirmLockOpen] = useState(false);
  const [targetDeleteUser, setTargetDeleteUser] = useState<UserListItem | UserDetail | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // New Upgrade Modals
  const [targetResetUser, setTargetResetUser] = useState<UserListItem | UserDetail | null>(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);

  const [targetWalletUser, setTargetWalletUser] = useState<UserListItem | UserDetail | null>(null);
  const [isAdjustWalletOpen, setIsAdjustWalletOpen] = useState(false);

  const [targetSubUser, setTargetSubUser] = useState<UserListItem | UserDetail | null>(null);
  const [isUpdateSubOpen, setIsUpdateSubOpen] = useState(false);

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

  // Drawer interactions
  const handleSelectUser = async (user: UserListItem) => {
    // Attempt to load rich details with transactions from backend
    try {
      const detailed = await adminUserService.getUserDetailAsync(user.id);
      setSelectedUser(detailed);
    } catch {
      const local = adminUserService.getUserById(user.id);
      setSelectedUser(local || null);
    }
    setIsDrawerOpen(true);
  };

  const handleEditFromTable = (user: UserListItem) => {
    handleSelectUser(user);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Save edit in Drawer
  const handleSaveEdit = async (id: string, dto: UpdateUserDTO) => {
    try {
      const updated = await adminUserService.updateUser(id, dto);
      setToast({
        type: 'success',
        message: `Đã cập nhật thông tin người dùng ${updated.name} thành công!`,
      });
      setSelectedUser(updated);
      triggerRefresh();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Không thể cập nhật người dùng.',
      });
      throw err;
    }
  };

  // Lock / Unlock Confirmation
  const handleOpenLockConfirmation = (user: UserListItem | UserDetail) => {
    setTargetLockUser(user);
    setIsConfirmLockOpen(true);
  };

  const handleExecuteLockToggle = async () => {
    if (!targetLockUser) return;

    try {
      let updated: UserDetail;
      if (targetLockUser.status === 'LOCKED') {
        updated = await adminUserService.unlockUser(targetLockUser.id);
        setToast({
          type: 'success',
          message: `Đã mở khóa tài khoản ${targetLockUser.name} thành công.`,
        });
      } else {
        updated = await adminUserService.lockUser(
          targetLockUser.id,
          'Tài khoản bị tạm khóa theo yêu cầu kiểm tra của Quản trị viên.'
        );
        setToast({
          type: 'success',
          message: `Đã khóa tài khoản ${targetLockUser.name}. Phiên đăng nhập đã bị vô hiệu.`,
        });
      }

      if (selectedUser?.id === targetLockUser.id) {
        setSelectedUser(updated);
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

  // Delete / Deactivate Confirmation
  const handleOpenDeleteConfirmation = (user: UserListItem | UserDetail) => {
    setTargetDeleteUser(user);
    setIsConfirmDeleteOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!targetDeleteUser) return;

    try {
      await adminUserService.deleteUser(targetDeleteUser.id);
      setToast({
        type: 'success',
        message: `Đã vô hiệu hóa tài khoản ${targetDeleteUser.name} thành công.`,
      });
      setIsConfirmDeleteOpen(false);
      setTargetDeleteUser(null);
      if (selectedUser?.id === targetDeleteUser.id) {
        setIsDrawerOpen(false);
        setSelectedUser(null);
      }
      triggerRefresh();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Không thể vô hiệu hóa tài khoản này.',
      });
    }
  };

  // Reset Password Handlers
  const handleOpenResetPassword = (user: UserListItem | UserDetail) => {
    setTargetResetUser(user);
    setIsResetPasswordOpen(true);
  };

  const handleConfirmResetPassword = async (password: string) => {
    if (!targetResetUser) return;
    try {
      const res = await adminUserService.resetPasswordAsync(targetResetUser.id, {
        newPassword: password,
        confirmPassword: password,
      });
      setToast({
        type: 'success',
        message: res.message || `Đã đặt lại mật khẩu cho tài khoản ${targetResetUser.name} thành công!`,
      });
      setIsResetPasswordOpen(false);
      setTargetResetUser(null);
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Không thể đặt lại mật khẩu.',
      });
      throw err;
    }
  };

  // Adjust Wallet Handlers
  const handleOpenAdjustWallet = (user: UserListItem | UserDetail) => {
    setTargetWalletUser(user);
    setIsAdjustWalletOpen(true);
  };

  const handleConfirmAdjustWallet = async (userId: string, amount: number, reason: string) => {
    try {
      const res = await adminUserService.adjustWalletBalanceAsync(userId, { amount, reason });
      setToast({
        type: 'success',
        message: res.message || 'Đã điều chỉnh số dư ví thành công!',
      });
      setIsAdjustWalletOpen(false);
      setTargetWalletUser(null);
      triggerRefresh();
      if (selectedUser?.id === userId) {
        const fresh = await adminUserService.getUserDetailAsync(userId);
        setSelectedUser(fresh);
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Không thể điều chỉnh số dư.',
      });
      throw err;
    }
  };

  // Update Subscription Handlers
  const handleOpenUpdateSubscription = (user: UserListItem | UserDetail) => {
    setTargetSubUser(user);
    setIsUpdateSubOpen(true);
  };

  const handleConfirmUpdateSubscription = async (userId: string, plan: string, durationMonths: number) => {
    try {
      const res = await adminUserService.updateSubscriptionPlanAsync(userId, {
        plan,
        durationMonths,
      });
      setToast({
        type: 'success',
        message: res.message || 'Đã cập nhật gói hội viên thành công!',
      });
      setIsUpdateSubOpen(false);
      setTargetSubUser(null);
      triggerRefresh();
      if (selectedUser?.id === userId) {
        const fresh = await adminUserService.getUserDetailAsync(userId);
        setSelectedUser(fresh);
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Không thể cập nhật gói.',
      });
      throw err;
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
      triggerRefresh();
      setSelectedUser(created);
      setIsDrawerOpen(true);
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

    const isLocked = targetLockUser.status === 'LOCKED';
    if (isLocked) {
      return {
        title: `Mở khóa tài khoản ${targetLockUser.name}?`,
        message: `Người dùng sẽ có thể đăng nhập trở lại và tiếp tục sử dụng hệ thống đào tạo ZhongWenHub.`,
        confirmLabel: 'Mở khóa tài khoản',
        isDestructive: false,
      };
    }

    return {
      title: `Khóa tài khoản ${targetLockUser.name}?`,
      message: `Người dùng sẽ không thể đăng nhập cho đến khi tài khoản được mở khóa lại. Toàn bộ tiến độ học tập và dữ liệu vẫn được bảo lưu an toàn.`,
      confirmLabel: 'Khóa tài khoản',
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

      {/* 4. Data Table (Desktop >=768px) */}
      <UserTable
        users={paginatedData.items}
        selectedUserId={isDrawerOpen ? selectedUser?.id : undefined}
        selectedIds={selectedIds}
        onToggleSelectAll={handleToggleSelectAll}
        onToggleSelectUser={handleToggleSelectUser}
        onSelectUser={handleSelectUser}
        onEditUser={handleEditFromTable}
        onLockUnlockUser={handleOpenLockConfirmation}
        onDeleteUser={handleOpenDeleteConfirmation}
        onResetPassword={handleOpenResetPassword}
        onAdjustWallet={handleOpenAdjustWallet}
        onUpdateSubscription={handleOpenUpdateSubscription}
        sort={sort}
        onSortChange={handleSortChange}
        onResetFilters={handleResetFilters}
      />

      {/* 5. Mobile Cards View (<768px) */}
      <UserCardList
        users={paginatedData.items}
        selectedUserId={isDrawerOpen ? selectedUser?.id : undefined}
        onSelectUser={handleSelectUser}
        onEditUser={handleEditFromTable}
        onLockUnlockUser={handleOpenLockConfirmation}
        onResetPassword={handleOpenResetPassword}
        onAdjustWallet={handleOpenAdjustWallet}
        onUpdateSubscription={handleOpenUpdateSubscription}
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

      {/* 7. Slide-over User Detail Drawer */}
      <UserDetailDrawer
        isOpen={isDrawerOpen}
        user={selectedUser}
        onClose={handleCloseDrawer}
        onSaveEdit={handleSaveEdit}
        onToggleLock={handleOpenLockConfirmation}
        onDelete={handleOpenDeleteConfirmation}
        onResetPassword={handleOpenResetPassword}
        onAdjustWallet={handleOpenAdjustWallet}
        onUpdateSubscription={handleOpenUpdateSubscription}
      />

      {/* 8. Destructive Action Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmLockOpen}
        title={confirmDialogProps.title}
        message={confirmDialogProps.message}
        confirmLabel={confirmDialogProps.confirmLabel}
        isDestructive={confirmDialogProps.isDestructive}
        onConfirm={handleExecuteLockToggle}
        onCancel={() => setIsConfirmLockOpen(false)}
      />

      {/* 9. Soft-delete / Deactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        title={`Vô hiệu hóa tài khoản ${targetDeleteUser?.name || ''}?`}
        message="Tài khoản sẽ bị vô hiệu hóa và chuyển sang trạng thái ngưng hoạt động. Toàn bộ tiến độ học tập và dữ liệu lịch sử được bảo lưu an toàn."
        confirmLabel="Vô hiệu hóa tài khoản"
        cancelLabel="Hủy bỏ"
        isDestructive={true}
        onConfirm={handleExecuteDelete}
        onCancel={() => {
          setIsConfirmDeleteOpen(false);
          setTargetDeleteUser(null);
        }}
      />

      {/* 10. Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUser}
      />

      {/* 11. Reset Password Modal */}
      <ResetPasswordModal
        isOpen={isResetPasswordOpen}
        user={targetResetUser}
        onClose={() => {
          setIsResetPasswordOpen(false);
          setTargetResetUser(null);
        }}
        onConfirm={handleConfirmResetPassword}
      />

      {/* 12. Adjust Wallet Balance Modal */}
      <AdjustWalletModal
        isOpen={isAdjustWalletOpen}
        user={targetWalletUser}
        onClose={() => {
          setIsAdjustWalletOpen(false);
          setTargetWalletUser(null);
        }}
        onConfirm={handleConfirmAdjustWallet}
      />

      {/* 13. Update Subscription Plan Modal */}
      <UpdateSubscriptionModal
        isOpen={isUpdateSubOpen}
        user={targetSubUser}
        onClose={() => {
          setIsUpdateSubOpen(false);
          setTargetSubUser(null);
        }}
        onConfirm={handleConfirmUpdateSubscription}
      />

      {/* 14. Toast Notification */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default AdminUsersPage;
