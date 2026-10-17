import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Languages,
  Dumbbell,
  Clock,
  Zap,
  Flame,
  ArrowRight,
  Sparkles,
  ChevronRight,
  BookOpen,
  Film,
  Volume2,
  CheckCircle2,
  Circle,
  GraduationCap,
  Trophy,
  Headphones,
  Mic,
  Bookmark,
  VideoOff,
} from 'lucide-react';
import { useLearningState, HSK_CURRICULUM } from '../../learning';
import { HSKLevel, ProgressBar } from '../../../design-system';
import { DEMO_VIDEOS } from '../../videos';
import { useCurrentStudent } from '../../auth/services/student-identity.adapter';
import '../dashboard.css';

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
}) => {
  const navigate = useNavigate();
  const currentStudent = useCurrentStudent();
  const studentName = currentStudent?.studentName || currentStudent?.student?.fullName || 'Học viên';

  const {
    currentHskLevel,
    currentLesson,
    xpTotal,
    streakDays,
    dueVocabCount,
    dailyGoal,
    weakKnowledge,
    startLesson,
    state: learningState,
  } = useLearningState();

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // 1. Continue Learning Handler
  const handleContinueLesson = () => {
    const targetId = currentLesson?.id || 'les-8';
    startLesson(targetId);
    if (onOpenLesson) {
      onOpenLesson(targetId);
    } else {
      navigate(`/lesson?id=${targetId}`);
    }
  };

  // 2. SRS Vocabulary Review Handler
  const handleStartReview = () => {
    if (onStartReviewSession) {
      onStartReviewSession();
    } else if (onOpenVocabulary) {
      onOpenVocabulary();
    } else {
      navigate('/srs-review');
    }
  };

  // 3. Pronounce Today's Word
  const handlePlayVocabAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.85;
        utterance.onstart = () => setIsPlayingAudio(true);
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      } catch {
        setIsPlayingAudio(false);
      }
    }
  };

  // Lesson step progress from real state
  const lessonProgressRecord = currentLesson
    ? learningState.lessonProgress[currentLesson.id]
    : learningState.lessonProgress['les-8'];

  const currentStep = lessonProgressRecord?.currentStepIndex ?? 0;
  const isCompleted = lessonProgressRecord?.status === 'COMPLETED';
  const totalSteps = 6;
  const progressPercent = isCompleted
    ? 100
    : Math.min(100, Math.round(((currentStep + 1) / totalSteps) * 100));

  // REAL Weekdays status computed from dailyActivityHistory
  const weekdays = useMemo(() => {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
    const dayIndex = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // 0 for Mon, 6 for Sun

    const monday = new Date(now);
    monday.setDate(now.getDate() - dayIndex);

    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    return labels.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const act = learningState.dailyActivityHistory[dateStr];
      const hasAct = Boolean(
        act && (act.minutes > 0 || act.xpEarned > 0 || act.exercisesCompleted > 0 || act.reviewsCompleted > 0)
      );
      return {
        label,
        date: dateStr,
        active: hasAct,
        isToday: i === dayIndex,
      };
    });
  }, [learningState.dailyActivityHistory]);

  // Real HSK progress computed from curriculum and lessonProgress
  const hskProgressMap = useMemo(() => {
    const map: Record<number, { completedCount: number; totalCount: number; percent: number }> = {};
    [1, 2, 3, 4, 5, 6].forEach((lvl) => {
      const curLevel = HSK_CURRICULUM[lvl];
      if (!curLevel) {
        map[lvl] = { completedCount: 0, totalCount: 0, percent: 0 };
        return;
      }
      const lessons = curLevel.units.flatMap((u) => u.lessons);
      const completedCount = lessons.filter(
        (l) => learningState.lessonProgress[l.id]?.status === 'COMPLETED'
      ).length;
      const totalCount = curLevel.totalLessons || lessons.length;
      const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      map[lvl] = { completedCount, totalCount, percent };
    });
    return map;
  }, [learningState.lessonProgress]);

  // Featured word for today
  const todayVocab = {
    hanzi: '坚持',
    pinyin: 'jiānchí',
    meaning: 'Kiên trì, bền bỉ',
    example: '只要坚持学习，就一定能学好中文。',
    exampleMeaning: 'Chỉ cần kiên trì học tập, nhất định sẽ học giỏi tiếng Trung.',
  };

  // Top weak grammar point if any
  const weakGrammar = weakKnowledge.find((w) => w.category === 'grammar');

  return (
    <div className="hanbeego-dashboard-layout">
      {/* =====================================================================
          MAIN COLUMN (Sections 1 to 6)
          ===================================================================== */}
      <div className="dashboard-main-column">

        {/* SECTION 1: HERO BANNER (HanbeeGo Layout + Viettel Red Theme) */}
        <section className="hero-banner-container" aria-label="Khẩu hiệu học tập">
          <div className="hero-banner-content">
            <div className="hero-banner-badge">
              <Sparkles size={12} />
              <span>ZhongWenHub x HanbeeGo</span>
            </div>
            <h1 className="hero-banner-title">
              Nâng cao mỗi ngày -
              <span className="hero-banner-highlight">Tiến bộ không ngừng!</span>
            </h1>
            <p className="hero-banner-desc">
              Chào {studentName} 👋 Hãy duy trì chuỗi học tập {streakDays} ngày để bứt phá kỹ năng tiếng Trung HSK {currentHskLevel} hôm nay.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-viettel-primary"
                onClick={handleContinueLesson}
                id="btn-hero-start-learning"
              >
                <Play size={16} fill="currentColor" />
                <span>Bắt đầu học ngay</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => navigate('/learning-path')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '11px 18px',
                  borderRadius: '12px',
                  border: '1px solid #fed7da',
                  backgroundColor: '#ffffff',
                  color: 'var(--primary, #E60012)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <BookOpen size={15} />
                <span>Lộ trình HSK</span>
              </button>
            </div>
          </div>

          <div className="hero-banner-illustration" aria-hidden="true">
            <div
              style={{
                width: '130px',
                height: '130px',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #FFF0F1 0%, #fee2e2 100%)',
                border: '2px solid #fed7da',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(230, 0, 18, 0.12)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-hanzi, "Noto Sans SC", sans-serif)',
                  fontSize: '54px',
                  fontWeight: 900,
                  color: 'var(--primary, #E60012)',
                  lineHeight: 1,
                }}
              >
                学
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#991b1b',
                  marginTop: '4px',
                  letterSpacing: '0.05em',
                }}
              >
                xué • Học tập
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 2: TIẾP TỤC HỌC (Current Lesson with LearningStateContext) */}
        <section aria-label="Tiếp tục học">
          <div className="continue-card-wrapper">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary, #E60012)',
                    display: 'inline-block',
                  }}
                />
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: 'var(--primary, #E60012)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Bài học hiện tại • HSK {currentHskLevel}
                </span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
                Bước {isCompleted ? '6/6' : `${currentStep + 1}/6`} ({progressPercent}%)
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--primary, #E60012)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-hanzi, "Noto Sans SC", sans-serif)',
                  fontSize: '26px',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(230, 0, 18, 0.25)',
                  flexShrink: 0,
                }}
              >
                {currentLesson?.hanzi?.slice(0, 1) || '喝'}
              </div>

              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--primary-light, #FFF0F1)',
                      color: 'var(--primary, #E60012)',
                    }}
                  >
                    Bài {currentLesson?.lessonNumber || 8}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-hanzi, "Noto Sans SC", sans-serif)',
                      fontSize: '18px',
                      fontWeight: 800,
                      color: '#172033',
                    }}
                  >
                    {currentLesson?.hanzi || '你想喝什么？'}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px', fontWeight: 500 }}>
                  <span style={{ color: 'var(--primary, #E60012)', fontWeight: 600 }}>
                    {currentLesson?.pinyin || 'Nǐ xiǎng hē shénme?'}
                  </span>
                  {' • '}
                  <span>{currentLesson?.meaning || 'Bạn muốn uống gì?'}</span>
                </div>

                <div style={{ marginTop: '10px', maxWidth: '440px' }}>
                  <ProgressBar value={progressPercent} showPercentage={false} />
                </div>
              </div>

              <div style={{ flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn-viettel-primary"
                  onClick={handleContinueLesson}
                  id="btn-continue-lesson"
                >
                  <Play size={16} fill="currentColor" />
                  <span>Tiếp tục Bài {currentLesson?.lessonNumber || 8}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: KHÓA HỌC HSK (Real Curriculum Data & Progress) */}
        <section aria-label="Khóa học HSK">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#172033', margin: 0 }}>
                Giáo trình Chuẩn HSK 1 – 6
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' }}>
                Chương trình học chuẩn hóa theo khung khảo thí năng lực Hán ngữ quốc tế.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/learning-path')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: 'var(--primary, #E60012)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span>Xem tất cả</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="courses-grid">
            {[1, 2, 3, 4, 5, 6].map((lvl) => {
              const curLevel = HSK_CURRICULUM[lvl];
              const isCurrent = lvl === currentHskLevel;
              const lvlProgress = hskProgressMap[lvl] || { completedCount: 0, totalCount: 0, percent: 0 };
              const progressLabel =
                lvlProgress.completedCount > 0
                  ? `Tiến độ: ${lvlProgress.percent}% (${lvlProgress.completedCount}/${lvlProgress.totalCount} bài)`
                  : isCurrent
                  ? `Đang học • 0/${lvlProgress.totalCount} bài`
                  : `Chưa học • 0/${lvlProgress.totalCount} bài`;

              return (
                <div
                  key={lvl}
                  className="course-card"
                  onClick={() => navigate(`/learning-path?level=${lvl}`)}
                  style={{
                    borderColor: isCurrent ? '#fed7da' : '#e2e8f0',
                    boxShadow: isCurrent ? '0 4px 12px rgba(230, 0, 18, 0.08)' : undefined,
                  }}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/learning-path?level=${lvl}`);
                    }
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <HSKLevel level={lvl as 1 | 2 | 3 | 4 | 5 | 6} />
                      {isCurrent && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            backgroundColor: 'var(--primary-light, #FFF0F1)',
                            color: 'var(--primary, #E60012)',
                          }}
                        >
                          Đang học
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#172033', margin: '0 0 4px 0' }}>
                      {curLevel ? curLevel.vietnameseName : `HSK ${lvl}`}
                    </h3>

                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                      {curLevel ? `${curLevel.totalLessons} bài học • ${curLevel.totalWords} từ vựng then chốt` : 'Đang tải thông tin...'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                      {progressLabel}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--primary, #E60012)',
                      }}
                    >
                      <span>Vào học</span>
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 4: HỌC QUA VIDEO (Video Learning with Clear Status) */}
        <section aria-label="Học qua video">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Film size={20} style={{ color: 'var(--primary, #E60012)' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#172033', margin: 0 }}>
                    Học qua Video song ngữ
                  </h2>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--primary-light, #FFF0F1)',
                      color: 'var(--primary, #E60012)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Demo Dataset
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' }}>
                  Xem clip bản xứ với phụ đề chữ Hán, Pinyin và giải nghĩa tiếng Việt tương tác.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/videos')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: 'var(--primary, #E60012)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span>Kho video</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="video-discovery-grid">
            {DEMO_VIDEOS.slice(0, 3).map((video) => {
              const isPlayable = Boolean(video.hasPlayableVideo && video.videoUrl);
              return (
                <div
                  key={video.id}
                  className="video-thumb-card"
                  onClick={() => navigate(`/videos/${video.id}`)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/videos/${video.id}`);
                    }
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', height: '140px', backgroundColor: '#0f172a' }}>
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isPlayable ? 0.9 : 0.75 }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {video.durationLabel}
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        backgroundColor: isPlayable ? 'rgba(22, 163, 74, 0.95)' : 'rgba(230, 0, 18, 0.9)',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {isPlayable ? `HSK ${video.hskLevel} • Có video` : `HSK ${video.hskLevel} • Demo phụ đề`}
                    </div>
                  </div>

                  <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: '#172033',
                          margin: '0 0 4px 0',
                          lineHeight: 1.35,
                        }}
                      >
                        {video.title}
                      </h3>
                      <p
                        style={{
                          fontFamily: 'var(--font-hanzi, "Noto Sans SC", sans-serif)',
                          fontSize: '12px',
                          color: 'var(--primary, #E60012)',
                          margin: '0 0 8px 0',
                          fontWeight: 600,
                        }}
                      >
                        {video.chineseTitle}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {video.viewCount} lượt xem (Demo)
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: isPlayable ? 'var(--primary, #E60012)' : '#64748b',
                        }}
                      >
                        {isPlayable ? <Play size={12} fill="currentColor" /> : <VideoOff size={12} />}
                        <span>{isPlayable ? 'Xem video' : 'Xem phụ đề'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 5: BÀI HỌC ĐỀ XUẤT (Recommendations & Weak Knowledge) */}
        <section aria-label="Bài học đề xuất">
          <div style={{ marginBottom: '14px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#172033', margin: 0 }}>
              Bài học đề xuất thông minh
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' }}>
              Được cá nhân hóa dựa trên độ chính xác làm bài và thời gian ghi nhớ từ vựng của bạn.
            </p>
          </div>

          <div className="recommendations-grid">
            {/* Card 1: Ôn từ vựng SRS */}
            <div
              className="rec-card"
              onClick={handleStartReview}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStartReview();
                }
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#fff7ed',
                      color: '#ea580c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Languages size={18} />
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: dueVocabCount > 0 ? '#ffedd5' : '#f1f5f9',
                      color: dueVocabCount > 0 ? '#ea580c' : '#64748b',
                    }}
                  >
                    {dueVocabCount} thẻ
                  </span>
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#172033', margin: '0 0 4px 0' }}>
                  Ôn từ vựng cần nhớ
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                  Thuật toán Spaced Repetition nhắc nhở các từ đến hạn ôn tập hôm nay.
                </p>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#ea580c' }}>
                <span>Bắt đầu ôn tập</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Card 2: Điểm ngữ pháp cần củng cố */}
            <div
              className="rec-card"
              onClick={() => navigate('/practice')}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/practice');
                }
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <GraduationCap size={18} />
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: '#dbeafe',
                      color: '#1d4ed8',
                    }}
                  >
                    Ngữ pháp
                  </span>
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#172033', margin: '0 0 4px 0' }}>
                  {weakGrammar ? weakGrammar.topicTitle : 'Cấu trúc câu chữ 是 / 的'}
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                  Rèn luyện phản xạ với bài tập trắc nghiệm chọn đáp án đúng theo ngữ cảnh.
                </p>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#2563eb' }}>
                <span>Khắc phục lỗi</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Card 3: Luyện nghe phản xạ */}
            <div
              className="rec-card"
              onClick={() => navigate('/skills/listening')}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/skills/listening');
                }
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#f5f3ff',
                      color: '#7c3aed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Headphones size={18} />
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: '#ede9fe',
                      color: '#6d28d9',
                    }}
                  >
                    Kỹ năng
                  </span>
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#172033', margin: '0 0 4px 0' }}>
                  Luyện nghe hiểu hội thoại
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                  Luyện nghe tốc độ tự nhiên kèm bài tập nối tranh và điền từ khuyết.
                </p>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#7c3aed' }}>
                <span>Vào luyện nghe</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Card 4: Luyện nói với AI Tutor */}
            <div
              className="rec-card"
              onClick={() => navigate('/ai-tutor')}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/ai-tutor');
                }
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--primary-light, #FFF0F1)',
                      color: 'var(--primary, #E60012)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Mic size={18} />
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: 'var(--primary-light, #FFF0F1)',
                      color: 'var(--primary, #E60012)',
                    }}
                  >
                    AI Tutor
                  </span>
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#172033', margin: '0 0 4px 0' }}>
                  Hội thoại giao tiếp AI
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                  Nói chuyện nhập vai với Kippy AI để chỉnh sửa phát âm thanh điệu tức thì.
                </p>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: 'var(--primary, #E60012)' }}>
                <span>Trò chuyện ngay</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: THỬ THÁCH HẰNG NGÀY (Daily Challenge Checklist) */}
        <section aria-label="Thử thách hằng ngày">
          <div className="dashboard-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#172033', margin: 0 }}>
                  Thử thách hằng ngày
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                  Hoàn thành 3 mục tiêu để nhận trọn vẹn rương phần thưởng 50 XP.
                </p>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: 'var(--primary, #E60012)',
                  backgroundColor: 'var(--primary-light, #FFF0F1)',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                }}
              >
                {dailyGoal.isGoalMet ? '3/3 Hoàn thành 🎉' : 'Đang thực hiện'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Task 1: Học đạt mục tiêu XP */}
              <div className={`challenge-item-row ${dailyGoal.currentXp >= dailyGoal.targetXp ? 'completed' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {dailyGoal.currentXp >= dailyGoal.targetXp ? (
                    <CheckCircle2 size={20} style={{ color: '#16a34a', flexShrink: 0 }} />
                  ) : (
                    <Circle size={20} style={{ color: '#cbd5e1', flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#172033' }}>
                      Đạt {dailyGoal.targetXp} XP kinh nghiệm hôm nay
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                      Đã đạt: {dailyGoal.currentXp} / {dailyGoal.targetXp} XP
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleContinueLesson}
                  style={{
                    background: 'none',
                    border: '1px solid #e2e8f0',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#475569',
                  }}
                >
                  Làm ngay
                </button>
              </div>

              {/* Task 2: Ôn tập từ vựng SRS */}
              <div className={`challenge-item-row ${dueVocabCount === 0 ? 'completed' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {dueVocabCount === 0 ? (
                    <CheckCircle2 size={20} style={{ color: '#16a34a', flexShrink: 0 }} />
                  ) : (
                    <Circle size={20} style={{ color: '#cbd5e1', flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#172033' }}>
                      Ôn tập toàn bộ từ vựng đến hạn ghi nhớ
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                      {dueVocabCount > 0 ? `Còn ${dueVocabCount} từ cần ôn tập` : 'Tất cả thẻ đã được ôn tập'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleStartReview}
                  style={{
                    background: 'none',
                    border: '1px solid #e2e8f0',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#475569',
                  }}
                >
                  Ôn từ
                </button>
              </div>

              {/* Task 3: Hoàn thành 1 bài luyện tập trắc nghiệm */}
              <div className="challenge-item-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Circle size={20} style={{ color: '#cbd5e1', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#172033' }}>
                      Hoàn thành 1 bài luyện tập trắc nghiệm hoặc ngữ pháp
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                      Nhận thêm 30 XP và phân tích điểm yếu
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/practice')}
                  style={{
                    background: 'none',
                    border: '1px solid #e2e8f0',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#475569',
                  }}
                >
                  Vào luyện
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* =====================================================================
          RIGHT SIDEBAR (Widget Column per HanbeeGo)
          ===================================================================== */}
      <aside className="dashboard-right-column" aria-label="Thông tin học tập cá nhân">

        {/* WIDGET 1: REAL STREAK CARD */}
        <div className="dashboard-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--primary-light, #FFF0F1)',
                  color: 'var(--primary, #E60012)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Flame size={18} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Chuỗi học tập
                </div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#172033' }}>
                  {streakDays} ngày liên tiếp 🔥
                </div>
              </div>
            </div>

            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--primary, #E60012)',
              }}
            >
              Học đều đặn
            </span>
          </div>

          {/* Weekday dots computed from daily activity */}
          <div className="weekday-dots-row">
            {weekdays.map((day) => (
              <div key={day.label} className="weekday-dot-item" title={`${day.date}: ${day.active ? 'Có học' : 'Chưa học'}`}>
                <div
                  className={`weekday-circle ${day.active ? 'active' : ''} ${day.isToday ? 'today' : ''}`}
                >
                  {day.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WIDGET 2: TIẾN ĐỘ MỤC TIÊU HÔM NAY */}
        <div className="dashboard-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} style={{ color: '#16a34a' }} />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#172033' }}>
                Mục tiêu hôm nay
              </span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
              {dailyGoal.currentMinutes} / {dailyGoal.targetMinutes} phút
            </span>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <ProgressBar
              value={dailyGoal.minutesPercent ?? Math.min(100, Math.round((dailyGoal.currentMinutes / (dailyGoal.targetMinutes || 30)) * 100))}
              showPercentage={false}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} style={{ color: '#d97706' }} />
              <span style={{ fontSize: '12px', color: '#475569' }}>Kinh nghiệm:</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#172033' }}>
              {dailyGoal.currentXp} / {dailyGoal.targetXp} XP
            </span>
          </div>
        </div>

        {/* WIDGET 3: TỪ VỰNG HÔM NAY */}
        <div className="dashboard-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bookmark size={15} style={{ color: 'var(--primary, #E60012)' }} />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#172033' }}>
                Từ vựng hôm nay
              </span>
            </div>
            <button
              type="button"
              onClick={() => handlePlayVocabAudio(todayVocab.hanzi)}
              style={{
                background: 'none',
                border: 'none',
                color: isPlayingAudio ? 'var(--primary, #E60012)' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
              title="Nghe phát âm chuẩn Bắc Kinh"
              aria-label="Nghe phát âm từ vựng"
            >
              <Volume2 size={16} />
            </button>
          </div>

          <div
            style={{
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary-light, #FFF0F1)',
              border: '1px solid #fed7da',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-hanzi, "Noto Sans SC", sans-serif)',
                fontSize: '32px',
                fontWeight: 800,
                color: 'var(--primary, #E60012)',
                lineHeight: 1.1,
              }}
            >
              {todayVocab.hanzi}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b', marginTop: '4px' }}>
              {todayVocab.pinyin}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginTop: '2px' }}>
              {todayVocab.meaning}
            </div>
          </div>

          <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
            <div style={{ fontFamily: 'var(--font-hanzi, "Noto Sans SC", sans-serif)', color: '#172033', fontWeight: 600 }}>
              {todayVocab.example}
            </div>
            <div style={{ color: '#475569', marginTop: '2px' }}>
              {todayVocab.exampleMeaning}
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartReview}
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #fed7da',
              backgroundColor: '#ffffff',
              color: 'var(--primary, #E60012)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Languages size={14} />
            <span>Ôn {dueVocabCount} từ trong sổ từ</span>
          </button>
        </div>

        {/* WIDGET 4: BẢNG XẾP HẠNG TUẦN (Clearly Badged as Demo) */}
        <div className="dashboard-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trophy size={16} style={{ color: '#d97706' }} />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#172033' }}>
                Bảng xếp hạng tuần
              </span>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'var(--primary-light, #FFF0F1)',
                color: 'var(--primary, #E60012)',
              }}
            >
              MÔ PHỎNG (DEMO)
            </span>
          </div>

          <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#94a3b8' }}>
            Dữ liệu mô phỏng trước khi mở tính năng kết nối mạng xã hội
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Rank 1: Current Real User */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary-light, #FFF0F1)',
                border: '1px solid #fed7da',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--primary, #E60012)', width: '16px' }}>
                  1
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#172033' }}>
                  {studentName} (Bạn)
                </span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary, #E60012)' }}>
                {xpTotal} XP
              </span>
            </div>

            {/* Rank 2 (Demo) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', width: '16px' }}>
                  2
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                  Trần Hoàng Nam
                </span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
                1,420 XP
              </span>
            </div>

            {/* Rank 3 (Demo) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', width: '16px' }}>
                  3
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                  Lê Phương Linh
                </span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
                1,180 XP
              </span>
            </div>
          </div>
        </div>

        {/* WIDGET 5: GỢI Ý ÔN TẬP NHANH */}
        <div className="dashboard-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#172033', marginBottom: '10px' }}>
            Truy cập nhanh
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={handleStartReview}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Languages size={14} style={{ color: '#ea580c' }} />
                <span>Ôn tập thẻ nhớ SRS</span>
              </span>
              <ChevronRight size={14} style={{ color: '#94a3b8' }} />
            </button>

            <button
              type="button"
              onClick={() => navigate('/practice')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Dumbbell size={14} style={{ color: '#2563eb' }} />
                <span>Luyện tập ngữ pháp & bài tập</span>
              </span>
              <ChevronRight size={14} style={{ color: '#94a3b8' }} />
            </button>

            <button
              type="button"
              onClick={() => navigate('/ai-tutor')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={14} style={{ color: 'var(--primary, #E60012)' }} />
                <span>Trợ lý học tập Kippy AI</span>
              </span>
              <ChevronRight size={14} style={{ color: '#94a3b8' }} />
            </button>
          </div>
        </div>

      </aside>
    </div>
  );
};

export default DashboardPage;
