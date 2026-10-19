import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Repeat,
  AlertCircle,
  ExternalLink,
  FileText,
  Mic,
  BookOpen,
  Volume2,
  Bookmark,
  Check,
} from 'lucide-react';
import { DEMO_VIDEOS } from '../data/demoVideos';
import type {
  VideoLessonItem,
  VideoSubtitleLine,
  SubtitleToken,
  VideoPlayerAdapter,
  VideoPlaybackState,
} from '../types';
import { Html5VideoAdapter, YouTubeIFrameAdapter, PreviewVideoAdapter } from '../adapters';
import { SynchronizedTranscript } from '../components/SynchronizedTranscript';
import { SpeakingPracticeCard } from '../components/SpeakingPracticeCard';
import { HSKLevel, StickerIllustration } from '../../../design-system';
import { useLearningState } from '../../learning';
import { learningEventStore } from '../../learning/services/learning-event-store.service';
import '../videos.css';

export const VideoDetailPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { addVocabularyWord, isVocabularySaved } = useLearningState();

  const video: VideoLessonItem = useMemo(() => {
    return DEMO_VIDEOS.find((v) => v.id === videoId) || DEMO_VIDEOS[0];
  }, [videoId]);

  // Player state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(video.durationSeconds || 180);
  const [playbackState, setPlaybackState] = useState<VideoPlaybackState>('unstarted');
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // Subtitles & Loop state
  const [loopingSubtitle, setLoopingSubtitle] = useState<VideoSubtitleLine | null>(null);
  const [selectedSpeakingSentence, setSelectedSpeakingSentence] = useState<VideoSubtitleLine | null>(() => {
    return video.subtitles[0] || null;
  });

  // Mobile Tabs State (FE-8): 'transcript' | 'speaking' | 'vocab'
  const [activeMobileTab, setActiveMobileTab] = useState<'transcript' | 'speaking' | 'vocab'>('transcript');

  // Extracted unique vocabulary tokens from video subtitles
  const videoVocabTokens = useMemo(() => {
    const seen = new Set<string>();
    const list: { hanzi: string; pinyin: string; meaning: string }[] = [];
    video.subtitles.forEach((s) => {
      s.tokens?.forEach((t) => {
        if (!seen.has(t.hanzi) && t.hanzi.trim().length > 0) {
          seen.add(t.hanzi);
          list.push({ hanzi: t.hanzi, pinyin: t.pinyin, meaning: t.meaning });
        }
      });
    });
    return list;
  }, [video.subtitles]);

  // Alert toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // References
  const html5VideoRef = useRef<HTMLVideoElement | null>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const adapterRef = useRef<VideoPlayerAdapter | null>(null);
  const sessionIdRef = useRef<string>(`vidsess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Show temporary toast
  const showToast = useCallback((text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Helper to log educational events
  const logVideoEvent = useCallback(
    (
      eventType: any,
      metadata?: Record<string, string | number | boolean>
    ) => {
      try {
        learningEventStore.saveEvent({
          eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          schemaVersion: '1.0.0',
          sessionId: sessionIdRef.current,
          studentId: 'student_current',
          lessonId: video.id,
          hskLevel: video.hskLevel,
          eventType,
          timestamp: Date.now(),
          durationMs: Math.max(0, Date.now() - sessionStartTimeRef.current),
          metadata: {
            videoTitle: video.title,
            sourceType: video.videoSourceType,
            ...metadata,
          },
        });
      } catch {}
    },
    [video.id, video.hskLevel, video.title, video.videoSourceType]
  );

  // 1. Initialize Player Adapter depending on videoSourceType
  useEffect(() => {
    setPlayerError(null);
    setCurrentTime(0);
    setPlaybackState('unstarted');
    setLoopingSubtitle(null);
    setSelectedSpeakingSentence(video.subtitles[0] || null);

    // Clean up previous adapter
    if (adapterRef.current) {
      adapterRef.current.destroy?.();
      adapterRef.current = null;
    }

    if (video.videoSourceType === 'html5') {
      const adapter = new Html5VideoAdapter(html5VideoRef.current);
      adapterRef.current = adapter;

      const unsubscribe = adapter.subscribeToTimeUpdates((time) => {
        setCurrentTime(time);
        const d = adapter.getDuration();
        if (d > 0) setDuration(d);
        setPlaybackState(adapter.getPlaybackState());
      });

      return () => {
        unsubscribe();
        adapter.destroy?.();
      };
    } else if (video.videoSourceType === 'youtube' && video.youtubeVideoId) {
      if (ytContainerRef.current) {
        // Create unique container element for YouTube API
        const ytDiv = document.createElement('div');
        ytDiv.id = `yt_player_${Date.now()}`;
        ytContainerRef.current.innerHTML = '';
        ytContainerRef.current.appendChild(ytDiv);

        const adapter = new YouTubeIFrameAdapter(ytDiv.id, video.youtubeVideoId, {
          onReady: () => {
            const d = adapter.getDuration();
            if (d > 0) setDuration(d);
          },
          onStateChange: (state) => {
            setPlaybackState(state);
          },
          onError: (code) => {
            if (code === 101 || code === 150) {
              setPlayerError('Video YouTube này bị giới hạn nhúng bởi tác giả. Bạn có thể mở trực tiếp trên YouTube hoặc luyện đọc qua bản chép lời bên phải.');
            } else {
              setPlayerError('Không thể phát video YouTube này. Vui lòng thử lại sau.');
            }
          },
        });

        adapterRef.current = adapter;

        const unsubscribe = adapter.subscribeToTimeUpdates((time) => {
          setCurrentTime(time);
          const d = adapter.getDuration();
          if (d > 0) setDuration(d);
        });

        return () => {
          unsubscribe();
          adapter.destroy?.();
        };
      }
    } else {
      // Preview mode
      const adapter = new PreviewVideoAdapter(video.durationSeconds);
      adapterRef.current = adapter;
      const unsubscribe = adapter.subscribeToTimeUpdates((time) => {
        setCurrentTime(time);
      });

      return () => {
        unsubscribe();
        adapter.destroy?.();
      };
    }
  }, [video.id, video.videoSourceType, video.youtubeVideoId, video.durationSeconds, video.subtitles]);

  // Log session start and cleanup session completion
  useEffect(() => {
    logVideoEvent('video_session_started', { totalSubtitles: video.subtitles.length });

    return () => {
      logVideoEvent('video_session_completed');
    };
  }, [logVideoEvent, video.subtitles.length]);

  // 2. Sentence Loop Enforcement
  useEffect(() => {
    if (!loopingSubtitle || !adapterRef.current) return;

    if (currentTime >= loopingSubtitle.endTime) {
      adapterRef.current.seekTo(loopingSubtitle.startTime);
      adapterRef.current.play();
      logVideoEvent('subtitle_repeated', { subtitleId: loopingSubtitle.id });
    }
  }, [currentTime, loopingSubtitle, logVideoEvent]);

  // Active Subtitle Index matching currentTime
  const activeSubtitleIndex = useMemo(() => {
    return video.subtitles.findIndex(
      (s) => currentTime >= s.startTime && currentTime <= s.endTime
    );
  }, [video.subtitles, currentTime]);

  // Controls
  const isPlaying = playbackState === 'playing';

  const handleTogglePlay = () => {
    if (!adapterRef.current) return;
    if (isPlaying) {
      adapterRef.current.pause();
      setPlaybackState('paused');
      logVideoEvent('video_paused', { currentTime });
    } else {
      adapterRef.current.play();
      setPlaybackState('playing');
      logVideoEvent('video_played', { currentTime });
    }
  };

  const handleSeek = (seconds: number) => {
    if (adapterRef.current) {
      adapterRef.current.seekTo(seconds);
      setCurrentTime(seconds);
      logVideoEvent('video_seeked', { seekToSeconds: seconds });
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (adapterRef.current?.setPlaybackRate) {
      adapterRef.current.setPlaybackRate(rate);
    }
  };

  const handleToggleLoopSentence = (sub: VideoSubtitleLine) => {
    if (loopingSubtitle?.id === sub.id) {
      setLoopingSubtitle(null);
      showToast('Đã tắt chế độ lặp câu.', 'info');
    } else {
      setLoopingSubtitle(sub);
      handleSeek(sub.startTime);
      if (adapterRef.current) adapterRef.current.play();
      showToast(`Đang lặp lại câu: "${sub.hanzi}"`, 'success');
      logVideoEvent('subtitle_selected', { subtitleId: sub.id, action: 'loop' });
    }
  };

  const handleSelectForSpeaking = (sub: VideoSubtitleLine) => {
    setSelectedSpeakingSentence(sub);
    showToast(`Đã chọn câu: "${sub.hanzi}" để luyện nói.`, 'info');
    logVideoEvent('speaking_practice_started', { subtitleId: sub.id });
  };

  // TTS Pronunciation handler
  const handlePlayTTS = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
      } catch {}
    }
  };

  // SRS Saving handler
  const handleSaveTokenToSRS = (token: SubtitleToken) => {
    const isSaved = isVocabularySaved(token.hanzi);
    if (isSaved) {
      showToast(`Từ "${token.hanzi}" (${token.pinyin}) đã có trong sổ từ của bạn.`, 'info');
      return;
    }

    const res = addVocabularyWord({
      hanzi: token.hanzi,
      pinyin: token.pinyin,
      meaning: token.meaning,
      hskLevel: token.hskLevel || video.hskLevel,
      source: `Video: ${video.title}`,
    });

    if (res.isNew) {
      showToast(`Đã lưu "${token.hanzi}" vào danh sách ôn tập Spaced Repetition (SRS)!`, 'success');
      logVideoEvent('vocabulary_saved', { hanzi: token.hanzi, pinyin: token.pinyin });
    } else {
      showToast(`Từ "${token.hanzi}" đã tồn tại trong sổ từ.`, 'info');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-detail-root student-content-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '84px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 700,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Sparkles size={16} color="#fbbf24" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Navigation Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
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
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={14} />
          <span>Thư viện video</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HSKLevel level={video.hskLevel as any} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
            Chủ đề: {video.topic}
          </span>
        </div>
      </div>

      {/* Main Two-Column Viewport */}
      <div className="video-detail-layout">
        {/* =====================================================================
            LEFT COLUMN (42-45%): PLAYER, CONTROLS, SPEAKING PRACTICE & SOURCE
            ===================================================================== */}
        <div className="video-left-column">
          {/* Video Player Display Container */}
          <div className="video-player-container">
            {video.videoSourceType === 'html5' && (
              <video
                ref={html5VideoRef}
                src={video.videoUrl}
                className="video-html5-element"
                playsInline
                preload="metadata"
                onPlay={() => setPlaybackState('playing')}
                onPause={() => setPlaybackState('paused')}
                onEnded={() => setPlaybackState('ended')}
              />
            )}

            {video.videoSourceType === 'youtube' && (
              <div ref={ytContainerRef} className="video-iframe-container" />
            )}

            {video.videoSourceType === 'preview' && (
              <div className="video-preview-placeholder">
                <StickerIllustration name="learning" size="md" decorative />
                <h4 style={{ margin: '12px 0 6px', fontSize: '16px', fontWeight: 800 }}>
                  Chế độ đọc tương tác
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', maxWidth: '380px', lineHeight: 1.45 }}>
                  {video.sourceNote || 'Video này hiện đang ở chế độ đọc giáo trình & bản chép lời có âm thanh mẫu.'}
                </p>
              </div>
            )}
          </div>

          {/* Player Error Banner */}
          {playerError && (
            <div
              style={{
                backgroundColor: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                color: '#be123c',
                fontSize: '12.5px',
                lineHeight: 1.45,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span>{playerError}</span>
                {video.youtubeVideoId && (
                  <div style={{ marginTop: '6px' }}>
                    <a
                      href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--primary, #E60012)',
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      <span>Mở xem trên YouTube</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Unified Controls Bar */}
          <div className="video-controls-bar">
            {/* Seek Timeline */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="video-timeline-slider"
              aria-label="Tua thời gian video"
            />

            {/* Buttons Row */}
            <div className="video-control-buttons-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-ctrl-play"
                  onClick={handleTogglePlay}
                  aria-label={isPlaying ? 'Tạm dừng video' : 'Phát video'}
                >
                  {isPlaying ? (
                    <Pause size={17} fill="currentColor" />
                  ) : (
                    <Play size={17} fill="currentColor" style={{ marginLeft: '2px' }} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSeek(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                  title="Phát lại từ đầu"
                >
                  <RotateCcw size={16} />
                </button>

                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Speed Buttons & Loop Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {loopingSubtitle && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#b45309',
                      backgroundColor: '#fef3c7',
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    <Repeat size={12} />
                    <span>Lặp {formatTime(loopingSubtitle.startTime)}</span>
                  </span>
                )}

                <div className="video-speed-selector">
                  {[0.75, 1.0, 1.25].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      className={`btn-speed-pill ${playbackRate === rate ? 'active' : ''}`}
                      onClick={() => handleSpeedChange(rate)}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Tab Bar (FE-8: Phụ đề / Luyện nói / Từ vựng) */}
          <div className="video-mobile-tab-bar" role="tablist" aria-label="Nội dung bài học video">
            <button
              type="button"
              role="tab"
              aria-selected={activeMobileTab === 'transcript'}
              className={`video-mobile-tab-btn ${activeMobileTab === 'transcript' ? 'active' : ''}`}
              onClick={() => setActiveMobileTab('transcript')}
            >
              <FileText size={16} />
              <span>Phụ đề</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMobileTab === 'speaking'}
              className={`video-mobile-tab-btn ${activeMobileTab === 'speaking' ? 'active' : ''}`}
              onClick={() => setActiveMobileTab('speaking')}
            >
              <Mic size={16} />
              <span>Luyện nói</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMobileTab === 'vocab'}
              className={`video-mobile-tab-btn ${activeMobileTab === 'vocab' ? 'active' : ''}`}
              onClick={() => setActiveMobileTab('vocab')}
            >
              <BookOpen size={16} />
              <span>Từ vựng ({videoVocabTokens.length})</span>
            </button>
          </div>

          {/* Speaking Practice & Metadata Section */}
          <div className={`video-speaking-section ${activeMobileTab !== 'speaking' ? 'mobile-hidden' : ''}`}>
            {/* Speaking Practice Card */}
            <SpeakingPracticeCard
              sentence={selectedSpeakingSentence}
              onPlaySample={handlePlayTTS}
              onPracticeCompleted={(dur) => {
                logVideoEvent('speaking_practice_completed', {
                  subtitleId: selectedSpeakingSentence?.id || '',
                  practiceDurationSeconds: dur,
                });
                showToast('Đã hoàn thành lượt luyện nói cho câu này! Bạn có thể nghe lại bản ghi âm.', 'success');
              }}
            />

            {/* Video Metadata Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                marginTop: '16px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                  {video.title}
                </h2>
                <div style={{ fontFamily: 'var(--font-hanzi)', fontSize: '14.5px', fontWeight: 700, color: 'var(--primary, #E60012)' }}>
                  {video.chineseTitle}
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.55, margin: 0 }}>
                {video.description}
              </p>

              <div
                style={{
                  paddingTop: '10px',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11.5px',
                  color: '#64748b',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <span>Nguồn: <strong>{video.source}</strong></span>
                {video.sourceNote && <span>{video.sourceNote}</span>}
                {video.licenseInfo && <span>{video.licenseInfo}</span>}
              </div>
            </div>
          </div>

          {/* Mobile Vocabulary List Tab */}
          <div className={`video-vocab-section ${activeMobileTab !== 'vocab' ? 'mobile-hidden' : ''}`}>
            <div className="video-vocab-card">
              <div className="video-vocab-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    Từ vựng trong video
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                    Chạm biểu tượng loa để nghe phát âm hoặc dấu trang để lưu ôn tập Spaced Repetition (SRS).
                  </p>
                </div>
                <span className="video-vocab-count-badge">
                  {videoVocabTokens.length} từ
                </span>
              </div>

              <div className="video-vocab-list">
                {videoVocabTokens.map((token) => {
                  const saved = isVocabularySaved(token.hanzi);
                  return (
                    <div key={token.hanzi} className="video-vocab-item">
                      <div className="video-vocab-item-main">
                        <div className="video-vocab-item-hanzi">{token.hanzi}</div>
                        <div className="video-vocab-item-pinyin">{token.pinyin}</div>
                        <div className="video-vocab-item-meaning">{token.meaning}</div>
                      </div>
                      <div className="video-vocab-item-actions">
                        <button
                          type="button"
                          className="btn-vocab-action"
                          onClick={() => handlePlayTTS(token.hanzi)}
                          aria-label={`Nghe phát âm từ ${token.hanzi}`}
                        >
                          <Volume2 size={18} />
                        </button>
                        <button
                          type="button"
                          className={`btn-vocab-action ${saved ? 'saved' : ''}`}
                          onClick={() => handleSaveTokenToSRS(token)}
                          aria-label={saved ? `Đã lưu từ ${token.hanzi}` : `Lưu từ ${token.hanzi} vào SRS`}
                        >
                          {saved ? <Check size={18} color="#16a34a" /> : <Bookmark size={18} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            RIGHT COLUMN (55-58%): SYNCHRONIZED TRANSCRIPT
            ===================================================================== */}
        <div className={`video-right-column ${activeMobileTab !== 'transcript' ? 'mobile-hidden' : ''}`}>
          <SynchronizedTranscript
            subtitles={video.subtitles}
            currentTime={currentTime}
            activeSubtitleIndex={activeSubtitleIndex}
            loopingSubtitleId={loopingSubtitle?.id || null}
            onSeekTo={handleSeek}
            onToggleLoop={handleToggleLoopSentence}
            onSelectForSpeaking={handleSelectForSpeaking}
            onSaveTokenToSRS={handleSaveTokenToSRS}
            isTokenSavedToSRS={isVocabularySaved}
            onPlayTTS={handlePlayTTS}
            onPinyinToggleChange={(visible) => {
              logVideoEvent('pinyin_toggled', { visible });
            }}
            onTranslationToggleChange={(visible) => {
              logVideoEvent('translation_toggled', { visible });
            }}
          />
        </div>
      </div>
    </div>
  );
};
