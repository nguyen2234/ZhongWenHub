import React from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { EmptyState } from '../../../shared/components';

export const ClassPerformancePlaceholderTab: React.FC = () => {
  return (
    <div className="tp-card" style={{ padding: 'var(--space-10) var(--space-6)' }}>
      <EmptyState
        title="Báo cáo & Phân tích Hiệu suất Lớp học sẽ ra mắt trong Phase 2"
        description="Module Phân tích nâng cao sẽ trực quan hóa phổ điểm kiểm tra, thống kê tỷ lệ hoàn thành từ vựng HSK của lớp và phát hiện sớm các học viên có nguy cơ hổng kiến thức."
        icon={<BarChart3 size={36} style={{ color: 'var(--primary)', opacity: 0.8 }} />}
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
        <TrendingUp size={18} style={{ color: '#059669', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--foreground)' }}>Lộ trình Phase 2:</strong>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', lineHeight: 1.6 }}>
            <li>Biểu đồ chuyên cần và phân tích xu hướng tham gia lớp học</li>
            <li>Báo cáo độ thành thục từ vựng HSK của lớp so với chuẩn quốc tế</li>
            <li>Xuất báo cáo PDF/Excel định kỳ gửi phụ huynh hoặc trung tâm</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
