import React, { useState, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, Pagination, ConfirmDialog, EmptyState } from '../../../shared/components';
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
    if (dataVersion < 0) return adminTeacherService.getTeachers(filters, pagination, sort);
    return adminTeacherService.getTeachers(filters, pagination, sort);
  }, [filters, pagination, sort, dataVersion]);

  const kpis = useMemo(() => {
    if (dataVersion < 0) return adminTeacherService.getKPIs();
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

  const triggerRefresh = useCallback(() => {
    setDataVersion((v) => v + 1);
  }, []);

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

  const handleSaveEdit = (id: string, dto: UpdateTeacherDTO) => {
    const updated = adminTeacherService.updateTeacher(id, dto);
    setSelectedTeacher(updated);
    triggerRefresh();
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
    triggerRefresh();
  };

  // Account Lock / Unlock Dialog
  const handleToggleLockAccount = (teacher: TeacherListItem | TeacherDetail) => {
    setLockTargetTeacher(teacher);
    setIsConfirmLockOpen(true);
  };

  const handleConfirmLockToggle = () => {
    if (!lockTargetTeacher) return;

    if (lockTargetTeacher.accountStatus === 'LOCKED') {
      const updated = adminTeacherService.unlockTeacherAccount(lockTargetTeacher.id);
      if (selectedTeacher?.id === lockTargetTeacher.id) {
        setSelectedTeacher(updated);
      }
    } else {
      const updated = adminTeacherService.lockTeacherAccount(
        lockTargetTeacher.id,
        'Tài khoản bị khóa bởi quản trị viên hệ thống.'
      );
      if (selectedTeacher?.id === lockTargetTeacher.id) {
        setSelectedTeacher(updated);
      }
    }
    triggerRefresh();
    setIsConfirmLockOpen(false);
    setLockTargetTeacher(null);
  };

  // Create Teacher
  const handleCreateTeacher = (dto: CreateTeacherDTO) => {
    const created = adminTeacherService.createTeacher(dto);
    triggerRefresh();
    // Open drawer to review newly created teacher
    setSelectedTeacher(created);
    setIsDrawerOpen(true);
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
    </div>
  );
};

export default AdminTeachersPage;
