import React, { useState, useMemo } from 'react';
import { Search, Eye } from 'lucide-react';
import { contentIssuesService } from '../services/content-issues.service';
import { IssueStatusBadge } from '../components/IssueStatusBadge';
import { IssueDetailDrawer } from '../components/IssueDetailDrawer';
import type {
  ContentIssue,
  ContentIssueStatus,
  ContentIssueType,
  ContentPriority,
} from '../types/content-manager.types';
import '../components/content-manager.css';

export const ContentIssuesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ContentIssueStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedIssue, setSelectedIssue] = useState<ContentIssue | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load issues
  const issues = useMemo(() => {
    return contentIssuesService.getIssues({
      status: activeTab === 'ALL' ? undefined : activeTab,
      issueType: selectedType === 'ALL' ? undefined : (selectedType as ContentIssueType),
      priority: selectedPriority === 'ALL' ? undefined : (selectedPriority as ContentPriority),
      search: searchQuery,
    });
  }, [activeTab, selectedType, selectedPriority, searchQuery, refreshKey]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const all = contentIssuesService.getIssues();
    return {
      ALL: all.length,
      NEW: all.filter((i) => i.status === 'NEW').length,
      IN_PROGRESS: all.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'TRIAGED').length,
      RESOLVED: all.filter((i) => i.status === 'RESOLVED').length,
      CLOSED: all.filter((i) => i.status === 'CLOSED').length,
    };
  }, [refreshKey]);

  const handleAssignToMe = (issueId: string) => {
    contentIssuesService.assignToContentManager(issueId);
    setRefreshKey((k) => k + 1);
    if (selectedIssue) {
      setSelectedIssue(contentIssuesService.getIssueById(issueId) || null);
    }
  };

  const handleResolveIssue = (issueId: string, notes: string, feedback: string) => {
    contentIssuesService.resolveIssue(issueId, notes, feedback);
    setSelectedIssue(null);
    setRefreshKey((k) => k + 1);
  };

  const handleReopenIssue = (issueId: string, reason: string) => {
    contentIssuesService.reopenIssue(issueId, reason);
    setSelectedIssue(null);
    setRefreshKey((k) => k + 1);
  };

  const handleCloseIssue = (issueId: string) => {
    contentIssuesService.closeIssue(issueId);
    setSelectedIssue(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="cm-container">
      {/* 1. Header */}
      <div className="cm-header-row">
        <div className="cm-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="cm-page-title">Tiếp nhận & Xử lý báo cáo lỗi học liệu</h1>
            <span className="cm-badge cm-badge-new">
              {tabCounts.NEW} mới tiếp nhận
            </span>
          </div>
          <p className="cm-page-subtitle">
            Quy trình phối hợp Support: NEW → TRIAGED → IN_PROGRESS → RESOLVED → CLOSED. Khắc phục lỗi và phản hồi kết quả.
          </p>
        </div>
      </div>

      {/* 2. Tabs */}
      <div className="cm-tab-bar">
        <button
          type="button"
          className={`cm-tab-item ${activeTab === 'ALL' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('ALL')}
        >
          <span>Tất cả báo cáo</span>
          <span className="cm-tab-badge">{tabCounts.ALL}</span>
        </button>
        <button
          type="button"
          className={`cm-tab-item ${activeTab === 'NEW' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('NEW')}
        >
          <span>Mới tiếp nhận</span>
          <span className="cm-tab-badge">{tabCounts.NEW}</span>
        </button>
        <button
          type="button"
          className={`cm-tab-item ${activeTab === 'IN_PROGRESS' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('IN_PROGRESS')}
        >
          <span>Đang xử lý</span>
          <span className="cm-tab-badge">{tabCounts.IN_PROGRESS}</span>
        </button>
        <button
          type="button"
          className={`cm-tab-item ${activeTab === 'RESOLVED' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('RESOLVED')}
        >
          <span>Đã khắc phục</span>
          <span className="cm-tab-badge">{tabCounts.RESOLVED}</span>
        </button>
        <button
          type="button"
          className={`cm-tab-item ${activeTab === 'CLOSED' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('CLOSED')}
        >
          <span>Đã đóng</span>
          <span className="cm-tab-badge">{tabCounts.CLOSED}</span>
        </button>
      </div>

      {/* 3. Toolbar & Filters */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}
            />
            <input
              type="text"
              className="cm-input"
              style={{ width: '100%', paddingLeft: '36px' }}
              placeholder="Tìm kiếm theo mã lỗi, tiêu đề, học liệu, học viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            className="cm-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="ALL">Tất cả loại lỗi</option>
            <option value="WRONG_PINYIN">Sai phiên âm Pinyin</option>
            <option value="WRONG_MEANING">Sai giải nghĩa tiếng Việt</option>
            <option value="WRONG_ANSWER">Sai đáp án trắc nghiệm</option>
            <option value="AUDIO_ERROR">Lỗi tệp âm thanh (Audio)</option>
            <option value="DISPLAY_ERROR">Lỗi giao diện / hiển thị</option>
            <option value="OTHER">Lỗi khác</option>
          </select>

          <select
            className="cm-select"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          >
            <option value="ALL">Mọi mức ưu tiên</option>
            <option value="URGENT">Khẩn cấp (URGENT)</option>
            <option value="HIGH">Cao (HIGH)</option>
            <option value="MEDIUM">Trung bình (MEDIUM)</option>
            <option value="LOW">Thấp (LOW)</option>
          </select>
        </div>
      </div>

      {/* 4. Desktop Table View */}
      <div className="cm-table-wrapper">
        <table className="cm-table">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Mã lỗi</th>
              <th>Tiêu đề & Nội dung phản ánh</th>
              <th style={{ width: '150px' }}>Loại lỗi</th>
              <th style={{ width: '110px' }}>Mức ưu tiên</th>
              <th style={{ width: '170px' }}>Support phụ trách</th>
              <th style={{ width: '140px' }}>Trạng thái</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {issues.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                  Không có báo cáo lỗi nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              issues.map((issue) => (
                <tr key={issue.id}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--foreground)' }}>
                      {issue.id}
                    </div>
                    {issue.isOverdue && (
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#be123c', backgroundColor: '#fff1f2', padding: '1px 4px', borderRadius: '4px' }}>
                        Quá hạn
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="cm-td-title">{issue.title}</div>
                    <div className="cm-td-subtitle">
                      Học liệu: <strong>{issue.targetContentTitle}</strong> • Báo bởi: {issue.reportedBy}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12.5px', color: 'var(--foreground)', fontWeight: 500 }}>
                      {issue.issueType === 'WRONG_PINYIN'
                        ? 'Sai Pinyin'
                        : issue.issueType === 'WRONG_MEANING'
                        ? 'Sai nghĩa'
                        : issue.issueType === 'WRONG_ANSWER'
                        ? 'Sai đáp án'
                        : issue.issueType === 'AUDIO_ERROR'
                        ? 'Lỗi Audio'
                        : issue.issueType === 'DISPLAY_ERROR'
                        ? 'Lỗi hiển thị'
                        : 'Lỗi khác'}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color:
                          issue.priority === 'URGENT'
                            ? '#be123c'
                            : issue.priority === 'HIGH'
                            ? '#b45309'
                            : issue.priority === 'MEDIUM'
                            ? '#0369a1'
                            : '#64748b',
                      }}
                    >
                      {issue.priority}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                      {issue.supportStaffName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      CM xử lý: {issue.contentManagerName ? issue.contentManagerName.split('(')[0] : 'Chưa nhận'}
                    </div>
                  </td>
                  <td>
                    <IssueStatusBadge status={issue.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="cm-btn cm-btn-outline cm-btn-sm"
                      onClick={() => setSelectedIssue(issue)}
                    >
                      <Eye size={14} />
                      Xử lý
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Mobile Cards View */}
      <div className="cm-mobile-list">
        {issues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)', backgroundColor: 'var(--surface)', borderRadius: '12px' }}>
            Không tìm thấy báo cáo lỗi nào.
          </div>
        ) : (
          issues.map((issue) => (
            <div key={issue.id} className="cm-mobile-card">
              <div className="cm-mobile-card-top">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)' }}>
                      {issue.id}
                    </span>
                    <IssueStatusBadge status={issue.status} />
                    {issue.isOverdue && (
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#be123c', backgroundColor: '#fff1f2', padding: '1px 4px', borderRadius: '4px' }}>
                        Quá hạn
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                    {issue.title}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: issue.priority === 'URGENT' ? '#be123c' : '#b45309',
                  }}
                >
                  {issue.priority}
                </span>
              </div>

              <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                Học liệu: <strong>{issue.targetContentTitle}</strong>
              </div>

              <div className="cm-mobile-card-meta">
                <span>Support: {issue.supportStaffName}</span>
                <span>•</span>
                <span>Báo bởi: {issue.reportedBy}</span>
              </div>

              <div className="cm-mobile-card-bottom">
                <button
                  type="button"
                  className="cm-btn cm-btn-outline cm-btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => setSelectedIssue(issue)}
                >
                  <Eye size={14} />
                  Mở chi tiết & Xử lý
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Drawer */}
      <IssueDetailDrawer
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onAssignToMe={handleAssignToMe}
        onResolve={handleResolveIssue}
        onReopen={handleReopenIssue}
        onCloseIssue={handleCloseIssue}
      />
    </div>
  );
};
