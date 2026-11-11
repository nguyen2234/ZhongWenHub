import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  HelpCircle,
  Plus,
  CheckCircle2,
  Clock,
  FileText,
  Sparkles,
  RefreshCw,
  Edit3,
  Eye,
  Layers,
  AlertCircle,
  Upload,
  Download,
  ShieldCheck,
  Send,
  SearchCheck,
} from 'lucide-react';
import {
  PageHeader,
  StatCard,
  DataTable,
  TableToolbar,
  Pagination,
} from '../../../shared/components';
import { ContentStatusBadge } from '../components/ContentStatusBadge';
import { AdminExerciseDetailDrawer } from '../components/AdminExerciseDetailDrawer';
import { AdminCreateExerciseModal } from '../components/AdminCreateExerciseModal';
import { QuestionBankImportModal } from '../components/QuestionBankImportModal';
import { QuestionBankGenerateModal } from '../components/QuestionBankGenerateModal';
import {
  questionBankService,
  type QuestionBankStats,
} from '../services/question-bank.service';
import type { TableColumn } from '../../../shared/types';
import type {
  AdminExerciseFilters,
  AdminExerciseItem,
  CreateAdminExerciseDTO,
  QuestionReviewStatus,
  UpdateAdminExerciseDTO,
} from '../types/admin-content.types';
import type { ContentStatus } from '../types/common-content.types';
import type { ExerciseType, SkillCategory } from '../../../../features/exercise-engine/types';
import '../components/learning-content.css';

const SKILLS: Array<{ id: SkillCategory; label: string }> = [
  { id: 'vocabulary', label: 'Từ vựng (Vocabulary)' },
  { id: 'grammar', label: 'Ngữ pháp (Grammar)' },
  { id: 'reading', label: 'Đọc hiểu (Reading)' },
  { id: 'listening', label: 'Nghe (Listening)' },
  { id: 'sentence', label: 'Cấu trúc câu (Sentence)' },
  { id: 'comprehensive', label: 'Tổng hợp (Comprehensive)' },
];

const TYPES: Array<{ type: ExerciseType; label: string }> = [
  { type: 'multiple-choice', label: 'Trắc nghiệm' },
  { type: 'fill-blank', label: 'Điền khuyết' },
  { type: 'sentence-order', label: 'Sắp xếp câu' },
  { type: 'matching', label: 'Nối cặp' },
  { type: 'chinese-to-vietnamese', label: 'Hán → Việt' },
  { type: 'vietnamese-to-chinese', label: 'Việt → Hán' },
  { type: 'listen-choice', label: 'Nghe chọn' },
];

const REVIEW_BADGE_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
  APPROVED: { label: 'Đã duyệt', bg: '#DCFCE7', fg: '#166534' },
  PENDING_REVIEW: { label: 'Chờ kiểm duyệt', bg: '#FEF9C3', fg: '#854D0E' },
  REJECTED: { label: 'Từ chối', bg: '#FEE2E2', fg: '#991B1B' },
  DRAFT: { label: 'Nháp', bg: '#F1F5F9', fg: '#475569' },
};

const DIFFICULTY_LABEL: Record<string, { label: string; bg: string; fg: string }> = {
  easy: { label: 'Dễ', bg: '#ECFEFF', fg: '#0E7490' },
  medium: { label: 'Trung bình', bg: '#EEF2FF', fg: '#3730A3' },
  hard: { label: 'Khó', bg: '#FFF1F2', fg: '#9F1239' },
};

export const AdminExerciseBankPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialGrammarId = searchParams.get('grammarId') || undefined;
  const initialLessonId = searchParams.get('lessonId') || undefined;

  const [filters, setFilters] = useState<AdminExerciseFilters>({
    search: '',
    hskLevel: 'ALL',
    skill: 'ALL',
    type: 'ALL',
    difficulty: 'ALL',
    status: 'ALL',
    reviewStatus: 'ALL',
    tag: '',
    grammarPointId: initialGrammarId,
    lessonId: initialLessonId,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [exerciseList, setExerciseList] = useState<AdminExerciseItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<QuestionBankStats>({
    total: 0,
    published: 0,
    draft: 0,
    pendingReview: 0,
    approvedReview: 0,
    rejectedReview: 0,
    archived: 0,
    linkedToLessons: 0,
    standaloneBank: 0,
    byHsk: { 1: 0, 2: 0, 3: 0, 4: 0 },
    bySkill: {},
    byType: {},
    byDifficulty: {},
    byReviewStatus: {},
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<AdminExerciseItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [pageData, statsData] = await Promise.all([
        questionBankService.getQuestionBankPage(filters, currentPage, pageSize),
        questionBankService.getStats(),
      ]);
      setExerciseList(pageData.items);
      setTotalItems(pageData.totalItems);
      setTotalPages(Math.max(1, pageData.totalPages));
      setStats(statsData);
      setSelectedIds([]);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể tải Ngân hàng câu hỏi từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDetail = (item: AdminExerciseItem) => {
    setSelectedExercise(item);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedExercise(null);
  };

  const handleSaveExercise = async (id: string, dto: UpdateAdminExerciseDTO) => {
    await questionBankService.update(id, dto);
    setActionMessage('Đã cập nhật câu hỏi và đồng bộ điểm chất lượng.');
    await loadData();
    handleCloseDrawer();
  };

  const handleDeleteExercise = async (id: string) => {
    try {
      await questionBankService.delete(id);
      setActionMessage('Đã xóa câu hỏi khỏi ngân hàng.');
      await loadData();
      handleCloseDrawer();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể xóa câu hỏi đang gắn vào đề thi.');
    }
  };

  const handleCreateExercise = async (dto: CreateAdminExerciseDTO) => {
    try {
      const dupCheck = await questionBankService.checkDuplicates({
        hskLevel: dto.hskLevel,
        type: dto.type,
        promptHanzi: dto.promptHanzi,
        promptVietnamese: dto.promptVietnamese,
        correctAnswer: dto.correctSentence,
      });
      await questionBankService.create(dto);
      setActionMessage(
        dupCheck.hasDuplicates
          ? 'Đã tạo câu hỏi mới (Lưu ý: phát hiện câu hỏi tương tự trong kho).'
          : 'Đã tạo câu hỏi mới vào Ngân hàng câu hỏi.'
      );
      setIsCreateModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể tạo câu hỏi.');
    }
  };

  const handleQuickReviewApprove = async (item: AdminExerciseItem, publishImmediately = false) => {
    setErrorMessage(null);
    try {
      await questionBankService.reviewQuestion(
        item.id,
        'APPROVED',
        publishImmediately ? 'Duyệt và xuất bản từ CMS' : 'Đã kiểm duyệt hợp lệ từ CMS',
        publishImmediately
      );
      setActionMessage(
        publishImmediately
          ? `Đã duyệt và xuất bản "${item.title}".`
          : `Đã duyệt câu hỏi "${item.title}".`
      );
      await loadData();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể duyệt câu hỏi.');
    }
  };

  const handleQuickPublish = async (item: AdminExerciseItem) => {
    setErrorMessage(null);
    try {
      await questionBankService.publishQuestion(item.id);
      setActionMessage(`Đã xuất bản "${item.title}".`);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Câu hỏi cần được duyệt (APPROVED) trước khi xuất bản.');
    }
  };

  const handleBatchReview = async (publishImmediately: boolean) => {
    if (selectedIds.length === 0) return;
    setErrorMessage(null);
    try {
      const res = await questionBankService.batchReview(
        selectedIds,
        'APPROVED',
        'Duyệt hàng loạt từ CMS',
        publishImmediately
      );
      setActionMessage(
        `${publishImmediately ? 'Duyệt & xuất bản' : 'Duyệt'} thành công ${res.updatedCount}/${res.requestedCount} câu hỏi.`
      );
      await loadData();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Lỗi xử lý hàng loạt.');
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    setErrorMessage(null);
    try {
      const items = await questionBankService.exportQuestions(filters);
      let content = '';
      let mime = 'application/json;charset=utf-8';
      let ext = 'json';
      if (format === 'json') {
        content = JSON.stringify(items, null, 2);
      } else {
        mime = 'text/csv;charset=utf-8';
        ext = 'csv';
        const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const header = 'id,hskLevel,skill,type,difficulty,status,reviewStatus,title,promptHanzi,correctAnswer,sourceId,sourceLicense';
        const rows = items.map((x) =>
          [
            x.id,
            x.hskLevel,
            x.skill,
            x.type,
            x.difficulty,
            x.status,
            x.reviewStatus,
            x.title,
            x.promptHanzi,
            x.correctSentence,
            x.sourceId,
            x.sourceLicense,
          ]
            .map(esc)
            .join(',')
        );
        content = [header, ...rows].join('\n');
      }

      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zhongwenhub-question-bank.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      setActionMessage(`Đã xuất ${items.length} câu hỏi ra định dạng ${format.toUpperCase()}.`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể export dữ liệu.');
    }
  };

  const handleCheckDuplicatesFirst = async () => {
    if (!exerciseList[0]) return;
    const sample = exerciseList[0];
    try {
      const res = await questionBankService.checkDuplicates({
        hskLevel: sample.hskLevel,
        type: sample.type,
        promptHanzi: sample.promptHanzi,
        correctAnswer: sample.correctSentence,
        excludeId: sample.id,
      });
      setActionMessage(
        `Kiểm tra hash SHA-256 (${res.contentHash.slice(0, 12)}...): ${res.matches.length} bản ghi trùng khớp.`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Lỗi kiểm tra trùng lặp.');
    }
  };

  const toggleSelectAllPage = () => {
    if (selectedIds.length === exerciseList.length && exerciseList.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(exerciseList.map((e) => e.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const columns: TableColumn<AdminExerciseItem>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          aria-label="Chọn tất cả trang"
          checked={exerciseList.length > 0 && selectedIds.length === exerciseList.length}
          onChange={toggleSelectAllPage}
        />
      ) as unknown as string,
      width: '36px',
      render: (item) => (
        <input
          type="checkbox"
          aria-label={`Chọn ${item.title}`}
          checked={selectedIds.includes(item.id)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleSelectRow(item.id)}
        />
      ),
    },
    {
      key: 'hskSkill',
      header: 'HSK · Kỹ năng · Độ khó',
      width: '155px',
      render: (item) => {
        const diffMeta = DIFFICULTY_LABEL[item.difficulty] || DIFFICULTY_LABEL.medium;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span
                style={{
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: '10px',
                }}
              >
                HSK {item.hskLevel}
              </span>
              <span
                style={{
                  backgroundColor: diffMeta.bg,
                  color: diffMeta.fg,
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  fontSize: '10px',
                }}
              >
                {diffMeta.label}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
              {item.skill} · {item.type}
            </span>
          </div>
        );
      },
    },
    {
      key: 'title',
      header: 'Đề bài / Nội dung câu hỏi',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 'var(--text-xs)' }}>
            {item.title}
          </div>
          {item.promptHanzi && (
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
              {item.promptHanzi.length > 85 ? `${item.promptHanzi.slice(0, 85)}...` : item.promptHanzi}
            </div>
          )}
          <div style={{ display: 'flex', gap: '6px', marginTop: '3px', flexWrap: 'wrap', fontSize: '10px', color: 'var(--muted)' }}>
            {item.lessonTitle && <span>Bài: {item.lessonTitle}</span>}
            {item.sourceId && <span>Nguồn: {item.sourceId}</span>}
            {item.sourceLicense && <span>({item.sourceLicense})</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'answerKey',
      header: 'Đáp án & Điểm CL',
      width: '165px',
      render: (item) => {
        let answerText = '-';
        if (item.options && item.correctOptionIndex !== undefined && item.options[item.correctOptionIndex]) {
          answerText = `${String.fromCharCode(65 + item.correctOptionIndex)}. ${item.options[item.correctOptionIndex]}`;
        } else if (item.correctSentence) {
          answerText = item.correctSentence;
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#059669',
                backgroundColor: '#ECFDF5',
                padding: '2px 6px',
                borderRadius: '4px',
                maxWidth: '155px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={answerText}
            >
              {answerText}
            </span>
            {typeof item.qualityScore === 'number' && (
              <span style={{ fontSize: '10px', color: 'var(--muted)' }}>Chất lượng: {item.qualityScore}/100</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Kiểm duyệt & Xuất bản',
      width: '150px',
      render: (item) => {
        const rev = REVIEW_BADGE_STYLE[item.reviewStatus || 'DRAFT'] || REVIEW_BADGE_STYLE.DRAFT;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <ContentStatusBadge status={item.status} />
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: '4px',
                backgroundColor: rev.bg,
                color: rev.fg,
                width: 'fit-content',
              }}
            >
              {rev.label}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: '140px',
      align: 'right',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
          {item.reviewStatus !== 'APPROVED' && (
            <button
              type="button"
              className="ds-btn ds-btn-ghost"
              style={{ padding: '5px' }}
              onClick={(e) => {
                e.stopPropagation();
                handleQuickReviewApprove(item, false);
              }}
              title="Duyệt câu hỏi (APPROVED)"
            >
              <ShieldCheck size={15} color="#16A34A" />
            </button>
          )}
          {item.reviewStatus === 'APPROVED' && item.status !== 'PUBLISHED' && (
            <button
              type="button"
              className="ds-btn ds-btn-ghost"
              style={{ padding: '5px' }}
              onClick={(e) => {
                e.stopPropagation();
                handleQuickPublish(item);
              }}
              title="Xuất bản (PUBLISHED)"
            >
              <Send size={15} color="#0284C7" />
            </button>
          )}
          <button
            type="button"
            className="ds-btn ds-btn-ghost"
            style={{ padding: '5px' }}
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
            style={{ padding: '5px' }}
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
      <PageHeader
        title="Ngân hàng Câu hỏi HSK 1–4"
        subtitle="Kho câu hỏi thống nhất phục vụ Giáo trình, Kho đề thi và Luyện tập thích ứng (Adaptive Learning)"
        breadcrumb={
          <div style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', gap: '6px' }}>
            <span>Bàn làm việc</span>
            <span>/</span>
            <span>Học liệu & Biên tập</span>
            <span>/</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Ngân hàng câu hỏi</span>
          </div>
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="ds-btn ds-btn-secondary"
              onClick={() => handleExport('json')}
              style={{ height: '36px', fontSize: '12px' }}
              title="Xuất JSON theo bộ lọc"
            >
              <Download size={14} />
              <span>Export JSON</span>
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-secondary"
              onClick={() => setIsImportModalOpen(true)}
              style={{ height: '36px', fontSize: '12px' }}
            >
              <Upload size={14} />
              <span>Import JSON/CSV</span>
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-secondary"
              onClick={() => setIsGenerateModalOpen(true)}
              style={{ height: '36px', fontSize: '12px' }}
            >
              <Sparkles size={14} />
              <span>Sinh câu hỏi HSK</span>
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
              style={{ height: '36px', fontSize: '12px' }}
            >
              <Plus size={15} />
              <span>Tạo câu hỏi</span>
            </button>
          </div>
        }
      />

      {/* HSK Distribution Telemetry */}
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
          <span>Phân bố SQL Server thực tế ({stats.linkedToLessons} gắn bài học · {stats.standaloneBank} câu độc lập):</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map((l) => {
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
                  border: '1px solid var(--border)',
                }}
              >
                HSK {l}: <strong>{count}</strong> câu ({pct}%)
              </span>
            );
          })}
          <button
            type="button"
            className="ds-btn ds-btn-ghost"
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={handleCheckDuplicatesFirst}
            title="Kiểm tra nhanh SHA-256 trùng lặp"
          >
            <SearchCheck size={14} /> Check trùng
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
          title="Chờ kiểm duyệt (Review)"
          value={stats.pendingReview}
          icon={<Clock size={20} color="#EAB308" />}
        />
        <StatCard
          title="Bản nháp (Draft)"
          value={stats.draft}
          icon={<FileText size={20} color="#64748B" />}
        />
      </div>

      {/* Deep-link notice */}
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
              {filters.grammarPointId && <strong>Ngữ pháp: {filters.grammarPointId}</strong>}
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
              const np = new URLSearchParams(searchParams);
              np.delete('grammarId');
              np.delete('lessonId');
              setSearchParams(np);
              setCurrentPage(1);
            }}
          >
            Bỏ lọc liên kết
          </button>
        </div>
      )}

      {/* Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#F0F9FF',
            border: '1px solid #BAE6FD',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            fontSize: 'var(--text-xs)',
          }}
        >
          <span>
            Đã chọn <strong>{selectedIds.length}</strong> câu hỏi trên trang này.
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="ds-btn ds-btn-secondary"
              style={{ height: '32px', fontSize: '12px' }}
              onClick={() => handleBatchReview(false)}
            >
              <ShieldCheck size={14} /> Duyệt (APPROVED)
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-primary"
              style={{ height: '32px', fontSize: '12px' }}
              onClick={() => handleBatchReview(true)}
            >
              <Send size={14} /> Duyệt & Xuất bản
            </button>
          </div>
        </div>
      )}

      {/* Feedback messages */}
      {actionMessage && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: 'var(--radius-md)',
            color: '#065F46',
            fontSize: 'var(--text-xs)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{actionMessage}</span>
          <button
            type="button"
            className="ds-btn ds-btn-ghost"
            style={{ fontSize: '11px', padding: '2px 6px' }}
            onClick={() => setActionMessage(null)}
          >
            Ẩn
          </button>
        </div>
      )}

      {/* Table + Filters */}
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
          searchPlaceholder="Tìm tiêu đề, chữ Hán, nguồn, tags..."
          filterActions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <select
                className="ds-input"
                aria-label="Lọc cấp độ HSK"
                value={filters.hskLevel}
                onChange={(e) => {
                  const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                  setFilters((prev) => ({ ...prev, hskLevel: val }));
                  setCurrentPage(1);
                }}
                style={{ height: '36px', fontSize: 'var(--text-xs)' }}
              >
                <option value="ALL">Tất cả HSK</option>
                {[1, 2, 3, 4].map((l) => (
                  <option key={l} value={l}>
                    HSK {l} ({stats.byHsk[l] || 0})
                  </option>
                ))}
              </select>

              <select
                className="ds-input"
                aria-label="Lọc kỹ năng"
                value={filters.skill}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, skill: e.target.value as SkillCategory | 'ALL' }));
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

              <select
                className="ds-input"
                aria-label="Lọc dạng bài"
                value={filters.type}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, type: e.target.value as ExerciseType | 'ALL' }));
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

              <select
                className="ds-input"
                aria-label="Lọc độ khó"
                value={filters.difficulty}
                onChange={(e) => {
                  setFilters((prev) => ({
                    ...prev,
                    difficulty: e.target.value as AdminExerciseFilters['difficulty'],
                  }));
                  setCurrentPage(1);
                }}
                style={{ height: '36px', fontSize: 'var(--text-xs)' }}
              >
                <option value="ALL">Tất cả độ khó</option>
                <option value="easy">Dễ</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Khó</option>
              </select>

              <select
                className="ds-input"
                aria-label="Lọc kiểm duyệt"
                value={filters.reviewStatus || 'ALL'}
                onChange={(e) => {
                  setFilters((prev) => ({
                    ...prev,
                    reviewStatus: e.target.value as QuestionReviewStatus | 'ALL',
                  }));
                  setCurrentPage(1);
                }}
                style={{ height: '36px', fontSize: 'var(--text-xs)' }}
              >
                <option value="ALL">Kiểm duyệt: Tất cả</option>
                <option value="PENDING_REVIEW">Chờ kiểm duyệt ({stats.pendingReview})</option>
                <option value="APPROVED">Đã duyệt ({stats.approvedReview})</option>
                <option value="REJECTED">Từ chối ({stats.rejectedReview})</option>
                <option value="DRAFT">Nháp</option>
              </select>

              <select
                className="ds-input"
                aria-label="Lọc trạng thái xuất bản"
                value={filters.status}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, status: e.target.value as ContentStatus | 'ALL' }));
                  setCurrentPage(1);
                }}
                style={{ height: '36px', fontSize: 'var(--text-xs)' }}
              >
                <option value="ALL">Xuất bản: Tất cả</option>
                <option value="PUBLISHED">Đã xuất bản ({stats.published})</option>
                <option value="DRAFT">Bản nháp ({stats.draft})</option>
                <option value="ARCHIVED">Lưu trữ ({stats.archived})</option>
              </select>

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
                    reviewStatus: 'ALL',
                    tag: '',
                    grammarPointId: undefined,
                    lessonId: undefined,
                  });
                  setCurrentPage(1);
                  setSearchParams({});
                }}
                style={{ height: '36px', fontSize: 'var(--text-xs)' }}
              >
                Xóa lọc
              </button>

              <button
                type="button"
                className="ds-btn ds-btn-ghost"
                onClick={loadData}
                style={{ height: '36px', fontSize: 'var(--text-xs)' }}
                title="Làm mới"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          }
        />

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
              marginBottom: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
            <button type="button" className="ds-btn ds-btn-outline ds-btn-sm" onClick={loadData}>
              Thử lại
            </button>
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--muted)' }}>
            Đang tải dữ liệu Ngân hàng câu hỏi từ SQL Server...
          </div>
        ) : (
          <DataTable<AdminExerciseItem>
            columns={columns}
            data={exerciseList}
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
                    backgroundColor: 'rgba(2, 132, 199, 0.08)',
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
                {item.skill} · {item.type} · {item.reviewStatus || 'DRAFT'}
              </span>
            )}
            mobileBadgeExtractor={(item) => <ContentStatusBadge status={item.status} />}
            mobileFields={[
              { label: 'Độ khó', render: (item) => <span>{item.difficulty}</span> },
              { label: 'Nguồn', render: (item) => <span>{item.sourceId || '-'}</span> },
            ]}
          />
        )}

        {!isLoading && totalItems > pageSize && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <AdminExerciseDetailDrawer
        isOpen={isDrawerOpen}
        exercise={selectedExercise}
        onClose={handleCloseDrawer}
        onSave={handleSaveExercise}
        onDelete={handleDeleteExercise}
        onNavigateToGrammar={(gid) => navigate(`/management/content-manager/grammar?search=${encodeURIComponent(gid)}`)}
        onNavigateToLesson={(lid) => navigate(`/management/content-manager/curriculum/${lid}/edit`)}
      />

      <AdminCreateExerciseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateExercise}
        prefilledGrammarId={filters.grammarPointId}
        prefilledLessonId={filters.lessonId}
      />

      <QuestionBankImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImported={loadData}
      />

      <QuestionBankGenerateModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onGenerated={loadData}
      />
    </div>
  );
};
