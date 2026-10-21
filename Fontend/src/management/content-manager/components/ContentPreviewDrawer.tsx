import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Volume2,
  FileCheck,
} from 'lucide-react';
import type { ModerationItem } from '../types/content-manager.types';
import { ModerationBadge } from './ModerationBadge';

export interface ContentPreviewDrawerProps {
  item: ModerationItem | null;
  onClose: () => void;
  onApprovePublish: (item: ModerationItem, notes: string) => void;
  onReject: (item: ModerationItem, reason: string) => void;
  onUnpublish: (item: ModerationItem, reason: string) => void;
}

export const ContentPreviewDrawer: React.FC<ContentPreviewDrawerProps> = ({
  item,
  onClose,
  onApprovePublish,
  onReject,
  onUnpublish,
}) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showUnpublishInput, setShowUnpublishInput] = useState(false);
  const [unpublishReason, setUnpublishReason] = useState('');

  // Reset inputs when selected item changes
  useEffect(() => {
    setReviewNotes('');
    setRejectReason('');
    setShowRejectInput(false);
    setShowUnpublishInput(false);
    setUnpublishReason('');
  }, [item?.id]);

  // Handle ESC key
  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      className="cm-drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Xem trước học liệu ${item.title}`}
    >
      <div
        className="cm-drawer-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="cm-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary-light, #FFF0F1)',
                color: 'var(--primary, #E60012)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>
                  HSK {item.hskLevel} • Phiên bản v{item.version}
                </span>
                <ModerationBadge status={item.status} />
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--foreground)' }}>
                {item.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            className="cm-btn cm-btn-secondary cm-btn-sm"
            onClick={onClose}
            aria-label="Đóng bảng xem trước"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="cm-drawer-body">
          {/* Author & Submission Meta */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--background, #f8fafc)',
              borderRadius: 'var(--radius-lg, 10px)',
              border: '1px solid var(--border-strong, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '13px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
              <span>Tác giả: <strong>{item.authorName}</strong> ({item.authorRole === 'TEACHER' ? 'Giáo viên' : 'Quản lý học liệu'})</span>
              <span>Gửi lúc: {new Date(item.submittedAt).toLocaleDateString('vi-VN')}</span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>Tóm tắt thay đổi: </span>
              <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>{item.changesSummary}</span>
            </div>
            {item.rejectionReason && (
              <div style={{ marginTop: '4px', padding: '6px 10px', backgroundColor: '#fff1f2', borderRadius: '6px', color: '#be123c', fontSize: '12px' }}>
                <strong>Lý do từ chối trước đó:</strong> {item.rejectionReason}
              </div>
            )}
          </div>

          {/* Diff Summary if present */}
          {item.diffSummary && item.diffSummary.length > 0 && (
            <div className="cm-card" style={{ padding: '14px', gap: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>
                So sánh bản sửa đổi (Diff Summary)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {item.diffSummary.map((diff, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--background, #f8fafc)',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                      {diff.field}
                    </div>
                    <div style={{ color: '#be123c', textDecoration: 'line-through' }}>
                      - {diff.oldValue}
                    </div>
                    <div style={{ color: '#047857', fontWeight: 500, marginTop: '2px' }}>
                      + {diff.newValue}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Preview Simulation Card */}
          <div className="cm-card" style={{ gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>
                Nội dung học viên sẽ nhìn thấy (Live Preview)
              </h4>
              <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FileCheck size={14} color="#047857" /> Đã thẩm định hiển thị
              </span>
            </div>

            {/* Hanzi & Pinyin Display */}
            {item.previewData.hanzi && (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--background, #f8fafc)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-strong, #e2e8f0)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '32px',
                    fontFamily: 'var(--font-hanzi)',
                    fontWeight: 700,
                    color: 'var(--foreground)',
                    letterSpacing: '2px',
                  }}
                >
                  {item.previewData.hanzi}
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    color: 'var(--pinyin, #475569)',
                    fontWeight: 600,
                    marginTop: '4px',
                  }}
                >
                  {item.previewData.pinyin}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    color: 'var(--muted)',
                    marginTop: '6px',
                  }}
                >
                  {item.previewData.meaning}
                </div>
              </div>
            )}

            {/* Structure for Grammar */}
            {item.previewData.structure && (
              <div style={{ padding: '10px 14px', backgroundColor: '#eff6ff', borderRadius: '8px', borderLeft: '3px solid #1d4ed8' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>
                  Công thức ngữ pháp
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e3a8a', marginTop: '2px' }}>
                  {item.previewData.structure}
                </div>
              </div>
            )}

            {/* Question bank preview */}
            {item.previewData.questionText && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontWeight: 600, fontSize: '14.5px', color: 'var(--foreground)' }}>
                  {item.previewData.questionText}
                </div>
                {item.previewData.audioUrl && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      backgroundColor: 'var(--background)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--foreground)',
                    }}
                  >
                    <Volume2 size={16} color="var(--primary)" />
                    <span>File âm thanh đính kèm: <code>hsk4-q19.mp3</code> (Thời lượng 0:34)</span>
                  </div>
                )}
                {item.previewData.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {item.previewData.options.map((opt, i) => {
                      const isCorrect = item.previewData.correctAnswer?.includes(opt.slice(0, 2));
                      return (
                        <div
                          key={i}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${isCorrect ? '#10b981' : 'var(--border-strong)'}`,
                            backgroundColor: isCorrect ? '#ecfdf5' : 'var(--surface)',
                            fontSize: '13px',
                            color: isCorrect ? '#047857' : 'var(--foreground)',
                            fontWeight: isCorrect ? 600 : 400,
                          }}
                        >
                          {opt} {isCorrect && '✓ (Đáp án chuẩn)'}
                        </div>
                      );
                    })}
                  </div>
                )}
                {item.previewData.explanation && (
                  <div style={{ padding: '10px 12px', backgroundColor: 'var(--background)', borderRadius: '8px', fontSize: '12.5px', color: 'var(--muted)' }}>
                    <strong>Giải thích chi tiết:</strong> {item.previewData.explanation}
                  </div>
                )}
              </div>
            )}

            {/* Examples list */}
            {item.previewData.examples && item.previewData.examples.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>
                  Câu ví dụ minh họa:
                </div>
                {item.previewData.examples.map((ex, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--background, #f8fafc)',
                      borderLeft: '3px solid var(--border-strong)',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-hanzi)', fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>
                      {ex.chinese}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--pinyin)', marginTop: '2px' }}>
                      {ex.pinyin}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '2px' }}>
                      {ex.vietnamese}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Input Sections */}
          {showRejectInput ? (
            <div style={{ padding: '12px', backgroundColor: '#fff1f2', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#be123c' }}>
                Lý do từ chối (Gửi phản hồi cho giáo viên chỉnh sửa):
              </label>
              <textarea
                className="cm-input"
                style={{ height: '70px', padding: '8px 12px', resize: 'vertical' }}
                placeholder="Nêu rõ điểm chưa đạt: sai chính tả, pinyin chưa chuẩn, ví dụ chưa phù hợp..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="cm-btn cm-btn-secondary cm-btn-sm"
                  onClick={() => setShowRejectInput(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="cm-btn cm-btn-danger cm-btn-sm"
                  disabled={!rejectReason.trim()}
                  onClick={() => onReject(item, rejectReason)}
                >
                  Xác nhận trả về cho giáo viên
                </button>
              </div>
            </div>
          ) : showUnpublishInput ? (
            <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#b45309' }}>
                Lý do tạm thu hồi nội dung đã xuất bản:
              </label>
              <textarea
                className="cm-input"
                style={{ height: '70px', padding: '8px 12px', resize: 'vertical' }}
                placeholder="Nhập lý do thu hồi (vd: phát hiện lỗi từ Support, cập nhật chuẩn HSK mới...)"
                value={unpublishReason}
                onChange={(e) => setUnpublishReason(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="cm-btn cm-btn-secondary cm-btn-sm"
                  onClick={() => setShowUnpublishInput(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="cm-btn cm-btn-danger cm-btn-sm"
                  onClick={() => onUnpublish(item, unpublishReason)}
                >
                  Xác nhận tạm thu hồi về bản nháp
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                Ghi chú kiểm duyệt (Lưu vào Audit Log):
              </label>
              <input
                type="text"
                className="cm-input"
                style={{ width: '100%' }}
                placeholder="Ví dụ: Đã kiểm tra đối chiếu HSK 3 Tiêu Chuẩn, đạt yêu cầu phát hành."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="cm-drawer-footer">
          <button
            type="button"
            className="cm-btn cm-btn-secondary"
            onClick={onClose}
          >
            Đóng
          </button>

          {item.status === 'PUBLISHED' ? (
            <button
              type="button"
              className="cm-btn cm-btn-danger"
              onClick={() => setShowUnpublishInput(true)}
            >
              <RotateCcw size={16} />
              Tạm thu hồi nội dung
            </button>
          ) : (
            <>
              {!showRejectInput && (
                <button
                  type="button"
                  className="cm-btn cm-btn-danger"
                  onClick={() => setShowRejectInput(true)}
                >
                  <AlertTriangle size={16} />
                  Từ chối duyệt
                </button>
              )}

              <button
                type="button"
                className="cm-btn cm-btn-primary"
                onClick={() => onApprovePublish(item, reviewNotes)}
              >
                <CheckCircle2 size={16} />
                Phê duyệt & Xuất bản ngay
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
