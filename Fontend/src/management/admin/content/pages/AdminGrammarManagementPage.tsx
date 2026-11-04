import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  RotateCcw,
  Eye,
  Edit3,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  PageHeader,
  StatCard,
  TableToolbar,
  DataTable,
  Pagination,
  ConfirmDialog,
} from '../../../shared/components';
import { ContentStatusBadge } from '../components/ContentStatusBadge';
import { AdminGrammarDetailDrawer } from '../components/AdminGrammarDetailDrawer';
import { AdminCreateGrammarModal } from '../components/AdminCreateGrammarModal';
import { adminGrammarService } from '../services/admin-grammar.service';
import type {
  AdminGrammarPoint,
  AdminGrammarFilters,
  CreateAdminGrammarDTO,
  UpdateAdminGrammarDTO,
  GrammarCategory,
} from '../types/admin-content.types';
import type { TableColumn } from '../../../shared/types';
import type { ContentStatus } from '../types/common-content.types';
import type { AdminGrammarStats } from '../../../../core/repositories';

const CATEGORIES: GrammarCategory[] = [
  'cơ bản',
  'câu chữ',
  'trợ từ',
  'liên từ',
  'bổ ngữ',
  'phó từ',
];

export const AdminGrammarManagementPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // 1. URL search params deep-linking support
  const urlId = searchParams.get('id');
  const urlHsk = searchParams.get('hsk');

  const [filters, setFilters] = useState<AdminGrammarFilters>({
    search: '',
    hskLevel: urlHsk ? Number(urlHsk) : 'ALL',
    category: 'ALL',
    status: 'ALL',
  });

  const [version, setVersion] = useState(0);
  const [selectedGrammar, setSelectedGrammar] = useState<AdminGrammarPoint | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Real async state from SQL Server backend
  const [grammarList, setGrammarList] = useState<AdminGrammarPoint[]>([]);
  const [stats, setStats] = useState<AdminGrammarStats>({
    total: 0,
    published: 0,
    draft: 0,
    pending: 0,
    archived: 0,
    byHsk: {} as any,
    byCategory: {} as any,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [list, statsData] = await Promise.all([
        adminGrammarService.getAllAsync(filters),
        adminGrammarService.getStatsAsync(),
      ]);
      setGrammarList(list);
      setStats(statsData);
    } catch (err: any) {
      console.error('[AdminGrammarPage] Load error:', err);
      setErrorMessage(err?.message || 'Không thể kết nối đến máy chủ để tải dữ liệu ngữ pháp.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData, version]);

  // Deep linking: auto-open drawer if `id` parameter is in URL
  useEffect(() => {
    if (urlId) {
      adminGrammarService.getByIdAsync(urlId).then((found) => {
        if (found) {
          setSelectedGrammar(found);
          setIsDrawerOpen(true);
        }
      });
    }
  }, [urlId]);

  // Sync HSK URL param if present
  useEffect(() => {
    if (urlHsk && Number(urlHsk) >= 1 && Number(urlHsk) <= 6) {
      setFilters((prev) => ({ ...prev, hskLevel: Number(urlHsk) }));
    }
  }, [urlHsk]);

  // 3. Pagination calculations
  const totalPages = Math.ceil(grammarList.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return grammarList.slice(start, start + pageSize);
  }, [grammarList, currentPage]);

  const handleOpenDetail = useCallback(
    (item: AdminGrammarPoint) => {
      setSelectedGrammar(item);
      setIsDrawerOpen(true);
      setSearchParams({ id: item.id });
    },
    [setSearchParams]
  );

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedGrammar(null);
    setSearchParams({});
  }, [setSearchParams]);

  const handleSaveGrammar = useCallback(async (id: string, dto: UpdateAdminGrammarDTO) => {
    try {
      const updated = await adminGrammarService.updateAsync(id, dto);
      setVersion((v) => v + 1);
      if (updated) setSelectedGrammar(updated);
    } catch (err: any) {
      console.error('Lỗi cập nhật điểm ngữ pháp:', err);
      alert(err?.message || 'Không thể lưu điểm ngữ pháp lên máy chủ.');
    }
  }, []);

  const handleDeleteGrammar = useCallback(
    async (id: string) => {
      try {
        await adminGrammarService.deleteAsync(id);
        setVersion((v) => v + 1);
        handleCloseDrawer();
      } catch (err: any) {
        console.error('Lỗi xóa điểm ngữ pháp:', err);
        alert(err?.message || 'Không thể xóa điểm ngữ pháp trên máy chủ.');
      }
    },
    [handleCloseDrawer]
  );

  const handleCreateGrammar = useCallback(async (dto: CreateAdminGrammarDTO) => {
    try {
      const created = await adminGrammarService.createAsync(dto);
      setVersion((v) => v + 1);
      setSelectedGrammar(created);
      setIsDrawerOpen(true);
      setIsCreateModalOpen(false);
    } catch (err: any) {
      console.error('Lỗi tạo điểm ngữ pháp:', err);
      alert(err?.message || 'Không thể tạo điểm ngữ pháp trên máy chủ.');
    }
  }, []);

  const handleResetData = useCallback(async () => {
    try {
      await adminGrammarService.resetToDefault();
      setVersion((v) => v + 1);
    } finally {
      setIsResetConfirmOpen(false);
      handleCloseDrawer();
    }
  }, [handleCloseDrawer]);

  const location = useLocation();
  const isContentManager = location.pathname.includes('/content-manager');
  const basePath = isContentManager ? '/management/content-manager' : '/management/admin';
  const exercisePath = isContentManager ? '/management/content-manager/question-bank' : '/management/admin/exercises';

  const handleNavigateToExercises = useCallback(
    (grammarId: string) => {
      navigate(`${exercisePath}?grammarId=${grammarId}`);
    },
    [navigate, exercisePath]
  );

  const handleNavigateToLesson = useCallback(
    (lessonId: string) => {
      navigate(`${basePath}/curriculum/lessons/${lessonId}/edit`);
    },
    [navigate, basePath]
  );

  // 4. Data Table columns
  const columns: TableColumn<AdminGrammarPoint>[] = [
    {
      key: 'code',
      header: 'Mã HSK',
      width: '100px',
      render: (item) => (
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: 'var(--text-xs)',
            color: 'var(--primary)',
          }}
        >
          {item.code}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Điểm ngữ pháp',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 'var(--text-xs)' }}>
            {item.title}
          </div>
          {item.pinyinTitle && (
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{item.pinyinTitle}</div>
          )}
        </div>
      ),
    },
    {
      key: 'hskLevel',
      header: 'Cấp HSK',
      width: '90px',
      render: (item) => (
        <span
          style={{
            backgroundColor: '#EFF6FF',
            color: '#1D4ED8',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '11px',
          }}
        >
          HSK {item.hskLevel}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Phân loại',
      width: '100px',
      render: (item) => (
        <span
          style={{
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            color: 'var(--text-main)',
          }}
        >
          {item.category}
        </span>
      ),
    },
    {
      key: 'structureFormula',
      header: 'Công thức cấu trúc',
      render: (item) => (
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#334155',
            backgroundColor: '#F8FAFC',
            padding: '2px 6px',
            borderRadius: '4px',
            border: '1px solid #E2E8F0',
            maxWidth: '240px',
            display: 'inline-block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={item.structureFormula}
        >
          {item.structureFormula}
        </span>
      ),
    },
    {
      key: 'links',
      header: 'Liên kết',
      width: '130px',
      render: (item) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px' }}>
          <span style={{ color: item.linkedLessonIds.length > 0 ? '#0284C7' : 'var(--muted)' }}>
            📚 {item.linkedLessonIds.length} bài học
          </span>
          <span style={{ color: item.linkedExerciseIds.length > 0 ? '#16A34A' : 'var(--muted)' }}>
            ✏️ {item.linkedExerciseIds.length} câu hỏi
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '120px',
      render: (item) => <ContentStatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: '90px',
      align: 'right',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
          <button
            type="button"
            className="ds-btn ds-btn-ghost"
            style={{ padding: '6px' }}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDetail(item);
            }}
            title="Xem chi tiết & Preview"
          >
            <Eye size={15} color="var(--primary)" />
          </button>
          <button
            type="button"
            className="ds-btn ds-btn-ghost"
            style={{ padding: '6px' }}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDetail(item);
            }}
            title="Chỉnh sửa"
          >
            <Edit3 size={15} color="var(--muted)" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Header */}
      <PageHeader
        title="Quản lý Ngữ pháp (HSK 1 - 6)"
        subtitle="Hệ thống quản lý và chuẩn hóa các điểm ngữ pháp, cấu trúc mẫu câu và bài tập tương tác liên kết"
        breadcrumb={
          <div style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', gap: '6px' }}>
            <span>Bàn làm việc</span>
            <span>/</span>
            <span>Học liệu</span>
            <span>/</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Ngữ pháp</span>
          </div>
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="ds-btn ds-btn-secondary"
              onClick={() => setIsResetConfirmOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px' }}
              title="Khôi phục dữ liệu ban đầu nếu bị thay đổi"
            >
              <RotateCcw size={14} />
              <span>Reset demo</span>
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px' }}
            >
              <Plus size={16} />
              <span>Tạo điểm ngữ pháp</span>
            </button>
          </div>
        }
      />

      {/* Error banner with Retry */}
      {errorMessage && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 'var(--text-xs)',
            color: 'var(--danger, #ef4444)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={loadData}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <RefreshCw size={14} /> Thử lại
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <StatCard
          title="Tổng điểm ngữ pháp"
          value={stats.total}
          icon={<BookOpen size={20} color="var(--primary)" />}
        />
        <StatCard
          title="Đã xuất bản (Live)"
          value={stats.published}
          icon={<CheckCircle2 size={20} color="#16A34A" />}
        />
        <StatCard
          title="Đang chờ duyệt"
          value={stats.pending ?? 0}
          icon={<Clock size={20} color="#EAB308" />}
        />
        <StatCard
          title="Bản nháp (Draft)"
          value={stats.draft}
          icon={<FileText size={20} color="#64748B" />}
        />
      </div>

      {/* Toolbar & Filters */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
        }}
      >
        <TableToolbar
          searchQuery={filters.search}
          onSearchChange={(q) => {
            setFilters((prev) => ({ ...prev, search: q }));
            setCurrentPage(1);
          }}
          searchPlaceholder="Tìm kiếm chữ Hán, Pinyin, công thức, giải thích..."
          filterActions={
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {/* Level Filter */}
              <select
                className="ds-input"
                value={filters.hskLevel}
                onChange={(e) => {
                  const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                  setFilters((prev) => ({ ...prev, hskLevel: val }));
                  setCurrentPage(1);
                }}
                style={{ height: '36px', fontSize: 'var(--text-xs)' }}
              >
                <option value="ALL">Tất cả cấp độ (HSK 1 - 6)</option>
                {[1, 2, 3, 4, 5, 6].map((l) => (
                  <option key={l} value={l}>
                    HSK {l} ({stats.byHsk[l] || 0})
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                className="ds-input"
                value={filters.category}
                onChange={(e) => {
                  setFilters((prev) => ({
                    ...prev,
                    category: e.target.value as GrammarCategory | 'ALL',
                  }));
                  setCurrentPage(1);
                }}
                style={{ height: '36px', fontSize: 'var(--text-xs)' }}
              >
                <option value="ALL">Tất cả danh mục</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                className="ds-input"
                value={filters.status}
                onChange={(e) => {
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.value as ContentStatus | 'ALL',
                  }));
                  setCurrentPage(1);
                }}
                style={{ height: '36px', fontSize: 'var(--text-xs)' }}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PUBLISHED">Đã xuất bản</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="DRAFT">Bản nháp</option>
                <option value="ARCHIVED">Lưu trữ</option>
              </select>

              {(filters.search ||
                filters.hskLevel !== 'ALL' ||
                filters.category !== 'ALL' ||
                filters.status !== 'ALL') && (
                <button
                  type="button"
                  className="ds-btn ds-btn-ghost"
                  onClick={() => {
                    setFilters({ search: '', hskLevel: 'ALL', category: 'ALL', status: 'ALL' });
                    setCurrentPage(1);
                  }}
                  style={{ height: '36px', fontSize: 'var(--text-xs)', color: 'var(--primary)' }}
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          }
        />

        {/* Loading state */}
        {isLoading && (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--muted)' }}>
            Đang tải dữ liệu ngữ pháp từ máy chủ...
          </div>
        )}

        {/* Data Table */}
        {!isLoading && (
          <DataTable
            columns={columns}
            data={paginatedData}
            keyExtractor={(item) => item.id}
            onRowClick={handleOpenDetail}
            emptyText="Không tìm thấy điểm ngữ pháp nào phù hợp với bộ lọc."
            enableMobileCards
            mobileTitleExtractor={(item) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--primary-subtle, rgba(2, 132, 199, 0.08))',
                    color: 'var(--primary)',
                  }}
                >
                  HSK {item.hskLevel}
                </span>
                <span style={{ fontWeight: 600 }}>{item.title}</span>
              </div>
            )}
            mobileSubtitleExtractor={(item) => (
              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--primary)' }}>
                {item.structureFormula}
              </span>
            )}
            mobileBadgeExtractor={(item) => <ContentStatusBadge status={item.status} />}
            mobileFields={[
              {
                label: 'Danh mục',
                render: (item) => (
                  <span style={{ textTransform: 'capitalize' }}>{item.category}</span>
                ),
              },
              {
                label: 'Ví dụ',
                render: (item) => (
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    {item.examples[0]?.zh || 'Chưa có'}
                  </span>
                ),
              },
            ]}
          />
        )}

        {/* Pagination */}
        {!isLoading && grammarList.length > pageSize && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={grammarList.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Slide-over Detail & Preview Drawer */}
      <AdminGrammarDetailDrawer
        isOpen={isDrawerOpen}
        grammar={selectedGrammar}
        onClose={handleCloseDrawer}
        onSave={handleSaveGrammar}
        onDelete={handleDeleteGrammar}
        onNavigateToExercises={handleNavigateToExercises}
        onNavigateToLesson={handleNavigateToLesson}
      />

      {/* Create Modal */}
      <AdminCreateGrammarModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateGrammar}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Khôi phục dữ liệu Ngữ pháp gốc"
        message="Hành động này sẽ thiết lập lại toàn bộ danh mục các điểm ngữ pháp chuẩn HSK 1 - 6 và xóa bỏ các thay đổi cục bộ trong phiên làm việc. Bạn có chắc chắn muốn thực hiện?"
        confirmLabel="Đồng ý khôi phục"
        cancelLabel="Hủy bỏ"
        onConfirm={handleResetData}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
