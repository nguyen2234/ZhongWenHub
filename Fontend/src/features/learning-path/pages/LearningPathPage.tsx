import React, { useState, useMemo } from 'react';
import {
  Check,
  Lock,
  Play,
  RotateCcw,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  Target,
  Trophy,
  Sparkles,
  Compass,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  Card,
  ProgressBar,
  HSKLevel,
} from '../../../design-system';
import { useLearningState } from '../../learning';
import {
  HSK_CURRICULUM,
  findLessonMetadata,
  type CurriculumLesson,
} from '../../learning/data/curriculumData';
import { StudentSecondaryNav } from '../../../layouts/components/StudentSecondaryNav';
import { STUDENT_MAIN_NAV_ITEMS } from '../../../config/student-navigation.config';
import { BeginnerRoadmap } from '../components/BeginnerRoadmap';
import { BeginnerGuidanceSection } from '../components/BeginnerGuidanceSection';

export interface LearningPathProps {
  onOpenLesson?: (lessonId?: string | number) => void;
}

export const LearningPathPage: React.FC<LearningPathProps> = ({ onOpenLesson: customOpenLesson }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentMode = searchParams.get('mode') === 'hsk' ? 'hsk' : 'beginner';

  const handleModeChange = (mode: 'beginner' | 'hsk') => {
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev);
      nextParams.set('mode', mode);
      return nextParams;
    });
  };
  const {
    currentHskLevel,
    selectHskLevel,
    completedLessonIds,
    currentLessonId,
    startLesson,
    state: learningState,
  } = useLearningState();

  // Selected HSK level tab (defaults to student's current HSK level)
  const [selectedHSK, setSelectedHSK] = useState<number>(currentHskLevel || 2);

  // Unit collapsed/expanded state
  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>({
    1: false, // Unit 1 (completed) collapsed
    2: true,  // Unit 2 (active) expanded
    3: false,
    4: false,
  });

  const toggleUnitExpand = (unitId: number) => {
    setExpandedUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const handleLevelChange = (level: number) => {
    setSelectedHSK(level);
    selectHskLevel(level);
  };

  const handleLessonAction = (lessonId: string) => {
    startLesson(lessonId);
    if (customOpenLesson) {
      customOpenLesson(lessonId);
    } else {
      navigate(`/lesson?id=${lessonId}`);
    }
  };

  // 1. Compute HSK Levels List with dynamic completion
  const levelsList = useMemo(() => {
    return Object.values(HSK_CURRICULUM).map((lvl) => {
      let completedInLevel = 0;
      let totalLessonsInLevel = 0;

      lvl.units.forEach((u) => {
        totalLessonsInLevel += u.lessons.length;
        u.lessons.forEach((l) => {
          if (completedLessonIds.includes(l.id)) {
            completedInLevel++;
          }
        });
      });

      // For levels without all mock lessons built out, honor totalLessons baseline
      const totalLessons = lvl.totalLessons || totalLessonsInLevel || 10;
      let status: 'completed' | 'in_progress' | 'locked' = 'locked';

      if (lvl.level < currentHskLevel) {
        status = 'completed';
        completedInLevel = totalLessons;
      } else if (lvl.level === currentHskLevel) {
        status = 'in_progress';
      } else if (lvl.level === currentHskLevel + 1) {
        status = 'locked';
      } else {
        status = 'locked';
      }

      const progressPercent = Math.min(
        100,
        Math.round((completedInLevel / totalLessons) * 100)
      );

      return {
        ...lvl,
        completedLessons: completedInLevel,
        totalLessons,
        progressPercent,
        status,
      };
    });
  }, [completedLessonIds, currentHskLevel]);

  const currentLevelMeta = HSK_CURRICULUM[selectedHSK] || HSK_CURRICULUM[2];
  const selectedLevelStats = levelsList.find((l) => l.level === selectedHSK) || levelsList[1];

  // 2. Resolve Active / Next Hero Lesson
  const heroLesson: CurriculumLesson = useMemo(() => {
    // Check if currentLessonId is in this level
    const currentMeta = findLessonMetadata(currentLessonId);
    if (currentMeta && currentMeta.hskLevel === selectedHSK && !completedLessonIds.includes(currentMeta.id)) {
      return currentMeta;
    }

    // Look for first uncompleted lesson in this level
    for (const u of currentLevelMeta.units) {
      for (const l of u.lessons) {
        if (!completedLessonIds.includes(l.id)) {
          return l;
        }
      }
    }

    // Fallback to last lesson in level
    return currentLevelMeta.units[0]?.lessons[0] || {
      id: 'les-8',
      lessonNumber: 8,
      hskLevel: 2,
      unitNumber: 2,
      hanzi: '你想喝什么？',
      pinyin: 'Nǐ xiǎng hē shénme?',
      meaning: 'Bạn muốn uống gì?',
      summary: 'Học cách gọi đồ uống và sử dụng lượng từ 杯.',
      durationMinutes: 15,
      xpReward: 30,
      grammarPointIds: [],
      vocabularyIds: [],
    };
  }, [currentLessonId, selectedHSK, currentLevelMeta, completedLessonIds]);

  const beginnerTargetLesson = useMemo(() => {
    const hsk1Lessons = HSK_CURRICULUM[1]?.units.flatMap((u) => u.lessons) || [];
    const firstUncompleted = hsk1Lessons.find((l) => !completedLessonIds.includes(l.id));
    return firstUncompleted || hsk1Lessons[0] || null;
  }, [completedLessonIds]);

  const handleBeginnerHeroAction = () => {
    if (beginnerTargetLesson) {
      handleLessonAction(beginnerTargetLesson.id);
    }
  };

  const heroLessonProgress = learningState.lessonProgress[heroLesson.id];
  const heroLessonPercent = heroLessonProgress
    ? Math.min(100, Math.round(((heroLessonProgress.currentStepIndex + 1) / 6) * 100))
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Secondary Sub-navigation for Học HSK */}
      <StudentSecondaryNav
        title="Học HSK"
        items={STUDENT_MAIN_NAV_ITEMS.find((i) => i.id === 'learning-path')?.secondaryFeatures || []}
      />

      {/* =====================================================================
          MODE SWITCHER / SEGMENTED CONTROL: Người mới bắt đầu vs Lộ trình HSK
          ===================================================================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '5px',
          backgroundColor: '#f8fafc',
          borderRadius: '14px',
          border: '1.5px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', gap: '6px', flex: 1, minWidth: '280px' }}>
          <button
            type="button"
            onClick={() => handleModeChange('beginner')}
            style={{
              flex: 1,
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 700,
              backgroundColor: currentMode === 'beginner' ? '#ffffff' : 'transparent',
              color: currentMode === 'beginner' ? 'var(--primary, #E60012)' : '#64748b',
              boxShadow: currentMode === 'beginner' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Compass size={17} color={currentMode === 'beginner' ? 'var(--primary, #E60012)' : '#64748b'} />
            <span>Người mới bắt đầu (Từ con số 0)</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('hsk')}
            style={{
              flex: 1,
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 700,
              backgroundColor: currentMode === 'hsk' ? '#ffffff' : 'transparent',
              color: currentMode === 'hsk' ? 'var(--primary, #E60012)' : '#64748b',
              boxShadow: currentMode === 'hsk' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <BookOpen size={17} color={currentMode === 'hsk' ? 'var(--primary, #E60012)' : '#64748b'} />
            <span>Lộ trình HSK (Theo cấp độ 1 → 6)</span>
          </button>
        </div>
      </div>

      {currentMode === 'beginner' ? (
        <>
          {/* =====================================================================
              BEGINNER HERO BANNER: Bắt đầu học tiếng Trung từ con số 0
              ===================================================================== */}
          <section
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #E60012 0%, #B80010 100%)',
              padding: '36px 32px',
              color: '#ffffff',
              boxShadow: '0 12px 32px -4px rgba(230, 0, 18, 0.25)',
            }}
          >
            {/* Watermark Hanzi '学' */}
            <div
              style={{
                position: 'absolute',
                right: '30px',
                bottom: '-45px',
                fontFamily: '"Noto Serif SC", "PingFang SC", "Microsoft YaHei", serif',
                fontSize: '220px',
                fontWeight: 900,
                color: 'rgba(255, 255, 255, 0.12)',
                userSelect: 'none',
                pointerEvents: 'none',
                lineHeight: 1,
              }}
              aria-hidden="true"
            >
              学
            </div>

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(4px)',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginBottom: '14px',
                }}
              >
                <Sparkles size={14} />
                Lộ trình dành cho người mới bắt đầu
              </div>

              <h1
                style={{
                  fontSize: '32px',
                  fontWeight: 900,
                  lineHeight: 1.25,
                  margin: '0 0 12px',
                  letterSpacing: '-0.02em',
                }}
              >
                Bắt đầu học tiếng Trung từ con số 0
              </h1>

              <p
                style={{
                  fontSize: '15px',
                  lineHeight: 1.6,
                  color: 'rgba(255, 255, 255, 0.92)',
                  margin: '0 0 24px',
                }}
              >
                Hành trình 6 bước được thiết kế khoa học giúp bạn giải mã phát âm Pinyin, làm chủ 4 thanh điệu,
                viết đúng nét chữ Hán và tự tin giao tiếp các tình huống sinh hoạt cơ bản.
              </p>

              {/* Badges */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '26px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#ffffff',
                }}
              >
                <span>✓ 6 bước bài bản</span>
                <span>•</span>
                <span>✓ 150 từ vựng HSK 1</span>
                <span>•</span>
                <span>✓ Flashcard SRS thông minh</span>
                <span>•</span>
                <span>✓ 100% miễn phí</span>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {beginnerTargetLesson ? (
                  <button
                    type="button"
                    onClick={handleBeginnerHeroAction}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: '#ffffff',
                      color: 'var(--primary, #E60012)',
                      fontSize: '15px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    <Play size={16} fill="var(--primary, #E60012)" />
                    {completedLessonIds.length === 0
                      ? 'Bắt đầu học'
                      : `Tiếp tục học: Bài ${beginnerTargetLesson.lessonNumber} (${beginnerTargetLesson.hanzi})`}
                  </button>
                ) : (
                  <div
                    style={{
                      padding: '12px 20px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    Chưa có bài học được liên kết
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleModeChange('hsk')}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    border: '1.5px solid rgba(255, 255, 255, 0.6)',
                    backgroundColor: 'transparent',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  Xem lộ trình cấp độ HSK <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </section>

          {/* Visual 6-Step Roadmap */}
          <BeginnerRoadmap
            learningState={learningState}
            onOpenLesson={handleLessonAction}
          />

          {/* Guidance Section: Where to start today, 3 habits, EdTech guide */}
          <BeginnerGuidanceSection
            learningState={learningState}
            onOpenLesson={handleLessonAction}
          />
        </>
      ) : (
        <>
      {/* =====================================================================
          1. HSK 1 → HSK 7-9 PROGRESSION STEPPER (Thanh tiến trình liên hoàn)
          ===================================================================== */}
      <section
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: 'var(--space-4) var(--space-5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-3)',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--primary)',
              }}
            >
              Tiến trình chinh phục HSK
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              • Chọn cấp độ để xem chi tiết lộ trình
            </span>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--hsk2)' }}>
            Đang học: HSK {currentHskLevel} ({selectedLevelStats.progressPercent}%)
          </span>
        </div>

        {/* 7-Level Progression Stepper (HSK 1 to HSK 7–9) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: 'var(--space-2)',
            position: 'relative',
          }}
        >
          {levelsList.map((lvl) => {
            const isSelected = selectedHSK === lvl.level;
            const isCompleted = lvl.status === 'completed';
            const isInProgress = lvl.status === 'in_progress';
            const isLocked = lvl.status === 'locked';

            let borderColor = 'var(--border-strong)';
            let bgColor = 'var(--background)';
            if (isSelected) {
              borderColor = 'var(--primary)';
              bgColor = 'var(--primary-light)';
            } else if (isCompleted) {
              borderColor = 'var(--success-border)';
              bgColor = 'var(--success-bg)';
            }

            return (
              <button
                key={lvl.level}
                type="button"
                onClick={() => handleLevelChange(lvl.level)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: 'var(--space-2-5) var(--space-3)',
                  borderRadius: 'var(--radius-lg)',
                  border: `1.5px solid ${borderColor}`,
                  backgroundColor: bgColor,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  opacity: isLocked && !isSelected ? 0.75 : 1,
                  boxShadow: isSelected ? '0 2px 8px rgba(67, 56, 202, 0.15)' : 'none',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2px',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 700,
                      color: isCompleted
                        ? 'var(--success)'
                        : isInProgress
                        ? 'var(--hsk2)'
                        : 'var(--muted)',
                    }}
                  >
                    {lvl.name}
                  </span>
                  {isCompleted ? (
                    <Check size={14} style={{ color: 'var(--success)' }} />
                  ) : isInProgress ? (
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--hsk2)',
                      }}
                    />
                  ) : (
                    <Lock size={12} style={{ color: 'var(--muted)' }} />
                  )}
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%',
                  }}
                >
                  {lvl.vietnameseName}
                </div>

                <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
                  {isCompleted ? '100%' : `${lvl.progressPercent}%`}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          2. HERO CARD "TIẾP TỤC HỌC" (CTA QUAN TRỌNG NHẤT Ở ĐẦU TRANG)
          ===================================================================== */}
      <section
        style={{
          padding: 'var(--space-5) var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--surface)',
          border: '2px solid var(--primary)',
          boxShadow: '0 4px 16px rgba(67, 56, 202, 0.1)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-2)',
            }}
          >
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
              }}
            >
              BÀI TIẾP THEO CẦN HỌC
            </span>
            <HSKLevel level={(heroLesson.hskLevel >= 7 ? '7-9' : heroLesson.hskLevel) as 1 | 2 | 3 | 4 | 5 | 6 | '7-9'} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Unit {heroLesson.unitNumber} • Bài {heroLesson.lessonNumber} ({heroLessonPercent}%)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
            <h2
              style={{
                fontFamily: 'var(--font-hanzi)',
                fontSize: 'var(--hanzi-display-sm)',
                fontWeight: 700,
                margin: 0,
                color: 'var(--foreground)',
                lineHeight: 1.2,
              }}
            >
              {heroLesson.hanzi}
            </h2>
            <span style={{ fontSize: 'var(--text-base)', color: 'var(--primary)', fontWeight: 600 }}>
              {heroLesson.pinyin}
            </span>
          </div>

          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: 'var(--text-sm)',
              color: 'var(--muted)',
              fontStyle: 'italic',
            }}
          >
            &quot;{heroLesson.meaning}&quot; • {heroLesson.summary}
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
              marginTop: 'var(--space-3)',
              fontSize: 'var(--text-xs)',
              color: 'var(--muted)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} /> {heroLesson.durationMinutes} phút
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--xp)',
                fontWeight: 600,
              }}
            >
              <Award size={14} /> +{heroLesson.xpReward} XP khi hoàn thành
            </span>
          </div>
        </div>

        {/* CTA Button Tiếp tục học */}
        <Button
          variant="primary"
          icon={<Play size={18} fill="currentColor" />}
          style={{
            minHeight: '48px',
            padding: '0 var(--space-6)',
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(67, 56, 202, 0.3)',
          }}
          onClick={() => handleLessonAction(heroLesson.id)}
        >
          TIẾP TỤC HỌC BÀI {heroLesson.lessonNumber} ➜
        </Button>
      </section>

      {/* =====================================================================
          3. MAIN LAYOUT (65% Dòng chảy Lộ trình Unit/Lesson / 35% Cột phụ gọn)
          ===================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-6)',
          alignItems: 'start',
        }}
      >
        {/* ===================================================================
            CỘT CHÍNH (65%): DÒNG CHẢY UNIT VÀ LESSONS THEO CHẶNG
            =================================================================== */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-5)',
            gridColumn: 'span 2',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 700,
                margin: 0,
                color: 'var(--foreground)',
              }}
            >
              Danh sách các Unit trong HSK {selectedHSK}
            </h3>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Đã hoàn thành {selectedLevelStats.completedLessons}/{selectedLevelStats.totalLessons} bài học
            </span>
          </div>

          {/* Render Units List */}
          {currentLevelMeta.units.map((unit, unitIdx) => {
            const isExpanded = expandedUnits[unit.id] ?? (unitIdx === 0 || unitIdx === 1);

            // Determine unit completion based on actual completed lessons
            const unitLessonCount = unit.lessons.length;
            const unitCompletedCount = unit.lessons.filter((l) =>
              completedLessonIds.includes(l.id)
            ).length;
            const isUnitCompleted = unitCompletedCount === unitLessonCount && unitLessonCount > 0;
            const isUnitInProgress = unitCompletedCount > 0 && !isUnitCompleted;
            const isUnitLocked = unitCompletedCount === 0 && unitIdx > 1;

            let unitBorder = '1px solid var(--border)';
            let unitBadgeBg = 'var(--neutral-bg)';
            let unitBadgeColor = 'var(--muted)';

            if (isUnitInProgress) {
              unitBorder = '1.5px solid var(--hsk2-border)';
              unitBadgeBg = 'var(--hsk2-bg)';
              unitBadgeColor = 'var(--hsk2)';
            } else if (isUnitCompleted) {
              unitBorder = '1px solid var(--success-border)';
              unitBadgeBg = 'var(--success-bg)';
              unitBadgeColor = 'var(--success)';
            }

            return (
              <div
                key={unit.id}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-xl)',
                  border: unitBorder,
                  overflow: 'hidden',
                  opacity: isUnitLocked ? 0.75 : 1,
                  boxShadow: isUnitInProgress
                    ? '0 4px 16px rgba(13, 148, 136, 0.08)'
                    : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Unit Header Bar (Clickable to Expand/Collapse) */}
                <header
                  onClick={() => toggleUnitExpand(unit.id)}
                  style={{
                    padding: 'var(--space-4) var(--space-5)',
                    backgroundColor: isUnitInProgress
                      ? 'var(--surface)'
                      : isUnitCompleted
                      ? 'rgba(236, 253, 245, 0.4)'
                      : 'var(--background)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    cursor: 'pointer',
                    borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {/* Unit Number Badge */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: unitBadgeBg,
                        color: unitBadgeColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {isUnitCompleted ? (
                        <Check size={18} />
                      ) : isUnitLocked ? (
                        <Lock size={16} />
                      ) : (
                        `U${unit.unitNumber}`
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-hanzi)',
                            fontSize: 'var(--text-lg)',
                            fontWeight: 700,
                            color: 'var(--foreground)',
                          }}
                        >
                          {unit.hanziTitle}
                        </span>
                        <span
                          style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--primary)',
                            fontWeight: 600,
                          }}
                        >
                          {unit.pinyinTitle}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--muted)',
                          marginTop: '2px',
                        }}
                      >
                        Unit {unit.unitNumber}: {unit.vietnameseTitle} •{' '}
                        <strong>
                          {unitCompletedCount}/{unitLessonCount} Bài
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Right Status & Expand Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {isUnitCompleted ? (
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 700,
                          color: 'var(--success)',
                          backgroundColor: 'var(--success-bg)',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        ✓ Đã hoàn thành (100%)
                      </span>
                    ) : isUnitInProgress ? (
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 700,
                          color: 'var(--hsk2)',
                          backgroundColor: 'var(--hsk2-bg)',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        ▶ Đang học ({Math.round((unitCompletedCount / unitLessonCount) * 100)}%)
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Lock size={13} /> {unit.unlockCondition || 'Chưa mở khóa'}
                      </span>
                    )}

                    <button
                      type="button"
                      aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--muted)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </header>

                {/* Lessons List Body (when expanded) */}
                {isExpanded && (
                  <div
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                    }}
                  >
                    {unit.lessons.map((lesson, lessonIdx) => {
                      const isCompleted = completedLessonIds.includes(lesson.id);
                      const isCurrent = lesson.id === currentLessonId && !isCompleted;

                      // Prerequisite rule: unlocked if previous lesson is completed or it's the first lesson
                      const prevLesson = lessonIdx > 0 ? unit.lessons[lessonIdx - 1] : null;
                      const isAvailable =
                        isCompleted ||
                        isCurrent ||
                        lesson.lessonNumber <= 8 ||
                        (prevLesson && completedLessonIds.includes(prevLesson.id)) ||
                        completedLessonIds.includes('les-8'); // Unit 2 unlocks Lesson 9 when Lesson 8 is completed

                      return (
                        <div
                          key={lesson.id}
                          style={{
                            padding: 'var(--space-3-5) var(--space-4)',
                            borderRadius: 'var(--radius-lg)',
                            border: isCurrent
                              ? '2px solid var(--primary)'
                              : '1px solid var(--border)',
                            backgroundColor: isCurrent
                              ? 'var(--primary-light)'
                              : isCompleted
                              ? 'var(--surface)'
                              : 'var(--background)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            position: 'relative',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {/* Left Info: Status icon + Lesson Number + Chinese hierarchy */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 'var(--space-3)',
                              flex: 1,
                              minWidth: '240px',
                            }}
                          >
                            {/* Status circle */}
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: isCompleted
                                  ? 'var(--success-bg)'
                                  : isCurrent
                                  ? 'var(--primary)'
                                  : 'var(--neutral-bg)',
                                color: isCompleted
                                  ? 'var(--success)'
                                  : isCurrent
                                  ? '#ffffff'
                                  : 'var(--muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 'var(--text-xs)',
                                fontWeight: 700,
                                flexShrink: 0,
                                marginTop: '2px',
                              }}
                            >
                              {isCompleted ? (
                                <Check size={16} />
                              ) : isCurrent ? (
                                <Play size={14} fill="currentColor" />
                              ) : (
                                <Lock size={14} />
                              )}
                            </div>

                            {/* Typography Hierarchy: 1. Chữ Hán -> 2. Pinyin -> 3. Nghĩa tiếng Việt */}
                            <div>
                              <div
                                style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  alignItems: 'baseline',
                                  gap: 'var(--space-2)',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 'var(--text-xs)',
                                    fontWeight: 700,
                                    color: 'var(--muted)',
                                  }}
                                >
                                  Bài {lesson.lessonNumber}:
                                </span>
                                <span
                                  style={{
                                    fontFamily: 'var(--font-hanzi)',
                                    fontSize: 'var(--text-base)',
                                    fontWeight: 700,
                                    color: 'var(--foreground)',
                                    letterSpacing: '0.02em',
                                  }}
                                >
                                  {lesson.hanzi}
                                </span>
                                <span
                                  style={{
                                    fontSize: 'var(--text-sm)',
                                    fontWeight: 600,
                                    color: 'var(--primary)',
                                  }}
                                >
                                  {lesson.pinyin}
                                </span>
                              </div>

                              <div
                                style={{
                                  fontSize: 'var(--text-xs)',
                                  color: 'var(--foreground)',
                                  fontWeight: 500,
                                  marginTop: '2px',
                                }}
                              >
                                &quot;{lesson.meaning}&quot;
                              </div>

                              <div
                                style={{
                                  fontSize: '11px',
                                  color: 'var(--muted)',
                                  marginTop: '2px',
                                }}
                              >
                                {lesson.summary}
                              </div>
                            </div>
                          </div>

                          {/* Right Controls: Duration, XP, Button CTA */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--space-3)',
                            }}
                          >
                            <div
                              style={{
                                textAlign: 'right',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 'var(--text-xs)',
                                  color: 'var(--muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  gap: '4px',
                                }}
                              >
                                <Clock size={12} /> {lesson.durationMinutes} phút
                              </span>
                              <span
                                style={{
                                  fontSize: 'var(--text-xs)',
                                  fontWeight: 700,
                                  color: 'var(--xp)',
                                }}
                              >
                                +{lesson.xpReward} XP
                              </span>
                            </div>

                            {isCurrent ? (
                              <Button
                                variant="primary"
                                icon={<Play size={14} fill="currentColor" />}
                                onClick={() => handleLessonAction(lesson.id)}
                              >
                                Học tiếp
                              </Button>
                            ) : isCompleted ? (
                              <Button
                                variant="outline"
                                icon={<RotateCcw size={14} />}
                                onClick={() => handleLessonAction(lesson.id)}
                              >
                                Ôn lại
                              </Button>
                            ) : isAvailable ? (
                              <Button
                                variant="secondary"
                                icon={<Play size={14} fill="currentColor" />}
                                onClick={() => handleLessonAction(lesson.id)}
                              >
                                Bắt đầu
                              </Button>
                            ) : (
                              <Button variant="secondary" disabled icon={<Lock size={14} />}>
                                Khóa
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ===================================================================
            CỘT PHẢI (35%): TIẾN ĐỘ HSK, MILESTONE & THÔNG TIN MỞ KHÓA
            =================================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Card 1: Tổng quan tiến độ HSK hiện tại */}
          <Card
            title={`Tiến độ ${currentLevelMeta.name} (${currentLevelMeta.vietnameseName})`}
            icon={<Target size={18} />}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 'var(--text-xs)',
                    marginBottom: '4px',
                  }}
                >
                  <span style={{ color: 'var(--muted)' }}>Tiến độ hoàn thành:</span>
                  <span style={{ fontWeight: 700, color: 'var(--hsk2)' }}>
                    {selectedLevelStats.completedLessons} / {selectedLevelStats.totalLessons} Bài (
                    {selectedLevelStats.progressPercent}%)
                  </span>
                </div>
                <ProgressBar
                  value={selectedLevelStats.progressPercent}
                  variant="primary"
                  showPercentage={false}
                />
              </div>

              <div
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--background)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <span style={{ color: 'var(--muted)' }}>Từ vựng đã học:</span>
                  <span style={{ fontWeight: 600 }}>
                    {selectedHSK === 1 ? '150/150' : '135/300'} từ
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <span style={{ color: 'var(--muted)' }}>Tổng thời lượng:</span>
                  <span style={{ fontWeight: 600 }}>
                    {selectedLevelStats.completedLessons * 15} phút
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <span style={{ color: 'var(--muted)' }}>XP tích lũy từ HSK {selectedHSK}:</span>
                  <span style={{ fontWeight: 700, color: 'var(--xp)' }}>
                    +{selectedLevelStats.completedLessons * 25} XP
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Mốc phần thưởng Unit kế tiếp */}
          <div
            style={{
              padding: 'var(--space-5)',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--xp-bg)',
              border: '1px solid var(--xp-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Trophy size={20} style={{ color: 'var(--xp)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--xp)' }}>
                Mốc phần thưởng tiếp theo
              </span>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: 'var(--text-xs)',
                color: 'var(--foreground)',
                lineHeight: 1.5,
              }}
            >
              Hoàn thành <strong>Bài 8 trong Unit 2</strong> để nhận ngay <strong>+120 XP</strong> và
              mở khóa huy hiệu danh dự <em>&quot;Mua sắm sành sỏi&quot;</em>!
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginTop: '2px',
              }}
            >
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                Bài đã hoàn thành:
              </span>
              <span
                style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--xp)' }}
              >
                {completedLessonIds.length} bài
              </span>
            </div>
          </div>

          {/* Card 3: Điều kiện thăng hạng HSK 3 */}
          <Card title="Điều kiện mở khóa HSK 3" icon={<Lock size={16} />}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                fontSize: 'var(--text-xs)',
                color: 'var(--muted)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Check size={14} style={{ color: 'var(--success)' }} />
                <span>Hoàn thành trọn vẹn HSK 1 (150 từ vựng)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                {completedLessonIds.length >= 8 ? (
                  <Check size={14} style={{ color: 'var(--success)' }} />
                ) : (
                  <span
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: '2px solid var(--hsk2)',
                      display: 'inline-block',
                    }}
                  />
                )}
                <span>
                  Hoàn thành 18 bài học HSK 2 (Hiện tại:{' '}
                  {completedLessonIds.filter((id) => id.startsWith('les-')).length}/18)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Sparkles size={14} style={{ color: 'var(--primary)' }} />
                <span>Đạt bài thi thử HSK 2 tổng hợp từ 80%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export const LearningPath = LearningPathPage;
export default LearningPathPage;
