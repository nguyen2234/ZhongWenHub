import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Plus,
  RefreshCw,
  Clock,
  Layers,
  Award,
  AlertCircle,
  Calendar,
  Eye,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { assignmentService } from '../../services';
import type { AssignmentSummaryDTO } from '../../types';
import { EmptyState } from '../../../shared/components';

export interface ClassAssignmentsTabProps {
  classId: string;
  className: string;
}

export const ClassAssignmentsTab: React.FC<ClassAssignmentsTabProps> = ({ classId, className }) => {
  const [assignments, setAssignments] = useState<AssignmentSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await assignmentService.getAssignments(
        { search: '', hskLevelId: 'ALL', classId, status: 'ALL' },
        { page: 1, pageSize: 50 },
        { field: 'createdAt', direction: 'desc' }
      );
      setAssignments(response.items);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách bài tập của lớp.');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="tp-status-badge active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> Đang mở
          </span>
        );
      case 'CLOSED':
        return (
          <span className="tp-status-badge completed" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={12} /> Đã đóng
          </span>
        );
      default:
        return (
          <span className="tp-status-badge upcoming" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Bản nháp
          </span>
        );
    }
  };

  return (
    <div className="tp-card">
      <div className="tp-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h3 className="tp-card-title">
            <CheckSquare size={18} style={{ color: 'var(--primary)' }} />
            Bài Tập & Đề Kiểm Tra ({assignments.length})
          </h3>
          <div className="tp-card-subtitle">
            Các bài tập và bài kiểm tra đã được giao cho lớp {className}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            type="button"
            className="ds-btn ds-btn-sm ds-btn-outline"
            onClick={loadAssignments}
            disabled={loading}
            title="Làm mới"
          >
            <RefreshCw size={14} className={loading ? 'tp-spin' : ''} />
            <span>Làm mới</span>
          </button>

          <Link
            to={`/management/teacher/assignments?action=create&targetClassId=${classId}`}
            className="ds-btn ds-btn-sm ds-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} />
            <span>Giao bài tập mới</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--muted)' }}>
          Đang tải danh sách bài tập...
        </div>
      ) : error ? (
        <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--error)' }}>
          <AlertCircle size={28} style={{ margin: '0 auto var(--space-2)' }} />
          <p>{error}</p>
          <button
            type="button"
            className="ds-btn ds-btn-sm ds-btn-outline"
            style={{ marginTop: 'var(--space-3)' }}
            onClick={loadAssignments}
          >
            Thử lại
          </button>
        </div>
      ) : assignments.length === 0 ? (
        <div style={{ padding: 'var(--space-8) var(--space-4)' }}>
          <EmptyState
            title="Chưa có bài tập nào được giao cho lớp này"
            description="Hãy tạo bài tập mới từ ngân hàng câu hỏi HSK hoặc soạn câu hỏi mới để học viên ôn tập và kiểm tra định kỳ."
            icon={<CheckSquare size={36} style={{ color: 'var(--primary)', opacity: 0.8 }} />}
            action={
              <Link
                to={`/management/teacher/assignments?action=create&targetClassId=${classId}`}
                className="ds-btn ds-btn-primary"
                style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} />
                <span>Giao bài tập đầu tiên</span>
              </Link>
            }
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {assignments.map((item) => (
            <div
              key={item.id}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--surface)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-3)',
                transition: 'box-shadow 0.2s',
              }}
            >
              <div style={{ flex: '1 1 320px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: item.hskLevelColor ? `${item.hskLevelColor}20` : 'var(--primary-light)',
                      color: item.hskLevelColor || 'var(--primary)',
                    }}
                  >
                    {item.hskLevelName}
                  </span>
                  {getStatusBadge(item.status)}
                </div>

                <h4 style={{ margin: '0 0 6px 0', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--foreground)' }}>
                  {item.title}
                </h4>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--muted)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Layers size={13} /> {item.questionCount} câu hỏi
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Award size={13} /> {item.totalPoints} điểm
                  </span>
                  {Boolean(item.timeLimitMinutes && item.timeLimitMinutes > 0) && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} /> {item.timeLimitMinutes} phút
                    </span>
                  )}
                  {item.earliestDueDate && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ea580c' }}>
                      <Calendar size={13} /> Hạn nộp: {new Date(item.earliestDueDate).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Link
                  to={`/management/teacher/assignments?search=${encodeURIComponent(item.title)}`}
                  className="ds-btn ds-btn-sm ds-btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                >
                  <Eye size={13} /> Xem bài tập
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
