import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { contentModerationService } from '../services/content-moderation.service';
import { contentIssuesService } from '../services/content-issues.service';
import { contentAuditService } from '../services/content-audit.service';
import { ModerationBadge } from '../components/ModerationBadge';
import { IssueStatusBadge } from '../components/IssueStatusBadge';
import { ContentPreviewDrawer } from '../components/ContentPreviewDrawer';
import { IssueDetailDrawer } from '../components/IssueDetailDrawer';
import { SelfPublishModal } from '../components/SelfPublishModal';
import type { ModerationItem, ContentIssue } from '../types/content-manager.types';
import '../components/content-manager.css';

export const ContentManagerDashboardPage: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedModItem, setSelectedModItem] = useState<ModerationItem | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<ContentIssue | null>(null);
  const [isSelfPublishOpen, setIsSelfPublishOpen] = useState(false);

  // Load metrics & active items
  const metrics = useMemo(() => {
    return contentAuditService.getQualityMetrics();
  }, [refreshKey]);

  const pendingModerationItems = useMemo(() => {
    return contentModerationService.getModerationItems({ status: 'PENDING_REVIEW' }).slice(0, 5);
  }, [refreshKey]);

  const urgentIssues = useMemo(() => {
    return contentIssuesService.getIssues().filter((i) => i.status !== 'CLOSED').slice(0, 5);
  }, [refreshKey]);

  const handleApprovePublish = (item: ModerationItem, notes: string) => {
    contentModerationService.approveAndPublish(item.id, notes);
    setSelectedModItem(null);
    setRefreshKey((k) => k + 1);
  };

  const handleReject = (item: ModerationItem, reason: string) => {
    contentModerationService.rejectItem(item.id, reason);
    setSelectedModItem(null);
    setRefreshKey((k) => k + 1);
  };

  const handleUnpublish = (item: ModerationItem, reason: string) => {
    contentModerationService.unpublishToDraft(item.id, reason);
    setSelectedModItem(null);
    setRefreshKey((k) => k + 1);
  };

  const handleResolveIssue = (issueId: string, notes: string, feedback: string) => {
    contentIssuesService.resolveIssue(issueId, notes, feedback);
    setSelectedIssue(null);
    setRefreshKey((k) => k + 1);
  };

  const handleAssignIssue = (issueId: string) => {
    contentIssuesService.assignToContentManager(issueId);
    setRefreshKey((k) => k + 1);
    if (selectedIssue) {
      setSelectedIssue(contentIssuesService.getIssueById(issueId) || null);
    }
  };

  return (
    <div className="cm-container">
      {/* 1. Header Row */}
      <div className="cm-header-row">
        <div className="cm-title-group">
          <h1 className="cm-page-title">Không gian Quản lý học liệu & Kiểm duyệt</h1>
          <p className="cm-page-subtitle">
            Giám sát kho HSK, tự xuất bản nội dung, duyệt bài giáo viên và xử lý báo cáo lỗi từ Support.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="cm-btn cm-btn-secondary cm-btn-sm"
            onClick={() => setRefreshKey((k) => k + 1)}
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={14} />
            Làm mới
          </button>
          <button
            type="button"
            className="cm-btn cm-btn-primary"
            onClick={() => setIsSelfPublishOpen(true)}
          >
            <Plus size={16} />
            Tự xuất bản học liệu
          </button>
        </div>
      </div>

      {/* 2. Priority Action Banner (Evondev Rule M2, M30) */}
      <div className="cm-priority-banner">
        <div className="cm-priority-content">
          <span className="cm-priority-badge">
            <AlertCircle size={14} />
            Cần ưu tiên xử lý
          </span>
          <span style={{ fontSize: '13.5px', color: 'var(--foreground)', fontWeight: 500 }}>
            Có <strong>{metrics.pendingReviewCount} học liệu</strong> đang chờ duyệt từ giáo viên và{' '}
            <strong style={{ color: '#be123c' }}>{metrics.overdueIssuesCount} báo cáo lỗi quá hạn SLA</strong> cần phản hồi Support.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/management/content-manager/moderation" className="cm-btn cm-btn-outline cm-btn-sm">
            Xem hàng chờ duyệt ({metrics.pendingReviewCount})
          </Link>
          <Link to="/management/content-manager/issues" className="cm-btn cm-btn-danger cm-btn-sm">
            Xử lý lỗi Support
          </Link>
        </div>
      </div>

      {/* 3. 6 Key Metrics Grid (Layout A) */}
      <div className="cm-metrics-grid">
        <div className="cm-metric-card">
          <div className="cm-metric-header">
            <span>Tổng số học liệu</span>
            <div className="cm-metric-icon-wrap">
              <BookOpen size={16} />
            </div>
          </div>
          <div className="cm-metric-value">{metrics.totalItems.toLocaleString('vi-VN')}</div>
          <div className="cm-metric-meta">
            <span>Bao gồm HSK 1 - HSK 6</span>
          </div>
        </div>

        <div className="cm-metric-card">
          <div className="cm-metric-header">
            <span>Chờ kiểm duyệt</span>
            <div className="cm-metric-icon-wrap" style={{ color: '#b45309', backgroundColor: '#fef3c7' }}>
              <Clock size={16} />
            </div>
          </div>
          <div className="cm-metric-value" style={{ color: '#b45309' }}>
            {metrics.pendingReviewCount}
          </div>
          <div className="cm-metric-meta">
            <span>Giáo viên gửi lên</span>
          </div>
        </div>

        <div className="cm-metric-card">
          <div className="cm-metric-header">
            <span>Đã xuất bản</span>
            <div className="cm-metric-icon-wrap" style={{ color: '#047857', backgroundColor: '#ecfdf5' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="cm-metric-value" style={{ color: '#047857' }}>
            {metrics.publishedCount.toLocaleString('vi-VN')}
          </div>
          <div className="cm-metric-meta">
            <span>Đang phát hành cho học viên</span>
          </div>
        </div>

        <div className="cm-metric-card">
          <div className="cm-metric-header">
            <span>Báo cáo lỗi mới</span>
            <div className="cm-metric-icon-wrap" style={{ color: '#0369a1', backgroundColor: '#e0f2fe' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="cm-metric-value">{metrics.newIssuesCount}</div>
          <div className="cm-metric-meta">
            <span>Từ bộ phận Support CSKH</span>
          </div>
        </div>

        <div className="cm-metric-card">
          <div className="cm-metric-header">
            <span>Đang xử lý</span>
            <div className="cm-metric-icon-wrap" style={{ color: '#b45309', backgroundColor: '#fef3c7' }}>
              <RefreshCw size={16} />
            </div>
          </div>
          <div className="cm-metric-value">{metrics.inProgressIssuesCount}</div>
          <div className="cm-metric-meta">
            <span>Content Manager đang sửa</span>
          </div>
        </div>

        <div className="cm-metric-card">
          <div className="cm-metric-header">
            <span>Quá hạn SLA</span>
            <div className="cm-metric-icon-wrap" style={{ color: '#be123c', backgroundColor: '#fff1f2' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="cm-metric-value" style={{ color: '#be123c' }}>
            {metrics.overdueIssuesCount}
          </div>
          <div className="cm-metric-meta">
            <span>Chưa hoàn tất trong 24h</span>
          </div>
        </div>
      </div>

      {/* 4. Main 2-Column Split: Moderation Queue + Support Issues */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 'var(--space-6, 24px)' }}>
        {/* Left Widget: Moderation Queue */}
        <div className="cm-card">
          <div className="cm-card-header">
            <div>
              <h2 className="cm-card-title">Hàng chờ kiểm duyệt học liệu</h2>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Xem trước, thẩm định kiến thức và phê duyệt xuất bản
              </span>
            </div>
            <Link to="/management/content-manager/moderation" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingModerationItems.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-lg, 10px)',
                  backgroundColor: 'var(--background, #f8fafc)',
                  border: '1px solid var(--border-strong, #e2e8f0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--border)', color: 'var(--foreground)' }}>
                      HSK {item.hskLevel}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      {item.contentType} • v{item.version}
                    </span>
                    <ModerationBadge status={item.status} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    Soạn bởi: {item.authorName} ({item.authorRole}) • {item.changesSummary}
                  </div>
                </div>

                <button
                  type="button"
                  className="cm-btn cm-btn-outline cm-btn-sm"
                  onClick={() => setSelectedModItem(item)}
                >
                  Xem trước & Duyệt
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Widget: Support Content Issues */}
        <div className="cm-card">
          <div className="cm-card-header">
            <div>
              <h2 className="cm-card-title">Báo cáo lỗi nội dung từ Support</h2>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Phản ánh từ học sinh được chuyển tiếp lên
              </span>
            </div>
            <Link to="/management/content-manager/issues" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {urgentIssues.map((issue) => (
              <div
                key={issue.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-lg, 10px)',
                  backgroundColor: 'var(--background, #f8fafc)',
                  border: `1px solid ${issue.priority === 'URGENT' ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-strong, #e2e8f0)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)' }}>
                      {issue.id}
                    </span>
                    <IssueStatusBadge status={issue.status} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: issue.priority === 'URGENT' ? '#be123c' : '#b45309' }}>
                    {issue.priority}
                  </span>
                </div>

                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--foreground)' }}>
                  {issue.title}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Học liệu: <strong>{issue.targetContentTitle}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    {issue.reportedBy}
                  </span>
                  <button
                    type="button"
                    className="cm-btn cm-btn-secondary cm-btn-sm"
                    onClick={() => setSelectedIssue(issue)}
                  >
                    Mở xử lý
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Quality Overview Breakdown Chart (Evondev N3, charts.md) */}
      <div className="cm-card">
        <div className="cm-card-header">
          <div>
            <h2 className="cm-card-title">Độ chuẩn hóa học liệu HSK 1 → HSK 6</h2>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Tỷ lệ kiểm định chéo và mức độ chính xác ngữ pháp/pinyin
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--foreground)', fontWeight: 600 }}>
              <TrendingUp size={16} color="#047857" />
              Độ chuẩn xác toàn hệ thống: {metrics.accuracyRate}%
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
              MTTR: <strong>{metrics.avgResolutionHours}h</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {metrics.hskDistribution.map((hsk) => (
            <div
              key={hsk.level}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-lg, 10px)',
                backgroundColor: 'var(--background, #f8fafc)',
                border: '1px solid var(--border-strong, #e2e8f0)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>
                  HSK {hsk.level}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#047857', backgroundColor: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>
                  {hsk.verifiedPercent}% Chuẩn hóa
                </span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)' }}>
                {hsk.count.toLocaleString('vi-VN')} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)' }}>mục</span>
              </div>
              {/* Progress track */}
              <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--border-strong)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${hsk.verifiedPercent}%`,
                    backgroundColor: 'var(--primary, #E60012)',
                    borderRadius: '9999px',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drawers and Modals */}
      <ContentPreviewDrawer
        item={selectedModItem}
        onClose={() => setSelectedModItem(null)}
        onApprovePublish={handleApprovePublish}
        onReject={handleReject}
        onUnpublish={handleUnpublish}
      />

      <IssueDetailDrawer
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onAssignToMe={handleAssignIssue}
        onResolve={handleResolveIssue}
        onReopen={(issueId, reason) => {
          contentIssuesService.reopenIssue(issueId, reason);
          setRefreshKey((k) => k + 1);
          setSelectedIssue(null);
        }}
        onCloseIssue={(issueId) => {
          contentIssuesService.closeIssue(issueId);
          setRefreshKey((k) => k + 1);
          setSelectedIssue(null);
        }}
      />

      <SelfPublishModal
        isOpen={isSelfPublishOpen}
        onClose={() => setIsSelfPublishOpen(false)}
        onPublish={(payload) => {
          contentModerationService.selfPublish(payload);
          setRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
};
