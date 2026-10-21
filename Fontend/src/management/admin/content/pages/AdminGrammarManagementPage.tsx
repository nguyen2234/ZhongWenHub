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

  // 2. Fetch all data with filters
  const grammarList = useMemo(() => {
    void version;
    return adminGrammarService.getAll(filters);
  }, [filters, version]);

  const stats = useMemo(() => {
    void version;
    return adminGrammarService.getStats();
  }, [version]);

  // Deep linking: auto-open drawer if `id` parameter is in URL
  useEffect(() => {
    if (urlId) {
      const found = adminGrammarService.getById(urlId);
      if (found) {
        setSelectedGrammar(found);
        setIsDrawerOpen(true);
      }
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

  const handleSaveGrammar = useCallback((id: string, dto: UpdateAdminGrammarDTO) => {
    adminGrammarService.update(id, dto);
    setVersion((v) => v + 1);
    const updated = adminGrammarService.getById(id);
    if (updated) setSelectedGrammar(updated);
  }, []);

  const handleDeleteGrammar = useCallback(
    (id: string) => {
      adminGrammarService.delete(id);
      setVersion((v) => v + 1);
      handleCloseDrawer();
    },
    [handleCloseDrawer]
  );

  const handleCreateGrammar = useCallback((dto: CreateAdminGrammarDTO) => {
    const created = adminGrammarService.create(dto);
    setVersion((v) => v + 1);
    setSelectedGrammar(created);
    setIsDrawerOpen(true);
  }, []);

  const handleResetData = useCallback(() => {
    adminGrammarService.resetToDefault();
    setVersion((v) => v + 1);
    setIsResetConfirmOpen(false);
    handleCloseDrawer();
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

      {/* Demo Transparent Disclaimer Banner */}
      <div
        style={{
          padding: '10px 14px',
          backgroundColor: '#FFFBEB',
          border: '1px solid #FCD34D',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: 'var(--text-xs)',
          color: '#92400E',
        }}
      >
        <AlertCircle size={16} style={{ flexShrink: 0 }} />
        <span>
          <strong>Lưu ý quản trị:</strong> Dữ liệu ngữ pháp được lưu trữ bền vững trong bộ nhớ phiên làm việc trình duyệt
          cục bộ (<code>zhongwenhub_admin_grammar_v1</code>). Nội dung tạo mới sẽ ở trạng thái Bản nháp và không tự động
          đưa vào thư viện học viên nếu chưa qua luồng xuất bản thực tế từ máy chủ.
        </span>
      </div>

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
          value={stats.pending}
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

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={paginatedData}
          keyExtractor={(item) => item.id}
          onRowClick={handleOpenDetail}
          emptyText="Không tìm thấy điểm ngữ pháp nào phù hợp với bộ lọc."
        />

        {/* Pagination */}
        {grammarList.length > pageSize && (
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
        message="Hành động này sẽ thiết lập lại toàn bộ danh mục 13 điểm ngữ pháp chuẩn HSK 1 - 6 và xóa bỏ các thay đổi cục bộ trong phiên làm việc. Bạn có chắc chắn muốn thực hiện?"
        confirmLabel="Đồng ý khôi phục"
        cancelLabel="Hủy bỏ"
        onConfirm={handleResetData}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
