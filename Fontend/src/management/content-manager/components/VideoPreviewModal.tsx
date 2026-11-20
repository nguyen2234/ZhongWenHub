import React, { useEffect } from 'react';
import { X, Clock, BookOpen, ExternalLink } from 'lucide-react';
import type { LearningVideoItem } from '../types/video.types';

export interface VideoPreviewModalProps {
  video: LearningVideoItem | null;
  onClose: () => void;
}

export const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({ video, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!video) return null;

  const isYouTube = video.sourceType?.toLowerCase() === 'youtube';
  const ytId = video.youtubeVideoId || video.youTubeVideoId;
  const videoSourceUrl = video.storagePath
    ? video.storagePath.startsWith('http')
      ? video.storagePath
      : `/uploads/${video.storagePath.replace(/^\/+/, '')}`
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-preview-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '850px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: isYouTube ? '#fee2e2' : '#dbeafe',
                color: isYouTube ? '#dc2626' : '#2563eb',
              }}
            >
              {isYouTube ? 'YouTube' : 'Uploaded'}
            </span>
            <h2
              id="video-preview-title"
              style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}
            >
              Xem trước: {video.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            style={{
              border: 'none',
              background: '#f1f5f9',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Player Box (16:9 ratio) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            paddingTop: '56.25%',
            backgroundColor: '#000000',
          }}
        >
          {isYouTube && ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
              title={video.title}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : videoSourceUrl ? (
            <video
              src={videoSourceUrl}
              poster={video.thumbnailUrl}
              controls
              autoPlay
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                gap: '8px',
              }}
            >
              <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
                Không có nguồn phát khả dụng cho video này.
              </p>
            </div>
          )}
        </div>

        {/* Video Metadata Footer */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--primary, #E60012)',
                backgroundColor: '#FFF0F1',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              HSK {video.hskLevel}
            </span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#475569',
                backgroundColor: '#f1f5f9',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              {video.topic}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
              <Clock size={13} />
              <span>{video.durationFormatted || '00:00'}</span>
            </span>
            {video.lessonTitle && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#2563eb' }}>
                <BookOpen size={13} />
                <span>{video.lessonTitle}</span>
              </span>
            )}
            {isYouTube && ytId && (
              <a
                href={`https://www.youtube.com/watch?v=${ytId}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: '#dc2626',
                  textDecoration: 'none',
                  fontWeight: 600,
                  marginLeft: 'auto',
                }}
              >
                <span>Xem trên YouTube</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          {video.description && (
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0', lineHeight: 1.5 }}>
              {video.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
