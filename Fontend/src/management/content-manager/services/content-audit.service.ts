import type {
  VersionSnapshot,
  QualityMetrics,
} from '../types/content-manager.types';
import { authTokenService } from '../../../core/api/client/auth-token.service';

const DEFAULT_METRICS: QualityMetrics = {
  totalItems: 0,
  pendingReviewCount: 0,
  publishedCount: 0,
  archivedCount: 0,
  newIssuesCount: 0,
  inProgressIssuesCount: 0,
  overdueIssuesCount: 0,
  resolvedIssuesCount: 0,
  accuracyRate: 100,
  avgResolutionHours: 0,
  hskDistribution: [],
};

class ContentAuditService {
  private snapshots: VersionSnapshot[] = [];
  private metrics: QualityMetrics = { ...DEFAULT_METRICS };

  setTestStore(snapshots: VersionSnapshot[], metrics?: QualityMetrics): void {
    this.snapshots = [...snapshots];
    if (metrics) this.metrics = { ...metrics };
  }

  resetToInitial(): void {
    this.snapshots = [];
    this.metrics = { ...DEFAULT_METRICS };
  }

  async getQualityMetricsAsync(): Promise<QualityMetrics> {
    try {
      const base = (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1';
      const token = authTokenService.getAccessToken();
      const res = await fetch(`${base}/admin/dashboard/stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const stats = await res.json();
        return {
          totalItems: (stats.totalLessons || 0) + (stats.totalQuestions || 0),
          pendingReviewCount: stats.pendingModerationCount || 0,
          publishedCount: stats.totalLessons || stats.publishedCount || 0,
          archivedCount: 0,
          newIssuesCount: stats.openTicketsCount || 0,
          inProgressIssuesCount: 0,
          overdueIssuesCount: 0,
          resolvedIssuesCount: 0,
          accuracyRate: 98.4,
          avgResolutionHours: 12,
          hskDistribution: [],
        };
      }
    } catch {
      // ignore
    }
    return { ...this.metrics };
  }

  getVersionSnapshots(contentId?: string): VersionSnapshot[] {
    if (!contentId) return [...this.snapshots];
    return this.snapshots.filter((s) => s.contentId === contentId);
  }

  getSnapshotById(id: string): VersionSnapshot | undefined {
    return this.snapshots.find((s) => s.id === id);
  }

  createSnapshot(
    snapshot: Omit<VersionSnapshot, 'id' | 'timestamp'>
  ): VersionSnapshot {
    const newSnapshot: VersionSnapshot = {
      ...snapshot,
      id: `snap-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.snapshots.unshift(newSnapshot);
    return newSnapshot;
  }

  restoreVersion(
    contentId: string,
    targetVersion: number,
    actor = 'Nguyễn Văn Minh'
  ): VersionSnapshot {
    const historical = this.snapshots.find(
      (s) => s.contentId === contentId && s.version === targetVersion
    );
    if (!historical) {
      throw new Error(`Không tìm thấy phiên bản v${targetVersion} của học liệu ${contentId}`);
    }

    // Determine highest version + 1
    const existingSnapshots = this.snapshots.filter((s) => s.contentId === contentId);
    const highestVersion = Math.max(...existingSnapshots.map((s) => s.version), 1);
    const restoredVersion = highestVersion + 1;

    const restoredSnapshot: VersionSnapshot = {
      id: `snap-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      contentId,
      contentType: historical.contentType,
      contentTitle: historical.contentTitle,
      version: restoredVersion,
      status: 'PUBLISHED',
      changedBy: actor,
      changedByRole: 'Quản lý học liệu',
      changeType: 'RESTORE',
      summary: `Khôi phục nội dung từ phiên bản v${targetVersion} thành phiên bản phát hành v${restoredVersion}.`,
      timestamp: new Date().toISOString(),
      snapshotPayload: { ...historical.snapshotPayload },
    };

    this.snapshots.unshift(restoredSnapshot);
    return restoredSnapshot;
  }

  getQualityMetrics(): QualityMetrics {
    return { ...this.metrics };
  }
}

export const contentAuditService = new ContentAuditService();
