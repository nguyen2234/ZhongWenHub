import React from 'react';
import { X, CheckCircle2, AlertTriangle, Send, Sparkles } from 'lucide-react';
import type { EditorSectionKey, LessonValidationSummary } from '../../types';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: LessonValidationSummary;
  onPublish: () => void;
  onSubmitForReview: () => void;
  currentStatus: string;
}

const SECTION_NAMES: Record<EditorSectionKey, string> = {
  intro: '1. Giới thiệu & Siêu dữ liệu',
  vocabulary: '2. Từ vựng HSK',
  grammar: '3. Ngữ pháp trọng tâm',
  dialogue: '4. Hội thoại thực tế',
  listening: '5. Luyện nghe hiểu',
  practice: '6. Bài tập luyện tập',
  quiz: '7. Câu hỏi kiểm tra',
};

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  onClose,
  summary,
  onPublish,
  onSubmitForReview,
  currentStatus,
}) => {
  if (!isOpen) return null;

  const isValidForPublish = summary.totalErrors === 0 && summary.totalWarnings === 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(3px)',
        zIndex: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-6)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--foreground)' }}>
              Kiểm tra Chuẩn Nội dung Bài học
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Đánh giá tính đầy đủ và quy chuẩn sư phạm của 7 phân đoạn bài học.
            </p>
          </div>
          <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-5) var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          {/* Status Banner */}
          <div
            style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: isValidForPublish ? '#ecfdf5' : '#fffbeb',
              border: `1.5px solid ${isValidForPublish ? '#10b981' : '#f59e0b'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              {isValidForPublish ? (
                <CheckCircle2 size={24} style={{ color: '#047857' }} />
              ) : (
                <AlertTriangle size={24} style={{ color: '#b45309' }} />
              )}
              <div>
                <strong style={{ fontSize: 'var(--text-sm)', color: isValidForPublish ? '#065f46' : '#92400e' }}>
                  {isValidForPublish
                    ? 'Bài học đã đạt 100% tiêu chuẩn chất lượng xuất bản!'
                    : `Còn ${summary.totalErrors + summary.totalWarnings} điểm cần lưu ý hoặc hoàn thiện thêm.`}
                </strong>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                  Trạng thái bài học hiện tại: <span style={{ fontWeight: 700 }}>{currentStatus}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Checklist per Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {(Object.keys(SECTION_NAMES) as EditorSectionKey[]).map((secKey) => {
              const res = summary.sections[secKey];
              const isComplete = res?.status === 'COMPLETE';

              return (
                <div
                  key={secKey}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {isComplete ? (
                        <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                      ) : (
                        <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                      )}
                      <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--foreground)' }}>
                        {SECTION_NAMES[secKey]}
                      </strong>
                    </div>

                    <span
                      style={{
                        fontSize: 'var(--text-2xs)',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: isComplete ? '#dcfce7' : '#fef3c7',
                        color: isComplete ? '#15803d' : '#92400e',
                      }}
                    >
                      {isComplete ? 'Đạt chuẩn' : 'Chưa hoàn tất'}
                    </span>
                  </div>

                  {res && res.issues.length > 0 && (
                    <ul style={{ margin: '6px 0 0 20px', padding: 0, fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                      {res.issues.map((issue, idx) => (
                        <li key={idx} style={{ marginTop: '2px' }}>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-6)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--background)',
          }}
        >
          <button type="button" className="ds-btn ds-btn-outline ds-btn-sm" onClick={onClose}>
            Đóng
          </button>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="ds-btn ds-btn-outline ds-btn-sm"
              onClick={() => {
                onSubmitForReview();
                onClose();
              }}
            >
              <Send size={14} /> Gửi duyệt
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-primary ds-btn-sm"
              onClick={() => {
                onPublish();
                onClose();
              }}
            >
              <Sparkles size={14} /> Xuất bản bài học
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
