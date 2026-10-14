import React, { useState, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, Pagination, ConfirmDialog, EmptyState } from '../../../shared/components';
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

  const triggerRefresh = useCallback(() => {
    setDataVersion((v) => v + 1);
  }, []);

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

  const handleSaveEdit = (id: string, dto: UpdateSupportStaffDTO) => {
    const updated = adminSupportStaffService.updateStaff(id, dto);
    setSelectedStaff(updated);
    triggerRefresh();
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
    triggerRefresh();
  };

  // Account Lock / Unlock Dialog (Independent from Work Status)
  const handleToggleLockAccount = (
    staff: SupportStaffListItem | SupportStaffDetail
  ) => {
    setLockTargetStaff(staff);
    setIsConfirmLockOpen(true);
  };

  const handleConfirmLockToggle = () => {
    if (!lockTargetStaff) return;

    if (lockTargetStaff.accountStatus === 'LOCKED') {
      const updated = adminSupportStaffService.unlockAccount(lockTargetStaff.id);
      if (selectedStaff?.id === lockTargetStaff.id) {
        setSelectedStaff(updated);
      }
    } else {
      const updated = adminSupportStaffService.lockAccount(
        lockTargetStaff.id,
        'Tài khoản bị khóa bởi quản trị viên hệ thống.'
      );
      if (selectedStaff?.id === lockTargetStaff.id) {
        setSelectedStaff(updated);
      }
    }
    triggerRefresh();
    setIsConfirmLockOpen(false);
    setLockTargetStaff(null);
  };

  // Create Support Staff
  const handleCreateStaff = (dto: CreateSupportStaffDTO) => {
    const created = adminSupportStaffService.createStaff(dto);
    triggerRefresh();
    // Open drawer to review newly created staff
    setSelectedStaff(created);
    setIsDrawerOpen(true);
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
      />

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
