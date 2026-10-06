import React from 'react';
import { PageHeader } from '../../shared/components';

export const TeacherDashboardPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Tổng quan giảng dạy, lớp học và tiến độ học viên."
      />

      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-12) var(--space-6)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 700,
            marginBottom: 'var(--space-3)',
          }}
        >
          师
        </div>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--foreground)', marginBottom: '8px' }}>
          Teacher Dashboard
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', maxWidth: '480px', margin: '0 auto' }}>
          Nội dung Dashboard sẽ được xây dựng ở bước tiếp theo.
        </p>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;
