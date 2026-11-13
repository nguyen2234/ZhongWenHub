import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Search,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { useVideoLibrary } from '../hooks/useVideoLibrary';
import { HSKLevel, StickerIllustration } from '../../../design-system';
import '../videos.css';

export const VideoLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    videos,
    loading,
    error,
    totalItems,
    totalPages,
    page,
    setPage,
    searchQuery,
    setSearchQuery,
    selectedLevel,
    setSelectedLevel,
    selectedTopic,
    setSelectedTopic,
    selectedSource,
    setSelectedSource,
    availableTopics,
    refetch,
    resetFilters,
    hasActiveFilters,
  } = useVideoLibrary({ pageSize: 12 });

  return (
    <div className="video-library-root student-content-container">
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Học qua Video
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
                Thư viện video HSK
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#64748b' }}>
              Xem video ngữ cảnh thực tế, luyện nghe khẩu ngữ và phát triển kỹ năng đàm thoại tiếng Trung HSK 1–6
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
              fontWeight: 700,
              color: '#334155',
            }}
          >
            <Sparkles size={14} color="var(--primary, #E60012)" />
            <span>{totalItems} video khả dụng</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar Container */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
        }}
      >
        {/* Top Row: Search Input, Topic Selector & Source Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề video hoặc nội dung mô tả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '13.5px',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Topic Dropdown */}
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            aria-label="Lọc theo chủ đề"
            style={{
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">Tất cả chủ đề</option>
            {availableTopics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>

          {/* Source Dropdown */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            aria-label="Lọc theo nguồn phát"
            style={{
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">Tất cả nguồn phát</option>
            <option value="YouTube">YouTube</option>
            <option value="Uploaded">Tự tải lên (Uploaded)</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
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
              <RotateCcw size={13} />
              <span>Đặt lại bộ lọc</span>
            </button>
          )}
        </div>

        {/* Bottom Row: HSK Level Pills (HSK 1 to 6) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>
              Cấp độ HSK:
            </span>
            {(['all', 1, 2, 3, 4, 5, 6] as (number | 'all')[]).map((lvl) => {
              const active = selectedLevel === lvl;
              return (
                <button
                  key={String(lvl)}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    border: '1px solid',
                    borderColor: active ? 'var(--primary, #E60012)' : '#e2e8f0',
                    backgroundColor: active ? 'var(--primary, #E60012)' : '#ffffff',
                    color: active ? '#ffffff' : '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {lvl === 'all' ? 'Tất cả' : `HSK ${lvl}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area: Loading, Error, Empty, or Video Grid */}
      {loading ? (
        /* Loading Skeleton Grid */
        <div className="video-grid-container" aria-label="Đang tải danh sách video">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="video-card-item"
              style={{ pointerEvents: 'none', opacity: 0.7 }}
            >
              <div
                className="video-thumbnail-wrap"
                style={{
                  backgroundColor: '#f1f5f9',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
              <div className="video-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ width: '40%', height: '18px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
                <div style={{ width: '90%', height: '20px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
                <div style={{ width: '70%', height: '14px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
                <div style={{ width: '50%', height: '14px', backgroundColor: '#f1f5f9', borderRadius: '4px', marginTop: 'auto' }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State with Retry Button */
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #fee2e2',
            padding: '36px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626',
            }}
          >
            <AlertCircle size={24} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Không thể tải danh sách video
          </h3>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0, maxWidth: '420px' }}>
            {error}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            style={{
              marginTop: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'var(--primary, #E60012)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} />
            <span>Thử lại</span>
          </button>
        </div>
      ) : videos.length > 0 ? (
        /* Video Grid */
        <div className="video-grid-container">
          {videos.map((video) => {
            const isYouTube = video.sourceType.toLowerCase() === 'youtube';

            return (
              <div
                key={video.id}
                className="video-card-item"
                onClick={() => navigate(`/videos/${video.id}`)}
                role="article"
                aria-label={`Xem video: ${video.title}`}
              >
                {/* 16:9 Thumbnail with centered play overlay */}
                <div className="video-thumbnail-wrap">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="video-thumbnail-img"
                    loading="lazy"
                  />

                  {/* Source indicator tag */}
                  <span
                    className="video-source-badge"
                    style={{
                      backgroundColor: isYouTube ? '#dc2626' : '#2563eb',
                      color: '#ffffff',
                    }}
                  >
                    {isYouTube ? 'YouTube' : 'Tự tải lên'}
                  </span>

                  {/* Play Overlay Button */}
                  <button
                    type="button"
                    className="video-play-overlay-btn"
                    aria-label={`Phát video ${video.title}`}
                  >
                    <Play size={18} fill="currentColor" style={{ marginLeft: '2px' }} />
                  </button>

                  {/* Duration Label */}
                  <span className="video-duration-badge">{video.durationFormatted}</span>
                </div>

                {/* Card Body */}
                <div className="video-card-body">
                  <div className="video-meta-row">
                    <HSKLevel level={video.hskLevel as any} />
                    <span className="video-topic-tag">{video.topic}</span>
                  </div>

                  <h3 className="video-card-vi-title" title={video.title}>
                    {video.title}
                  </h3>

                  {video.description && (
                    <p className="video-card-desc">{video.description}</p>
                  )}

                  <div className="video-card-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {video.lessonTitle && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            color: 'var(--primary, #E60012)',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                          title={`Bài học: ${video.lessonTitle}`}
                        >
                          <BookOpen size={12} />
                          <span>{video.lessonTitle}</span>
                        </span>
                      )}
                    </div>

                    <span style={{ color: '#64748b', fontSize: '11px' }}>
                      {video.viewCount} lượt xem
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State with Chibi Mascot */
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <StickerIllustration name="empty" size="lg" alt="Không tìm thấy video" />
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Không tìm thấy video phù hợp
          </h3>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0, maxWidth: '420px' }}>
            Không có video nào khớp với bộ lọc hoặc từ khóa tìm kiếm của bạn. Hãy thử thay đổi cấp độ hoặc từ khóa.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              style={{
                marginTop: '8px',
                padding: '9px 18px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: 'var(--primary, #E60012)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Xóa tất cả bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '8px',
            padding: '16px 0',
          }}
          aria-label="Điều hướng phân trang"
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            aria-label="Trang trước"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '7px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: page <= 1 ? '#cbd5e1' : '#334155',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <ChevronLeft size={16} />
            <span>Trước</span>
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            const active = pageNum === page;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setPage(pageNum)}
                aria-current={active ? 'page' : undefined}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  border: active ? '1px solid var(--primary, #E60012)' : '1px solid #e2e8f0',
                  backgroundColor: active ? 'var(--primary, #E60012)' : '#ffffff',
                  color: active ? '#ffffff' : '#475569',
                  fontWeight: active ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            aria-label="Trang sau"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '7px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: page >= totalPages ? '#cbd5e1' : '#334155',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <span>Sau</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
