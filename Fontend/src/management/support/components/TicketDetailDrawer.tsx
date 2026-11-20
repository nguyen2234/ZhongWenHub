import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Clock,
  Share2,
  MessageSquare,
  Lock,
  ExternalLink,
  Send,
  History,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SupportTicket, TicketStatus } from '../types/support-ticket.types';
import type { ModerationContentType } from '../../content-manager/types/content-manager.types';
import { EscalateIssueModal } from './EscalateIssueModal';

export interface TicketDetailDrawerProps {
  ticket: SupportTicket | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: TicketStatus, note?: string) => void;
  onAssign: (id: string, assigneeName: string) => void;
  onAddNote: (id: string, content: string, isInternal: boolean) => void;
  onEscalate: (
    ticketId: string,
    payload: {
      targetContentId: string;
      targetContentType: ModerationContentType;
      targetContentTitle: string;
      title: string;
      description: string;
      issueType: any;
      priority: any;
      reportedBy: string;
    }
  ) => void;
}

export const TicketDetailDrawer: React.FC<TicketDetailDrawerProps> = ({
  ticket,
  onClose,
  onUpdateStatus,
  onAssign,
  onAddNote,
  onEscalate,
}) => {
  const [noteContent, setNoteContent] = useState('');
  const [isInternal, setIsInternal] = useState(true);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!ticket) return null;

  const handleSendNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    onAddNote(ticket.id, noteContent.trim(), isInternal);
    setNoteContent('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-drawer-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 'var(--z-drawer)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          height: '100%',
          backgroundColor: 'var(--surface)',
          borderLeft: '1px solid var(--border-strong)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-2xl)',
          animation: 'mgmt-slide-in 0.22s ease',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: 'var(--foreground)',
                fontFamily: 'monospace',
                backgroundColor: 'var(--secondary)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {ticket.id}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor:
                  ticket.priority === 'URGENT'
                    ? '#fff1f2'
                    : ticket.priority === 'HIGH'
                    ? '#fffbeb'
                    : 'var(--secondary)',
                color:
                  ticket.priority === 'URGENT'
                    ? '#be123c'
                    : ticket.priority === 'HIGH'
                    ? '#b45309'
                    : 'var(--muted)',
              }}
            >
              {ticket.priority}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ds-btn ds-btn-ghost ds-btn-icon"
            style={{ width: '32px', height: '32px' }}
            aria-label="Đóng chi tiết vé"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Subject & Description */}
          <div>
            <h2 id="ticket-drawer-title" style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 700, color: 'var(--foreground)' }}>
              {ticket.subject}
            </h2>
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'var(--background)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                fontSize: '13.5px',
                lineHeight: 1.6,
                color: 'var(--foreground)',
              }}
            >
              {ticket.description}
            </div>
          </div>

          {/* Student Info & SLA Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              padding: '14px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              fontSize: '12.5px',
            }}
          >
            <div>
              <div style={{ color: 'var(--muted)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={13} /> Học viên gửi phản ánh
              </div>
              <strong style={{ color: 'var(--foreground)' }}>{ticket.studentName}</strong>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{ticket.studentEmail}</div>
            </div>

            <div>
              <div style={{ color: 'var(--muted)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} /> Thời hạn SLA
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 600, color: ticket.isOverdue ? 'var(--danger)' : 'var(--foreground)' }}>
                  {new Date(ticket.slaDeadline).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {ticket.isOverdue && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#be123c',
                      backgroundColor: '#fff1f2',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    Quá hạn
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Operational Controls: Status & Assignee */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              padding: '14px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
                Trạng thái xử lý
              </label>
              <select
                value={ticket.status}
                onChange={(e) => onUpdateStatus(ticket.id, e.target.value as TicketStatus)}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 8px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                }}
              >
                <option value="NEW">Mới (NEW)</option>
                <option value="IN_PROGRESS">Đang xử lý (IN_PROGRESS)</option>
                <option value="WAITING_STUDENT">Chờ phản hồi học viên</option>
                <option value="RESOLVED">Đã giải quyết (RESOLVED)</option>
                <option value="CLOSED">Đã đóng (CLOSED)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
                Người phụ trách
              </label>
              <select
                value={ticket.assigneeName}
                onChange={(e) => onAssign(ticket.id, e.target.value)}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 8px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: '12.5px',
                }}
              >
                <option value="Chưa phân công">Chưa phân công</option>
                <option value="Trần Thuỳ Trang (Support)">Trần Thuỳ Trang (Support)</option>
                <option value="Phạm Văn Dũng (Kỹ thuật)">Phạm Văn Dũng (Kỹ thuật)</option>
                <option value="Lê Bảo Ngọc (CSKH)">Lê Bảo Ngọc (CSKH)</option>
              </select>
            </div>
          </div>

          {/* C3. Cross-Portal Escalation Banner / Action */}
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: ticket.contentIssueId ? '#f0fdf4' : 'var(--primary-light)',
              border: `1px solid ${ticket.contentIssueId ? '#bbf7d0' : 'rgba(230, 0, 18, 0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: ticket.contentIssueId ? '#166534' : 'var(--primary)' }}>
                {ticket.contentIssueId ? 'Đã liên kết Ban Quản lý học liệu' : 'Phát hiện lỗi học liệu từ vé này?'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                {ticket.contentIssueId
                  ? `Mã hồ sơ học liệu: ${ticket.contentIssueId}. Đang được Content Manager xử lý.`
                  : 'Chuyển trực tiếp sang Content Manager để kiểm tra Pinyin, dịch nghĩa hoặc file âm thanh.'}
              </div>
            </div>

            {ticket.contentIssueId ? (
              <Link
                to="/management/content-manager/issues"
                className="ds-btn ds-btn-secondary"
                style={{ height: '32px', fontSize: '12px', gap: '4px' }}
              >
                <span>Xem tại Content Manager</span>
                <ExternalLink size={13} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setIsEscalateModalOpen(true)}
                className="ds-btn ds-btn-primary"
                style={{ height: '32px', fontSize: '12px', gap: '6px' }}
              >
                <Share2 size={13} /> Chuyển tiếp lỗi học liệu
              </button>
            )}
          </div>

          {/* Notes & Responses List */}
          <div>
            <h4
              style={{
                margin: '0 0 10px 0',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--foreground)',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              Trao đổi & Ghi chú xử lý ({ticket.notes.length})
            </h4>

            {ticket.notes.length === 0 ? (
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>
                Chưa có ghi chú nào. Hãy soạn ghi chú hoặc gửi phản hồi bên dưới.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ticket.notes.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: n.isInternal ? '#fffbeb' : 'var(--background)',
                      border: `1px solid ${n.isInternal ? '#fef3c7' : 'var(--border)'}`,
                      fontSize: '12.5px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {n.isInternal ? <Lock size={12} color="#b45309" /> : <MessageSquare size={12} />}
                        <strong style={{ color: n.isInternal ? '#b45309' : 'var(--foreground)' }}>
                          {n.author} {n.isInternal && '(Nội bộ CSKH)'}
                        </strong>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {new Date(n.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ color: 'var(--foreground)', lineHeight: 1.5 }}>{n.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Note Form */}
          <form
            onSubmit={handleSendNote}
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="noteType"
                  checked={isInternal}
                  onChange={() => setIsInternal(true)}
                />
                <span style={{ fontWeight: isInternal ? 700 : 400 }}>Ghi chú nội bộ</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="noteType"
                  checked={!isInternal}
                  onChange={() => setIsInternal(false)}
                />
                <span style={{ fontWeight: !isInternal ? 700 : 400 }}>Phản hồi học viên (Demo)</span>
              </label>
            </div>

            <textarea
              rows={2}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={isInternal ? 'Nhập ghi chú kỹ thuật, lưu ý cho đồng nghiệp...' : 'Soạn nội dung phản hồi gửi đến học viên...'}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                fontSize: '12.5px',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={!noteContent.trim()}
                className="ds-btn ds-btn-secondary"
                style={{ height: '32px', fontSize: '12px', gap: '4px' }}
              >
                <Send size={13} /> Gửi ghi chú
              </button>
            </div>
          </form>

          {/* Activity Timeline */}
          <div>
            <h4
              style={{
                margin: '0 0 10px 0',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--foreground)',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <History size={14} /> Lịch sử hoạt động ({ticket.history.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              {ticket.history.map((h) => (
                <div
                  key={h.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    color: 'var(--muted)',
                  }}
                >
                  <span style={{ color: 'var(--primary)', marginTop: '2px' }}>•</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{h.actorName}:</span>{' '}
                    <span>{h.action}</span>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '6px' }}>
                      ({new Date(h.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--surface)',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Mô phỏng quy trình CSKH & Đào tạo ZhongWenHub.
          </span>
          <button type="button" onClick={onClose} className="ds-btn ds-btn-secondary">
            Đóng
          </button>
        </div>
      </div>

      <EscalateIssueModal
        isOpen={isEscalateModalOpen}
        ticket={ticket}
        onClose={() => setIsEscalateModalOpen(false)}
        onConfirm={(payload) => {
          onEscalate(ticket.id, payload);
          setIsEscalateModalOpen(false);
        }}
      />
    </div>
  );
};
export default TicketDetailDrawer;
