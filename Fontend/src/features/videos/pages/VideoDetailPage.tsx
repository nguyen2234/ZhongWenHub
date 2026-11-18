import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  ExternalLink,
  FileText,
  Download,
  Loader2,
} from 'lucide-react';
import { videoLearningService } from '../services/video-learning.service';
import type { LearningVideo } from '../types/video-learning.types';
import { DEMO_VIDEOS } from '../data/demoVideos';
import { HSKLevel } from '../../../design-system';
import '../videos.css';

export const VideoDetailPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();

  const [video, setVideo] = useState<LearningVideo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Mobile Tabs State: 'video' | 'pdf'
  const [activeMobileTab, setActiveMobileTab] = useState<'video' | 'pdf'>('video');

  // Load video from Backend API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadVideo = async () => {
      if (!videoId) {
        setError('Không tìm thấy mã bài học video.');
        setLoading(false);
        return;
      }

      try {
        const data = await videoLearningService.fetchVideoById(videoId);
        if (!isMounted) return;

        if (data) {
          setVideo(data);
        } else {
          // Fallback check for demo fixture (backward-compatibility)
          const fallback = DEMO_VIDEOS.find((v) => v.id === videoId);
          if (fallback) {
            setVideo({
              id: fallback.id,
              title: fallback.title,
              description: fallback.description || '',
              sourceType: fallback.videoSourceType === 'youtube' ? 'YouTube' : 'Uploaded',
              youtubeVideoId: fallback.youtubeVideoId || null,
              storagePath: fallback.videoUrl || null,
              thumbnailUrl: fallback.thumbnailUrl || '',
              durationSeconds: fallback.durationSeconds || 180,
              durationFormatted: videoLearningService.constructor.prototype ? '03:00' : '03:00',
              hskLevel: fallback.hskLevel || 1,
              topic: fallback.topic || 'Luyện nghe HSK',
              status: 'Published',
              viewCount: fallback.viewCount || 100,
              lessonId: null,
              lessonTitle: null,
              transcriptPdfPath: null,
              transcriptPdfName: 'HSK_BaiDoc_Mau.pdf',
              transcriptPdfSizeBytes: 1048576,
              transcriptPdfUrl: null,
              createdAt: new Date().toISOString(),
              updatedAt: null,
            });
          } else {
            setError('Không tìm thấy video bài học hoặc video đã bị ẩn.');
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Lỗi kết nối khi tải video bài học.';
        setError(msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadVideo();

    return () => {
      isMounted = false;
    };
  }, [videoId]);

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="video-detail-root student-content-container" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Loader2 size={32} color="var(--primary, #E60012)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>Đang tải bài học video...</span>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="video-detail-root student-content-container" style={{ padding: '36px 20px', maxWidth: '600px', margin: '0 auto' }}>
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
            Không thể tải bài học video
          </h3>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            {error || 'Bài học này không tồn tại hoặc đã được gỡ bỏ.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/videos')}
            style={{
              marginTop: '8px',
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
            <ArrowLeft size={14} />
            <span>Quay lại thư viện video</span>
          </button>
        </div>
      </div>
    );
  }

  const ytId = video.youtubeVideoId || video.youTubeVideoId || null;
  const pdfUrl = video.transcriptPdfUrl || null;
  const pdfName = video.transcriptPdfName || 'Transcript_TaiLieu.pdf';

  return (
    <div className="video-detail-root student-content-container" style={{ padding: '20px 24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/videos')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: '#475569',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <ArrowLeft size={15} />
          <span>Thư viện video</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HSKLevel level={video.hskLevel as any} />
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#334155' }}>
            {video.topic || 'Luyện nghe HSK'}
          </span>
          {pdfUrl && (
            <a
              href={pdfUrl}
              download={pdfName}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: '#FFF0F1',
                color: 'var(--primary, #E60012)',
                border: '1px solid #fecdd3',
                fontSize: '12.5px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <Download size={14} />
              <span>Tải PDF bài học</span>
            </a>
          )}
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div
        className="video-mobile-tab-bar"
        style={{
          display: 'none', // Handled via responsive CSS or inline media query
          marginBottom: '16px',
        }}
      >
        <button
          type="button"
          className={`video-mobile-tab-btn ${activeMobileTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveMobileTab('video')}
        >
          <span>▶ Video bài giảng</span>
        </button>
        <button
          type="button"
          className={`video-mobile-tab-btn ${activeMobileTab === 'pdf' ? 'active' : ''}`}
          onClick={() => setActiveMobileTab('pdf')}
        >
          <FileText size={15} />
          <span>Tài liệu PDF Transcript</span>
        </button>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* ==========================================
            CỘT TRÁI: VIDEO PLAYER & METADATA
            ========================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* YouTube Embed Container (16:9 Aspect Ratio) */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              paddingBottom: '56.25%', // 16:9 ratio
              height: 0,
              backgroundColor: '#0f172a',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            {ytId ? (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&enablejsapi=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
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
                  padding: '20px',
                  textAlign: 'center',
                }}
              >
                <AlertCircle size={32} color="#f87171" />
                <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                  Không tìm thấy nguồn video YouTube hợp lệ.
                </p>
              </div>
            )}
          </div>

          {/* Video Metadata & External Link */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
                {video.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                <span>Cấp độ: <strong>HSK {video.hskLevel}</strong></span>
                <span>•</span>
                <span>{video.viewCount} lượt xem</span>
              </div>
            </div>

            {video.description && (
              <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                {video.description}
              </p>
            )}

            {ytId && (
              <div style={{ paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                <a
                  href={`https://www.youtube.com/watch?v=${ytId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: 'var(--primary, #E60012)',
                    textDecoration: 'none',
                  }}
                >
                  <span>Xem trực tiếp trên YouTube</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ==========================================
            CỘT PHẢI: PDF TRANSCRIPT VIEWER
            ========================================== */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            minHeight: '520px',
          }}
        >
          {/* PDF Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                  flexShrink: 0,
                }}
              >
                <FileText size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 800,
                    color: '#0f172a',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={pdfName}
                >
                  {pdfName}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {formatFileSize(video.transcriptPdfSizeBytes)} • Tài liệu lời thoại &amp; bài đọc
                </div>
              </div>
            </div>

            {pdfUrl && (
              <a
                href={pdfUrl}
                download={pdfName}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  flexShrink: 0,
                }}
              >
                <Download size={13} />
                <span>Tải về</span>
              </a>
            )}
          </div>

          {/* PDF Viewer Body */}
          <div style={{ flex: 1, minHeight: '480px', position: 'relative', backgroundColor: '#f1f5f9' }}>
            {pdfUrl ? (
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=0`}
                title="Tài liệu PDF Transcript"
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '520px',
                  border: 'none',
                }}
              />
            ) : (
              <div
                style={{
                  padding: '48px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  color: '#64748b',
                  height: '100%',
                }}
              >
                <FileText size={42} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 800, color: '#334155' }}>
                  Chưa có tệp PDF Transcript
                </h4>
                <p style={{ margin: 0, fontSize: '12.5px', maxWidth: '320px', lineHeight: 1.5 }}>
                  Bài học này chưa được đính kèm tài liệu PDF lời thoại hoặc đang được quản trị viên cập nhật.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
