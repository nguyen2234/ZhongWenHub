import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Eye, EyeOff, Volume2, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import type { LessonReadingPassageDTO, ReadingSentenceDTO } from '../types/lesson-content.types';

export interface AlignedReadingSentence {
  zh: string;
  pinyin: string;
  vi: string;
}

export type ReadingAlignmentMode = 'structured' | 'verified-split' | 'block-fallback';

export interface ReadingPassageSentenceSplitResult {
  isAligned: boolean;
  alignmentMode: ReadingAlignmentMode;
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

function getTerminalKind(sentence: string): 'question' | 'exclamation' | 'statement' {
  const cleaned = sentence.replace(/[”"’'」』)\]\s]+$/g, '');
  const last = cleaned.at(-1) ?? '';
  if (last === '？' || last === '?') return 'question';
  if (last === '！' || last === '!') return 'exclamation';
  return 'statement';
}

function hasDialogueQuote(sentence: string): boolean {
  return /[“"「『]/.test(sentence);
}

function countHanziChars(sentence: string): number {
  const matches = sentence.match(/[\u4e00-\u9fff]/g);
  return matches ? matches.length : 0;
}

function countPinyinTokens(sentence: string): number {
  return sentence
    .replace(/["'“”‘’.,!?;:()\-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Verifies that split zh/pinyin/vi sentence arrays actually align beyond mere equal length:
 * checks terminal punctuation compatibility, quote parity, and Hanzi-to-Pinyin token ratio.
 */
export function areSentencesLikelyAligned(
  zhSentences: string[],
  pySentences: string[],
  viSentences: string[]
): boolean {
  if (
    zhSentences.length === 0 ||
    zhSentences.length !== pySentences.length ||
    zhSentences.length !== viSentences.length
  ) {
    return false;
  }

  for (let i = 0; i < zhSentences.length; i++) {
    const zh = zhSentences[i];
    const py = pySentences[i];
    const vi = viSentences[i];

    const zhEnd = getTerminalKind(zh);
    const pyEnd = getTerminalKind(py);
    const viEnd = getTerminalKind(vi);
    if (zhEnd !== pyEnd || zhEnd !== viEnd) {
      return false;
    }

    if (hasDialogueQuote(zh) !== hasDialogueQuote(py) || hasDialogueQuote(zh) !== hasDialogueQuote(vi)) {
      return false;
    }

    const hanziCount = countHanziChars(zh);
    const pyTokens = countPinyinTokens(py);
    if (hanziCount > 0 && (pyTokens === 0 || pyTokens < hanziCount * 0.3 || pyTokens > hanziCount * 1.8)) {
      return false;
    }
  }

  return true;
}

export function splitReadingPassageSentences(
  passageZh: string,
  passagePinyin: string,
  passageVi: string,
  structuredSentences?: ReadingSentenceDTO[]
): ReadingPassageSentenceSplitResult {
  if (Array.isArray(structuredSentences) && structuredSentences.length > 0) {
    const valid = structuredSentences.filter((s) => s && typeof s.zh === 'string' && s.zh.trim().length > 0);
    if (valid.length > 0) {
      const normalized = valid.map((s) => ({
        zh: s.zh.trim(),
        pinyin: (s.pinyin ?? '').trim(),
        vi: (s.vi ?? '').trim(),
      }));
      return {
        isAligned: true,
        alignmentMode: 'structured',
        sentences: normalized,
        zhSentences: normalized.map((s) => s.zh),
        pySentences: normalized.map((s) => s.pinyin),
        viSentences: normalized.map((s) => s.vi),
      };
    }
  }

  const zhSentences = splitIntoSentences(passageZh);
  const pySentences = splitIntoSentences(passagePinyin);
  const viSentences = splitIntoSentences(passageVi);

  if (areSentencesLikelyAligned(zhSentences, pySentences, viSentences)) {
    return {
      isAligned: true,
      alignmentMode: 'verified-split',
      sentences: zhSentences.map((zh, idx) => ({
        zh,
        pinyin: pySentences[idx],
        vi: viSentences[idx],
      })),
      zhSentences,
      pySentences,
      viSentences,
    };
  }

  return {
    isAligned: false,
    alignmentMode: 'block-fallback',
    sentences: [],
    zhSentences,
    pySentences,
    viSentences,
  };
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
    () =>
      splitReadingPassageSentences(
        passage.passageZh,
        passage.passagePinyin,
        passage.passageVi,
        passage.sentences
      ),
    [passage.passageZh, passage.passagePinyin, passage.passageVi, passage.sentences]
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
          <div className="reading-fallback-blocks" data-testid="passage-fallback-blocks">
            <div className="reading-fallback-block" data-testid="passage-hanzi">
              {splitResult.zhSentences.map((line, idx) => (
                <div key={`zh-${idx}`} className="reading-sentence-hanzi">
                  {line}
                </div>
              ))}
            </div>
            {showPinyin && splitResult.pySentences.length > 0 && (
              <div className="reading-fallback-block" data-testid="passage-pinyin">
                {splitResult.pySentences.map((line, idx) => (
                  <div key={`py-${idx}`} className="reading-sentence-pinyin">
                    {line}
                  </div>
                ))}
              </div>
            )}
            {showMeaning && splitResult.viSentences.length > 0 && (
              <div className="reading-fallback-block" data-testid="passage-meaning">
                {splitResult.viSentences.map((line, idx) => (
                  <div key={`vi-${idx}`} className="reading-sentence-vi">
                    {line}
                  </div>
                ))}
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
              const hasQuestionZh = Boolean(q.questionZh && q.questionZh.trim().length > 0);
              const hasAlignedOptionsPinyin =
                Array.isArray(q.optionsPinyin) && q.optionsPinyin.length === q.options.length;
              const hasAlignedOptionsVi =
                Array.isArray(q.optionsVi) && q.optionsVi.length === q.options.length;

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

                      {hasQuestionZh && (
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
                      )}

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

                      {(!hasQuestionZh || isQuestionViVisible) && q.questionVi && (
                        <div
                          style={{
                            fontSize: hasQuestionZh ? '13px' : '15px',
                            fontWeight: hasQuestionZh ? 400 : 600,
                            color: hasQuestionZh
                              ? 'var(--lesson-text-secondary, #64748b)'
                              : 'var(--lesson-text-primary, #0f172a)',
                            marginTop: hasQuestionZh ? '4px' : '0px',
                          }}
                          data-testid={`question-vi-${qIdx}`}
                        >
                          {q.questionVi}
                        </div>
                      )}
                    </div>

                    {((hasQuestionZh && q.questionVi) || (hasAlignedOptionsVi && q.optionsVi!.some(Boolean))) && (
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
                      const optPinyin = hasAlignedOptionsPinyin ? q.optionsPinyin![optIdx] : undefined;
                      const optVi = hasAlignedOptionsVi ? q.optionsVi![optIdx] : undefined;
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
                            <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                              <span style={{ fontFamily: 'var(--font-hanzi)' }}>{opt}</span>
                              {showPinyin && optPinyin && (
                                <span
                                  style={{
                                    fontFamily: 'var(--font-pinyin)',
                                    fontSize: '12px',
                                    color: 'var(--lesson-study, #2563EB)',
                                  }}
                                >
                                  {optPinyin}
                                </span>
                              )}
                              {isQuestionViVisible && optVi && (
                                <span className="reading-option-vi" data-testid={`question-${qIdx}-opt-${optIdx}-vi`}>
                                  {optVi}
                                </span>
                              )}
                            </span>
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
