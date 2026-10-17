import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Search, Clock, Eye, Sparkles, Film, ArrowLeft } from 'lucide-react';
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

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 20px 48px',
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
              padding: '6px 12px',
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
            padding: '4px 10px',
            borderRadius: '9999px',
            backgroundColor: '#FFF0F1',
            color: '#E60012',
            fontSize: '11px',
            fontWeight: 700,
            border: '1px solid #fed7da',
          }}
        >
          <Sparkles size={13} />
          <span>Dữ liệu Video Demo · Sẵn sàng tích hợp API</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '14px 18px',
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* HSK Level Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>Cấp độ:</span>
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

          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginLeft: '8px', marginRight: '4px' }}>Chủ đề:</span>
          {(['all', 'daily', 'grammar', 'hsk-exam'] as VideoTopicFilter[]).map((tpc) => {
            const isSelected = selectedTopic === tpc;
            const topicLabels: Record<string, string> = {
              all: 'Tất cả',
              daily: 'Giao tiếp',
              grammar: 'Ngữ pháp',
              'hsk-exam': 'Luyện thi',
            };
            return (
              <button
                key={tpc}
                type="button"
                onClick={() => setSelectedTopic(tpc)}
                style={{
                  padding: '4px 10px',
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
                {topicLabels[tpc] || tpc}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo chủ đề, tiêu đề..."
            style={{
              width: '100%',
              padding: '6px 12px 6px 32px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
              color: '#172033',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Video Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {filteredVideos.map((video) => (
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
          >
            {/* Thumbnail Box */}
            <div style={{ position: 'relative', width: '100%', height: '160px', backgroundColor: '#0f172a' }}>
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
              />
              {/* Play Icon Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.2)',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(230, 0, 18, 0.9)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  <Play size={18} fill="currentColor" style={{ marginLeft: '2px' }} />
                </div>
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

              {/* Demo Badge */}
              <div
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '10px',
                  backgroundColor: 'rgba(230, 0, 18, 0.9)',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                }}
              >
                DEMO
              </div>
            </div>

            {/* Card Content */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <HSKLevel level={video.hskLevel as 1 | 2 | 3} />
                <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Eye size={12} />
                  <span>{video.viewCount} lượt xem</span>
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
              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#E60012',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Film size={13} />
                  <span>Xem kèm phụ đề tương tác ➜</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoLibraryPage;
