import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { HSKLevel } from '../../../design-system';

export interface OnboardingPageProps {
  onComplete?: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(15);

  const levels = [
    { level: 1, name: 'HSK 1', desc: 'Người mới bắt đầu (150 - 500 từ)', chars: '零基础' },
    { level: 2, name: 'HSK 2', desc: 'Giao tiếp hàng ngày cơ bản', chars: '初级' },
    { level: 3, name: 'HSK 3', desc: 'Đàm thoại công việc & du lịch', chars: '中级' },
    { level: 4, name: 'HSK 4', desc: 'Đọc hiểu báo chí & phim ảnh', chars: '良好' },
  ];

  const goals = [
    { min: 10, label: 'Dễ dàng', xp: '+30 XP' },
    { min: 15, label: 'Tiêu chuẩn', xp: '+50 XP', recommended: true },
    { min: 30, label: 'Chuyên sâu', xp: '+100 XP' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-strong)',
          padding: 'clamp(24px, 5vw, 40px)',
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
        }}
      >
        {/* Brand Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-hanzi)',
              fontWeight: 700,
              fontSize: '17px',
            }}
          >
            华
          </div>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--primary)' }}>
            Chào mừng thành viên mới! 🎉
          </span>
        </div>

        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--foreground)',
            lineHeight: 1.25,
            margin: '0 0 var(--space-2) 0',
          }}
        >
          Thiết lập mục tiêu học tiếng Trung
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '0 0 var(--space-6) 0' }}>
          Tùy chỉnh lộ trình cá nhân hóa để AI Tutor gợi ý các bài học và thẻ từ vựng phù hợp nhất với bạn.
        </p>

        {/* Step 1: Chọn trình độ bắt đầu */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            1. Trình độ hiện tại của bạn:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)' }}>
            {levels.map((item) => {
              const isSelected = selectedLevel === item.level;
              return (
                <div
                  key={item.level}
                  onClick={() => setSelectedLevel(item.level)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-lg)',
                    border: '2px solid ' + (isSelected ? 'var(--primary)' : 'var(--border-strong)'),
                    backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <HSKLevel level={item.level as any} />
                    <span style={{ fontFamily: 'var(--font-hanzi)', fontSize: '12px', color: 'var(--muted)' }}>
                      {item.chars}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: isSelected ? 'var(--primary)' : 'var(--muted)', lineHeight: 1.3 }}>
                    {item.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Mục tiêu học tập mỗi ngày */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            2. Cam kết thời gian mỗi ngày:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
            {goals.map((g) => {
              const isSelected = dailyGoalMinutes === g.min;
              return (
                <div
                  key={g.min}
                  onClick={() => setDailyGoalMinutes(g.min)}
                  style={{
                    padding: '12px 10px',
                    textAlign: 'center',
                    borderRadius: 'var(--radius-lg)',
                    border: '2px solid ' + (isSelected ? 'var(--primary)' : 'var(--border-strong)'),
                    backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--foreground)' }}>
                    {g.min} phút
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{g.label}</div>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'var(--xp)',
                    }}
                  >
                    {g.xp}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Complete Button */}
        <button
          type="button"
          onClick={onComplete}
          className="ds-btn ds-btn-primary"
          style={{
            width: '100%',
            minHeight: '46px',
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            boxShadow: '0 4px 14px rgba(67, 56, 202, 0.28)',
          }}
        >
          <span>Bắt đầu học ngay</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
