// @ts-ignore
import { describe, it, expect, beforeEach } from 'bun:test';
import type { UserRole } from '../types/roles';
import { ROLE_DEFAULT_PATHS } from '../types/roles';
import { adminRolePermissionService } from '../management/admin/roles/services/role-permission.service';
import { contentModerationService } from '../management/content-manager/services/content-moderation.service';
import { contentIssuesService } from '../management/content-manager/services/content-issues.service';
import { contentAuditService } from '../management/content-manager/services/content-audit.service';

describe('Phase FE-12: Content Manager Workspace & Moderation Architecture', () => {
  beforeEach(() => {
    // Reset service state before each test
    contentModerationService.resetToInitial();
    contentIssuesService.resetToInitial();
    contentAuditService.resetToInitial();
  });

  describe('1. Role & Permission System Alignment', () => {
    it('defines CONTENT_MANAGER in UserRole type and default path config', () => {
      const cmRole: UserRole = 'CONTENT_MANAGER';
      expect(cmRole).toBe('CONTENT_MANAGER');
      expect(ROLE_DEFAULT_PATHS.CONTENT_MANAGER).toBe('/management/content-manager/dashboard');
    });

    it('provisions CONTENT_MANAGER with comprehensive moderation permissions', () => {
      const cmRole = adminRolePermissionService.getRoleByCode('CONTENT_MANAGER');
      expect(cmRole).toBeDefined();
      expect(cmRole?.code).toBe('CONTENT_MANAGER');

      const permissions = cmRole?.permissions || [];
      const required = [
        'CONTENT_VIEW',
        'CONTENT_CREATE',
        'CONTENT_UPDATE',
        'CONTENT_APPROVE',
        'CONTENT_PUBLISH',
        'CONTENT_ARCHIVE',
        'CONTENT_RESTORE',
        'QUESTION_BANK_VIEW',
        'QUESTION_BANK_CREATE',
        'QUESTION_BANK_UPDATE',
        'CONTENT_ISSUE_VIEW',
        'CONTENT_ISSUE_ASSIGN',
        'CONTENT_ISSUE_RESOLVE',
        'CONTENT_AUDIT_VIEW',
        'CONTENT_REPORT_VIEW',
      ];

      for (const p of required) {
        expect(permissions).toContain(p);
      }

      // Security rule: CONTENT_MANAGER does not have permanent CONTENT_DELETE by default
      expect(permissions).not.toContain('CONTENT_DELETE');
    });

    it('enforces that TEACHER cannot approve or publish content directly', () => {
      const teacherRole = adminRolePermissionService.getRoleByCode('TEACHER');
      expect(teacherRole).toBeDefined();
      expect(teacherRole?.permissions).not.toContain('CONTENT_APPROVE');
      expect(teacherRole?.permissions).not.toContain('CONTENT_PUBLISH');
      expect(teacherRole?.permissions).toContain('CONTENT_CREATE');
      expect(teacherRole?.permissions).toContain('CONTENT_UPDATE');
    });
  });

  describe('2. Content Moderation Lifecycle & Self-Publishing', () => {
    it('loads initial moderation items with realistic states', () => {
      const items = contentModerationService.getModerationItems();
      expect(items.length).toBeGreaterThanOrEqual(5);

      const pending = items.filter((i) => i.status === 'PENDING_REVIEW');
      expect(pending.length).toBeGreaterThan(0);
    });

    it('allows Content Manager to approve a pending item to PUBLISHED', () => {
      const pendingItems = contentModerationService.getModerationItems({ status: 'PENDING_REVIEW' });
      const target = pendingItems[0];
      expect(target).toBeDefined();

      const updated = contentModerationService.approveAndPublish(
        target.id,
        'Kiểm tra đạt chuẩn HSK 3: Hán tự, Pinyin và giải nghĩa tiếng Việt chuẩn xác',
        'CM Nguyễn Văn Minh'
      );

      expect(updated).not.toBeNull();
      expect(updated.status).toBe('PUBLISHED');
      expect(updated.reviewedBy).toBe('CM Nguyễn Văn Minh');
      expect(updated.publishedAt).toBeDefined();

      // Verify audit log registered
      const snapshots = contentAuditService.getVersionSnapshots();
      const snap = snapshots.find((s) => s.contentId === target.contentId && s.changeType === 'PUBLISH');
      expect(snap).toBeDefined();
    });

    it('allows Content Manager to reject a pending item with review notes', () => {
      const pendingItems = contentModerationService.getModerationItems({ status: 'PENDING_REVIEW' });
      const target = pendingItems[0];

      const rejected = contentModerationService.rejectItem(
        target.id,
        'Sai phiên âm Pinyin ở ví dụ số 2, vui lòng điều chỉnh theo quy chuẩn HSK 2',
        'CM Trần Thị B'
      );

      expect(rejected).not.toBeNull();
      expect(rejected.status).toBe('DRAFT');
      expect(rejected.rejectionReason).toContain('Sai phiên âm Pinyin');
    });

    it('allows Content Manager to self-publish new valid content directly', () => {
      const newItem = contentModerationService.selfPublish(
        {
          contentId: 'GM-HSK4-099',
          contentType: 'GRAMMAR_POINT',
          title: 'Ngữ pháp HSK 4: Câu chữ 把 (bǎ) nâng cao',
          hskLevel: 4,
          changesSummary: 'Soạn thảo và xuất bản trực tiếp câu chữ 把 hoàn chỉnh kèm bài tập',
          previewData: {
            title: 'Ngữ pháp HSK 4: Câu chữ 把 (bǎ) nâng cao',
            structure: 'Chủ ngữ + 把 + Tân ngữ + Động từ + Thành phần khác',
            examples: [
              {
                chinese: '请把这本书给他。',
                pinyin: 'Qǐng bǎ zhè běn shū gěi tā.',
                vietnamese: 'Xin hãy đưa quyển sách này cho anh ấy.',
              },
            ],
          },
        },
        'CM Nguyễn Văn Minh'
      );

      expect(newItem.status).toBe('PUBLISHED');
      expect(newItem.authorRole).toBe('CONTENT_MANAGER');
      expect(newItem.version).toBe(1);

      // Verify in item list
      const retrieved = contentModerationService.getModerationItemById(newItem.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.status).toBe('PUBLISHED');
    });

    it('allows Content Manager to unpublish active content back to DRAFT', () => {
      const published = contentModerationService.getModerationItems({ status: 'PUBLISHED' })[0];
      expect(published).toBeDefined();

      const unpublished = contentModerationService.unpublishToDraft(
        published.id,
        'Phát hiện lỗi câu hỏi trắc nghiệm, tạm thu hồi để chỉnh sửa',
        'CM Nguyễn Văn Minh'
      );

      expect(unpublished).not.toBeNull();
      expect(unpublished.status).toBe('DRAFT');
    });

    it('supports archiving and restoring content', () => {
      const item = contentModerationService.getModerationItems()[0];
      const archived = contentModerationService.archiveItem(item.id, 'Học liệu phiên bản 2024 cũ', 'CM Nguyễn Văn Minh');
      expect(archived.status).toBe('ARCHIVED');

      const restored = contentModerationService.restoreItem(item.id, 'CM Nguyễn Văn Minh');
      expect(restored.status).toBe('DRAFT');
    });
  });

  describe('3. Support Content Issue Workflow & Resolution Loop', () => {
    it('initializes realistic content issues with proper metadata', () => {
      const issues = contentIssuesService.getIssues();
      expect(issues.length).toBeGreaterThanOrEqual(4);

      const newIssue = issues.find((i) => i.status === 'NEW');
      expect(newIssue).toBeDefined();
      expect(newIssue?.id).toMatch(/^ISS-/);
      expect(newIssue?.issueType).toBeDefined();
      expect(newIssue?.priority).toBeDefined();
    });

    it('supports full lifecycle: NEW -> TRIAGED -> IN_PROGRESS -> RESOLVED -> CLOSED', () => {
      // 1. Create issue from Support
      const issue = contentIssuesService.createIssue({
        targetContentId: 'VOCAB-HSK2-001',
        targetContentType: 'HSK_CHARACTER',
        targetContentTitle: 'Từ vựng: 觉得 (juéde)',
        title: 'Phát âm audio bị rè',
        description: 'Học viên lớp HSK2 phản ánh file audio từ vựng juéde bị đứt đoạn ở giây thứ 2',
        issueType: 'AUDIO_ERROR',
        priority: 'HIGH',
        reportedBy: 'Học viên Nguyễn Linh (Mã HV: 2049)',
        supportStaffName: 'Support Hoàng Long',
      });

      expect(issue.status).toBe('NEW');

      // 2. Triage & Assign to Content Manager
      const assigned = contentIssuesService.assignToContentManager(
        issue.id,
        'Vũ Mai (Content Manager)',
        'Hoàng Long (Support)'
      );
      expect(assigned.status).toBe('TRIAGED');
      expect(assigned.contentManagerName).toContain('Vũ Mai');

      // 3. CM Moves to In Progress
      const inProgress = contentIssuesService.updateStatus(
        issue.id,
        'IN_PROGRESS',
        'Vũ Mai',
        'Đang thu âm lại file audio chất lượng cao'
      );
      expect(inProgress.status).toBe('IN_PROGRESS');

      // 4. Resolve with feedback loop
      const resolved = contentIssuesService.resolveIssue(
        issue.id,
        'Đã thay thế file mp3 chất lượng 320kbps thu chuẩn Bắc Kinh và cập nhật bản sao v2',
        'File âm thanh từ vựng juéde đã được làm mới hoàn toàn. Học viên có thể nghe rõ ràng bình thường.',
        'Vũ Mai'
      );
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolvedAt).toBeDefined();
      expect(resolved.resolutionNotes).toContain('320kbps');
      expect(resolved.feedbackToSupport).toContain('Học viên có thể nghe rõ ràng');

      // 5. Support closes the issue
      const closed = contentIssuesService.closeIssue(issue.id, 'Hoàng Long (Support)');
      expect(closed.status).toBe('CLOSED');
      expect(closed.closedAt).toBeDefined();
    });

    it('allows reopening an issue if student reports problem still persists', () => {
      const resolved = contentIssuesService.getIssues().find((i) => i.status === 'RESOLVED');
      expect(resolved).toBeDefined();

      if (resolved) {
        const reopened = contentIssuesService.reopenIssue(
          resolved.id,
          'Học viên trên thiết bị Android vẫn còn nghe tiếng rè',
          'Hoàng Long (Support)'
        );
        expect(reopened.status).toBe('REOPENED');
        expect(reopened.history.some((h) => h.action.includes('thiết bị Android'))).toBe(true);
      }
    });

    it('computes issue counts by status accurately', () => {
      const counts = contentIssuesService.getCountsByStatus();
      expect(counts.ALL).toBeGreaterThan(0);
      expect(counts.NEW + counts.IN_PROGRESS + counts.RESOLVED + counts.CLOSED).toBeLessThanOrEqual(counts.ALL);
    });
  });

  describe('4. Version Audit History & Rollback Safety', () => {
    it('maintains immutable audit snapshots of published content', () => {
      const snapshots = contentAuditService.getVersionSnapshots();
      expect(snapshots.length).toBeGreaterThanOrEqual(4);

      for (const snap of snapshots) {
        expect(snap.id).toBeDefined();
        expect(snap.contentId).toBeDefined();
        expect(snap.version).toBeGreaterThan(0);
        expect(snap.changedBy).toBeDefined();
        expect(snap.snapshotPayload).toBeDefined();
      }
    });

    it('enables version rollback to previous stable state', () => {
      const snapshots = contentAuditService.getVersionSnapshots();
      const target = snapshots[0];

      const restored = contentAuditService.restoreVersion(target.contentId, target.version);
      expect(restored).not.toBeNull();
      expect(restored.changeType).toBe('RESTORE');
      expect(restored.contentId).toBe(target.contentId);
      expect(restored.summary).toContain(`Khôi phục nội dung từ phiên bản v${target.version}`);
    });

    it('calculates edtech quality and HSK metrics accurately', () => {
      const metrics = contentAuditService.getQualityMetrics();
      expect(metrics.totalItems).toBeGreaterThan(0);
      expect(metrics.accuracyRate).toBeGreaterThanOrEqual(90);
      expect(metrics.hskDistribution.length).toBeGreaterThanOrEqual(6);
      expect(metrics.avgResolutionHours).toBeGreaterThan(0);
    });
  });
});
