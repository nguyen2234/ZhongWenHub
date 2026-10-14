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
  if (loading) {
    return (
      <div className="tp-empty-state" style={{ minHeight: '260px' }}>
        <div className="tp-loading-spinner" />
        <p className="tp-empty-state-text" style={{ marginTop: '12px' }}>
          Đang tải danh sách bài tập...
        </p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="tp-empty-state" style={{ minHeight: '260px' }}>
        <Layers size={40} className="tp-empty-state-icon" />
        <h4 className="tp-empty-state-title">Chưa có bài tập nào</h4>
        <p className="tp-empty-state-text">
          Hãy tạo bài tập mới từ ngân hàng câu hỏi hoặc điều chỉnh bộ lọc tìm kiếm.
        </p>
      </div>
    );
  }

  return (
    <div className="tp-table-container">
      <table className="tp-assign-table">
        <thead>
          <tr>
            <th>Tiêu đề & Cấp độ</th>
            <th>Lớp giao</th>
            <th>Hạn nộp</th>
            <th>Câu hỏi & Điểm</th>
            <th>Quy chế</th>
            <th>Trạng thái</th>
            <th style={{ textAlign: 'right' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((asgn) => {
            const statusInfo = STATUS_CONFIG[asgn.status];
            return (
              <tr key={asgn.id}>
                {/* Tiêu đề & HSK level */}
                <td style={{ minWidth: '220px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                      <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                        {asgn.title}
                      </span>
                    </div>
                    {asgn.description && (
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--muted-foreground)',
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
                </td>

                {/* Lớp giao */}
                <td style={{ minWidth: '150px' }}>
                  {asgn.targetClassNames.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {asgn.targetClassNames.map((name, i) => (
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
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                      Chưa giao lớp
                    </span>
                  )}
                </td>

                {/* Hạn nộp */}
                <td style={{ whiteSpace: 'nowrap' }}>
                  {asgn.earliestDueDate ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--foreground)' }}>
                      <Calendar size={13} style={{ color: 'var(--muted-foreground)' }} />
                      <span>{new Date(asgn.earliestDueDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                      Không thời hạn
                    </span>
                  )}
                </td>

                {/* Câu hỏi & Điểm */}
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: 'var(--text-xs)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                      {asgn.questionCount} câu · {asgn.totalPoints} điểm
                    </span>
                    <span style={{ color: 'var(--muted-foreground)' }}>
                      Đạt: ≥ {asgn.passingPoints} đ
                    </span>
                  </div>
                </td>

                {/* Quy chế */}
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      <span>{asgn.timeLimitMinutes ? `${asgn.timeLimitMinutes} phút` : 'Không giới hạn'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Award size={12} />
                      <span>{asgn.maxAttempts} lượt làm</span>
                    </div>
                  </div>
                </td>

                {/* Trạng thái */}
                <td>
                  <span className={`tp-badge ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </td>

                {/* Thao tác */}
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    {/* View Button */}
                    <button
                      type="button"
                      className="tp-btn tp-btn--ghost"
                      style={{ padding: '6px' }}
                      onClick={() => onView(asgn)}
                      title="Xem chi tiết"
                      aria-label="Xem chi tiết"
                    >
                      <Eye size={15} />
                    </button>

                    {/* Edit Button (Draft only) */}
                    {asgn.status === 'DRAFT' && (
                      <button
                        type="button"
                        className="tp-btn tp-btn--ghost"
                        style={{ padding: '6px' }}
                        onClick={() => onEdit(asgn)}
                        title="Chỉnh sửa bản nháp"
                        aria-label="Chỉnh sửa bản nháp"
                      >
                        <Edit2 size={15} />
                      </button>
                    )}

                    {/* Duplicate Button (Any status) */}
                    <button
                      type="button"
                      className="tp-btn tp-btn--ghost"
                      style={{ padding: '6px' }}
                      onClick={() => onDuplicate(asgn)}
                      title="Nhân bản bài tập"
                      aria-label="Nhân bản bài tập"
                    >
                      <Copy size={15} />
                    </button>

                    {/* Publish Button (Draft only) */}
                    {asgn.status === 'DRAFT' && (
                      <button
                        type="button"
                        className="tp-btn tp-btn--ghost"
                        style={{ padding: '6px', color: '#059669' }}
                        onClick={() => onPublish(asgn)}
                        title="Phát hành bài tập"
                        aria-label="Phát hành bài tập"
                      >
                        <Send size={15} />
                      </button>
                    )}

                    {/* Close Button (Published only) */}
                    {asgn.status === 'PUBLISHED' && (
                      <button
                        type="button"
                        className="tp-btn tp-btn--ghost"
                        style={{ padding: '6px', color: '#dc2626' }}
                        onClick={() => onClose(asgn)}
                        title="Đóng nộp bài"
                        aria-label="Đóng nộp bài"
                      >
                        <Lock size={15} />
                      </button>
                    )}

                    {/* Archive Button (Closed or Draft) */}
                    {(asgn.status === 'CLOSED' || asgn.status === 'DRAFT') && (
                      <button
                        type="button"
                        className="tp-btn tp-btn--ghost"
                        style={{ padding: '6px', color: '#6b7280' }}
                        onClick={() => onArchive(asgn)}
                        title="Lưu trữ bài tập"
                        aria-label="Lưu trữ bài tập"
                      >
                        <Archive size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
