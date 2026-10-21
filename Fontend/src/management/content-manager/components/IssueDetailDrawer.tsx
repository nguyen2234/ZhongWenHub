import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ContentIssue } from '../types/content-manager.types';
import { IssueStatusBadge } from './IssueStatusBadge';

export interface IssueDetailDrawerProps {
  issue: ContentIssue | null;
  onClose: () => void;
  onAssignToMe: (issueId: string) => void;
  onResolve: (issueId: string, resolutionNotes: string, feedbackToSupport: string) => void;
  onReopen: (issueId: string, reason: string) => void;
  onCloseIssue: (issueId: string) => void;
}

export const IssueDetailDrawer: React.FC<IssueDetailDrawerProps> = ({
  issue,
  onClose,
  onAssignToMe,
  onResolve,
  onReopen,
  onCloseIssue,
}) => {
  const navigate = useNavigate();
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [feedbackToSupport, setFeedbackToSupport] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenForm, setShowReopenForm] = useState(false);

  useEffect(() => {
    setResolutionNotes('');
    setFeedbackToSupport('');
    setShowResolveForm(false);
    setReopenReason('');
    setShowReopenForm(false);
  }, [issue?.id]);

  useEffect(() => {
    if (!issue) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [issue, onClose]);

  if (!issue) return null;

  const handleDeepLink = () => {
    onClose();
    navigate(issue.targetContentRoute);
  };

  return (
    <div
      className="cm-drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết báo cáo lỗi ${issue.id}`}
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
                backgroundColor: '#fff1f2',
                color: '#be123c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>
                  {issue.id}
                </span>
                <IssueStatusBadge status={issue.status} />
                {issue.isOverdue && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#be123c', backgroundColor: '#fff1f2', padding: '1px 6px', borderRadius: '4px' }}>
                    Quá hạn SLA
                  </span>
                )}
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--foreground)' }}>
                {issue.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            className="cm-btn cm-btn-secondary cm-btn-sm"
            onClick={onClose}
            aria-label="Đóng bảng báo cáo lỗi"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="cm-drawer-body">
          {/* Target Content Banner & Deep Link */}
          <div
            style={{
              padding: '14px',
              backgroundColor: '#eff6ff',
              borderRadius: '12px',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>
                Học liệu liên quan cần chỉnh sửa
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a8a', marginTop: '2px' }}>
                {issue.targetContentTitle}
              </div>
              <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '2px' }}>
                Mã học liệu: <code>{issue.targetContentId}</code> ({issue.targetContentType})
              </div>
            </div>
            <button
              type="button"
              className="cm-btn cm-btn-outline cm-btn-sm"
              onClick={handleDeepLink}
              style={{ backgroundColor: '#ffffff', borderColor: '#93c5fd', color: '#1d4ed8' }}
            >
              <ExternalLink size={14} />
              Mở học liệu để sửa
            </button>
          </div>

          {/* Student Report Description */}
          <div className="cm-card" style={{ gap: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>
              Nội dung học viên phản ánh
            </h4>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--foreground)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {issue.description}
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--muted)', paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
              <span>Người báo cáo: <strong>{issue.reportedBy}</strong></span>
              <span>Support phụ trách: <strong>{issue.supportStaffName}</strong></span>
              <span>Tạo lúc: {new Date(issue.createdAt).toLocaleString('vi-VN')}</span>
            </div>
          </div>

          {/* Handler Assignment Status */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border-strong)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '13px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} color="var(--muted)" />
              <span>
                Content Manager xử lý: <strong>{issue.contentManagerName || 'Chưa phân công'}</strong>
              </span>
            </div>
            {!issue.contentManagerName && (
              <button
                type="button"
                className="cm-btn cm-btn-secondary cm-btn-sm"
                onClick={() => onAssignToMe(issue.id)}
              >
                Nhận xử lý báo cáo này
              </button>
            )}
          </div>

          {/* Resolution Result if Resolved */}
          {issue.status === 'RESOLVED' && (
            <div className="cm-card" style={{ borderLeft: '4px solid #10b981', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: 700, fontSize: '13px' }}>
                <CheckCircle2 size={16} />
                Đã xử lý & Xuất bản phiên bản vá v{issue.resolutionVersion}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--foreground)' }}>
                <strong>Ghi chú kỹ thuật:</strong> {issue.resolutionNotes}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px', padding: '8px 10px', backgroundColor: 'var(--background)', borderRadius: '6px' }}>
                <strong>Phản hồi gửi về Support:</strong> "{issue.feedbackToSupport}"
              </div>
            </div>
          )}

          {/* Resolve Form */}
          {showResolveForm && (
            <div className="cm-card" style={{ borderLeft: '4px solid var(--primary)', gap: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>
                Xác nhận khắc phục lỗi & Gửi phản hồi về Support
              </h4>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                  1. Ghi chú chỉnh sửa học liệu (Lưu vào Audit Log):
                </label>
                <textarea
                  className="cm-input"
                  style={{ width: '100%', height: '60px', padding: '8px 12px', resize: 'vertical' }}
                  placeholder="Ví dụ: Đã sửa Pinyin mài -> mǎi, bổ sung 2 câu ví dụ mới và xuất bản phiên bản v2."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                  2. Lời nhắn phản hồi gửi CSKH (để Support thông báo cho học viên):
                </label>
                <textarea
                  className="cm-input"
                  style={{ width: '100%', height: '60px', padding: '8px 12px', resize: 'vertical' }}
                  placeholder="Ví dụ: Chào Support, lỗi Pinyin đã được sửa chuẩn xác. Nhờ bạn nhắn học viên mở lại bài học để cập nhật nhé!"
                  value={feedbackToSupport}
                  onChange={(e) => setFeedbackToSupport(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="cm-btn cm-btn-secondary cm-btn-sm"
                  onClick={() => setShowResolveForm(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="cm-btn cm-btn-primary cm-btn-sm"
                  disabled={!resolutionNotes.trim() || !feedbackToSupport.trim()}
                  onClick={() => onResolve(issue.id, resolutionNotes, feedbackToSupport)}
                >
                  <Send size={14} />
                  Hoàn tất & Phản hồi cho Support
                </button>
              </div>
            </div>
          )}

          {/* Reopen Form */}
          {showReopenForm && (
            <div className="cm-card" style={{ borderLeft: '4px solid #be123c', gap: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#be123c' }}>
                Lý do mở lại báo cáo lỗi
              </h4>
              <textarea
                className="cm-input"
                style={{ width: '100%', height: '60px', padding: '8px 12px', resize: 'vertical' }}
                placeholder="Nhập lý do vì sao lỗi chưa được khắc phục triệt để..."
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="cm-btn cm-btn-secondary cm-btn-sm"
                  onClick={() => setShowReopenForm(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="cm-btn cm-btn-danger cm-btn-sm"
                  disabled={!reopenReason.trim()}
                  onClick={() => onReopen(issue.id, reopenReason)}
                >
                  Mở lại Issue
                </button>
              </div>
            </div>
          )}

          {/* Discussion & Audit Trail */}
          <div className="cm-card" style={{ gap: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>
              Lịch sử phối hợp xử lý (Audit Trail)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {issue.history.map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--background, #f8fafc)',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                  }}
                >
                  <div style={{ flexShrink: 0, marginTop: '2px' }}>
                    {act.actorRole === 'SUPPORT' ? (
                      <ShieldCheck size={16} color="#0284c7" />
                    ) : (
                      <Clock size={16} color="#059669" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '11.5px' }}>
                      <strong>{act.actorName} ({act.actorRole})</strong>
                      <span>{new Date(act.timestamp).toLocaleString('vi-VN')}</span>
                    </div>
                    <div style={{ color: 'var(--foreground)', marginTop: '2px' }}>
                      {act.action}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

          {issue.status === 'RESOLVED' && (
            <>
              <button
                type="button"
                className="cm-btn cm-btn-secondary cm-btn-sm"
                onClick={() => setShowReopenForm(true)}
              >
                <RefreshCw size={14} />
                Mở lại lỗi
              </button>
              <button
                type="button"
                className="cm-btn cm-btn-primary"
                onClick={() => onCloseIssue(issue.id)}
              >
                <CheckCircle2 size={16} />
                Đóng Issue (Học viên hài lòng)
              </button>
            </>
          )}

          {(issue.status === 'NEW' || issue.status === 'TRIAGED' || issue.status === 'IN_PROGRESS' || issue.status === 'REOPENED') && (
            <button
              type="button"
              className="cm-btn cm-btn-primary"
              onClick={() => setShowResolveForm(true)}
            >
              <CheckCircle2 size={16} />
              Xử lý xong & Phản hồi Support
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
