import React from 'react';
import { Award, Flame, RotateCcw, Check } from 'lucide-react';
import { Button } from '../../../design-system';

interface ReviewResultProps {
  totalReviewed: number;
  goodCount: number;
  hardCount: number;
  againCount: number;
  xpEarned: number;
  onFinish: () => void;
  onReviewHardWordsAgain?: () => void;
}

export const ReviewResult: React.FC<ReviewResultProps> = ({
  totalReviewed,
  goodCount,
  hardCount,
  againCount,
  xpEarned,
  onFinish,
  onReviewHardWordsAgain,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 'var(--space-5)',
        width: '100%',
        maxWidth: '560px',
        margin: '0 auto',
        padding: 'var(--space-6) var(--space-4)',
      }}
    >
      {/* Celebration Icon */}
      <div
        style={{
          width: '76px',
          height: '76px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--xp-bg)',
          border: '2px solid var(--xp-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          boxShadow: '0 8px 24px rgba(245, 158, 11, 0.25)',
          animation: 'bounce 0.6s ease',
        }}
      >
        🎉
      </div>

      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--foreground)' }}>
          Hoàn thành phiên ôn tập!
        </h1>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
          Bạn đã ôn tập thành công <strong>{totalReviewed} từ vựng</strong> theo chu kỳ Spaced Repetition.
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-2-5)',
        }}
      >
        {/* Good / Nhớ tốt */}
        <div
          style={{
            padding: 'var(--space-3-5) var(--space-2)',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          <span style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--success)' }}>
            {goodCount}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--success)' }}>
            Nhớ tốt
          </span>
        </div>

        {/* Hard / Khó */}
        <div
          style={{
            padding: 'var(--space-3-5) var(--space-2)',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--streak-bg)',
            border: '1px solid var(--streak-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          <span style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--streak)' }}>
            {hardCount}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--streak)' }}>
            Khó
          </span>
        </div>

        {/* Again / Quên */}
        <div
          style={{
            padding: 'var(--space-3-5) var(--space-2)',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          <span style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--danger)' }}>
            {againCount}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--danger)' }}>
            Cần ôn lại
          </span>
        </div>
      </div>

      {/* Gamification Reward Card */}
      <div
        style={{
          width: '100%',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--xp-bg)',
              color: 'var(--xp)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Award size={20} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--xp)' }}>
              +{xpEarned} XP
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Thưởng hoàn thành</div>
          </div>
        </div>

        <div style={{ width: '1px', height: '28px', backgroundColor: 'var(--border)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--streak-bg)',
              color: 'var(--streak)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Flame size={20} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--streak)' }}>
              Streak +1
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Giữ vững phong độ</div>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
        <Button
          variant="primary"
          icon={<Check size={18} />}
          onClick={onFinish}
          style={{ width: '100%', minHeight: '46px', fontWeight: 700 }}
        >
          HOÀN THÀNH PHIÊN ÔN TẬP
        </Button>

        {againCount + hardCount > 0 && onReviewHardWordsAgain && (
          <Button
            variant="outline"
            icon={<RotateCcw size={16} />}
            onClick={onReviewHardWordsAgain}
            style={{ width: '100%', minHeight: '44px', fontWeight: 600 }}
          >
            ÔN LẠI {againCount + hardCount} TỪ CÒN KHÓ
          </Button>
        )}
      </div>
    </div>
  );
};
