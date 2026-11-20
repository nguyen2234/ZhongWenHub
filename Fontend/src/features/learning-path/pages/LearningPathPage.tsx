import React from 'react';
import {
  Sparkles,
  Compass,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLearningState } from '../../learning';
import { BeginnerRoadmap } from '../components/BeginnerRoadmap';
import { BeginnerGuidanceSection } from '../components/BeginnerGuidanceSection';
import { HskCurriculumView } from '../components/HskCurriculumView';
import { PersonalizedLearningDashboard } from '../components/PersonalizedLearningDashboard';

export interface LearningPathProps {
  onOpenLesson?: (lessonId?: string | number) => void;
}

export const LearningPathPage: React.FC<LearningPathProps> = ({ onOpenLesson: customOpenLesson }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawMode = searchParams.get('mode');
  const hasExplicitLevel = searchParams.has('level');

  let currentMode: 'personalized' | 'hsk' | 'beginner' = 'personalized';
  if (rawMode === 'hsk' || (hasExplicitLevel && rawMode !== 'beginner')) {
    currentMode = 'hsk';
  } else if (rawMode === 'beginner') {
    currentMode = 'beginner';
  } else {
    currentMode = 'personalized';
  }

  const { startLesson } = useLearningState();

  const handleLessonAction = (lessonId: string) => {
    startLesson(lessonId);
    if (customOpenLesson) {
      customOpenLesson(lessonId);
    } else {
      navigate(`/lesson?id=${lessonId}`);
    }
  };

  const setMode = (mode: 'personalized' | 'hsk' | 'beginner') => {
    const nextParams = new URLSearchParams(searchParams);
    if (mode === 'personalized') {
      nextParams.delete('mode');
    } else {
      nextParams.set('mode', mode);
    }
    setSearchParams(nextParams);
  };

  return (
    <div className="student-content-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Mode Navigation Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px',
          backgroundColor: '#F1F5F9',
          borderRadius: '14px',
          width: 'fit-content',
        }}
      >
        <button
          type="button"
          onClick={() => setMode('personalized')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: currentMode === 'personalized' ? '#ffffff' : 'transparent',
            color: currentMode === 'personalized' ? 'var(--primary, #E60012)' : '#475569',
            fontWeight: currentMode === 'personalized' ? 800 : 600,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: currentMode === 'personalized' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Compass size={16} />
          Lộ trình AI Cá nhân hóa
        </button>

        <button
          type="button"
          onClick={() => setMode('hsk')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: currentMode === 'hsk' ? '#ffffff' : 'transparent',
            color: currentMode === 'hsk' ? 'var(--primary, #E60012)' : '#475569',
            fontWeight: currentMode === 'hsk' ? 800 : 600,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: currentMode === 'hsk' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <BookOpen size={16} />
          Giáo trình HSK (1-6)
        </button>

        <button
          type="button"
          onClick={() => setMode('beginner')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: currentMode === 'beginner' ? '#ffffff' : 'transparent',
            color: currentMode === 'beginner' ? 'var(--primary, #E60012)' : '#475569',
            fontWeight: currentMode === 'beginner' ? 800 : 600,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: currentMode === 'beginner' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <GraduationCap size={16} />
          Khởi đầu từ số 0
        </button>
      </div>

      {/* Render selected view */}
      {currentMode === 'personalized' && (
        <PersonalizedLearningDashboard />
      )}

      {currentMode === 'beginner' && (
        <>
          {/* =====================================================================
              3.2. HERO SÁNG PHONG CÁCH HANBEEGO: Bắt đầu học tiếng Trung từ con số 0
              ===================================================================== */}
          <section
            aria-labelledby="beginner-hero-title"
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '24px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #fed7da',
              padding: '36px 36px',
              boxShadow: '0 4px 20px -2px rgba(230, 0, 18, 0.05)',
            }}
          >
            {/* Watermark Hanzi '学' on the right */}
            <div
              style={{
                position: 'absolute',
                right: '32px',
                bottom: '-40px',
                fontFamily: '"Noto Serif SC", "PingFang SC", "Microsoft YaHei", serif',
                fontSize: '220px',
                fontWeight: 900,
                color: 'rgba(230, 0, 18, 0.06)',
                userSelect: 'none',
                pointerEvents: 'none',
                lineHeight: 1,
              }}
              aria-hidden="true"
            >
              学
            </div>

            {/* Left Content */}
            <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  backgroundColor: '#FFF0F1',
                  color: 'var(--primary, #E60012)',
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                }}
              >
                <Sparkles size={14} />
                Lộ trình người mới bắt đầu
              </div>

              <h1
                id="beginner-hero-title"
                style={{
                  fontSize: '30px',
                  fontWeight: 900,
                  lineHeight: 1.25,
                  margin: '0 0 12px',
                  color: '#0f172a',
                  letterSpacing: '-0.02em',
                }}
              >
                Bắt đầu học tiếng Trung từ con số 0
              </h1>

              <p
                style={{
                  fontSize: '15px',
                  lineHeight: 1.65,
                  color: '#475569',
                  margin: '0 0 16px',
                }}
              >
                Hành trình 6 bước được thiết kế khoa học giúp bạn giải mã phát âm Pinyin, làm chủ 4 thanh điệu,
                viết đúng nét chữ Hán và tự tin giao tiếp các tình huống sinh hoạt cơ bản.
              </p>

              {/* Highlights badge row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#64748b',
                }}
              >
                <span style={{ color: 'var(--primary, #E60012)', fontWeight: 700 }}>✓ 6 bước bài bản</span>
                <span>•</span>
                <span>✓ 150 từ vựng HSK 1</span>
                <span>•</span>
                <span>✓ Flashcard SRS</span>
                <span>•</span>
                <span>✓ 100% miễn phí</span>
              </div>
            </div>
          </section>

          {/* 3.3 & 3.4. Lộ trình 6 bước trên một hàng ngang */}
          <BeginnerRoadmap onOpenLesson={handleLessonAction} />

          {/* 4.1 & 4.2. 3 điều giúp học nhanh hơn & Bài hướng dẫn cho người mới */}
          <BeginnerGuidanceSection onOpenLesson={handleLessonAction} />
        </>
      )}

      {currentMode === 'hsk' && (
        <HskCurriculumView onOpenLesson={handleLessonAction} />
      )}
    </div>
  );
};
