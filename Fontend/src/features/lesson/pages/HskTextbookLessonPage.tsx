import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import {
  Languages,
  BookText,
  MessageSquare,
  Dumbbell,
  CheckCircle2,
  Volume2,
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Flame,
  Award,
  Clock,
  Check,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Maximize2,
} from 'lucide-react';
import {
  hskTextbookService,
  type HskTextbookData,
  type TextbookVocabulary,
} from '../services/hsk-textbook.service';
import { LessonTableOfContents } from '../components/LessonTableOfContents';
import { LessonPracticeModal } from '../components/LessonPracticeModal';
import { useLearningState } from '../../learning';
import { findNextLessonId } from '../../learning/data/curriculumData';
import { Button, StickerIllustration } from '../../../design-system';
import './HskTextbookLessonPage.css';

// Text-to-Speech Audio Helper
const playChineseTTS = (text: string, audioUrl?: string) => {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(() => playSpeechFallback(text));
    return;
  }
  playSpeechFallback(text);
};

function playSpeechFallback(text: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }
}

export const HskTextbookLessonPage: React.FC = () => {
  const navigate = useNavigate();
  const { lessonId: paramLessonId } = useParams<{ lessonId?: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const queryId = searchParams.get('id');

  const {
    state: learningState,
    startLesson: initLearningLesson,
    completeLesson: completeLearningLesson,
    completedLessonIds,
    addVocabularyWord,
    isVocabularySaved,
    streakDays,
  } = useLearningState();

  const activeLessonId = paramLessonId || queryId || learningState.currentLessonId || 'les-8';

  // Data State
  const [textbookData, setTextbookData] = useState<HskTextbookData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active section for Scroll-Spy & Reading Progress
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [readingProgress, setReadingProgress] = useState<number>(0);

  // Section interactive states
  const [showPinyin, setShowPinyin] = useState<boolean>(true);
  const [showTranslation, setShowTranslation] = useState<boolean>(true);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState<boolean>(false);
  const [currentPracticeStepIndex, setCurrentPracticeStepIndex] = useState<number>(0);
  const practiceTriggerRef = useRef<HTMLButtonElement>(null);
  const [savedWordsState, setSavedWordsState] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load lesson textbook content
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await hskTextbookService.getTextbookLesson(activeLessonId);
        if (!isCancelled) {
          setTextbookData(data);
          initLearningLesson(activeLessonId);
          setIsLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('[HskTextbookLessonPage] Error fetching lesson:', err);
          setErrorMessage('Không thể tải bài học. Vui lòng thử lại sau.');
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [activeLessonId, initLearningLesson]);

  // Check if lesson is completed in reactive learningState
  const isLessonCompleted = useMemo(() => {
    return completedLessonIds.includes(activeLessonId);
  }, [completedLessonIds, activeLessonId]);

  const practiceStatus = useMemo<'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'>(() => {
    if (isLessonCompleted) return 'COMPLETED';
    if (currentPracticeStepIndex > 0) return 'IN_PROGRESS';
    return 'NOT_STARTED';
  }, [isLessonCompleted, currentPracticeStepIndex]);

  // Show temporary toast message
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Scroll-Spy with IntersectionObserver
  useEffect(() => {
    const sectionIds = ['overview', 'vocabulary', 'grammar', 'dialogue', 'practice', 'complete'];
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    // Use IntersectionObserver with comfortable reading viewport zone
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: '-10% 0px -65% 0px',
        threshold: 0,
      }
    );

    elements.forEach((el) => observer.observe(el));

    // Reading progress calculation based on window scroll
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const currentProgress = (window.scrollY / totalScroll) * 100;
        setReadingProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isLoading, textbookData]);

  // Smooth scroll to a section on click
  const handleScrollToSection = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  // Handle saving vocabulary to SRS
  const handleToggleSrs = useCallback((vocab: TextbookVocabulary) => {
    const vocabKey = String(vocab.id);
    const isCurrentlySaved = savedWordsState[vocabKey] ?? isVocabularySaved(vocab.hanzi);

    if (!isCurrentlySaved) {
      addVocabularyWord({
        vocabularyId: `vocab-${vocab.id}`,
        hanzi: vocab.hanzi,
        pinyin: vocab.pinyin,
        meaning: vocab.meaning,
        hskLevel: vocab.hskLevel || textbookData?.hskLevel || 1,
        source: `HSK ${textbookData?.hskLevel || 1} · Bài ${textbookData?.lessonNumber || 1}`,
      });
      setSavedWordsState((prev) => ({ ...prev, [vocabKey]: true }));
      triggerToast(`Đã lưu "${vocab.hanzi}" vào kho ôn tập Spaced Repetition (SRS)! ✨`);
    } else {
      triggerToast(`Từ "${vocab.hanzi}" đã có sẵn trong danh sách ôn tập SRS.`);
    }
  }, [savedWordsState, isVocabularySaved, addVocabularyWord, textbookData]);

  // Play entire dialogue sequentially
  const handlePlayFullDialogue = () => {
    if (!textbookData?.dialogue.lines.length) return;
    const lines = textbookData.dialogue.lines;
    let idx = 0;

    function playNext() {
      if (idx < lines.length) {
        const line = lines[idx];
        idx++;
        playChineseTTS(line.hanzi);
        setTimeout(playNext, 2500);
      }
    }

    playNext();
    triggerToast('Đang phát toàn bộ đoạn hội thoại...');
  };

  // Handle lesson completion from embedded practice
  const handleEmbeddedComplete = (score: number, totalQuestions: number, xpEarned: number) => {
    if (!textbookData) return;
    completeLearningLesson({
      lessonId: activeLessonId,
      quizScore: score,
      totalQuizQuestions: totalQuestions,
      xpEarned: xpEarned || textbookData.xpReward,
    });
    triggerToast(`Chúc mừng! Bạn đã hoàn thành bài học và nhận +${xpEarned || textbookData.xpReward} XP! 🎉`);
    handleScrollToSection('complete');
  };

  // Next lesson navigation
  const handleNextLesson = () => {
    const nextId = findNextLessonId(activeLessonId);
    if (nextId) {
      navigate(`/lesson?id=${nextId}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/learning-path?mode=hsk');
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}
      >
        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary, #E60012)' }} />
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
          Đang chuẩn bị giáo trình bài học...
        </span>
      </div>
    );
  }

  // Error State
  if (errorMessage || !textbookData) {
    return (
      <div
        style={{
          minHeight: '50vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '24px',
        }}
      >
        <AlertCircle size={44} style={{ color: '#ef4444' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          Không tìm thấy nội dung bài học
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0, textAlign: 'center', maxWidth: '400px' }}>
          {errorMessage || 'Dữ liệu bài học chưa khả dụng hoặc đường dẫn không hợp lệ.'}
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="primary" onClick={() => window.location.reload()}>Thử lại</Button>
          <Button variant="outline" onClick={() => navigate('/learning-path?mode=hsk')}>Quay lại giáo trình</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="hsk-textbook-page-root">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Sparkles size={16} color="#fbbf24" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Two-Column Viewport: Left Content + Right Sticky TOC */}
      <div className="hsk-textbook-layout">
        {/* =====================================================================
            MAIN DIGITAL TEXTBOOK CONTENT (Vertical Scrolling Sections)
            ===================================================================== */}
        <div className="hsk-textbook-content">
          {/* SECTION 1: TỔNG QUAN BÀI HỌC (#overview) */}
          <section id="overview" className="hsk-textbook-section" aria-label="Tổng quan bài học">
            <div className="hsk-overview-card">
              {/* Breadcrumb Navigation */}
              <nav className="hsk-breadcrumb" aria-label="Breadcrumb">
                <Link to="/learning-path?mode=hsk" className="hsk-breadcrumb-link">Giáo trình HSK</Link>
                <span>/</span>
                <Link to={`/learning-path?mode=hsk&level=${textbookData.hskLevel}`} className="hsk-breadcrumb-link">
                  HSK {textbookData.hskLevel}
                </Link>
                <span>/</span>
                <span>{textbookData.unitTitleVi}</span>
                <span>/</span>
                <span style={{ color: '#0f172a', fontWeight: 700 }}>Bài {textbookData.lessonNumber}</span>
              </nav>

              {/* Titles + Mascot Sticker */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                <div className="hsk-overview-titles" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#FFF0F1',
                          color: 'var(--primary, #E60012)',
                          fontSize: '12px',
                          fontWeight: 800,
                        }}
                      >
                        HSK {textbookData.hskLevel} • BÀI {textbookData.lessonNumber}
                      </span>
                      {isLessonCompleted && (
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#ecfdf5',
                            color: '#16a34a',
                            fontSize: '12px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Check size={13} />
                          Đã hoàn thành
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => playChineseTTS(textbookData.titleZh)}
                      className="hsk-icon-action-btn"
                      title="Phát âm tiêu đề tiếng Trung"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>

                  <div className="hsk-overview-hanzi-title">{textbookData.titleZh}</div>
                  <div className="hsk-overview-pinyin-title">{textbookData.pinyin}</div>
                  <div className="hsk-overview-vi-title">{textbookData.titleVi}</div>
                </div>

                <div className="hsk-overview-sticker-wrap" aria-hidden="true">
                  <StickerIllustration name="learning" size="lg" decorative />
                </div>
              </div>

              {/* Objectives List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Mục tiêu học tập:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {textbookData.objectives.map((obj, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13.5px', color: '#334155' }}>
                      <CheckCircle2 size={16} color="var(--primary, #E60012)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meta Stats Chips */}
              <div className="hsk-meta-chips-row">
                <span className="hsk-meta-chip">
                  <Languages size={14} color="#64748b" />
                  {textbookData.vocabularies.length} từ vựng
                </span>
                <span className="hsk-meta-chip">
                  <BookText size={14} color="#64748b" />
                  {textbookData.grammars.length} điểm ngữ pháp
                </span>
                <span className="hsk-meta-chip">
                  <MessageSquare size={14} color="#64748b" />
                  {textbookData.dialogue.lines.length} câu hội thoại
                </span>
                <span className="hsk-meta-chip">
                  <Clock size={14} color="#64748b" />
                  ~{textbookData.durationMinutes} phút
                </span>
                <span className="hsk-meta-chip" style={{ color: 'var(--primary, #E60012)', fontWeight: 700, backgroundColor: '#FFF0F1', borderColor: '#fed7da' }}>
                  <Award size={14} />
                  +{textbookData.xpReward} XP
                </span>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
                <Button variant="primary" onClick={() => handleScrollToSection('practice')}>
                  <Dumbbell size={16} />
                  Luyện tập củng cố ngay
                </Button>
                <Button variant="outline" onClick={() => handleScrollToSection('vocabulary')}>
                  <Languages size={16} />
                  Đọc từ vựng ({textbookData.vocabularies.length})
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/lesson?id=${activeLessonId}`)}
                  title="Mở giao diện tập trung từng bước (Focus Mode)"
                >
                  <Maximize2 size={15} />
                  Chế độ tập trung
                </Button>
              </div>
            </div>
          </section>

          {/* SECTION 2: TỪ VỰNG (#vocabulary) */}
          <section id="vocabulary" className="hsk-textbook-section" aria-label="Từ vựng bài học">
            <div className="hsk-section-header-box">
              <div className="hsk-section-title-group">
                <div className="hsk-section-icon-badge">
                  <Languages size={18} />
                </div>
                <div>
                  <h2 className="hsk-section-main-title">Từ vựng trọng tâm</h2>
                  <p className="hsk-section-subtitle">
                    {textbookData.vocabularies.length} từ vựng mới kèm phiên âm, từ loại và câu ví dụ ứng dụng
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  textbookData.vocabularies.forEach((v) => handleToggleSrs(v));
                  triggerToast('Đã lưu tất cả từ vựng của bài vào kho Spaced Repetition (SRS)!');
                }}
                className="ds-btn ds-btn-outline"
                style={{ fontSize: '12.5px', height: '34px', gap: '6px' }}
              >
                <BookmarkCheck size={15} color="var(--primary, #E60012)" />
                Lưu toàn bộ vào SRS
              </button>
            </div>

            {/* 2-Column Responsive Vocabulary Cards Grid */}
            <div className="hsk-vocab-grid">
              {textbookData.vocabularies.map((vocab) => {
                const vocabKey = String(vocab.id);
                const isSaved = savedWordsState[vocabKey] ?? isVocabularySaved(vocab.hanzi);

                return (
                  <div key={vocab.id} className="hsk-vocab-card">
                    <div>
                      <div className="hsk-vocab-card-top">
                        <div className="hsk-vocab-main-info">
                          <span className="hsk-vocab-index-circle">{vocab.orderNumber}</span>
                          <div>
                            <div className="hsk-vocab-hanzi">{vocab.hanzi}</div>
                            <div className="hsk-vocab-pinyin">{vocab.pinyin}</div>
                          </div>
                        </div>

                        <div className="hsk-vocab-card-actions">
                          <button
                            type="button"
                            onClick={() => playChineseTTS(vocab.hanzi, vocab.audioUrl)}
                            className="hsk-icon-action-btn"
                            title={`Phát âm từ "${vocab.hanzi}"`}
                            aria-label={`Phát âm từ ${vocab.hanzi}`}
                          >
                            <Volume2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSrs(vocab)}
                            className="hsk-icon-action-btn"
                            style={{
                              backgroundColor: isSaved ? '#FFF0F1' : '#ffffff',
                              color: isSaved ? 'var(--primary, #E60012)' : '#64748b',
                              borderColor: isSaved ? '#fed7da' : '#e2e8f0',
                            }}
                            title={isSaved ? 'Đã lưu trong SRS' : 'Lưu vào SRS Flashcard'}
                            aria-label={isSaved ? 'Đã lưu trong SRS' : 'Lưu vào SRS'}
                          >
                            {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                          </button>
                        </div>
                      </div>

                      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {vocab.partOfSpeech && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#64748b',
                              backgroundColor: '#f1f5f9',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            {vocab.partOfSpeech}
                          </span>
                        )}
                        {vocab.radical && (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            Bộ: {vocab.radical}
                          </span>
                        )}
                      </div>

                      <div className="hsk-vocab-meaning">{vocab.meaning}</div>
                    </div>

                    {/* Example Sentence */}
                    {vocab.exampleHanzi && (
                      <div className="hsk-vocab-example-box">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="hsk-vocab-example-hanzi">{vocab.exampleHanzi}</div>
                          <div className="hsk-vocab-example-pinyin">{vocab.examplePinyin}</div>
                          <div className="hsk-vocab-example-vi">{vocab.exampleMeaning}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => playChineseTTS(vocab.exampleHanzi)}
                          className="hsk-icon-action-btn"
                          style={{ width: '28px', height: '28px', flexShrink: 0 }}
                          title="Phát âm câu ví dụ"
                        >
                          <Volume2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 3: NGỮ PHÁP (#grammar) */}
          <section id="grammar" className="hsk-textbook-section" aria-label="Ngữ pháp bài học">
            <div className="hsk-section-header-box">
              <div className="hsk-section-title-group">
                <div className="hsk-section-icon-badge">
                  <BookText size={18} />
                </div>
                <div>
                  <h2 className="hsk-section-main-title">Ngữ pháp & Cấu trúc</h2>
                  <p className="hsk-section-subtitle">
                    Quy tắc ngữ pháp trọng điểm giúp bạn đặt câu chính xác và diễn đạt mạch lạc
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {textbookData.grammars.map((grammar) => (
                <div key={grammar.id} className="hsk-grammar-card">
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>
                      {grammar.title}
                    </h3>

                    {/* Formula Box */}
                    <div className="hsk-grammar-formula-box">
                      <span className="hsk-grammar-formula-label">Cấu trúc công thức:</span>
                      <span className="hsk-grammar-formula-text">{grammar.structure}</span>
                    </div>
                  </div>

                  <div className="hsk-grammar-explanation">
                    {grammar.explanation}
                  </div>

                  {grammar.usageNote && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: '#fffbeb',
                        border: '1px solid #fef3c7',
                        fontSize: '13px',
                        color: '#92400e',
                      }}
                    >
                      {grammar.usageNote}
                    </div>
                  )}

                  {/* Examples List */}
                  {grammar.examples && grammar.examples.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                        Ví dụ minh họa:
                      </span>
                      <div className="hsk-grammar-examples-list">
                        {grammar.examples.map((ex, idx) => (
                          <div key={idx} className="hsk-grammar-example-item">
                            <div>
                              <div style={{ fontFamily: 'var(--font-hanzi)', fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                                {ex.hanzi}
                              </div>
                              <div style={{ fontFamily: 'var(--font-pinyin)', fontSize: '12.5px', color: '#64748b' }}>
                                {ex.pinyin}
                              </div>
                              <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px' }}>
                                {ex.meaning}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => playChineseTTS(ex.hanzi)}
                              className="hsk-icon-action-btn"
                              title="Nghe phát âm ví dụ"
                            >
                              <Volume2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 4: HỘI THOẠI (#dialogue) */}
          <section id="dialogue" className="hsk-textbook-section" aria-label="Hội thoại thực tế">
            <div className="hsk-section-header-box">
              <div className="hsk-section-title-group">
                <div className="hsk-section-icon-badge">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h2 className="hsk-section-main-title">{textbookData.dialogue.title}</h2>
                  <p className="hsk-section-subtitle">{textbookData.dialogue.contextDescription}</p>
                </div>
              </div>
            </div>

            <div className="hsk-dialogue-card">
              {/* Dialogue Controls Bar */}
              <div className="hsk-dialogue-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handlePlayFullDialogue}
                    className="ds-btn ds-btn-primary"
                    style={{ height: '34px', fontSize: '12.5px' }}
                  >
                    <Volume2 size={15} />
                    Nghe toàn bộ hội thoại
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowPinyin((prev) => !prev)}
                    className="ds-btn ds-btn-outline"
                    style={{ height: '34px', fontSize: '12px' }}
                  >
                    {showPinyin ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showPinyin ? 'Ẩn Pinyin' : 'Hiện Pinyin'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTranslation((prev) => !prev)}
                    className="ds-btn ds-btn-outline"
                    style={{ height: '34px', fontSize: '12px' }}
                  >
                    {showTranslation ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showTranslation ? 'Ẩn Dịch' : 'Hiện Dịch'}
                  </button>
                </div>
              </div>

              {/* Chat Feed Interface (Alternating left/right speech bubbles) */}
              <div className="hsk-dialogue-chat-feed">
                {textbookData.dialogue.lines.map((line) => {
                  const isSpeakerA = line.speaker === 'A';

                  return (
                    <div
                      key={line.id}
                      className={`hsk-chat-row ${isSpeakerA ? 'speaker-a' : 'speaker-b'}`}
                    >
                      <div className="hsk-chat-avatar" title={line.speakerName}>
                        {isSpeakerA ? 'A' : 'B'}
                      </div>

                      <div className="hsk-chat-bubble">
                        <span className="hsk-chat-speaker-name">{line.speakerName}</span>
                        <span className="hsk-chat-hanzi">{line.hanzi}</span>

                        {showPinyin && (
                          <span className="hsk-chat-pinyin">{line.pinyin}</span>
                        )}

                        {showTranslation && (
                          <span className="hsk-chat-vi">{line.meaning}</span>
                        )}

                        <button
                          type="button"
                          onClick={() => playChineseTTS(line.hanzi)}
                          className="hsk-chat-audio-btn"
                        >
                          <Volume2 size={13} />
                          Nghe câu này
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* SECTION 5: LUYỆN TẬP CỦNG CỐ (#practice) — EMBEDDED LESSONEXPERIENCE */}
          <section id="practice" className="hsk-textbook-section" aria-label="Luyện tập củng cố kiến thức">
            <div className="hsk-section-header-box">
              <div className="hsk-section-title-group">
                <div className="hsk-section-icon-badge">
                  <Dumbbell size={18} />
                </div>
                <div>
                  <h2 className="hsk-section-main-title">Luyện tập củng cố kiến thức</h2>
                  <p className="hsk-section-subtitle">
                    Hoàn thành các hoạt động tương tác để ghi nhớ từ vựng, vận dụng ngữ pháp và kiểm tra khả năng sử dụng tiếng Trung
                  </p>
                </div>
              </div>
            </div>

            {/* Stable Practice Introduction Card (3 clean rows, centered CTA) */}
            <div className="hsk-practice-intro-card">
              {/* Row 1 — Thông tin luyện tập */}
              <div className="hsk-practice-card-header">
                <div className="hsk-practice-card-title-group">
                  <StickerIllustration
                    name="cheering"
                    size="sm"
                    decorative
                    className="hsk-practice-card-sticker"
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span
                        className="hsk-practice-card-status-badge"
                        style={{
                          backgroundColor:
                            practiceStatus === 'COMPLETED'
                              ? '#ecfdf5'
                              : practiceStatus === 'IN_PROGRESS'
                              ? '#fef3c7'
                              : '#f1f5f9',
                          color:
                            practiceStatus === 'COMPLETED'
                              ? '#16a34a'
                              : practiceStatus === 'IN_PROGRESS'
                              ? '#d97706'
                              : '#475569',
                        }}
                      >
                        {practiceStatus === 'COMPLETED'
                          ? 'Hoàn thành'
                          : practiceStatus === 'IN_PROGRESS'
                          ? `Đang học · Bước ${currentPracticeStepIndex + 1}/7`
                          : 'Chưa bắt đầu'}
                      </span>
                    </div>
                    <h3 className="hsk-practice-card-title">
                      7 hoạt động củng cố bài {textbookData.lessonNumber}
                    </h3>
                  </div>
                </div>

                <div className="hsk-practice-card-xp-badge">
                  +{textbookData.xpReward} XP thưởng
                </div>
              </div>

              {/* Row 2 — Các nhóm hoạt động */}
              <div className="hsk-practice-steps-preview">
                <div className="hsk-practice-step-item">
                  <CheckCircle2 size={16} color="var(--primary, #E60012)" style={{ flexShrink: 0 }} />
                  <span>Luyện phát âm & từ vựng</span>
                </div>
                <div className="hsk-practice-step-item">
                  <CheckCircle2 size={16} color="var(--primary, #E60012)" style={{ flexShrink: 0 }} />
                  <span>Bài tập ngữ pháp & sắp xếp câu</span>
                </div>
                <div className="hsk-practice-step-item">
                  <CheckCircle2 size={16} color="var(--primary, #E60012)" style={{ flexShrink: 0 }} />
                  <span>Mini Quiz đánh giá ({textbookData.playerLessonData.quiz?.length || 5} câu)</span>
                </div>
              </div>

              {/* Row 3 — Hành động (Single centered CTA) */}
              <div className="hsk-practice-action-row">
                <button
                  ref={practiceTriggerRef}
                  type="button"
                  className="hsk-practice-cta-btn"
                  onClick={() => setIsPracticeModalOpen(true)}
                >
                  <Dumbbell size={16} />
                  <span>
                    {practiceStatus === 'COMPLETED'
                      ? 'Luyện tập lại bài học'
                      : practiceStatus === 'IN_PROGRESS'
                      ? `Tiếp tục luyện tập (Bước ${currentPracticeStepIndex + 1})`
                      : 'Bắt đầu luyện tập ngay'}
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 6: KẾT QUẢ & HOÀN THÀNH (#complete) */}
          <section id="complete" className="hsk-textbook-section" aria-label="Kết quả bài học">
            <div className="hsk-complete-card">
              <div className="hsk-complete-sticker-wrap" aria-hidden="true" style={{ display: 'flex', justifyContent: 'center' }}>
                <StickerIllustration
                  name={isLessonCompleted ? 'trophy' : 'completion'}
                  size="lg"
                  decorative
                />
              </div>

              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                  {isLessonCompleted ? 'Bạn đã hoàn thành bài học này!' : 'Hoàn thành bài học'}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0, maxWidth: '480px' }}>
                  {isLessonCompleted
                    ? `Tuyệt vời! Bạn đã nắm vững các từ vựng và ngữ pháp của bài "${textbookData.titleZh}". Hãy tiếp tục chinh phục bài học tiếp theo nhé!`
                    : 'Hãy hoàn thành bài tập tương tác trong phần Luyện tập củng cố phía trên để nhận điểm XP và đánh dấu hoàn thành bài học.'}
                </p>
              </div>

              {/* Reward Metric Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span className="hsk-meta-chip" style={{ backgroundColor: '#FFF0F1', borderColor: '#fed7da', color: 'var(--primary, #E60012)', fontWeight: 700 }}>
                  <Award size={15} />
                  +{textbookData.xpReward} XP hoàn thành
                </span>
                <span className="hsk-meta-chip">
                  <Flame size={15} color="#ea580c" />
                  Streak hiện tại: {streakDays} ngày
                </span>
                <span className="hsk-meta-chip">
                  <Languages size={15} color="#64748b" />
                  {textbookData.vocabularies.length} từ đã học
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
                <Button variant="primary" onClick={handleNextLesson} style={{ height: '42px', padding: '0 24px' }}>
                  <span>Học bài tiếp theo</span>
                  <ArrowRight size={16} />
                </Button>
                <Button variant="outline" onClick={() => navigate('/learning-path?mode=hsk')}>
                  Quay lại Giáo trình HSK
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    handleScrollToSection('overview');
                  }}
                >
                  <RotateCcw size={15} />
                  Ôn lại từ đầu
                </Button>
              </div>
            </div>
          </section>
        </div>

        {/* =====================================================================
            RIGHT STICKY TABLE OF CONTENTS (Scroll-Spy Navigation)
            ===================================================================== */}
        <LessonTableOfContents
          activeSectionId={activeSection}
          readingProgress={readingProgress}
          vocabCount={textbookData.vocabularies.length}
          grammarCount={textbookData.grammars.length}
          dialogueCount={1}
          onSelectSection={handleScrollToSection}
        />
      </div>

      {/* STABLE PRACTICE MODAL (Does not shift textbook layout) */}
      <LessonPracticeModal
        isOpen={isPracticeModalOpen}
        onClose={() => setIsPracticeModalOpen(false)}
        lessonData={textbookData.playerLessonData}
        triggerRef={practiceTriggerRef}
        onNextLesson={handleNextLesson}
        onStepChange={(stepIdx) => {
          setCurrentPracticeStepIndex(stepIdx);
        }}
        onLessonComplete={(score, total, xp) => {
          handleEmbeddedComplete(score, total, xp);
        }}
      />
    </div>
  );
};

export default HskTextbookLessonPage;
