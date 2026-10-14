import React, { useState } from 'react';
import {
  FileText,
  Languages,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { MOCK_READING_PASSAGES } from '../mock/mockSkillData';

export const SkillReadingPage: React.FC = () => {
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const passage = MOCK_READING_PASSAGES[0];

  const handleSelect = (qIdx: number, optIdx: number) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 24px 48px 24px' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
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
            <FileText size={13} />
            <span>LUYỆN KỸ NĂNG ĐỌC HIỂU (READING LAB)</span>
          </div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: 800 }}>
            Luyện đọc hiểu đoạn văn bản theo cấp độ HSK
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>
            Nâng cao vốn từ vựng trong văn cảnh, cải thiện tốc độ đọc quét và tư duy phân tích ngữ liệu.
          </p>
        </div>

        <div style={{ padding: '8px 16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.15)', fontSize: '13px', fontWeight: 700 }}>
          HSK {passage.hskLevel}
        </div>
      </div>

      {/* Reading Container */}
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
        {/* Controls row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
            {passage.title}
          </h2>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setShowPinyin((p) => !p)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: showPinyin ? '#fef3c7' : '#ffffff',
                color: showPinyin ? '#92400e' : '#64748b',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Languages size={14} />
              <span>{showPinyin ? 'Ẩn Pinyin' : 'Hiện Pinyin'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTranslation((t) => !t)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: showTranslation ? '#fef3c7' : '#ffffff',
                color: showTranslation ? '#92400e' : '#64748b',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {showTranslation ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{showTranslation ? 'Ẩn bản dịch' : 'Xem bản dịch'}</span>
            </button>
          </div>
        </div>

        {/* Text Passage Box */}
        <div
          style={{
            padding: '24px',
            borderRadius: '16px',
            backgroundColor: '#fffbeb',
            border: '1.5px solid #fde68a',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              fontSize: '18px',
              lineHeight: 1.8,
              fontWeight: 500,
              color: '#1e293b',
              fontFamily: 'var(--font-hanzi)',
              letterSpacing: '0.05em',
            }}
          >
            {passage.contentChinese}
          </div>

          {showPinyin && (
            <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#b45309', fontWeight: 500, borderTop: '1px dashed #fcd34d', paddingTop: '10px' }}>
              {passage.contentPinyin}
            </div>
          )}

          {showTranslation && (
            <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#475569', borderTop: '1px dashed #fcd34d', paddingTop: '10px' }}>
              <strong>Dịch nghĩa:</strong> {passage.contentVietnamese}
            </div>
          )}
        </div>

        {/* Comprehension Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
            Câu hỏi đọc hiểu ({passage.questions.length} câu)
          </h3>

          {passage.questions.map((q, qIdx) => {
            const selectedOpt = answers[qIdx];
            const isCorrect = selectedOpt === q.correctIndex;

            return (
              <div
                key={qIdx}
                style={{
                  padding: '18px',
                  borderRadius: '14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  {qIdx + 1}. {q.question}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {q.options.map((opt, optIdx) => {
                    const isOptSelected = selectedOpt === optIdx;
                    let optBg = '#ffffff';
                    let optBorder = '1px solid #cbd5e1';

                    if (isSubmitted) {
                      if (optIdx === q.correctIndex) {
                        optBg = '#f0fdf4';
                        optBorder = '2px solid #22c55e';
                      } else if (isOptSelected) {
                        optBg = '#fef2f2';
                        optBorder = '2px solid #ef4444';
                      }
                    } else if (isOptSelected) {
                      optBg = '#fef3c7';
                      optBorder = '2px solid #d97706';
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelect(qIdx, optIdx)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          backgroundColor: optBg,
                          border: optBorder,
                          fontSize: '13px',
                          fontWeight: 600,
                          textAlign: 'left',
                          cursor: isSubmitted ? 'default' : 'pointer',
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {isSubmitted && (
                  <div style={{ fontSize: '12px', color: isCorrect ? '#16a34a' : '#b45309', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                    💡 <strong>Giải thích:</strong> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          {!isSubmitted ? (
            <button
              type="button"
              onClick={() => setIsSubmitted(true)}
              disabled={Object.keys(answers).length < passage.questions.length}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: Object.keys(answers).length === passage.questions.length ? '#b45309' : '#cbd5e1',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: Object.keys(answers).length === passage.questions.length ? 'pointer' : 'not-allowed',
              }}
            >
              Chấm điểm đọc hiểu
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setAnswers({});
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 24px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#b45309',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span>Làm lại bài này</span>
              <Sparkles size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillReadingPage;
