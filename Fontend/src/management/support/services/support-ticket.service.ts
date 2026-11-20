import type {
  SupportTicket,
  TicketFilters,
  TicketStatus,
  SupportMetrics,
  CreateTicketPayload,
} from '../types/support-ticket.types';
import { contentIssuesService } from '../../content-manager/services/content-issues.service';
import type { ContentIssueType, ModerationContentType } from '../../content-manager/types/content-manager.types';
import { authTokenService } from '../../../core/api/client/auth-token.service';

function getApiUrl(endpoint: string): string {
  const base = (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1';
  const cleanBase = base.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${cleanBase}/${cleanEndpoint}`;
}

function getAuthHeaders(): Record<string, string> {
  const token = authTokenService.getAccessToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'TICK-2041',
    studentId: 'stu-101',
    studentName: 'Trần Minh Quân',
    studentEmail: 'quan.tm@example.com',
    subject: 'Sai giải thích ngữ pháp câu chữ Ba (把) trong bài học HSK 3',
    description: 'Em thấy câu ví dụ "我把苹果吃了" trong phần ngữ pháp ghi dịch là "Tôi ăn quả táo rồi" nhưng phần giải thích vị ngữ lại nhầm sang thể bị động. Nhờ thầy cô xem lại giúp em.',
    category: 'CONTENT',
    priority: 'URGENT',
    status: 'NEW',
    assigneeName: 'Chưa phân công',
    createdAt: '2026-10-27T08:15:00Z',
    updatedAt: '2026-10-27T08:15:00Z',
    slaDeadline: '2026-10-27T12:15:00Z',
    isOverdue: false,
    notes: [],
    history: [
      {
        id: 'hist-1',
        actorName: 'Hệ thống CSKH',
        actorRole: 'SYSTEM',
        action: 'Tạo vé hỗ trợ từ cổng học viên.',
        timestamp: '2026-10-27T08:15:00Z',
      },
    ],
  },
  {
    id: 'TICK-2038',
    studentId: 'stu-104',
    studentName: 'Nguyễn Thị Lan Anh',
    studentEmail: 'lananh.nguyen@example.com',
    subject: 'Lỗi âm thanh bài nghe HSK 2 bài 5 không tải được',
    description: 'Khi bấm nghe tệp audio câu số 3 thì trình duyệt báo lỗi Network Error hoặc tải chậm không nghe rõ âm đọc.',
    category: 'CONTENT',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assigneeId: 'sup-001',
    assigneeName: 'Trần Thuỳ Trang (Support)',
    createdAt: '2026-10-26T15:20:00Z',
    updatedAt: '2026-10-27T09:00:00Z',
    slaDeadline: '2026-10-27T11:20:00Z',
    isOverdue: false,
    contentIssueId: 'ISS-1004',
    notes: [
      {
        id: 'note-1',
        author: 'Trần Thuỳ Trang',
        content: 'Đã tái hiện lỗi trên Safari iOS. Đã chuyển tiếp sang đội Quản lý học liệu mã ISS-1004 để kiểm tra CDN audio.',
        createdAt: '2026-10-27T09:00:00Z',
        isInternal: true,
      },
    ],
    history: [
      {
        id: 'hist-2',
        actorName: 'Trần Thuỳ Trang',
        actorRole: 'SUPPORT',
        action: 'Tiếp nhận xử lý và chuyển trạng thái sang Đang xử lý.',
        timestamp: '2026-10-27T08:30:00Z',
      },
    ],
  },
  {
    id: 'TICK-2032',
    studentId: 'stu-108',
    studentName: 'Lê Hoàng Nam',
    studentEmail: 'nam.le@example.com',
    subject: 'Không thể đăng nhập tài khoản bằng số điện thoại Viettel',
    description: 'Hệ thống gửi mã OTP xác nhận về máy rất chậm, khi nhập mã thì hết hạn 60 giây.',
    category: 'TECHNICAL',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assigneeId: 'sup-002',
    assigneeName: 'Phạm Văn Dũng (Kỹ thuật)',
    createdAt: '2026-10-26T10:00:00Z',
    updatedAt: '2026-10-26T14:30:00Z',
    slaDeadline: '2026-10-26T14:00:00Z',
    isOverdue: true,
    notes: [
      {
        id: 'note-2',
        author: 'Phạm Văn Dũng',
        content: 'Đã báo bên SMS Gateway kiểm tra độ trễ mạng Viettel.',
        createdAt: '2026-10-26T14:30:00Z',
        isInternal: true,
      },
    ],
    history: [
      {
        id: 'hist-3',
        actorName: 'Phạm Văn Dũng',
        actorRole: 'SUPPORT',
        action: 'Tiếp nhận vé hỗ trợ kỹ thuật SMS.',
        timestamp: '2026-10-26T10:15:00Z',
      },
    ],
  },
  {
    id: 'TICK-2025',
    studentId: 'stu-112',
    studentName: 'Vũ Quốc Huy',
    studentEmail: 'huy.vq@example.com',
    subject: 'Thắc mắc về hóa đơn gia hạn gói HSK Premium 1 năm',
    description: 'Tôi đã thanh toán qua VNPay thành công nhưng chưa nhận được hóa đơn điện tử VAT gửi về email.',
    category: 'BILLING',
    priority: 'MEDIUM',
    status: 'WAITING_STUDENT',
    assigneeId: 'sup-001',
    assigneeName: 'Trần Thuỳ Trang (Support)',
    createdAt: '2026-10-25T09:10:00Z',
    updatedAt: '2026-10-26T11:00:00Z',
    slaDeadline: '2026-10-26T17:00:00Z',
    isOverdue: false,
    notes: [
      {
        id: 'note-3',
        author: 'Trần Thuỳ Trang',
        content: 'Đã gửi hóa đơn điện tử vào email huy.vq@example.com lúc 11:00. Chờ học viên xác nhận.',
        createdAt: '2026-10-26T11:00:00Z',
        isInternal: false,
      },
    ],
    history: [
      {
        id: 'hist-4',
        actorName: 'Trần Thuỳ Trang',
        actorRole: 'SUPPORT',
        action: 'Gửi bản nháp phản hồi và hóa đơn qua email học viên.',
        timestamp: '2026-10-26T11:00:00Z',
      },
    ],
  },
  {
    id: 'TICK-2019',
    studentId: 'stu-115',
    studentName: 'Đặng Mai Phương',
    studentEmail: 'phuong.dm@example.com',
    subject: 'Yêu cầu đổi giáo viên hướng dẫn khóa học HSK 4',
    description: 'Do thay đổi lịch công tác vào ca tối, em xin phép đổi sang lớp HSK 4 của cô Hoàng Linh.',
    category: 'ACCOUNT',
    priority: 'LOW',
    status: 'RESOLVED',
    assigneeId: 'sup-001',
    assigneeName: 'Trần Thuỳ Trang (Support)',
    createdAt: '2026-10-24T14:00:00Z',
    updatedAt: '2026-10-25T10:30:00Z',
    slaDeadline: '2026-10-25T18:00:00Z',
    isOverdue: false,
    notes: [
      {
        id: 'note-4',
        author: 'Trần Thuỳ Trang',
        content: 'Đã hoàn tất thủ tục chuyển lớp sang CLS-HSK4-02 của cô Linh.',
        createdAt: '2026-10-25T10:30:00Z',
        isInternal: true,
      },
    ],
    history: [
      {
        id: 'hist-5',
        actorName: 'Trần Thuỳ Trang',
        actorRole: 'SUPPORT',
        action: 'Xác nhận đổi lớp và hoàn tất xử lý vé.',
        timestamp: '2026-10-25T10:30:00Z',
      },
    ],
  },
];

class SupportTicketService {
  private tickets: SupportTicket[] = structuredClone(INITIAL_TICKETS);
  private isSyncing = false;
  private hasSynced = false;

  constructor() {
    this.syncFromBackend().catch(() => {});
  }

  resetToInitial(): void {
    this.tickets = structuredClone(INITIAL_TICKETS);
  }

  public get isSynced(): boolean {
    return this.hasSynced;
  }

  public async syncFromBackend(): Promise<{ success: boolean; error?: string }> {
    if (this.isSyncing) return { success: true };
    this.isSyncing = true;

    try {
      const res = await fetch(getApiUrl('support/tickets?page=1&pageSize=100'), {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!res.ok) {
        this.isSyncing = false;
        return { success: false, error: `HTTP ${res.status}` };
      }

      const data = await res.json();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        this.tickets = data.items.map((b: any) => ({
          id: b.ticketNumber || b.id,
          studentId: b.reporterId || '',
          studentName: b.reporterName || 'Học viên',
          studentEmail: b.reporterEmail || '',
          subject: b.subject,
          description: b.description || b.subject,
          category: b.category || 'OTHER',
          priority: b.priority || 'MEDIUM',
          status: b.status || 'NEW',
          assigneeId: b.assigneeId,
          assigneeName: b.assigneeName || 'Chưa phân công',
          createdAt: b.createdAt,
          updatedAt: b.updatedAt || b.createdAt,
          slaDeadline: b.slaDeadline || b.createdAt,
          isOverdue: Boolean(b.isOverdue),
          contentIssueId: b.contentIssueId,
          notes: [],
          history: [],
        }));
      }
      this.hasSynced = true;
      this.isSyncing = false;
      return { success: true };
    } catch (err: any) {
      this.isSyncing = false;
      return { success: false, error: err?.message };
    }
  }

  // --- Real Async Backend Methods ---

  public async createTicketAsync(payload: CreateTicketPayload): Promise<SupportTicket> {
    const res = await fetch(getApiUrl('support/tickets'), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || err?.message || `Gửi báo cáo sự cố thất bại (HTTP ${res.status}).`);
    }

    const created = await res.json();
    const mapped: SupportTicket = {
      id: created.ticketNumber || created.id,
      studentId: created.reporterId || '',
      studentName: created.reporterName || 'Người gửi',
      studentEmail: created.reporterEmail || '',
      subject: created.subject,
      description: created.description,
      category: created.category,
      priority: created.priority,
      status: created.status,
      assigneeId: created.assigneeId,
      assigneeName: created.assigneeName || 'Chưa phân công',
      createdAt: created.createdAt,
      updatedAt: created.updatedAt || created.createdAt,
      slaDeadline: created.slaDeadline,
      isOverdue: created.isOverdue,
      contentIssueId: created.contentIssueId,
      notes: (created.messages || []).map((m: any) => ({
        id: m.id,
        author: m.senderName,
        content: m.message,
        createdAt: m.createdAt,
        isInternal: m.isInternal,
      })),
      history: (created.history || []).map((h: any) => ({
        id: h.id,
        actorName: h.actorName,
        actorRole: h.actorRole,
        action: h.action,
        timestamp: h.timestamp,
      })),
    };

    // Prepend to local tickets cache
    this.tickets.unshift(mapped);
    return mapped;
  }

  public async fetchMyReportsAsync(page = 1, pageSize = 20): Promise<{ items: SupportTicket[]; total: number }> {
    const res = await fetch(getApiUrl(`support/tickets/my-reports?page=${page}&pageSize=${pageSize}`), {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!res.ok) {
      return { items: [], total: 0 };
    }

    const data = await res.json();
    const items: SupportTicket[] = (data.items || []).map((b: any) => ({
      id: b.ticketNumber || b.id,
      studentId: b.reporterId || '',
      studentName: b.reporterName || 'Tôi',
      studentEmail: b.reporterEmail || '',
      subject: b.subject,
      description: b.subject,
      category: b.category,
      priority: b.priority,
      status: b.status,
      assigneeId: b.assigneeId,
      assigneeName: b.assigneeName || 'Chưa phân công',
      createdAt: b.createdAt,
      updatedAt: b.updatedAt || b.createdAt,
      slaDeadline: b.slaDeadline,
      isOverdue: Boolean(b.isOverdue),
      contentIssueId: b.contentIssueId,
      notes: [],
      history: [],
    }));

    return { items, total: data.totalCount || items.length };
  }

  public async fetchTicketDetailAsync(id: string): Promise<SupportTicket | null> {
    const res = await fetch(getApiUrl(`support/tickets/${id}`), {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!res.ok) return null;
    const b = await res.json();

    return {
      id: b.ticketNumber || b.id,
      studentId: b.reporterId || '',
      studentName: b.reporterName,
      studentEmail: b.reporterEmail,
      subject: b.subject,
      description: b.description,
      category: b.category,
      priority: b.priority,
      status: b.status,
      assigneeId: b.assigneeId,
      assigneeName: b.assigneeName || 'Chưa phân công',
      createdAt: b.createdAt,
      updatedAt: b.updatedAt || b.createdAt,
      slaDeadline: b.slaDeadline,
      isOverdue: Boolean(b.isOverdue),
      contentIssueId: b.contentIssueId,
      notes: (b.messages || []).map((m: any) => ({
        id: m.id,
        author: m.senderName,
        content: m.message,
        createdAt: m.createdAt,
        isInternal: m.isInternal,
      })),
      history: (b.history || []).map((h: any) => ({
        id: h.id,
        actorName: h.actorName,
        actorRole: h.actorRole,
        action: h.action,
        timestamp: h.timestamp,
      })),
    };
  }

  public async addMessageAsync(id: string, message: string, isInternal = false): Promise<void> {
    const res = await fetch(getApiUrl(`support/tickets/${id}/messages`), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ message, isInternal }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || err?.message || `Gửi phản hồi thất bại (HTTP ${res.status}).`);
    }
  }

  public async reopenTicketAsync(id: string): Promise<void> {
    const res = await fetch(getApiUrl(`support/tickets/${id}/reopen`), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || err?.message || `Mở lại vé thất bại (HTTP ${res.status}).`);
    }
  }

  // --- Synchronous Facade (Preserving full compatibility with existing components) ---

  getTickets(filters?: TicketFilters): SupportTicket[] {
    let result = structuredClone(this.tickets);

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters?.priority && filters.priority !== 'ALL') {
      result = result.filter((t) => t.priority === filters.priority);
    }
    if (filters?.category && filters.category !== 'ALL') {
      result = result.filter((t) => t.category === filters.category);
    }
    if (filters?.assignee && filters.assignee !== 'ALL') {
      result = result.filter((t) => t.assigneeName.includes(filters.assignee!));
    }
    if (filters?.search?.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.studentName.toLowerCase().includes(q) ||
          t.studentEmail.toLowerCase().includes(q) ||
          t.assigneeName.toLowerCase().includes(q)
      );
    }

    return result;
  }

  getTicketById(id: string): SupportTicket | undefined {
    const ticket = this.tickets.find((t) => t.id === id);
    return ticket ? structuredClone(ticket) : undefined;
  }

  updateTicketStatus(
    id: string,
    newStatus: TicketStatus,
    actor = 'Trần Thuỳ Trang (Support)',
    note?: string
  ): SupportTicket {
    const index = this.tickets.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Không tìm thấy ticket: ${id}`);

    const existing = this.tickets[index];
    const now = new Date().toISOString();

    const newHistoryEntry = {
      id: `hist-${Date.now()}`,
      actorName: actor,
      actorRole: 'SUPPORT' as const,
      action: `Chuyển trạng thái sang [${newStatus}]. ${note ? `Ghi chú: ${note}` : ''}`,
      timestamp: now,
    };

    const newNotes = note
      ? [
          ...existing.notes.map((n) => ({ ...n })),
          {
            id: `note-${Date.now()}`,
            author: actor,
            content: note,
            createdAt: now,
            isInternal: true,
          },
        ]
      : existing.notes.map((n) => ({ ...n }));

    const updated: SupportTicket = {
      ...existing,
      status: newStatus,
      updatedAt: now,
      notes: newNotes,
      history: [...existing.history.map((h) => ({ ...h })), newHistoryEntry],
    };

    this.tickets[index] = updated;

    // Trigger async backend update in background
    fetch(getApiUrl(`support/tickets/${id}/status`), {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ status: newStatus, note }),
    }).catch(() => {});

    return structuredClone(updated);
  }

  assignTicket(
    id: string,
    assigneeName: string,
    actor = 'Trần Thuỳ Trang (Support)'
  ): SupportTicket {
    const index = this.tickets.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Không tìm thấy ticket: ${id}`);

    const existing = this.tickets[index];
    const now = new Date().toISOString();

    const newHistoryEntry = {
      id: `hist-${Date.now()}`,
      actorName: actor,
      actorRole: 'SUPPORT' as const,
      action: `Phân công xử lý vé cho: ${assigneeName}.`,
      timestamp: now,
    };

    const updated: SupportTicket = {
      ...existing,
      assigneeName,
      status: existing.status === 'NEW' ? 'IN_PROGRESS' : existing.status,
      updatedAt: now,
      notes: existing.notes.map((n) => ({ ...n })),
      history: [...existing.history.map((h) => ({ ...h })), newHistoryEntry],
    };

    this.tickets[index] = updated;

    return structuredClone(updated);
  }

  addNote(
    id: string,
    content: string,
    author = 'Trần Thuỳ Trang (Support)',
    isInternal = true
  ): SupportTicket {
    const index = this.tickets.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Không tìm thấy ticket: ${id}`);

    const existing = this.tickets[index];
    const now = new Date().toISOString();

    const newNote = {
      id: `note-${Date.now()}`,
      author,
      content,
      createdAt: now,
      isInternal,
    };

    const newHistoryEntry = {
      id: `hist-${Date.now()}`,
      actorName: author,
      actorRole: 'SUPPORT' as const,
      action: isInternal
        ? `Thêm ghi chú nội bộ CSKH.`
        : `Gửi phản hồi trao đổi tới học viên.`,
      timestamp: now,
    };

    const updated: SupportTicket = {
      ...existing,
      updatedAt: now,
      notes: [...existing.notes.map((n) => ({ ...n })), newNote],
      history: [...existing.history.map((h) => ({ ...h })), newHistoryEntry],
    };

    this.tickets[index] = updated;

    // Trigger async backend message creation in background
    fetch(getApiUrl(`support/tickets/${id}/messages`), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ message: content, isInternal }),
    }).catch(() => {});

    return structuredClone(updated);
  }

  escalateToContentManager(
    ticketId: string,
    payload: {
      targetContentId: string;
      targetContentType: ModerationContentType;
      targetContentTitle: string;
      title: string;
      description: string;
      issueType: ContentIssueType;
      priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
      reportedBy: string;
      supportStaffName?: string;
    }
  ): { ticket: SupportTicket; contentIssueId: string } {
    const index = this.tickets.findIndex((t) => t.id === ticketId);
    if (index === -1) throw new Error(`Không tìm thấy ticket: ${ticketId}`);

    const staffName = payload.supportStaffName || 'Trần Thuỳ Trang (Support)';

    const createdIssue = contentIssuesService.createIssue({
      targetContentId: payload.targetContentId,
      targetContentType: payload.targetContentType,
      targetContentTitle: payload.targetContentTitle,
      title: payload.title,
      description: payload.description,
      issueType: payload.issueType,
      priority: payload.priority,
      reportedBy: payload.reportedBy,
      supportStaffName: staffName,
    });

    const existing = this.tickets[index];
    const now = new Date().toISOString();

    const newNote = {
      id: `note-${Date.now()}`,
      author: staffName,
      content: `Đã chuyển tiếp lỗi học liệu sang Content Manager với mã báo cáo [${createdIssue.id}]. Tiêu đề: "${createdIssue.title}".`,
      createdAt: now,
      isInternal: true,
    };

    const newHistoryEntry = {
      id: `hist-${Date.now()}`,
      actorName: staffName,
      actorRole: 'SUPPORT' as const,
      action: `Chuyển tiếp báo cáo lỗi sang ban Quản lý học liệu (Mã: ${createdIssue.id}).`,
      timestamp: now,
    };

    const updated: SupportTicket = {
      ...existing,
      contentIssueId: createdIssue.id,
      status: 'IN_PROGRESS',
      updatedAt: now,
      notes: [...existing.notes.map((n) => ({ ...n })), newNote],
      history: [...existing.history.map((h) => ({ ...h })), newHistoryEntry],
    };

    this.tickets[index] = updated;

    // Trigger async escalation in backend
    fetch(getApiUrl(`support/tickets/${ticketId}/escalate-content`), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ note: `Chuyển tiếp lỗi học liệu sang Content Manager [${createdIssue.id}]` }),
    }).catch(() => {});

    return { ticket: structuredClone(updated), contentIssueId: createdIssue.id };
  }

  getMetrics(): SupportMetrics {
    const all = this.tickets;
    const resolved = all.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    return {
      total: all.length,
      newCount: all.filter((t) => t.status === 'NEW').length,
      inProgress: all.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'WAITING_STUDENT').length,
      resolved,
      urgent: all.filter((t) => t.priority === 'URGENT').length,
      slaOverdue: all.filter((t) => t.isOverdue && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length,
      avgResolutionHours: 3.4,
      satisfactionRate: 98.2,
    };
  }
}

export const supportTicketService = new SupportTicketService();
