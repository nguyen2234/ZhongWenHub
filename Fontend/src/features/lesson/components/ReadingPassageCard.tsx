import React, { useState } from 'react';
import { BookOpen, Eye, EyeOff, Volume2, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import type { LessonReadingPassageDTO } from '../types/lesson-content.types';

interface ReadingPassageCardProps {
  passage: LessonReadingPassageDTO;
  className?: string;
}

export const ReadingPassageCard: React.FC<ReadingPassageCardProps> = ({ passage, className = '' }) => {
  const [showPinyin, setShowPinyin] = useState<boolean>(true);
  const [showMeaning, setShowMeaning] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, boolean>>({});

  const handlePlayAudio = (isSlow = false) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (isPlaying) {
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

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (submittedAnswers[qIdx]) return; // lock once checked
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

  return (
    <div
      className={`reading-passage-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border, #e2e8f0)',
        borderRadius: 'var(--radius-xl, 16px)',
        padding: 'var(--space-5, 24px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      }}
      data-testid="reading-passage-card"
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          borderBottom: '1px solid var(--border, #e2e8f0)',
          paddingBottom: 'var(--space-3, 12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(234, 88, 12, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary, #ea580c)',
            }}
          >
            <BookOpen size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground, #0f172a)' }}>
              {passage.titleZh}
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted, #64748b)' }}>{passage.titleVi}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => handlePlayAudio(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              background: isPlaying ? 'var(--primary, #ea580c)' : 'rgba(234, 88, 12, 0.12)',
              color: isPlaying ? '#ffffff' : 'var(--primary, #ea580c)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            data-testid="reading-passage-tts-btn"
          >
            <Volume2 size={14} />
            <span>{isPlaying ? 'Dừng phát' : 'Nghe bài đọc'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPinyin(!showPinyin)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid var(--border, #cbd5e1)',
              background: showPinyin ? 'var(--primary-light, #fff7ed)' : '#ffffff',
              color: showPinyin ? 'var(--primary, #ea580c)' : 'var(--muted, #64748b)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            data-testid="toggle-pinyin-btn"
          >
            {showPinyin ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>Pinyin</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMeaning(!showMeaning)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid var(--border, #cbd5e1)',
              background: showMeaning ? 'var(--primary-light, #fff7ed)' : '#ffffff',
              color: showMeaning ? 'var(--primary, #ea580c)' : 'var(--muted, #64748b)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            data-testid="toggle-meaning-btn"
          >
            {showMeaning ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>Dịch nghĩa</span>
          </button>
        </div>
      </div>

      {/* Target Focus Tags */}
      {(passage.targetWords?.length || passage.targetGrammar?.length) ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11px' }}>
          {passage.targetWords?.map((tw, idx) => (
            <span
              key={`tw-${idx}`}
              style={{
                backgroundColor: '#f1f5f9',
                color: '#475569',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 500,
              }}
            >
              Từ khóa: {tw}
            </span>
          ))}
          {passage.targetGrammar?.map((tg, idx) => (
            <span
              key={`tg-${idx}`}
              style={{
                backgroundColor: '#fef3c7',
                color: '#b45309',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 500,
              }}
            >
              Ngữ pháp: {tg}
            </span>
          ))}
        </div>
      ) : null}

      {/* Passage Content Box */}
      <div
        style={{
          background: 'linear-gradient(to bottom right, #fffaf5, #ffffff)',
          border: '1px solid #fed7aa',
          borderRadius: '12px',
          padding: '20px',
          lineHeight: '1.8',
        }}
      >
        <div
          style={{
            fontSize: '1.35rem',
            fontWeight: 600,
            color: '#1e293b',
            letterSpacing: '0.04em',
            marginBottom: showPinyin ? '8px' : '0',
          }}
          data-testid="passage-hanzi"
        >
          {passage.passageZh}
        </div>

        {showPinyin && (
          <div
            style={{
              fontSize: '0.95rem',
              color: '#d97706',
              fontWeight: 500,
              marginBottom: showMeaning ? '10px' : '0',
            }}
            data-testid="passage-pinyin"
          >
            {passage.passagePinyin}
          </div>
        )}

        {showMeaning && (
          <div
            style={{
              fontSize: '0.95rem',
              color: '#475569',
              fontStyle: 'italic',
              borderTop: '1px dashed #fed7aa',
              paddingTop: '8px',
              marginTop: '8px',
            }}
            data-testid="passage-meaning"
          >
            {passage.passageVi}
          </div>
        )}
      </div>

      {/* Comprehension Questions Section */}
      {passage.comprehensionQuestions && passage.comprehensionQuestions.length > 0 && (
        <div style={{ marginTop: 'var(--space-2)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '12px',
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--foreground, #0f172a)',
            }}
          >
            <HelpCircle size={16} style={{ color: 'var(--primary, #ea580c)' }} />
            <span>Câu hỏi đọc hiểu ({passage.comprehensionQuestions.length} câu)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {passage.comprehensionQuestions.map((q, qIdx) => {
              const selectedOpt = selectedAnswers[qIdx];
              const isSubmitted = submittedAnswers[qIdx];
              const isCorrect = isSubmitted && selectedOpt === q.correctIndex;

              return (
                <div
                  key={qIdx}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    backgroundColor: '#fafafa',
                  }}
                  data-testid={`reading-question-${qIdx}`}
                >
                  <div style={{ fontWeight: 600, fontSize: '15px', color: '#1e293b', marginBottom: '4px' }}>
                    {qIdx + 1}. {q.questionZh}
                  </div>
                  {showPinyin && q.questionPinyin && (
                    <div style={{ fontSize: '12px', color: '#d97706', marginBottom: '4px' }}>
                      {q.questionPinyin}
                    </div>
                  )}
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                    {q.questionVi}
                  </div>

                  {/* Options */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                    {q.options.map((opt, optIdx) => {
                      let btnBg = '#ffffff';
                      let btnBorder = '#cbd5e1';
                      let btnColor = '#334155';

                      if (isSubmitted) {
                        if (optIdx === q.correctIndex) {
                          btnBg = '#ecfdf5';
                          btnBorder = '#10b981';
                          btnColor = '#065f46';
                        } else if (optIdx === selectedOpt) {
                          btnBg = '#fef2f2';
                          btnBorder = '#ef4444';
                          btnColor = '#991b1b';
                        }
                      } else if (selectedOpt === optIdx) {
                        btnBg = 'rgba(234, 88, 12, 0.08)';
                        btnBorder = 'var(--primary, #ea580c)';
                        btnColor = 'var(--primary, #ea580c)';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                          disabled={isSubmitted}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: `1.5px solid ${btnBorder}`,
                            background: btnBg,
                            color: btnColor,
                            fontSize: '13.5px',
                            fontWeight: selectedOpt === optIdx ? 600 : 400,
                            cursor: isSubmitted ? 'default' : 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                          data-testid={`question-${qIdx}-opt-${optIdx}`}
                        >
                          <span>{opt}</span>
                          {isSubmitted && optIdx === q.correctIndex && (
                            <CheckCircle2 size={16} color="#10b981" />
                          )}
                          {isSubmitted && optIdx === selectedOpt && optIdx !== q.correctIndex && (
                            <XCircle size={16} color="#ef4444" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Submit / Reset Action & Explanation */}
                  <div style={{ marginTop: '12px' }}>
                    {!isSubmitted ? (
                      <button
                        type="button"
                        onClick={() => handleCheckQuestion(qIdx)}
                        disabled={selectedOpt === undefined}
                        style={{
                          padding: '6px 16px',
                          borderRadius: '8px',
                          background: selectedOpt !== undefined ? 'var(--primary, #ea580c)' : '#e2e8f0',
                          color: selectedOpt !== undefined ? '#ffffff' : '#94a3b8',
                          border: 'none',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: selectedOpt !== undefined ? 'pointer' : 'not-allowed',
                        }}
                        data-testid={`check-answer-btn-${qIdx}`}
                      >
                        Kiểm tra
                      </button>
                    ) : (
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: isCorrect ? '#ecfdf5' : '#fef2f2',
                          border: `1px solid ${isCorrect ? '#a7f3d0' : '#fecaca'}`,
                          fontSize: '13px',
                        }}
                      >
                        <div style={{ fontWeight: 600, color: isCorrect ? '#065f46' : '#991b1b', marginBottom: '4px' }}>
                          {isCorrect ? '✓ Chính xác!' : '✗ Chưa đúng!'}
                        </div>
                        <div style={{ color: '#475569' }}>{q.explanation}</div>
                        {!isCorrect && (
                          <button
                            type="button"
                            onClick={() => handleResetQuestion(qIdx)}
                            style={{
                              marginTop: '8px',
                              padding: '4px 10px',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              fontSize: '12px',
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
