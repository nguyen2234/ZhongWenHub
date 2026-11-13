import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  Play,
  RotateCcw,
} from 'lucide-react';
import type { LearningVideoItem } from '../types/video.types';
import { videoManagementService } from '../services/video-management.service';

const YoutubeIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export interface VideoEditorModalProps {
  isOpen: boolean;
  video: LearningVideoItem | null; // null = create new
  availableTopics: string[];
  onClose: () => void;
  onSaved: (savedVideo: LearningVideoItem) => void;
}

export const VideoEditorModal: React.FC<VideoEditorModalProps> = ({
  isOpen,
  video,
  availableTopics,
  onClose,
  onSaved,
}) => {
  const [sourceType, setSourceType] = useState<'YouTube' | 'Uploaded'>('YouTube');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hskLevel, setHskLevel] = useState<number>(1);
  const [topic, setTopic] = useState('Giao tiếp hàng ngày');
  const [customTopic, setCustomTopic] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Published' | 'Hidden'>('Draft');

  // YouTube source fields
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [extractedYoutubeId, setExtractedYoutubeId] = useState<string | null>(null);

  // Uploaded source fields
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  // Thumbnail fields
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);

  // Duration
  const [durationMinutes, setDurationMinutes] = useState(3);
  const [durationSeconds, setDurationSeconds] = useState(0);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoFileInputRef = useRef<HTMLInputElement | null>(null);
  const thumbFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (video) {
      const isYt = video.sourceType?.toLowerCase() === 'youtube';
      setSourceType(isYt ? 'YouTube' : 'Uploaded');
      setTitle(video.title || '');
      setDescription(video.description || '');
      setHskLevel(video.hskLevel || 1);

      if (availableTopics.includes(video.topic)) {
        setTopic(video.topic);
        setCustomTopic('');
      } else {
        setTopic('__custom__');
        setCustomTopic(video.topic);
      }

      const st = video.status as string;
      if (st === 'Published' || st === 'PUBLISHED') setStatus('Published');
      else if (st === 'Hidden' || st === 'HIDDEN') setStatus('Hidden');
      else setStatus('Draft');

      const ytId = video.youtubeVideoId || video.youTubeVideoId || null;
      setExtractedYoutubeId(ytId);
      setYoutubeUrl(ytId ? `https://www.youtube.com/watch?v=${ytId}` : '');

      setStoragePath(video.storagePath || null);
      setUploadedFileName(video.storagePath ? video.storagePath.split('/').pop() || null : null);
      setUploadId(null);
      setThumbnailUrl(video.thumbnailUrl || '');

      const dur = Math.max(0, video.durationSeconds || 0);
      setDurationMinutes(Math.floor(dur / 60));
      setDurationSeconds(dur % 60);
    } else {
      // Create new defaults
      setSourceType('YouTube');
      setTitle('');
      setDescription('');
      setHskLevel(1);
      setTopic(availableTopics[0] || 'Giao tiếp hàng ngày');
      setCustomTopic('');
      setStatus('Draft');
      setYoutubeUrl('');
      setExtractedYoutubeId(null);
      setStoragePath(null);
      setUploadedFileName(null);
      setUploadId(null);
      setThumbnailUrl('');
      setDurationMinutes(3);
      setDurationSeconds(0);
    }

    setErrorMessage(null);
    setIsUploadingVideo(false);
    setIsUploadingThumb(false);
  }, [video, isOpen, availableTopics]);

  // Handle YouTube URL change & real-time extraction
  const handleYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setYoutubeUrl(val);

    const parsedId = videoManagementService.parseYouTubeUrl(val);
    setExtractedYoutubeId(parsedId);

    if (parsedId && (!thumbnailUrl || thumbnailUrl.includes('img.youtube.com'))) {
      setThumbnailUrl(videoManagementService.getYouTubeHqThumbnail(parsedId));
    }
  };

  // Handle video file upload
  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setErrorMessage('Vui lòng chọn tệp định dạng video hợp lệ (MP4, WebM, MOV).');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage('Dung lượng tệp vượt quá giới hạn cho phép (100 MB).');
      return;
    }

    setIsUploadingVideo(true);
    setVideoUploadProgress(0);
    setErrorMessage(null);

    try {
      const res = await videoManagementService.uploadVideoFile(file, (percent) => {
        setVideoUploadProgress(percent);
      });
      setStoragePath(res.storagePath);
      if (res.uploadId) {
        setUploadId(res.uploadId);
      }
      setUploadedFileName(file.name);
      setVideoUploadProgress(100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tải lên video thất bại.';
      setErrorMessage(msg);
      setStoragePath(null);
      setUploadId(null);
      setUploadedFileName(null);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Handle thumbnail file upload
  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn tệp hình ảnh hợp lệ (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Dung lượng ảnh vượt quá giới hạn cho phép (5 MB).');
      return;
    }

    setIsUploadingThumb(true);
    setErrorMessage(null);

    try {
      const res = await videoManagementService.uploadThumbnailFile(file);
      setThumbnailUrl(res.publicUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tải lên ảnh thumbnail thất bại.';
      setErrorMessage(msg);
    } finally {
      setIsUploadingThumb(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Tiêu đề video không được để trống.');
      return;
    }

    const resolvedTopic = topic === '__custom__' ? customTopic.trim() : topic.trim();
    if (!resolvedTopic) {
      setErrorMessage('Vui lòng chọn hoặc nhập chủ đề cho video.');
      return;
    }

    let finalYtId: string | undefined = undefined;
    if (sourceType === 'YouTube') {
      const parsed = videoManagementService.parseYouTubeUrl(youtubeUrl);
      if (!parsed) {
        setErrorMessage('Vui lòng cung cấp URL YouTube hoặc ID video 11 ký tự hợp lệ.');
        return;
      }
      finalYtId = parsed;
    } else {
      if (!storagePath) {
        setErrorMessage('Vui lòng tải lên tệp video hoặc cung cấp đường dẫn lưu trữ.');
        return;
      }
    }

    const finalThumbnail =
      thumbnailUrl.trim() ||
      (sourceType === 'YouTube' && finalYtId
        ? videoManagementService.getYouTubeHqThumbnail(finalYtId)
        : '');

    if (!finalThumbnail) {
      setErrorMessage('Vui lòng cung cấp ảnh đại diện (Thumbnail URL) cho video.');
      return;
    }

    const totalDurationSeconds = Math.max(0, durationMinutes * 60 + durationSeconds);

    setIsSubmitting(true);

    try {
      if (video) {
        // Update existing video
        const updated = await videoManagementService.updateVideo(video.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          sourceType,
          youtubeUrl: sourceType === 'YouTube' ? youtubeUrl.trim() : undefined,
          youtubeVideoId: sourceType === 'YouTube' ? finalYtId : undefined,
          storagePath: sourceType === 'Uploaded' ? (storagePath ?? undefined) : undefined,
          uploadId: sourceType === 'Uploaded' ? (uploadId ?? undefined) : undefined,
          thumbnailUrl: finalThumbnail,
          durationSeconds: totalDurationSeconds,
          hskLevel,
          topic: resolvedTopic,
          status,
        });
        onSaved(updated);
      } else {
        // Create new video
        const created = await videoManagementService.createVideo({
          title: title.trim(),
          description: description.trim() || undefined,
          sourceType,
          youtubeUrl: sourceType === 'YouTube' ? youtubeUrl.trim() : undefined,
          youtubeVideoId: sourceType === 'YouTube' ? finalYtId : undefined,
          storagePath: sourceType === 'Uploaded' ? (storagePath ?? undefined) : undefined,
          uploadId: sourceType === 'Uploaded' ? (uploadId ?? undefined) : undefined,
          thumbnailUrl: finalThumbnail,
          durationSeconds: totalDurationSeconds,
          hskLevel,
          topic: resolvedTopic,
          status,
        });
        onSaved(created);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi xử lý yêu cầu video.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#FFF0F1',
                color: 'var(--primary, #E60012)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Play size={18} fill="currentColor" />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {video ? 'Chỉnh sửa Video Học Tập' : 'Thêm Video Học Tập Mới'}
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                Hỗ trợ nhúng link YouTube hoặc tải lên tệp video trực tiếp
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng"
            style={{
              border: 'none',
              background: '#f1f5f9',
              borderRadius: '8px',
              padding: '6px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              color: '#64748b',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '20px 22px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {errorMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Source Type Selector Tabs */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Nguồn phát video
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                backgroundColor: '#f1f5f9',
                padding: '4px',
                borderRadius: '10px',
              }}
            >
              <button
                type="button"
                onClick={() => setSourceType('YouTube')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: sourceType === 'YouTube' ? '#ffffff' : 'transparent',
                  color: sourceType === 'YouTube' ? '#dc2626' : '#64748b',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: sourceType === 'YouTube' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <YoutubeIcon size={16} />
                <span>YouTube URL</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('Uploaded')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: sourceType === 'Uploaded' ? '#ffffff' : 'transparent',
                  color: sourceType === 'Uploaded' ? '#2563eb' : '#64748b',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: sourceType === 'Uploaded' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <UploadCloud size={16} />
                <span>Tự tải lên (Uploaded)</span>
              </button>
            </div>
          </div>

          {/* Source-specific input */}
          {sourceType === 'YouTube' ? (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Đường dẫn YouTube <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={handleYoutubeUrlChange}
                placeholder="https://www.youtube.com/watch?v=... hoặc youtu.be/..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  boxSizing: 'border-box',
                }}
              />
              {extractedYoutubeId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12px', color: '#16a34a' }}>
                  <CheckCircle2 size={14} />
                  <span>Mã video hợp lệ: <strong>{extractedYoutubeId}</strong></span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Tệp video <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                }}
                onClick={() => videoFileInputRef.current?.click()}
              >
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  style={{ display: 'none' }}
                  onChange={handleVideoFileChange}
                />
                <UploadCloud size={28} style={{ color: '#64748b', margin: '0 auto 8px auto' }} />
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  {uploadedFileName ? `Đã chọn: ${uploadedFileName}` : 'Nhấn để chọn tệp video (MP4, WebM tối đa 100MB)'}
                </p>
                {isUploadingVideo && (
                  <div style={{ marginTop: '10px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '999px', height: '6px' }}>
                    <div style={{ width: `${videoUploadProgress}%`, backgroundColor: '#2563eb', height: '100%', borderRadius: '999px' }} />
                  </div>
                )}
                {storagePath && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px', fontSize: '12px', color: '#16a34a' }}>
                    <CheckCircle2 size={14} />
                    <span>Tệp đã sẵn sàng trong hệ thống lưu trữ</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Title & Description */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Tiêu đề bài học video <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Hội thoại sơ cấp: Mua sắm hoa quả ở siêu thị"
              maxLength={250}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Mô tả nội dung
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tóm tắt điểm ngữ pháp, từ vựng và bối cảnh hội thoại..."
              rows={3}
              maxLength={2000}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Row: HSK Level & Topic */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Cấp độ HSK
              </label>
              <select
                value={hskLevel}
                onChange={(e) => setHskLevel(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                {[1, 2, 3, 4, 5, 6].map((lvl) => (
                  <option key={lvl} value={lvl}>
                    HSK {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Chủ đề
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                {availableTopics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="__custom__">+ Thêm chủ đề khác...</option>
              </select>

              {topic === '__custom__' && (
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Nhập tên chủ đề mới"
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    boxSizing: 'border-box',
                  }}
                />
              )}
            </div>
          </div>

          {/* Row: Duration & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Thời lượng (Phút : Giây)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="number"
                  min={0}
                  max={240}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  style={{
                    width: '70px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    textAlign: 'center',
                  }}
                />
                <span style={{ fontWeight: 700 }}>:</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                  style={{
                    width: '70px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    textAlign: 'center',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Trạng thái xuất bản
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="Draft">Bản nháp (Draft)</option>
                <option value="Published">Xuất bản công khai (Published)</option>
                <option value="Hidden">Ẩn khỏi thư viện (Hidden)</option>
              </select>
            </div>
          </div>

          {/* Thumbnail Preview and Upload */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Ảnh đại diện (Thumbnail)
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div
                style={{
                  width: '120px',
                  height: '68px',
                  borderRadius: '8px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <ImageIcon size={24} style={{ color: '#94a3b8' }} />
                )}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  type="text"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="URL ảnh hoặc tải ảnh lên bên dưới"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => thumbFileInputRef.current?.click()}
                    disabled={isUploadingThumb}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: isUploadingThumb ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <UploadCloud size={13} />
                    <span>{isUploadingThumb ? 'Đang tải ảnh...' : 'Tải ảnh từ máy tính'}</span>
                  </button>

                  <input
                    ref={thumbFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleThumbnailFileChange}
                  />

                  {sourceType === 'YouTube' && extractedYoutubeId && (
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl(videoManagementService.getYouTubeHqThumbnail(extractedYoutubeId))}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <RotateCcw size={12} />
                      <span>Dùng ảnh YouTube HQ</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div
            style={{
              marginTop: '10px',
              paddingTop: '16px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isUploadingVideo || isUploadingThumb}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 22px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--primary, #E60012)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              <span>{video ? 'Lưu thay đổi' : 'Thêm video'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
