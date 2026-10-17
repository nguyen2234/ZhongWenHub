import React, { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Sparkles,
  BookOpen,
  BookmarkCheck,
  Film,
  Layers,
  VideoOff,
  Info,
} from 'lucide-react';
import { DEMO_VIDEOS } from '../data/demoVideos';
import { HSKLevel } from '../../../design-system';
import { useLearningState } from '../../learning';

export const VideoDetailPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { addVocabularyWord, isVocabularySaved } = useLearningState();

  const video = DEMO_VIDEOS.find((v) => v.id === videoId) || DEMO_VIDEOS[0];
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.durationSeconds);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'subtitles' | 'vocab'>('subtitles');
  const [localSavedIds, setLocalSavedIds] = useState<Record<string, boolean>>({});
  const [savedAlert, setSavedAlert] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  const hasPlayableSource = Boolean(video.videoUrl && video.hasPlayableVideo);

  // Play / Pause handler
  const handleTogglePlay = useCallback(() => {
    if (!hasPlayableSource || !videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [hasPlayableSource]);

  // Seek handler - jumps HTML5 video and state
  const handleSeek = useCallback((time: number) => {
    if (hasPlayableSource && videoRef.current) {
      videoRef.current.currentTime = time;
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    } else {
      // In preview-only mode, only update selected time for reading
      setCurrentTime(time);
    }
  }, [hasPlayableSource]);

  // Restart handler
  const handleRestart = useCallback(() => {
    handleSeek(0);
  }, [handleSeek]);

  // Real SRS Vocabulary persistence
  const handleSaveToSRS = useCallback((hanzi: string, pinyin: string, meaning: string) => {
    const alreadySaved = isVocabularySaved(hanzi) || localSavedIds[hanzi];
    if (alreadySaved) {
      setSavedAlert({
        type: 'info',
        message: `Từ "${hanzi} (${pinyin})" đã có trong sổ từ của bạn.`,
      });
      setTimeout(() => setSavedAlert(null), 3000);
      return;
    }

    const result = addVocabularyWord({
      hanzi,
      pinyin,
      meaning,
      hskLevel: video.hskLevel,
      source: `Video: ${video.title}`,
    });

    setLocalSavedIds((prev) => ({ ...prev, [hanzi]: true }));

    if (result.isNew) {
      setSavedAlert({
        type: 'success',
        message: `Đã thêm từ "${hanzi} (${pinyin})" vào danh sách ôn tập Spaced Repetition!`,
      });
    } else {
      setSavedAlert({
        type: 'info',
        message: `Từ "${hanzi}" đã tồn tại trong sổ từ.`,
      });
    }
    setTimeout(() => setSavedAlert(null), 3500);
  }, [addVocabularyWord, isVocabularySaved, localSavedIds, video.hskLevel, video.title]);

  // Pronunciation handler
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Ignore audio playback errors
      }
    }
  };

  // Find active subtitle line based on currentTime
  const activeSubtitleIndex = video.subtitles.findIndex(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '24px 20px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Back and Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <button
          type="button"
          onClick={() => navigate('/videos')}
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
          <span>Trở về thư viện Video</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HSKLevel level={(video.hskLevel >= 7 ? '7-9' : video.hskLevel) as 1 | 2 | 3 | 4 | 5 | 6 | '7-9'} />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: hasPlayableSource ? '#f0fdf4' : '#FFF0F1',
              color: hasPlayableSource ? '#16a34a' : '#E60012',
            }}
          >
            {hasPlayableSource ? 'VIDEO KHẢ DỤNG' : 'BẢN XEM TRƯỚC PHỤ ĐỀ (DEMO)'}
          </span>
        </div>
      </div>

      {/* Alert Banner */}
      {savedAlert && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '10px',
            backgroundColor: savedAlert.type === 'success' ? '#f0fdf4' : '#eff6ff',
            border: savedAlert.type === 'success' ? '1px solid #bbf7d0' : '1px solid #bfdbfe',
            color: savedAlert.type === 'success' ? '#15803d' : '#1d4ed8',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          role="status"
        >
          {savedAlert.type === 'success' ? <BookmarkCheck size={16} /> : <Info size={16} />}
          <span>{savedAlert.message}</span>
        </div>
      )}

      {/* Main 2-Pane Layout (Player on Left, Subtitles on Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: '24px',
        }}
        className="video-detail-grid"
      >
        {/* Left: Video Player Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Player Container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 9',
              backgroundColor: '#090d16',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            }}
          >
            {hasPlayableSource ? (
              /* REAL HTML5 VIDEO PLAYER */
              <video
                ref={videoRef}
                src={video.videoUrl}
                poster={video.thumbnailUrl}
                playsInline
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || video.durationSeconds)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              /* CLEAN NON-PLAYABLE STATE - NO FAKE TIMER */
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  padding: '24px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(230, 0, 18, 0.15)',
                    color: '#E60012',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <VideoOff size={28} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px 0' }}>
                  Chưa có video để phát
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px 0', maxWidth: '380px', lineHeight: 1.45 }}>
                  Nguồn video thực tế cho bài học này đang được chuẩn bị và đồng bộ API. Bạn có thể theo dõi kịch bản hội thoại và lưu từ vựng vào SRS ngay bên dưới.
                </p>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    backgroundColor: '#1e293b',
                    color: '#cbd5e1',
                    border: '1px solid #334155',
                  }}
                >
                  Bản xem trước kịch bản phụ đề (Demo Preview)
                </span>
              </div>
            )}

            {/* Top Bar Overlay */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                padding: '12px 16px',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                {video.title}
              </span>
              <span style={{ fontSize: '11px', opacity: 0.85 }}>HSK {video.hskLevel}</span>
            </div>

            {/* Subtitle On-Screen Overlay */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                padding: '14px 16px',
                textAlign: 'center',
                backgroundColor: 'rgba(0,0,0,0.7)',
                margin: '0 16px 12px 16px',
                borderRadius: '12px',
                backdropFilter: 'blur(4px)',
              }}
            >
              {activeSubtitleIndex !== -1 ? (
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-hanzi)',
                      fontSize: '22px',
                      fontWeight: 700,
                      color: '#ffffff',
                      textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                    }}
                  >
                    {video.subtitles[activeSubtitleIndex].hanzi}
                  </div>
                  <div style={{ fontSize: '13px', color: '#ffcdd2', fontWeight: 600, marginTop: '2px' }}>
                    {video.subtitles[activeSubtitleIndex].pinyin}
                  </div>
                  <div style={{ fontSize: '12px', color: '#e2e8f0', marginTop: '4px' }}>
                    {video.subtitles[activeSubtitleIndex].vietnamese}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  {hasPlayableSource
                    ? 'Bấm Phát hoặc chọn câu phụ đề để theo dõi'
                    : 'Bấm vào từng câu phụ đề bên phải để xem chi tiết'}
                </div>
              )}
            </div>

            {/* Controls Bar (Only for playable video or active timeline) */}
            {hasPlayableSource ? (
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  padding: '10px 16px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {/* Progress Slider */}
                <input
                  type="range"
                  min={0}
                  max={duration || video.durationSeconds}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: '#E60012',
                    cursor: 'pointer',
                  }}
                  aria-label="Thanh thời gian video"
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        backgroundColor: '#E60012',
                        color: '#ffffff',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease',
                      }}
                      title={isPlaying ? 'Tạm dừng' : 'Phát'}
                      aria-label={isPlaying ? 'Tạm dừng video' : 'Phát video'}
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
                    </button>

                    <button
                      type="button"
                      onClick={handleRestart}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#cbd5e1',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Phát lại từ đầu"
                    >
                      <RotateCcw size={15} />
                    </button>

                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
                    <Volume2 size={15} />
                    <span>Âm lượng chuẩn</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Video Metadata Card */}
          <div
            style={{
              padding: '20px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#172033', margin: 0 }}>
                {video.title}
              </h1>
              {!hasPlayableSource && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: '#fff7ed',
                    color: '#ea580c',
                    border: '1px solid #ffedd5',
                  }}
                >
                  Chưa có nguồn phát
                </span>
              )}
            </div>

            <div style={{ fontFamily: 'var(--font-hanzi)', fontSize: '14px', color: '#E60012', fontWeight: 700, marginBottom: '12px' }}>
              {video.chineseTitle}
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
              {video.description}
            </p>
          </div>
        </div>

        {/* Right: Interactive Subtitle Transcript & Vocabulary */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            maxHeight: '680px',
          }}
        >
          {/* Subtitle Tabs Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fafbfc',
            }}
          >
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('subtitles')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: activeTab === 'subtitles' ? '1px solid #fed7da' : '1px solid transparent',
                  backgroundColor: activeTab === 'subtitles' ? '#FFF0F1' : 'transparent',
                  color: activeTab === 'subtitles' ? '#E60012' : '#64748b',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Film size={14} />
                <span>Phụ đề song ngữ ({video.subtitles.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('vocab')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: activeTab === 'vocab' ? '1px solid #fed7da' : '1px solid transparent',
                  backgroundColor: activeTab === 'vocab' ? '#FFF0F1' : 'transparent',
                  color: activeTab === 'vocab' ? '#E60012' : '#64748b',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Layers size={14} />
                <span>Từ vựng trọng tâm</span>
              </button>
            </div>

            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {hasPlayableSource ? 'Bấm câu để tua' : 'Bấm để đọc'}
            </span>
          </div>

          {/* Subtitle List */}
          {activeTab === 'subtitles' ? (
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {video.subtitles.map((sub, index) => {
                const isActive = activeSubtitleIndex === index;
                return (
                  <div
                    key={sub.id}
                    onClick={() => handleSeek(sub.startTime)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: isActive ? '1.5px solid #E60012' : '1px solid #f1f5f9',
                      backgroundColor: isActive ? '#FFF0F1' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSeek(sub.startTime);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: isActive ? '#E60012' : '#94a3b8',
                        }}
                      >
                        {formatTime(sub.startTime)}
                      </span>
                      {isActive && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#E60012',
                            color: '#ffffff',
                          }}
                        >
                          Đang phát
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        fontFamily: 'var(--font-hanzi)',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#172033',
                        marginBottom: '2px',
                      }}
                    >
                      {sub.hanzi}
                    </div>

                    <div style={{ fontSize: '12px', color: '#E60012', fontWeight: 600 }}>
                      {sub.pinyin}
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {sub.vietnamese}
                    </div>

                    {/* Word Tokens with Save to SRS */}
                    {sub.tokens && sub.tokens.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #e2e8f0' }}>
                        {sub.tokens.map((tok) => {
                          const isSaved = isVocabularySaved(tok.hanzi) || localSavedIds[tok.hanzi];
                          return (
                            <button
                              key={tok.hanzi}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveToSRS(tok.hanzi, tok.pinyin, tok.meaning);
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                border: isSaved ? '1px solid #86efac' : '1px solid #e2e8f0',
                                backgroundColor: isSaved ? '#f0fdf4' : '#f8fafc',
                                color: isSaved ? '#16a34a' : '#334155',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              title={isSaved ? `"${tok.hanzi}" đã được lưu vào SRS` : `Lưu "${tok.hanzi}" vào SRS`}
                            >
                              {isSaved ? <BookmarkCheck size={12} /> : <BookOpen size={12} />}
                              <span>{tok.hanzi} ({tok.meaning})</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Vocabulary Summary Tab */
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
                Từ vựng then chốt xuất hiện trong video:
              </span>
              {video.subtitles
                .flatMap((s) => s.tokens || [])
                .map((token, idx) => {
                  const isSaved = isVocabularySaved(token.hanzi) || localSavedIds[token.hanzi];
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontFamily: 'var(--font-hanzi)', fontSize: '17px', fontWeight: 800, color: '#172033' }}>
                            {token.hanzi}
                          </span>
                          <span style={{ fontSize: '12px', color: '#E60012', fontWeight: 600 }}>
                            {token.pinyin}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSpeak(token.hanzi)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '2px',
                              cursor: 'pointer',
                              color: '#64748b',
                              display: 'inline-flex',
                            }}
                            title={`Nghe phát âm "${token.hanzi}"`}
                          >
                            <Volume2 size={13} />
                          </button>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          {token.meaning}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveToSRS(token.hanzi, token.pinyin, token.meaning)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: isSaved ? '1px solid #86efac' : '1px solid #E60012',
                          backgroundColor: isSaved ? '#f0fdf4' : '#E60012',
                          color: isSaved ? '#16a34a' : '#ffffff',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {isSaved ? <BookmarkCheck size={13} /> : <Sparkles size={13} />}
                        <span>{isSaved ? 'Đã lưu SRS' : 'Lưu SRS'}</span>
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .video-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default VideoDetailPage;
