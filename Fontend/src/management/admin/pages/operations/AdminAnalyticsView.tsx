import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Award,
  BookOpen,
  Calendar,
  Download,
  Clock,
  Info,
} from 'lucide-react';
import { adminOperationsService, type AnalyticsReport, type HskDistributionItem, type SkillMetricItem } from '../../services/admin-operations.service';

type DateRange = '7d' | '30d' | '90d' | '1y';

const RANGE_LABELS: Record<DateRange, string> = {
  '7d': '7 ngày qua',
  '30d': '30 ngày qua',
  '90d': 'Quý này (90d)',
  '1y': 'Năm học (1 năm)',
};

export const AdminAnalyticsView: React.FC = () => {
  const [range, setRange] = useState<DateRange>('30d');
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    adminOperationsService.getAnalyticsReport(range).then((data) => {
      if (data) {
        setReport(data);
      }
    }).finally(() => {
      setIsLoading(false);
    });
  }, [range]);

  const activeStudents = report?.activeStudents ?? 0;
  const completionRate = report?.completionRate ?? 0;
  const learningHours = report?.learningHours ?? 0;
  const retentionRate = report?.retentionRate ?? 0;
  const hskDistribution: HskDistributionItem[] = report?.hskDistribution || [];
  const skillMetrics: SkillMetricItem[] = report?.skillMetrics || [];

  const hasNoData = !isLoading && activeStudents === 0 && learningHours === 0 && completionRate === 0;

  const handleExportCsv = () => {
    const headers = ['Cấp độ / Kỹ năng', 'Tỷ lệ %', 'Số lượng học viên / Giờ học', 'Điểm trung bình'];
    const rows = [
      ...hskDistribution.map((h) => [h.level, `${h.percentage}%`, h.count, '—']),
      ...skillMetrics.map((s) => [s.skill, '—', `${s.hours} giờ`, `${s.avgScore}/100`]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analytics-report-${range}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Date Range Selector & Export Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 18px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={16} style={{ color: 'var(--muted)' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
            Khoảng thời gian báo cáo:
          </span>
          <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
            {[
              { key: '7d', label: '7 ngày qua' },
              { key: '30d', label: '30 ngày qua' },
              { key: '90d', label: 'Quý này (90d)' },
              { key: '1y', label: 'Năm học (1 năm)' },
            ].map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key as DateRange)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  fontWeight: range === r.key ? 700 : 500,
                  backgroundColor: range === r.key ? 'var(--primary-light)' : 'transparent',
                  color: range === r.key ? 'var(--primary)' : 'var(--muted)',
                  border: `1px solid ${range === r.key ? 'rgba(230, 0, 18, 0.3)' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="ds-btn ds-btn-secondary"
          style={{ height: '34px', fontSize: '12.5px', gap: '6px' }}
        >
          <Download size={14} /> Xuất báo cáo CSV ({range})
        </button>
      </div>

      {/* Empty State Banner if no activity in selected range */}
      {hasNoData && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1e40af',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Info size={20} style={{ color: '#2563eb', flexShrink: 0 }} />
          <div>
            <strong>Chưa có dữ liệu ghi nhận trong kỳ báo cáo ({RANGE_LABELS[range]}):</strong> Chưa phát sinh lượt học hoặc tiến độ bài học trong khoảng thời gian này. Vui lòng chọn mốc thời gian khác hoặc kiểm tra lại sau khi học viên học tập.
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <div
          style={{
            padding: '16px 18px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Học viên hoạt động (Active)</span>
            <Users size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--foreground)' }}>
            {isLoading ? '...' : new Intl.NumberFormat('vi-VN').format(activeStudents)}
          </div>
          <div style={{ fontSize: '11px', color: activeStudents > 0 ? '#16a34a' : 'var(--muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {activeStudents > 0 ? <><TrendingUp size={12} /> Học viên tương tác trong kỳ</> : 'Chưa có lượt tương tác'}
          </div>
        </div>

        <div
          style={{
            padding: '16px 18px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Tỷ lệ hoàn thành bài học</span>
            <Award size={16} style={{ color: '#d97706' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--foreground)' }}>
            {isLoading ? '...' : (completionRate > 0 ? `${completionRate}%` : 'Chưa có dữ liệu')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
            {completionRate > 0 ? 'Dựa trên tiến độ bài học' : 'Chưa phát sinh bài học'}
          </div>
        </div>

        <div
          style={{
            padding: '16px 18px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Tổng giờ học tích lũy</span>
            <Clock size={16} style={{ color: '#0284c7' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--foreground)' }}>
            {isLoading ? '...' : (learningHours > 0 ? `${new Intl.NumberFormat('vi-VN').format(learningHours)}h` : '0h')}
          </div>
          <div style={{ fontSize: '11px', color: learningHours > 0 ? '#16a34a' : 'var(--muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {learningHours > 0 ? <><TrendingUp size={12} /> Thời lượng học tập thực tế</> : 'Chưa có giờ học tích lũy'}
          </div>
        </div>

        <div
          style={{
            padding: '16px 18px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Tỷ lệ duy trì (Retention)</span>
            <BookOpen size={16} style={{ color: '#16a34a' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--foreground)' }}>
            {isLoading ? '...' : (retentionRate > 0 ? `${retentionRate}%` : 'Chưa có dữ liệu')}
          </div>
          <div style={{ fontSize: '11px', color: retentionRate > 0 ? '#16a34a' : 'var(--muted)', marginTop: '4px' }}>
            {retentionRate > 0 ? 'Tỷ lệ gắn kết người dùng' : 'Chưa đủ mẫu dữ liệu'}
          </div>
        </div>
      </div>

      {/* Main Analytics Grid: HSK Distribution & Skill Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {/* HSK Distribution */}
        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700, color: 'var(--foreground)' }}>
            Phân bố học viên theo cấp độ HSK (1 - 6)
          </h3>
          {hskDistribution.length === 0 || hskDistribution.every((item) => item.count === 0) ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
              Chưa có học viên phân bổ cấp độ trong kỳ báo cáo này.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {hskDistribution.map((item) => (
                <div key={item.level} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                    <strong style={{ color: 'var(--foreground)' }}>{item.level}</strong>
                    <span style={{ color: 'var(--muted)' }}>
                      {new Intl.NumberFormat('vi-VN').format(item.count)} học viên ({item.percentage}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--secondary)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                        borderRadius: 'var(--radius-full)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skill Engagement Breakdown */}
        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700, color: 'var(--foreground)' }}>
            Phân bổ thời lượng học theo kỹ năng
          </h3>
          {skillMetrics.length === 0 || skillMetrics.every((s) => s.hours === 0 && s.avgScore === 0) ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
              Chưa có dữ liệu kỹ năng học tập phát sinh trong kỳ báo cáo này.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {skillMetrics.map((skill) => (
                <div
                  key={skill.skill}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    fontSize: '12.5px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{skill.skill}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                      Thời lượng: {new Intl.NumberFormat('vi-VN').format(skill.hours)} giờ
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      fontWeight: 700,
                      color: 'var(--primary)',
                      flexShrink: 0,
                    }}
                  >
                    {skill.avgScore > 0 ? `${skill.avgScore} / 100` : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AdminAnalyticsView;
