import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BookText,
  Search,
  Volume2,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
} from 'lucide-react';
import { GrammarService } from '../services/grammar.service';
import type { GrammarPoint } from '../types/grammar.types';
import '../grammar-page.css';

export const GrammarPage: React.FC = () => {
  const [selectedHsk, setSelectedHsk] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('g-hsk1-01');

  // Practice Modal State
  const [practicingPoint, setPracticingPoint] = useState<GrammarPoint | null>(null);
  const [practiceAnswer, setPracticeAnswer] = useState<string>('');
  const [isPracticeSubmitted, setIsPracticeSubmitted] = useState(false);
  const [practiceIsCorrect, setPracticeIsCorrect] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Categories list
  const categories = [
    { id: 'all', label: 'Tất cả' },
    { id: 'cơ bản', label: 'Cơ bản' },
    { id: 'câu chữ', label: 'Câu chữ' },
    { id: 'trợ từ', label: 'Trợ từ' },
    { id: 'liên từ', label: 'Liên từ' },
    { id: 'bổ ngữ', label: 'Bổ ngữ' },
    { id: 'phó từ', label: 'Phó từ' },
  ];

  const hskLevels = [
    { label: 'Tất cả', val: null },
    { label: 'HSK 1', val: 1 },
    { label: 'HSK 2', val: 2 },
    { label: 'HSK 3', val: 3 },
    { label: 'HSK 4', val: 4 },
    { label: 'HSK 5', val: 5 },
    { label: 'HSK 6', val: 6 },
  ];

  const points = useMemo(() => {
    return GrammarService.getGrammarPoints({
      hskLevel: selectedHsk,
      category: selectedCategory,
      searchQuery,
    });
  }, [selectedHsk, selectedCategory, searchQuery]);

  // Audio Speech Synthesis
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleResetFilters = () => {
    setSelectedHsk(null);
    setSelectedCategory('all');
    setSearchQuery('');
  };

  // Open Practice Modal
  const handleStartPractice = (point: GrammarPoint) => {
    setPracticingPoint(point);
    setPracticeAnswer('');
    setIsPracticeSubmitted(false);
    setPracticeIsCorrect(false);
  };

  // Close Practice Modal & restore scroll
  const handleClosePractice = () => {
    setPracticingPoint(null);
    setPracticeAnswer('');
    setIsPracticeSubmitted(false);
    setPracticeIsCorrect(false);
  };

  // Handle Practice Evaluation
  const handleSubmitPractice = () => {
    if (!practicingPoint || !practiceAnswer.trim()) return;

    const normalizedUser = practiceAnswer
      .replace(/[.,!?。！？\s]/g, '')
      .toLowerCase();

    const standard = (
      practicingPoint.practice?.standardAnswer ||
      practicingPoint.examples[0]?.chinese ||
      ''
    )
      .replace(/[.,!?。！？\s]/g, '')
      .toLowerCase();

    const acceptable = (practicingPoint.practice?.acceptableAnswers || []).map((ans) =>
      ans.replace(/[.,!?。！？\s]/g, '').toLowerCase()
    );

    const isMatch = normalizedUser === standard || acceptable.includes(normalizedUser);

    setPracticeIsCorrect(isMatch);
    setIsPracticeSubmitted(true);
  };

  // Append clicked token to answer input
  const handleAddWordToken = (token: string) => {
    setPracticeAnswer((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}${token}` : token;
    });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle Escape key & Scroll lock for Modal
  useEffect(() => {
    if (practicingPoint) {
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClosePractice();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'auto';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [practicingPoint]);

  return (
    <div className="grammar-page-container">
      {/* 1. Header (Clean, inspiring, no tall purple banner) */}
      <header className="grammar-header">
        <div>
          <div className="grammar-header-brand-badge">
            <BookText size={13} />
            <span>KHO NGỮ PHÁP TIẾNG TRUNG · HSK 1–6</span>
          </div>
          <h1 className="grammar-header-title">
            Khám phá ngữ pháp
            <span className="grammar-header-title-hanzi">语法库</span>
          </h1>
          <p className="grammar-header-subtitle">
            Hệ thống hóa cấu trúc ngữ pháp chuẩn HSK 1 đến 6. Nắm chắc công thức trực quan, ví dụ song ngữ, luyện nghe phát âm và thực hành đặt câu chuẩn xác.
          </p>
        </div>

        <div className="grammar-header-stats">
          <div className="grammar-stat-chip">
            <span className="grammar-stat-chip-number">{points.length}</span>
            <span className="grammar-stat-chip-label">Điểm ngữ pháp</span>
          </div>
          <div className="grammar-stat-chip">
            <span className="grammar-stat-chip-number">HSK 1-6</span>
            <span className="grammar-stat-chip-label">Cấp độ</span>
          </div>
        </div>
      </header>

      {/* 2. Search & Filter Bar */}
      <section className="grammar-filter-card" aria-label="Bộ lọc và tìm kiếm ngữ pháp">
        {/* Search Input */}
        <div className="grammar-search-wrapper">
          <Search size={18} className="grammar-search-icon" />
          <input
            type="text"
            className="grammar-search-input"
            placeholder="Tìm kiếm theo chữ Hán, Pinyin, cấu trúc (shì, bǐ, 把, trợ từ)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Tìm kiếm ngữ pháp"
          />
          {searchQuery && (
            <button
              type="button"
              className="grammar-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Xóa nội dung tìm kiếm"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* HSK Level Filter */}
        <div className="grammar-filter-row">
          <span className="grammar-filter-label">Cấp HSK:</span>
          <div className="grammar-pill-group">
            {hskLevels.map((lvl) => {
              const isActive = selectedHsk === lvl.val;
              return (
                <button
                  key={String(lvl.val)}
                  type="button"
                  className={`grammar-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedHsk(lvl.val)}
                >
                  {lvl.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filter */}
        <div className="grammar-filter-row">
          <span className="grammar-filter-label">Phân loại:</span>
          <div className="grammar-pill-group">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`grammar-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Status & Reset */}
        <div className="grammar-filter-status-row">
          <span>
            Hiển thị <strong>{points.length}</strong> điểm ngữ pháp phù hợp
            {selectedHsk && ` · HSK ${selectedHsk}`}
            {selectedCategory !== 'all' && ` · Thể loại: ${selectedCategory}`}
          </span>
          {(selectedHsk !== null || selectedCategory !== 'all' || searchQuery) && (
            <button
              type="button"
              className="grammar-reset-btn"
              onClick={handleResetFilters}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </section>

      {/* 3. Grammar Point Accordion Cards */}
      <main className="grammar-list" aria-label="Danh sách điểm ngữ pháp">
        {points.length === 0 ? (
          <div className="grammar-empty-state">
            <HelpCircle className="grammar-empty-icon" />
            <h3 className="grammar-empty-title">Không tìm thấy điểm ngữ pháp phù hợp</h3>
            <p className="grammar-empty-desc">
              Không có kết quả nào khớp với từ khóa hoặc bộ lọc bạn đã chọn. Vui lòng thử từ khóa khác hoặc xóa bộ lọc.
            </p>
            <button
              type="button"
              className="grammar-practice-btn"
              onClick={handleResetFilters}
              style={{ marginTop: '8px' }}
            >
              <RotateCcw size={16} />
              <span>Xóa bộ lọc để xem tất cả</span>
            </button>
          </div>
        ) : (
          points.map((point) => {
            const isExpanded = expandedId === point.id;
            const diffClass =
              point.difficulty === 'Dễ'
                ? 'de'
                : point.difficulty === 'Trung bình'
                ? 'trung-binh'
                : 'kha';

            return (
              <article
                key={point.id}
                className={`grammar-card ${isExpanded ? 'expanded' : ''}`}
              >
                {/* Header (Accordion Trigger) */}
                <button
                  type="button"
                  className="grammar-card-header"
                  onClick={() => handleToggleExpand(point.id)}
                  aria-expanded={isExpanded}
                >
                  <div className="grammar-card-header-left">
                    <div className="grammar-badge-row">
                      <span className="grammar-badge-hsk">HSK {point.hskLevel}</span>
                      <span className="grammar-badge-category">{point.category}</span>
                      <span className={`grammar-badge-diff ${diffClass}`}>
                        {point.difficulty}
                      </span>
                    </div>
                    <h2 className="grammar-card-title">{point.title}</h2>
                    <span className="grammar-card-pinyin-title">{point.pinyinTitle}</span>
                  </div>

                  <div className="grammar-card-chevron">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {/* Expanded Body */}
                {isExpanded && (
                  <div className="grammar-card-body">
                    {/* Formula Box */}
                    <div className="grammar-formula-box">
                      <span className="grammar-formula-label">Cấu trúc công thức</span>
                      <div className="grammar-formula-text">{point.structure}</div>
                    </div>

                    {/* Explanation */}
                    <div className="grammar-explanation-box">
                      <p style={{ margin: 0 }}>{point.explanation}</p>
                    </div>

                    {/* Bilingual Examples */}
                    <div className="grammar-examples-section">
                      <span className="grammar-examples-title">Mẫu câu ví dụ song ngữ</span>
                      {point.examples.map((ex, idx) => (
                        <div key={idx} className="grammar-example-item">
                          <div className="grammar-example-content">
                            <span className="grammar-example-hanzi">{ex.chinese}</span>
                            <span className="grammar-example-pinyin">{ex.pinyin}</span>
                            <span className="grammar-example-vietnamese">{ex.vietnamese}</span>
                          </div>
                          <button
                            type="button"
                            className="grammar-audio-btn"
                            onClick={() => speakText(ex.chinese)}
                            title="Nghe phát âm chuẩn"
                            aria-label={`Nghe phát âm: ${ex.chinese}`}
                          >
                            <Volume2 size={20} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Usage Note */}
                    {point.usageNote && (
                      <div className="grammar-usage-note">
                        <strong>Lưu ý: </strong>
                        {point.usageNote}
                      </div>
                    )}

                    {/* Action CTA */}
                    <div className="grammar-action-row">
                      <button
                        type="button"
                        className="grammar-practice-btn"
                        onClick={() => handleStartPractice(point)}
                      >
                        <Play size={16} fill="currentColor" />
                        <span>Luyện tập cấu trúc này</span>
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </main>

      {/* 4. Dedicated Grammar Practice Modal */}
      {practicingPoint && (
        <div
          className="grammar-modal-overlay"
          onClick={handleClosePractice}
          role="dialog"
          aria-modal="true"
          aria-labelledby="practice-modal-title"
        >
          <div
            className="grammar-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="grammar-modal-header">
              <div>
                <h3 id="practice-modal-title" className="grammar-modal-title">
                  Luyện tập ngữ pháp
                </h3>
                <span className="grammar-modal-subtitle">
                  {practicingPoint.title} · HSK {practicingPoint.hskLevel}
                </span>
              </div>
              <button
                type="button"
                className="grammar-modal-close"
                onClick={handleClosePractice}
                aria-label="Đóng bài tập"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="grammar-modal-body">
              <div className="grammar-practice-prompt">
                {practicingPoint.practice?.prompt ||
                  'Sắp xếp hoặc viết lại câu theo đúng cấu trúc ngữ pháp sau:'}
              </div>

              {/* Scramble Words Pool (if available) */}
              {practicingPoint.practice?.scrambledWords &&
                practicingPoint.practice.scrambledWords.length > 0 && (
                  <div className="grammar-scramble-pool">
                    {practicingPoint.practice.scrambledWords.map((token, i) => (
                      <button
                        key={i}
                        type="button"
                        className="grammar-word-token"
                        onClick={() => handleAddWordToken(token)}
                      >
                        {token}
                      </button>
                    ))}
                  </div>
                )}

              {/* User Answer Textarea */}
              <div>
                <label
                  htmlFor="grammar-practice-input"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#64748b',
                    marginBottom: '6px',
                  }}
                >
                  Câu trả lời của bạn:
                </label>
                <textarea
                  id="grammar-practice-input"
                  ref={inputRef}
                  className="grammar-practice-input"
                  placeholder="Nhập câu tiếng Trung của bạn tại đây..."
                  value={practiceAnswer}
                  onChange={(e) => setPracticeAnswer(e.target.value)}
                  disabled={isPracticeSubmitted}
                />
              </div>

              {/* Evaluation Result */}
              {isPracticeSubmitted && (
                <div
                  className={`grammar-result-box ${
                    practiceIsCorrect ? 'correct' : 'incorrect'
                  }`}
                >
                  <div className="grammar-result-header">
                    {practiceIsCorrect ? (
                      <>
                        <CheckCircle2 size={20} />
                        <span>Chính xác! Câu của bạn chuẩn ngữ pháp.</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={20} />
                        <span>Chưa chính xác. Hãy đối chiếu với mẫu câu chuẩn bên dưới:</span>
                      </>
                    )}
                  </div>

                  <div className="grammar-comparison-row">
                    <span className="grammar-comparison-label">Câu của bạn:</span>
                    <span className="grammar-comparison-hanzi">{practiceAnswer}</span>
                  </div>

                  <div className="grammar-comparison-row">
                    <span className="grammar-comparison-label">Đáp án mẫu chuẩn:</span>
                    <span className="grammar-comparison-hanzi">
                      {practicingPoint.practice?.standardAnswer ||
                        practicingPoint.examples[0]?.chinese}
                    </span>
                    {practicingPoint.practice?.explanation && (
                      <span style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        Giải thích: {practicingPoint.practice.explanation}
                      </span>
                    )}
                  </div>

                  <div className="grammar-audit-disclaimer">
                    <HelpCircle size={14} />
                    <span>Đối chiếu câu trả lời với mẫu câu chuẩn của điểm ngữ pháp này (không qua xử lý AI).</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="grammar-modal-footer">
              {!isPracticeSubmitted ? (
                <button
                  type="button"
                  className="grammar-practice-btn"
                  onClick={handleSubmitPractice}
                  disabled={!practiceAnswer.trim()}
                  style={{
                    opacity: !practiceAnswer.trim() ? 0.6 : 1,
                    cursor: !practiceAnswer.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  Kiểm tra câu trả lời
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="grammar-pill"
                    onClick={() => {
                      setPracticeAnswer('');
                      setIsPracticeSubmitted(false);
                      setPracticeIsCorrect(false);
                    }}
                    style={{ padding: '0 16px', height: '44px' }}
                  >
                    Thử làm lại
                  </button>
                  <button
                    type="button"
                    className="grammar-practice-btn"
                    onClick={handleClosePractice}
                  >
                    Hoàn thành
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
