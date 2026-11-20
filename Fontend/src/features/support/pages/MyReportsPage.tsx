import React, { useState, useEffect } from 'react';
import {
  Clock,
  HelpCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { supportTicketService } from '../../../management/support/services/support-ticket.service';
import type { SupportTicket, TicketStatus } from '../../../management/support/types/support-ticket.types';
import { ReportIncidentModal } from '../components/ReportIncidentModal';

export const MyReportsPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isReopenLoading, setIsReopenLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const { items } = await supportTicketService.fetchMyReportsAsync(1, 100);
      setTickets(items);
    } catch {
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const openTicketDetail = async (ticketId: string) => {
    setIsDetailLoading(true);
    try {
      const detail = await supportTicketService.fetchTicketDetailAsync(ticketId);
      if (detail) setSelectedTicket(detail);
    } catch {
      // ignore
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    setIsSendingReply(true);
    try {
      await supportTicketService.addMessageAsync(selectedTicket.id, replyMessage.trim(), false);
      setReplyMessage('');
      await openTicketDetail(selectedTicket.id);
      await loadReports();
    } catch (err: any) {
      alert(err?.message || 'Gửi phản hồi thất bại.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleReopen = async () => {
    if (!selectedTicket) return;
    if (!confirm('Bạn có chắc chắn muốn mở lại yêu cầu hỗ trợ này không?')) return;

    setIsReopenLoading(true);
    try {
      await supportTicketService.reopenTicketAsync(selectedTicket.id);
      await openTicketDetail(selectedTicket.id);
      await loadReports();
    } catch (err: any) {
      alert(err?.message || 'Mở lại yêu cầu thất bại.');
    } finally {
      setIsReopenLoading(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'ACTIVE') return t.status !== 'RESOLVED' && t.status !== 'CLOSED';
    if (statusFilter === 'RESOLVED') return t.status === 'RESOLVED' || t.status === 'CLOSED';
    return true;
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'NEW':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Mới tạo</span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Đang xử lý</span>;
      case 'WAITING_STUDENT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Chờ bạn trả lời</span>;
      case 'RESOLVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Đã giải quyết</span>;
      case 'CLOSED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">Đã đóng</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="h-7 w-7 text-primary-600" />
            Báo cáo sự cố của tôi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi tiến trình giải quyết sự cố, câu hỏi học liệu và trao đổi với đội ngũ hỗ trợ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadReports}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            Báo cáo sự cố mới
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${
            statusFilter === 'ALL'
              ? 'bg-primary-50 text-primary-700 font-semibold'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Tất cả ({tickets.length})
        </button>
        <button
          onClick={() => setStatusFilter('ACTIVE')}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${
            statusFilter === 'ACTIVE'
              ? 'bg-primary-50 text-primary-700 font-semibold'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Đang xử lý ({tickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length})
        </button>
        <button
          onClick={() => setStatusFilter('RESOLVED')}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${
            statusFilter === 'RESOLVED'
              ? 'bg-primary-50 text-primary-700 font-semibold'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Đã xử lý xong ({tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length})
        </button>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center bg-gray-50/50">
          <CheckCircle2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-3 text-base font-semibold text-gray-800">Không có yêu cầu sự cố nào</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
            {statusFilter === 'ALL'
              ? 'Bạn chưa gửi báo cáo sự cố nào trên hệ thống. Nếu gặp khó khăn, hãy bấm nút tạo báo cáo bên trên.'
              : 'Không có vé sự cố nào trong bộ lọc này.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => openTicketDetail(ticket.id)}
              className="group cursor-pointer rounded-2xl bg-white border border-gray-200 p-5 shadow-sm hover:border-primary-300 hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-md">
                    {ticket.id}
                  </span>
                  {getStatusBadge(ticket.status)}
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {ticket.category}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary-600 transition">
                  {ticket.subject}
                </h3>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    Tạo ngày: {new Date(ticket.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                  <span>Người phụ trách: {ticket.assigneeName}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-primary-600 bg-primary-50 group-hover:bg-primary-600 group-hover:text-white transition"
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Detail Drawer/Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-gray-600 bg-gray-200/80 px-2 py-0.5 rounded">
                    {selectedTicket.id}
                  </span>
                  {getStatusBadge(selectedTicket.status)}
                  {isDetailLoading && <Loader2 className="h-4 w-4 animate-spin text-primary-600" />}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{selectedTicket.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Original Description */}
              <div className="rounded-xl bg-gray-50 border border-gray-200/70 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">Mô tả sự cố ban đầu</span>
                  <span>{new Date(selectedTicket.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {/* Messages / Conversation Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  Trao đổi & Phản hồi ({selectedTicket.notes?.length || 0})
                </h4>

                {selectedTicket.notes && selectedTicket.notes.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTicket.notes.map((note) => (
                      <div
                        key={note.id}
                        className={`rounded-xl p-4 text-sm border ${
                          note.author.includes('Support') || note.author.includes('Hệ thống')
                            ? 'bg-blue-50/50 border-blue-200 text-blue-950 ml-4'
                            : 'bg-white border-gray-200 text-gray-900 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5 opacity-75">
                          <span className="font-semibold">{note.author}</span>
                          <span>{new Date(note.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Chưa có phản hồi nào từ bộ phận hỗ trợ.</p>
                )}
              </div>

              {/* Resolved State & Reopen Button */}
              {(selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED') && (
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>Yêu cầu này đã được đánh dấu giải quyết. Bạn có thể mở lại nếu vấn đề vẫn tiếp diễn.</span>
                  </div>
                  <button
                    onClick={handleReopen}
                    disabled={isReopenLoading}
                    className="ml-3 shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700 transition"
                  >
                    {isReopenLoading ? 'Đang mở lại...' : 'Mở lại vé'}
                  </button>
                </div>
              )}
            </div>

            {/* Reply Input Form (Only if active) */}
            {selectedTicket.status !== 'CLOSED' && selectedTicket.status !== 'RESOLVED' && (
              <form onSubmit={handleSendReply} className="border-t border-gray-100 p-4 bg-gray-50 flex items-center gap-3">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Nhập nội dung phản hồi tới bộ phận hỗ trợ..."
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={isSendingReply || !replyMessage.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {isSendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>Gửi</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Report Incident Modal */}
      <ReportIncidentModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          loadReports();
        }}
      />
    </div>
  );
};
