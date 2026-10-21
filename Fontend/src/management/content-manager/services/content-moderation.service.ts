import type {
  ModerationItem,
  ModerationStatus,
  ModerationContentType,
} from '../types/content-manager.types';
import { INITIAL_MODERATION_ITEMS } from '../data/mockContentManagerData';
import { contentAuditService } from './content-audit.service';

class ContentModerationService {
  private items: ModerationItem[] = [...INITIAL_MODERATION_ITEMS];

  resetToInitial(): void {
    this.items = [...INITIAL_MODERATION_ITEMS];
  }

  getModerationItems(filter?: {
    status?: ModerationStatus;
    contentType?: ModerationContentType;
    search?: string;
    hskLevel?: number;
  }): ModerationItem[] {
    let result = [...this.items];

    if (filter?.status) {
      result = result.filter((item) => item.status === filter.status);
    }
    if (filter?.contentType) {
      result = result.filter((item) => item.contentType === filter.contentType);
    }
    if (filter?.hskLevel) {
      result = result.filter((item) => item.hskLevel === filter.hskLevel);
    }
    if (filter?.search?.trim()) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.authorName.toLowerCase().includes(q) ||
          item.contentId.toLowerCase().includes(q) ||
          (item.previewData.hanzi && item.previewData.hanzi.toLowerCase().includes(q)) ||
          (item.previewData.pinyin && item.previewData.pinyin.toLowerCase().includes(q))
      );
    }

    return result;
  }

  getModerationItemById(id: string): ModerationItem | undefined {
    return this.items.find((item) => item.id === id);
  }

  /**
   * Phê duyệt và xuất bản bài giảng do giáo viên gửi lên
   */
  approveAndPublish(id: string, notes?: string, reviewerName = 'Nguyễn Văn Minh'): ModerationItem {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Không tìm thấy học liệu với ID: ${id}`);

    const existing = this.items[index];
    const newVersion = existing.version + 1;
    const now = new Date().toISOString();

    const updated: ModerationItem = {
      ...existing,
      status: 'PUBLISHED',
      version: newVersion,
      reviewedBy: reviewerName,
      reviewNotes: notes || 'Học liệu đã được thẩm định chuẩn kiến thức và phát hành chính thức.',
      publishedAt: now,
      updatedAt: now,
      rejectionReason: undefined,
    };

    this.items[index] = updated;

    // Log to Audit Snapshots
    contentAuditService.createSnapshot({
      contentId: updated.contentId,
      contentType: updated.contentType,
      contentTitle: updated.title,
      version: newVersion,
      status: 'PUBLISHED',
      changedBy: reviewerName,
      changedByRole: 'Quản lý học liệu',
      changeType: 'PUBLISH',
      summary: `Phê duyệt và xuất bản phiên bản v${newVersion}. Ghi chú: ${notes || 'Đạt chuẩn kiểm duyệt.'}`,
      snapshotPayload: updated.previewData,
    });

    return updated;
  }

  /**
   * Từ chối bài giảng và gửi lý do trả về cho giáo viên
   */
  rejectItem(id: string, reason: string, reviewerName = 'Nguyễn Văn Minh'): ModerationItem {
    if (!reason.trim()) throw new Error('Bắt buộc cung cấp lý do từ chối để giáo viên chỉnh sửa.');

    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Không tìm thấy học liệu với ID: ${id}`);

    const existing = this.items[index];
    const now = new Date().toISOString();

    const updated: ModerationItem = {
      ...existing,
      status: 'DRAFT',
      rejectionReason: reason,
      reviewedBy: reviewerName,
      updatedAt: now,
    };

    this.items[index] = updated;

    contentAuditService.createSnapshot({
      contentId: updated.contentId,
      contentType: updated.contentType,
      contentTitle: updated.title,
      version: updated.version,
      status: 'DRAFT',
      changedBy: reviewerName,
      changedByRole: 'Quản lý học liệu',
      changeType: 'UPDATE',
      summary: `Từ chối duyệt bài: ${reason}`,
      snapshotPayload: updated.previewData,
    });

    return updated;
  }

  /**
   * Content Manager tự tạo và tự xuất bản nội dung (không cần Admin duyệt)
   */
  selfPublish(
    payload: {
      contentId: string;
      contentType: ModerationContentType;
      title: string;
      hskLevel: number;
      previewData: ModerationItem['previewData'];
      changesSummary: string;
    },
    authorName = 'Nguyễn Văn Minh'
  ): ModerationItem {
    const now = new Date().toISOString();
    const newItem: ModerationItem = {
      id: `mod-self-${Date.now()}`,
      contentId: payload.contentId,
      contentType: payload.contentType,
      title: payload.title,
      hskLevel: payload.hskLevel,
      authorName,
      authorRole: 'CONTENT_MANAGER',
      status: 'PUBLISHED',
      priority: 'MEDIUM',
      version: 1,
      submittedAt: now,
      updatedAt: now,
      publishedAt: now,
      reviewedBy: authorName,
      reviewNotes: 'Nội dung do Content Manager tự biên soạn và trực tiếp xuất bản.',
      changesSummary: payload.changesSummary,
      previewData: payload.previewData,
    };

    this.items.unshift(newItem);

    contentAuditService.createSnapshot({
      contentId: newItem.contentId,
      contentType: newItem.contentType,
      contentTitle: newItem.title,
      version: 1,
      status: 'PUBLISHED',
      changedBy: authorName,
      changedByRole: 'Quản lý học liệu',
      changeType: 'PUBLISH',
      summary: `Tự biên soạn và xuất bản: ${payload.changesSummary}`,
      snapshotPayload: payload.previewData,
    });

    return newItem;
  }

  /**
   * Tạm thu hồi nội dung đã xuất bản về DRAFT khi phát hiện lỗi nghiêm trọng
   */
  unpublishToDraft(id: string, reason?: string, actor = 'Nguyễn Văn Minh'): ModerationItem {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Không tìm thấy học liệu với ID: ${id}`);

    const existing = this.items[index];
    const now = new Date().toISOString();

    const updated: ModerationItem = {
      ...existing,
      status: 'DRAFT',
      updatedAt: now,
      reviewNotes: reason ? `Tạm thu hồi: ${reason}` : 'Tạm thu hồi về bản nháp để hiệu chỉnh.',
    };

    this.items[index] = updated;

    contentAuditService.createSnapshot({
      contentId: updated.contentId,
      contentType: updated.contentType,
      contentTitle: updated.title,
      version: updated.version,
      status: 'DRAFT',
      changedBy: actor,
      changedByRole: 'Quản lý học liệu',
      changeType: 'UNPUBLISH',
      summary: reason ? `Thu hồi nội dung: ${reason}` : 'Thu hồi nội dung về bản nháp.',
      snapshotPayload: updated.previewData,
    });

    return updated;
  }

  /**
   * Lưu trữ học liệu (Archive)
   */
  archiveItem(id: string, reason?: string, actor = 'Nguyễn Văn Minh'): ModerationItem {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Không tìm thấy học liệu với ID: ${id}`);

    const existing = this.items[index];
    const now = new Date().toISOString();

    const updated: ModerationItem = {
      ...existing,
      status: 'ARCHIVED',
      updatedAt: now,
      rejectionReason: reason,
    };

    this.items[index] = updated;

    contentAuditService.createSnapshot({
      contentId: updated.contentId,
      contentType: updated.contentType,
      contentTitle: updated.title,
      version: updated.version,
      status: 'ARCHIVED',
      changedBy: actor,
      changedByRole: 'Quản lý học liệu',
      changeType: 'UPDATE',
      summary: reason ? `Lưu trữ học liệu: ${reason}` : 'Chuyển học liệu vào kho lưu trữ.',
      snapshotPayload: updated.previewData,
    });

    return updated;
  }

  /**
   * Khôi phục học liệu đã lưu trữ
   */
  restoreItem(id: string, actor = 'Nguyễn Văn Minh'): ModerationItem {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Không tìm thấy học liệu với ID: ${id}`);

    const existing = this.items[index];
    const now = new Date().toISOString();

    const updated: ModerationItem = {
      ...existing,
      status: 'DRAFT',
      updatedAt: now,
      rejectionReason: undefined,
    };

    this.items[index] = updated;

    contentAuditService.createSnapshot({
      contentId: updated.contentId,
      contentType: updated.contentType,
      contentTitle: updated.title,
      version: updated.version,
      status: 'DRAFT',
      changedBy: actor,
      changedByRole: 'Quản lý học liệu',
      changeType: 'RESTORE',
      summary: 'Khôi phục học liệu từ kho lưu trữ về bản nháp.',
      snapshotPayload: updated.previewData,
    });

    return updated;
  }
}

export const contentModerationService = new ContentModerationService();
