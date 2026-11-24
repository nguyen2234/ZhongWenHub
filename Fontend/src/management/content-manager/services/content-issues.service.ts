import type {
  ContentIssue,
  ContentIssueStatus,
  ContentPriority,
  ContentIssueType,
} from '../types/content-manager.types';
import { authTokenService } from '../../../core/api/client/auth-token.service';
import { contentAuditService } from './content-audit.service';

class ContentIssuesService {
  private issues: ContentIssue[] = [];

  setTestStore(issues: ContentIssue[]): void {
    this.issues = structuredClone(issues);
  }

  resetToInitial(): void {
    this.issues = [];
  }

  async getIssuesAsync(filter?: {
    status?: ContentIssueStatus;
    priority?: ContentPriority;
    issueType?: ContentIssueType;
    search?: string;
  }): Promise<ContentIssue[]> {
    if (this.issues.length > 0) {
      return this.getIssues(filter);
    }
    try {
      const base = (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1';
      const token = authTokenService.getAccessToken();
      const res = await fetch(`${base}/support/tickets?category=ContentError`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        return (data?.items || data || []).map((t: any) => ({
          id: t.id || `ISS-${t.ticketNumber}`,
          targetContentId: t.targetContentId || '',
          targetContentType: 'CURRICULUM_LESSON',
          targetContentTitle: t.title || 'Báo cáo lỗi học liệu',
          title: t.title || '',
          description: t.description || '',
          issueType: 'OTHER',
          priority: (t.priority || 'MEDIUM').toUpperCase() as ContentPriority,
          reportedBy: t.studentName || 'Học viên',
          supportStaffName: t.assignedToName || 'Bộ phận hỗ trợ',
          status: (t.status === 'Resolved' ? 'RESOLVED' : t.status === 'Closed' ? 'CLOSED' : 'NEW') as ContentIssueStatus,
          createdAt: t.createdAt || new Date().toISOString(),
          updatedAt: t.updatedAt || new Date().toISOString(),
          history: [],
        }));
      }
    } catch {
      // ignore
    }
    return [];
  }

  getIssues(filter?: {
    status?: ContentIssueStatus;
    priority?: ContentPriority;
    issueType?: ContentIssueType;
    search?: string;
  }): ContentIssue[] {
    let result = structuredClone(this.issues);

    if (filter?.status) {
      result = result.filter((issue) => issue.status === filter.status);
    }
    if (filter?.priority) {
      result = result.filter((issue) => issue.priority === filter.priority);
    }
    if (filter?.issueType) {
      result = result.filter((issue) => issue.issueType === filter.issueType);
    }
    if (filter?.search?.trim()) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(
        (issue) =>
          issue.id.toLowerCase().includes(q) ||
          issue.title.toLowerCase().includes(q) ||
          issue.description.toLowerCase().includes(q) ||
          issue.targetContentTitle.toLowerCase().includes(q) ||
          issue.reportedBy.toLowerCase().includes(q) ||
          issue.supportStaffName.toLowerCase().includes(q)
      );
    }

    return result;
  }

  getIssueById(id: string): ContentIssue | undefined {
    const issue = this.issues.find((issue) => issue.id === id);
    return issue ? structuredClone(issue) : undefined;
  }

  /**
   * Phân công Content Manager phụ trách xử lý
   */
  assignToContentManager(
    issueId: string,
    cmName = 'Nguyễn Văn Minh (Content Manager)',
    actor = 'Nguyễn Văn Minh'
  ): ContentIssue {
    const index = this.issues.findIndex((i) => i.id === issueId);
    if (index === -1) throw new Error(`Không tìm thấy báo cáo lỗi: ${issueId}`);

    const existing = this.issues[index];
    const now = new Date().toISOString();

    const updated: ContentIssue = {
      ...existing,
      contentManagerId: 'cm-001',
      contentManagerName: cmName,
      status: existing.status === 'NEW' ? 'TRIAGED' : existing.status,
      updatedAt: now,
      history: [
        ...existing.history.map((h) => ({ ...h })),
        {
          id: `act-${Date.now()}`,
          actorName: actor,
          actorRole: 'CONTENT_MANAGER',
          action: `Tiếp nhận phụ trách xử lý báo cáo lỗi: ${cmName}.`,
          timestamp: now,
        },
      ],
    };

    this.issues[index] = updated;
    return structuredClone(updated);
  }

  /**
   * Cập nhật trạng thái chu trình xử lý (NEW -> TRIAGED -> IN_PROGRESS -> RESOLVED -> CLOSED)
   */
  updateStatus(
    issueId: string,
    newStatus: ContentIssueStatus,
    actor = 'Nguyễn Văn Minh',
    notes?: string
  ): ContentIssue {
    const index = this.issues.findIndex((i) => i.id === issueId);
    if (index === -1) throw new Error(`Không tìm thấy báo cáo lỗi: ${issueId}`);

    const existing = this.issues[index];
    const now = new Date().toISOString();

    const updated: ContentIssue = {
      ...existing,
      status: newStatus,
      updatedAt: now,
      history: [
        ...existing.history.map((h) => ({ ...h })),
        {
          id: `act-${Date.now()}`,
          actorName: actor,
          actorRole: 'CONTENT_MANAGER',
          action: `Chuyển trạng thái sang [${newStatus}]. ${notes ? `Ghi chú: ${notes}` : ''}`,
          timestamp: now,
        },
      ],
    };

    this.issues[index] = updated;
    return structuredClone(updated);
  }

  /**
   * Xử lý hoàn tất lỗi, xuất bản bản vá mới và gửi phản hồi về cho Support
   */
  resolveIssue(
    issueId: string,
    resolutionNotes: string,
    feedbackToSupport: string,
    actor = 'Nguyễn Văn Minh'
  ): ContentIssue {
    if (!resolutionNotes.trim()) throw new Error('Bắt buộc nhập ghi chú xử lý kỹ thuật.');
    if (!feedbackToSupport.trim()) throw new Error('Bắt buộc nhập phản hồi giải thích cho bộ phận Support.');

    const index = this.issues.findIndex((i) => i.id === issueId);
    if (index === -1) throw new Error(`Không tìm thấy báo cáo lỗi: ${issueId}`);

    const existing = this.issues[index];
    const now = new Date().toISOString();
    const newVersion = (existing.resolutionVersion || 1) + 1;

    const updated: ContentIssue = {
      ...existing,
      status: 'RESOLVED',
      updatedAt: now,
      resolvedAt: now,
      resolutionNotes,
      feedbackToSupport,
      resolutionVersion: newVersion,
      isOverdue: false,
      history: [
        ...existing.history.map((h) => ({ ...h })),
        {
          id: `act-${Date.now()}`,
          actorName: actor,
          actorRole: 'CONTENT_MANAGER',
          action: `Đã xử lý xong lỗi và xuất bản phiên bản vá v${newVersion}. Gửi phản hồi về Support: "${feedbackToSupport}"`,
          timestamp: now,
        },
      ],
    };

    this.issues[index] = updated;

    contentAuditService.createSnapshot({
      contentId: existing.targetContentId,
      contentType: existing.targetContentType,
      contentTitle: existing.targetContentTitle,
      version: newVersion,
      status: 'PUBLISHED',
      changedBy: actor,
      changedByRole: 'Quản lý học liệu',
      changeType: 'ISSUE_FIX',
      summary: `Xử lý báo cáo lỗi [${existing.id}]: ${resolutionNotes}`,
      snapshotPayload: {
        issueId: existing.id,
        issueType: existing.issueType,
        feedback: feedbackToSupport,
      },
    });

    return structuredClone(updated);
  }

  /**
   * Support hoặc Học viên mở lại issue khi lỗi vẫn tái diễn
   */
  reopenIssue(issueId: string, reason: string, actor = 'Trần Thuỳ Trang (Support)'): ContentIssue {
    if (!reason.trim()) throw new Error('Bắt buộc nhập lý do mở lại báo cáo lỗi.');

    const index = this.issues.findIndex((i) => i.id === issueId);
    if (index === -1) throw new Error(`Không tìm thấy báo cáo lỗi: ${issueId}`);

    const existing = this.issues[index];
    const now = new Date().toISOString();

    const updated: ContentIssue = {
      ...existing,
      status: 'REOPENED',
      updatedAt: now,
      history: [
        ...existing.history.map((h) => ({ ...h })),
        {
          id: `act-${Date.now()}`,
          actorName: actor,
          actorRole: 'SUPPORT',
          action: `Mở lại báo cáo lỗi. Lý do: ${reason}`,
          timestamp: now,
        },
      ],
    };

    this.issues[index] = updated;
    return structuredClone(updated);
  }

  /**
   * Tiếp nhận phản ánh mới từ học viên qua bộ phận Support
   */
  createIssue(data: {
    targetContentId: string;
    targetContentType: ContentIssue['targetContentType'];
    targetContentTitle: string;
    targetContentRoute?: string;
    title: string;
    description: string;
    issueType: ContentIssueType;
    priority: ContentPriority;
    reportedBy: string;
    supportStaffId?: string;
    supportStaffName: string;
  }): ContentIssue {
    const now = new Date().toISOString();
    const newIssue: ContentIssue = {
      id: `ISS-${Math.floor(1000 + Math.random() * 9000)}`,
      ...data,
      targetContentRoute: data.targetContentRoute || '/management/content-manager/issues',
      supportStaffId: data.supportStaffId || 'sup-001',
      status: 'NEW',
      createdAt: now,
      updatedAt: now,
      history: [
        {
          id: `act-${Date.now()}`,
          actorName: data.supportStaffName,
          actorRole: 'SUPPORT',
          action: `Tiếp nhận phản ánh từ học viên "${data.reportedBy}" và tạo báo cáo lỗi học liệu.`,
          timestamp: now,
        },
      ],
    };
    this.issues.unshift(newIssue);
    return structuredClone(newIssue);
  }

  /**
   * Thống kê số lượng theo trạng thái
   */
  getCountsByStatus(): Record<ContentIssueStatus | 'ALL', number> {
    const counts: Record<ContentIssueStatus | 'ALL', number> = {
      ALL: this.issues.length,
      NEW: 0,
      TRIAGED: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
      REOPENED: 0,
    };
    for (const issue of this.issues) {
      if (counts[issue.status] !== undefined) {
        counts[issue.status]++;
      }
    }
    return counts;
  }

  /**
   * Đóng hoàn toàn issue sau khi học viên xác nhận hài lòng
   */
  closeIssue(issueId: string, actor = 'Trần Thuỳ Trang (Support)'): ContentIssue {
    const index = this.issues.findIndex((i) => i.id === issueId);
    if (index === -1) throw new Error(`Không tìm thấy báo cáo lỗi: ${issueId}`);

    const existing = this.issues[index];
    const now = new Date().toISOString();

    const updated: ContentIssue = {
      ...existing,
      status: 'CLOSED',
      updatedAt: now,
      closedAt: now,
      history: [
        ...existing.history.map((h) => ({ ...h })),
        {
          id: `act-${Date.now()}`,
          actorName: actor,
          actorRole: 'SUPPORT',
          action: 'Đã thông báo cho học viên và đóng ticket hỗ trợ thành công.',
          timestamp: now,
        },
      ],
    };

    this.issues[index] = updated;
    return structuredClone(updated);
  }
}

export const contentIssuesService = new ContentIssuesService();
