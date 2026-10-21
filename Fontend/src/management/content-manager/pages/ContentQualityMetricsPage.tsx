import React, { useMemo } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { contentAuditService } from '../services/content-audit.service';
import '../components/content-manager.css';

export const ContentQualityMetricsPage: React.FC = () => {
  const metrics = useMemo(() => {
    return contentAuditService.getQualityMetrics();
  }, []);

  return (
    <div className="cm-container">
      {/* 1. Header */}
      <div className="cm-header-row">
        <div className="cm-title-group">
          <h1 className="cm-page-title">Thống kê & Kiểm soát chất lượng học liệu</h1>
          <p className="cm-page-subtitle">
            Chỉ số đo lường độ chính xác kiến thức, độ phủ chuẩn hóa HSK 1 - HSK 6 và hiệu suất phản hồi lỗi học liệu.
          </p>
        </div>
      </div>

      {/* 2. Top Highlights */}
      <div className="cm-metrics-grid">
        <div className="cm-metric-card" style={{ borderLeft: '4px solid #047857' }}>
          <div className="cm-metric-header">
            <span>Độ chính xác toàn hệ thống</span>
            <div className="cm-metric-icon-wrap" style={{ color: '#047857', backgroundColor: '#ecfdf5' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="cm-metric-value" style={{ color: '#047857' }}>
            {metrics.accuracyRate}%
          </div>
          <div className="cm-metric-meta">
            <span>Đạt chuẩn kiểm định EdTech AA</span>
          </div>
        </div>

        <div className="cm-metric-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="cm-metric-header">
            <span>Thời gian xử lý lỗi (MTTR)</span>
            <div className="cm-metric-icon-wrap" style={{ color: '#0284c7', backgroundColor: '#e0f2fe' }}>
              <Clock size={16} />
            </div>
          </div>
          <div className="cm-metric-value" style={{ color: '#0284c7' }}>
            {metrics.avgResolutionHours} giờ
          </div>
          <div className="cm-metric-meta">
            <span>Trung bình từ lúc Support chuyển lên</span>
          </div>
        </div>

        <div className="cm-metric-card" style={{ borderLeft: '4px solid #b45309' }}>
          <div className="cm-metric-header">
            <span>Tỷ lệ duyệt thành công</span>
            <div className="cm-metric-icon-wrap" style={{ color: '#b45309', backgroundColor: '#fef3c7' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="cm-metric-value">
            94.6%
          </div>
          <div className="cm-metric-meta">
            <span>Bài giáo viên đạt ngay lần gửi 1</span>
          </div>
        </div>

        <div className="cm-metric-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="cm-metric-header">
            <span>Đã giải quyết</span>
            <div className="cm-metric-icon-wrap" style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="cm-metric-value" style={{ color: 'var(--primary)' }}>
            {metrics.resolvedIssuesCount} lỗi
          </div>
          <div className="cm-metric-meta">
            <span>Đã phát hành bản vá cho học viên</span>
          </div>
        </div>
      </div>

      {/* 3. HSK Standards Verification Progress */}
      <div className="cm-card">
        <div className="cm-card-header">
          <div>
            <h2 className="cm-card-title">Mức độ chuẩn hóa theo khung chương trình HSK 1 - HSK 6</h2>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Tiến độ rà soát từ vựng, ngữ pháp, audio và bài tập theo quy chuẩn Hanban
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {metrics.hskDistribution.map((hsk) => (
            <div
              key={hsk.level}
              style={{
                padding: '14px',
                borderRadius: '10px',
                backgroundColor: 'var(--background, #f8fafc)',
                border: '1px solid var(--border-strong, #e2e8f0)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border-strong)',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--foreground)',
                    }}
                  >
                    HSK {hsk.level}
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--foreground)' }}>
                    {hsk.count.toLocaleString('vi-VN')} học liệu đã phát hành
                  </span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#047857' }}>
                  {hsk.verifiedPercent}% đạt chuẩn
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-strong)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${hsk.verifiedPercent}%`,
                    backgroundColor: hsk.level <= 2 ? '#047857' : hsk.level <= 4 ? '#0284c7' : 'var(--primary, #E60012)',
                    borderRadius: '9999px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Error Categories Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div className="cm-card">
          <h3 className="cm-card-title">Phân bố loại lỗi học liệu phản ánh</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>1. Sai Pinyin / Thanh điệu</span>
              <strong style={{ color: '#be123c' }}>38%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>2. Sai đáp án trắc nghiệm</span>
              <strong style={{ color: '#b45309' }}>26%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>3. Giải nghĩa tiếng Việt chưa sát</span>
              <strong style={{ color: '#0284c7' }}>18%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>4. Lỗi âm thanh Audio</span>
              <strong style={{ color: '#64748b' }}>12%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>5. Lỗi hiển thị giao diện</span>
              <strong style={{ color: '#64748b' }}>6%</strong>
            </div>
          </div>
        </div>

        <div className="cm-card">
          <h3 className="cm-card-title">Chính sách cam kết chất lượng (SLA)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--foreground)' }}>
            <div style={{ padding: '8px 10px', backgroundColor: '#fff1f2', borderRadius: '8px', borderLeft: '3px solid #be123c' }}>
              <strong>Lỗi khẩn cấp (URGENT):</strong> Xử lý và xuất bản bản vá trong vòng <strong>2 giờ</strong> làm việc.
            </div>
            <div style={{ padding: '8px 10px', backgroundColor: '#fef3c7', borderRadius: '8px', borderLeft: '3px solid #b45309' }}>
              <strong>Lỗi cao (HIGH):</strong> Xử lý và xuất bản bản vá trong vòng <strong>6 giờ</strong> làm việc.
            </div>
            <div style={{ padding: '8px 10px', backgroundColor: 'var(--background)', borderRadius: '8px', borderLeft: '3px solid var(--border-strong)' }}>
              <strong>Lỗi trung bình/thấp:</strong> Hoàn tất trong vòng <strong>24 giờ</strong> và thông báo kết quả cho Support.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
