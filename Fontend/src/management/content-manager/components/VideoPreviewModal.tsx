import React, { useRef, useState, useEffect } from 'react';
import { X, Info, Clock, BookOpen } from 'lucide-react';
import type { VideoContent } from '../types/video.types';

export interface VideoPreviewModalProps {
  video: VideoContent | null;
  onClose: () => void;
}

export const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({ video, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(-1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!video) return;
    const segIdx = video.transcripts.findIndex(
      (s) => currentTime >= s.startTime && currentTime <= s.endTime
    );
    setActiveSegmentIndex(segIdx);
  }, [currentTime, video]);

  if (!video) return null;

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };



  const handleSeek = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      if (!isPlaying) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const activeSegment = activeSegmentIndex >= 0 ? video.transcripts[activeSegmentIndex] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-preview-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
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
          maxWidth: '860px',
          maxHeight: '90vh',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-strong)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
              }}
            >
              HSK {video.hskLevel}
            </span>
            <h3
              id="video-preview-title"
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--foreground)',
              }}
            >
              {video.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ds-btn ds-btn-ghost ds-btn-icon"
            style={{ width: '32px', height: '32px' }}
            aria-label="Đóng xem trước"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Player & Realtime Subtitle Overlay */}
        <div style={{ backgroundColor: '#000000', position: 'relative', width: '100%' }}>
          <video
            ref={videoRef}
            src={video.videoUrl}
            poster={video.thumbnailUrl}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            style={{ width: '100%', maxHeight: '380px', display: 'block', margin: '0 auto' }}
            controls
          />

          {/* Active Subtitle Overlay */}
          {activeSegment && (
            <div
              style={{
                position: 'absolute',
                bottom: '60px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.78)',
                color: '#ffffff',
                padding: '8px 18px',
                borderRadius: '8px',
                textAlign: 'center',
                maxWidth: '90%',
                pointerEvents: 'none',
              }}
            >
              <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.5px' }}>
                {activeSegment.textZh}
              </div>
              <div style={{ fontSize: '13px', color: '#fef08a', marginTop: '2px' }}>
                {activeSegment.pinyin}
              </div>
              <div style={{ fontSize: '12px', color: '#e2e8f0', marginTop: '2px' }}>
                {activeSegment.textVi}
              </div>
            </div>
          )}
        </div>

        {/* Video Info Strip */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--background)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'var(--muted)',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={13} /> Thời lượng: <strong>{video.durationFormatted}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <BookOpen size={13} /> Chủ đề: <strong>{video.topic}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={13} />
            <span>Click vào từng câu bên dưới để nhảy trực tiếp đến mốc thời gian đó</span>
          </div>
        </div>

        {/* Synchronized Transcript List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', maxHeight: '240px' }}>
          <h4
            style={{
              margin: '0 0 10px 0',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            Đồng bộ phụ đề ({video.transcripts.length} đoạn)
          </h4>

          {video.transcripts.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--muted)', textAlign: 'center' }}>
              Video này chưa có dữ liệu phụ đề.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {video.transcripts.map((seg, idx) => {
                const isActive = activeSegmentIndex === idx;
                return (
                  <button
                    type="button"
                    key={seg.id}
                    onClick={() => handleSeek(seg.startTime)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isActive ? 'var(--primary-light)' : 'var(--surface)',
                      border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: isActive ? 'var(--primary)' : 'var(--foreground)',
                        }}
                      >
                        {seg.textZh || '—'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                        {seg.pinyin}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--foreground)', marginTop: '2px' }}>
                        {seg.textVi}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: isActive ? 'var(--primary)' : 'var(--muted)',
                        backgroundColor: isActive ? '#ffffff' : 'var(--secondary)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        flexShrink: 0,
                      }}
                    >
                      {seg.startFormatted}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button type="button" onClick={onClose} className="ds-btn ds-btn-secondary">
            Đóng xem trước
          </button>
        </div>
      </div>
    </div>
  );
};
export default VideoPreviewModal;
