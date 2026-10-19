import React from 'react';
import { Zap, ArrowRight } from 'lucide-react';

interface QuickPracticeCardProps {
  onStart: () => void;
}

export const QuickPracticeCard: React.FC<QuickPracticeCardProps> = ({ onStart }) => {
  return (
    <article className="practice-action-card" aria-label="Luyện nhanh 5 phút">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="practice-action-card-top">
          <div className="practice-action-card-icon quick">
            <Zap size={20} />
          </div>
          <div>
            <h3 className="practice-action-card-title">Luyện nhanh 5 phút</h3>
            <span className="practice-action-card-subtitle">
              ⚡ 10 câu ngẫu nhiên tổng hợp phản xạ
            </span>
          </div>
        </div>

        <p className="practice-action-card-desc">
          Hệ thống chọn ngẫu nhiên các câu hỏi từ vựng, ngữ pháp và đặt câu đã học để rèn luyện phản xạ nhanh mà không gây áp lực điểm số.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
        <button
          type="button"
          className="practice-btn-outline"
          onClick={onStart}
        >
          <span>Bắt đầu ngay</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </article>
  );
};
