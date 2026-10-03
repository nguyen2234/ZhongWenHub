import { useState, useEffect } from 'react';
import {
  Flame,
  LayoutDashboard,
  Layers,
  BookOpen,
  GraduationCap,
  Languages,
  Dumbbell,
  LogIn,
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { LearningPath } from './components/LearningPath';
import { LessonExperience } from './features/lesson';
import { PracticeCenter } from './features/practice';
import { AITutorProvider } from './features/ai-tutor';
import {
  VocabularyBank,
  ReviewSession,
  getDueReviewQueue,
  INITIAL_USER_VOCAB_STATES,
  INITIAL_SRS_STATES,
  predictIntervalLabels,
  type ReviewQueueItem,
  type VocabularyItem,
} from './features/vocabulary';
import { ChineseDesignSystemShowcase } from './components/ChineseDesignSystemShowcase';
import { HSKLevel, XPIndicator } from './design-system';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  OnboardingPage,
} from './features/auth';

export type AppRoute =
  | 'dashboard'
  | 'learning-path'
  | 'vocabulary'
  | 'practice'
  | 'design-system'
  | 'lesson'
  | 'srs-review'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'onboarding';

function getInitialRoute(): AppRoute {
  if (typeof window === 'undefined') return 'practice';
  const path = window.location.pathname.toLowerCase();
  if (path === '/login') return 'login';
  if (path === '/register') return 'register';
  if (path === '/forgot-password') return 'forgot-password';
  if (path === '/onboarding') return 'onboarding';
  if (path === '/dashboard') return 'dashboard';
  return 'practice';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppRoute>(() => getInitialRoute());

  // Listen to browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getInitialRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (target: string) => {
    let route: AppRoute = 'practice';
    let path = '/';

    if (target === 'login' || target === '/login') {
      route = 'login';
      path = '/login';
    } else if (target === 'register' || target === '/register') {
      route = 'register';
      path = '/register';
    } else if (target === 'forgot-password' || target === '/forgot-password') {
      route = 'forgot-password';
      path = '/forgot-password';
    } else if (target === 'onboarding' || target === '/onboarding') {
      route = 'onboarding';
      path = '/onboarding';
    } else if (target === 'dashboard' || target === '/dashboard') {
      route = 'dashboard';
      path = '/dashboard';
    } else {
      route = target as AppRoute;
      path = target === 'practice' ? '/' : `/${target}`;
    }

    window.history.pushState({}, '', path);
    setActiveTab(route);
  };

  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>(() => getDueReviewQueue());

  // Focus Mode 1: SRS Flashcard Review Session (zero distraction, no navbar, no footer)
  if (activeTab === 'srs-review') {
    return (
      <AITutorProvider>
        <ReviewSession
          queue={reviewQueue}
          onExit={() => setActiveTab('vocabulary')}
        />
      </AITutorProvider>
    );
  }

  // Focus Mode 2: Pure Learning Mode for Lesson (no dashboard header/footer distraction)
  if (activeTab === 'lesson') {
    return (
      <AITutorProvider>
        <LessonExperience
          onBackToLearningPath={() => setActiveTab('learning-path')}
          onNextLesson={() => alert('Chuyển sang bài tiếp theo: Bài 9 (HSK 2)')}
        />
      </AITutorProvider>
    );
  }

  // Focus Mode 3: Authentication - Login Page (/login)
  if (activeTab === 'login') {
    return (
      <LoginPage
        onSuccessLogin={() => navigate('dashboard')}
        onNavigate={navigate}
      />
    );
  }

  // Focus Mode 4: Authentication - Register Page (/register)
  if (activeTab === 'register') {
    return (
      <RegisterPage
        onSuccessRegister={() => navigate('onboarding')}
        onNavigate={navigate}
      />
    );
  }

  // Focus Mode 5: Authentication - Forgot Password Page (/forgot-password)
  if (activeTab === 'forgot-password') {
    return (
      <ForgotPasswordPage
        onNavigate={navigate}
      />
    );
  }

  // Focus Mode 6: New Student Onboarding Flow (/onboarding)
  if (activeTab === 'onboarding') {
    return (
      <OnboardingPage
        onComplete={() => navigate('dashboard')}
      />
    );
  }

  // Handler to start reviewing a single specific word from Drawer
  const handleReviewSingleWord = (word: VocabularyItem) => {
    const userState = INITIAL_USER_VOCAB_STATES[word.id] || {
      vocabularyId: word.id,
      status: 'learning',
      firstLearnedAt: '2026-10-01',
      lastReviewedAt: '2026-10-02',
      nextReviewAt: '2026-10-03',
      reviewCount: 1,
      correctCount: 1,
      isDueToday: true,
    };
    const srsState = INITIAL_SRS_STATES[word.id] || {
      vocabularyId: word.id,
      stability: 1.2,
      difficulty: 4.5,
      interval: 1,
      repetitions: 1,
      easeFactor: 2.5,
    };

    setReviewQueue([
      {
        vocabulary: word,
        userState,
        srsState,
        predictedIntervals: predictIntervalLabels(srsState),
      },
    ]);
    setActiveTab('srs-review');
  };

  return (
    <AITutorProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)' }}>
      {/* =====================================================================
          APP TOP NAVIGATION BAR (ZhongWenHub Chinese Learning Shell)
          ===================================================================== */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '0 var(--space-4)',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            height: '62px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
          }}
        >
          {/* Logo & Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
            {/* Brand Logo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab('dashboard')}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-hanzi)',
                  fontWeight: 700,
                  fontSize: '19px',
                  boxShadow: '0 2px 10px rgba(67, 56, 202, 0.3)',
                }}
              >
                华
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                  ZhongWen<span style={{ color: 'var(--primary)' }}>Hub</span>
                </span>
                <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 500 }}>
                  Tự học Tiếng Trung HSK
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('practice')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1-5)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  backgroundColor: activeTab === 'practice' ? 'var(--primary-light)' : 'transparent',
                  color: activeTab === 'practice' ? 'var(--primary)' : 'var(--muted)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Dumbbell size={16} />
                <span>Luyện tập</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    color: 'var(--danger)',
                    fontWeight: 700,
                  }}
                  title="12 câu cần luyện lại"
                >
                  12
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('vocabulary')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1-5)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  backgroundColor: activeTab === 'vocabulary' ? 'var(--primary-light)' : 'transparent',
                  color: activeTab === 'vocabulary' ? 'var(--primary)' : 'var(--muted)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Languages size={16} />
                <span>Kho từ vựng</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--streak-bg)',
                    color: 'var(--streak)',
                    fontWeight: 700,
                  }}
                  title="18 từ cần ôn hôm nay"
                >
                  18
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('learning-path')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1-5)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  backgroundColor: activeTab === 'learning-path' ? 'var(--primary-light)' : 'transparent',
                  color: activeTab === 'learning-path' ? 'var(--primary)' : 'var(--muted)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <BookOpen size={16} />
                Lộ trình HSK
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1-5)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  backgroundColor: activeTab === 'dashboard' ? 'var(--primary-light)' : 'transparent',
                  color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--muted)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('lesson')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1-5)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--primary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <GraduationCap size={16} />
                Vào học Bài 8
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('design-system')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1-5)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  backgroundColor: activeTab === 'design-system' ? 'var(--primary-light)' : 'transparent',
                  color: activeTab === 'design-system' ? 'var(--primary)' : 'var(--muted)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Layers size={16} />
                Design System
              </button>
            </nav>
          </div>

          {/* Right Header Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <HSKLevel level={2} />

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--streak-bg)',
                border: '1px solid var(--streak-border)',
                color: 'var(--streak)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
              }}
              title="Chuỗi 8 ngày học liên tiếp"
            >
              <Flame size={15} />
              <span>8 Ngày</span>
            </div>

            <XPIndicator amount={2180} variant="pill" />

            {/* User Avatar */}
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--secondary)',
                border: '1px solid var(--border-strong)',
                color: 'var(--foreground)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Minh Anh (Học viên HSK 2)"
              onClick={() => navigate('login')}
            >
              MA
            </div>

            {/* Quick Auth Trigger Button */}
            <button
              type="button"
              onClick={() => navigate('login')}
              className="ds-btn ds-btn-outline"
              style={{
                height: '32px',
                padding: '0 12px',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                gap: '5px',
                borderRadius: 'var(--radius-full)',
              }}
              title="Đăng nhập / Đăng ký"
            >
              <LogIn size={13} />
              <span>Đăng nhập</span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          MAIN CONTENT AREA
          ===================================================================== */}
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: 'var(--space-6) var(--space-4)', width: '100%', flex: 1 }}>
        {activeTab === 'practice' && <PracticeCenter />}
        {activeTab === 'vocabulary' && (
          <VocabularyBank
            onStartReviewSession={() => {
              setReviewQueue(getDueReviewQueue());
              setActiveTab('srs-review');
            }}
            onReviewSingleWord={handleReviewSingleWord}
          />
        )}
        {activeTab === 'learning-path' && (
          <LearningPath onOpenLesson={() => setActiveTab('lesson')} />
        )}
        {activeTab === 'dashboard' && (
          <Dashboard
            onStartReviewSession={() => {
              setReviewQueue(getDueReviewQueue());
              setActiveTab('srs-review');
            }}
            onOpenVocabulary={() => setActiveTab('vocabulary')}
            onOpenLesson={() => setActiveTab('lesson')}
          />
        )}
        {activeTab === 'design-system' && <ChineseDesignSystemShowcase />}
      </main>

      {/* =====================================================================
          FOOTER
          ===================================================================== */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          padding: 'var(--space-5) var(--space-4)',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 'var(--text-xs)',
            color: 'var(--muted)',
            gap: 'var(--space-3)',
          }}
        >
          <div>
            © 2026 ZhongWenHub • Nền tảng tự học tiếng Trung theo lộ trình HSK dành cho người Việt
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <span>
              Đang xem:{' '}
              <strong>
                {activeTab === 'vocabulary'
                  ? 'Kho từ vựng & Spaced Repetition'
                  : activeTab === 'learning-path'
                  ? 'Lộ trình HSK'
                  : activeTab === 'dashboard'
                  ? 'Dashboard Trải nghiệm học'
                  : 'Design System Showcase'}
              </strong>
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('vocabulary')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === 'vocabulary' ? 'var(--primary)' : 'var(--muted)',
                  fontWeight: 600,
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                  textDecoration: activeTab === 'vocabulary' ? 'underline' : 'none',
                }}
              >
                Kho từ vựng
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setActiveTab('learning-path')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === 'learning-path' ? 'var(--primary)' : 'var(--muted)',
                  fontWeight: 600,
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                  textDecoration: activeTab === 'learning-path' ? 'underline' : 'none',
                }}
              >
                Lộ trình HSK
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--muted)',
                  fontWeight: 600,
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                  textDecoration: activeTab === 'dashboard' ? 'underline' : 'none',
                }}
              >
                Dashboard
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => navigate('design-system')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === 'design-system' ? 'var(--primary)' : 'var(--muted)',
                  fontWeight: 600,
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                  textDecoration: activeTab === 'design-system' ? 'underline' : 'none',
                }}
              >
                Design System
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => navigate('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                }}
              >
                Đăng nhập
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => navigate('register')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                }}
              >
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </AITutorProvider>
  );
}
