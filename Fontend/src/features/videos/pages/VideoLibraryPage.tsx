import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Search, Clock, Eye, Sparkles, Film, ArrowLeft, RotateCcw, VideoOff } from 'lucide-react';
import { DEMO_VIDEOS } from '../data/demoVideos';
import type { VideoFilterLevel, VideoTopicFilter } from '../types';
import { HSKLevel } from '../../../design-system';

export const VideoLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<VideoFilterLevel>('all');
  const [selectedTopic, setSelectedTopic] = useState<VideoTopicFilter>('all');

  const filteredVideos = useMemo(() => {
    return DEMO_VIDEOS.filter((video) => {
      if (selectedLevel !== 'all' && video.hskLevel !== selectedLevel) return false;
      if (selectedTopic !== 'all' && video.topic !== selectedTopic) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = video.title.toLowerCase().includes(q);
        const matchChinese = video.chineseTitle.includes(q);
        const matchDesc = video.description.toLowerCase().includes(q);
        return matchTitle || matchChinese || matchDesc;
      }
      return true;
    });
  }, [searchQuery, selectedLevel, selectedTopic]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedLevel('all');
    setSelectedTopic('all');
  };

  const topicOptions: { id: VideoTopicFilter; label: string }[] = [
    { id: 'all', label: 'Tất cả chủ đề' },
    { id: 'daily', label: 'Giao tiếp hàng ngày' },
    { id: 'food', label: 'Ẩm thực & Mua sắm' },
    { id: 'travel', label: 'Du lịch & Đời sống' },
    { id: 'grammar', label: 'Ngữ pháp thực dụng' },
    { id: 'hsk-exam', label: 'Luyện thi HSK' },
    { id: 'culture', label: 'Văn hóa & Phong tục' },
  ];

  return (
    <div
      className="student-content-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
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
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#172033', margin: 0 }}>
              Học qua Video
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Xem video ngữ cảnh thực tế, luyện nghe phản xạ và học từ vựng kèm phụ đề tương tác
            </p>
          </div>
        </div>

        {/* Demo Tag Notice */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '9999px',
            backgroundColor: '#FFF0F1',
            color: '#E60012',
            fontSize: '11px',
            fontWeight: 700,
            border: '1px solid #fed7da',
          }}
        >
          <Sparkles size={13} />
          <span>Dữ liệu Video Demo · Phân biệt rõ nguồn phát</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          padding: '16px 20px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Top row: Search input & count */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo chủ đề, tiêu đề tiếng Việt hoặc chữ Hán..."
              style={{
                width: '100%',
                padding: '8px 14px 8px 36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#172033',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
            Hiển thị <strong>{filteredVideos.length}</strong> bài học video
          </div>
        </div>

        {/* Bottom row: Filter pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* HSK Level Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Cấp độ:</span>
            {(['all', 1, 2, 3] as VideoFilterLevel[]).map((lvl) => {
              const isSelected = selectedLevel === lvl;
              return (
                <button
                  key={String(lvl)}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    border: isSelected ? '1px solid #E60012' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#E60012' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#475569',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {lvl === 'all' ? 'Tất cả HSK' : `HSK ${lvl}`}
                </button>
              );
            })}
          </div>

          {/* Topic Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Chủ đề:</span>
            {topicOptions.map((opt) => {
              const isSelected = selectedTopic === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedTopic(opt.id)}
                  style={{
                    padding: '4px 11px',
                    borderRadius: '9999px',
                    border: isSelected ? '1px solid #E60012' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#FFF0F1' : '#ffffff',
                    color: isSelected ? '#E60012' : '#64748b',
                    fontSize: '11px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Video Cards Grid or Empty State */}
      {filteredVideos.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredVideos.map((video) => {
            const isPlayable = Boolean(video.hasPlayableVideo && video.videoUrl);
            return (
              <div
                key={video.id}
                onClick={() => navigate(`/videos/${video.id}`)}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
                }}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/videos/${video.id}`);
                  }
                }}
              >
                {/* Thumbnail Box */}
                <div style={{ position: 'relative', width: '100%', height: '160px', backgroundColor: '#0f172a' }}>
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isPlayable ? 0.9 : 0.75 }}
                  />

                  {/* Play Icon or Preview Tag Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.25)',
                    }}
                  >
                    {isPlayable ? (
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(230, 0, 18, 0.95)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        }}
                      >
                        <Play size={18} fill="currentColor" style={{ marginLeft: '2px' }} />
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '6px 12px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(15, 23, 42, 0.85)',
                          color: '#e2e8f0',
                          fontSize: '11px',
                          fontWeight: 700,
                          backdropFilter: 'blur(4px)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <VideoOff size={13} style={{ color: '#f87171' }} />
                        <span>Xem trước phụ đề</span>
                      </div>
                    )}
                  </div>

                  {/* Duration Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      right: '10px',
                      bottom: '10px',
                      backgroundColor: 'rgba(0,0,0,0.75)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Clock size={11} />
                    <span>{video.durationLabel}</span>
                  </div>

                  {/* Playable vs Preview Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '10px',
                      backgroundColor: isPlayable ? 'rgba(22, 163, 74, 0.95)' : 'rgba(230, 0, 18, 0.9)',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {isPlayable ? 'Có video phát' : 'Demo phụ đề'}
                  </div>
                </div>

                {/* Card Content */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                    <HSKLevel level={(video.hskLevel >= 7 ? '7-9' : video.hskLevel) as 1 | 2 | 3 | 4 | 5 | 6 | '7-9'} />
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Eye size={12} />
                      <span>{video.viewCount} lượt xem (Demo)</span>
                    </span>
                  </div>

                  <h2
                    style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: '#172033',
                      margin: '0 0 4px 0',
                      lineHeight: 1.35,
                    }}
                  >
                    {video.title}
                  </h2>

                  <div
                    style={{
                      fontFamily: 'var(--font-hanzi)',
                      fontSize: '13px',
                      color: '#E60012',
                      fontWeight: 600,
                      marginBottom: '8px',
                    }}
                  >
                    {video.chineseTitle}
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      color: '#64748b',
                      lineHeight: 1.4,
                      flex: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {video.description}
                  </p>

                  {/* Bottom CTA */}
                  <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: isPlayable ? '#E60012' : '#475569',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Film size={13} />
                      <span>{isPlayable ? 'Xem video phát ➜' : 'Xem phụ đề & Từ vựng ➜'}</span>
                    </span>

                    {!isPlayable && (
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Chưa có nguồn</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* EMPTY STATE WHEN NO VIDEOS MATCH FILTERS */
        <div
          style={{
            padding: '48px 24px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FFF0F1',
              color: '#E60012',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Film size={32} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#172033', margin: '0 0 6px 0' }}>
            Không tìm thấy video phù hợp
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 18px 0', maxWidth: '420px', lineHeight: 1.5 }}>
            Không có bài học video nào khớp với bộ lọc cấp độ hoặc từ khóa tìm kiếm đã chọn. Hãy thử chọn cấp độ khác hoặc xóa bộ lọc.
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#E60012',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(230, 0, 18, 0.25)',
            }}
          >
            <RotateCcw size={14} />
            <span>Xóa bộ lọc tìm kiếm</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoLibraryPage;
