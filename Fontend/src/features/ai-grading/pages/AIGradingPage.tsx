import React, { useState } from 'react';
import {
  FileCheck,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface GradingResult {
  score: number;
  hskLevelEstimated: string;
  grammarFixes: {
    original: string;
    correction: string;
    reason: string;
  }[];
  vocabularyUpgrades: {
    simpleWord: string;
    advancedWord: string;
    pinyin: string;
    explanation: string;
  }[];
  nativeRewrite: string;
  generalFeedback: string;
}

export const AIGradingPage: React.FC = () => {
  const [inputText, setInputText] = useState(
    '昨天我和朋友去饭馆吃饭。我们吃了北京烤鸭，非常好吃。但是那里的菜有一点儿贵。'
  );
  const [selectedHsk, setSelectedHsk] = useState<number>(2);
  const [isGrading, setIsGrading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);

  const handleStartGrading = () => {
    if (!inputText.trim()) return;
    setIsGrading(true);

    // Simulate AI evaluation analysis
    setTimeout(() => {
      setIsGrading(false);
      setResult({
        score: 92,
        hskLevelEstimated: 'HSK 2+ (Chuẩn ngữ pháp)',
        grammarFixes: [
          {
            original: '有一点儿贵',
            correction: '有点儿贵 (hoặc 有一点儿贵 - hợp lệ)',
            reason: 'Cách dùng 有点儿 thường mang sắc thái tiêu cực/không hài lòng về giá cả, dùng rất chuẩn xác!',
          },
        ],
        vocabularyUpgrades: [
          {
            simpleWord: '非常好吃',
            advancedWord: '非常美味 / 味道极好',
            pinyin: 'fēicháng měiwèi',
            explanation: 'Nâng tầm cách diễn đạt từ khẩu ngữ thành văn phong chuẩn mực.',
          },
        ],
        nativeRewrite:
          '昨天我和朋友去餐馆就餐。我们品尝了著名的北京烤鸭，味道极好。不过那里的菜品价格略微有些偏贵。',
        generalFeedback:
          'Đoạn văn có kết cấu mạch lạc, ngữ pháp hoàn chỉnh, sử dụng tốt liên từ 但是 (nhưng). Bạn đã đạt yêu cầu năng lực viết HSK 2 rất vững vàng!',
      });
    }, 1200);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 24px 48px 24px' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
          borderRadius: '20px',
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>
            <FileCheck size={14} />
            <span>AI TRỢ LÝ CHẤM BÀI VIẾT & SỬA LỖI NGỮ PHÁP</span>
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 800 }}>
            AI Chấm Điểm & Sửa Văn Tiếng Trung
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, maxWidth: '640px', lineHeight: 1.5 }}>
            Dán bài luận, đoạn văn hoặc bài tập viết của bạn để nhận phân tích lỗi ngữ pháp, gợi ý nâng cấp từ vựng và bản viết lại chuẩn giọng bản xứ.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', padding: '12px 20px', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>Chấm AI</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Mô phỏng 100%</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Input Column & Result Column */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Left Column: Input Form */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #e2e8f0',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              Nhập đoạn văn tiếng Trung
            </h3>

            {/* Target HSK Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Mục tiêu:</span>
              {[1, 2, 3, 4].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedHsk(lvl)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: selectedHsk === lvl ? '1.5px solid #4f46e5' : '1px solid #e2e8f0',
                    backgroundColor: selectedHsk === lvl ? '#eef2ff' : '#ffffff',
                    color: selectedHsk === lvl ? '#4f46e5' : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  HSK {lvl}
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={8}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Dán hoặc gõ đoạn văn tiếng Trung tại đây..."
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '14px',
              border: '1.5px solid #cbd5e1',
              fontSize: '15px',
              lineHeight: 1.6,
              fontFamily: 'var(--font-hanzi)',
              outline: 'none',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {inputText.length} ký tự
            </span>

            <button
              type="button"
              onClick={handleStartGrading}
              disabled={isGrading || !inputText.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: inputText.trim() ? '#4f46e5' : '#cbd5e1',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                cursor: inputText.trim() && !isGrading ? 'pointer' : 'not-allowed',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              }}
            >
              {isGrading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              <span>{isGrading ? 'AI đang phân tích...' : 'Bắt đầu chấm bài ngay'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: AI Analysis Output */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #e2e8f0',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
            Kết quả Đánh giá AI
          </h3>

          {!result ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: '#94a3b8', textAlign: 'center', gap: '12px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileCheck size={28} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Chưa có bài chấm</div>
              <div style={{ fontSize: '12px', maxWidth: '300px' }}>
                Nhập đoạn văn và bấm "Bắt đầu chấm bài ngay" để xem điểm số và phân tích ngữ pháp chi tiết.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Score header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#16a34a' }}>
                    {result.score} / 100
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d' }}>
                    {result.hskLevelEstimated}
                  </div>
                </div>
                <CheckCircle2 size={32} color="#16a34a" />
              </div>

              {/* General Feedback */}
              <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                {result.generalFeedback}
              </div>

              {/* Vocabulary upgrade */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Gợi ý nâng cấp từ vựng:
                </div>
                {result.vocabularyUpgrades.map((u, idx) => (
                  <div key={idx} style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ textDecoration: 'line-through', color: '#64748b', marginRight: '6px' }}>{u.simpleWord}</span>
                    <ArrowRight size={13} style={{ display: 'inline', margin: '0 4px', color: '#4f46e5' }} />
                    <strong style={{ color: '#4338ca' }}>{u.advancedWord}</strong> ({u.pinyin})
                    <div style={{ fontSize: '11px', color: '#6366f1', marginTop: '2px' }}>{u.explanation}</div>
                  </div>
                ))}
              </div>

              {/* Native Rewrite */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Bản sửa chuẩn bản xứ (Native Rewrite):
                </div>
                <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', fontSize: '14px', color: '#581c87', lineHeight: 1.6, fontFamily: 'var(--font-hanzi)' }}>
                  {result.nativeRewrite}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIGradingPage;
