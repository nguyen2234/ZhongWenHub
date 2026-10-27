import type {
  SupportTicket,
  TicketFilters,
  TicketStatus,
  SupportMetrics,
} from '../types/support-ticket.types';
import { contentIssuesService } from '../../content-manager/services/content-issues.service';
import type { ContentIssueType, ModerationContentType } from '../../content-manager/types/content-manager.types';

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
        isInternal: false,
      },
    ],
    history: [
      {
        id: 'hist-5',
        actorName: 'Trần Thuỳ Trang',
        actorRole: 'SUPPORT',
        action: 'Đã giải quyết yêu cầu chuyển lớp thành công.',
        timestamp: '2026-10-25T10:30:00Z',
      },
    ],
  },
];

class SupportTicketService {
  private tickets: SupportTicket[] = [...INITIAL_TICKETS];

  resetToInitial(): void {
    this.tickets = [...INITIAL_TICKETS];
  }

  getTickets(filters?: TicketFilters): SupportTicket[] {
    let result = [...this.tickets];

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
    return this.tickets.find((t) => t.id === id);
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

    const updated: SupportTicket = {
      ...existing,
      status: newStatus,
      updatedAt: now,
      history: [
        ...existing.history,
        {
          id: `hist-${Date.now()}`,
          actorName: actor,
          actorRole: 'SUPPORT',
          action: `Chuyển trạng thái sang [${newStatus}]. ${note ? `Ghi chú: ${note}` : ''}`,
          timestamp: now,
        },
      ],
    };

    if (note) {
      updated.notes.push({
        id: `note-${Date.now()}`,
        author: actor,
        content: note,
        createdAt: now,
        isInternal: true,
      });
    }

    this.tickets[index] = updated;
    return updated;
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

    const updated: SupportTicket = {
      ...existing,
      assigneeName,
      status: existing.status === 'NEW' ? 'IN_PROGRESS' : existing.status,
      updatedAt: now,
      history: [
        ...existing.history,
        {
          id: `hist-${Date.now()}`,
          actorName: actor,
          actorRole: 'SUPPORT',
          action: `Phân công xử lý vé cho: ${assigneeName}.`,
          timestamp: now,
        },
      ],
    };

    this.tickets[index] = updated;
    return updated;
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

    const updated: SupportTicket = {
      ...existing,
      updatedAt: now,
      notes: [
        ...existing.notes,
        {
          id: `note-${Date.now()}`,
          author,
          content,
          createdAt: now,
          isInternal,
        },
      ],
      history: [
        ...existing.history,
        {
          id: `hist-${Date.now()}`,
          actorName: author,
          actorRole: 'SUPPORT',
          action: isInternal
            ? `Thêm ghi chú nội bộ CSKH.`
            : `Gửi phản hồi trao đổi tới học viên.`,
          timestamp: now,
        },
      ],
    };

    this.tickets[index] = updated;
    return updated;
  }

  /**
   * C3. ESCALATION TO CONTENT MANAGER
   * Chuyển tiếp lỗi học liệu trực tiếp sang Content Manager workspace!
   */
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

    // 1. Tạo issue mới bên Content Manager
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

    // 2. Cập nhật ticket hiện tại
    const existing = this.tickets[index];
    const now = new Date().toISOString();

    const updated: SupportTicket = {
      ...existing,
      contentIssueId: createdIssue.id,
      status: 'IN_PROGRESS',
      updatedAt: now,
      notes: [
        ...existing.notes,
        {
          id: `note-${Date.now()}`,
          author: staffName,
          content: `Đã chuyển tiếp lỗi học liệu sang Content Manager với mã báo cáo [${createdIssue.id}]. Tiêu đề: "${createdIssue.title}".`,
          createdAt: now,
          isInternal: true,
        },
      ],
      history: [
        ...existing.history,
        {
          id: `hist-${Date.now()}`,
          actorName: staffName,
          actorRole: 'SUPPORT',
          action: `Chuyển tiếp báo cáo lỗi sang ban Quản lý học liệu (Mã: ${createdIssue.id}).`,
          timestamp: now,
        },
      ],
    };

    this.tickets[index] = updated;
    return { ticket: updated, contentIssueId: createdIssue.id };
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
