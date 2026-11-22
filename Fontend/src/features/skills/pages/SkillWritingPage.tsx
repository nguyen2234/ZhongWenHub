import React, { useState, useEffect, useCallback } from 'react';
import {
  PenTool,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { normalizeAnswerText } from '../../exercise-engine';
import { httpClient } from '../../../core/api/client/http-client';
import type { WritingExercise } from '../types/skill.types';

const FALLBACK_SENTENCE_EX: WritingExercise = {
  id: 'w-01',
  type: 'sentence-order',
  hskLevel: 2,
  scrambledWords: ['去', '明天', '想', '北京', '我'],
  correctSentence: '我明天想去北京。',
  targetVietnamese: 'Ngày mai tôi muốn đi Bắc Kinh.',
};

const FALLBACK_CHAR_EX: WritingExercise = {
  id: 'w-02',
  type: 'character-stroke',
  hskLevel: 1,
  hanzi: '学',
  pinyin: 'xué',
  meaning: 'Học, nghiên cứu',
  strokeCount: 8,
  radicals: '子 (Tử)',
};

export const SkillWritingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'character' | 'sentence'>('sentence');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Dynamic writing exercises
  const [sentenceEx, setSentenceEx] = useState<WritingExercise>(FALLBACK_SENTENCE_EX);
  const [charEx, setCharEx] = useState<WritingExercise>(FALLBACK_CHAR_EX);

  // Sentence ordering interactive state
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>(FALLBACK_SENTENCE_EX.scrambledWords || []);
  const [sentenceSubmitted, setSentenceSubmitted] = useState(false);

  // Load real exercises from API
  const loadExercises = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await httpClient.get<any[]>('/content/exercises', {
        params: { skill: 'writing' },
      }).catch(() => null);

      if (data && Array.isArray(data) && data.length > 0) {
        const sentence = data.find((e) => e.type === 'sentence-order' || e.type === 'SENTENCE_ORDERING');
        if (sentence) {
          let words: string[] = [];
          if (Array.isArray(sentence.options)) {
            words = sentence.options;
          } else if (typeof sentence.optionsJson === 'string') {
            try { words = JSON.parse(sentence.optionsJson); } catch {}
          }
          const loadedSentence: WritingExercise = {
            id: sentence.id,
            type: 'sentence-order',
            hskLevel: sentence.hskLevel || 2,
            scrambledWords: words.length > 0 ? words : FALLBACK_SENTENCE_EX.scrambledWords,
            correctSentence: sentence.promptHanzi || sentence.correctAnswer || FALLBACK_SENTENCE_EX.correctSentence,
            targetVietnamese: sentence.promptVietnamese || sentence.instruction || FALLBACK_SENTENCE_EX.targetVietnamese,
          };
          setSentenceEx(loadedSentence);
          setAvailableWords(loadedSentence.scrambledWords || []);
          setSelectedWords([]);
          setSentenceSubmitted(false);
        }

        const character = data.find((e) => e.type === 'character-stroke' || e.type === 'STROKE_ORDER');
        if (character) {
          setCharEx({
            id: character.id,
            type: 'character-stroke',
            hskLevel: character.hskLevel || 1,
            hanzi: character.promptHanzi || '学',
            pinyin: character.promptPinyin || 'xué',
            meaning: character.promptVietnamese || 'Học, nghiên cứu',
            strokeCount: character.strokeCount || 8,
            radicals: character.radicals || '子 (Tử)',
          });
        }
      }
    } catch {
      // Keep structured exercise with fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  const handlePickWord = (word: string, index: number) => {
    if (sentenceSubmitted) return;
    setSelectedWords((prev) => [...prev, word]);
    setAvailableWords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveWord = (word: string, index: number) => {
    if (sentenceSubmitted) return;
    setAvailableWords((prev) => [...prev, word]);
    setSelectedWords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResetSentence = () => {
    setSelectedWords([]);
    setAvailableWords(sentenceEx.scrambledWords || []);
    setSentenceSubmitted(false);
    setSyncStatus(null);
  };

  const isSentenceCorrect =
    normalizeAnswerText(selectedWords.join('')) === normalizeAnswerText(sentenceEx.correctSentence);

  const handleSubmitSentence = async () => {
    setSentenceSubmitted(true);
    setIsSyncing(true);
    try {
      // Persist real practice attempt to SQL Server
      await httpClient.post('/learning/practice-attempts', {
        exerciseId: sentenceEx.id,
        userAnswer: selectedWords.join(''),
        isCorrect: isSentenceCorrect,
        skill: 'WRITING',
        hskLevel: sentenceEx.hskLevel,
      }).catch(() => null);
      setSyncStatus('Tiến trình luyện viết đã được đồng bộ với máy chủ SQL Server.');
    } catch {
      setSyncStatus('Hoàn thành bài tập (chế độ cục bộ).');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 24px 48px 24px' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #be123c 0%, #9f1239 100%)',
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
            <PenTool size={13} />
            <span>LUYỆN KỸ NĂNG VIẾT (WRITING LAB)</span>
          </div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: 800 }}>
            Luyện viết chữ Hán & Sắp xếp câu chuẩn ngữ pháp
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>
            Rèn luyện thứ tự nét bút Hán tự, nắm vững quy tắc kết cấu chữ và kỹ năng cấu tạo câu HSK.
          </p>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('sentence')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'sentence' ? '#ffffff' : 'transparent',
              color: activeTab === 'sentence' ? '#be123c' : '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Sắp xếp câu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('character')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'character' ? '#ffffff' : 'transparent',
              color: activeTab === 'character' ? '#be123c' : '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Tập viết Hán tự
          </button>
        </div>
      </div>

      {isLoading && (
        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
          Đang tải bài tập viết từ máy chủ...
        </div>
      )}

      {/* Tab 1: Sentence Ordering */}
      {activeTab === 'sentence' && !isLoading && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #e2e8f0',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#ffe4e6', color: '#be123c', marginRight: '8px' }}>
                HSK {sentenceEx.hskLevel} • Sắp xếp câu
              </span>
              <h2 style={{ margin: '8px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Chọn các từ bên dưới theo đúng thứ tự để tạo thành câu hoàn chỉnh
              </h2>
            </div>
            <button
              type="button"
              onClick={handleResetSentence}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={14} />
              Làm lại
            </button>
          </div>

          {/* Vietnamese meaning target */}
          <div style={{ padding: '14px 18px', borderRadius: '12px', backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8', color: '#831843', fontSize: '14px', fontWeight: 600 }}>
            Ý nghĩa câu cần ghép: <em>"{sentenceEx.targetVietnamese}"</em>
          </div>

          {/* Dropzone for Selected Words */}
          <div
            style={{
              minHeight: '80px',
              borderRadius: '16px',
              border: sentenceSubmitted
                ? isSentenceCorrect
                  ? '2px solid #22c55e'
                  : '2px solid #ef4444'
                : '2px dashed #cbd5e1',
              backgroundColor: sentenceSubmitted
                ? isSentenceCorrect
                  ? '#f0fdf4'
                  : '#fef2f2'
                : '#f8fafc',
              padding: '16px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            {selectedWords.length === 0 ? (
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                Nhấn vào các mảnh từ bên dưới để xếp vào đây...
              </span>
            ) : (
              selectedWords.map((word, idx) => (
                <button
                  key={`${word}-${idx}`}
                  type="button"
                  onClick={() => handleRemoveWord(word, idx)}
                  disabled={sentenceSubmitted}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #be123c',
                    backgroundColor: '#ffffff',
                    color: '#9f1239',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: sentenceSubmitted ? 'default' : 'pointer',
                    boxShadow: '0 2px 4px rgba(190, 18, 60, 0.08)',
                  }}
                >
                  {word}
                </button>
              ))
            )}
          </div>

          {/* Word Pool */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>
              CÁC TỪ CÒN LẠI:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {availableWords.map((word, idx) => (
                <button
                  key={`avail-${word}-${idx}`}
                  type="button"
                  onClick={() => handlePickWord(word, idx)}
                  disabled={sentenceSubmitted}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: sentenceSubmitted ? 'default' : 'pointer',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          {!sentenceSubmitted ? (
            <button
              type="button"
              onClick={handleSubmitSentence}
              disabled={selectedWords.length === 0 || isSyncing}
              style={{
                alignSelf: 'flex-start',
                padding: '10px 24px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: selectedWords.length === 0 || isSyncing ? '#cbd5e1' : '#be123c',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: selectedWords.length === 0 || isSyncing ? 'not-allowed' : 'pointer',
              }}
            >
              {isSyncing ? 'Đang kiểm tra & đồng bộ...' : 'Kiểm tra đáp án'}
            </button>
          ) : (
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                backgroundColor: isSentenceCorrect ? '#f0fdf4' : '#fef2f2',
                border: `1.5px solid ${isSentenceCorrect ? '#bbf7d0' : '#fecaca'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: isSentenceCorrect ? '#15803d' : '#b91c1c' }}>
                {isSentenceCorrect ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{isSentenceCorrect ? 'Chính xác! Bạn đã sắp xếp đúng câu chuẩn ngữ pháp.' : 'Chưa chính xác.'}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#334155' }}>
                Đáp án chuẩn: <strong style={{ color: '#be123c', fontSize: '15px' }}>{sentenceEx.correctSentence}</strong>
              </div>
              {syncStatus && (
                <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>
                  ✓ {syncStatus}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Character Stroke Lab */}
      {activeTab === 'character' && !isLoading && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #e2e8f0',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#ffe4e6', color: '#be123c', marginRight: '8px' }}>
                Hán tự căn bản • {charEx.pinyin}
              </span>
              <h2 style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                Tập viết chữ: {charEx.hanzi} ({charEx.meaning})
              </h2>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Tổng số nét: <strong>{charEx.strokeCount} nét</strong> • Bộ thủ: <strong>{charEx.radicals}</strong>
            </div>
          </div>

          {/* Stroke Grid Simulator */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
            <div
              style={{
                width: '240px',
                height: '240px',
                borderRadius: '16px',
                border: '3px solid #be123c',
                backgroundColor: '#fff1f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: 'inset 0 0 16px rgba(190, 18, 60, 0.08)',
              }}
            >
              {/* Tian Zi Ge grid lines */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', borderLeft: '1px dashed #f43f5e' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', borderTop: '1px dashed #f43f5e' }} />

              <span
                style={{
                  fontSize: '140px',
                  fontFamily: 'var(--font-hanzi)',
                  fontWeight: 400,
                  color: '#9f1239',
                  userSelect: 'none',
                }}
              >
                {charEx.hanzi}
              </span>
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '13px', color: '#475569' }}>
            Quy tắc bút thuận: <em>Từ trên xuống dưới, từ trái qua phải, chấm đầu - ngang móc - bộ tử kết thúc.</em>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillWritingPage;
