import React from 'react';
import {
  TrendingUp,
  Flame,
  Zap,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';

const WEEKLY_STUDY_HOURS = [
  { day: 'T2', minutes: 35, date: '08/10' },
  { day: 'T3', minutes: 45, date: '09/10' },
  { day: 'T4', minutes: 20, date: '10/10' },
  { day: 'T5', minutes: 60, date: '11/10' },
  { day: 'T6', minutes: 40, date: '12/10' },
  { day: 'T7', minutes: 75, date: '13/10' },
  { day: 'CN', minutes: 50, date: '14/10' },
];

export const ProgressPage: React.FC = () => {
  const totalMinutes = WEEKLY_STUDY_HOURS.reduce((acc, cur) => acc + cur.minutes, 0);
  const maxMinutes = Math.max(...WEEKLY_STUDY_HOURS.map((d) => d.minutes));

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 24px 48px 24px' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4338ca 0%, #312e81 100%)',
          borderRadius: '20px',
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>
            <TrendingUp size={14} />
            <span>THỐNG KÊ & TIẾN ĐỘ HỌC TẬP</span>
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 800 }}>
            Tiến Độ Học Tập Cá Nhân
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, maxWidth: '640px', lineHeight: 1.5 }}>
            Theo dõi thời lượng chuyên cần mỗi ngày, tỷ lệ nhớ từ vựng Spaced Repetition và mục tiêu HSK đã hoàn thành.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', padding: '12px 20px', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Tuần này</div>
          </div>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Chuỗi học liên tiếp', value: '8 Ngày', sub: 'Kỷ lục: 14 ngày', icon: Flame, color: '#ea580c', bg: '#ffedd5' },
          { label: 'Tổng điểm kinh nghiệm', value: '2,180 XP', sub: 'Top 15% tuần', icon: Zap, color: '#4338ca', bg: '#eef2ff' },
          { label: 'Từ vựng đã thuộc', value: '246 từ', sub: '92% nhớ vững', icon: BookOpen, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Mục tiêu ngày', value: '30 / 30 phút', sub: 'Đã hoàn thành', icon: CheckCircle2, color: '#0284c7', bg: '#e0f2fe' },
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1.5px solid #e2e8f0',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: m.bg, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={24} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{m.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '2px 0' }}>{m.value}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{m.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Study Time Chart */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #e2e8f0',
          padding: '24px 28px',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              Thời Gian Học 7 Ngày Gần Nhất
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Trung bình mỗi ngày: <strong>{Math.round(totalMinutes / 7)} phút</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#4338ca' }} />
            <span>Thời lượng (phút)</span>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', paddingTop: '20px', borderBottom: '1px solid #e2e8f0', gap: '12px' }}>
          {WEEKLY_STUDY_HOURS.map((d, idx) => {
            const heightPercent = Math.round((d.minutes / maxMinutes) * 100);

            return (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#4338ca' }}>
                  {d.minutes}m
                </span>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '44px',
                    height: `${heightPercent}%`,
                    borderRadius: '8px 8px 0 0',
                    backgroundColor: d.minutes >= 45 ? '#4338ca' : '#818cf8',
                    transition: 'height 0.4s ease',
                  }}
                  title={`${d.day}: ${d.minutes} phút`}
                />
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          {WEEKLY_STUDY_HOURS.map((d, idx) => (
            <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{d.day}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>{d.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
