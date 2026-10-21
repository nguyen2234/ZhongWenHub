import React, { useState, useMemo } from 'react';
import { Search, Eye, CheckCircle2 } from 'lucide-react';
import { contentAuditService } from '../services/content-audit.service';
import { VersionDiffDrawer } from '../components/VersionDiffDrawer';
import { ModerationBadge } from '../components/ModerationBadge';
import type { VersionSnapshot } from '../types/content-manager.types';
import '../components/content-manager.css';

export const ContentAuditHistoryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChangeType, setSelectedChangeType] = useState<string>('ALL');
  const [selectedSnapshot, setSelectedSnapshot] = useState<VersionSnapshot | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const snapshots = useMemo(() => {
    let list = contentAuditService.getVersionSnapshots();
    if (selectedChangeType !== 'ALL') {
      list = list.filter((s) => s.changeType === selectedChangeType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.contentTitle.toLowerCase().includes(q) ||
          s.contentId.toLowerCase().includes(q) ||
          s.changedBy.toLowerCase().includes(q) ||
          s.summary.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchQuery, selectedChangeType, refreshKey]);

  const handleRollback = (snapshot: VersionSnapshot) => {
    contentAuditService.restoreVersion(snapshot.contentId, snapshot.version);
    setSelectedSnapshot(null);
    setSuccessToast(`Đã khôi phục thành công học liệu "${snapshot.contentTitle}" về bản sao v${snapshot.version}!`);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="cm-container">
      {/* 1. Header */}
      <div className="cm-header-row">
        <div className="cm-title-group">
          <h1 className="cm-page-title">Lịch sử phiên bản & Nhật ký kiểm toán (Audit Log)</h1>
          <p className="cm-page-subtitle">
            Lưu vết toàn bộ thao tác xuất bản, sửa đổi, thu hồi và khôi phục học liệu theo tiêu chuẩn kiểm định giáo dục.
          </p>
        </div>
      </div>

      {/* Success Toast Banner */}
      {successToast && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #10b981',
            borderRadius: '10px',
            color: '#047857',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          {successToast}
        </div>
      )}

      {/* 2. Toolbar & Filters */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}
          />
          <input
            type="text"
            className="cm-input"
            style={{ width: '100%', paddingLeft: '36px' }}
            placeholder="Tìm theo tiêu đề, ID học liệu, người thao tác..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="cm-select"
          value={selectedChangeType}
          onChange={(e) => setSelectedChangeType(e.target.value)}
        >
          <option value="ALL">Tất cả loại thao tác</option>
          <option value="PUBLISH">Xuất bản (PUBLISH)</option>
          <option value="UPDATE">Cập nhật (UPDATE)</option>
          <option value="ISSUE_FIX">Vá lỗi Support (ISSUE_FIX)</option>
          <option value="UNPUBLISH">Thu hồi (UNPUBLISH)</option>
          <option value="RESTORE">Khôi phục (RESTORE)</option>
          <option value="CREATE">Khởi tạo mới (CREATE)</option>
        </select>
      </div>

      {/* 3. Desktop Table View */}
      <div className="cm-table-wrapper">
        <table className="cm-table">
          <thead>
            <tr>
              <th style={{ width: '100px', textAlign: 'center' }}>Phiên bản</th>
              <th>Học liệu & Tóm tắt thao tác</th>
              <th style={{ width: '140px' }}>Loại thao tác</th>
              <th style={{ width: '160px' }}>Người thực hiện</th>
              <th style={{ width: '160px' }}>Thời điểm</th>
              <th style={{ width: '120px' }}>Trạng thái</th>
              <th style={{ width: '130px', textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {snapshots.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                  Không tìm thấy bản ghi lịch sử phiên bản nào.
                </td>
              </tr>
            ) : (
              snapshots.map((snap) => (
                <tr key={snap.id}>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--background)',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--primary)',
                      }}
                    >
                      v{snap.version}
                    </span>
                  </td>
                  <td>
                    <div className="cm-td-title">{snap.contentTitle}</div>
                    <div className="cm-td-subtitle">{snap.summary}</div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor:
                          snap.changeType === 'PUBLISH'
                            ? '#ecfdf5'
                            : snap.changeType === 'ISSUE_FIX'
                            ? '#e0f2fe'
                            : snap.changeType === 'UNPUBLISH'
                            ? '#fef3c7'
                            : 'var(--background)',
                        color:
                          snap.changeType === 'PUBLISH'
                            ? '#047857'
                            : snap.changeType === 'ISSUE_FIX'
                            ? '#0369a1'
                            : snap.changeType === 'UNPUBLISH'
                            ? '#b45309'
                            : 'var(--foreground)',
                      }}
                    >
                      {snap.changeType}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                      {snap.changedBy}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      {snap.changedByRole}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {new Date(snap.timestamp).toLocaleString('vi-VN')}
                    </span>
                  </td>
                  <td>
                    <ModerationBadge status={snap.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="cm-btn cm-btn-outline cm-btn-sm"
                      onClick={() => setSelectedSnapshot(snap)}
                    >
                      <Eye size={14} />
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Mobile Cards View */}
      <div className="cm-mobile-list">
        {snapshots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)', backgroundColor: 'var(--surface)', borderRadius: '12px' }}>
            Không tìm thấy bản ghi nào.
          </div>
        ) : (
          snapshots.map((snap) => (
            <div key={snap.id} className="cm-mobile-card">
              <div className="cm-mobile-card-top">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--background)' }}>
                      v{snap.version}
                    </span>
                    <ModerationBadge status={snap.status} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                    {snap.contentTitle}
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>
                  {snap.changeType}
                </span>
              </div>

              <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                {snap.summary}
              </div>

              <div className="cm-mobile-card-meta">
                <span>Bởi: {snap.changedBy}</span>
                <span>•</span>
                <span>{new Date(snap.timestamp).toLocaleDateString('vi-VN')}</span>
              </div>

              <div className="cm-mobile-card-bottom">
                <button
                  type="button"
                  className="cm-btn cm-btn-outline cm-btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => setSelectedSnapshot(snap)}
                >
                  <Eye size={14} />
                  Xem bản snapshot
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Diff Drawer */}
      <VersionDiffDrawer
        snapshot={selectedSnapshot}
        onClose={() => setSelectedSnapshot(null)}
        onRollback={handleRollback}
      />
    </div>
  );
};
