import type {
  ContentIssue,
  ContentIssueStatus,
  ContentPriority,
  ContentIssueType,
} from '../types/content-manager.types';
import { INITIAL_CONTENT_ISSUES } from '../data/mockContentManagerData';
import { contentAuditService } from './content-audit.service';
import { getApiUrl } from '../../../core/api/client/api-config';
import { authTokenService } from '../../../core/api/client/auth-token.service';

function isIsolatedTestRuntime(): boolean {
  const procEnv = typeof globalThis !== 'undefined' ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env : undefined;
  return Boolean(
    procEnv?.VITEST ||
    procEnv?.BUN_TEST ||
    procEnv?.NODE_ENV === 'test' ||
    import.meta.env?.MODE === 'test'
  );
}

function getAuthHeaders(): HeadersInit {
  const token = authTokenService.getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function mapBackendIssue(item: any): ContentIssue {
  return {
    id: item.issueCode || item.id,
    backendGuid: item.id,
    title: item.title,
    description: item.description,
    issueType: item.issueType as ContentIssueType,
    priority: item.priority as ContentPriority,
    targetContentId: item.targetContentId,
    targetContentType: item.targetContentType,
    targetContentTitle: item.targetContentTitle,
    targetContentRoute: item.targetContentRoute || '/management/content-manager/issues',
    reportedBy: item.reportedBy,
    supportStaffId: 'sup-001',
    supportStaffName: item.supportStaffName || 'Support Staff',
    contentManagerId: item.contentManagerId,
    contentManagerName: item.contentManagerName,
    status: item.status as ContentIssueStatus,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    resolvedAt: item.resolvedAt,
    closedAt: item.closedAt,
    resolutionNotes: item.resolutionNotes,
    feedbackToSupport: item.feedbackToSupport,
    history: Array.isArray(item.history)
      ? item.history.map((h: any) => ({
          id: h.id || `act-${Date.now()}`,
          actorName: h.actorName,
          actorRole: h.actorRole,
          action: h.action,
          timestamp: h.timestamp || item.updatedAt,
          message: h.message,
        }))
      : [],
  };
}

class ContentIssuesService {
  private issues: ContentIssue[] = isIsolatedTestRuntime() ? structuredClone(INITIAL_CONTENT_ISSUES) : [];
  private hasSynced = false;

  resetToInitial(): void {
    this.issues = structuredClone(INITIAL_CONTENT_ISSUES);
    this.hasSynced = false;
  }

  public get isSynced(): boolean {
    return this.hasSynced;
  }

  private resolveIssueGuid(id: string): string {
    const issue = this.issues.find((i) => i.id === id || i.backendGuid === id);
    if (issue?.backendGuid) return issue.backendGuid;
    return id;
  }

  async syncFromBackend(): Promise<void> {
    if (isIsolatedTestRuntime()) return;
    try {
      const res = await fetch(getApiUrl('content-manager/issues'), {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          if (data.length === 0) {
            this.issues = [];
          } else {
            this.issues = data.map(mapBackendIssue);
          }
          this.hasSynced = true;
        }
      }
    } catch {
      // Keep existing memory issues on network error
    }
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
  ): Promise<ContentIssue> | ContentIssue {
    if (isIsolatedTestRuntime()) {
      return this.assignToContentManagerInMemory(issueId, cmName, actor);
    }
    return this.assignToContentManagerAsync(issueId, cmName, actor);
  }

  public async assignToContentManagerAsync(
    issueId: string,
    cmName = 'Nguyễn Văn Minh (Content Manager)',
    _actor = 'Nguyễn Văn Minh'
  ): Promise<ContentIssue> {
    const guid = this.resolveIssueGuid(issueId);
    const res = await fetch(getApiUrl(`content-manager/issues/${guid}/assign`), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ contentManagerName: cmName }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || err?.message || `Tiếp nhận xử lý lỗi thất bại (HTTP ${res.status}).`);
    }

    const data = await res.json();
    const mapped = mapBackendIssue(data);
    const index = this.issues.findIndex((i) => i.id === issueId || i.backendGuid === guid);
    if (index !== -1) {
      this.issues[index] = mapped;
    } else {
      this.issues.unshift(mapped);
    }
    return structuredClone(mapped);
  }

  private assignToContentManagerInMemory(
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
  ): Promise<ContentIssue> | ContentIssue {
    if (isIsolatedTestRuntime()) {
      return this.resolveIssueInMemory(issueId, resolutionNotes, feedbackToSupport, actor);
    }
    return this.resolveIssueAsync(issueId, resolutionNotes, feedbackToSupport, actor);
  }

  public async resolveIssueAsync(
    issueId: string,
    resolutionNotes: string,
    feedbackToSupport: string,
    _actor = 'Nguyễn Văn Minh'
  ): Promise<ContentIssue> {
    if (!resolutionNotes.trim()) throw new Error('Bắt buộc nhập ghi chú xử lý kỹ thuật.');
    if (!feedbackToSupport.trim()) throw new Error('Bắt buộc nhập phản hồi giải thích cho bộ phận Support.');

    const guid = this.resolveIssueGuid(issueId);
    const res = await fetch(getApiUrl(`content-manager/issues/${guid}/resolve`), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ notes: resolutionNotes, feedback: feedbackToSupport }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || err?.message || `Khắc phục lỗi học liệu thất bại (HTTP ${res.status}).`);
    }

    const data = await res.json();
    const mapped = mapBackendIssue(data);
    const index = this.issues.findIndex((i) => i.id === issueId || i.backendGuid === guid);
    if (index !== -1) {
      this.issues[index] = mapped;
    } else {
      this.issues.unshift(mapped);
    }
    return structuredClone(mapped);
  }

  private resolveIssueInMemory(
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
  reopenIssue(issueId: string, reason: string, actor = 'Trần Thuỳ Trang (Support)'): Promise<ContentIssue> | ContentIssue {
    if (isIsolatedTestRuntime()) {
      return this.reopenIssueInMemory(issueId, reason, actor);
    }
    return this.reopenIssueAsync(issueId, reason, actor);
  }

  public async reopenIssueAsync(issueId: string, reason: string, _actor = 'Trần Thuỳ Trang (Support)'): Promise<ContentIssue> {
    if (!reason.trim()) throw new Error('Bắt buộc nhập lý do mở lại báo cáo lỗi.');

    const guid = this.resolveIssueGuid(issueId);
    const res = await fetch(getApiUrl(`content-manager/issues/${guid}/reopen`), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || err?.message || `Mở lại báo cáo lỗi thất bại (HTTP ${res.status}).`);
    }

    const data = await res.json();
    const mapped = mapBackendIssue(data);
    const index = this.issues.findIndex((i) => i.id === issueId || i.backendGuid === guid);
    if (index !== -1) {
      this.issues[index] = mapped;
    } else {
      this.issues.unshift(mapped);
    }
    return structuredClone(mapped);
  }

  private reopenIssueInMemory(issueId: string, reason: string, actor = 'Trần Thuỳ Trang (Support)'): ContentIssue {
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
    supportTicketId?: string;
  }): Promise<ContentIssue> | ContentIssue {
    if (isIsolatedTestRuntime()) {
      return this.createIssueInMemory(data);
    }
    return this.createIssueAsync(data);
  }

  public async createIssueAsync(data: {
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
    supportTicketId?: string;
  }): Promise<ContentIssue> {
    const res = await fetch(getApiUrl('content-manager/issues'), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        issueType: data.issueType,
        priority: data.priority,
        targetContentId: data.targetContentId,
        targetContentType: data.targetContentType,
        targetContentTitle: data.targetContentTitle,
        targetContentRoute: data.targetContentRoute,
        reportedBy: data.reportedBy,
        supportTicketId: data.supportTicketId,
        supportStaffName: data.supportStaffName,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || err?.message || `Tạo báo cáo lỗi học liệu thất bại (HTTP ${res.status}).`);
    }

    const createdDto = await res.json();
    const mapped = mapBackendIssue(createdDto);
    this.issues.unshift(mapped);
    return structuredClone(mapped);
  }

  private createIssueInMemory(data: {
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
  closeIssue(issueId: string, actor = 'Trần Thuỳ Trang (Support)'): Promise<ContentIssue> | ContentIssue {
    if (isIsolatedTestRuntime()) {
      return this.closeIssueInMemory(issueId, actor);
    }
    return this.closeIssueAsync(issueId, actor);
  }

  public async closeIssueAsync(issueId: string, _actor = 'Trần Thuỳ Trang (Support)'): Promise<ContentIssue> {
    const guid = this.resolveIssueGuid(issueId);
    const res = await fetch(getApiUrl(`content-manager/issues/${guid}/close`), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || err?.message || `Đóng báo cáo lỗi thất bại (HTTP ${res.status}).`);
    }

    const data = await res.json();
    const mapped = mapBackendIssue(data);
    const index = this.issues.findIndex((i) => i.id === issueId || i.backendGuid === guid);
    if (index !== -1) {
      this.issues[index] = mapped;
    } else {
      this.issues.unshift(mapped);
    }
    return structuredClone(mapped);
  }

  private closeIssueInMemory(issueId: string, actor = 'Trần Thuỳ Trang (Support)'): ContentIssue {
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
