import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  RefreshCw,
  Layers,
  FileEdit,
  Send,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { hskRepositoryService } from '../../admin/content/services/hsk-repository.service';
import type { HskLevel } from '../../admin/content/types';
import { ConfirmDialog, PageHeader, Pagination } from '../../shared/components';
import {
  AssignmentCardList,
  AssignmentFormDrawer,
  AssignmentTable,
  AssignmentToolbar,
} from '../components';
import { assignmentService } from '../services';
import { INITIAL_TEACHING_CLASSES, CURRENT_TEACHER_ID } from '../data/mockTeacherPortalData';
import type {
  AssignmentDetailDTO,
  AssignmentFilters,
  AssignmentSort,
  AssignmentSummaryDTO,
} from '../types';

export const TeacherAssignmentsPage: React.FC = () => {
  // Filters, Sort, Pagination State
  const [filters, setFilters] = useState<AssignmentFilters>({
    search: '',
    hskLevelId: 'ALL',
    classId: 'ALL',
    status: 'ALL',
  });

  const [sort] = useState<AssignmentSort>({
    field: 'createdAt',
    direction: 'desc',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
  });

  // Data State
  const [loading, setLoading] = useState<boolean>(true);
  const [assignments, setAssignments] = useState<AssignmentSummaryDTO[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [hskLevels, setHskLevels] = useState<HskLevel[]>([]);
  const [ownedClasses, setOwnedClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

  // Confirm Dialogs
  const [publishingAssignment, setPublishingAssignment] = useState<AssignmentSummaryDTO | null>(null);
  const [closingAssignment, setClosingAssignment] = useState<AssignmentSummaryDTO | null>(null);
  const [archivingAssignment, setArchivingAssignment] = useState<AssignmentSummaryDTO | null>(null);

  // Feedback Toasts
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => {
      setFeedback(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Initial reference data
  useEffect(() => {
    const levels = hskRepositoryService.getLevels();
    setHskLevels(levels);

    const classes = INITIAL_TEACHING_CLASSES
      .filter((c) => c.teacherId === CURRENT_TEACHER_ID)
      .map((c) => ({ id: c.id, name: c.name }));
    setOwnedClasses(classes);
  }, []);

  // Fetch assignments
  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await assignmentService.getAssignments(filters, pagination, sort);
      setAssignments(res.items);
      setTotalItems(res.totalItems);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải danh sách bài tập.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination, sort]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // Computed summary metrics
  const metrics = useMemo(() => {
    let draftCount = 0;
    let publishedCount = 0;
    let closedCount = 0;

    assignments.forEach((a) => {
      if (a.status === 'DRAFT') draftCount++;
      else if (a.status === 'PUBLISHED') publishedCount++;
      else if (a.status === 'CLOSED' || a.status === 'ARCHIVED') closedCount++;
    });

    return {
      total: totalItems,
      draft: draftCount,
      published: publishedCount,
      closed: closedCount,
    };
  }, [assignments, totalItems]);

  // Action Handlers
  const handleCreate = () => {
    setSelectedAssignmentId(null);
    setIsReadOnly(false);
    setIsDrawerOpen(true);
  };

  const handleView = (asgn: AssignmentSummaryDTO) => {
    setSelectedAssignmentId(asgn.id);
    setIsReadOnly(true);
    setIsDrawerOpen(true);
  };

  const handleEdit = (asgn: AssignmentSummaryDTO) => {
    setSelectedAssignmentId(asgn.id);
    setIsReadOnly(false);
    setIsDrawerOpen(true);
  };

  const handleDuplicate = async (asgn: AssignmentSummaryDTO) => {
    try {
      const duplicated = await assignmentService.duplicateAssignment(asgn.id);
      setFeedback({
        type: 'success',
        message: `Đã nhân bản bài tập thành bản nháp mới: "${duplicated.title}".`,
      });
      loadAssignments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi nhân bản bài tập.';
      setFeedback({ type: 'error', message: msg });
    }
  };

  const handlePublishConfirm = async () => {
    if (!publishingAssignment) return;
    try {
      await assignmentService.publishAssignment(publishingAssignment.id);
      setFeedback({
        type: 'success',
        message: `Đã phát hành bài tập "${publishingAssignment.title}". Snapshot câu hỏi đã được đóng băng thành công.`,
      });
      setPublishingAssignment(null);
      loadAssignments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi phát hành bài tập.';
      setFeedback({ type: 'error', message: msg });
      setPublishingAssignment(null);
    }
  };

  const handleCloseConfirm = async () => {
    if (!closingAssignment) return;
    try {
      await assignmentService.closeAssignment(closingAssignment.id);
      setFeedback({
        type: 'success',
        message: `Đã đóng nộp bài tập "${closingAssignment.title}". Học viên không thể nộp thêm.`,
      });
      setClosingAssignment(null);
      loadAssignments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi đóng nộp bài tập.';
      setFeedback({ type: 'error', message: msg });
      setClosingAssignment(null);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!archivingAssignment) return;
    try {
      await assignmentService.archiveAssignment(archivingAssignment.id);
      setFeedback({
        type: 'success',
        message: `Đã chuyển bài tập "${archivingAssignment.title}" vào lưu trữ.`,
      });
      setArchivingAssignment(null);
      loadAssignments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu trữ bài tập.';
      setFeedback({ type: 'error', message: msg });
      setArchivingAssignment(null);
    }
  };

  const handleDrawerSuccess = (saved: AssignmentDetailDTO, isPublish?: boolean) => {
    setFeedback({
      type: 'success',
      message: isPublish
        ? `Đã phát hành bài tập "${saved.title}" thành công!`
        : `Đã lưu bài tập "${saved.title}" thành công.`,
    });
    loadAssignments();
  };

  return (
    <div className="tp-page-container">
      {/* Toast Feedback */}
      {feedback && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: feedback.type === 'success' ? '#065f46' : '#991b1b',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            fontSize: 'var(--text-sm)',
            maxWidth: '460px',
            animation: 'tpFadeIn 0.2s ease-out',
          }}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0 }} />
          ) : (
            <AlertCircle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
          )}
          <span style={{ flex: 1 }}>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              padding: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Quản lý bài tập về nhà"
        subtitle="Thiết lập bài tập, chọn câu hỏi từ ngân hàng chung và phân bổ bài làm cho các lớp học."
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="ds-btn ds-btn-secondary"
              onClick={loadAssignments}
              title="Tải lại danh sách"
            >
              <RefreshCw size={15} />
              <span>Làm mới</span>
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-primary"
              onClick={handleCreate}
            >
              <Plus size={15} />
              <span>Tạo bài tập</span>
            </button>
          </div>
        }
      />

      {/* Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div className="tp-card" style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
              Tổng bài tập
            </span>
            <Layers size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>
            {metrics.total}
          </div>
        </div>

        <div className="tp-card" style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
              Bản nháp
            </span>
            <FileEdit size={18} style={{ color: '#6b7280' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: '#4b5563' }}>
            {metrics.draft}
          </div>
        </div>

        <div className="tp-card" style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
              Đang phát hành
            </span>
            <Send size={18} style={{ color: '#059669' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: '#047857' }}>
            {metrics.published}
          </div>
        </div>

        <div className="tp-card" style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
              Đã đóng / Lưu trữ
            </span>
            <Lock size={18} style={{ color: '#b91c1c' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: '#b91c1c' }}>
            {metrics.closed}
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="tp-card">
        {/* Toolbar */}
        <AssignmentToolbar
          filters={filters}
          onFilterChange={(next) => {
            setFilters(next);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          hskLevels={hskLevels}
          ownedClasses={ownedClasses}
          onCreateClick={handleCreate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Content Presentation */}
        {viewMode === 'table' ? (
          <>
            {/* Desktop Table: visible on md+ screens */}
            <div className="tp-desktop-only">
              <AssignmentTable
                assignments={assignments}
                loading={loading}
                onView={handleView}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onPublish={(asgn) => setPublishingAssignment(asgn)}
                onClose={(asgn) => setClosingAssignment(asgn)}
                onArchive={(asgn) => setArchivingAssignment(asgn)}
              />
            </div>
            {/* Mobile Card List fallback */}
            <div className="tp-mobile-only" style={{ padding: 'var(--space-4)' }}>
              <AssignmentCardList
                assignments={assignments}
                loading={loading}
                onView={handleView}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onPublish={(asgn) => setPublishingAssignment(asgn)}
                onClose={(asgn) => setClosingAssignment(asgn)}
                onArchive={(asgn) => setArchivingAssignment(asgn)}
              />
            </div>
          </>
        ) : (
          <div style={{ padding: 'var(--space-4)' }}>
            <AssignmentCardList
              assignments={assignments}
              loading={loading}
              onView={handleView}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onPublish={(asgn) => setPublishingAssignment(asgn)}
              onClose={(asgn) => setClosingAssignment(asgn)}
              onArchive={(asgn) => setArchivingAssignment(asgn)}
            />
          </div>
        )}

        {/* Pagination */}
        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border)' }}>
          <Pagination
            currentPage={pagination.page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pagination.pageSize}
            itemLabel="bài tập"
            onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
            onPageSizeChange={(pageSize) => setPagination({ page: 1, pageSize })}
          />
        </div>
      </div>

      {/* Create / Edit / View Drawer */}
      <AssignmentFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        assignmentId={selectedAssignmentId}
        readOnly={isReadOnly}
        onSuccess={handleDrawerSuccess}
      />

      {/* Confirm Publish Dialog */}
      <ConfirmDialog
        isOpen={!!publishingAssignment}
        title="Xác nhận phát hành bài tập"
        message={
          publishingAssignment
            ? `Bạn có chắc chắn muốn phát hành bài tập "${publishingAssignment.title}"? Hệ thống sẽ tạo snapshot đóng băng toàn bộ câu hỏi và cơ cấu điểm số. Sau khi phát hành, nội dung câu hỏi không thể thay đổi.`
            : ''
        }
        confirmLabel="Phát hành ngay"
        cancelLabel="Kiểm tra lại"
        isDestructive={false}
        onConfirm={handlePublishConfirm}
        onCancel={() => setPublishingAssignment(null)}
      />

      {/* Confirm Close Dialog */}
      <ConfirmDialog
        isOpen={!!closingAssignment}
        title="Xác nhận đóng nộp bài tập"
        message={
          closingAssignment
            ? `Bạn có chắc chắn muốn đóng nộp bài tập "${closingAssignment.title}"? Học viên thuộc các lớp được giao sẽ không thể nộp thêm lượt làm bài nào nữa.`
            : ''
        }
        confirmLabel="Đóng nộp bài"
        cancelLabel="Hủy"
        isDestructive={true}
        onConfirm={handleCloseConfirm}
        onCancel={() => setClosingAssignment(null)}
      />

      {/* Confirm Archive Dialog */}
      <ConfirmDialog
        isOpen={!!archivingAssignment}
        title="Xác nhận lưu trữ bài tập"
        message={
          archivingAssignment
            ? `Bạn có chắc chắn muốn chuyển bài tập "${archivingAssignment.title}" vào mục lưu trữ? Bài tập sẽ bị ẩn khỏi danh sách mặc định.`
            : ''
        }
        confirmLabel="Lưu trữ"
        cancelLabel="Hủy"
        isDestructive={true}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setArchivingAssignment(null)}
      />
    </div>
  );
};
