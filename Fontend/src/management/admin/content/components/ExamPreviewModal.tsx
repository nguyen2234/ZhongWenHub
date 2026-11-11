import React from 'react';
import { X, Clock, Award, HelpCircle } from 'lucide-react';
import { ContentStatusBadge } from './ContentStatusBadge';
import type { ExamDetail } from '../types/exam-repository.types';

export interface ExamPreviewModalProps {
  isOpen: boolean;
  exam: ExamDetail | null;
  onClose: () => void;
}

export const ExamPreviewModal: React.FC<ExamPreviewModalProps> = ({
  isOpen,
  exam,
  onClose,
}) => {
  if (!isOpen || !exam) return null;

  return (
    <div className="lcm-drawer-overlay" onClick={onClose}>
      <div
        className="lcm-drawer-content"
        style={{ maxWidth: '720px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lcm-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h3 className="lcm-drawer-title">
              Xem trước đề thi: {exam.code}
            </h3>
            <ContentStatusBadge status={exam.status} />
          </div>
          <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="lcm-drawer-body">
          <h2 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-lg)' }}>
            {exam.title}
          </h2>
          {exam.description && (
            <p style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
              {exam.description}
            </p>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
            <span className="lcm-metric-tag">HSK {exam.hskLevel} · {exam.examType}</span>
            <span className="lcm-metric-tag"><Clock size={12} /> {exam.durationMinutes} phút</span>
            <span className="lcm-metric-tag"><HelpCircle size={12} /> {exam.questions.length} câu hỏi</span>
            <span className="lcm-metric-tag"><Award size={12} /> Đạt: {exam.passingScore}/{exam.totalPoints} điểm</span>
          </div>

          {exam.instructions && (
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
              <strong>Hướng dẫn làm bài:</strong>
              <p style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>{exam.instructions}</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {exam.questions.length === 0 ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>
                Đề thi chưa có câu hỏi nào.
              </div>
            ) : (
              exam.questions.map((q) => (
                <div
                  key={q.id}
                  style={{
                    padding: 'var(--space-3)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: 'var(--text-xs)' }}>
                    <strong>
                      Câu {q.orderIndex} ({q.sectionName})
                    </strong>
                    <span style={{ color: 'var(--muted)' }}>{q.points} điểm</span>
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{q.exerciseTitle}</div>
                  {q.promptHanzi && (
                    <div style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-hanzi)', marginTop: '4px' }}>
                      {q.promptHanzi}
                    </div>
                  )}
                  {q.promptVietnamese && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '2px' }}>
                      {q.promptVietnamese}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lcm-drawer-footer">
          <button type="button" className="ds-btn ds-btn-outline ds-btn-sm" onClick={onClose}>
            Đóng xem trước
          </button>
        </div>
      </div>
    </div>
  );
};
