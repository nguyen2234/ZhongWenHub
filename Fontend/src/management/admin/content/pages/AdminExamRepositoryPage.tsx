import React from 'react';
import { ClipboardList } from 'lucide-react';
import { PageHeader } from '../../../shared/components';
import '../components/learning-content.css';

export const AdminExamRepositoryPage: React.FC = () => {
  return (
    <div className="lcm-page">
      <PageHeader
        title="Kho đề thi"
        subtitle="Quản lý bộ đề luyện tập, đề thi thử HSK 1 – HSK 6 và cấu trúc câu hỏi liên kết Ngân hàng câu hỏi."
      />

      <div className="ds-card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            padding: '12px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            marginBottom: 'var(--space-3)',
          }}
        >
          <ClipboardList size={24} />
        </div>
        <h3 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-base)' }}>
          Kho đề thi HSK
        </h3>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>
          Sẵn sàng đồng bộ với Ngân hàng câu hỏi và quy trình kiểm duyệt nội dung.
        </p>
      </div>
    </div>
  );
};
