import React from 'react';
import { Target, ArrowRight, Clock, Zap, CheckCircle2 } from 'lucide-react';
import type { PracticeRecommendation } from '../types';

interface RecommendedPracticeCardProps {
  recommendation: PracticeRecommendation | null;
  isRealEvidence?: boolean;
  onStart: (recommendation: PracticeRecommendation) => void;
}

export const RecommendedPracticeCard: React.FC<RecommendedPracticeCardProps> = ({
  recommendation,
  isRealEvidence = false,
  onStart,
}) => {
  if (!recommendation) {
    return (
      <div className="practice-recommended-card" style={{ borderStyle: 'dashed' }}>
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
          Hiện chưa có đề xuất mới. Bạn hãy tiếp tục học bài hoặc làm Luyện nhanh 5 phút!
        </p>
      </div>
    );
  }

  return (
    <article className="practice-recommended-card" aria-label="Đề xuất cho bạn">
      {/* Top Meta Bar */}
      <div className="practice-recommended-top">
        <div className="practice-recommended-meta-left">
          <div className="practice-recommended-badge">
            <Target size={13} />
            <span>ĐỀ XUẤT CHO BẠN</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7' }}>
            HSK {recommendation.hskLevel}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
            {recommendation.subtitle}
          </span>
        </div>

        <div className="practice-recommended-meta-right">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} />
            ~{recommendation.estimatedMinutes} phút
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ea580c' }}>
            <Zap size={13} />
            +{recommendation.xpReward} XP
          </span>
        </div>
      </div>

      {/* Body with Title, Reason, and Primary CTA */}
      <div className="practice-recommended-body">
        <div className="practice-recommended-info">
          <h2 className="practice-recommended-title">{recommendation.title}</h2>
          <p className="practice-recommended-reason">{recommendation.reason}</p>
          <div className="practice-recommended-evidence-tag">
            <CheckCircle2 size={13} />
            <span>
              {isRealEvidence
                ? 'Dựa trên kết quả bài làm thực tế của bạn'
                : 'Đề xuất mẫu củng cố kiến thức trọng tâm'}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="practice-btn-primary"
          onClick={() => onStart(recommendation)}
        >
          <span>Tiếp tục luyện tập</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </article>
  );
};
