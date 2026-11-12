import React, { useState, useMemo } from 'react';
import {
  Video as VideoIcon,
  Plus,
  Search,
  Play,
  Edit3,
  Trash2,
  Clock,
  Layers,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { PageHeader, Pagination } from '../../shared/components';
import { videoManagementService } from '../services/video-management.service';
import type { VideoContent, VideoStatus, TranscriptSegment } from '../types/video.types';
import { VideoPreviewModal } from '../components/VideoPreviewModal';
import { VideoEditorModal } from '../components/VideoEditorModal';

export const VideoManagementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHsk, setSelectedHsk] = useState<number | 'ALL'>('ALL');
  const [selectedTopic, setSelectedTopic] = useState<string | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<VideoStatus | 'ALL'>('ALL');
  const [refreshKey, setRefreshKey] = useState(0);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [previewVideo, setPreviewVideo] = useState<VideoContent | null>(null);
  const [editingVideo, setEditingVideo] = useState<VideoContent | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Load videos
  const videos = useMemo(() => {
    return videoManagementService.getVideos({
      search: searchQuery,
      hskLevel: selectedHsk,
      topic: selectedTopic,
      status: selectedStatus,
    });
  }, [searchQuery, selectedHsk, selectedTopic, selectedStatus, refreshKey]);

  // Statistics
  const stats = useMemo(() => {
    const all = videoManagementService.getVideos();
    return {
      total: all.length,
      published: all.filter((v) => v.status === 'PUBLISHED').length,
      review: all.filter((v) => v.status === 'REVIEW').length,
      draft: all.filter((v) => v.status === 'DRAFT').length,
      totalTranscripts: all.reduce((sum, v) => sum + v.transcripts.length, 0),
    };
  }, [refreshKey]);

  const totalPages = Math.ceil(videos.length / pageSize) || 1;
  const paginatedVideos = useMemo(() => {
    const start = (page - 1) * pageSize;
    return videos.slice(start, start + pageSize);
  }, [videos, page, pageSize]);

  const handleCreateNew = () => {
    setEditingVideo(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (video: VideoContent) => {
    setEditingVideo(video);
    setIsEditorOpen(true);
  };

  const handleSaveVideo = (data: {
    title: string;
    description: string;
    hskLevel: number;
    topic: string;
    videoUrl: string;
    thumbnailUrl: string;
    lessonTitle: string;
    status: VideoStatus;
    tags: string[];
    transcripts: TranscriptSegment[];
  }) => {
    if (editingVideo) {
      videoManagementService.updateVideo(editingVideo.id, data);
      setNotification(`Đã cập nhật video [${editingVideo.id}] thành công.`);
    } else {
      const created = videoManagementService.createVideo(data);
      setNotification(`Đã tạo mới học liệu video [${created.id}].`);
    }
    setIsEditorOpen(false);
    setEditingVideo(null);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDelete = (id: string) => {
    videoManagementService.deleteVideo(id);
    setDeleteConfirmId(null);
    setRefreshKey((k) => k + 1);
    setNotification(`Đã xóa học liệu video [${id}].`);
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', minWidth: 0 }}>
      {/* Header */}
      <PageHeader
        title="Quản lý học liệu Video & Phụ đề"
        subtitle="Thư viện video học tiếng Trung HSK, trình biên tập phụ đề đồng bộ đa ngôn ngữ và liên kết bài học."
        actions={
          <button
            type="button"
            onClick={handleCreateNew}
            className="ds-btn ds-btn-primary"
            style={{ gap: '6px' }}
          >
            <Plus size={16} /> Thêm Video Mới
          </button>
        }
      />

      {/* Notification Toast */}
      {notification && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <CheckCircle size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* Demo Warning / Notice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          fontSize: '12px',
          color: 'var(--muted)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: '11px',
              textTransform: 'uppercase',
            }}
          >
            Demo Frontend
          </span>
          <span>
            Hệ thống quản lý video và phụ đề hoạt động với kho lưu trữ mẫu. Thao tác lưu/sửa/xóa có hiệu lực ngay trong phiên.
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
          Sẵn sàng kết nối Spring Boot REST API
        </span>
      </div>

      {/* Summary KPI Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <VideoIcon size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Tổng số video</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--foreground)' }}>
              {stats.total}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Đã xuất bản</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a' }}>
              {stats.published}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#fffbeb',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Chờ duyệt</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#d97706' }}>
              {stats.review}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--secondary)',
              color: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Layers size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Bản nháp</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--foreground)' }}>
              {stats.draft}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(124, 58, 237, 0.1)',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FileText size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Đoạn phụ đề</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#7c3aed' }}>
              {stats.totalTranscripts}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 16px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề, từ khóa, chữ Hán, Pinyin..."
            style={{
              width: '100%',
              height: '38px',
              paddingLeft: '36px',
              paddingRight: '12px',
              fontSize: '13px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-strong)',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={selectedHsk}
            onChange={(e) => setSelectedHsk(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            aria-label="Lọc theo cấp độ HSK"
            style={{
              height: '38px',
              padding: '0 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-strong)',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '13px',
            }}
          >
            <option value="ALL">Mọi cấp độ HSK</option>
            {[1, 2, 3, 4, 5, 6].map((l) => (
              <option key={l} value={l}>
                HSK {l}
              </option>
            ))}
          </select>

          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            aria-label="Lọc theo chủ đề"
            style={{
              height: '38px',
              padding: '0 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-strong)',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '13px',
            }}
          >
            <option value="ALL">Mọi chủ đề</option>
            <option value="Giao tiếp hàng ngày">Giao tiếp hàng ngày</option>
            <option value="Mua sắm & Đời sống">Mua sắm & Đời sống</option>
            <option value="Du lịch & Giao thông">Du lịch & Giao thông</option>
            <option value="Công sở & Nghề nghiệp">Công sở & Nghề nghiệp</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as VideoStatus | 'ALL')}
            aria-label="Lọc theo trạng thái xuất bản"
            style={{
              height: '38px',
              padding: '0 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-strong)',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '13px',
            }}
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="PUBLISHED">Đã xuất bản</option>
            <option value="REVIEW">Chờ duyệt</option>
            <option value="DRAFT">Bản nháp</option>
          </select>
        </div>
      </div>

      {/* Desktop Table View */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              textAlign: 'left',
              minWidth: '780px',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--muted)', width: '100px' }}>
                  Mã & Cấp
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--muted)' }}>
                  Học liệu Video & Bài học
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--muted)', width: '130px' }}>
                  Thời lượng
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--muted)', width: '110px' }}>
                  Phụ đề
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--muted)', width: '130px' }}>
                  Trạng thái
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--muted)', textAlign: 'right', width: '180px' }}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedVideos.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)' }}>
                    Không có video nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                paginatedVideos.map((video) => (
                  <tr
                    key={video.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      transition: 'background-color 0.12s ease',
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{video.id}</div>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          display: 'inline-block',
                          marginTop: '4px',
                        }}
                      >
                        HSK {video.hskLevel}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          style={{
                            width: '56px',
                            height: '38px',
                            borderRadius: 'var(--radius-md)',
                            objectFit: 'cover',
                            border: '1px solid var(--border)',
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                            {video.title}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                            {video.lessonTitle ? video.lessonTitle : `Chủ đề: ${video.topic}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--foreground)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={13} style={{ color: 'var(--muted)' }} />
                        <span>{video.durationFormatted}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                        {video.viewCount} lượt xem
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: video.transcripts.length > 0 ? 'var(--foreground)' : 'var(--muted)',
                        }}
                      >
                        {video.transcripts.length} đoạn
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor:
                            video.status === 'PUBLISHED'
                              ? '#f0fdf4'
                              : video.status === 'REVIEW'
                              ? '#fffbeb'
                              : 'var(--secondary)',
                          color:
                            video.status === 'PUBLISHED'
                              ? '#16a34a'
                              : video.status === 'REVIEW'
                              ? '#d97706'
                              : 'var(--muted)',
                        }}
                      >
                        {video.status === 'PUBLISHED'
                          ? 'Đã xuất bản'
                          : video.status === 'REVIEW'
                          ? 'Chờ duyệt'
                          : 'Bản nháp'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setPreviewVideo(video)}
                          className="ds-btn ds-btn-secondary"
                          style={{ height: '30px', padding: '0 8px', fontSize: '12px', gap: '4px' }}
                          title="Xem trước video & phụ đề"
                        >
                          <Play size={12} /> Xem
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(video)}
                          className="ds-btn ds-btn-outline"
                          style={{ height: '30px', padding: '0 8px', fontSize: '12px', gap: '4px' }}
                          title="Chỉnh sửa video"
                        >
                          <Edit3 size={12} /> Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(video.id)}
                          className="ds-btn ds-btn-ghost ds-btn-icon"
                          style={{ width: '30px', height: '30px', color: 'var(--danger)' }}
                          title="Xóa video"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {videos.length > pageSize && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={videos.length}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 50]}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          itemLabel="video học liệu"
        />
      )}

      {/* Modals */}
      <VideoPreviewModal video={previewVideo} onClose={() => setPreviewVideo(null)} />

      <VideoEditorModal
        isOpen={isEditorOpen}
        video={editingVideo}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingVideo(null);
        }}
        onSave={handleSaveVideo}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 'var(--z-modal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-strong)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <h3 id="delete-confirm-title" style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--foreground)' }}>
              Xác nhận xóa học liệu video?
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn xóa video <strong>{deleteConfirmId}</strong> cùng toàn bộ phụ đề đã đồng bộ không? Thao tác này chỉ có hiệu lực trong phiên bộ nhớ hiện tại.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="ds-btn ds-btn-secondary"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="ds-btn ds-btn-danger"
              >
                Xóa video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default VideoManagementPage;
