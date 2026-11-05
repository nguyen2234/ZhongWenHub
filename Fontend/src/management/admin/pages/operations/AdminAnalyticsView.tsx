import React, { useState } from 'react';
import {
  TrendingUp,
  Users,
  Award,
  BookOpen,
  Calendar,
  Download,
  Clock,
} from 'lucide-react';

type DateRange = '7d' | '30d' | '90d' | '1y';

const HSK_DISTRIBUTION = [
  { level: 'HSK 1', percentage: 38, count: 4742, color: '#e60012' },
  { level: 'HSK 2', percentage: 26, count: 3245, color: '#f97316' },
  { level: 'HSK 3', percentage: 18, count: 2246, color: '#eab308' },
  { level: 'HSK 4', percentage: 10, count: 1248, color: '#22c55e' },
  { level: 'HSK 5', percentage: 6, count: 749, color: '#06b6d4' },
  { level: 'HSK 6', percentage: 2, count: 250, color: '#8b5cf6' },
];

const SKILL_METRICS = [
  { skill: 'Từ vựng (Flashcard & Spaced Repetition)', hours: 4120, avgScore: 88 },
  { skill: 'Luyện nghe & Nhận diện âm đọc', hours: 3250, avgScore: 82 },
  { skill: 'Luyện phát âm & Phản xạ câu', hours: 2680, avgScore: 76 },
  { skill: 'Ngữ pháp & Cấu trúc câu', hours: 2190, avgScore: 79 },
  { skill: 'Tập viết & Thứ tự nét Hán tự', hours: 1450, avgScore: 85 },
];

export const AdminAnalyticsView: React.FC = () => {
  const [range, setRange] = useState<DateRange>('30d');

  const rangeMultipliers: Record<DateRange, number> = {
    '7d': 0.25,
    '30d': 1.0,
    '90d': 2.8,
    '1y': 10.5,
  };

  const mult = rangeMultipliers[range];
  const activeStudents = Math.round(12480 * (range === '7d' ? 0.35 : mult > 1 ? 1.4 : 1));
  const completionRate = range === '7d' ? 68.4 : range === '30d' ? 74.2 : 78.5;
  const learningHours = Math.round(13690 * mult);
  const retentionRate = 84.6;

  const handleExportCsv = () => {
    const headers = ['Cấp độ / Kỹ năng', 'Tỷ lệ %', 'Số lượng học viên / Giờ học', 'Điểm trung bình'];
    const rows = [
      ...HSK_DISTRIBUTION.map((h) => [h.level, `${h.percentage}%`, h.count, '—']),
      ...SKILL_METRICS.map((s) => [s.skill, '—', `${Math.round(s.hours * mult)} giờ`, `${s.avgScore}/100`]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analytics-report-demo-${range}-${new Date().toISOString().slice(0, 10)}.csv`);
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
            {new Intl.NumberFormat('vi-VN').format(activeStudents)}
          </div>
          <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} /> Tăng +14.2% so với kỳ trước
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
            {completionRate}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
            Mục tiêu nền tảng: &gt; 70%
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
            {new Intl.NumberFormat('vi-VN').format(learningHours)}h
          </div>
          <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} /> Trung bình 34 phút / học viên / ngày
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
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Tỷ lệ duy trì (Retention 30d)</span>
            <BookOpen size={16} style={{ color: '#16a34a' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--foreground)' }}>
            {retentionRate}%
          </div>
          <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px' }}>
            Chỉ số gắn kết cao hơn 12% chuẩn EdTech
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {HSK_DISTRIBUTION.map((item) => (
              <div key={item.level} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <strong style={{ color: 'var(--foreground)' }}>{item.level}</strong>
                  <span style={{ color: 'var(--muted)' }}>
                    {new Intl.NumberFormat('vi-VN').format(Math.round(item.count * (range === '7d' ? 0.35 : mult > 1 ? 1.4 : 1)))} học viên ({item.percentage}%)
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {SKILL_METRICS.map((skill) => (
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
                    Thời lượng: {new Intl.NumberFormat('vi-VN').format(Math.round(skill.hours * mult))} giờ
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
                  {skill.avgScore} / 100
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminAnalyticsView;
