import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  RefreshCw,
  Edit3,
  Eye,
  ListChecks,
  Send,
  CheckCircle2,
  Archive,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { PageHeader, StatCard, DataTable, ConfirmDialog } from '../../../shared/components';
import { ContentStatusBadge } from '../components/ContentStatusBadge';
import { ExamFormModal } from '../components/ExamFormModal';
import { ExamQuestionsModal } from '../components/ExamQuestionsModal';
import { ExamPreviewModal } from '../components/ExamPreviewModal';
import { examRepositoryService } from '../services/exam-repository.service';
import type { TableColumn } from '../../../shared/types';
import type { ContentStatus } from '../types/common-content.types';
import type {
  CreateExamInput,
  ExamDetail,
  ExamFilters,
  ExamStats,
  ExamSummary,
  ExamType,
  UpdateExamInput,
  UpsertExamQuestionInput,
} from '../types/exam-repository.types';
import '../components/learning-content.css';

const TYPE_LABELS: Record<ExamType, string> = {
  MOCK: 'Thi thử HSK',
  PRACTICE: 'Luyện tập',
  PLACEMENT: 'Đầu vào',
  MIDTERM: 'Giữa khóa',
  FINAL: 'Cuối khóa',
};

export const AdminExamRepositoryPage: React.FC = () => {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [stats, setStats] = useState<ExamStats>({
    total: 0,
    published: 0,
    draft: 0,
    pending: 0,
    archived: 0,
    byHsk: {},
  });
  const [filters, setFilters] = useState<ExamFilters>({
    search: '',
    hskLevel: 'ALL',
    examType: 'ALL',
    status: 'ALL',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamSummary | null>(null);
  const [questionsExam, setQuestionsExam] = useState<ExamDetail | null>(null);
  const [previewExam, setPreviewExam] = useState<ExamDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamSummary | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorBanner(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        examRepositoryService.getExams(filters, 1, 50),
        examRepositoryService.getStats(),
      ]);
      setExams(listRes.items);
      setStats(statsRes);
    } catch (err: any) {
      setErrorBanner(err?.message || 'Không thể tải danh sách Kho đề thi từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 3500);
  };

  const handleSaveExam = async (payload: CreateExamInput | UpdateExamInput) => {
    if (editingExam) {
      await examRepositoryService.updateExam(editingExam.id, payload);
      showSuccess(`Đã cập nhật đề thi ${payload.code}.`);
    } else {
      await examRepositoryService.createExam(payload as CreateExamInput);
      showSuccess(`Đã tạo đề thi nháp ${payload.code}.`);
    }
    await loadData();
  };

  const handleOpenQuestions = async (exam: ExamSummary) => {
    setErrorBanner(null);
    try {
      const detail = await examRepositoryService.getExamById(exam.id);
      setQuestionsExam(detail);
    } catch (err: any) {
      setErrorBanner(err?.message || 'Không thể tải chi tiết câu hỏi của đề thi.');
    }
  };

  const handleOpenPreview = async (exam: ExamSummary) => {
    setErrorBanner(null);
    try {
      const detail = await examRepositoryService.getExamById(exam.id);
      setPreviewExam(detail);
    } catch (err: any) {
      setErrorBanner(err?.message || 'Không thể tải xem trước đề thi.');
    }
  };

  const handleSaveQuestions = async (examId: string, questions: UpsertExamQuestionInput[]) => {
    await examRepositoryService.setExamQuestions(examId, questions);
    showSuccess('Đã cập nhật bộ câu hỏi và điểm cho đề thi.');
    await loadData();
  };

  const handleReviewStatus = async (exam: ExamSummary, status: ContentStatus) => {
    setErrorBanner(null);
    try {
      await examRepositoryService.reviewExam(exam.id, status);
      showSuccess(`Đã chuyển trạng thái đề thi ${exam.code} sang ${status}.`);
      await loadData();
    } catch (err: any) {
      setErrorBanner(err?.message || 'Không thể thay đổi trạng thái đề thi.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setErrorBanner(null);
    try {
      await examRepositoryService.deleteExam(deleteTarget.id);
      showSuccess(`Đã xóa đề thi ${deleteTarget.code}.`);
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      setErrorBanner(err?.message || 'Không thể xóa đề thi.');
      setDeleteTarget(null);
    }
  };

  const columns: TableColumn<ExamSummary>[] = [
    {
      key: 'title',
      header: 'Đề thi',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--primary)', marginRight: '6px' }}>{row.code}</span>
            {row.title}
          </div>
          {row.description && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '2px' }}>
              {row.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'hskLevel',
      header: 'HSK / Loại',
      render: (row) => (
        <div style={{ fontSize: 'var(--text-xs)' }}>
          <strong>HSK {row.hskLevel}</strong>
          <div style={{ color: 'var(--muted)' }}>{TYPE_LABELS[row.examType] || row.examType}</div>
        </div>
      ),
    },
    {
      key: 'durationMinutes',
      header: 'Cấu hình',
      render: (row) => (
        <div style={{ fontSize: 'var(--text-xs)' }}>
          <div>{row.durationMinutes} phút · {row.questionCount} câu</div>
          <div style={{ color: 'var(--muted)' }}>
            Đạt: {row.passingScore}/{row.totalPoints} điểm
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => <ContentStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (row) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          <button
            type="button"
            className="ds-btn ds-btn-ghost ds-btn-sm"
            onClick={() => handleOpenPreview(row)}
            title="Xem trước đề thi"
          >
            <Eye size={13} />
          </button>
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={() => handleOpenQuestions(row)}
            title="Thêm / Sắp xếp câu hỏi từ Ngân hàng câu hỏi"
          >
            <ListChecks size={13} /> Câu hỏi ({row.questionCount})
          </button>
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={() => {
              setEditingExam(row);
              setIsFormOpen(true);
            }}
            title="Sửa thông tin đề thi"
          >
            <Edit3 size={13} />
          </button>
          {row.status === 'DRAFT' && (
            <button
              type="button"
              className="ds-btn ds-btn-outline ds-btn-sm"
              onClick={() => handleReviewStatus(row, 'PENDING_REVIEW')}
              title="Gửi kiểm duyệt"
            >
              <Send size={13} />
            </button>
          )}
          {row.status === 'PENDING_REVIEW' && (
            <button
              type="button"
              className="ds-btn ds-btn-primary ds-btn-sm"
              onClick={() => handleReviewStatus(row, 'PUBLISHED')}
              title="Xuất bản đề thi"
            >
              <CheckCircle2 size={13} />
            </button>
          )}
          {row.status !== 'ARCHIVED' && (
            <button
              type="button"
              className="ds-btn ds-btn-ghost ds-btn-sm"
              onClick={() => handleReviewStatus(row, 'ARCHIVED')}
              title="Lưu trữ (an toàn khi đã có lượt làm bài)"
            >
              <Archive size={13} />
            </button>
          )}
          <button
            type="button"
            className="ds-btn ds-btn-ghost ds-btn-sm"
            onClick={() => setDeleteTarget(row)}
            title="Xóa đề thi nháp"
            style={{ color: 'var(--danger, #ef4444)' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="lcm-page">
      <PageHeader
        title="Kho đề thi"
        subtitle="Quản lý bộ đề luyện tập, đề thi thử HSK 1 – HSK 6 (HSK 2.0) liên kết trực tiếp Ngân hàng câu hỏi."
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button type="button" className="ds-btn ds-btn-outline ds-btn-sm" onClick={loadData}>
              <RefreshCw size={14} /> Làm mới
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-primary ds-btn-sm"
              onClick={() => {
                setEditingExam(null);
                setIsFormOpen(true);
              }}
            >
              <Plus size={14} /> Tạo đề thi
            </button>
          </div>
        }
      />

      {errorBanner && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--danger, #ef4444)',
            fontSize: 'var(--text-xs)',
            marginBottom: 'var(--space-3)',
          }}
        >
          <AlertCircle size={16} />
          <span>{errorBanner}</span>
        </div>
      )}

      {successBanner && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: '#dcfce7',
            border: '1px solid #86efac',
            borderRadius: 'var(--radius-lg)',
            color: '#166534',
            fontSize: 'var(--text-xs)',
            marginBottom: 'var(--space-3)',
          }}
        >
          {successBanner}
        </div>
      )}

      <div className="ds-grid-4" style={{ marginBottom: 'var(--space-4)' }}>
        <StatCard title="Tổng số đề thi" value={stats.total} icon={<ClipboardList size={18} />} />
        <StatCard title="Đã xuất bản" value={stats.published} icon={<CheckCircle2 size={18} />} />
        <StatCard title="Chờ duyệt" value={stats.pending} icon={<Send size={18} />} />
        <StatCard title="Nháp / Lưu trữ" value={stats.draft + stats.archived} icon={<Archive size={18} />} />
      </div>

      {/* Filters */}
      <div
        className="ds-card"
        style={{
          padding: 'var(--space-3) var(--space-4)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--muted)' }} />
          <input
            type="text"
            className="ds-input"
            style={{ paddingLeft: '32px' }}
            placeholder="Tìm theo mã đề hoặc tên đề thi..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>

        <select
          className="lcm-select-filter"
          value={filters.hskLevel}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              hskLevel: e.target.value === 'ALL' ? 'ALL' : Number(e.target.value),
            }))
          }
        >
          <option value="ALL">Tất cả cấp độ HSK</option>
          {[1, 2, 3, 4, 5, 6].map((lvl) => (
            <option key={lvl} value={lvl}>
              HSK {lvl}
            </option>
          ))}
        </select>

        <select
          className="lcm-select-filter"
          value={filters.examType}
          onChange={(e) => setFilters((f) => ({ ...f, examType: e.target.value as ExamType | 'ALL' }))}
        >
          <option value="ALL">Tất cả loại đề</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

        <select
          className="lcm-select-filter"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as ContentStatus | 'ALL' }))}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="DRAFT">Bản nháp (DRAFT)</option>
          <option value="PENDING_REVIEW">Chờ duyệt (PENDING_REVIEW)</option>
          <option value="PUBLISHED">Đã xuất bản (PUBLISHED)</option>
          <option value="ARCHIVED">Đã lưu trữ (ARCHIVED)</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={exams}
        loading={isLoading}
        emptyText="Chưa có đề thi nào khớp với bộ lọc. Nhấn 'Tạo đề thi' để thêm đề mới."
        keyExtractor={(row) => row.id}
      />

      <ExamFormModal
        isOpen={isFormOpen}
        exam={editingExam}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveExam}
      />

      <ExamQuestionsModal
        isOpen={Boolean(questionsExam)}
        exam={questionsExam}
        onClose={() => setQuestionsExam(null)}
        onSaveQuestions={handleSaveQuestions}
      />

      <ExamPreviewModal
        isOpen={Boolean(previewExam)}
        exam={previewExam}
        onClose={() => setPreviewExam(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Xác nhận xóa đề thi"
        message={
          deleteTarget
            ? `Bạn có chắc muốn xóa đề thi ${deleteTarget.code} (${deleteTarget.title})? Nếu đề thi đã có học viên làm bài hoặc đang PUBLISHED, hệ thống sẽ chặn xóa và yêu cầu lưu trữ (ARCHIVED).`
            : ''
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isDestructive
      />
    </div>
  );
};
