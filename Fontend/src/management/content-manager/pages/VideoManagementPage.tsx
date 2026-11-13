import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Video as VideoIcon,
  Plus,
  Search,
  Play,
  Edit3,
  Trash2,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
} from 'lucide-react';
import { videoManagementService } from '../services/video-management.service';
import type { LearningVideoItem } from '../types/video.types';
import { VideoPreviewModal } from '../components/VideoPreviewModal';
import { VideoEditorModal } from '../components/VideoEditorModal';

const YoutubeIcon: React.FC<{ size?: number }> = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export const VideoManagementPage: React.FC = () => {
  const [videos, setVideos] = useState<LearningVideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const pageSize = 12;
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedHsk, setSelectedHsk] = useState<number | 'ALL'>('ALL');
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Topics
  const [availableTopics, setAvailableTopics] = useState<string[]>([
    'Giao tiếp hàng ngày',
    'Ẩm thực & Mua sắm',
    'Du lịch & Đời sống',
    'Ngữ pháp thực dụng',
    'Luyện thi HSK',
    'Văn hóa & Phong tục',
  ]);

  // Modals & Actions
  const [previewVideo, setPreviewVideo] = useState<LearningVideoItem | null>(null);
  const [editingVideo, setEditingVideo] = useState<LearningVideoItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [deleteConfirmVideo, setDeleteConfirmVideo] = useState<LearningVideoItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch topics once
  useEffect(() => {
    videoManagementService.fetchTopics().then((topics) => {
      if (topics && topics.length > 0) {
        setAvailableTopics(topics);
      }
    });
  }, []);

  // Fetch videos from API
  const loadVideos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await videoManagementService.fetchVideos({
        page,
        pageSize,
        search: debouncedSearch.trim() || undefined,
        hskLevel: selectedHsk !== 'ALL' ? selectedHsk : undefined,
        topic: selectedTopic !== 'ALL' ? selectedTopic : undefined,
        sourceType: selectedSource !== 'ALL' ? selectedSource : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      });

      setVideos(res.items);
      setTotalItems(res.totalItems);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ quản trị video.';
      setError(msg);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, selectedHsk, selectedTopic, selectedSource, selectedStatus]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // Quick status update handler
  const handleQuickStatusChange = async (video: LearningVideoItem, newStatus: 'Draft' | 'Published' | 'Hidden') => {
    try {
      const updated = await videoManagementService.updateStatus(video.id, newStatus);
      setVideos((prev) => prev.map((v) => (v.id === video.id ? updated : v)));
      showToast(`Đã chuyển trạng thái sang "${newStatus}".`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi cập nhật trạng thái video.';
      showToast(msg, 'error');
    }
  };

  // Delete confirm handler
  const handleDeleteVideo = async () => {
    if (!deleteConfirmVideo) return;
    setIsDeleting(true);

    try {
      const success = await videoManagementService.deleteVideo(deleteConfirmVideo.id);
      if (success) {
        setVideos((prev) => prev.filter((v) => v.id !== deleteConfirmVideo.id));
        setTotalItems((prev) => Math.max(0, prev - 1));
        showToast(`Đã xóa video "${deleteConfirmVideo.title}" thành công.`, 'success');
      } else {
        showToast('Không tìm thấy video để xóa.', 'error');
      }
      setDeleteConfirmVideo(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa video.';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedHsk('ALL');
    setSelectedTopic('ALL');
    setSelectedSource('ALL');
    setSelectedStatus('ALL');
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    selectedHsk !== 'ALL' ||
    selectedTopic !== 'ALL' ||
    selectedSource !== 'ALL' ||
    selectedStatus !== 'ALL';

  // Stats summary counts
  const stats = useMemo(() => {
    const publishedCount = videos.filter((v) => v.status === 'Published').length;
    const draftCount = videos.filter((v) => v.status === 'Draft').length;
    const hiddenCount = videos.filter((v) => v.status === 'Hidden').length;
    return {
      total: totalItems,
      pagePublished: publishedCount,
      pageDraft: draftCount,
      pageHidden: hiddenCount,
    };
  }, [videos, totalItems]);

  return (
    <div className="management-page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            borderRadius: '10px',
            backgroundColor: toastMessage.type === 'success' ? '#15803d' : '#dc2626',
            color: '#ffffff',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            fontSize: '13.5px',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              Quản lý Video Học Tập
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--primary, #E60012)',
                backgroundColor: '#FFF0F1',
                padding: '2px 8px',
                borderRadius: '999px',
                border: '1px solid #fed7da',
              }}
            >
              Giai đoạn 2
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#64748b' }}>
            Quản trị học liệu video YouTube, upload video tự lưu trữ, phân quyền và kiểm soát xuất bản
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingVideo(null);
            setIsEditorOpen(true);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: 'var(--primary, #E60012)',
            color: '#ffffff',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(230, 0, 18, 0.25)',
          }}
        >
          <Plus size={16} />
          <span>Thêm video mới</span>
        </button>
      </div>

      {/* Stat Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Tổng số video</span>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
            {stats.total}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>Trang hiện tại: Đã xuất bản</span>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>
            {stats.pagePublished}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 600 }}>Trang hiện tại: Bản nháp</span>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#d97706', marginTop: '4px' }}>
            {stats.pageDraft}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Trang hiện tại: Đã ẩn</span>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#64748b', marginTop: '4px' }}>
            {stats.pageHidden}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          {/* Search input */}
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề hoặc mô tả..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {/* HSK Dropdown */}
          <select
            value={selectedHsk}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedHsk(v === 'ALL' ? 'ALL' : Number(v));
              setPage(1);
            }}
            aria-label="Cấp độ HSK"
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              color: '#334155',
            }}
          >
            <option value="ALL">Tất cả HSK</option>
            {[1, 2, 3, 4, 5, 6].map((l) => (
              <option key={l} value={l}>
                HSK {l}
              </option>
            ))}
          </select>

          {/* Topic Dropdown */}
          <select
            value={selectedTopic}
            onChange={(e) => {
              setSelectedTopic(e.target.value);
              setPage(1);
            }}
            aria-label="Chủ đề"
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              color: '#334155',
            }}
          >
            <option value="ALL">Tất cả chủ đề</option>
            {availableTopics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Source Type Dropdown */}
          <select
            value={selectedSource}
            onChange={(e) => {
              setSelectedSource(e.target.value);
              setPage(1);
            }}
            aria-label="Nguồn video"
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              color: '#334155',
            }}
          >
            <option value="ALL">Tất cả nguồn</option>
            <option value="YouTube">YouTube</option>
            <option value="Uploaded">Tự tải lên (Uploaded)</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Trạng thái"
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              color: '#334155',
            }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Published">Đã xuất bản (Published)</option>
            <option value="Draft">Bản nháp (Draft)</option>
            <option value="Hidden">Đã ẩn (Hidden)</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #fecdd3',
                backgroundColor: '#fff1f2',
                color: 'var(--primary, #E60012)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={12} />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Loading, Error, Empty, or Table */}
      {loading ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '48px', textAlign: 'center' }}>
          <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--primary, #E60012)', margin: '0 auto 12px auto' }} />
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: 600 }}>
            Đang tải danh sách video quản trị...
          </p>
        </div>
      ) : error ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #fee2e2', padding: '36px', textAlign: 'center' }}>
          <AlertCircle size={32} style={{ color: '#dc2626', margin: '0 auto 12px auto' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
            Không thể tải dữ liệu
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>{error}</p>
          <button
            type="button"
            onClick={() => loadVideos()}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--primary, #E60012)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Thử lại
          </button>
        </div>
      ) : videos.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '48px', textAlign: 'center' }}>
          <VideoIcon size={36} style={{ color: '#94a3b8', margin: '0 auto 12px auto' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
            Chưa có video nào phù hợp
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
            {hasActiveFilters ? 'Thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm.' : 'Bắt đầu bằng cách thêm video YouTube hoặc tải video lên.'}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Xóa bộ lọc
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingVideo(null);
                setIsEditorOpen(true);
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--primary, #E60012)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + Thêm video đầu tiên
            </button>
          )}
        </div>
      ) : (
        /* Video Table / Cards */
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                  <th style={{ padding: '12px 16px', width: '90px' }}>Thumbnail</th>
                  <th style={{ padding: '12px 16px' }}>Tiêu đề & Chủ đề</th>
                  <th style={{ padding: '12px 16px', width: '110px' }}>Nguồn</th>
                  <th style={{ padding: '12px 16px', width: '80px' }}>Cấp độ</th>
                  <th style={{ padding: '12px 16px', width: '100px' }}>Thời lượng</th>
                  <th style={{ padding: '12px 16px', width: '140px' }}>Trạng thái</th>
                  <th style={{ padding: '12px 16px', width: '130px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v) => {
                  const isYt = v.sourceType?.toLowerCase() === 'youtube';
                  const isPub = v.status === 'Published';
                  const isDraft = v.status === 'Draft';

                  return (
                    <tr
                      key={v.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.1s ease',
                      }}
                    >
                      {/* Thumbnail Preview */}
                      <td style={{ padding: '12px 16px' }}>
                        <div
                          style={{
                            width: '80px',
                            height: '45px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            backgroundColor: '#f1f5f9',
                            position: 'relative',
                            cursor: 'pointer',
                          }}
                          onClick={() => setPreviewVideo(v)}
                          title="Bấm để xem trước video"
                        >
                          <img
                            src={v.thumbnailUrl}
                            alt={v.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              backgroundColor: 'rgba(0,0,0,0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                            }}
                          >
                            <Play size={14} fill="currentColor" />
                          </div>
                        </div>
                      </td>

                      {/* Title & Topic */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>
                          {v.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#64748b' }}>
                          <span>{v.topic}</span>
                          {v.lessonTitle && (
                            <>
                              <span>•</span>
                              <span style={{ color: '#2563eb' }}>{v.lessonTitle}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Source */}
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: isYt ? '#fee2e2' : '#dbeafe',
                            color: isYt ? '#dc2626' : '#2563eb',
                          }}
                        >
                          {isYt ? <YoutubeIcon size={12} /> : <UploadCloud size={12} />}
                          <span>{isYt ? 'YouTube' : 'Uploaded'}</span>
                        </span>
                      </td>

                      {/* HSK Level */}
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#fff1f2',
                            color: 'var(--primary, #E60012)',
                          }}
                        >
                          HSK {v.hskLevel}
                        </span>
                      </td>

                      {/* Duration */}
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          <span>{v.durationFormatted || '00:00'}</span>
                        </div>
                      </td>

                      {/* Status Selector */}
                      <td style={{ padding: '12px 16px' }}>
                        <select
                          value={v.status}
                          onChange={(e) => handleQuickStatusChange(v, e.target.value as any)}
                          aria-label={`Trạng thái video ${v.title}`}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid',
                            borderColor: isPub ? '#86efac' : isDraft ? '#cbd5e1' : '#fed7aa',
                            backgroundColor: isPub ? '#f0fdf4' : isDraft ? '#f8fafc' : '#fffbeb',
                            color: isPub ? '#15803d' : isDraft ? '#475569' : '#b45309',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <option value="Published">Published (Công khai)</option>
                          <option value="Draft">Draft (Bản nháp)</option>
                          <option value="Hidden">Hidden (Đã ẩn)</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setPreviewVideo(v)}
                            title="Xem trước"
                            aria-label={`Xem trước video ${v.title}`}
                            style={{
                              border: 'none',
                              background: '#f1f5f9',
                              color: '#334155',
                              padding: '6px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingVideo(v);
                              setIsEditorOpen(true);
                            }}
                            title="Chỉnh sửa"
                            aria-label={`Chỉnh sửa video ${v.title}`}
                            style={{
                              border: 'none',
                              background: '#f1f5f9',
                              color: '#2563eb',
                              padding: '6px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            <Edit3 size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmVideo(v)}
                            title="Xóa video"
                            aria-label={`Xóa video ${v.title}`}
                            style={{
                              border: 'none',
                              background: '#fee2e2',
                              color: '#dc2626',
                              padding: '6px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                Hiển thị trang <strong>{page}</strong> / <strong>{totalPages}</strong> ({totalItems} video)
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: page <= 1 ? '#94a3b8' : '#334155',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ChevronLeft size={13} />
                  <span>Trước</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: page >= totalPages ? '#94a3b8' : '#334155',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>Sau</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      <VideoEditorModal
        isOpen={isEditorOpen}
        video={editingVideo}
        availableTopics={availableTopics}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingVideo(null);
        }}
        onSaved={(saved) => {
          if (editingVideo) {
            setVideos((prev) => prev.map((v) => (v.id === saved.id ? saved : v)));
            showToast(`Đã cập nhật video "${saved.title}".`, 'success');
          } else {
            setVideos((prev) => [saved, ...prev]);
            setTotalItems((p) => p + 1);
            showToast(`Đã tạo mới video "${saved.title}".`, 'success');
          }
        }}
      />

      {/* Preview Modal */}
      <VideoPreviewModal video={previewVideo} onClose={() => setPreviewVideo(null)} />

      {/* Delete Confirmation Modal */}
      {deleteConfirmVideo && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(3px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setDeleteConfirmVideo(null);
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '24px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626', marginBottom: '12px' }}>
              <AlertCircle size={22} />
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Xác nhận xóa video</h3>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: '#475569', lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn xóa video <strong>&ldquo;{deleteConfirmVideo.title}&rdquo;</strong>? Hành động này sẽ
              xóa vĩnh viễn video khỏi thư viện và tệp đính kèm.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmVideo(null)}
                disabled={isDeleting}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteVideo}
                disabled={isDeleting}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
