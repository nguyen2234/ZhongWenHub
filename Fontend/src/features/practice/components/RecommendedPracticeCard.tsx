import React from 'react';
import { Target, ArrowRight, Clock, Zap } from 'lucide-react';
import type { PracticeRecommendation } from '../types';

interface RecommendedPracticeCardProps {
  recommendation: PracticeRecommendation | null;
  onStart: (recommendation: PracticeRecommendation) => void;
}

export const RecommendedPracticeCard: React.FC<RecommendedPracticeCardProps> = ({
  recommendation,
  onStart,
}) => {
  if (!recommendation) {
    return (
      <div
        style={{
          borderRadius: 'var(--radius-2xl)',
          backgroundColor: 'var(--surface)',
          border: '1.5px solid var(--border)',
          padding: 'var(--space-6)',
          textAlign: 'center',
          color: 'var(--muted)',
        }}
      >
        <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
          Hiện chưa có đề xuất mới. Bạn hãy tiếp tục học bài hoặc làm Luyện nhanh 5 phút!
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 'var(--radius-2xl)',
        backgroundColor: 'var(--surface)',
        border: '2px solid var(--primary)',
        padding: 'var(--space-6)',
        boxShadow: '0 8px 30px rgba(67, 56, 202, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative top accent badge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: 'var(--primary)',
        }}
      />

      {/* Header section with Badge & Level */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              letterSpacing: '0.5px',
            }}
          >
            <Target size={14} />
            <span>🎯 ĐỀ XUẤT CHO BẠN</span>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)' }}>
            {recommendation.subtitle}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} />
            ~{recommendation.estimatedMinutes} phút
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--streak)', fontWeight: 700 }}>
            <Zap size={13} />
            +{recommendation.xpReward} XP
          </span>
        </div>
      </div>

      {/* Body title & Reason */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h3
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 800,
            color: 'var(--foreground)',
            margin: 0,
            letterSpacing: '-0.3px',
          }}
        >
          {recommendation.title}
        </h3>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--foreground)',
            margin: 0,
            lineHeight: 1.5,
            backgroundColor: 'var(--background)',
            padding: 'var(--space-2-5) var(--space-3)',
            borderRadius: 'var(--radius-lg)',
            borderLeft: '3px solid var(--warning)',
          }}
        >
          💡 {recommendation.reason}
        </p>
      </div>

      {/* Meta + Primary Action CTA */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          paddingTop: 'var(--space-2)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 500 }}>
          {recommendation.exerciseIds.length} câu tương tác · Trọng tâm củng cố lỗ hổng
        </span>

        <button
          type="button"
          onClick={() => onStart(recommendation)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '12px 28px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            border: 'none',
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(67, 56, 202, 0.35)',
            transition: 'all 0.15s ease',
          }}
        >
          <span>LUYỆN NGAY</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
