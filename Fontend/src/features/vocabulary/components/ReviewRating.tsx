import React from 'react';
import { type SRSRating } from '../types';

interface ReviewRatingProps {
  predictedIntervals: Record<SRSRating, string>;
  onRate: (rating: SRSRating) => void;
  disabled?: boolean;
}

export const ReviewRating: React.FC<ReviewRatingProps> = ({
  predictedIntervals,
  onRate,
  disabled = false,
}) => {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '560px',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div style={{ textAlign: 'center', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: '2px' }}>
        Đánh giá độ nhớ để SRS tính lịch ôn tối ưu:
      </div>

      {/* 4 Ratings Buttons Grid (2x2 on mobile, 4-inline on desktop) */}
      <div
        className="srs-rating-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-2)',
        }}
      >
        {/* 1. AGAIN / QUÊN */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRate('again')}
          style={{
            padding: '10px 8px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--danger-bg)',
            border: '1.5px solid var(--danger-border)',
            color: 'var(--danger)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Phím tắt: [1]"
        >
          <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 600 }}>[1]</span>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>QUÊN</span>
          <span style={{ fontSize: '11px', opacity: 0.9 }}>{predictedIntervals.again}</span>
        </button>

        {/* 2. HARD / KHÓ */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRate('hard')}
          style={{
            padding: '10px 8px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--streak-bg)',
            border: '1.5px solid var(--streak-border)',
            color: 'var(--streak)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Phím tắt: [2]"
        >
          <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 600 }}>[2]</span>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>KHÓ</span>
          <span style={{ fontSize: '11px', opacity: 0.9 }}>{predictedIntervals.hard}</span>
        </button>

        {/* 3. GOOD / NHỚ */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRate('good')}
          style={{
            padding: '10px 8px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--primary-light)',
            border: '1.5px solid var(--primary)',
            color: 'var(--primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Phím tắt: [3]"
        >
          <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 600 }}>[3]</span>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>NHỚ</span>
          <span style={{ fontSize: '11px', opacity: 0.9 }}>{predictedIntervals.good}</span>
        </button>

        {/* 4. EASY / DỄ */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRate('easy')}
          style={{
            padding: '10px 8px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--success-bg)',
            border: '1.5px solid var(--success-border)',
            color: 'var(--success)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Phím tắt: [4]"
        >
          <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 600 }}>[4]</span>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>DỄ</span>
          <span style={{ fontSize: '11px', opacity: 0.9 }}>{predictedIntervals.easy}</span>
        </button>
      </div>
    </div>
  );
};
