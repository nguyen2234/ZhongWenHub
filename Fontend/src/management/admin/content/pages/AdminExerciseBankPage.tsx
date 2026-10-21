import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  RotateCcw,
  Eye,
  Edit3,
  HelpCircle,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Layers,
  Sparkles,
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
import { AdminExerciseDetailDrawer } from '../components/AdminExerciseDetailDrawer';
import { AdminCreateExerciseModal } from '../components/AdminCreateExerciseModal';
import { adminExerciseService } from '../services/admin-exercise.service';
import type {
  AdminExerciseItem,
  AdminExerciseFilters,
  CreateAdminExerciseDTO,
  UpdateAdminExerciseDTO,
} from '../types/admin-content.types';
import type {
  ExerciseType,
  SkillCategory,
} from '../../../../features/exercise-engine/types';
import type { TableColumn } from '../../../shared/types';
import type { ContentStatus } from '../types/common-content.types';

const SKILLS: Array<{ id: SkillCategory; label: string }> = [
  { id: 'vocabulary', label: 'Từ vựng' },
  { id: 'grammar', label: 'Ngữ pháp' },
  { id: 'listening', label: 'Nghe' },
  { id: 'reading', label: 'Đọc hiểu' },
  { id: 'sentence', label: 'Cấu trúc' },
  { id: 'comprehensive', label: 'Tổng hợp' },
];

const TYPES: Array<{ type: ExerciseType; label: string }> = [
  { type: 'multiple-choice', label: 'Trắc nghiệm (MC)' },
  { type: 'fill-blank', label: 'Điền từ (Fill Blank)' },
  { type: 'sentence-order', label: 'Sắp xếp câu (Sentence Order)' },
  { type: 'matching', label: 'Nối từ (Matching)' },
  { type: 'chinese-to-vietnamese', label: 'Dịch Hán-Việt' },
  { type: 'vietnamese-to-chinese', label: 'Dịch Việt-Hán' },
  { type: 'listen-choice', label: 'Luyện nghe (Listen Choice)' },
];

export const AdminExerciseBankPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // 1. Deep link query params
  const urlId = searchParams.get('id');
  const urlGrammarId = searchParams.get('grammarId');
  const urlLessonId = searchParams.get('lessonId');
  const urlHsk = searchParams.get('hsk');

  const [filters, setFilters] = useState<AdminExerciseFilters>({
    search: '',
    hskLevel: urlHsk ? Number(urlHsk) : 'ALL',
    skill: 'ALL',
    type: 'ALL',
    difficulty: 'ALL',
    status: 'ALL',
    grammarPointId: urlGrammarId || undefined,
    lessonId: urlLessonId || undefined,
  });

  const [version, setVersion] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState<AdminExerciseItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 2. Fetch data
  const exerciseList = useMemo(() => {
    void version;
    return adminExerciseService.getAll(filters);
  }, [filters, version]);

  const stats = useMemo(() => {
    void version;
    return adminExerciseService.getStats();
  }, [version]);

  // Deep linking: auto-open drawer if `id` parameter is in URL
  useEffect(() => {
    if (urlId) {
      const found = adminExerciseService.getById(urlId);
      if (found) {
        setSelectedExercise(found);
        setIsDrawerOpen(true);
      }
    }
  }, [urlId]);

  // Sync params on change
  useEffect(() => {
    if (urlGrammarId) {
      setFilters((prev) => ({ ...prev, grammarPointId: urlGrammarId }));
    }
    if (urlLessonId) {
      setFilters((prev) => ({ ...prev, lessonId: urlLessonId }));
    }
    if (urlHsk && Number(urlHsk) >= 1 && Number(urlHsk) <= 6) {
      setFilters((prev) => ({ ...prev, hskLevel: Number(urlHsk) }));
    }
  }, [urlGrammarId, urlLessonId, urlHsk]);

  // 3. Pagination calculations
  const totalPages = Math.ceil(exerciseList.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return exerciseList.slice(start, start + pageSize);
  }, [exerciseList, currentPage]);

  const handleOpenDetail = useCallback(
    (item: AdminExerciseItem) => {
      setSelectedExercise(item);
      setIsDrawerOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.set('id', item.id);
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedExercise(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('id');
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handleSaveExercise = useCallback((id: string, dto: UpdateAdminExerciseDTO) => {
    adminExerciseService.update(id, dto);
    setVersion((v) => v + 1);
    const updated = adminExerciseService.getById(id);
    if (updated) setSelectedExercise(updated);
  }, []);

  const handleDeleteExercise = useCallback(
    (id: string) => {
      adminExerciseService.delete(id);
      setVersion((v) => v + 1);
      handleCloseDrawer();
    },
    [handleCloseDrawer]
  );

  const handleCreateExercise = useCallback((dto: CreateAdminExerciseDTO) => {
    const created = adminExerciseService.create(dto);
    setVersion((v) => v + 1);
    setSelectedExercise(created);
    setIsDrawerOpen(true);
  }, []);

  const handleResetData = useCallback(() => {
    adminExerciseService.resetToDefault();
    setVersion((v) => v + 1);
    setIsResetConfirmOpen(false);
    handleCloseDrawer();
  }, [handleCloseDrawer]);

  const location = useLocation();
  const isContentManager = location.pathname.includes('/content-manager');
  const basePath = isContentManager ? '/management/content-manager' : '/management/admin';

  const handleNavigateToGrammar = useCallback(
    (grammarId: string) => {
      navigate(`${basePath}/grammar?id=${grammarId}`);
    },
    [navigate, basePath]
  );

  const handleNavigateToLesson = useCallback(
    (lessonId: string) => {
      navigate(`${basePath}/curriculum/lessons/${lessonId}/edit`);
    },
    [navigate, basePath]
  );

  // 4. Data Table columns
  const columns: TableColumn<AdminExerciseItem>[] = [
    {
      key: 'id',
      header: 'Mã câu hỏi',
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
          {item.id}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Dạng bài tập',
      width: '130px',
      render: (item) => (
        <span
          style={{
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            color: 'var(--text-main)',
            display: 'inline-block',
          }}
        >
          {item.type}
        </span>
      ),
    },
    {
      key: 'hskSkill',
      header: 'HSK & Kỹ năng',
      width: '130px',
      render: (item) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span
            style={{
              backgroundColor: '#EFF6FF',
              color: '#1D4ED8',
              padding: '1px 6px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '10px',
              width: 'fit-content',
            }}
          >
            HSK {item.hskLevel}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{item.skill}</span>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Đề bài / Tóm tắt câu hỏi',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 'var(--text-xs)' }}>
            {item.title}
          </div>
          {item.promptHanzi && (
            <div
              style={{
                fontSize: '11px',
                color: '#334155',
                fontFamily: 'monospace',
                marginTop: '2px',
              }}
            >
              {item.promptHanzi}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'answerKey',
      header: 'Đáp án chuẩn',
      width: '160px',
      render: (item) => {
        let answerText = '-';
        if (item.options && item.correctOptionIndex !== undefined) {
          answerText = `${String.fromCharCode(65 + item.correctOptionIndex)}. ${item.options[item.correctOptionIndex] || ''}`;
        } else if (item.correctSentence) {
          answerText = item.correctSentence;
        } else if (item.matchingPairs) {
          answerText = `${item.matchingPairs.length} cặp tương ứng`;
        }

        return (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#059669',
              backgroundColor: '#ECFDF5',
              padding: '2px 6px',
              borderRadius: '4px',
              display: 'inline-block',
              maxWidth: '150px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={answerText}
          >
            {answerText}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '110px',
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
            title="Xem trước Live Engine"
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
            title="Biên tập câu hỏi"
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
        title="Ngân hàng Bài tập & Câu hỏi"
        subtitle="Quản lý kho câu hỏi thực hành đa kỹ năng, xem trước bằng Exercise Engine và tích hợp với bài học & điểm ngữ pháp"
        breadcrumb={
          <div style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', gap: '6px' }}>
            <span>Bàn làm việc</span>
            <span>/</span>
            <span>Học liệu</span>
            <span>/</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Ngân hàng bài tập</span>
          </div>
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="ds-btn ds-btn-secondary"
              onClick={() => setIsResetConfirmOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px' }}
              title="Khôi phục kho bài tập ban đầu"
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
              <span>Tạo câu hỏi</span>
            </button>
          </div>
        }
      />

      {/* Demo Disclaimer */}
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
          <strong>Lưu ý quản trị:</strong> Dữ liệu câu hỏi bài tập được đồng bộ và lưu trữ cục bộ trong phiên trình duyệt
          (<code>zhongwenhub_admin_exercises_v1</code>). Phần xem trước sử dụng trực tiếp engine của học viên để đảm bảo
          tính tương thích 100%.
        </span>
      </div>

      {/* Real Metadata HSK Distribution Bar */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
          <Sparkles size={16} color="var(--primary)" />
          <span>Phân bố HSK thực tế (No Fake Levels):</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5, 6].map((l) => {
            const count = stats.byHsk[l] || 0;
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return (
              <span
                key={l}
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: count > 0 ? '#F1F5F9' : '#F8FAFC',
                  color: count > 0 ? 'var(--text-main)' : 'var(--muted)',
                  border: count > 0 ? '1px solid var(--border)' : '1px dashed #CBD5E1',
                }}
              >
                HSK {l}: <strong>{count}</strong> câu ({pct}%)
              </span>
            );
          })}
        </div>
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
          title="Tổng câu hỏi trong kho"
          value={stats.total}
          icon={<HelpCircle size={20} color="var(--primary)" />}
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

      {/* Active Deep-link Tag Notice if filtered */}
      {(filters.grammarPointId || filters.lessonId) && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={14} color="#1D4ED8" />
            <span>
              Đang lọc theo liên kết:&nbsp;
              {filters.grammarPointId && <strong>Điểm ngữ pháp: {filters.grammarPointId}</strong>}
              {filters.grammarPointId && filters.lessonId && ' | '}
              {filters.lessonId && <strong>Bài học: {filters.lessonId}</strong>}
            </span>
          </div>

          <button
            type="button"
            className="ds-btn ds-btn-ghost"
            style={{ height: '24px', fontSize: '11px', color: '#1D4ED8' }}
            onClick={() => {
              setFilters((prev) => ({ ...prev, grammarPointId: undefined, lessonId: undefined }));
              const newParams = new URLSearchParams(searchParams);
              newParams.delete('grammarId');
              newParams.delete('lessonId');
              setSearchParams(newParams);
            }}
          >
            Bỏ lọc liên kết
          </button>
        </div>
      )}

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
          searchPlaceholder="Tìm kiếm mã, đề bài, chữ Hán, đáp án..."
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
                <option value="ALL">Tất cả HSK (1 - 6)</option>
                {[1, 2, 3, 4, 5, 6].map((l) => (
                  <option key={l} value={l}>
                    HSK {l} ({stats.byHsk[l] || 0})
                  </option>
                ))}
              </select>

              {/* Skill Filter */}
              <select
                className="ds-input"
                value={filters.skill}
                onChange={(e) => {
                  setFilters((prev) => ({
                    ...prev,
                    skill: e.target.value as SkillCategory | 'ALL',
                  }));
                  setCurrentPage(1);
                }}
                style={{ height: '36px', fontSize: 'var(--text-xs)' }}
              >
                <option value="ALL">Tất cả kỹ năng</option>
                {SKILLS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({stats.bySkill[s.id] || 0})
                  </option>
                ))}
              </select>

              {/* Type Filter */}
              <select
                className="ds-input"
                value={filters.type}
                onChange={(e) => {
                  setFilters((prev) => ({
                    ...prev,
                    type: e.target.value as ExerciseType | 'ALL',
                  }));
                  setCurrentPage(1);
                }}
                style={{ height: '36px', fontSize: 'var(--text-xs)' }}
              >
                <option value="ALL">Tất cả dạng bài</option>
                {TYPES.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.label} ({stats.byType[t.type] || 0})
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
                <option value="PENDING_REVIEW">Chờ duyệt</option>
                <option value="DRAFT">Bản nháp</option>
                <option value="ARCHIVED">Lưu trữ</option>
              </select>

              {(filters.search ||
                filters.hskLevel !== 'ALL' ||
                filters.skill !== 'ALL' ||
                filters.type !== 'ALL' ||
                filters.status !== 'ALL' ||
                filters.grammarPointId ||
                filters.lessonId) && (
                <button
                  type="button"
                  className="ds-btn ds-btn-ghost"
                  onClick={() => {
                    setFilters({
                      search: '',
                      hskLevel: 'ALL',
                      skill: 'ALL',
                      type: 'ALL',
                      difficulty: 'ALL',
                      status: 'ALL',
                      grammarPointId: undefined,
                      lessonId: undefined,
                    });
                    setCurrentPage(1);
                    setSearchParams({});
                  }}
                  style={{ height: '36px', fontSize: 'var(--text-xs)', color: 'var(--primary)' }}
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          }
        />

        {/* Data Table with Evondev Mobile Card Support (R9 & R11) */}
        <DataTable<AdminExerciseItem>
          columns={columns}
          data={paginatedData}
          keyExtractor={(item) => item.id}
          onRowClick={handleOpenDetail}
          emptyText="Không tìm thấy câu hỏi nào phù hợp với bộ lọc."
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
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
              Mã: {item.id} • Dạng bài: {item.type}
            </span>
          )}
          mobileBadgeExtractor={(item) => <ContentStatusBadge status={item.status} />}
          mobileFields={[
            {
              label: 'Kỹ năng',
              render: (item) => <span style={{ textTransform: 'capitalize' }}>{item.skill}</span>,
            },
            {
              label: 'Thưởng XP',
              render: (item) => (
                <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  +{item.xpReward} XP
                </span>
              ),
            },
          ]}
        />

        {/* Pagination */}
        {exerciseList.length > pageSize && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={exerciseList.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <AdminExerciseDetailDrawer
        isOpen={isDrawerOpen}
        exercise={selectedExercise}
        onClose={handleCloseDrawer}
        onSave={handleSaveExercise}
        onDelete={handleDeleteExercise}
        onNavigateToGrammar={handleNavigateToGrammar}
        onNavigateToLesson={handleNavigateToLesson}
      />

      {/* Create Modal */}
      <AdminCreateExerciseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateExercise}
        prefilledGrammarId={filters.grammarPointId}
        prefilledLessonId={filters.lessonId}
      />

      {/* Reset Confirmation */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Khôi phục Ngân hàng bài tập gốc"
        message="Hành động này sẽ khôi phục lại kho câu hỏi mẫu ban đầu và xóa bỏ các thay đổi bài tập trong phiên làm việc trình duyệt. Bạn có chắc chắn muốn thực hiện?"
        confirmLabel="Đồng ý khôi phục"
        cancelLabel="Hủy bỏ"
        onConfirm={handleResetData}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
