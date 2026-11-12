import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import type { VideoContent, VideoStatus, TranscriptSegment } from '../types/video.types';
import { TranscriptEditor } from './TranscriptEditor';

export interface VideoEditorModalProps {
  isOpen: boolean;
  video: VideoContent | null; // null = create new
  onClose: () => void;
  onSave: (data: {
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
  }) => void;
}

export const VideoEditorModal: React.FC<VideoEditorModalProps> = ({
  isOpen,
  video,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'METADATA' | 'TRANSCRIPT'>('METADATA');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hskLevel, setHskLevel] = useState<number>(1);
  const [topic, setTopic] = useState('Giao tiếp hàng ngày');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [status, setStatus] = useState<VideoStatus>('DRAFT');
  const [tagsString, setTagsString] = useState('');
  const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (video) {
      setTitle(video.title);
      setDescription(video.description);
      setHskLevel(video.hskLevel);
      setTopic(video.topic);
      setVideoUrl(video.videoUrl);
      setThumbnailUrl(video.thumbnailUrl);
      setLessonTitle(video.lessonTitle || '');
      setStatus(video.status);
      setTagsString(video.tags.join(', '));
      setTranscripts(video.transcripts || []);
    } else {
      setTitle('');
      setDescription('');
      setHskLevel(1);
      setTopic('Giao tiếp hàng ngày');
      setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
      setThumbnailUrl('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80&auto=format&fit=crop');
      setLessonTitle('');
      setStatus('DRAFT');
      setTagsString('HSK 1, Giao tiếp');
      setTranscripts([]);
    }
    setActiveTab('METADATA');
    setErrorMessage('');
  }, [video, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Tiêu đề video không được để trống.');
      return;
    }
    if (!videoUrl.trim()) {
      setErrorMessage('Đường dẫn video (URL) không được để trống.');
      return;
    }

    const tags = tagsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({
      title: title.trim(),
      description: description.trim(),
      hskLevel,
      topic,
      videoUrl: videoUrl.trim(),
      thumbnailUrl: thumbnailUrl.trim() || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80&auto=format&fit=crop',
      lessonTitle: lessonTitle.trim(),
      status,
      tags,
      transcripts,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-editor-title"
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
          maxWidth: '820px',
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
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3
              id="video-editor-title"
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--foreground)',
              }}
            >
              {video ? `Biên tập video: ${video.id}` : 'Thêm học liệu video mới'}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Biên soạn siêu dữ liệu bài học và phụ đề ba thứ tiếng (Trung, Pinyin, Việt).
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ds-btn ds-btn-ghost ds-btn-icon"
            style={{ width: '32px', height: '32px' }}
            aria-label="Đóng cửa sổ"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            padding: '0 20px',
            backgroundColor: 'var(--background)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('METADATA')}
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: activeTab === 'METADATA' ? 700 : 500,
              color: activeTab === 'METADATA' ? 'var(--primary)' : 'var(--muted)',
              borderBottom: `2px solid ${activeTab === 'METADATA' ? 'var(--primary)' : 'transparent'}`,
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
            }}
          >
            1. Thông tin chung & Học phần
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TRANSCRIPT')}
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: activeTab === 'TRANSCRIPT' ? 700 : 500,
              color: activeTab === 'TRANSCRIPT' ? 'var(--primary)' : 'var(--muted)',
              borderBottom: `2px solid ${activeTab === 'TRANSCRIPT' ? 'var(--primary)' : 'transparent'}`,
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            2. Phụ đề & Lời thoại
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--secondary)',
                color: 'var(--foreground)',
              }}
            >
              {transcripts.length}
            </span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {errorMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger)',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {activeTab === 'METADATA' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                    Tiêu đề video <span style={{ color: 'var(--primary)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Giao tiếp hàng ngày: Chào hỏi và làm quen"
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-strong)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--foreground)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                      Cấp độ HSK
                    </label>
                    <select
                      value={hskLevel}
                      onChange={(e) => setHskLevel(Number(e.target.value))}
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-strong)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--foreground)',
                        fontSize: '13px',
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
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                      Chủ đề bài học
                    </label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-strong)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--foreground)',
                        fontSize: '13px',
                      }}
                    >
                      <option value="Giao tiếp hàng ngày">Giao tiếp hàng ngày</option>
                      <option value="Mua sắm & Đời sống">Mua sắm & Đời sống</option>
                      <option value="Du lịch & Giao thông">Du lịch & Giao thông</option>
                      <option value="Công sở & Nghề nghiệp">Công sở & Nghề nghiệp</option>
                      <option value="Văn hóa & Xã hội">Văn hóa & Xã hội</option>
                      <option value="Ẩm thực Trung Hoa">Ẩm thực Trung Hoa</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                      Trạng thái xuất bản
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as VideoStatus)}
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-strong)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--foreground)',
                        fontSize: '13px',
                      }}
                    >
                      <option value="DRAFT">Bản nháp (DRAFT)</option>
                      <option value="REVIEW">Chờ duyệt (REVIEW)</option>
                      <option value="PUBLISHED">Đã xuất bản (PUBLISHED)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                    Bài học liên kết trong Giáo trình
                  </label>
                  <input
                    type="text"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="Ví dụ: HSK 1 - Bài 1: Chào hỏi (你好)"
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-strong)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--foreground)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                    Mô tả nội dung tóm tắt
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tóm tắt nội dung video, từ vựng trọng tâm và ngữ pháp xuất hiện..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-strong)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--foreground)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                      URL Tệp Video (MP4 / WebM / HLS) <span style={{ color: 'var(--primary)' }}>*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://..."
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-strong)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--foreground)',
                        fontSize: '13px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                      Ảnh bìa Thumbnail URL
                    </label>
                    <input
                      type="url"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-strong)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--foreground)',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                    Thẻ từ khóa (Tags, phân cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={tagsString}
                    onChange={(e) => setTagsString(e.target.value)}
                    placeholder="Chào hỏi, Phát âm, HSK 1..."
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-strong)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--foreground)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>
            ) : (
              <TranscriptEditor transcripts={transcripts} onChange={setTranscripts} />
            )}
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--background)',
            }}
          >
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Lưu bản nháp hoặc cập nhật học liệu trong phiên làm việc.
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={onClose} className="ds-btn ds-btn-secondary">
                Hủy bỏ
              </button>
              <button type="submit" className="ds-btn ds-btn-primary">
                <CheckCircle2 size={15} /> Lưu học liệu
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
export default VideoEditorModal;
