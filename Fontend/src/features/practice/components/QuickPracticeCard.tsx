import React from 'react';
import { Zap, ArrowRight } from 'lucide-react';

interface QuickPracticeCardProps {
  onStart: () => void;
}

export const QuickPracticeCard: React.FC<QuickPracticeCardProps> = ({ onStart }) => {
  return (
    <div
      style={{
        borderRadius: 'var(--radius-2xl)',
        backgroundColor: 'var(--surface)',
        border: '1.5px solid var(--border)',
        padding: 'var(--space-5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.02)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={18} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)' }}>
              Luyện nhanh 5 phút
            </h4>
            <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
              ⚡ 10 câu ngẫu nhiên từ kiến thức đã học
            </span>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--muted)', lineHeight: 1.4 }}>
          Hệ thống tự động lọc các từ từng trả lời sai, ngữ pháp chưa vững và từ vựng đang học để ôn tập cấp tốc.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--space-2)' }}>
        <button
          type="button"
          onClick={onStart}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 18px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--surface)',
            border: '1.5px solid var(--border)',
            color: 'var(--foreground)',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span>BẮT ĐẦU 5 PHÚT</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
