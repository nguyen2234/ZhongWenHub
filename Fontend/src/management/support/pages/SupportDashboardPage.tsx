import React, { useState, useMemo } from 'react';
import {
  LifeBuoy,
  Search,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  CheckCircle,
  Inbox,
  UserCheck,
} from 'lucide-react';
import { PageHeader, Pagination } from '../../shared/components';
import { supportTicketService } from '../services/support-ticket.service';
import type { SupportTicket, TicketStatus, TicketPriority, TicketCategory } from '../types/support-ticket.types';
import { TicketDetailDrawer } from '../components/TicketDetailDrawer';

export const SupportDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TicketStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | 'ALL'>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Metrics
  const metrics = useMemo(() => {
    void refreshKey;
    return supportTicketService.getMetrics();
  }, [refreshKey]);

  // Tickets
  const tickets = useMemo(() => {
    void refreshKey;
    return supportTicketService.getTickets({
      status: activeTab,
      priority: selectedPriority,
      category: selectedCategory,
      search: searchQuery,
    });
  }, [activeTab, selectedPriority, selectedCategory, searchQuery, refreshKey]);

  const totalPages = Math.ceil(tickets.length / pageSize) || 1;
  const paginatedTickets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return tickets.slice(start, start + pageSize);
  }, [tickets, page, pageSize]);

  const handleUpdateStatus = (id: string, newStatus: TicketStatus, note?: string) => {
    const updated = supportTicketService.updateTicketStatus(id, newStatus, 'Trần Thuỳ Trang (Support)', note);
    setSelectedTicket(updated);
    setRefreshKey((k) => k + 1);
    setNotification(`Đã cập nhật vé [${id}] sang trạng thái: ${newStatus}`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAssign = (id: string, assigneeName: string) => {
    const updated = supportTicketService.assignTicket(id, assigneeName);
    setSelectedTicket(updated);
    setRefreshKey((k) => k + 1);
    setNotification(`Đã phân công vé [${id}] cho: ${assigneeName}`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddNote = (id: string, content: string, isInternal: boolean) => {
    const updated = supportTicketService.addNote(id, content, 'Trần Thuỳ Trang (Support)', isInternal);
    setSelectedTicket(updated);
    setRefreshKey((k) => k + 1);
    setNotification(`Đã lưu ghi chú vào vé [${id}].`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleEscalate = (ticketId: string, payload: any) => {
    const res = supportTicketService.escalateToContentManager(ticketId, payload);
    setSelectedTicket(res.ticket);
    setRefreshKey((k) => k + 1);
    setNotification(`Đã chuyển tiếp lỗi học liệu thành công! Mã hồ sơ Content Manager: [${res.contentIssueId}].`);
    setTimeout(() => setNotification(null), 4500);
  };

  const handleExportCsv = () => {
    const headers = ['Mã vé', 'Học viên', 'Email', 'Tiêu đề', 'Danh mục', 'Ưu tiên', 'Trạng thái', 'Phân công'];
    const rows = tickets.map((t) => [
      t.id,
      t.studentName,
      t.studentEmail,
      `"${t.subject.replace(/"/g, '""')}"`,
      t.category,
      t.priority,
      t.status,
      `"${t.assigneeName}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `support-tickets-demo-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', minWidth: 0 }}>
      {/* 1. Header */}
      <PageHeader
        title="Trung tâm Hỗ trợ Học viên (Support CSKH)"
        subtitle="Tiếp nhận, xử lý khiếu nại kỹ thuật, giải đáp học liệu và phối hợp liên phòng ban."
        actions={
          <button
            type="button"
            onClick={handleExportCsv}
            className="ds-btn ds-btn-secondary"
            style={{ gap: '6px' }}
          >
            <Download size={15} /> Xuất CSV ({tickets.length})
          </button>
        }
      />

      {/* Notification Banner */}
      {notification && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <CheckCircle size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* Simulated Notice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          fontSize: '12px',
          color: 'var(--muted)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: '11px',
              textTransform: 'uppercase',
            }}
          >
            Hỗ trợ CSKH Demo
          </span>
          <span>
            Vé phản ánh từ học viên được xử lý trực tiếp trên frontend. Hỗ trợ chuyển tiếp báo lỗi học liệu sang Content Manager theo thời gian thực.
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
          Tỉ lệ hài lòng trung bình: <strong>{metrics.satisfactionRate}%</strong>
        </span>
      </div>

      {/* 2. KPI Metrics Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <LifeBuoy size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Tổng số vé</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--foreground)' }}>
              {metrics.total}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(230, 0, 18, 0.1)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Inbox size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Vé mới nhận</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>
              {metrics.newCount}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#fffbeb',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Đang xử lý</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#d97706' }}>
              {metrics.inProgress}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#fff1f2',
              color: '#be123c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Quá hạn SLA</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#be123c' }}>
              {metrics.slaOverdue}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <UserCheck size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Đã giải quyết</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a' }}>
              {metrics.resolved}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Status Tabs Bar */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid var(--border)',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        {[
          { key: 'ALL', label: 'Tất cả vé' },
          { key: 'NEW', label: 'Mới nhận' },
          { key: 'IN_PROGRESS', label: 'Đang xử lý' },
          { key: 'WAITING_STUDENT', label: 'Chờ học viên' },
          { key: 'RESOLVED', label: 'Đã giải quyết' },
          { key: 'CLOSED', label: 'Đã đóng' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key as any);
                setPage(1);
              }}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--primary)' : 'var(--muted)',
                backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.12s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. Toolbar Filters */}
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
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
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
            placeholder="Tìm theo mã vé, tên học viên, email hoặc nội dung..."
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

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value as any);
              setPage(1);
            }}
            aria-label="Lọc danh mục sự cố"
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
            <option value="ALL">Mọi danh mục</option>
            <option value="CONTENT">Lỗi học liệu & Ngữ pháp</option>
            <option value="TECHNICAL">Lỗi kỹ thuật & Đăng nhập</option>
            <option value="ACCOUNT">Tài khoản & Đổi lớp</option>
            <option value="BILLING">Thanh toán & Hóa đơn</option>
          </select>
        </div>
      </div>

      {/* 5. Desktop Table View */}
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
              minWidth: '820px',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--muted)', width: '110px' }}>Mã vé</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--muted)' }}>Học viên & Tiêu đề</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--muted)', width: '130px' }}>Danh mục</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--muted)', width: '110px' }}>Ưu tiên</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--muted)', width: '150px' }}>Hạn SLA</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--muted)', width: '130px' }}>Trạng thái</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--muted)', textAlign: 'right', width: '110px' }}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)' }}>
                    Không có vé hỗ trợ nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket) => (
                  <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--foreground)', fontFamily: 'monospace' }}>
                        {ticket.id}
                      </div>
                      {ticket.contentIssueId && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: '#f0fdf4',
                            color: '#16a34a',
                            display: 'inline-block',
                            marginTop: '4px',
                          }}
                        >
                          {ticket.contentIssueId}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{ticket.subject}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
                        {ticket.studentName} • {ticket.studentEmail}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'var(--foreground)',
                          fontWeight: 500,
                        }}
                      >
                        {ticket.category === 'CONTENT'
                          ? 'Học liệu'
                          : ticket.category === 'TECHNICAL'
                          ? 'Kỹ thuật'
                          : ticket.category === 'ACCOUNT'
                          ? 'Tài khoản'
                          : 'Thanh toán'}
                      </span>
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
                      <div style={{ fontSize: '12.5px', color: ticket.isOverdue ? 'var(--danger)' : 'var(--foreground)' }}>
                        {new Date(ticket.slaDeadline).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {ticket.isOverdue && (
                        <span style={{ fontSize: '10.5px', color: '#be123c', fontWeight: 700 }}>
                          Quá hạn
                        </span>
                      )}
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
                        {ticket.status === 'NEW'
                          ? 'Mới'
                          : ticket.status === 'IN_PROGRESS'
                          ? 'Đang xử lý'
                          : ticket.status === 'WAITING_STUDENT'
                          ? 'Chờ học viên'
                          : ticket.status === 'RESOLVED'
                          ? 'Đã giải quyết'
                          : 'Đã đóng'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(ticket)}
                        className="ds-btn ds-btn-secondary"
                        style={{ height: '30px', padding: '0 10px', fontSize: '12px', gap: '4px' }}
                      >
                        <Eye size={13} /> Xử lý
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
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          itemLabel="vé hỗ trợ"
        />
      )}

      {/* Ticket Detail Drawer */}
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
export default SupportDashboardPage;
