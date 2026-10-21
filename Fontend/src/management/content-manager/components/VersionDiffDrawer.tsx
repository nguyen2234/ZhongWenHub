import React, { useEffect } from 'react';
import { X, RotateCcw, History, FileText, Check } from 'lucide-react';
import type { VersionSnapshot } from '../types/content-manager.types';
import { ModerationBadge } from './ModerationBadge';

export interface VersionDiffDrawerProps {
  snapshot: VersionSnapshot | null;
  onClose: () => void;
  onRollback: (snapshot: VersionSnapshot) => void;
}

export const VersionDiffDrawer: React.FC<VersionDiffDrawerProps> = ({
  snapshot,
  onClose,
  onRollback,
}) => {
  useEffect(() => {
    if (!snapshot) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [snapshot, onClose]);

  if (!snapshot) return null;

  return (
    <div
      className="cm-drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết phiên bản v${snapshot.version}`}
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
                backgroundColor: 'var(--background, #f8fafc)',
                color: 'var(--foreground, #172033)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-strong, #e2e8f0)',
              }}
            >
              <History size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                  Phiên bản v{snapshot.version}
                </span>
                <ModerationBadge status={snapshot.status} />
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--foreground)' }}>
                {snapshot.contentTitle}
              </h3>
            </div>
          </div>
          <button
            type="button"
            className="cm-btn cm-btn-secondary cm-btn-sm"
            onClick={onClose}
            aria-label="Đóng bảng xem phiên bản"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="cm-drawer-body">
          {/* Metadata Card */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--background, #f8fafc)',
              borderRadius: '10px',
              border: '1px solid var(--border-strong, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '13px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
              <span>Người thực hiện: <strong>{snapshot.changedBy}</strong> ({snapshot.changedByRole})</span>
              <span>Thời điểm: {new Date(snapshot.timestamp).toLocaleString('vi-VN')}</span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>Loại thao tác: </span>
              <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{snapshot.changeType}</span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>Tóm tắt: </span>
              <span style={{ color: 'var(--foreground)' }}>{snapshot.summary}</span>
            </div>
          </div>

          {/* Snapshot Payload Card */}
          <div className="cm-card" style={{ gap: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={15} color="var(--primary)" />
              Dữ liệu lưu vết tại phiên bản này (Snapshot JSON)
            </h4>
            <pre
              style={{
                margin: 0,
                padding: '12px',
                backgroundColor: 'var(--background, #f8fafc)',
                borderRadius: '8px',
                border: '1px solid var(--border, #f1f5f9)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono, monospace)',
                color: 'var(--foreground, #172033)',
                overflowX: 'auto',
                lineHeight: 1.5,
              }}
            >
              {JSON.stringify(snapshot.snapshotPayload, null, 2)}
            </pre>
          </div>

          {/* Rollback Info Alert */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#ecfdf5',
              borderRadius: '10px',
              border: '1px solid #a7f3d0',
              fontSize: '12.5px',
              color: '#065f46',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}
          >
            <Check size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              Khôi phục (Rollback) sẽ lấy dữ liệu của phiên bản v{snapshot.version} này và tạo ra một phiên bản mới nhất được xuất bản ngay lập tức, không ghi đè mất lịch sử.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="cm-drawer-footer">
          <button
            type="button"
            className="cm-btn cm-btn-secondary"
            onClick={onClose}
          >
            Đóng
          </button>
          <button
            type="button"
            className="cm-btn cm-btn-primary"
            onClick={() => onRollback(snapshot)}
          >
            <RotateCcw size={16} />
            Khôi phục về phiên bản v{snapshot.version}
          </button>
        </div>
      </div>
    </div>
  );
};
