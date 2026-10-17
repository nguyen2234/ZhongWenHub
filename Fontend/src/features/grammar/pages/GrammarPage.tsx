import React, { useState, useMemo } from 'react';
import {
  BookText,
  Search,
  Volume2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Filter,
  CheckCircle,
} from 'lucide-react';
import { GrammarService } from '../services/grammar.service';
import type { GrammarPoint } from '../types/grammar.types';

export const GrammarPage: React.FC = () => {
  const [selectedHsk, setSelectedHsk] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('g-hsk1-01');
  const [practicingPoint, setPracticingPoint] = useState<GrammarPoint | null>(null);
  const [practiceAnswer, setPracticeAnswer] = useState<string>('');
  const [isPracticeSubmitted, setIsPracticeSubmitted] = useState(false);

  const points = useMemo(() => {
    return GrammarService.getGrammarPoints({
      hskLevel: selectedHsk,
      category: selectedCategory,
      searchQuery,
    });
  }, [selectedHsk, selectedCategory, searchQuery]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStartPractice = (point: GrammarPoint) => {
    setPracticingPoint(point);
    setPracticeAnswer('');
    setIsPracticeSubmitted(false);
  };

  return (
    <div className="student-content-container">
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4338ca 0%, #312e81 100%)',
          borderRadius: '20px',
          padding: '28px 32px',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(67, 56, 202, 0.18)',
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
            <BookText size={14} />
            <span>KHO NGỮ PHÁP TIẾNG TRUNG CHUẨN HSK</span>
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 800 }}>
            Hệ thống Cấu trúc Ngữ pháp HSK 1 → 6
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, maxWidth: '640px', lineHeight: 1.5 }}>
            Tra cứu cấu trúc, phân tích ví dụ song ngữ, luyện nghe phát âm chuẩn và thực hành vận dụng các mẫu câu thông dụng nhất.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', padding: '12px 20px', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>{points.length}</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Điểm ngữ pháp</div>
          </div>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', padding: '12px 20px', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>HSK 1–3</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Trọng tâm</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1.5px solid #e2e8f0',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Tìm kiếm ngữ pháp, cấu trúc, từ khóa (shì, bǐ, 把, trợ từ)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 16px 0 40px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* HSK Level Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>Cấp độ:</span>
            {[
              { label: 'Tất cả', val: null },
              { label: 'HSK 1', val: 1 },
              { label: 'HSK 2', val: 2 },
              { label: 'HSK 3', val: 3 },
            ].map((btn) => (
              <button
                key={String(btn.val)}
                type="button"
                onClick={() => setSelectedHsk(btn.val)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: selectedHsk === btn.val ? 700 : 500,
                  border: selectedHsk === btn.val ? '1.5px solid #4338ca' : '1px solid #e2e8f0',
                  backgroundColor: selectedHsk === btn.val ? '#eef2ff' : '#ffffff',
                  color: selectedHsk === btn.val ? '#4338ca' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
          <Filter size={14} style={{ color: '#94a3b8' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Nhóm ngữ pháp:</span>
          {[
            { id: 'all', label: 'Tất cả nhóm' },
            { id: 'cơ bản', label: 'Cơ bản' },
            { id: 'câu chữ', label: 'Câu chữ đặc biệt' },
            { id: 'trợ từ', label: 'Trợ từ' },
            { id: 'liên từ', label: 'Liên từ' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: selectedCategory === cat.id ? 700 : 500,
                border: 'none',
                backgroundColor: selectedCategory === cat.id ? '#4338ca' : '#f1f5f9',
                color: selectedCategory === cat.id ? '#ffffff' : '#64748b',
                cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grammar Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {points.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#64748b' }}>
            Không tìm thấy điểm ngữ pháp phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          points.map((item) => {
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: isExpanded ? '1.5px solid #818cf8' : '1.5px solid #e2e8f0',
                  boxShadow: isExpanded ? '0 4px 16px rgba(99, 102, 241, 0.08)' : 'none',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: isExpanded ? '#faf5ff' : '#ffffff',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    <div
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        backgroundColor: '#eef2ff',
                        color: '#4338ca',
                        fontSize: '11px',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      HSK {item.hskLevel}
                    </div>

                    <div>
                      <h3 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                        {item.title}
                      </h3>
                      <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
                        {item.structure}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        backgroundColor: item.difficulty === 'Dễ' ? '#dcfce7' : item.difficulty === 'Trung bình' ? '#fef3c7' : '#fee2e2',
                        color: item.difficulty === 'Dễ' ? '#16a34a' : item.difficulty === 'Trung bình' ? '#d97706' : '#dc2626',
                      }}
                    >
                      {item.difficulty}
                    </span>

                    {isExpanded ? <ChevronUp size={18} style={{ color: '#64748b' }} /> : <ChevronDown size={18} style={{ color: '#64748b' }} />}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ padding: '20px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {/* Explanation */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Giải thích ngữ nghĩa & cách dùng:
                      </div>
                      <p style={{ margin: 0, fontSize: '13.5px', color: '#1e293b', lineHeight: 1.6 }}>
                        {item.explanation}
                      </p>
                    </div>

                    {/* Structure Callout */}
                    <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#f8fafc', borderLeft: '4px solid #4338ca', fontSize: '13px', fontWeight: 600, color: '#1e1b4b' }}>
                      Công thức: <code style={{ color: '#be123c', fontFamily: 'monospace' }}>{item.structure}</code>
                    </div>

                    {/* Examples */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Ví dụ thực tế:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {item.examples.map((ex, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '12px 14px',
                              borderRadius: '10px',
                              backgroundColor: '#f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-hanzi)' }}>
                                {ex.chinese}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600, marginBottom: '2px' }}>
                                {ex.pinyin}
                              </div>
                              <div style={{ fontSize: '12px', color: '#475569' }}>
                                {ex.vietnamese}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => speakText(ex.chinese)}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                color: '#4338ca',
                                display: 'flex',
                                alignItems: 'center',
                                justifySelf: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0,
                              }}
                              title="Nghe phát âm chuẩn"
                            >
                              <Volume2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Usage note if any */}
                    {item.usageNote && (
                      <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', fontSize: '12px', color: '#92400e' }}>
                        💡 <strong>Lưu ý:</strong> {item.usageNote}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleStartPractice(item)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor: '#4338ca',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Sparkles size={14} />
                        <span>Luyện tập mẫu câu này</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Practice Interactive Modal */}
      {practicingPoint && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setPracticingPoint(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eef2ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={16} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Thực hành: {practicingPoint.title}</h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Áp dụng cấu trúc: {practicingPoint.structure}</span>
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#f8fafc', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Đề bài: Hãy hoàn thành hoặc sắp xếp câu tương ứng:
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                Dịch sang tiếng Trung: "{practicingPoint.examples[0].vietnamese}"
              </div>
            </div>

            <textarea
              placeholder="Nhập câu tiếng Trung của bạn (hoặc Pinyin)..."
              value={practiceAnswer}
              onChange={(e) => setPracticeAnswer(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'var(--font-hanzi)',
                marginBottom: '16px',
              }}
            />

            {isPracticeSubmitted && (
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                  <CheckCircle size={15} />
                  <span>Đáp án tham khảo:</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  {practicingPoint.examples[0].chinese}
                </div>
                <div style={{ fontSize: '12px', color: '#6366f1' }}>
                  {practicingPoint.examples[0].pinyin}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setPracticingPoint(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>
              {!isPracticeSubmitted ? (
                <button
                  type="button"
                  onClick={() => setIsPracticeSubmitted(true)}
                  disabled={practiceAnswer.trim().length === 0}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: practiceAnswer.trim().length > 0 ? '#4338ca' : '#cbd5e1',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: practiceAnswer.trim().length > 0 ? 'pointer' : 'not-allowed',
                  }}
                >
                  Kiểm tra đáp án
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPracticingPoint(null)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Hoàn thành
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrammarPage;
