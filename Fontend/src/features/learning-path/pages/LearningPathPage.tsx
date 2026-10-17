import React from 'react';
import {
  Sparkles,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLearningState } from '../../learning';
import { StudentSecondaryNav } from '../../../layouts/components/StudentSecondaryNav';
import { STUDENT_MAIN_NAV_ITEMS } from '../../../config/student-navigation.config';
import { BeginnerRoadmap } from '../components/BeginnerRoadmap';
import { BeginnerGuidanceSection } from '../components/BeginnerGuidanceSection';
import { HskCurriculumView } from '../components/HskCurriculumView';

export interface LearningPathProps {
  onOpenLesson?: (lessonId?: string | number) => void;
}

export const LearningPathPage: React.FC<LearningPathProps> = ({ onOpenLesson: customOpenLesson }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentMode = searchParams.get('mode') === 'hsk' ? 'hsk' : 'beginner';
  const { startLesson } = useLearningState();

  const handleLessonAction = (lessonId: string) => {
    startLesson(lessonId);
    if (customOpenLesson) {
      customOpenLesson(lessonId);
    } else {
      navigate(`/lesson?id=${lessonId}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Secondary Sub-navigation for Học HSK */}
      <StudentSecondaryNav
        title="Học HSK"
        items={STUDENT_MAIN_NAV_ITEMS.find((i) => i.id === 'learning-path')?.secondaryFeatures || []}
      />

      {/*
        NO MODE SWITCHER TAB HERE!
        As per FE-5.4 specs, the tab bar ("Người mới bắt đầu" / "Lộ trình HSK") has been removed completely.
        These are two distinct items in the StudentSidebar:
        - "Lộ trình học tập" (/learning-path or /learning-path?mode=beginner)
        - "Giáo trình HSK" (/learning-path?mode=hsk)
      */}

      {currentMode === 'beginner' ? (
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
      ) : (
        /* =====================================================================
           5. TRANG GIÁO TRÌNH HSK (REDESIGNED THEO CHỦ ĐỀ)
           ===================================================================== */
        <HskCurriculumView onOpenLesson={handleLessonAction} />
      )}
    </div>
  );
};
