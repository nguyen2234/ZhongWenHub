import React from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Sparkles } from 'lucide-react';
import { EmptyState } from '../../../shared/components';

export const ClassAssignmentsPlaceholderTab: React.FC = () => {
  return (
    <div className="tp-card" style={{ padding: 'var(--space-10) var(--space-6)' }}>
      <EmptyState
        title="Tính năng Quản lý Bài tập sẽ sẵn sàng trong Phase 2"
        description="Trong Phase 2, giảng viên sẽ có thể giao bài tập trực tiếp từ ngân hàng câu hỏi HSK chuẩn, thiết lập hạn nộp theo từng bài học và xem bài làm của học viên."
        icon={<CheckSquare size={36} style={{ color: 'var(--primary)', opacity: 0.8 }} />}
        action={
          <Link
            to="/management/teacher/assignments"
            className="ds-btn ds-btn-primary"
            style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <CheckSquare size={16} />
            <span>Mở trang Quản lý bài tập</span>
          </Link>
        }
      />

      <div
        style={{
          maxWidth: '520px',
          margin: 'var(--space-6) auto 0',
          padding: 'var(--space-4)',
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--text-xs)',
          color: 'var(--muted)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-3)',
        }}
      >
        <Sparkles size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--foreground)' }}>Lộ trình Phase 2:</strong>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', lineHeight: 1.6 }}>
            <li>Giao bài luyện viết Hán tự & đặt câu ngữ pháp theo giáo trình</li>
            <li>Theo dõi tiến độ nộp bài và cảnh báo học viên trễ hạn tự động</li>
            <li>Giao bài tập bổ trợ cho từng nhóm học viên học yếu</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
