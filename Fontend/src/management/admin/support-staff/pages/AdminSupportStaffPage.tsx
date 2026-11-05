import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, Pagination, ConfirmDialog, EmptyState, ToastNotification, type ToastMessage } from '../../../shared/components';
import type {
  CreateSupportStaffDTO,
  SupportStaffDetail,
  SupportStaffFilters,
  SupportStaffListItem,
  SupportStaffSort,
  SupportStaffSortField,
  SupportWorkStatus,
  UpdateSupportStaffDTO,
} from '../types/support-staff.types';
import { adminSupportStaffService } from '../services/support-staff.service';
import {
  SupportStaffSummaryStrip,
  SupportStaffToolbar,
  SupportStaffTable,
  SupportStaffCardList,
  SupportStaffDetailDrawer,
  CreateSupportStaffModal,
  ChangeWorkStatusModal,
} from '../components';
import '../components/support-staff-management.css';

export const AdminSupportStaffPage: React.FC = () => {
  // 1. Filter and search state
  const [filters, setFilters] = useState<SupportStaffFilters>({
    search: '',
    accountStatus: 'ALL',
    workStatus: 'ALL',
    supportScope: 'ALL',
    shift: 'ALL',
  });

  // 2. Pagination state (default: 20 per specification)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
  });

  // 3. Sorting state (default: joinedDate desc)
  const [sort, setSort] = useState<SupportStaffSort>({
    field: 'joinedDate',
    direction: 'desc',
  });

  // 4. Data states with reactive version trigger
  const [dataVersion, setDataVersion] = useState(0);

  const paginatedData = useMemo(() => {
    void dataVersion;
    return adminSupportStaffService.getStaff(filters, pagination, sort);
  }, [filters, pagination, sort, dataVersion]);

  const kpis = useMemo(() => {
    void dataVersion;
    return adminSupportStaffService.getKPIs();
  }, [dataVersion]);

  // 5. Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<SupportStaffDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 6. Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusTargetStaff, setStatusTargetStaff] = useState<
    SupportStaffListItem | SupportStaffDetail | null
  >(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [lockTargetStaff, setLockTargetStaff] = useState<
    SupportStaffListItem | SupportStaffDetail | null
  >(null);
  const [isConfirmLockOpen, setIsConfirmLockOpen] = useState(false);
  const [targetDeleteStaff, setTargetDeleteStaff] = useState<
    SupportStaffListItem | SupportStaffDetail | null
  >(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const triggerRefresh = useCallback(() => {
    adminSupportStaffService.syncFromBackend().finally(() => {
      setDataVersion((v) => v + 1);
    });
  }, []);

  useEffect(() => {
    triggerRefresh();
  }, [triggerRefresh]);

  // Handle Toolbar filters change
  const handleFilterChange = (newFilters: SupportStaffFilters) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      accountStatus: 'ALL',
      workStatus: 'ALL',
      supportScope: 'ALL',
      shift: 'ALL',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Sorting
  const handleSortChange = (field: SupportStaffSortField) => {
    setSort((prev) => {
      if (prev.field === field) {
        return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { field, direction: 'asc' };
    });
  };

  // Multi-select checkboxes
  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedData.items.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectStaff = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Drawer interactions
  const handleSelectStaff = (staff: SupportStaffListItem | SupportStaffDetail) => {
    const fullDetail = adminSupportStaffService.getStaffById(staff.id);
    if (fullDetail) {
      setSelectedStaff(fullDetail);
      setIsDrawerOpen(true);
    }
  };

  const handleEditStaff = (staff: SupportStaffListItem | SupportStaffDetail) => {
    const fullDetail = adminSupportStaffService.getStaffById(staff.id);
    if (fullDetail) {
      setSelectedStaff(fullDetail);
      setIsDrawerOpen(true);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleSaveEdit = async (id: string, dto: UpdateSupportStaffDTO) => {
    try {
      const updated = await adminSupportStaffService.updateStaff(id, dto);
      setSelectedStaff(updated);
      setToast({
        type: 'success',
        message: `Đã cập nhật thông tin nhân viên ${updated.name} thành công!`,
      });
      triggerRefresh();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Không thể cập nhật nhân viên.',
      });
    }
  };

  // Dedicated Work Status Modal Interaction
  const handleOpenWorkStatusModal = (
    staff: SupportStaffListItem | SupportStaffDetail
  ) => {
    setStatusTargetStaff(staff);
    setIsStatusModalOpen(true);
  };

  const handleConfirmWorkStatus = (
    staffId: string,
    newStatus: SupportWorkStatus
  ) => {
    const updated = adminSupportStaffService.setWorkStatus(staffId, newStatus);
    if (selectedStaff?.id === staffId) {
      setSelectedStaff(updated);
    }
    setToast({
      type: 'success',
      message: 'Đã cập nhật trạng thái ca trực thành công.',
    });
    triggerRefresh();
  };

  // Account Lock / Unlock Dialog (Independent from Work Status)
  const handleToggleLockAccount = (
    staff: SupportStaffListItem | SupportStaffDetail
  ) => {
    setLockTargetStaff(staff);
    setIsConfirmLockOpen(true);
  };

  const handleConfirmLockToggle = async () => {
    if (!lockTargetStaff) return;

    try {
      if (lockTargetStaff.accountStatus === 'LOCKED') {
        const updated = await adminSupportStaffService.unlockAccount(lockTargetStaff.id);
        if (selectedStaff?.id === lockTargetStaff.id) {
          setSelectedStaff(updated);
        }
        setToast({
          type: 'success',
          message: `Đã mở khóa tài khoản ${lockTargetStaff.name}.`,
        });
      } else {
        const updated = await adminSupportStaffService.lockAccount(
          lockTargetStaff.id,
          'Tài khoản bị khóa bởi quản trị viên hệ thống.'
        );
        if (selectedStaff?.id === lockTargetStaff.id) {
          setSelectedStaff(updated);
        }
        setToast({
          type: 'success',
          message: `Đã khóa tài khoản ${lockTargetStaff.name}.`,
        });
      }
      triggerRefresh();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Không thể khóa/mở khóa tài khoản.',
      });
    } finally {
      setIsConfirmLockOpen(false);
      setLockTargetStaff(null);
    }
  };

  // Soft-delete Confirmation
  const handleOpenDeleteConfirmation = (staff: SupportStaffListItem | SupportStaffDetail) => {
    setTargetDeleteStaff(staff);
    setIsConfirmDeleteOpen(true);
  };

  const handleExecuteDeleteStaff = async () => {
    if (!targetDeleteStaff) return;
    try {
      await adminSupportStaffService.deleteStaff(targetDeleteStaff.id);
      setToast({
        type: 'success',
        message: `Đã vô hiệu hóa tài khoản ${targetDeleteStaff.name} thành công.`,
      });
      setIsConfirmDeleteOpen(false);
      setTargetDeleteStaff(null);
      if (selectedStaff?.id === targetDeleteStaff.id) {
        setIsDrawerOpen(false);
        setSelectedStaff(null);
      }
      triggerRefresh();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Không thể xóa tài khoản.',
      });
    }
  };

  // Create Support Staff
  const handleCreateStaff = async (dto: CreateSupportStaffDTO) => {
    try {
      const created = await adminSupportStaffService.createStaff(dto);
      setToast({
        type: 'success',
        message: `Đã tạo nhân viên ${created.name} (${created.email}) thành công!`,
      });
      triggerRefresh();
      setSelectedStaff(created);
      setIsDrawerOpen(true);
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Không thể tạo nhân viên.',
      });
      throw err;
    }
  };

  return (
    <div className="support-staff-container">
      {/* 1. Page Header */}
      <PageHeader
        title="Quản lý nhân viên hỗ trợ"
        subtitle="Quản lý tài khoản, phân ca làm việc, phạm vi hỗ trợ và hiệu suất giải quyết ticket của đội ngũ CSKH."
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={15} style={{ display: 'inline', marginRight: 4 }} />
            Thêm nhân viên hỗ trợ
          </button>
        }
      />

      {/* 2. Compact Support Summary Strip */}
      <SupportStaffSummaryStrip kpis={kpis} />

      {/* 3. Search and Multi-filter Toolbar */}
      <SupportStaffToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* 4. Table / Mobile Card List Content */}
      {paginatedData.totalItems === 0 ? (
        <EmptyState
          title="Không tìm thấy nhân viên hỗ trợ phù hợp"
          description="Không có nhân viên hỗ trợ nào khớp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại. Thử đặt lại bộ lọc để xem toàn bộ danh sách."
          action={
            <button
              type="button"
              className="ds-btn ds-btn-outline ds-btn-sm"
              onClick={handleResetFilters}
            >
              Đặt lại bộ lọc
            </button>
          }
        />
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <SupportStaffTable
            staffList={paginatedData.items}
            selectedIds={selectedIds}
            onToggleSelectAll={handleToggleSelectAll}
            onToggleSelectStaff={handleToggleSelectStaff}
            selectedStaffId={selectedStaff?.id || null}
            onSelectStaff={handleSelectStaff}
            onEditStaff={handleEditStaff}
            onChangeWorkStatus={handleOpenWorkStatusModal}
            onToggleLockAccount={handleToggleLockAccount}
            onDeleteStaff={handleOpenDeleteConfirmation}
            sort={sort}
            onSortChange={handleSortChange}
          />

          {/* Mobile Card List View (< 768px) */}
          <SupportStaffCardList
            staffList={paginatedData.items}
            onSelectStaff={handleSelectStaff}
            onEditStaff={handleEditStaff}
            onChangeWorkStatus={handleOpenWorkStatusModal}
            onToggleLockAccount={handleToggleLockAccount}
          />

          {/* Pagination */}
          <Pagination
            currentPage={paginatedData.currentPage}
            totalPages={paginatedData.totalPages}
            totalItems={paginatedData.totalItems}
            pageSize={paginatedData.pageSize}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            onPageSizeChange={(pageSize) =>
              setPagination({ page: 1, pageSize })
            }
          />
        </>
      )}

      {/* 5. Wide Detail Drawer (560px) */}
      <SupportStaffDetailDrawer
        isOpen={isDrawerOpen}
        staff={selectedStaff}
        onClose={handleCloseDrawer}
        onSaveEdit={handleSaveEdit}
        onChangeWorkStatus={handleOpenWorkStatusModal}
        onToggleLockAccount={handleToggleLockAccount}
        onDelete={handleOpenDeleteConfirmation}
      />

      {/* Soft-delete confirmation */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        title={`Vô hiệu hóa tài khoản ${targetDeleteStaff?.name || ''}?`}
        message="Tài khoản nhân viên sẽ bị vô hiệu hóa và chuyển sang trạng thái ngưng hoạt động. Lịch sử hỗ trợ ticket được bảo lưu."
        confirmLabel="Vô hiệu hóa tài khoản"
        cancelLabel="Hủy bỏ"
        isDestructive={true}
        onConfirm={handleExecuteDeleteStaff}
        onCancel={() => {
          setIsConfirmDeleteOpen(false);
          setTargetDeleteStaff(null);
        }}
      />

      {/* Toast Notification */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* 6. Create Support Staff Modal */}
      <CreateSupportStaffModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateStaff}
      />

      {/* 7. Dedicated Change Work Status Modal */}
      <ChangeWorkStatusModal
        isOpen={isStatusModalOpen}
        staff={statusTargetStaff}
        onClose={() => {
          setIsStatusModalOpen(false);
          setStatusTargetStaff(null);
        }}
        onConfirm={handleConfirmWorkStatus}
      />

      {/* 8. Account Lock / Unlock Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmLockOpen}
        title={
          lockTargetStaff?.accountStatus === 'LOCKED'
            ? 'Mở khóa tài khoản nhân viên'
            : 'Khóa tài khoản nhân viên'
        }
        message={
          lockTargetStaff?.accountStatus === 'LOCKED'
            ? `Bạn có chắc chắn muốn mở khóa tài khoản cho ${lockTargetStaff?.name}? Nhân viên sẽ có thể đăng nhập lại hệ thống ngay lập tức.`
            : `Bạn có chắc chắn muốn khóa tài khoản của ${lockTargetStaff?.name}? Nhân viên sẽ bị ngắt phiên đăng nhập và không thể truy cập hệ thống cho đến khi được mở khóa lại.`
        }
        confirmLabel={
          lockTargetStaff?.accountStatus === 'LOCKED'
            ? 'Xác nhận mở khóa'
            : 'Xác nhận khóa'
        }
        isDestructive={lockTargetStaff?.accountStatus !== 'LOCKED'}
        onConfirm={handleConfirmLockToggle}
        onCancel={() => {
          setIsConfirmLockOpen(false);
          setLockTargetStaff(null);
        }}
      />
    </div>
  );
};

export default AdminSupportStaffPage;
