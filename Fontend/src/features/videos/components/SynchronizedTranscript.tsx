import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  EyeOff,
  Repeat,
  Mic,
  Volume2,
  Bookmark,
  BookmarkCheck,
  ArrowDownCircle,
  X,
} from 'lucide-react';
import type { VideoSubtitleLine, SubtitleToken } from '../types';

export interface SynchronizedTranscriptProps {
  subtitles: VideoSubtitleLine[];
  currentTime: number;
  activeSubtitleIndex: number;
  loopingSubtitleId: string | null;
  onSeekTo: (seconds: number) => void;
  onToggleLoop: (subtitle: VideoSubtitleLine) => void;
  onSelectForSpeaking: (subtitle: VideoSubtitleLine) => void;
  onSaveTokenToSRS: (token: SubtitleToken) => void;
  isTokenSavedToSRS: (hanzi: string) => boolean;
  onPlayTTS: (text: string) => void;
  onPinyinToggleChange?: (visible: boolean) => void;
  onTranslationToggleChange?: (visible: boolean) => void;
}

export const SynchronizedTranscript: React.FC<SynchronizedTranscriptProps> = ({
  subtitles,
  activeSubtitleIndex,
  loopingSubtitleId,
  onSeekTo,
  onToggleLoop,
  onSelectForSpeaking,
  onSaveTokenToSRS,
  isTokenSavedToSRS,
  onPlayTTS,
  onPinyinToggleChange,
  onTranslationToggleChange,
}) => {
  // Stored visibility preferences
  const [showPinyin, setShowPinyin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zh_video_pref_pinyin') !== 'false';
    } catch {
      return true;
    }
  });

  const [showTranslation, setShowTranslation] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zh_video_pref_trans') !== 'false';
    } catch {
      return true;
    }
  });

  const [autoFollow, setAutoFollow] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zh_video_pref_autofollow') !== 'false';
    } catch {
      return true;
    }
  });

  // Selected token for detailed popover
  const [selectedToken, setSelectedToken] = useState<SubtitleToken | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  // Toggle handlers with persistence
  const handleTogglePinyin = () => {
    const next = !showPinyin;
    setShowPinyin(next);
    try {
      localStorage.setItem('zh_video_pref_pinyin', String(next));
    } catch {}
    if (onPinyinToggleChange) onPinyinToggleChange(next);
  };

  const handleToggleTranslation = () => {
    const next = !showTranslation;
    setShowTranslation(next);
    try {
      localStorage.setItem('zh_video_pref_trans', String(next));
    } catch {}
    if (onTranslationToggleChange) onTranslationToggleChange(next);
  };

  const handleToggleAutoFollow = () => {
    const next = !autoFollow;
    setAutoFollow(next);
    try {
      localStorage.setItem('zh_video_pref_autofollow', String(next));
    } catch {}
  };

  // Auto-scroll to active sentence
  useEffect(() => {
    if (!autoFollow || activeSubtitleIndex < 0 || !activeLineRef.current || !containerRef.current) {
      return;
    }
    const container = containerRef.current;
    const target = activeLineRef.current;

    const targetTop = target.offsetTop - container.offsetTop;
    const containerMiddle = container.clientHeight / 2 - target.clientHeight / 2;
    const scrollDest = Math.max(0, targetTop - containerMiddle);

    container.scrollTo({
      top: scrollDest,
      behavior: 'smooth',
    });
  }, [activeSubtitleIndex, autoFollow]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!subtitles || subtitles.length === 0) {
    return (
      <div className="transcript-empty-state">
        <p>Video này chưa có dữ liệu phụ đề đồng bộ.</p>
      </div>
    );
  }

  return (
    <div className="transcript-panel">
      {/* Toolbar / Options */}
      <div className="transcript-toolbar">
        <div className="transcript-title-group">
          <span className="transcript-title">Bản chép lời đồng bộ</span>
          <span className="transcript-count-badge">{subtitles.length} câu</span>
        </div>

        <div className="transcript-toggles-row">
          <button
            type="button"
            className={`transcript-toggle-btn ${showPinyin ? 'active' : ''}`}
            onClick={handleTogglePinyin}
            title={showPinyin ? 'Ẩn phiên âm Pinyin' : 'Hiện phiên âm Pinyin'}
          >
            {showPinyin ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>Pinyin</span>
          </button>

          <button
            type="button"
            className={`transcript-toggle-btn ${showTranslation ? 'active' : ''}`}
            onClick={handleToggleTranslation}
            title={showTranslation ? 'Ẩn dịch tiếng Việt' : 'Hiện dịch tiếng Việt'}
          >
            {showTranslation ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>Dịch nghĩa</span>
          </button>

          <button
            type="button"
            className={`transcript-toggle-btn ${autoFollow ? 'active' : ''}`}
            onClick={handleToggleAutoFollow}
            title={autoFollow ? 'Tắt tự động cuộn' : 'Bật tự động cuộn theo câu đang phát'}
          >
            <ArrowDownCircle size={13} />
            <span>Cuộn tự động</span>
          </button>
        </div>
      </div>

      {/* Token Vocabulary Inspection Popover */}
      {selectedToken && (
        <div className="transcript-token-popover">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="token-popover-hanzi">{selectedToken.hanzi}</span>
                <span className="token-popover-pinyin">{selectedToken.pinyin}</span>
                {selectedToken.hskLevel && (
                  <span className="token-popover-hsk">HSK {selectedToken.hskLevel}</span>
                )}
              </div>
              <div className="token-popover-meaning">{selectedToken.meaning}</div>
            </div>

            <button
              type="button"
              className="token-popover-close"
              onClick={() => setSelectedToken(null)}
              aria-label="Đóng bảng từ"
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              className="token-action-speak"
              onClick={() => onPlayTTS(selectedToken.hanzi)}
            >
              <Volume2 size={13} />
              <span>Phát âm</span>
            </button>

            <button
              type="button"
              className="token-action-save"
              onClick={() => {
                onSaveTokenToSRS(selectedToken);
              }}
            >
              {isTokenSavedToSRS(selectedToken.hanzi) ? (
                <>
                  <BookmarkCheck size={13} />
                  <span>Đã lưu vào SRS</span>
                </>
              ) : (
                <>
                  <Bookmark size={13} />
                  <span>Lưu vào ôn tập Flashcard</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Subtitle Lines Scrollable Feed */}
      <div ref={containerRef} className="transcript-scroll-area">
        {subtitles.map((line, idx) => {
          const isActive = idx === activeSubtitleIndex;
          const isLooping = loopingSubtitleId === line.id;

          return (
            <div
              key={line.id}
              ref={isActive ? activeLineRef : undefined}
              className={`transcript-line-card ${isActive ? 'active' : ''} ${isLooping ? 'looping' : ''}`}
              onClick={() => onSeekTo(line.startTime)}
            >
              {/* Line Header: Timestamp + Actions */}
              <div className="transcript-line-meta">
                <span className="transcript-timestamp">
                  {formatTime(line.startTime)} - {formatTime(line.endTime)}
                </span>

                <div className="transcript-line-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`line-btn-action ${isLooping ? 'active-loop' : ''}`}
                    onClick={() => onToggleLoop(line)}
                    title={isLooping ? 'Hủy lặp câu này' : 'Lặp lại câu này liên tục'}
                  >
                    <Repeat size={12} />
                    <span>{isLooping ? 'Đang lặp' : 'Lặp câu'}</span>
                  </button>

                  <button
                    type="button"
                    className="line-btn-action"
                    onClick={() => onSelectForSpeaking(line)}
                    title="Đặt làm câu luyện nói"
                  >
                    <Mic size={12} />
                    <span>Luyện nói</span>
                  </button>
                </div>
              </div>

              {/* Chinese sentence with clickable token breakdown */}
              <div className="transcript-line-hanzi">
                {line.tokens && line.tokens.length > 0 ? (
                  <div className="transcript-tokens-list" onClick={(e) => e.stopPropagation()}>
                    {line.tokens.map((tok, tIdx) => {
                      const saved = isTokenSavedToSRS(tok.hanzi);
                      return (
                        <button
                          key={tIdx}
                          type="button"
                          className={`transcript-token-chip ${saved ? 'saved' : ''}`}
                          onClick={() => setSelectedToken(tok)}
                          title={`${tok.hanzi} [${tok.pinyin}]: ${tok.meaning} - Nhấn để xem & lưu vào SRS`}
                        >
                          <span className="token-chip-text">{tok.hanzi}</span>
                          {saved && <span className="token-saved-dot" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <span>{line.hanzi}</span>
                )}
              </div>

              {/* Optional Pinyin */}
              {showPinyin && (
                <div className="transcript-line-pinyin">{line.pinyin}</div>
              )}

              {/* Optional Vietnamese Translation */}
              {showTranslation && (
                <div className="transcript-line-vi">{line.vietnamese}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
