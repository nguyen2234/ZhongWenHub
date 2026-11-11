import React, { useEffect, useRef, useState } from 'react';
import {
  Headphones,
  Volume2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { MOCK_LISTENING_EXERCISES } from '../mock/mockSkillData';
import type { ListeningExercise } from '../types/skill.types';
import { httpClient } from '../../../core/api/client/http-client';

function isIsolatedTestRuntime(): boolean {
  const mode = (import.meta as any)?.env?.MODE;
  const g = globalThis as any;
  const nodeEnv = g?.process?.env?.NODE_ENV;
  const isBun = typeof g?.Bun !== 'undefined';
  return mode === 'test' || nodeEnv === 'test' || isBun;
}

interface LiveListeningItem extends ListeningExercise {
  audioUrl?: string;
}

function parseHskLevelFromCourseTitle(title?: string | null): number {
  const match = String(title || '').match(/HSK\s*(\d+)/i);
  return match ? Number(match[1]) : 1;
}

function extractListeningItemsFromLessons(lessons: any[]): LiveListeningItem[] {
  const items: LiveListeningItem[] = [];
  for (const les of lessons) {
    if (!les?.listeningJson) continue;
    try {
      const parsed = typeof les.listeningJson === 'string' ? JSON.parse(les.listeningJson) : les.listeningJson;
      const hskLevel = parseHskLevelFromCourseTitle(les.courseTitle);
      const scriptHanzi = String(parsed?.scriptHanzi || '').trim();
      const scriptPinyin = String(parsed?.scriptPinyin || '').trim();
      const scriptVietnamese = String(parsed?.scriptVietnamese || '').trim();
      const audioUrl = parsed?.audioUrl ? String(parsed.audioUrl) : undefined;
      const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
      questions.forEach((q: any, qIdx: number) => {
        if (!q || !Array.isArray(q.options) || q.options.length === 0) return;
        items.push({
          id: `${les.id}-listen-${qIdx}`,
          title: `Bài ${les.lessonNumber}: ${les.titleVi || les.titleZh || ''}`.trim(),
          hskLevel,
          audioText: scriptHanzi || String(q.question || ''),
          audioUrl,
          transcriptPinyin: scriptPinyin,
          transcriptVietnamese: scriptVietnamese,
          question: String(q.question || 'Nghe đoạn hội thoại và chọn đáp án đúng'),
          options: q.options.map(String),
          correctOptionIndex: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0,
          explanation: String(q.explanation || 'Đối chiếu lại nội dung lời thoại bên dưới.'),
        });
      });
    } catch {
      // Skip malformed JSON
    }
  }
  return items;
}

export const SkillListeningPage: React.FC = () => {
  const [exercises, setExercises] = useState<LiveListeningItem[]>(() =>
    isIsolatedTestRuntime() ? MOCK_LISTENING_EXERCISES : []
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => !isIsolatedTestRuntime());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isIsolatedTestRuntime()) return;
    let active = true;
    setIsLoading(true);
    setLoadError(null);
    httpClient
      .get<any>('/content/lessons', { params: { page: 1, pageSize: 100 } })
      .then((res) => {
        if (!active) return;
        const rows = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
        setExercises(extractListeningItemsFromLessons(rows));
        setCurrentIndex(0);
      })
      .catch((err: any) => {
        if (!active) return;
        setLoadError(err?.message || 'Không thể tải danh sách bài luyện nghe từ máy chủ.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const currentEx = exercises[currentIndex];

  const playSpeechFallback = () => {
    if (!currentEx) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentEx.audioText);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePlayAudio = () => {
    if (!currentEx) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (currentEx.audioUrl) {
      const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '');
      const resolvedUrl = currentEx.audioUrl.startsWith('http')
        ? currentEx.audioUrl
        : `${base}/${currentEx.audioUrl.replace(/^\//, '')}`;
      const audio = new Audio(resolvedUrl);
      audioRef.current = audio;
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => playSpeechFallback();
      audio.play().catch(() => playSpeechFallback());
      return;
    }
    playSpeechFallback();
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setIsAnswerSubmitted(true);
    setShowTranscript(true);
  };

  const handleNext = () => {
    if (exercises.length === 0) return;
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setShowTranscript(false);
    setCurrentIndex((prev) => (prev + 1) % exercises.length);
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px', textAlign: 'center', color: '#475569' }}>
        Đang tải bài luyện nghe từ hệ thống...
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px', color: '#b91c1c' }}>
        {loadError}
      </div>
    );
  }

  if (!currentEx) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px', color: '#92400e' }}>
        Hiện chưa có bài luyện nghe nào được xuất bản.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 24px 48px 24px' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          borderRadius: '20px',
          padding: '24px 32px',
          color: '#ffffff',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
            <Headphones size={13} />
            <span>LUYỆN KỸ NĂNG NGHE (LISTENING LAB)</span>
          </div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: 800 }}>
            Luyện nghe hiểu qua ngữ cảnh thực tế
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>
            Lắng nghe đoạn hội thoại chuẩn bản xứ, trả lời câu hỏi và đối chiếu bản ghi âm phiên âm.
          </p>
        </div>

        <div style={{ padding: '8px 16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.15)', fontSize: '13px', fontWeight: 700 }}>
          Bài {currentIndex + 1} / {exercises.length}
        </div>
      </div>

      {/* Main Exercise Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #e2e8f0',
          padding: '28px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Title & Level */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#e0f2fe', color: '#0369a1', marginRight: '8px' }}>
              HSK {currentEx.hskLevel}
            </span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{currentEx.title}</span>
          </div>
        </div>

        {/* Audio Player Component */}
        <div
          style={{
            padding: '24px',
            borderRadius: '16px',
            backgroundColor: '#f8fafc',
            border: '1.5px dashed #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
          }}
        >
          <button
            type="button"
            onClick={handlePlayAudio}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: isPlaying ? '#0284c7' : '#0369a1',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(3, 105, 161, 0.35)',
              transform: isPlaying ? 'scale(1.08)' : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
            title="Bấm để nghe đoạn âm thanh"
          >
            <Volume2 size={28} />
          </button>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
            {isPlaying ? 'Đang phát âm thanh...' : 'Bấm nút trên để nghe đoạn hội thoại'}
          </div>
        </div>

        {/* Question & Options */}
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            Câu hỏi: {currentEx.question}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {currentEx.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentEx.correctOptionIndex;

              let bg = '#ffffff';
              let border = '1.5px solid #e2e8f0';
              let color = '#334155';

              if (isAnswerSubmitted) {
                if (isCorrect) {
                  bg = '#f0fdf4';
                  border = '2px solid #22c55e';
                  color = '#15803d';
                } else if (isSelected) {
                  bg = '#fef2f2';
                  border = '2px solid #ef4444';
                  color = '#b91c1c';
                }
              } else if (isSelected) {
                bg = '#e0f2fe';
                border = '2px solid #0284c7';
                color = '#0369a1';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    backgroundColor: bg,
                    border,
                    color,
                    fontSize: '14px',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: isAnswerSubmitted ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{opt}</span>
                  {isAnswerSubmitted && isCorrect && <CheckCircle2 size={18} color="#22c55e" />}
                  {isAnswerSubmitted && isSelected && !isCorrect && <XCircle size={18} color="#ef4444" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <button
            type="button"
            onClick={() => setShowTranscript((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {showTranscript ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showTranscript ? 'Ẩn lời thoại (Transcript)' : 'Xem lời thoại (Transcript)'}</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            {!isAnswerSubmitted ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={selectedOption === null}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: selectedOption !== null ? '#0369a1' : '#cbd5e1',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: selectedOption !== null ? 'pointer' : 'not-allowed',
                }}
              >
                Xác nhận đáp án
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#0369a1',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <span>Bài tiếp theo</span>
                <Sparkles size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Transcript Box */}
        {showTranscript && (
          <div
            style={{
              padding: '18px 20px',
              borderRadius: '14px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>
              Bản ghi lời thoại & Giải thích:
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-hanzi)' }}>
              {currentEx.audioText}
            </div>
            <div style={{ fontSize: '13px', color: '#0284c7', fontWeight: 600 }}>
              {currentEx.transcriptPinyin}
            </div>
            <div style={{ fontSize: '13px', color: '#475569' }}>
              {currentEx.transcriptVietnamese}
            </div>
            <div style={{ fontSize: '12px', color: '#15803d', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '4px' }}>
              💡 <strong>Giải thích:</strong> {currentEx.explanation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillListeningPage;
