import React, { useState } from 'react';
import {
  PenTool,
  RotateCcw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { MOCK_WRITING_EXERCISES } from '../mock/mockSkillData';

export const SkillWritingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'character' | 'sentence'>('sentence');

  // Sentence ordering state
  const sentenceEx = MOCK_WRITING_EXERCISES[0];
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>(sentenceEx.scrambledWords || []);
  const [sentenceSubmitted, setSentenceSubmitted] = useState(false);

  // Character stroke state
  const charEx = MOCK_WRITING_EXERCISES[1];

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
  };

  const constructedSentence = selectedWords.join('') + '。';
  const isSentenceCorrect = constructedSentence === sentenceEx.correctSentence;

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

      {activeTab === 'sentence' ? (
        /* Sentence Ordering Card */
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
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#ffe4e6', color: '#be123c', marginRight: '8px' }}>
              HSK {sentenceEx.hskLevel} • Sắp xếp câu
            </span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '8px' }}>
              Nghĩa tiếng Việt: "{sentenceEx.targetVietnamese}"
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Bấm vào các thẻ từ ngữ bên dưới để ghép thành câu hoàn chỉnh theo đúng ngữ pháp.
            </div>
          </div>

          {/* Constructed Sentence Box */}
          <div
            style={{
              minHeight: '80px',
              padding: '16px 20px',
              borderRadius: '16px',
              backgroundColor: '#f8fafc',
              border: '2px dashed #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            {selectedWords.length === 0 ? (
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                (Thả các mảnh từ vào đây theo thứ tự...)
              </span>
            ) : (
              selectedWords.map((word, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleRemoveWord(word, idx)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #be123c',
                    color: '#be123c',
                    fontSize: '16px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-hanzi)',
                    cursor: sentenceSubmitted ? 'default' : 'pointer',
                    boxShadow: '0 2px 4px rgba(190, 18, 60, 0.1)',
                  }}
                  title="Bấm để trả về danh sách"
                >
                  {word}
                </button>
              ))
            )}
          </div>

          {/* Available Words Pool */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '10px' }}>
              Kho từ ngữ khả dụng:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {availableWords.map((word, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePickWord(word, idx)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    backgroundColor: '#f1f5f9',
                    border: '1.5px solid #cbd5e1',
                    color: '#0f172a',
                    fontSize: '16px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-hanzi)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          {/* Result after submit */}
          {sentenceSubmitted && (
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: isSentenceCorrect ? '#f0fdf4' : '#fef2f2',
                border: isSentenceCorrect ? '1.5px solid #86efac' : '1.5px solid #fecaca',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isSentenceCorrect ? '#16a34a' : '#dc2626', fontWeight: 800, fontSize: '14px', marginBottom: '4px' }}>
                <CheckCircle2 size={18} />
                <span>{isSentenceCorrect ? 'Chính xác! Câu hoàn chỉnh đúng ngữ pháp' : 'Chưa chuẩn xác, vui lòng thử lại!'}</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-hanzi)' }}>
                Đáp án chuẩn: {sentenceEx.correctSentence}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={handleResetSentence}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#64748b',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={14} />
              <span>Làm lại</span>
            </button>

            {!sentenceSubmitted ? (
              <button
                type="button"
                onClick={() => setSentenceSubmitted(true)}
                disabled={availableWords.length > 0}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: availableWords.length === 0 ? '#be123c' : '#cbd5e1',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: availableWords.length === 0 ? 'pointer' : 'not-allowed',
                }}
              >
                Kiểm tra câu
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetSentence}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#be123c',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <span>Câu tiếp theo</span>
                <Sparkles size={14} />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Character Writing / Stroke Card */
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
