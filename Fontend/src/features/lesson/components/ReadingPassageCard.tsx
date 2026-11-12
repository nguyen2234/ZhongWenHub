import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Eye, EyeOff, Volume2, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import type { LessonReadingPassageDTO } from '../types/lesson-content.types';

export interface AlignedReadingSentence {
  zh: string;
  pinyin: string;
  vi: string;
}

export interface ReadingPassageSentenceSplitResult {
  isAligned: boolean;
  sentences: AlignedReadingSentence[];
  zhSentences: string[];
  pySentences: string[];
  viSentences: string[];
}

/**
 * Safely splits a passage into sentences at sentence-ending punctuation
 * (including trailing closing quotes/brackets) without splitting Pinyin by spaces.
 */
export function splitIntoSentences(text?: string): string[] {
  if (!text) return [];
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const matches = normalized.match(/[^。！？.!?]+[。！？.!?]+[”"’'」』)\]]*|[^。！？.!?]+$/g);
  if (!matches) return [normalized];
  return matches.map((s) => s.trim()).filter((s) => s.length > 0);
}

export function splitReadingPassageSentences(
  passageZh: string,
  passagePinyin: string,
  passageVi: string
): ReadingPassageSentenceSplitResult {
  const zhSentences = splitIntoSentences(passageZh);
  const pySentences = splitIntoSentences(passagePinyin);
  const viSentences = splitIntoSentences(passageVi);

  const isAligned =
    zhSentences.length > 0 &&
    zhSentences.length === pySentences.length &&
    zhSentences.length === viSentences.length;

  const sentences = isAligned
    ? zhSentences.map((zh, idx) => ({
        zh,
        pinyin: pySentences[idx],
        vi: viSentences[idx],
      }))
    : [];

  return { isAligned, sentences, zhSentences, pySentences, viSentences };
}

interface ReadingPassageCardProps {
  passage: LessonReadingPassageDTO;
  audioUrl?: string;
  className?: string;
}

export const ReadingPassageCard: React.FC<ReadingPassageCardProps> = ({ passage, audioUrl, className = '' }) => {
  const [showPinyin, setShowPinyin] = useState<boolean>(true);
  const [showMeaning, setShowMeaning] = useState<boolean>(false);
  const [visibleQuestionVi, setVisibleQuestionVi] = useState<Record<number, boolean>>({});
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, boolean>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const splitResult = useMemo(
    () => splitReadingPassageSentences(passage.passageZh, passage.passagePinyin, passage.passageVi),
    [passage.passageZh, passage.passagePinyin, passage.passageVi]
  );

  useEffect(() => {
    setSelectedAnswers({});
    setSubmittedAnswers({});
    setVisibleQuestionVi({});
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [passage.lessonNumber, passage.passageZh]);

  const handlePlayAudio = (isSlow = false) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    const playTtsFallback = () => {
      if (!('speechSynthesis' in window)) {
        setIsPlaying(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(passage.passageZh);
      utterance.lang = 'zh-CN';
      utterance.rate = isSlow ? 0.75 : 0.95;
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    };

    if (audioUrl) {
      const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '');
      const resolvedUrl = audioUrl.startsWith('http')
        ? audioUrl
        : `${base}/${audioUrl.replace(/^\//, '')}`;
      const audio = new Audio(resolvedUrl);
      audio.playbackRate = isSlow ? 0.75 : 1;
      audioRef.current = audio;
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => playTtsFallback();
      audio.play().catch(() => playTtsFallback());
      return;
    }

    playTtsFallback();
  };

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (submittedAnswers[qIdx]) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleCheckQuestion = (qIdx: number) => {
    if (selectedAnswers[qIdx] !== undefined) {
      setSubmittedAnswers((prev) => ({ ...prev, [qIdx]: true }));
    }
  };

  const handleResetQuestion = (qIdx: number) => {
    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[qIdx];
      return next;
    });
    setSubmittedAnswers((prev) => {
      const next = { ...prev };
      delete next[qIdx];
      return next;
    });
  };

  const totalQuestions = passage.comprehensionQuestions?.length ?? 0;
  const checkedCount = Object.values(submittedAnswers).filter(Boolean).length;

  return (
    <div
      className={`reading-passage-card ${className}`}
      data-testid="reading-passage-card"
    >
      {/* Header bar */}
      <div className="reading-passage-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="hsk-section-icon-badge is-reading">
            <BookOpen size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--lesson-text-primary, #0f172a)' }}>
              {passage.titleZh}
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--lesson-text-secondary, #64748b)' }}>{passage.titleVi}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="reading-passage-controls">
          <button
            type="button"
            onClick={() => handlePlayAudio(false)}
            className={`reading-ctrl-btn is-tts ${isPlaying ? 'is-playing' : ''}`}
            data-testid="reading-passage-tts-btn"
          >
            <Volume2 size={14} />
            <span>{isPlaying ? 'Dừng phát' : 'Nghe bài đọc'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPinyin((prev) => !prev)}
            className={`reading-ctrl-btn ${showPinyin ? 'is-active' : ''}`}
            aria-pressed={showPinyin}
            data-testid="toggle-pinyin-btn"
          >
            {showPinyin ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>Pinyin</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMeaning((prev) => !prev)}
            className={`reading-ctrl-btn ${showMeaning ? 'is-active' : ''}`}
            aria-pressed={showMeaning}
            data-testid="toggle-meaning-btn"
          >
            {showMeaning ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>Dịch nghĩa</span>
          </button>
        </div>
      </div>

      {/* Target Focus Tags */}
      {(passage.targetWords?.length || passage.targetGrammar?.length) ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11.5px' }}>
          {passage.targetWords?.map((tw, idx) => (
            <span
              key={`tw-${idx}`}
              style={{
                backgroundColor: 'var(--lesson-study-soft, #eff6ff)',
                color: 'var(--lesson-study, #2563EB)',
                border: '1px solid var(--lesson-study-border, #bfdbfe)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 600,
              }}
            >
              Từ khóa: {tw}
            </span>
          ))}
          {passage.targetGrammar?.map((tg, idx) => (
            <span
              key={`tg-${idx}`}
              style={{
                backgroundColor: 'var(--lesson-grammar-soft, #fffbeb)',
                color: 'var(--lesson-grammar, #d97706)',
                border: '1px solid var(--lesson-grammar-border, #fde68a)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 600,
              }}
            >
              Ngữ pháp: {tg}
            </span>
          ))}
        </div>
      ) : null}

      {/* Passage Content Box */}
      <div className="reading-passage-body">
        {splitResult.isAligned ? (
          <div className="reading-sentences-list" data-testid="passage-sentences-list">
            {splitResult.sentences.map((sentence, idx) => (
              <div key={idx} className="reading-sentence-item" data-testid={`passage-sentence-${idx}`}>
                <div className="reading-sentence-hanzi" data-testid={idx === 0 ? 'passage-hanzi' : undefined}>
                  {sentence.zh}
                </div>
                {showPinyin && (
                  <div className="reading-sentence-pinyin" data-testid={idx === 0 ? 'passage-pinyin' : undefined}>
                    {sentence.pinyin}
                  </div>
                )}
                {showMeaning && (
                  <div className="reading-sentence-vi" data-testid={idx === 0 ? 'passage-meaning' : undefined}>
                    {sentence.vi}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="reading-sentences-list">
            <div className="reading-sentence-hanzi" data-testid="passage-hanzi">
              {passage.passageZh}
            </div>
            {showPinyin && (
              <div className="reading-sentence-pinyin" data-testid="passage-pinyin">
                {passage.passagePinyin}
              </div>
            )}
            {showMeaning && (
              <div className="reading-sentence-vi" data-testid="passage-meaning">
                {passage.passageVi}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comprehension Questions Section */}
      {totalQuestions > 0 && (
        <div style={{ marginTop: '4px' }}>
          <div className="reading-questions-header">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--lesson-text-primary, #0f172a)',
              }}
            >
              <HelpCircle size={16} style={{ color: 'var(--lesson-study, #2563EB)' }} />
              <span>Câu hỏi đọc hiểu ({totalQuestions} câu)</span>
            </div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--lesson-text-secondary, #64748b)',
                backgroundColor: 'var(--lesson-bg-subtle, #f8fafc)',
                border: '1px solid var(--lesson-border, #e2e8f0)',
                padding: '3px 10px',
                borderRadius: '999px',
              }}
              data-testid="reading-questions-progress"
            >
              Tiến độ: {checkedCount}/{totalQuestions} câu
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {passage.comprehensionQuestions.map((q, qIdx) => {
              const selectedOpt = selectedAnswers[qIdx];
              const isSubmitted = submittedAnswers[qIdx];
              const isCorrect = isSubmitted && selectedOpt === q.correctIndex;
              const isQuestionViVisible = Boolean(visibleQuestionVi[qIdx]);

              return (
                <div
                  key={qIdx}
                  className="reading-question-card"
                  data-testid={`reading-question-${qIdx}`}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: 'var(--lesson-study, #2563EB)',
                            backgroundColor: 'var(--lesson-study-soft, #eff6ff)',
                            border: '1px solid var(--lesson-study-border, #bfdbfe)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          Câu {qIdx + 1}/{totalQuestions}
                        </span>
                      </div>

                      <div
                        style={{
                          fontFamily: 'var(--font-hanzi)',
                          fontWeight: 600,
                          fontSize: '16px',
                          color: 'var(--lesson-text-primary, #0f172a)',
                          lineHeight: 1.5,
                        }}
                      >
                        {q.questionZh}
                      </div>

                      {showPinyin && q.questionPinyin && (
                        <div
                          style={{
                            fontFamily: 'var(--font-pinyin)',
                            fontSize: '13px',
                            color: 'var(--lesson-study, #2563EB)',
                            marginTop: '3px',
                          }}
                        >
                          {q.questionPinyin}
                        </div>
                      )}

                      {isQuestionViVisible && q.questionVi && (
                        <div
                          style={{
                            fontSize: '13px',
                            color: 'var(--lesson-text-secondary, #64748b)',
                            marginTop: '4px',
                          }}
                          data-testid={`question-vi-${qIdx}`}
                        >
                          {q.questionVi}
                        </div>
                      )}
                    </div>

                    {q.questionVi && (
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleQuestionVi((prev) => ({
                            ...prev,
                            [qIdx]: !prev[qIdx],
                          }))
                        }
                        className={`reading-ctrl-btn ${isQuestionViVisible ? 'is-active' : ''}`}
                        aria-label={isQuestionViVisible ? 'Ẩn bản dịch câu hỏi' : 'Hiện bản dịch câu hỏi'}
                        aria-pressed={isQuestionViVisible}
                        title={isQuestionViVisible ? 'Ẩn dịch câu hỏi' : 'Hiện dịch câu hỏi'}
                        data-testid={`toggle-question-vi-${qIdx}`}
                      >
                        {isQuestionViVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                        <span>Dịch</span>
                      </button>
                    )}
                  </div>

                  {/* Options A / B / C / D */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                    {q.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const stateClass = isSubmitted
                        ? optIdx === q.correctIndex
                          ? 'is-correct'
                          : optIdx === selectedOpt
                            ? 'is-incorrect'
                            : ''
                        : selectedOpt === optIdx
                          ? 'is-selected'
                          : '';

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                          disabled={isSubmitted}
                          className={`reading-option-btn ${stateClass}`}
                          style={{ cursor: isSubmitted ? 'default' : 'pointer' }}
                          data-testid={`question-${qIdx}-opt-${optIdx}`}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <span className="reading-option-letter">{letter}</span>
                            <span style={{ fontFamily: 'var(--font-hanzi)' }}>{opt}</span>
                          </span>
                          {isSubmitted && optIdx === q.correctIndex && (
                            <CheckCircle2 size={16} color="var(--lesson-success, #16A34A)" style={{ flexShrink: 0 }} />
                          )}
                          {isSubmitted && optIdx === selectedOpt && optIdx !== q.correctIndex && (
                            <XCircle size={16} color="var(--lesson-error, #DC2626)" style={{ flexShrink: 0 }} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Submit / Reset Action & Explanation */}
                  <div style={{ marginTop: '2px' }}>
                    {!isSubmitted ? (
                      <button
                        type="button"
                        onClick={() => handleCheckQuestion(qIdx)}
                        disabled={selectedOpt === undefined}
                        style={{
                          padding: '7px 16px',
                          borderRadius: '8px',
                          background: selectedOpt !== undefined ? 'var(--lesson-brand, #E60012)' : 'var(--lesson-border, #e2e8f0)',
                          color: selectedOpt !== undefined ? '#ffffff' : 'var(--lesson-text-secondary, #94a3b8)',
                          border: 'none',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: selectedOpt !== undefined ? 'pointer' : 'not-allowed',
                          transition: 'background 0.15s ease',
                        }}
                        data-testid={`check-answer-btn-${qIdx}`}
                      >
                        Kiểm tra
                      </button>
                    ) : (
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: isCorrect ? 'var(--lesson-success-soft, #ecfdf5)' : 'var(--lesson-error-soft, #fef2f2)',
                          border: `1px solid ${isCorrect ? 'var(--lesson-success-border, #a7f3d0)' : 'var(--lesson-error-border, #fecaca)'}`,
                          fontSize: '13px',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            color: isCorrect ? 'var(--lesson-success, #16A34A)' : 'var(--lesson-error, #DC2626)',
                            marginBottom: '4px',
                          }}
                        >
                          {isCorrect ? '✓ Chính xác!' : '✗ Chưa đúng!'}
                        </div>
                        <div style={{ color: 'var(--lesson-text-primary, #334155)' }}>{q.explanation}</div>
                        {!isCorrect && (
                          <button
                            type="button"
                            onClick={() => handleResetQuestion(qIdx)}
                            style={{
                              marginTop: '8px',
                              padding: '5px 12px',
                              background: 'var(--lesson-surface, #ffffff)',
                              border: '1px solid var(--lesson-border, #cbd5e1)',
                              color: 'var(--lesson-text-primary, #0f172a)',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Thử lại
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
