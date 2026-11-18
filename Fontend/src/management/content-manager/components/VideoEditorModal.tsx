import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  Trash2,
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
  availableTopics?: string[];
  onClose: () => void;
  onSaved: (savedVideo: LearningVideoItem) => void;
}

export const VideoEditorModal: React.FC<VideoEditorModalProps> = ({
  isOpen,
  video,
  onClose,
  onSaved,
}) => {
  // Field 1: YouTube Video URL
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [extractedYoutubeId, setExtractedYoutubeId] = useState<string | null>(null);

  // Field 2: HSK Level (1-6)
  const [hskLevel, setHskLevel] = useState<number>(1);

  // Field 3: PDF Transcript
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [existingPdfName, setExistingPdfName] = useState<string | null>(null);
  const [existingPdfSize, setExistingPdfSize] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Progress and submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pdfFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (video) {
      // Edit mode
      const ytId = video.youtubeVideoId || video.youTubeVideoId || null;
      setExtractedYoutubeId(ytId);
      setYoutubeUrl(ytId ? `https://www.youtube.com/watch?v=${ytId}` : '');
      setHskLevel(video.hskLevel || 1);
      setExistingPdfName(video.transcriptPdfName || (video.transcriptPdfPath ? video.transcriptPdfPath.split('/').pop() || null : null));
      setExistingPdfSize(video.transcriptPdfSizeBytes || null);
      setSelectedPdfFile(null);
    } else {
      // Create mode
      setYoutubeUrl('');
      setExtractedYoutubeId(null);
      setHskLevel(1);
      setSelectedPdfFile(null);
      setExistingPdfName(null);
      setExistingPdfSize(null);
    }

    setErrorMessage(null);
    setIsSubmitting(false);
    setUploadProgress(0);
    setStatusText(null);
  }, [video, isOpen]);

  // Handle YouTube URL change & real-time extraction
  const handleYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setYoutubeUrl(val);
    const parsedId = videoManagementService.parseYouTubeUrl(val);
    setExtractedYoutubeId(parsedId);
  };

  // Handle PDF file selection
  const handlePdfChange = (file: File | null) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Chỉ chấp nhận tệp tài liệu định dạng PDF (.pdf).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('Dung lượng tệp PDF không được vượt quá 20 MB.');
      return;
    }

    setErrorMessage(null);
    setSelectedPdfFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePdfChange(file);
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate Field 1: YouTube URL
    const parsedYtId = videoManagementService.parseYouTubeUrl(youtubeUrl);
    if (!parsedYtId) {
      setErrorMessage('Vui lòng nhập đường dẫn YouTube hợp lệ (youtube.com hoặc youtu.be).');
      return;
    }

    // Validate Field 2: HSK Level
    if (hskLevel < 1 || hskLevel > 6) {
      setErrorMessage('Vui lòng chọn cấp độ HSK từ 1 đến 6.');
      return;
    }

    // Validate Field 3: PDF Transcript
    if (!video && !selectedPdfFile) {
      setErrorMessage('Vui lòng tải lên tệp PDF chứa nội dung transcript của video.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let uploadedPdfStoragePath: string | undefined = undefined;
      let uploadedPdfUploadId: string | undefined = undefined;
      let pdfFileName: string | undefined = undefined;
      let pdfFileSize: number | undefined = undefined;

      // 1. Upload PDF if a new file is chosen
      if (selectedPdfFile) {
        setStatusText('Đang tải lên tài liệu PDF transcript...');
        const uploadRes = await videoManagementService.uploadTranscriptPdfFile(selectedPdfFile, (pct) => {
          setUploadProgress(pct);
        });

        uploadedPdfStoragePath = uploadRes.storagePath;
        uploadedPdfUploadId = uploadRes.uploadId;
        pdfFileName = selectedPdfFile.name;
        pdfFileSize = selectedPdfFile.size;
      }

      setStatusText('Đang lưu bài học video vào cơ sở dữ liệu...');

      if (video) {
        // UPDATE existing video
        const updated = await videoManagementService.updateVideoApi(video.id, {
          title: video.title || `HSK ${hskLevel} - Bài học Video (${parsedYtId})`,
          sourceType: 'YouTube',
          youtubeUrl: youtubeUrl.trim(),
          youtubeVideoId: parsedYtId,
          thumbnailUrl: videoManagementService.getYouTubeHqThumbnail(parsedYtId),
          hskLevel,
          topic: video.topic || 'Luyện nghe HSK',
          status: (video.status as any) || 'Published',
          transcriptPdfPath: uploadedPdfStoragePath !== undefined ? uploadedPdfStoragePath : (video.transcriptPdfPath ?? undefined),
          transcriptPdfName: pdfFileName !== undefined ? pdfFileName : (video.transcriptPdfName ?? undefined),
          transcriptPdfSizeBytes: pdfFileSize !== undefined ? pdfFileSize : (video.transcriptPdfSizeBytes ?? undefined),
          transcriptUploadId: uploadedPdfUploadId,
        });

        onSaved(updated);
      } else {
        // CREATE new video
        const created = await videoManagementService.createVideoApi({
          title: `HSK ${hskLevel} - Bài học Video (${parsedYtId})`,
          description: `Bài học video tiếng Trung HSK ${hskLevel} kèm tài liệu PDF transcript.`,
          sourceType: 'YouTube',
          youtubeUrl: youtubeUrl.trim(),
          youtubeVideoId: parsedYtId,
          thumbnailUrl: videoManagementService.getYouTubeHqThumbnail(parsedYtId),
          hskLevel,
          topic: 'Luyện nghe HSK',
          status: 'Published',
          durationSeconds: 180,
          transcriptPdfPath: uploadedPdfStoragePath,
          transcriptPdfName: pdfFileName,
          transcriptPdfSizeBytes: pdfFileSize,
          transcriptUploadId: uploadedPdfUploadId,
        });

        onSaved(created);
      }

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi xử lý lưu video.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
      setStatusText(null);
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
        backdropFilter: 'blur(4px)',
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
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              {video ? 'Chỉnh sửa video bài học' : 'Thêm video bài học mới'}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748b' }}>
              Chỉ cần 3 thông tin: Link video YouTube, Cấp độ HSK và Tệp PDF Transcript
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Error Banner */}
          {errorMessage && (
            <div
              style={{
                backgroundColor: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#be123c',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TRƯỜNG 1: LINK VIDEO YOUTUBE */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 800,
                color: '#1e293b',
                marginBottom: '8px',
              }}
            >
              <span style={{ color: '#dc2626' }}><YoutubeIcon size={16} /></span>
              <span>1. Đường dẫn video YouTube</span>
              <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={youtubeUrl}
              onChange={handleYoutubeUrlChange}
              placeholder="https://www.youtube.com/watch?v=... hoặc youtu.be/..."
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: extractedYoutubeId ? '1.5px solid #22c55e' : '1px solid #cbd5e1',
                fontSize: '13.5px',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: '#f8fafc',
              }}
            />

            {/* Thumbnail Live Preview */}
            {extractedYoutubeId ? (
              <div
                style={{
                  marginTop: '10px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  position: 'relative',
                  backgroundColor: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                }}
              >
                <img
                  src={videoManagementService.getYouTubeHqThumbnail(extractedYoutubeId)}
                  alt="YouTube thumbnail preview"
                  style={{
                    width: '100px',
                    height: '56px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '12px', fontWeight: 700 }}>
                    <CheckCircle2 size={14} />
                    <span>Video ID hợp lệ: {extractedYoutubeId}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Thumbnail được trích xuất tự động chuẩn 16:9 chất lượng cao.
                  </div>
                </div>
              </div>
            ) : youtubeUrl.trim() ? (
              <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#eab308' }}>
                Đang chờ đường dẫn YouTube hợp lệ (ví dụ: https://www.youtube.com/watch?v=4lHwBZr66so)
              </div>
            ) : null}
          </div>

          {/* TRƯỜNG 2: CẤP ĐỘ HSK (1 - 6) */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 800,
                color: '#1e293b',
                marginBottom: '8px',
              }}
            >
              2. Phân loại cấp độ HSK <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
              {[1, 2, 3, 4, 5, 6].map((lvl) => {
                const isSelected = hskLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setHskLevel(lvl)}
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 4px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid var(--primary, #E60012)' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#FFF0F1' : '#ffffff',
                      color: isSelected ? 'var(--primary, #E60012)' : '#475569',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'center',
                    }}
                  >
                    HSK {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TRƯỜNG 3: TÀI LIỆU PDF TRANSCRIPT */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '13px',
                fontWeight: 800,
                color: '#1e293b',
                marginBottom: '8px',
              }}
            >
              <span>3. Tài liệu PDF Transcript {!video && <span style={{ color: '#ef4444' }}>*</span>}</span>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b' }}>Tối đa 20 MB</span>
            </label>

            <input
              ref={pdfFileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePdfChange(file);
              }}
            />

            {/* Existing PDF info when editing */}
            {existingPdfName && !selectedPdfFile && (
              <div
                style={{
                  marginBottom: '10px',
                  padding: '10px 14px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <FileText size={18} color="#dc2626" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {existingPdfName}
                    </div>
                    {existingPdfSize && (
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {formatFileSize(existingPdfSize)} • File hiện tại
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => pdfFileInputRef.current?.click()}
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--primary, #E60012)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 8px',
                  }}
                >
                  Thay file PDF khác
                </button>
              </div>
            )}

            {/* Selected new PDF file */}
            {selectedPdfFile ? (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '12px',
                  border: '1.5px solid #22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#dcfce7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#16a34a',
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {selectedPdfFile.name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 600 }}>
                      {formatFileSize(selectedPdfFile.size)} • Sẵn sàng tải lên
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPdfFile(null)}
                  disabled={isSubmitting}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '6px',
                  }}
                  title="Xóa lựa chọn"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : !existingPdfName ? (
              /* Dropzone for new video */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => pdfFileInputRef.current?.click()}
                style={{
                  border: isDragOver ? '2px dashed var(--primary, #E60012)' : '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '28px 16px',
                  textAlign: 'center',
                  backgroundColor: isDragOver ? '#FFF0F1' : '#f8fafc',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: '#fee2e2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#dc2626',
                  }}
                >
                  <UploadCloud size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                    Chọn tệp PDF transcript
                  </span>
                  <span style={{ fontSize: '13px', color: '#64748b' }}> hoặc kéo thả vào đây</span>
                </div>
                <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  Định dạng PDF chứa nội dung hội thoại, từ vựng và bài đọc
                </span>
              </div>
            ) : null}
          </div>

          {/* Upload / Submission Status */}
          {isSubmitting && (
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
                <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>{statusText || 'Đang xử lý...'}</span>
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      backgroundColor: 'var(--primary, #E60012)',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
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
              disabled={isSubmitting}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: isSubmitting ? '#94a3b8' : 'var(--primary, #E60012)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isSubmitting ? 'none' : '0 4px 12px rgba(230, 0, 18, 0.25)',
              }}
            >
              {isSubmitting && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
              <span>{video ? 'Lưu thay đổi' : 'Thêm video'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
