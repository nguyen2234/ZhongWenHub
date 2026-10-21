import React, { useMemo } from 'react';
import {
  Eye,
  Edit2,
  Copy,
  Send,
  Lock,
  Archive,
  Calendar,
  Clock,
  Award,
} from 'lucide-react';
import { StatusBadge, ManagementDataTable } from '../../../shared/components';
import type { TableColumn, RowAction } from '../../../shared/types';
import type { AssignmentSummaryDTO, AssignmentStatus } from '../../types';

interface AssignmentTableProps {
  assignments: AssignmentSummaryDTO[];
  loading?: boolean;
  onView: (assignment: AssignmentSummaryDTO) => void;
  onEdit: (assignment: AssignmentSummaryDTO) => void;
  onDuplicate: (assignment: AssignmentSummaryDTO) => void;
  onPublish: (assignment: AssignmentSummaryDTO) => void;
  onClose: (assignment: AssignmentSummaryDTO) => void;
  onArchive: (assignment: AssignmentSummaryDTO) => void;
}

export const AssignmentTable: React.FC<AssignmentTableProps> = ({
  assignments,
  loading = false,
  onView,
  onEdit,
  onDuplicate,
  onPublish,
  onClose,
  onArchive,
}) => {
  const getStatusVariant = (st: AssignmentStatus) => {
    switch (st) {
      case 'PUBLISHED':
        return 'success';
      case 'DRAFT':
        return 'warning';
      case 'CLOSED':
        return 'neutral';
      case 'ARCHIVED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const getStatusLabel = (st: AssignmentStatus) => {
    switch (st) {
      case 'DRAFT':
        return 'Bản nháp';
      case 'PUBLISHED':
        return 'Đã phát hành';
      case 'CLOSED':
        return 'Đã đóng nộp';
      case 'ARCHIVED':
        return 'Đã lưu trữ';
      default:
        return st;
    }
  };

  const columns: TableColumn<AssignmentSummaryDTO>[] = useMemo(
    () => [
      {
        key: 'title',
        header: 'Tiêu đề & Cấp độ',
        render: (asgn) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: `${asgn.hskLevelColor}15`,
                  color: asgn.hskLevelColor,
                  fontWeight: 700,
                  fontSize: '11px',
                  border: `1px solid ${asgn.hskLevelColor}30`,
                }}
              >
                {asgn.hskLevelName}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                {asgn.title}
              </span>
            </div>
            {asgn.description && (
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--muted)',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {asgn.description}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'classes',
        header: 'Lớp giao',
        hideOnMobile: true,
        render: (asgn) =>
          asgn.targetClassNames.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {asgn.targetClassNames.map((name, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--surface-hover)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Chưa giao lớp
            </span>
          ),
      },
      {
        key: 'dueDate',
        header: 'Hạn nộp',
        hideOnMobile: true,
        render: (asgn) =>
          asgn.earliestDueDate ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--foreground)' }}>
              <Calendar size={13} style={{ color: 'var(--muted)' }} />
              <span className="tabular-nums">{new Date(asgn.earliestDueDate).toLocaleDateString('vi-VN')}</span>
            </div>
          ) : (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Không thời hạn
            </span>
          ),
      },
      {
        key: 'points',
        header: 'Câu hỏi & Điểm',
        align: 'center',
        hideOnMobile: true,
        render: (asgn) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: 'var(--text-xs)' }}>
            <span className="tabular-nums" style={{ fontWeight: 600, color: 'var(--foreground)' }}>
              {asgn.questionCount} câu · {asgn.totalPoints} đ
            </span>
            <span className="tabular-nums" style={{ color: 'var(--muted)', fontSize: '11px' }}>
              Đạt: ≥ {asgn.passingPoints} đ
            </span>
          </div>
        ),
      },
      {
        key: 'rules',
        header: 'Quy chế',
        hideOnMobile: true,
        render: (asgn) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} />
              <span>{asgn.timeLimitMinutes ? `${asgn.timeLimitMinutes} phút` : 'Không giới hạn'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Award size={12} />
              <span>{asgn.maxAttempts} lượt làm</span>
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Trạng thái',
        width: '120px',
        render: (asgn) => (
          <StatusBadge
            label={getStatusLabel(asgn.status)}
            variant={getStatusVariant(asgn.status)}
            size="sm"
          />
        ),
      },
    ],
    []
  );

  const rowActions: RowAction<AssignmentSummaryDTO>[] = useMemo(
    () => [
      {
        id: 'view',
        label: 'Xem chi tiết',
        icon: <Eye size={15} />,
        onClick: (asgn: AssignmentSummaryDTO) => onView(asgn),
      },
      {
        id: 'edit',
        label: 'Chỉnh sửa bản nháp',
        icon: <Edit2 size={15} />,
        isVisible: (asgn: AssignmentSummaryDTO) => asgn.status === 'DRAFT',
        onClick: (asgn: AssignmentSummaryDTO) => onEdit(asgn),
      },
      {
        id: 'duplicate',
        label: 'Nhân bản bài tập',
        icon: <Copy size={15} />,
        onClick: (asgn: AssignmentSummaryDTO) => onDuplicate(asgn),
      },
      {
        id: 'publish',
        label: 'Phát hành bài tập',
        icon: <Send size={15} style={{ color: 'var(--success)' }} />,
        isVisible: (asgn: AssignmentSummaryDTO) => asgn.status === 'DRAFT',
        onClick: (asgn: AssignmentSummaryDTO) => onPublish(asgn),
      },
      {
        id: 'close',
        label: 'Đóng nộp bài',
        icon: <Lock size={15} style={{ color: 'var(--danger)' }} />,
        isVisible: (asgn: AssignmentSummaryDTO) => asgn.status === 'PUBLISHED',
        confirmTitle: 'Xác nhận đóng nộp bài?',
        confirmMessage: (asgn: AssignmentSummaryDTO) => `Học viên sẽ không thể nộp thêm bài làm cho "${asgn.title}".`,
        onClick: (asgn: AssignmentSummaryDTO) => onClose(asgn),
      },
      {
        id: 'archive',
        label: 'Lưu trữ bài tập',
        icon: <Archive size={15} style={{ color: 'var(--muted)' }} />,
        isVisible: (asgn: AssignmentSummaryDTO) => asgn.status === 'CLOSED' || asgn.status === 'DRAFT',
        confirmTitle: 'Lưu trữ bài tập này?',
        confirmMessage: (asgn: AssignmentSummaryDTO) => `Bài tập "${asgn.title}" sẽ được chuyển vào mục lưu trữ.`,
        onClick: (asgn: AssignmentSummaryDTO) => onArchive(asgn),
      },
    ],
    [onView, onEdit, onDuplicate, onPublish, onClose, onArchive]
  );

  return (
    <ManagementDataTable<AssignmentSummaryDTO>
      columns={columns}
      data={assignments}
      keyExtractor={(asgn) => asgn.id}
      loading={loading}
      emptyText="Chưa có bài tập nào. Hãy tạo bài tập mới từ ngân hàng câu hỏi hoặc điều chỉnh bộ lọc tìm kiếm."
      rowActions={rowActions}
      enableMobileCards={true}
      mobileTitleExtractor={(asgn) => asgn.title}
      mobileSubtitleExtractor={(asgn) =>
        `${asgn.hskLevelName} · ${
          asgn.targetClassNames.length > 0
            ? asgn.targetClassNames.join(', ')
            : 'Chưa giao lớp'
        }`
      }
      mobileBadgeExtractor={(asgn) => (
        <StatusBadge
          label={getStatusLabel(asgn.status)}
          variant={getStatusVariant(asgn.status)}
          size="sm"
        />
      )}
      mobileFields={[
        {
          label: 'Hạn nộp',
          render: (asgn) =>
            asgn.earliestDueDate
              ? new Date(asgn.earliestDueDate).toLocaleDateString('vi-VN')
              : 'Không thời hạn',
        },
        {
          label: 'Câu hỏi / Điểm',
          render: (asgn) => `${asgn.questionCount} câu · ${asgn.totalPoints} đ (Đạt: ≥ ${asgn.passingPoints} đ)`,
        },
        {
          label: 'Quy chế',
          render: (asgn) =>
            `${asgn.timeLimitMinutes ? `${asgn.timeLimitMinutes}p` : 'Không giới hạn'} · ${asgn.maxAttempts} lượt`,
        },
      ]}
    />
  );
};

