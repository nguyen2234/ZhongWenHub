import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, RefreshCw, Layers, Users, Archive, CheckCircle } from 'lucide-react';
import { curriculumService } from '../../admin/content/services/curriculum.service';
import { hskRepositoryService } from '../../admin/content/services/hsk-repository.service';
import type { Course, HskLevel } from '../../admin/content/types';
import { ConfirmDialog, PageHeader, Pagination } from '../../shared/components';
import { ClassCardList, ClassFormDrawer, ClassTable, ClassToolbar } from '../components';
import { teacherPortalService } from '../services';
import type {
  ClassFilters,
  ClassSort,
  ClassSummaryDTO,
  CreateTeachingClassDTO,
  UpdateTeachingClassDTO,
} from '../types';

export const TeacherClassesPage: React.FC = () => {
  // Filters, Sort, Pagination State
  const [filters, setFilters] = useState<ClassFilters>({
    search: '',
    hskLevelId: 'ALL',
    status: 'ALL',
    locationType: 'ALL',
  });

  const [sort] = useState<ClassSort>({
    field: 'startDate',
    direction: 'desc',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
  });

  // Data State
  const [classResponse, setClassResponse] = useState<{
    items: ClassSummaryDTO[];
    totalItems: number;
    totalPages: number;
  }>({ items: [], totalItems: 0, totalPages: 1 });

  const [hskLevels, setHskLevels] = useState<HskLevel[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Drawer & Dialog State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSummaryDTO | null>(null);
  const [archivingClass, setArchivingClass] = useState<ClassSummaryDTO | null>(null);

  // Load Data
  const loadClasses = useCallback(() => {
    const res = teacherPortalService.getClasses(filters, pagination, sort);
    setClassResponse({
      items: res.items,
      totalItems: res.totalItems,
      totalPages: res.totalPages,
    });

    const levels = hskRepositoryService.getLevels();
    const courseList = curriculumService.getCourses();
    setHskLevels(levels);
    setCourses(courseList);
  }, [filters, pagination, sort]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // Handle open Create
  const handleOpenCreate = () => {
    setEditingClass(null);
    setIsDrawerOpen(true);
  };

  // Handle open Edit
  const handleOpenEdit = (cls: ClassSummaryDTO) => {
    setEditingClass(cls);
    setIsDrawerOpen(true);
  };

  // Handle Submit from Drawer
  const handleFormSubmit = async (dto: CreateTeachingClassDTO | UpdateTeachingClassDTO) => {
    if (editingClass) {
      teacherPortalService.updateClass(editingClass.id, dto as UpdateTeachingClassDTO);
    } else {
      teacherPortalService.createClass(dto as CreateTeachingClassDTO);
    }
    loadClasses();
  };

  // Handle Confirm Archive
  const handleConfirmArchive = () => {
    if (!archivingClass) return;
    teacherPortalService.archiveClass(archivingClass.id);
    setArchivingClass(null);
    loadClasses();
  };

  // Aggregated Summary Strip KPIs
  const summaryKPIs = useMemo(() => {
    const all = teacherPortalService.getClasses(
      { search: '', hskLevelId: 'ALL', status: 'ALL', locationType: 'ALL' },
      { page: 1, pageSize: 999 }
    ).items;

    const activeCount = all.filter((c) => c.status === 'ACTIVE').length;
    const upcomingCount = all.filter((c) => c.status === 'UPCOMING').length;
    const archivedCount = all.filter((c) => c.status === 'ARCHIVED').length;
    const totalStudents = all.reduce((sum, c) => sum + c.derivedEnrollmentCount, 0);

    return { totalClasses: all.length, activeCount, upcomingCount, archivedCount, totalStudents };
  }, [classResponse]);

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Lớp Của Tôi"
        subtitle="Quản lý toàn bộ danh sách lớp học, thời khóa biểu và học viên đang phụ trách."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              type="button"
              onClick={loadClasses}
              className="ds-btn ds-btn-outline ds-btn-sm"
              title="Làm mới danh sách"
            >
              <RefreshCw size={14} /> Làm mới
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="ds-btn ds-btn-primary ds-btn-sm"
              style={{ gap: '6px' }}
            >
              <Plus size={16} /> Tạo Lớp Mới
            </button>
          </div>
        }
      />

      {/* Summary KPI Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>TỔNG SỐ LỚP</div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--foreground)' }}>
              {summaryKPIs.totalClasses} lớp
            </div>
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>ĐANG DẠY</div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--success)' }}>
              {summaryKPIs.activeCount} lớp
            </div>
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--background)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>TỔNG HỌC VIÊN</div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--foreground)' }}>
              {summaryKPIs.totalStudents} học viên
            </div>
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--background)',
              color: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Archive size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>LƯU TRỮ</div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--muted)' }}>
              {summaryKPIs.archivedCount} lớp
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <ClassToolbar
        filters={filters}
        onFilterChange={(f) => {
          setFilters(f);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        hskLevels={hskLevels}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateClassClick={handleOpenCreate}
      />

      {/* Class Content (Table or Card Grid) */}
      {viewMode === 'table' ? (
        <ClassTable
          classes={classResponse.items}
          onEdit={handleOpenEdit}
          onArchive={(cls) => setArchivingClass(cls)}
        />
      ) : (
        <ClassCardList
          classes={classResponse.items}
          onEdit={handleOpenEdit}
          onArchive={(cls) => setArchivingClass(cls)}
        />
      )}

      {/* Pagination */}
      {classResponse.totalPages > 1 && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <Pagination
            currentPage={pagination.page}
            totalPages={classResponse.totalPages}
            totalItems={classResponse.totalItems}
            pageSize={pagination.pageSize}
            itemLabel="lớp học"
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            onPageSizeChange={(pageSize) => setPagination({ page: 1, pageSize })}
          />
        </div>
      )}

      {/* Slide-over Drawer for Create / Edit */}
      <ClassFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleFormSubmit}
        editingClass={editingClass}
        hskLevels={hskLevels}
        courses={courses}
      />

      {/* Confirm Archive Dialog */}
      <ConfirmDialog
        isOpen={Boolean(archivingClass)}
        title="Xác nhận lưu trữ lớp học"
        message={`Bạn có chắc chắn muốn chuyển lớp "${archivingClass?.name}" (${archivingClass?.code}) vào trạng thái Lưu trữ (Archived)? Lớp học sẽ được ẩn khỏi lịch giảng dạy hàng ngày.`}
        confirmLabel="Lưu trữ lớp"
        cancelLabel="Hủy bỏ"
        isDestructive={true}
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchivingClass(null)}
      />
    </div>
  );
};

export default TeacherClassesPage;
