import React, { useState } from 'react';
import { Inbox, AlertCircle, Info } from 'lucide-react';
import { Modal } from '../../../../design-system';
import type { DemoSubmissionItem } from '../../types/dashboard.types';

export interface PendingSubmissionsQueueProps {
  submissions: DemoSubmissionItem[];
}

export const PendingSubmissionsQueue: React.FC<PendingSubmissionsQueueProps> = ({
  submissions,
}) => {
  const [selectedSubmission, setSelectedSubmission] = useState<DemoSubmissionItem | null>(null);

  return (
    <div className="tp-card" style={{ marginBottom: 'var(--space-6)' }}>
      <div className="tp-card-header">
        <div>
          <h2 className="tp-card-title">
            <Inbox size={18} style={{ color: 'var(--primary)' }} />
            Hàng Đợi Bài Nộp
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--warning-bg)',
                color: 'var(--warning)',
                border: '1px solid var(--warning-border)',
              }}
            >
              Demo Preview
            </span>
          </h2>
          <div className="tp-card-subtitle">
            Bài tập học viên đã hoàn thành chờ chấm điểm
          </div>
        </div>
      </div>

      {/* Thông báo Demo trung thực */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-3)',
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-3)',
          fontSize: '11px',
          color: 'var(--muted)',
        }}
      >
        <Info size={14} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
        <span>
          Dữ liệu bài nộp hiển thị dưới dạng bản xem trước (Demo). Quy trình chấm điểm và
          phản hồi bài tập sẽ được phát triển đầy đủ ở Phase 2.
        </span>
      </div>

      {submissions.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-6)',
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: 'var(--text-sm)',
          }}
        >
          Không có bài nộp nào đang chờ chấm.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {submissions.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedSubmission(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--background)';
                e.currentTarget.style.borderColor = 'var(--border-strong)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
                {item.studentAvatarUrl ? (
                  <img
                    src={item.studentAvatarUrl}
                    alt={item.studentName}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-full)',
                      objectFit: 'cover',
                      border: '1px solid var(--border)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {item.studentName.charAt(0)}
                  </div>
                )}

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 700,
                      color: 'var(--foreground)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.studentName}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.assignmentTitle}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 'var(--space-2)' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor:
                      item.status === 'LATE' ? 'var(--danger-bg)' : 'var(--primary-light)',
                    color: item.status === 'LATE' ? 'var(--danger)' : 'var(--primary)',
                    display: 'inline-block',
                    marginBottom: '2px',
                  }}
                >
                  {item.status === 'LATE' ? 'Nộp muộn' : 'Đã nộp'}
                </span>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>
                  {item.submittedTimeAgo}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Honest Phase 2 Modal */}
      {selectedSubmission && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedSubmission(null)}
          title="Chi tiết bài nộp (Bản xem thử Phase 1)"
        >
          <div style={{ padding: 'var(--space-2) 0' }}>
            <div
              style={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: '4px' }}>
                {selectedSubmission.assignmentTitle}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                Học viên: <strong>{selectedSubmission.studentName}</strong> | Lớp:{' '}
                {selectedSubmission.className}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '4px' }}>
                Thời gian nộp: {selectedSubmission.submittedTimeAgo} ({selectedSubmission.submittedAt})
              </div>
            </div>

            <div
              style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--primary-light)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-5)',
              }}
            >
              <AlertCircle size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--foreground)' }}>
                <strong>Tính năng Chấm điểm trực tuyến:</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--muted)' }}>
                  Giao diện sửa bài, ghi chú âm thanh, chấm điểm theo rubric và gửi phản hồi
                  cho học viên là tính năng chuyên biệt của Phase 2 (Assessment & Grading Portal).
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="ds-btn ds-btn-outline ds-btn-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
