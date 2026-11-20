import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Eye,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supportTicketService } from '../../../support/services/support-ticket.service';
import type { SupportTicket, TicketStatus, TicketPriority } from '../../../support/types/support-ticket.types';
import { TicketDetailDrawer } from '../../../support/components/TicketDetailDrawer';
import { Pagination } from '../../../shared/components';

export const AdminSupportRequestsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | 'ALL'>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority | 'ALL'>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const metrics = useMemo(() => {
    void refreshKey;
    return supportTicketService.getMetrics();
  }, [refreshKey]);

  const tickets = useMemo(() => {
    void refreshKey;
    return supportTicketService.getTickets({
      status: selectedStatus,
      priority: selectedPriority,
      search: searchQuery,
    });
  }, [selectedStatus, selectedPriority, searchQuery, refreshKey]);

  const totalPages = Math.ceil(tickets.length / pageSize) || 1;
  const paginatedTickets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return tickets.slice(start, start + pageSize);
  }, [tickets, page, pageSize]);

  const handleUpdateStatus = (id: string, newStatus: TicketStatus, note?: string) => {
    const updated = supportTicketService.updateTicketStatus(id, newStatus, 'Quản trị viên (Admin)', note);
    setSelectedTicket(updated);
    setRefreshKey((k) => k + 1);
  };

  const handleAssign = (id: string, assigneeName: string) => {
    const updated = supportTicketService.assignTicket(id, assigneeName, 'Quản trị viên (Admin)');
    setSelectedTicket(updated);
    setRefreshKey((k) => k + 1);
  };

  const handleAddNote = (id: string, content: string, isInternal: boolean) => {
    const updated = supportTicketService.addNote(id, content, 'Quản trị viên (Admin)', isInternal);
    setSelectedTicket(updated);
    setRefreshKey((k) => k + 1);
  };

  const handleEscalate = (ticketId: string, payload: any) => {
    const res = supportTicketService.escalateToContentManager(ticketId, payload);
    setSelectedTicket(res.ticket);
    setRefreshKey((k) => k + 1);
  };

  const handleExportCsv = () => {
    const headers = ['Mã vé', 'Học viên', 'Email', 'Tiêu đề', 'Danh mục', 'Ưu tiên', 'Trạng thái', 'Phân công', 'Hạn SLA'];
    const rows = tickets.map((t) => [
      t.id,
      t.studentName,
      t.studentEmail,
      `"${t.subject.replace(/"/g, '""')}"`,
      t.category,
      t.priority,
      t.status,
      `"${t.assigneeName}"`,
      t.slaDeadline,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `admin-support-oversight-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Role Oversight Clarification Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          fontSize: '12.5px',
          color: 'var(--muted)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
          <span>
            <strong>Phân quyền Giám sát Admin:</strong> Quản trị viên theo dõi tiến độ giải quyết ticket toàn sàn, phân bổ nhân sự và xử lý khiếu nại vượt cấp (SLA Escalations).
          </span>
        </div>
        <Link
          to="/management/support/dashboard"
          className="ds-btn ds-btn-ghost"
          style={{ height: '28px', fontSize: '11.5px', gap: '4px' }}
        >
          <span>Mở Cổng Support CSKH</span>
          <ExternalLink size={12} />
        </Link>
      </div>

      {/* Summary KPI Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ padding: '14px 16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Tổng yêu cầu tiếp nhận</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--foreground)', marginTop: '2px' }}>
            {metrics.total}
          </div>
        </div>

        <div style={{ padding: '14px 16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Vé mới & Chờ xử lý</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
            {metrics.newCount}
          </div>
        </div>

        <div style={{ padding: '14px 16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Khẩn cấp (URGENT)</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#be123c', marginTop: '2px' }}>
            {metrics.urgent}
          </div>
        </div>

        <div style={{ padding: '14px 16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Vi phạm hạn SLA</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>
            {metrics.slaOverdue}
          </div>
        </div>

        <div style={{ padding: '14px 16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Đã giải quyết</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>
            {metrics.resolved}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã, học viên, tiêu đề..."
            style={{
              width: '100%',
              height: '36px',
              paddingLeft: '36px',
              paddingRight: '12px',
              fontSize: '13px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-strong)',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as any);
              setPage(1);
            }}
            aria-label="Lọc trạng thái"
            style={{
              height: '36px',
              padding: '0 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-strong)',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '12.5px',
            }}
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="NEW">Mới</option>
            <option value="IN_PROGRESS">Đang xử lý</option>
            <option value="WAITING_STUDENT">Chờ phản hồi học viên</option>
            <option value="RESOLVED">Đã giải quyết</option>
            <option value="CLOSED">Đã đóng</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value as any);
              setPage(1);
            }}
            aria-label="Lọc mức ưu tiên"
            style={{
              height: '36px',
              padding: '0 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-strong)',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '12.5px',
            }}
          >
            <option value="ALL">Mọi mức ưu tiên</option>
            <option value="URGENT">Khẩn cấp (URGENT)</option>
            <option value="HIGH">Cao (HIGH)</option>
            <option value="MEDIUM">Trung bình (MEDIUM)</option>
            <option value="LOW">Thấp (LOW)</option>
          </select>

          <button
            type="button"
            onClick={handleExportCsv}
            className="ds-btn ds-btn-secondary"
            style={{ height: '36px', fontSize: '12.5px', gap: '6px' }}
          >
            <Download size={14} /> Xuất CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              textAlign: 'left',
              minWidth: '780px',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--muted)', width: '100px' }}>Mã vé</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--muted)' }}>Tiêu đề & Học viên</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--muted)', width: '120px' }}>Ưu tiên</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--muted)', width: '130px' }}>Trạng thái</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--muted)', width: '180px' }}>Phân công</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--muted)', textAlign: 'right', width: '100px' }}>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)' }}>
                    Không có phiếu hỗ trợ nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket) => (
                  <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{ticket.id}</span>
                      {ticket.contentIssueId && (
                        <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700, marginTop: '2px' }}>
                          Linked: {ticket.contentIssueId}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{ticket.subject}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
                        {ticket.studentName} ({ticket.category})
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
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
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor:
                            ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                              ? '#f0fdf4'
                              : ticket.status === 'IN_PROGRESS'
                              ? '#fffbeb'
                              : 'var(--secondary)',
                          color:
                            ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                              ? '#16a34a'
                              : ticket.status === 'IN_PROGRESS'
                              ? '#d97706'
                              : 'var(--foreground)',
                        }}
                      >
                        {ticket.status}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: '12.5px', color: 'var(--foreground)' }}>
                      {ticket.assigneeName}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(ticket)}
                        className="ds-btn ds-btn-secondary"
                        style={{ height: '28px', padding: '0 8px', fontSize: '11.5px' }}
                      >
                        <Eye size={12} /> Giám sát
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {tickets.length > pageSize && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={tickets.length}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 50]}
          onPageChange={setPage}
          onPageSizeChange={(s: number) => {
            setPageSize(s);
            setPage(1);
          }}
          itemLabel="phiếu giám sát"
        />
      )}

      {/* Ticket Drawer */}
      <TicketDetailDrawer
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onUpdateStatus={handleUpdateStatus}
        onAssign={handleAssign}
        onAddNote={handleAddNote}
        onEscalate={handleEscalate}
      />
    </div>
  );
};
export default AdminSupportRequestsView;
