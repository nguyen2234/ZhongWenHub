import React, { useState } from 'react';
import {
  Flame,
  Award,
  BookOpen,
  Check,
  Lock,
  Sparkles,
  Play,
  Headphones,
  Mic,
  Clock,
  CheckCircle2,
  Calendar,
  PenTool,
  MessageCircle,
  FileCheck,
  ChevronRight,
  Radio,
  CalendarDays,
  Volume2,
  TrendingUp,
  Zap,
  BookOpenCheck,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  HSKLevel,
  Flashcard,
  Modal,
  ProgressBar,
} from '../../../design-system';
import '../dashboard.css';
import { useLearningState } from '../../learning';

export interface DashboardProps {
  onStartReviewSession?: () => void;
  onOpenVocabulary?: () => void;
  onOpenLesson?: (lessonId?: string | number) => void;
  onOpenAITutor?: (mode?: 'chat' | 'live') => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({
  onStartReviewSession,
  onOpenVocabulary,
  onOpenLesson,
  onOpenAITutor,
}) => {
  const navigate = useNavigate();
  const {
    currentHskLevel,
    currentLesson,
    completedLessonIds,
    xpTotal,
    streakDays,
    dueVocabCount,
    learnedVocabCount,
    masteredVocabCount,
    dailyGoal,
    recommendations,
    startLesson,
    state: learningState,
  } = useLearningState();

  const handleStartReview = () => {
    if (onStartReviewSession) {
      onStartReviewSession();
    } else {
      navigate('/srs-review');
    }
  };

  const handleOpenLesson = (lessonId?: string | number) => {
    const targetId = lessonId ? String(lessonId) : (currentLesson?.id || 'les-8');
    startLesson(targetId);
    if (onOpenLesson) {
      onOpenLesson(targetId);
    } else {
      navigate(`/lesson?id=${targetId}`);
    }
  };

  const handleOpenVocabulary = () => {
    if (onOpenVocabulary) {
      onOpenVocabulary();
    } else {
      navigate('/vocabulary');
    }
  };

  const handleOpenTutor = (mode: 'chat' | 'live' = 'chat') => {
    if (onOpenAITutor) {
      onOpenAITutor(mode);
    } else {
      navigate(`/ai-tutor?mode=${mode}&source=dashboard`);
    }
  };

  // Modal Flashcard Review State (fallback)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Review flashcards data
  const reviewWords = [
    {
      hanzi: '喝',
      pinyin: 'hē',
      meaning: 'Uống',
      partOfSpeech: 'Động từ',
      hskLevel: 1 as const,
      exampleSentence: '你想喝什么？',
      exampleMeaning: 'Bạn muốn uống gì?',
    },
    {
      hanzi: '多少',
      pinyin: 'duōshǎo',
      meaning: 'Bao nhiêu',
      partOfSpeech: 'Đại từ',
      hskLevel: 1 as const,
      exampleSentence: '这个多少钱？',
      exampleMeaning: 'Cái này bao nhiêu tiền?',
    },
    {
      hanzi: '苹果',
      pinyin: 'píngguǒ',
      meaning: 'Quả táo',
      partOfSpeech: 'Danh từ',
      hskLevel: 1 as const,
      exampleSentence: '我想买两斤苹果。',
      exampleMeaning: 'Tôi muốn mua hai cân táo.',
    },
    {
      hanzi: '杯',
      pinyin: 'bēi',
      meaning: 'Cốc, ly (lượng từ)',
      partOfSpeech: 'Lượng từ',
      hskLevel: 2 as const,
      exampleSentence: '我要一杯热茶。',
      exampleMeaning: 'Tôi muốn một ly trà nóng.',
    },
  ];

  // Daily Challenge State
  const [challenges, setChallenges] = useState([
    { id: 1, title: 'Học 10 từ mới trong Bài 8', xp: 30, completed: true },
    { id: 2, title: 'Hoàn thành 1 bài luyện nghe phản xạ', xp: 40, completed: false },
    { id: 3, title: 'Ôn tập 20 flashcard Spaced Repetition', xp: 30, completed: false },
  ]);

  const toggleChallenge = (id: number) => {
    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c))
    );
  };

  const completedChallenges = challenges.filter((c) => c.completed).length;
  const currentEarnedXp = challenges
    .filter((c) => c.completed)
    .reduce((acc, cur) => acc + cur.xp, 0);

  const handlePronounce = (text: string) => {
    setIsPlayingAudio(true);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingAudio(false), 800);
    }
  };

  return (
    <div
      style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'row',
        gap: '24px',
        boxSizing: 'border-box',
      }}
      className="hanbeego-content-wrapper"
    >
      {/* =====================================================================
          MAIN COLUMN (Left / Center Pane - HanbeeGo Architecture)
          ===================================================================== */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* [1] HERO BANNER (HANBEEGO-STYLE) */}
        <section
          className="dashboard-hero-banner"
          style={{
            padding: '28px 32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div style={{ maxWidth: '620px', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  letterSpacing: '0.04em',
                }}
              >
                Học tiếng Trung mỗi ngày
              </span>
              <HSKLevel level={(currentHskLevel >= 7 ? '7-9' : currentHskLevel) as 1 | 2 | 3 | 4 | 5 | 6 | '7-9'} />
            </div>

            <h1
              style={{
                fontSize: '28px',
                fontWeight: 900,
                color: '#0f172a',
                margin: '0 0 4px 0',
                lineHeight: 1.2,
                letterSpacing: '-0.5px',
              }}
            >
              Nâng cao mỗi ngày
            </h1>
            <p
              style={{
                fontSize: '28px',
                fontWeight: 900,
                color: 'var(--primary)',
                margin: '0 0 12px 0',
                lineHeight: 1.2,
                letterSpacing: '-0.5px',
              }}
            >
              Tiến bộ không ngừng!
            </p>

            <p style={{ margin: '0 0 20px 0', fontSize: 'var(--text-sm)', color: '#475569', lineHeight: 1.5 }}>
              Chào buổi sáng, <strong>Minh Anh!</strong> Hôm nay bạn có <strong>1 bài học đang dở</strong> và <strong>{dueVocabCount} từ vựng cần ôn tập</strong> để duy trì trí nhớ dài hạn.
            </p>

            <button
              type="button"
              className="btn-3d-primary"
              onClick={() => handleOpenLesson(currentLesson?.id || 'les-8')}
              style={{ padding: '12px 24px', fontSize: '14px' }}
            >
              <span>Bắt đầu học ngay</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* [2] 2-CARD SUBGRID: TIẾP TỤC HỌC & THỐNG KÊ HỌC TẬP */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* CARD A: TIẾP TỤC HỌC */}
          <section className="card-3d" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Play size={16} fill="currentColor" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--foreground)' }}>
                    Tiếp tục học
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Bài học gần nhất của bạn</span>
                </div>
              </div>

              {/* Lesson Card Details */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '12px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  marginBottom: '16px',
                }}
              >
                {/* Hanzi Avatar Icon */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-xl)',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-hanzi)',
                    fontSize: '26px',
                    fontWeight: 700,
                    boxShadow: '0 4px 0 0 #312e81',
                    flexShrink: 0,
                  }}
                >
                  {currentLesson?.hanzi?.slice(0, 1) || '喝'}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--foreground)' }}>
                      Bài {currentLesson?.lessonNumber || 8}: {currentLesson?.hanzi || '你想喝什么？'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    Giáo trình HSK {currentLesson?.hskLevel || 2} • {currentLesson?.meaning || 'Bạn muốn uống gì?'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '11px', fontWeight: 700 }}>
                    <span style={{ color: 'var(--muted)' }}>Tiến độ bài học</span>
                    <span style={{ color: 'var(--primary)' }}>
                      {Math.min(100, Math.round(((learningState.lessonProgress[currentLesson?.id || 'les-8']?.currentStepIndex ?? 3) + 1) / 6 * 100))}%
                    </span>
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <ProgressBar
                      value={Math.min(100, Math.round(((learningState.lessonProgress[currentLesson?.id || 'les-8']?.currentStepIndex ?? 3) + 1) / 6 * 100))}
                      showPercentage={false}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              icon={<Play size={16} fill="currentColor" />}
              style={{ width: '100%', justifyContent: 'center', fontWeight: 800 }}
              onClick={() => handleOpenLesson(currentLesson?.id || 'les-8')}
            >
              TIẾP TỤC BÀI {currentLesson?.lessonNumber || 8} ➜
            </Button>
          </section>

          {/* CARD B: THỐNG KÊ HỌC TẬP */}
          <section className="card-3d" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--foreground)' }}>
                    Thống kê học tập
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Hiệu suất tích lũy cá nhân</span>
                </div>
              </div>

              {/* 2x2 Metric Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div className="stat-metric-tile">
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <BookOpenCheck size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                      {completedLessonIds.length}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', marginTop: '2px' }}>
                      Bài học hoàn tất
                    </div>
                  </div>
                </div>

                <div className="stat-metric-tile">
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#f0fdfa',
                      color: '#0d9488',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                      {learnedVocabCount}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', marginTop: '2px' }}>
                      Từ vựng đã học
                    </div>
                  </div>
                </div>

                <div className="stat-metric-tile">
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--xp-bg)',
                      color: 'var(--xp)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Zap size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                      {xpTotal}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', marginTop: '2px' }}>
                      Tổng điểm XP
                    </div>
                  </div>
                </div>

                <div className="stat-metric-tile">
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#ecfdf5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Award size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                      {masteredVocabCount}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', marginTop: '2px' }}>
                      Từ thành thạo
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              style={{ width: '100%', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 700 }}
              onClick={() => navigate('/learning-path')}
            >
              <span>Xem chi tiết lộ trình học tập</span>
              <ChevronRight size={14} />
            </Button>
          </section>
        </div>

        {/* [3] TỪ VỰNG HÔM NAY (HANBEEGO-STYLE WORD OF THE DAY) */}
        <section className="card-3d" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarDays size={20} style={{ color: 'var(--primary)' }} />
              <h2 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--foreground)' }}>
                Từ vựng hôm nay
              </h2>
              <HSKLevel level={1} />
            </div>

            <button
              type="button"
              onClick={handleStartReview}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Ôn {dueVocabCount} từ đến hạn ngay</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Word Presentation Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}>
            {/* Left: Big Hanzi Display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '180px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-hanzi)', fontSize: '56px', fontWeight: 700, lineHeight: 1, color: 'var(--foreground)' }}>
                  喝
                </div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--primary)', marginTop: '4px' }}>
                  hē
                </div>
              </div>

              <button
                type="button"
                onClick={() => handlePronounce('喝')}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: isPlayingAudio ? 'var(--primary)' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Phát âm chữ Hán"
              >
                <Volume2 size={18} />
              </button>
            </div>

            {/* Right: Meaning & Example sentence */}
            <div
              style={{
                flex: 1,
                minWidth: '240px',
                paddingLeft: '20px',
                borderLeft: '1.5px solid #f1f5f9',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>Nghĩa từ: </span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--foreground)' }}>
                  Uống (Động từ)
                </span>
              </div>

              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#f8fafc',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #f1f5f9',
                }}
              >
                <div style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--foreground)' }}>
                  你想喝什么？
                </div>
                <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 500, marginTop: '2px' }}>
                  Nǐ xiǎng hē shénme?
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '2px' }}>
                  Bạn muốn uống gì?
                </div>
              </div>
            </div>
          </div>

          {/* Flashcard list row preview */}
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
              Từ vựng cần ôn theo thuật toán Spaced Repetition:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {reviewWords.map((word, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentReviewIndex(idx);
                    setIsReviewModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-hanzi)', fontWeight: 700, fontSize: '15px' }}>{word.hanzi}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{word.pinyin}</span>
                  <span style={{ color: '#64748b' }}>({word.meaning})</span>
                </div>
              ))}
              <span
                onClick={handleOpenVocabulary}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                +10 từ khác ➜
              </span>
            </div>
          </div>
        </section>

        {/* [4] HSK LEARNING ROADMAP (HSK 1 TO HSK 7-9) */}
        <section className="card-3d" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} style={{ color: 'var(--primary)' }} />
              <h2 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 800 }}>
                Lộ trình chinh phục HSK 1 → HSK 7–9
              </h2>
            </div>
            <Button variant="ghost" icon={<ChevronRight size={14} />} onClick={() => navigate('/learning-path')}>
              Chi tiết lộ trình
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            {/* HSK 1 */}
            <div style={{ padding: '12px', borderRadius: 'var(--radius-lg)', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669' }}>HSK 1</span>
                <Check size={14} style={{ color: '#059669' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700, marginTop: '2px' }}>Đã hoàn thành</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>150/150 từ vựng</div>
            </div>

            {/* HSK 2 */}
            <div style={{ padding: '12px', borderRadius: 'var(--radius-lg)', backgroundColor: '#f0fdfa', border: '2px solid #0d9488' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#0d9488' }}>HSK 2</span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0d9488' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#0d9488', fontWeight: 800, marginTop: '2px' }}>
                Đang học ({Math.min(100, Math.round((completedLessonIds.filter(id => id.startsWith('les-')).length / 18) * 100))}%)
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>
                {completedLessonIds.filter(id => id.startsWith('les-')).length}/18 bài học
              </div>
            </div>

            {/* HSK 3 */}
            <div style={{ padding: '12px', borderRadius: 'var(--radius-lg)', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', opacity: 0.75 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>HSK 3</span>
                <Lock size={12} style={{ color: '#94a3b8' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Chưa mở khóa</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>600 từ vựng</div>
            </div>

            {/* HSK 4 */}
            <div style={{ padding: '12px', borderRadius: 'var(--radius-lg)', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', opacity: 0.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>HSK 4</span>
                <Lock size={12} style={{ color: '#94a3b8' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Chưa mở khóa</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>1.200 từ vựng</div>
            </div>

            {/* HSK 5 */}
            <div style={{ padding: '12px', borderRadius: 'var(--radius-lg)', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', opacity: 0.65 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>HSK 5</span>
                <Lock size={12} style={{ color: '#94a3b8' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Chưa mở khóa</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>2.500 từ vựng</div>
            </div>

            {/* HSK 6 */}
            <div style={{ padding: '12px', borderRadius: 'var(--radius-lg)', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', opacity: 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>HSK 6</span>
                <Lock size={12} style={{ color: '#94a3b8' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Chưa mở khóa</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>5.000 từ vựng</div>
            </div>

            {/* HSK 7-9 */}
            <div style={{ padding: '12px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--hsk7-9-bg)', border: '1px dashed var(--hsk7-9-border)', opacity: 0.85 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--hsk7-9)' }}>HSK 7–9</span>
                <Sparkles size={12} style={{ color: 'var(--hsk7-9)' }} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--hsk7-9)', fontWeight: 700, marginTop: '2px' }}>Cao cấp</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>11.000+ từ vựng</div>
            </div>
          </div>
        </section>

        {/* [ADAPTIVE RECOMMENDATIONS & WEAK KNOWLEDGE] */}
        {recommendations.length > 0 && (
          <section
            className="card-3d"
            style={{
              padding: '20px 24px',
              backgroundColor: '#faf5ff',
              border: '1.5px solid #d8b4fe',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: '#7c3aed' }} />
                <h2 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 800, color: '#581c87' }}>
                  Gợi ý học tập thích ứng cá nhân
                </h2>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                Hệ thống đề xuất thông minh
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {recommendations.slice(0, 2).map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    border: '1px solid #e9d5ff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#7c3aed', color: '#ffffff' }}>
                        Ưu tiên #{rec.priority}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e1b4b' }}>
                        {rec.title}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 12px 0', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                      {rec.reason}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(rec.destinationRoute)}
                    style={{
                      backgroundColor: '#7c3aed',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{rec.actionLabel}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* [5] BÀI HỌC & CHỦ ĐỀ ĐỀ XUẤT CHO BẠN (4 CARDS GRID MATCHING HANBEEGO) */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: 'var(--primary)' }} />
              <h2 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 800 }}>
                Bài học đề xuất cho bạn
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/learning-path')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <span>Xem tất cả</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {/* Item 1: Từ vựng theo chủ đề */}
            <div
              className="card-3d card-3d-interactive"
              onClick={() => navigate('/vocabulary')}
              style={{ padding: '16px' }}
            >
              <div
                style={{
                  height: '80px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: '#eef2ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                  color: 'var(--primary)',
                }}
              >
                <BookOpen size={32} />
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--foreground)' }}>
                Từ vựng theo chủ đề
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11px', color: 'var(--muted)' }}>
                <span>Học theo nhóm nghĩa</span>
                <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', fontWeight: 700 }}>
                  HSK 1–2
                </span>
              </div>
            </div>

            {/* Item 2: Ngữ pháp trọng tâm */}
            <div
              className="card-3d card-3d-interactive"
              onClick={() => handleOpenLesson(8)}
              style={{ padding: '16px' }}
            >
              <div
                style={{
                  height: '80px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                  color: '#d97706',
                }}
              >
                <FileCheck size={32} />
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--foreground)' }}>
                Cấu trúc câu & Ngữ pháp
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11px', color: 'var(--muted)' }}>
                <span>Cấu trúc 想 & 多少</span>
                <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', fontWeight: 700 }}>
                  Bài 8
                </span>
              </div>
            </div>

            {/* Item 3: Luyện nghe phản xạ */}
            <div
              className="card-3d card-3d-interactive"
              onClick={() => navigate('/practice')}
              style={{ padding: '16px' }}
            >
              <div
                style={{
                  height: '80px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: '#f0f9ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                  color: '#0284c7',
                }}
              >
                <Headphones size={32} />
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--foreground)' }}>
                Hội thoại phản xạ nghe
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11px', color: 'var(--muted)' }}>
                <span>Gọi đồ tại quán cà phê</span>
                <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', fontWeight: 700 }}>
                  HSK 2
                </span>
              </div>
            </div>

            {/* Item 4: Luyện nói phản xạ AI Live */}
            <div
              className="card-3d card-3d-interactive"
              onClick={() => handleOpenTutor('live')}
              style={{ padding: '16px' }}
            >
              <div
                style={{
                  height: '80px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--ai-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                  color: 'var(--ai)',
                }}
              >
                <Radio size={32} />
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--foreground)' }}>
                Luyện nói AI Live (Kippy)
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11px', color: 'var(--muted)' }}>
                <span>Cắt lời tự nhiên</span>
                <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--ai-bg)', color: 'var(--ai)', fontWeight: 700 }}>
                  Mới
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* [6] TIẾN ĐỘ 6 KỸ NĂNG NGÔN NGỮ */}
        <section className="card-3d" style={{ padding: '24px' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-base)', fontWeight: 800 }}>
            Tiến độ 6 Kỹ năng tiếng Trung
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BookOpen size={13} style={{ color: 'var(--primary)' }} /> Từ vựng (Vocabulary)
                </span>
                <span style={{ color: 'var(--muted)' }}>285/300 từ (95%)</span>
              </div>
              <ProgressBar value={95} variant="primary" showPercentage={false} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FileCheck size={13} style={{ color: 'var(--hsk2)' }} /> Ngữ pháp (Grammar)
                </span>
                <span style={{ color: 'var(--muted)' }}>18/25 điểm (72%)</span>
              </div>
              <ProgressBar value={72} variant="primary" showPercentage={false} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Headphones size={13} style={{ color: '#0284c7' }} /> Luyện nghe (Listening)
                </span>
                <span style={{ color: 'var(--muted)' }}>80% đạt chuẩn</span>
              </div>
              <ProgressBar value={80} variant="primary" showPercentage={false} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Mic size={13} style={{ color: 'var(--streak)' }} /> Luyện phát âm (Pronunciation)
                </span>
                <span style={{ color: 'var(--muted)' }}>88% chuẩn xác</span>
              </div>
              <ProgressBar value={88} variant="streak" showPercentage={false} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MessageCircle size={13} style={{ color: 'var(--ai)' }} /> Luyện đọc (Reading)
                </span>
                <span style={{ color: 'var(--muted)' }}>65% bài đọc hiểu</span>
              </div>
              <ProgressBar value={65} variant="primary" showPercentage={false} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <PenTool size={13} style={{ color: 'var(--seal)' }} /> Viết chữ Hán (Writing)
                </span>
                <span style={{ color: 'var(--muted)' }}>160 chữ thuần thục</span>
              </div>
              <ProgressBar value={53} variant="primary" showPercentage={false} />
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================================
          RIGHT COLUMN (HanbeeGo Right Sidebar Widgets: Streak, Goal, AI Tutor)
          ===================================================================== */}
      <div
        className="hanbeego-sidebar-column"
        style={{
          width: '340px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* [1] STREAK CỦA BẠN (HANBEEGO-STYLE) */}
        <section className="card-3d" style={{ padding: '20px' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--foreground)' }}>
            <Flame size={18} style={{ color: 'var(--streak)' }} />
            <span>Streak của bạn</span>
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--streak)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 0 0 #c2410c',
                flexShrink: 0,
              }}
            >
              <Flame size={26} fill="currentColor" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                  {streakDays}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>ngày liên tiếp</span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', fontWeight: 700, color: 'var(--streak)' }}>
                Cố gắng quá! 🔥
              </p>
            </div>
          </div>

          {/* 7-Day Dots Row (T2 -> CN) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', padding: '0 4px' }}>
            {[
              { day: 'T2', completed: true },
              { day: 'T3', completed: true },
              { day: 'T4', completed: true },
              { day: 'T5', completed: true },
              { day: 'T6', completed: true, active: true },
              { day: 'T7', completed: false },
              { day: 'CN', completed: false },
            ].map((d, i) => (
              <div key={i} className="streak-day-item">
                <span style={{ fontSize: '11px', fontWeight: 800, color: d.active ? 'var(--streak)' : '#94a3b8' }}>
                  {d.day}
                </span>
                <div
                  className={`streak-day-circle ${d.completed ? 'completed' : ''} ${d.active ? 'active' : ''}`}
                >
                  {d.completed && <Check size={14} />}
                </div>
              </div>
            ))}
          </div>

          {/* Check-in Action Button */}
          <button
            type="button"
            className="btn-3d-primary"
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '10px 14px',
              fontSize: '12px',
              borderRadius: 'var(--radius-lg)',
            }}
            onClick={() => handleStartReview()}
          >
            <span>Ôn tập Spaced Repetition · +30 XP</span>
          </button>
        </section>

        {/* [2] MỤC TIÊU HÔM NAY (DAILY GOAL) */}
        <section className="card-3d" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Calendar size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 800 }}>Mục tiêu hôm nay</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Tiến độ tích lũy XP ngày:</span>
                <span style={{ fontWeight: 800, color: 'var(--xp)' }}>
                  {dailyGoal.currentXp} / {dailyGoal.targetXp} XP ({dailyGoal.xpPercent}%)
                </span>
              </div>
              <ProgressBar value={dailyGoal.xpPercent} variant="xp" showPercentage={false} />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#f8fafc',
                border: '1px solid #f1f5f9',
                fontSize: '12px',
              }}
            >
              <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} /> Thời gian học:
              </span>
              <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>
                {dailyGoal.currentMinutes} / {dailyGoal.targetMinutes} phút
              </span>
            </div>
          </div>
        </section>

        {/* [3] AI TUTOR QUICK ACCESS ENTRY (HANBEEGO-STYLE) */}
        <section
          className="card-3d"
          style={{
            padding: '20px',
            backgroundColor: 'var(--ai-bg)',
            border: '1.5px solid var(--ai-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--ai)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={17} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--ai)' }}>
                  Trợ giảng AI Thông minh
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>
                  有什么不懂的吗？
                </div>
              </div>
            </div>

            <span
              style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: '#ffffff',
                color: 'var(--ai)',
                border: '1px solid var(--ai-border)',
                fontWeight: 800,
              }}
            >
              Trực tuyến
            </span>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '12px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--ai-border)',
              fontSize: '11px',
              lineHeight: 1.5,
              color: 'var(--foreground)',
              marginBottom: '12px',
            }}
          >
            Bạn có thắc mắc gì về <strong>Bài 8 &quot;你想喝什么？&quot;</strong> hoặc muốn luyện phản xạ nói tiếng Trung không?
          </div>

          {/* Quick prompt chips */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => handleOpenTutor('chat')}
              style={{
                padding: '6px 8px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--ai-border)',
                backgroundColor: '#ffffff',
                color: 'var(--ai)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              📖 Ngữ pháp Bài 8
            </button>
            <button
              type="button"
              onClick={() => handleOpenTutor('live')}
              style={{
                padding: '6px 8px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--ai-border)',
                backgroundColor: '#ffffff',
                color: 'var(--ai)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              🗣️ Luyện nói Live
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleOpenTutor('chat')}
              style={{
                padding: '8px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--ai-border)',
                backgroundColor: '#ffffff',
                color: 'var(--ai)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Chat với AI
            </button>

            <button
              type="button"
              onClick={() => handleOpenTutor('live')}
              className="btn-3d-primary"
              style={{
                backgroundColor: 'var(--ai)',
                boxShadow: '0 3px 0 0 #5b21b6',
                padding: '8px',
                fontSize: '11px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              Luyện nói Live
            </button>
          </div>
        </section>

        {/* [4] THỬ THÁCH HÔM NAY (CHALLENGES) */}
        <section className="card-3d" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
              <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 800 }}>Thử thách hôm nay</h3>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>
              {completedChallenges}/3 (+{currentEarnedXp} XP)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {challenges.map((c) => (
              <div
                key={c.id}
                onClick={() => toggleChallenge(c.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-lg)',
                  border: c.completed ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                  backgroundColor: c.completed ? '#ecfdf5' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      border: c.completed ? 'none' : '2px solid #cbd5e1',
                      backgroundColor: c.completed ? 'var(--success)' : '#ffffff',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {c.completed && <Check size={11} />}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: c.completed ? 'var(--success)' : 'var(--foreground)',
                      textDecoration: c.completed ? 'line-through' : 'none',
                    }}
                  >
                    {c.title}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: c.completed ? 'var(--success)' : 'var(--xp)',
                    backgroundColor: c.completed ? 'rgba(5, 150, 105, 0.1)' : 'var(--xp-bg)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  +{c.xp} XP
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* [5] THÀNH TÍCH GẦN ĐÂY */}
        <section className="card-3d" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Award size={18} style={{ color: 'var(--xp)' }} />
            <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 800 }}>Thành tích gần đây</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--hsk2-bg)', color: 'var(--hsk2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={13} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700 }}>Mốc 150 từ HSK 1</div>
                  <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Hoàn tất trọn vẹn Nhập môn</div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--xp)' }}>+100 XP</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--streak-bg)', color: 'var(--streak)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flame size={13} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700 }}>Chuỗi 7 ngày liên tiếp</div>
                  <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Huy hiệu Chiến binh Bền bỉ</div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--xp)' }}>+50 XP</span>
            </div>
          </div>
        </section>

      </div>

      {/* =====================================================================
          MODAL ÔN TẬP FLASHCARD SPACED REPETITION
          ===================================================================== */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`Ôn tập Spaced Repetition (${currentReviewIndex + 1}/${reviewWords.length})`}
        actions={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="secondary"
              disabled={currentReviewIndex === 0}
              onClick={() => setCurrentReviewIndex((i) => Math.max(0, i - 1))}
            >
              Từ trước
            </Button>

            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Từ {currentReviewIndex + 1} trên {reviewWords.length}
            </span>

            <Button
              variant="primary"
              onClick={() => {
                if (currentReviewIndex < reviewWords.length - 1) {
                  setCurrentReviewIndex((i) => i + 1);
                } else {
                  alert('Chúc mừng bạn đã hoàn thành phiên ôn tập 14 từ vựng!');
                  setIsReviewModalOpen(false);
                }
              }}
            >
              {currentReviewIndex < reviewWords.length - 1 ? 'Từ tiếp theo' : 'Hoàn tất ôn tập'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2) 0' }}>
          <Flashcard
            {...reviewWords[currentReviewIndex]}
            onPlayAudio={() => handlePronounce(reviewWords[currentReviewIndex].hanzi)}
            onRate={(r) => {
              if (currentReviewIndex < reviewWords.length - 1) {
                setCurrentReviewIndex((i) => i + 1);
              } else {
                alert(`Đã hoàn tất đánh giá: ${r}! Cập nhật Spaced Repetition thành công.`);
                setIsReviewModalOpen(false);
              }
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export const Dashboard = DashboardPage;
export default DashboardPage;
