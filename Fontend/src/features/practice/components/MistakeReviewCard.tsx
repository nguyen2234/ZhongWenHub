import React from 'react';
import { RotateCcw, ArrowRight } from 'lucide-react';
import type { MistakeRecord } from '../types';

interface MistakeReviewCardProps {
  mistakes: MistakeRecord[];
  onStartReview: () => void;
}

export const MistakeReviewCard: React.FC<MistakeReviewCardProps> = ({
  mistakes,
  onStartReview,
}) => {
  return (
    <article className="practice-action-card" aria-label="Ôn lại lỗi sai">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="practice-action-card-top">
          <div className="practice-action-card-icon mistakes">
            <RotateCcw size={19} />
          </div>
          <div>
            <h3 className="practice-action-card-title">Ôn lại lỗi sai</h3>
            <span
              className="practice-action-card-subtitle"
              style={{ color: '#dc2626', fontWeight: 700 }}
            >
              {mistakes.length} câu cần củng cố lại
            </span>
          </div>
        </div>

        <p className="practice-action-card-desc">
          Tập trung vào những câu hỏi bạn đã từng trả lời sai trong các bài kiểm tra hoặc bài luyện trước đó để củng cố trí nhớ dài hạn.
        </p>

        {/* Breakdown chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              fontWeight: 600,
            }}
          >
            Ngữ pháp: {mistakes.filter((m) => m.skill === 'grammar').length} câu
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              fontWeight: 600,
            }}
          >
            Từ vựng: {mistakes.filter((m) => m.skill === 'vocabulary').length} câu
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
        <button
          type="button"
          className="practice-btn-outline"
          onClick={onStartReview}
          disabled={mistakes.length === 0}
          style={{
            borderColor: '#fca5a5',
            color: '#b91c1c',
            opacity: mistakes.length === 0 ? 0.6 : 1,
            cursor: mistakes.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <span>Ôn {mistakes.length} câu sai</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </article>
  );
};
