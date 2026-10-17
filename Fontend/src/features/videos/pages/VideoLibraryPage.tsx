import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Search,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Mic,
  CheckCircle2,
} from 'lucide-react';
import { DEMO_VIDEOS } from '../data/demoVideos';
import type { VideoFilterLevel, VideoTopicFilter, VideoSourceFilter } from '../types';
import { HSKLevel, StickerIllustration } from '../../../design-system';
import '../videos.css';

export const VideoLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<VideoFilterLevel>('all');
  const [selectedTopic, setSelectedTopic] = useState<VideoTopicFilter>('all');
  const [selectedSource, setSelectedSource] = useState<VideoSourceFilter>('all');
  const [filterOnlyCaptions, setFilterOnlyCaptions] = useState(false);
  const [filterOnlySpeaking, setFilterOnlySpeaking] = useState(false);

  const filteredVideos = useMemo(() => {
    return DEMO_VIDEOS.filter((video) => {
      // HSK Level filter
      if (selectedLevel !== 'all' && video.hskLevel !== selectedLevel) return false;

      // Topic filter
      if (selectedTopic !== 'all' && video.topic !== selectedTopic) return false;

      // Source filter
      if (selectedSource === 'playable' && !video.hasPlayableVideo) return false;
      if (selectedSource === 'youtube' && video.videoSourceType !== 'youtube') return false;
      if (selectedSource === 'html5' && video.videoSourceType !== 'html5') return false;

      // Feature filters
      if (filterOnlyCaptions && !video.hasCaptions) return false;
      if (filterOnlySpeaking && !video.hasSpeakingPractice) return false;

      // Search query in Vietnamese title, Chinese title, or description
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = video.title.toLowerCase().includes(q);
        const matchChinese = video.chineseTitle.toLowerCase().includes(q);
        const matchDesc = video.description.toLowerCase().includes(q);
        const matchSub = video.subtitles.some(
          (s) => s.hanzi.toLowerCase().includes(q) || s.pinyin.toLowerCase().includes(q) || s.vietnamese.toLowerCase().includes(q)
        );
        return matchTitle || matchChinese || matchDesc || matchSub;
      }

      return true;
    });
  }, [searchQuery, selectedLevel, selectedTopic, selectedSource, filterOnlyCaptions, filterOnlySpeaking]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedLevel('all');
    setSelectedTopic('all');
    setSelectedSource('all');
    setFilterOnlyCaptions(false);
    setFilterOnlySpeaking(false);
  };

  const topicOptions: { id: VideoTopicFilter; label: string }[] = [
    { id: 'all', label: 'Tất cả chủ đề' },
    { id: 'podcast', label: 'Podcast & Đàm thoại' },
    { id: 'daily', label: 'Giao tiếp hàng ngày' },
    { id: 'food', label: 'Ẩm thực & Mua sắm' },
    { id: 'travel', label: 'Du lịch & Đời sống' },
    { id: 'grammar', label: 'Ngữ pháp thực dụng' },
    { id: 'hsk-exam', label: 'Luyện thi HSK' },
    { id: 'culture', label: 'Văn hóa & Phong tục' },
  ];

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
                Tương tác song ngữ
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#64748b' }}>
              Xem video ngữ cảnh thực tế, luyện nghe tua theo câu, học từ vựng kèm phụ đề song ngữ và tự ghi âm luyện nói
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
            <span>{filteredVideos.length} video khả dụng</span>
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
        {/* Top Row: Search Input & Topic Selector */}
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
              placeholder="Tìm theo tên bài, Hán tự, Pinyin hoặc nội dung phụ đề..."
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
            onChange={(e) => setSelectedTopic(e.target.value as VideoTopicFilter)}
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
            {topicOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Source Dropdown */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value as VideoSourceFilter)}
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
            <option value="playable">Phát được ngay</option>
            <option value="youtube">YouTube Embed</option>
            <option value="html5">HTML5 Video</option>
          </select>

          {(searchQuery || selectedLevel !== 'all' || selectedTopic !== 'all' || selectedSource !== 'all' || filterOnlyCaptions || filterOnlySpeaking) && (
            <button
              type="button"
              onClick={handleClearFilters}
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

        {/* Bottom Row: HSK Level Pills & Feature Checkboxes */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {/* HSK Level Pill Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>
              Cấp độ:
            </span>
            {(['all', 1, 2, 3, 4, 5, 6] as VideoFilterLevel[]).map((lvl) => {
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

          {/* Quick feature checkboxes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filterOnlyCaptions}
                onChange={(e) => setFilterOnlyCaptions(e.target.checked)}
                style={{ accentColor: 'var(--primary, #E60012)' }}
              />
              <span>Có phụ đề đồng bộ</span>
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filterOnlySpeaking}
                onChange={(e) => setFilterOnlySpeaking(e.target.checked)}
                style={{ accentColor: 'var(--primary, #E60012)' }}
              />
              <span>Có bài luyện nói</span>
            </label>
          </div>
        </div>
      </div>

      {/* Video Grid Section */}
      {filteredVideos.length > 0 ? (
        <div className="video-grid-container">
          {filteredVideos.map((video) => {
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
                  <span className={`video-source-badge ${video.videoSourceType}`}>
                    {video.videoSourceType === 'youtube'
                      ? 'YouTube'
                      : video.videoSourceType === 'html5'
                      ? 'HTML5'
                      : 'Xem trước'}
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
                  <span className="video-duration-badge">{video.durationLabel}</span>
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

                  <div className="video-card-chinese-title" title={video.chineseTitle}>
                    {video.chineseTitle}
                  </div>

                  <p className="video-card-desc">{video.description}</p>

                  <div className="video-card-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {video.hasCaptions && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#16a34a' }} title="Có phụ đề song ngữ">
                          <CheckCircle2 size={12} />
                          <span>Phụ đề</span>
                        </span>
                      )}
                      {video.hasSpeakingPractice && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--primary, #E60012)' }} title="Có phòng luyện nói câu">
                          <Mic size={12} />
                          <span>Luyện nói</span>
                        </span>
                      )}
                    </div>

                    <span style={{ color: video.hasPlayableVideo ? '#16a34a' : '#64748b' }}>
                      {video.hasPlayableVideo ? 'Sẵn sàng' : 'Xem trước'}
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
          <button
            type="button"
            onClick={handleClearFilters}
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
        </div>
      )}
    </div>
  );
};
