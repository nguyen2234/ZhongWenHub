import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { MOCK_SPEAKING_PROMPTS } from '../mock/mockSkillData';

export const SkillSpeakingPage: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedFeedback, setRecordedFeedback] = useState<{
    score: number;
    fluency: string;
    tones: string;
    tips: string;
  } | null>(null);

  const currentPrompt = MOCK_SPEAKING_PROMPTS[currentIndex];

  const handleSpeakTarget = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentPrompt.promptText);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordedFeedback(null);
      // Simulate 3 seconds recording then feedback
      setTimeout(() => {
        setIsRecording(false);
        setRecordedFeedback({
          score: 88,
          fluency: 'Lưu loát, ngữ điệu tự nhiên',
          tones: 'Thanh điệu chuẩn xác (92% thanh 1 & thanh 4)',
          tips: 'Cần chú ý ngắt nghỉ một chút sau cụm từ chính.',
        });
      }, 2500);
    } else {
      setIsRecording(false);
    }
  };

  const handleNext = () => {
    setRecordedFeedback(null);
    setCurrentIndex((prev) => (prev + 1) % MOCK_SPEAKING_PROMPTS.length);
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 24px 48px 24px' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
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
            <Mic size={13} />
            <span>LUYỆN KỸ NĂNG NÓI & PHÁT ÂM (SPEAKING LAB)</span>
          </div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: 800 }}>
            Luyện phát âm chuẩn & Phản xạ hội thoại
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>
            Luyện nói theo tình huống thực tế, nhận phản hồi ngữ điệu và phát hiện thanh điệu chưa chuẩn.
          </p>
        </div>

        <div style={{ padding: '8px 16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.15)', fontSize: '13px', fontWeight: 700 }}>
          Tình huống {currentIndex + 1} / {MOCK_SPEAKING_PROMPTS.length}
        </div>
      </div>

      {/* Main Card */}
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
          <div style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#dcfce7', color: '#15803d', display: 'inline-block', marginBottom: '8px' }}>
            HSK {currentPrompt.hskLevel} • {currentPrompt.scenario}
          </div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
            Nhiệm vụ: {currentPrompt.targetVietnamese}
          </h2>
        </div>

        {/* Prompt Dialog Box */}
        <div
          style={{
            padding: '20px',
            borderRadius: '16px',
            backgroundColor: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
              Đối phương vừa nói với bạn:
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-hanzi)', marginBottom: '4px' }}>
              {currentPrompt.promptText}
            </div>
            <div style={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>
              {currentPrompt.targetPinyin}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSpeakTarget}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#047857',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="Nghe phát âm đối phương"
          >
            <Volume2 size={20} />
          </button>
        </div>

        {/* Hints Box */}
        <div style={{ padding: '14px 18px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#16a34a', marginBottom: '6px' }}>
            <HelpCircle size={14} />
            <span>Gợi ý mẫu câu & từ vựng phản hồi:</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {currentPrompt.hints.map((hint, idx) => (
              <span key={idx} style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#ffffff', border: '1px solid #86efac', fontSize: '12px', color: '#166534', fontWeight: 600 }}>
                {hint}
              </span>
            ))}
          </div>
        </div>

        {/* Mic Control Circle */}
        <div
          style={{
            padding: '36px',
            borderRadius: '16px',
            backgroundColor: isRecording ? '#fef2f2' : '#f8fafc',
            border: isRecording ? '2px dashed #ef4444' : '1.5px dashed #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            transition: 'all 0.2s ease',
          }}
        >
          <button
            type="button"
            onClick={handleToggleRecord}
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              backgroundColor: isRecording ? '#dc2626' : '#059669',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isRecording
                ? '0 0 0 10px rgba(239, 68, 68, 0.2)'
                : '0 4px 16px rgba(5, 150, 105, 0.35)',
              transform: isRecording ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
            title={isRecording ? 'Bấm để dừng thu âm' : 'Bấm để nói'}
          >
            {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
          <div style={{ fontSize: '14px', fontWeight: 700, color: isRecording ? '#dc2626' : '#475569' }}>
            {isRecording ? 'Đang lắng nghe bạn nói... (Nhấn lại để kết thúc)' : 'Bấm micro và bắt đầu nói tiếng Trung'}
          </div>
        </div>

        {/* Recorded Feedback Card */}
        {recordedFeedback && (
          <div
            style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={20} color="#059669" />
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#065f46' }}>
                  Đánh giá phát âm: {recordedFeedback.score} / 100 Điểm
                </span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857', backgroundColor: '#d1fae5', padding: '3px 8px', borderRadius: '6px' }}>
                Rất tốt
              </span>
            </div>

            <div style={{ fontSize: '13px', color: '#047857', lineHeight: 1.5 }}>
              • <strong>Độ lưu loát:</strong> {recordedFeedback.fluency}
              <br />
              • <strong>Thanh điệu:</strong> {recordedFeedback.tones}
              <br />
              • <strong>Gợi ý cải thiện:</strong> {recordedFeedback.tips}
            </div>

            <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic', borderTop: '1px solid #d1fae5', paddingTop: '8px' }}>
              * Phân tích phát âm mô phỏng trực tiếp trên trình duyệt dựa trên âm vị tiếng Phổ thông.
            </div>
          </div>
        )}

        {/* Bottom controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
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
              backgroundColor: '#059669',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <span>Tình huống tiếp theo</span>
            <Sparkles size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillSpeakingPage;
