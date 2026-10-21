import type {
  VersionSnapshot,
  QualityMetrics,
} from '../types/content-manager.types';
import {
  INITIAL_VERSION_SNAPSHOTS,
  INITIAL_QUALITY_METRICS,
} from '../data/mockContentManagerData';

class ContentAuditService {
  private snapshots: VersionSnapshot[] = [...INITIAL_VERSION_SNAPSHOTS];
  private metrics: QualityMetrics = { ...INITIAL_QUALITY_METRICS };

  resetToInitial(): void {
    this.snapshots = [...INITIAL_VERSION_SNAPSHOTS];
    this.metrics = { ...INITIAL_QUALITY_METRICS };
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
