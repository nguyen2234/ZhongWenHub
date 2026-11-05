import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, Pagination, ConfirmDialog, EmptyState, ToastNotification, type ToastMessage } from '../../../shared/components';
import type {
  CreateTeacherDTO,
  TeacherDetail,
  TeacherFilters,
  TeacherListItem,
  TeacherSort,
  TeacherSortField,
  TeacherTeachingStatus,
  UpdateTeacherDTO,
} from '../types/teacher.types';
import { adminTeacherService } from '../services/teacher.service';
import {
  TeacherSummaryStrip,
  TeacherToolbar,
  TeacherTable,
  TeacherCardList,
  TeacherDetailDrawer,
  CreateTeacherModal,
  ChangeTeachingStatusModal,
} from '../components';
import '../components/teacher-management.css';

export const AdminTeachersPage: React.FC = () => {
  // 1. Filter and search state
  const [filters, setFilters] = useState<TeacherFilters>({
    search: '',
    accountStatus: 'ALL',
    teachingStatus: 'ALL',
    teachingLevel: 'ALL',
    specialization: 'ALL',
  });

  // 2. Pagination state (default: 20 per specification)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
  });

  // 3. Sorting state (default: joinedDate desc)
  const [sort, setSort] = useState<TeacherSort>({
    field: 'joinedDate',
    direction: 'desc',
  });

  // 4. Data states with reactive version trigger
  const [dataVersion, setDataVersion] = useState(0);

  const paginatedData = useMemo(() => {
    void dataVersion;
    return adminTeacherService.getTeachers(filters, pagination, sort);
  }, [filters, pagination, sort, dataVersion]);

  const kpis = useMemo(() => {
    void dataVersion;
    return adminTeacherService.getKPIs();
  }, [dataVersion]);

  // 5. Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 6. Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusTargetTeacher, setStatusTargetTeacher] = useState<TeacherListItem | TeacherDetail | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [lockTargetTeacher, setLockTargetTeacher] = useState<TeacherListItem | TeacherDetail | null>(null);
  const [isConfirmLockOpen, setIsConfirmLockOpen] = useState(false);
  const [targetDeleteTeacher, setTargetDeleteTeacher] = useState<TeacherListItem | TeacherDetail | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const triggerRefresh = useCallback(() => {
    adminTeacherService.syncFromBackend().finally(() => {
      setDataVersion((v) => v + 1);
    });
  }, []);

  useEffect(() => {
    triggerRefresh();
  }, [triggerRefresh]);

  // Handle Toolbar filters change
  const handleFilterChange = (newFilters: TeacherFilters) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      accountStatus: 'ALL',
      teachingStatus: 'ALL',
      teachingLevel: 'ALL',
      specialization: 'ALL',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Sorting
  const handleSortChange = (field: TeacherSortField) => {
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
      setSelectedIds(paginatedData.items.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectTeacher = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Drawer interactions
  const handleSelectTeacher = (teacher: TeacherListItem | TeacherDetail) => {
    const fullDetail = adminTeacherService.getTeacherById(teacher.id);
    if (fullDetail) {
      setSelectedTeacher(fullDetail);
      setIsDrawerOpen(true);
    }
  };

  const handleEditTeacher = (teacher: TeacherListItem | TeacherDetail) => {
    const fullDetail = adminTeacherService.getTeacherById(teacher.id);
    if (fullDetail) {
      setSelectedTeacher(fullDetail);
      setIsDrawerOpen(true);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleSaveEdit = async (id: string, dto: UpdateTeacherDTO) => {
    try {
      const updated = await adminTeacherService.updateTeacher(id, dto);
      setSelectedTeacher(updated);
      setToast({
        type: 'success',
        message: `Đã cập nhật thông tin giáo viên ${updated.name} thành công!`,
      });
      triggerRefresh();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Không thể cập nhật hồ sơ giáo viên.',
      });
    }
  };

  // Teaching Status Modal
  const handleOpenTeachingStatusModal = (teacher: TeacherListItem | TeacherDetail) => {
    setStatusTargetTeacher(teacher);
    setIsStatusModalOpen(true);
  };

  const handleConfirmTeachingStatus = (teacherId: string, newStatus: TeacherTeachingStatus) => {
    const updated = adminTeacherService.setTeachingStatus(teacherId, newStatus);
    if (selectedTeacher?.id === teacherId) {
      setSelectedTeacher(updated);
    }
    setToast({
      type: 'success',
      message: 'Đã cập nhật trạng thái giảng dạy thành công.',
    });
    triggerRefresh();
  };

  // Account Lock / Unlock Dialog
  const handleToggleLockAccount = (teacher: TeacherListItem | TeacherDetail) => {
    setLockTargetTeacher(teacher);
    setIsConfirmLockOpen(true);
  };

  const handleConfirmLockToggle = async () => {
    if (!lockTargetTeacher) return;

    try {
      if (lockTargetTeacher.accountStatus === 'LOCKED') {
        const updated = await adminTeacherService.unlockTeacherAccount(lockTargetTeacher.id);
        if (selectedTeacher?.id === lockTargetTeacher.id) {
          setSelectedTeacher(updated);
        }
        setToast({
          type: 'success',
          message: `Đã mở khóa tài khoản giáo viên ${lockTargetTeacher.name}.`,
        });
      } else {
        const updated = await adminTeacherService.lockTeacherAccount(
          lockTargetTeacher.id,
          'Tài khoản bị khóa bởi quản trị viên hệ thống.'
        );
        if (selectedTeacher?.id === lockTargetTeacher.id) {
          setSelectedTeacher(updated);
        }
        setToast({
          type: 'success',
          message: `Đã khóa tài khoản giáo viên ${lockTargetTeacher.name}.`,
        });
      }
      triggerRefresh();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Không thể thực hiện thao tác khóa/mở khóa.',
      });
    } finally {
      setIsConfirmLockOpen(false);
      setLockTargetTeacher(null);
    }
  };

  // Delete Teacher
  const handleOpenDeleteConfirmation = (teacher: TeacherListItem | TeacherDetail) => {
    setTargetDeleteTeacher(teacher);
    setIsConfirmDeleteOpen(true);
  };

  const handleExecuteDeleteTeacher = async () => {
    if (!targetDeleteTeacher) return;
    try {
      await adminTeacherService.deleteTeacher(targetDeleteTeacher.id);
      setToast({
        type: 'success',
        message: `Đã vô hiệu hóa giáo viên ${targetDeleteTeacher.name} thành công.`,
      });
      setIsConfirmDeleteOpen(false);
      setTargetDeleteTeacher(null);
      if (selectedTeacher?.id === targetDeleteTeacher.id) {
        setIsDrawerOpen(false);
        setSelectedTeacher(null);
      }
      triggerRefresh();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Không thể xóa giáo viên.',
      });
    }
  };

  // Create Teacher
  const handleCreateTeacher = async (dto: CreateTeacherDTO) => {
    try {
      const created = await adminTeacherService.createTeacher(dto);
      setToast({
        type: 'success',
        message: `Đã tạo tài khoản giáo viên ${created.name} (${created.email}) thành công!`,
      });
      triggerRefresh();
      setSelectedTeacher(created);
      setIsDrawerOpen(true);
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Không thể tạo tài khoản giáo viên.',
      });
      throw err;
    }
  };

  return (
    <div className="teacher-management-container">
      {/* 1. Page Header */}
      <PageHeader
        title="Quản lý giáo viên"
        subtitle="Quản lý hồ sơ, trạng thái và hoạt động giảng dạy trên ZhongWenHub."
        breadcrumb={
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Quản trị / Quản lý giáo viên
          </span>
        }
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} style={{ marginRight: 6 }} />
            Thêm giáo viên
          </button>
        }
      />

      {/* 2. Compact Teacher Summary Strip */}
      <TeacherSummaryStrip kpis={kpis} />

      {/* 3. Search and Multi-filter Toolbar */}
      <TeacherToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* 4. Main Teacher Table / Mobile Cards / Empty State */}
      {paginatedData.totalItems === 0 ? (
        <EmptyState
          title="Không tìm thấy giáo viên"
          description="Không có giáo viên phù hợp với bộ lọc hoặc từ khóa tìm kiếm hiện tại."
          action={
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleResetFilters}
            >
              Đặt lại bộ lọc
            </button>
          }
        />
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <TeacherTable
            teachers={paginatedData.items}
            selectedIds={selectedIds}
            onToggleSelectAll={handleToggleSelectAll}
            onToggleSelectTeacher={handleToggleSelectTeacher}
            selectedTeacherId={isDrawerOpen && selectedTeacher ? selectedTeacher.id : null}
            onSelectTeacher={handleSelectTeacher}
            onEditTeacher={handleEditTeacher}
            onChangeTeachingStatus={handleOpenTeachingStatusModal}
            onToggleLockAccount={handleToggleLockAccount}
            onDeleteTeacher={handleOpenDeleteConfirmation}
            sort={sort}
            onSortChange={handleSortChange}
          />

          {/* Mobile Card List View (< 768px) */}
          <TeacherCardList
            teachers={paginatedData.items}
            onSelectTeacher={handleSelectTeacher}
            onEditTeacher={handleEditTeacher}
            onChangeTeachingStatus={handleOpenTeachingStatusModal}
            onToggleLockAccount={handleToggleLockAccount}
          />

          {/* 5. Pagination */}
          <Pagination
            currentPage={paginatedData.page}
            totalPages={paginatedData.totalPages}
            pageSize={pagination.pageSize}
            totalItems={paginatedData.totalItems}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            onPageSizeChange={(pageSize) => setPagination({ page: 1, pageSize })}
            pageSizeOptions={[10, 20, 50]}
          />
        </>
      )}

      {/* 6. Wide Teacher Detail Drawer (560px) */}
      <TeacherDetailDrawer
        isOpen={isDrawerOpen}
        teacher={selectedTeacher}
        onClose={handleCloseDrawer}
        onSaveEdit={handleSaveEdit}
        onChangeTeachingStatus={handleOpenTeachingStatusModal}
        onToggleLockAccount={handleToggleLockAccount}
        onDelete={handleOpenDeleteConfirmation}
      />

      {/* 7. Create Teacher Modal */}
      <CreateTeacherModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTeacher}
      />

      {/* 8. Change Teaching Status Modal */}
      <ChangeTeachingStatusModal
        isOpen={isStatusModalOpen}
        teacher={statusTargetTeacher}
        onClose={() => {
          setIsStatusModalOpen(false);
          setStatusTargetTeacher(null);
        }}
        onConfirm={handleConfirmTeachingStatus}
      />

      {/* 9. Confirm Lock / Unlock Account Dialog */}
      <ConfirmDialog
        isOpen={isConfirmLockOpen}
        title={
          lockTargetTeacher?.accountStatus === 'LOCKED'
            ? 'Mở khóa tài khoản giáo viên'
            : 'Khóa tài khoản giáo viên'
        }
        message={
          lockTargetTeacher?.accountStatus === 'LOCKED'
            ? `Bạn có chắc chắn muốn mở khóa tài khoản cho giáo viên "${lockTargetTeacher?.name}"? Giáo viên sẽ được phép đăng nhập lại vào hệ thống.`
            : `Giáo viên "${lockTargetTeacher?.name}" sẽ không thể đăng nhập vào hệ thống. Trạng thái phân công giảng dạy hiện tại sẽ được giữ nguyên cho đến khi có thay đổi.`
        }
        confirmLabel={
          lockTargetTeacher?.accountStatus === 'LOCKED' ? 'Mở khóa' : 'Khóa tài khoản'
        }
        cancelLabel="Hủy bỏ"
        isDestructive={lockTargetTeacher?.accountStatus !== 'LOCKED'}
        onConfirm={handleConfirmLockToggle}
        onCancel={() => {
          setIsConfirmLockOpen(false);
          setLockTargetTeacher(null);
        }}
      />

      {/* 10. Confirm Soft-delete Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        title={`Vô hiệu hóa giáo viên ${targetDeleteTeacher?.name || ''}?`}
        message="Tài khoản giáo viên sẽ bị vô hiệu hóa. Các khóa học và lớp học do giáo viên phụ trách sẽ được bảo lưu an toàn."
        confirmLabel="Vô hiệu hóa tài khoản"
        cancelLabel="Hủy bỏ"
        isDestructive={true}
        onConfirm={handleExecuteDeleteTeacher}
        onCancel={() => {
          setIsConfirmDeleteOpen(false);
          setTargetDeleteTeacher(null);
        }}
      />

      {/* 11. Toast Notification */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default AdminTeachersPage;
