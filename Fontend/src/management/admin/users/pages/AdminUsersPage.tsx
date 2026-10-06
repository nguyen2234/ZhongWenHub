import React, { useState, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, Pagination, ConfirmDialog } from '../../../shared/components';
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
} from '../components';
import '../components/user-management.css';

export const AdminUsersPage: React.FC = () => {
  // 1. Filter and search state
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: 'ALL',
    hskLevel: 'ALL',
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
    // Reference usersVersion to re-evaluate when mock service data changes
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

  // 6. Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [targetLockUser, setTargetLockUser] = useState<UserListItem | UserDetail | null>(null);
  const [isConfirmLockOpen, setIsConfirmLockOpen] = useState(false);

  const triggerRefresh = useCallback(() => {
    setUsersVersion((v) => v + 1);
  }, []);

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
  const handleSelectUser = (user: UserListItem) => {
    const fullDetail = adminUserService.getUserById(user.id);
    if (fullDetail) {
      setSelectedUser(fullDetail);
      setIsDrawerOpen(true);
    }
  };

  const handleEditFromTable = (user: UserListItem) => {
    const fullDetail = adminUserService.getUserById(user.id);
    if (fullDetail) {
      setSelectedUser(fullDetail);
      setIsDrawerOpen(true);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Save edit in Drawer
  const handleSaveEdit = (id: string, dto: UpdateUserDTO) => {
    const updated = adminUserService.updateUser(id, dto);
    setSelectedUser(updated);
    triggerRefresh();
  };

  // Lock / Unlock Confirmation
  const handleOpenLockConfirmation = (user: UserListItem | UserDetail) => {
    setTargetLockUser(user);
    setIsConfirmLockOpen(true);
  };

  const handleExecuteLockToggle = () => {
    if (!targetLockUser) return;

    let updated: UserDetail;
    if (targetLockUser.status === 'LOCKED') {
      updated = adminUserService.unlockUser(targetLockUser.id);
    } else {
      updated = adminUserService.lockUser(
        targetLockUser.id,
        'Tài khoản bị tạm khóa theo yêu cầu kiểm tra của Quản trị viên.'
      );
    }

    if (selectedUser?.id === targetLockUser.id) {
      setSelectedUser(updated);
    }

    setIsConfirmLockOpen(false);
    setTargetLockUser(null);
    triggerRefresh();
  };

  // Create User
  const handleCreateUser = (dto: CreateUserDTO) => {
    const created = adminUserService.createUser(dto);
    triggerRefresh();
    setSelectedUser(created);
    setIsDrawerOpen(true);
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
        message: `Học viên sẽ có thể đăng nhập trở lại và tiếp tục truy cập các bài học trên ZhongWenHub.`,
        confirmLabel: 'Mở khóa tài khoản',
        isDestructive: false,
      };
    }

    return {
      title: `Khóa tài khoản ${targetLockUser.name}?`,
      message: `Học viên sẽ không thể đăng nhập cho đến khi tài khoản được mở khóa lại. Toàn bộ tiến độ học tập và SRS vẫn được bảo lưu an toàn.`,
      confirmLabel: 'Khóa tài khoản',
      isDestructive: true,
    };
  }, [targetLockUser]);

  return (
    <div className="user-management-container">
      {/* 1. Page Header */}
      <PageHeader
        title="Quản lý người dùng"
        subtitle="Quản lý tài khoản học viên và trạng thái sử dụng hệ thống đào tạo ZhongWenHub."
        actions={
          <button
            type="button"
            className="ds-btn ds-btn-primary ds-btn-sm"
            onClick={() => setIsCreateModalOpen(true)}
            aria-label="Thêm học viên mới"
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
        itemLabel="học viên"
      />

      {/* 7. Slide-over User Detail Drawer */}
      <UserDetailDrawer
        isOpen={isDrawerOpen}
        user={selectedUser}
        onClose={handleCloseDrawer}
        onSaveEdit={handleSaveEdit}
        onToggleLock={handleOpenLockConfirmation}
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

      {/* 9. Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUser}
      />
    </div>
  );
};

export default AdminUsersPage;
