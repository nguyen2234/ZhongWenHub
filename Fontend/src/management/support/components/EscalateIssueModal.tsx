import React, { useState } from 'react';
import { X, Send, AlertTriangle } from 'lucide-react';
import type { SupportTicket } from '../types/support-ticket.types';
import type { ContentIssueType, ModerationContentType } from '../../content-manager/types/content-manager.types';

export interface EscalateIssueModalProps {
  isOpen: boolean;
  ticket: SupportTicket | null;
  onClose: () => void;
  onConfirm: (payload: {
    targetContentId: string;
    targetContentType: ModerationContentType;
    targetContentTitle: string;
    title: string;
    description: string;
    issueType: ContentIssueType;
    priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
    reportedBy: string;
  }) => void;
}

export const EscalateIssueModal: React.FC<EscalateIssueModalProps> = ({
  isOpen,
  ticket,
  onClose,
  onConfirm,
}) => {
  const [contentType, setContentType] = useState<ModerationContentType>('GRAMMAR_POINT');
  const [contentTitle, setContentTitle] = useState('');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueType, setIssueType] = useState<ContentIssueType>('WRONG_MEANING');
  const [priority, setPriority] = useState<'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  React.useEffect(() => {
    if (ticket) {
      setIssueTitle(`[Support Escalate] ${ticket.subject}`);
      setIssueDescription(ticket.description);
      setContentTitle('HSK 3 - Ngữ pháp câu chữ Ba (把)');
      setPriority(ticket.priority);
    }
  }, [ticket]);

  if (!isOpen || !ticket) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      targetContentId: 'cnt-auto',
      targetContentType: contentType,
      targetContentTitle: contentTitle.trim() || 'Học liệu chung',
      title: issueTitle.trim(),
      description: issueDescription.trim(),
      issueType,
      priority,
      reportedBy: ticket.studentName,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="escalate-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-strong)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(230, 0, 18, 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 id="escalate-modal-title" style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--foreground)' }}>
                Chuyển tiếp báo lỗi học liệu (Content Manager)
              </h3>
              <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                Tạo hồ sơ lỗi trực tiếp vào cổng Quản lý học liệu từ vé {ticket.id}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ds-btn ds-btn-ghost ds-btn-icon"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
              Loại học liệu bị phản ánh
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ModerationContentType)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--surface)',
                color: 'var(--foreground)',
                fontSize: '13px',
              }}
            >
              <option value="GRAMMAR_POINT">Điểm ngữ pháp (Grammar Point)</option>
              <option value="HSK_CHARACTER">Chữ Hán & Từ vựng (HSK Character)</option>
              <option value="CURRICULUM_LESSON">Bài học giáo trình (Curriculum Lesson)</option>
              <option value="EXERCISE_QUESTION">Câu hỏi bài tập (Exercise Question)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
              Tên / Mã học liệu cần kiểm tra
            </label>
            <input
              type="text"
              required
              value={contentTitle}
              onChange={(e) => setContentTitle(e.target.value)}
              placeholder="Ví dụ: HSK 3 - Ngữ pháp câu chữ Ba (把)"
              style={{
                width: '100%',
                height: '38px',
                padding: '0 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--surface)',
                color: 'var(--foreground)',
                fontSize: '13px',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                Phân loại lỗi
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as ContentIssueType)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--foreground)',
                  fontSize: '13px',
                }}
              >
                <option value="WRONG_MEANING">Sai giải nghĩa tiếng Việt</option>
                <option value="WRONG_PINYIN">Sai phiên âm Pinyin</option>
                <option value="WRONG_ANSWER">Sai đáp án câu hỏi</option>
                <option value="AUDIO_ERROR">Lỗi tệp âm thanh Audio</option>
                <option value="DISPLAY_ERROR">Lỗi hiển thị / Giao diện</option>
                <option value="OTHER">Lỗi khác</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                Mức ưu tiên
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--foreground)',
                  fontSize: '13px',
                }}
              >
                <option value="URGENT">Khẩn cấp (URGENT)</option>
                <option value="HIGH">Cao (HIGH)</option>
                <option value="MEDIUM">Trung bình (MEDIUM)</option>
                <option value="LOW">Thấp (LOW)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
              Mô tả chi tiết lỗi để Content Manager khắc phục
            </label>
            <textarea
              rows={3}
              required
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--surface)',
                color: 'var(--foreground)',
                fontSize: '13px',
              }}
            />
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button type="button" onClick={onClose} className="ds-btn ds-btn-secondary">
              Hủy
            </button>
            <button type="submit" className="ds-btn ds-btn-primary">
              <Send size={15} /> Chuyển tiếp ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default EscalateIssueModal;
