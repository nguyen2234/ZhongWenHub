import React from 'react';
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
} from 'lucide-react';
import { useLearningState } from '../../learning';
import { HSKLevel, ProgressBar } from '../../../design-system';
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
  const {
    currentHskLevel,
    currentLesson,
    xpTotal,
    streakDays,
    dueVocabCount,
    dailyGoal,
    recommendations,
    startLesson,
    state: learningState,
  } = useLearningState();

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

  // 3. Practice Center Handler
  const handleOpenPractice = () => {
    navigate('/practice');
  };

  // Compute lesson step progress from state
  const lessonProgressRecord = currentLesson
    ? learningState.lessonProgress[currentLesson.id]
    : learningState.lessonProgress['les-8'];

  const currentStep = lessonProgressRecord?.currentStepIndex ?? 0;
  const isCompleted = lessonProgressRecord?.status === 'COMPLETED';
  const totalSteps = 6;
  const progressPercent = isCompleted
    ? 100
    : Math.min(100, Math.round(((currentStep + 1) / totalSteps) * 100));

  // Top recommendation (if available)
  const topRecommendation = recommendations && recommendations.length > 0 ? recommendations[0] : null;

  return (
    <div className="student-dashboard-container">
      {/* =====================================================================
          SECTION A: SHORT WELCOME (No large decorative hero banner)
          ===================================================================== */}
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          paddingBottom: '4px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#0f172a',
                margin: 0,
                letterSpacing: '-0.3px',
              }}
            >
              Chào Minh Anh 👋
            </h1>
            <HSKLevel level={(currentHskLevel >= 7 ? '7-9' : currentHskLevel) as 1 | 2 | 3 | 4 | 5 | 6 | '7-9'} />
          </div>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '13px',
              color: '#64748b',
              fontWeight: 500,
            }}
          >
            Sẵn sàng tiếp tục bài học hôm nay để đạt mục tiêu HSK {currentHskLevel}!
          </p>
        </div>

        {/* Compact Path Shortcut */}
        <button
          type="button"
          onClick={() => navigate('/learning-path')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '9999px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: '#475569',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Xem toàn bộ lộ trình HSK"
        >
          <BookOpen size={14} style={{ color: '#e60012' }} />
          <span>Lộ trình HSK 1–9</span>
          <ChevronRight size={13} />
        </button>
      </header>


      <section className="hanbee-banner" aria-label="Bắt đầu học tiếng Trung">
        <div className="hanbee-banner-copy"><h2>Nâng cao mỗi ngày<br/><span>Tiến bộ không ngừng!</span></h2><p>Học tiếng Trung mỗi ngày giúp bạn mở ra những cơ hội mới.</p><button type="button" onClick={() => navigate('/learning-path')}>BẮT ĐẦU HỌC NGAY <ArrowRight size={17}/></button></div>
        <div className="hanbee-banner-art" aria-hidden="true"><span className="hanbee-art-sun">☀</span><span className="hanbee-art-hanzi">中文</span><span className="hanbee-art-book">你好</span><span className="hanbee-art-flower">✿</span></div>
      </section>
      {/* =====================================================================
          SECTION B: CONTINUE LEARNING (Main Focal Point)
          ===================================================================== */}
      <section
        className="continue-learning-card"
        aria-label="Tiếp tục học bài học gần nhất"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#e60012',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#e60012',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Tiếp tục học
            </span>
          </div>

          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#64748b',
            }}
          >
            Bước {isCompleted ? '6/6' : `${currentStep + 1}/6`} ({progressPercent}%)
          </span>
        </div>

        {/* Lesson Details Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          {/* Hanzi Avatar Icon */}
          <div
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '16px',
              backgroundColor: '#e60012',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-hanzi, "Noto Sans SC", sans-serif)',
              fontSize: '26px',
              fontWeight: 700,
              boxShadow: '0 4px 10px rgba(67, 56, 202, 0.25)',
              flexShrink: 0,
            }}
          >
            {currentLesson?.hanzi?.slice(0, 1) || '喝'}
          </div>

          {/* Lesson Title & Subtitles */}
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#fff0f1',
                  color: '#e60012',
                }}
              >
                Bài {currentLesson?.lessonNumber || 8}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-hanzi, "Noto Sans SC", sans-serif)',
                  fontSize: '17px',
                  fontWeight: 800,
                  color: '#0f172a',
                }}
              >
                {currentLesson?.hanzi || '你想喝什么？'}
              </span>
            </div>

            <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px', fontWeight: 500 }}>
              <span style={{ color: '#e60012', fontWeight: 600 }}>
                {currentLesson?.pinyin || 'Nǐ xiǎng hē shénme?'}
              </span>
              {' • '}
              <span>{currentLesson?.meaning || 'Bạn muốn uống gì?'}</span>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: '10px', maxWidth: '420px' }}>
              <ProgressBar value={progressPercent} showPercentage={false} />
            </div>
          </div>

          {/* Action Button */}
          <div style={{ flexShrink: 0 }}>
            <button
              type="button"
              className="btn-continue-learning"
              onClick={handleContinueLesson}
              title="Bắt đầu hoặc tiếp tục bài học"
            >
              <Play size={16} fill="currentColor" />
              <span>Tiếp tục Bài {currentLesson?.lessonNumber || 8}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION C: QUICK ACTIONS (Only Ôn từ vựng & Luyện tập)
          ===================================================================== */}
      <section aria-label="Thao tác nhanh">
        <div className="quick-actions-grid">
          {/* Card 1: Ôn từ vựng */}
          <div
            className="minimal-card minimal-card-interactive"
            onClick={handleStartReview}
            style={{
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
            title="Bắt đầu phiên ôn tập từ vựng Spaced Repetition"
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: '#fff7ed',
                color: '#ea580c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Languages size={22} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: 0,
                  }}
                >
                  Ôn từ vựng
                </h2>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    backgroundColor: dueVocabCount > 0 ? '#ffedd5' : '#f1f5f9',
                    color: dueVocabCount > 0 ? '#ea580c' : '#64748b',
                  }}
                >
                  {dueVocabCount} cần ôn
                </span>
              </div>
              <p
                style={{
                  margin: '3px 0 0 0',
                  fontSize: '12px',
                  color: '#64748b',
                  lineHeight: 1.35,
                }}
              >
                Ôn thẻ ghi nhớ SRS lặp lại ngắt quãng để duy trì trí nhớ bền vững.
              </p>
            </div>

            <ChevronRight size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
          </div>

          {/* Card 2: Luyện tập */}
          <div
            className="minimal-card minimal-card-interactive"
            onClick={handleOpenPractice}
            style={{
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
            title="Vào trung tâm luyện tập câu hỏi và phản xạ"
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: '#fff0f1',
                color: '#e60012',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Dumbbell size={22} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: 0,
                  }}
                >
                  Luyện tập
                </h2>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    backgroundColor: '#ffe1e4',
                    color: '#e60012',
                  }}
                >
                  Thực hành
                </span>
              </div>
              <p
                style={{
                  margin: '3px 0 0 0',
                  fontSize: '12px',
                  color: '#64748b',
                  lineHeight: 1.35,
                }}
              >
                Rèn luyện ngữ pháp, làm bài tập trắc nghiệm và khắc phục các câu sai.
              </p>
            </div>

            <ChevronRight size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION D: DAILY LEARNING GOAL (Compact Presentation)
          ===================================================================== */}
      <section aria-label="Mục tiêu học tập hàng ngày">
        <div className="daily-goals-card">
          {/* Metric 1: Today's progress */}
          <div className="daily-goal-tile">
            <div className="goal-tile-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <Clock size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tiến độ hôm nay
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginTop: '1px' }}>
                {dailyGoal.currentMinutes} / {dailyGoal.targetMinutes} phút
              </div>
              <div style={{ marginTop: '4px', maxWidth: '160px' }}>
                <ProgressBar
                  value={dailyGoal.minutesPercent ?? Math.min(100, Math.round((dailyGoal.currentMinutes / (dailyGoal.targetMinutes || 30)) * 100))}
                  showPercentage={false}
                />
              </div>
            </div>
          </div>

          {/* Metric 2: XP */}
          <div className="daily-goal-tile">
            <div className="goal-tile-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
              <Zap size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Điểm kinh nghiệm
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginTop: '1px' }}>
                {dailyGoal.currentXp} / {dailyGoal.targetXp} XP
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Tổng tích lũy: <strong>{xpTotal} XP</strong>
              </div>
            </div>
          </div>

          {/* Metric 3: Streak */}
          <div className="daily-goal-tile">
            <div className="goal-tile-icon" style={{ backgroundColor: '#ffedd5', color: '#ea580c' }}>
              <Flame size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Chuỗi học tập
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginTop: '1px' }}>
                {streakDays} ngày liên tiếp 🔥
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Học đều đặn mỗi ngày
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="hanbee-side-summary"><div><h2>🔥 Streak của bạn</h2><strong>{streakDays} ngày liên tiếp</strong><p>Giữ vững thói quen học mỗi ngày!</p></div><button type="button" onClick={() => navigate("/progress")}>Xem thống kê học tập <ChevronRight size={16}/></button></section>
      <section className="hanbee-section" aria-label="Từ vựng hôm nay"><div className="hanbee-section-head"><h2>▦ Từ vựng hôm nay</h2><button type="button" onClick={() => navigate('/vocabulary')}>Xem chi tiết <ChevronRight size={16}/></button></div><div className="hanbee-word"><div><strong>学</strong><span>xué · học tập</span></div><div><b>学习中文</b><span>Xuéxí Zhōngwén</span><p>Học tiếng Trung mỗi ngày.</p><button type="button" onClick={() => { if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance('学习中文'); u.lang = 'zh-CN'; window.speechSynthesis.speak(u); } }}>▶ Nghe phát âm</button></div></div></section>
      <section className="hanbee-section" aria-label="Khám phá khóa học"><div className="hanbee-section-head"><h2>Khóa học HSK dành cho bạn</h2><button type="button" onClick={() => navigate('/learning-path')}>Tất cả khóa học <ChevronRight size={16}/></button></div><div className="hanbee-course-grid">{[1,2,3,4,5,6].map(level => <button key={level} type="button" className="hanbee-course" onClick={() => navigate('/learning-path')}><span className="hanbee-course-art">{['你','好','学','中','文','语'][level-1]}<small>HSK {level}</small></span><strong>Giáo trình HSK {level}</strong><span>{level === 1 ? 'Dành cho người mới bắt đầu' : level < 4 ? 'Kiến thức sơ cấp' : 'Nâng cao kỹ năng tiếng Trung'}</span><em>Khám phá →</em></button>)}</div></section>
      <section className="hanbee-section" aria-label="Học qua video"><div className="hanbee-section-head"><h2>▶ Học qua video</h2><button type="button" onClick={() => navigate('/skills/listening')}>Xem tất cả <ChevronRight size={16}/></button></div><div className="hanbee-video-grid">{[{title:'Làm quen tiếng Trung',hanzi:'你好'},{title:'Một ngày của tôi',hanzi:'我的一天'},{title:'Hội thoại thường ngày',hanzi:'对话'},{title:'Luyện nghe HSK',hanzi:'听力'}].map(v=><button type="button" className="hanbee-video" key={v.title} onClick={() => navigate('/skills/listening')}><span className="hanbee-video-thumb"><b>{v.hanzi}</b><i>▶</i></span><strong>{v.title}</strong></button>)}</div></section>
      <section className="hanbee-section" aria-label="Bài học đề xuất"><div className="hanbee-section-head"><h2>✧ Bài học đề xuất cho bạn</h2><button type="button" onClick={() => navigate('/practice')}>Xem tất cả <ChevronRight size={16}/></button></div><div className="hanbee-suggestions">{[{title:'Từ vựng theo chủ đề',sub:'Học theo nhóm nghĩa',route:'/vocabulary',hanzi:'词'},{title:'Cấu trúc câu HSK',sub:'Ngữ pháp trọng tâm',route:'/grammar',hanzi:'语'},{title:'Hội thoại thực tế',sub:'Luyện phản xạ nghe',route:'/skills/listening',hanzi:'听'},{title:'Phát âm chuẩn',sub:'Luyện kỹ năng nói',route:'/skills/speaking',hanzi:'说'}].map(item=><button type="button" key={item.title} className="hanbee-suggestion" onClick={() => navigate(item.route)}><span className="hanbee-suggestion-art">{item.hanzi}</span><strong>{item.title}</strong><small>{item.sub}</small></button>)}</div></section>
      <section className="hanbee-section" aria-label="Thử thách hàng ngày"><div className="hanbee-section-head"><h2>Thử thách hằng ngày</h2><button type="button" onClick={() => navigate('/practice')}>Tham gia <ChevronRight size={16}/></button></div><div className="hanbee-challenges"><button type="button" onClick={handleStartReview}><span>Ôn từ vựng SRS</span><b>{dueVocabCount} từ cần ôn →</b></button><button type="button" onClick={handleOpenPractice}><span>Luyện tập và tích lũy XP</span><b>{dailyGoal.currentXp}/{dailyGoal.targetXp} XP →</b></button><button type="button" onClick={() => navigate('/leaderboard')}><span>Bảng xếp hạng</span><b>Xem thứ hạng →</b></button></div></section>

      {/* =====================================================================
          OPTIONAL: CONTEXTUAL RECOMMENDATION (Only when data exists)
          ===================================================================== */}
      {topRecommendation && (
        <section
          style={{
            padding: '14px 18px',
            borderRadius: '14px',
            backgroundColor: '#fff4f4',
            border: '1px solid #ffd4d9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            flexWrap: 'wrap',
          }}
          aria-label="Gợi ý học tập thích ứng"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#e60012',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#e60012', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Gợi ý cho bạn
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#5b1018' }}>
                  {topRecommendation.title}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                {topRecommendation.reason}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(topRecommendation.destinationRoute)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#e60012',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{topRecommendation.actionLabel}</span>
            <ArrowRight size={13} />
          </button>
        </section>
      )}
    </div>
  );
};

export default DashboardPage;
