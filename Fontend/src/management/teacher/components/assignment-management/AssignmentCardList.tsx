import React from 'react';
import {
  Eye,
  Edit2,
  Copy,
  Send,
  Lock,
  Archive,
  Calendar,
  Clock,
  Layers,
  Award,
} from 'lucide-react';
import type { AssignmentSummaryDTO, AssignmentStatus } from '../../types';

interface AssignmentCardListProps {
  assignments: AssignmentSummaryDTO[];
  loading?: boolean;
  onView: (assignment: AssignmentSummaryDTO) => void;
  onEdit: (assignment: AssignmentSummaryDTO) => void;
  onDuplicate: (assignment: AssignmentSummaryDTO) => void;
  onPublish: (assignment: AssignmentSummaryDTO) => void;
  onClose: (assignment: AssignmentSummaryDTO) => void;
  onArchive: (assignment: AssignmentSummaryDTO) => void;
}

const STATUS_CONFIG: Record<
  AssignmentStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: 'Bản nháp',
    className: 'tp-status-badge--draft',
  },
  PUBLISHED: {
    label: 'Đã phát hành',
    className: 'tp-status-badge--published',
  },
  CLOSED: {
    label: 'Đã đóng nộp',
    className: 'tp-status-badge--closed',
  },
  ARCHIVED: {
    label: 'Đã lưu trữ',
    className: 'tp-status-badge--archived',
  },
};

export const AssignmentCardList: React.FC<AssignmentCardListProps> = ({
  assignments,
  loading = false,
  onView,
  onEdit,
  onDuplicate,
  onPublish,
  onClose,
  onArchive,
}) => {
  if (loading) {
    return (
      <div className="tp-empty-state" style={{ minHeight: '200px' }}>
        <div className="tp-loading-spinner" />
        <p className="tp-empty-state-text" style={{ marginTop: '12px' }}>
          Đang tải danh sách bài tập...
        </p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="tp-empty-state" style={{ minHeight: '200px' }}>
        <Layers size={40} className="tp-empty-state-icon" />
        <h4 className="tp-empty-state-title">Chưa có bài tập nào</h4>
        <p className="tp-empty-state-text">
          Hãy tạo bài tập mới từ ngân hàng câu hỏi.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 'var(--space-4)',
      }}
    >
      {assignments.map((asgn) => {
        const statusInfo = STATUS_CONFIG[asgn.status];
        return (
          <div key={asgn.id} className="tp-assign-card">
            {/* Header: Title, Level, Status */}
            <div className="tp-assign-card-header">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    className="tp-badge"
                    style={{
                      backgroundColor: `${asgn.hskLevelColor}15`,
                      color: asgn.hskLevelColor,
                      fontWeight: 600,
                      fontSize: '11px',
                    }}
                  >
                    {asgn.hskLevelName}
                  </span>
                  <span className={`tp-badge ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <h4 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600 }}>
                  {asgn.title}
                </h4>
              </div>
            </div>

            {asgn.description && (
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--text-xs)',
                  color: 'var(--muted-foreground)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {asgn.description}
              </p>
            )}

            {/* Target Classes */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Lớp:</span>
              {asgn.targetClassNames.length > 0 ? (
                asgn.targetClassNames.map((name, i) => (
                  <span
                    key={i}
                    className="tp-badge"
                    style={{
                      fontSize: '11px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                    }}
                  >
                    {name}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                  Chưa giao lớp
                </span>
              )}
            </div>

            {/* Meta Grid */}
            <div className="tp-assign-card-meta">
              <div>
                <span style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: '11px' }}>
                  Số câu & Điểm
                </span>
                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                  {asgn.questionCount} câu · {asgn.totalPoints} đ
                </span>
              </div>

              <div>
                <span style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: '11px' }}>
                  Điểm đạt
                </span>
                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                  ≥ {asgn.passingPoints} đ
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} style={{ color: 'var(--muted-foreground)' }} />
                <span>
                  {asgn.earliestDueDate
                    ? new Date(asgn.earliestDueDate).toLocaleDateString('vi-VN')
                    : 'Không hạn'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} style={{ color: 'var(--muted-foreground)' }} />
                <span>{asgn.timeLimitMinutes ? `${asgn.timeLimitMinutes}p` : 'Tự do'}</span>
                <span>·</span>
                <Award size={13} style={{ color: 'var(--muted-foreground)' }} />
                <span>{asgn.maxAttempts} lần</span>
              </div>
            </div>

            {/* Actions */}
            <div className="tp-assign-card-actions">
              <button
                type="button"
                className="ds-btn ds-btn-secondary"
                style={{ padding: '6px 10px', fontSize: '12px' }}
                onClick={() => onView(asgn)}
              >
                <Eye size={14} />
                <span>Chi tiết</span>
              </button>

              {asgn.status === 'DRAFT' && (
                <button
                  type="button"
                  className="ds-btn ds-btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                  onClick={() => onEdit(asgn)}
                >
                  <Edit2 size={14} />
                  <span>Sửa</span>
                </button>
              )}

              <button
                type="button"
                className="ds-btn ds-btn-ghost"
                style={{ padding: '6px' }}
                onClick={() => onDuplicate(asgn)}
                title="Nhân bản"
              >
                <Copy size={14} />
              </button>

              {asgn.status === 'DRAFT' && (
                <button
                  type="button"
                  className="ds-btn ds-btn-primary"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                  onClick={() => onPublish(asgn)}
                >
                  <Send size={14} />
                  <span>Phát hành</span>
                </button>
              )}

              {asgn.status === 'PUBLISHED' && (
                <button
                  type="button"
                  className="ds-btn ds-btn-danger"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                  onClick={() => onClose(asgn)}
                >
                  <Lock size={14} />
                  <span>Đóng nộp</span>
                </button>
              )}

              {(asgn.status === 'CLOSED' || asgn.status === 'DRAFT') && (
                <button
                  type="button"
                  className="ds-btn ds-btn-ghost"
                  style={{ padding: '6px' }}
                  onClick={() => onArchive(asgn)}
                  title="Lưu trữ"
                >
                  <Archive size={14} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
