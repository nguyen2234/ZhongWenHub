import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { contentModerationService } from '../services/content-moderation.service';
import { ModerationBadge } from '../components/ModerationBadge';
import { ContentPreviewDrawer } from '../components/ContentPreviewDrawer';
import { SelfPublishModal } from '../components/SelfPublishModal';
import type {
  ModerationItem,
  ModerationStatus,
  ModerationContentType,
} from '../types/content-manager.types';
import '../components/content-manager.css';

export const ContentModerationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ModerationStatus | 'ALL'>('PENDING_REVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedHsk, setSelectedHsk] = useState<string>('ALL');
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [isSelfPublishOpen, setIsSelfPublishOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load items
  const items = useMemo(() => {
    return contentModerationService.getModerationItems({
      status: activeTab === 'ALL' ? undefined : activeTab,
      contentType: selectedType === 'ALL' ? undefined : (selectedType as ModerationContentType),
      hskLevel: selectedHsk === 'ALL' ? undefined : Number(selectedHsk),
      search: searchQuery,
    });
  }, [activeTab, selectedType, selectedHsk, searchQuery, refreshKey]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    const all = contentModerationService.getModerationItems();
    return {
      ALL: all.length,
      PENDING_REVIEW: all.filter((i) => i.status === 'PENDING_REVIEW').length,
      PUBLISHED: all.filter((i) => i.status === 'PUBLISHED').length,
      DRAFT: all.filter((i) => i.status === 'DRAFT').length,
      ARCHIVED: all.filter((i) => i.status === 'ARCHIVED').length,
    };
  }, [refreshKey]);

  const handleApprovePublish = (item: ModerationItem, notes: string) => {
    contentModerationService.approveAndPublish(item.id, notes);
    setSelectedItem(null);
    setRefreshKey((k) => k + 1);
  };

  const handleReject = (item: ModerationItem, reason: string) => {
    contentModerationService.rejectItem(item.id, reason);
    setSelectedItem(null);
    setRefreshKey((k) => k + 1);
  };

  const handleUnpublish = (item: ModerationItem, reason: string) => {
    contentModerationService.unpublishToDraft(item.id, reason);
    setSelectedItem(null);
    setRefreshKey((k) => k + 1);
  };

  const handleRestore = (item: ModerationItem) => {
    contentModerationService.restoreItem(item.id);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="cm-container">
      {/* 1. Header */}
      <div className="cm-header-row">
        <div className="cm-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="cm-page-title">Kiểm duyệt & Xuất bản học liệu</h1>
            <span className="cm-badge cm-badge-pending">
              {tabCounts.PENDING_REVIEW} chờ duyệt
            </span>
          </div>
          <p className="cm-page-subtitle">
            Quy trình DRAFT → PENDING_REVIEW → PUBLISHED → ARCHIVED. Thẩm định nội dung và tự xuất bản.
          </p>
        </div>

        <button
          type="button"
          className="cm-btn cm-btn-primary"
          onClick={() => setIsSelfPublishOpen(true)}
        >
          <Plus size={16} />
          Tự xuất bản học liệu mới
        </button>
      </div>

      {/* 2. Tabs Bar */}
      <div className="cm-tab-bar">
        <button
          type="button"
          className={`cm-tab-item ${activeTab === 'PENDING_REVIEW' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('PENDING_REVIEW')}
        >
          <span>Chờ kiểm duyệt</span>
          <span className="cm-tab-badge">{tabCounts.PENDING_REVIEW}</span>
        </button>
        <button
          type="button"
          className={`cm-tab-item ${activeTab === 'PUBLISHED' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('PUBLISHED')}
        >
          <span>Đã xuất bản</span>
          <span className="cm-tab-badge">{tabCounts.PUBLISHED}</span>
        </button>
        <button
          type="button"
          className={`cm-tab-item ${activeTab === 'DRAFT' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('DRAFT')}
        >
          <span>Bản nháp</span>
          <span className="cm-tab-badge">{tabCounts.DRAFT}</span>
        </button>
        <button
          type="button"
          className={`cm-tab-item ${activeTab === 'ARCHIVED' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('ARCHIVED')}
        >
          <span>Kho lưu trữ</span>
          <span className="cm-tab-badge">{tabCounts.ARCHIVED}</span>
        </button>
        <button
          type="button"
          className={`cm-tab-item ${activeTab === 'ALL' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('ALL')}
        >
          <span>Tất cả</span>
          <span className="cm-tab-badge">{tabCounts.ALL}</span>
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
              placeholder="Tìm kiếm theo tiêu đề, tác giả, chữ Hán, pinyin..."
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
            <option value="ALL">Tất cả loại học liệu</option>
            <option value="GRAMMAR_POINT">Điểm ngữ pháp</option>
            <option value="HSK_CHARACTER">Chữ Hán & Từ vựng</option>
            <option value="CURRICULUM_LESSON">Bài học giáo trình</option>
            <option value="EXERCISE_QUESTION">Câu hỏi bài tập</option>
          </select>

          <select
            className="cm-select"
            value={selectedHsk}
            onChange={(e) => setSelectedHsk(e.target.value)}
          >
            <option value="ALL">Tất cả HSK</option>
            <option value="1">HSK 1</option>
            <option value="2">HSK 2</option>
            <option value="3">HSK 3</option>
            <option value="4">HSK 4</option>
            <option value="5">HSK 5</option>
            <option value="6">HSK 6</option>
          </select>
        </div>
      </div>

      {/* 4. Desktop Data Table */}
      <div className="cm-table-wrapper">
        <table className="cm-table">
          <thead>
            <tr>
              <th style={{ width: '90px' }}>Trình độ</th>
              <th>Tiêu đề học liệu</th>
              <th style={{ width: '160px' }}>Loại phân hệ</th>
              <th style={{ width: '180px' }}>Tác giả</th>
              <th style={{ width: '90px', textAlign: 'center' }}>Phiên bản</th>
              <th style={{ width: '130px' }}>Trạng thái</th>
              <th style={{ width: '140px', textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                  Không tìm thấy học liệu nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--background)',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: 'var(--foreground)',
                      }}
                    >
                      HSK {item.hskLevel}
                    </span>
                  </td>
                  <td>
                    <div className="cm-td-title">{item.title}</div>
                    <div className="cm-td-subtitle">{item.changesSummary}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>
                      {item.contentType}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                      {item.authorName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      {item.authorRole === 'TEACHER' ? 'Giáo viên' : 'Quản lý học liệu'}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)' }}>
                      v{item.version}
                    </span>
                  </td>
                  <td>
                    <ModerationBadge status={item.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <button
                        type="button"
                        className="cm-btn cm-btn-outline cm-btn-sm"
                        onClick={() => setSelectedItem(item)}
                        title="Xem trước và duyệt"
                      >
                        <Eye size={14} />
                        Xem trước
                      </button>
                      {item.status === 'ARCHIVED' && (
                        <button
                          type="button"
                          className="cm-btn cm-btn-secondary cm-btn-sm"
                          onClick={() => handleRestore(item)}
                          title="Khôi phục về bản nháp"
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Mobile Cards View (R9 - zero horizontal overflow) */}
      <div className="cm-mobile-list">
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)', backgroundColor: 'var(--surface)', borderRadius: '12px' }}>
            Không tìm thấy học liệu nào.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="cm-mobile-card">
              <div className="cm-mobile-card-top">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--background)' }}>
                      HSK {item.hskLevel}
                    </span>
                    <ModerationBadge status={item.status} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                    {item.title}
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>
                  v{item.version}
                </span>
              </div>

              <div className="cm-mobile-card-meta">
                <span>{item.contentType}</span>
                <span>•</span>
                <span>Tác giả: {item.authorName}</span>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {item.changesSummary}
              </div>

              <div className="cm-mobile-card-bottom">
                <button
                  type="button"
                  className="cm-btn cm-btn-outline cm-btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => setSelectedItem(item)}
                >
                  <Eye size={14} />
                  Xem trước & Xử lý
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Drawers & Modals */}
      <ContentPreviewDrawer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onApprovePublish={handleApprovePublish}
        onReject={handleReject}
        onUnpublish={handleUnpublish}
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
