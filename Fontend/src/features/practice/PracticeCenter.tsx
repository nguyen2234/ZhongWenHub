import React, { useState } from 'react';
import type { PracticeRecommendation, MistakeRecord, SkillItemConfig, PracticeMode } from './types';
import {
  MOCK_RECOMMENDATION,
  MOCK_MISTAKE_RECORDS,
  SKILL_ITEMS,
  PRACTICE_EXERCISE_POOL,
} from './data/mockPracticeData';
import { RecommendedPracticeCard } from './components/RecommendedPracticeCard';
import { QuickPracticeCard } from './components/QuickPracticeCard';
import { MistakeReviewCard } from './components/MistakeReviewCard';
import { SkillPracticeCard } from './components/SkillPracticeCard';
import { HSKFilterSection } from './components/HSKFilterSection';
import { PracticeSession } from './PracticeSession';
import type { SharedExerciseItem, SkillCategory } from '../exercise-engine';

export const PracticeCenter: React.FC = () => {
  const [recommendation] = useState<PracticeRecommendation | null>(MOCK_RECOMMENDATION);
  const [mistakes] = useState<MistakeRecord[]>(MOCK_MISTAKE_RECORDS);

  // Active session state (null when in browse hub)
  const [activeSession, setActiveSession] = useState<{
    mode: PracticeMode;
    title: string;
    subtitle: string;
    hskLevel: number;
    exercises: SharedExerciseItem[];
  } | null>(null);

  // 1. Launch Recommended Practice
  const handleStartRecommended = (rec: PracticeRecommendation) => {
    const list = rec.exerciseIds
      .map((id) => PRACTICE_EXERCISE_POOL[id])
      .filter(Boolean) as SharedExerciseItem[];

    setActiveSession({
      mode: 'recommended',
      title: rec.title,
      subtitle: rec.subtitle,
      hskLevel: rec.hskLevel,
      exercises: list.length > 0 ? list : Object.values(PRACTICE_EXERCISE_POOL).slice(0, 5),
    });
  };

  // 2. Launch Quick Practice 5'
  const handleStartQuickPractice = () => {
    // 10 mixed questions from pool
    const all = Object.values(PRACTICE_EXERCISE_POOL);
    const mixed = [...all].sort(() => 0.5 - Math.random()).slice(0, 10);

    setActiveSession({
      mode: 'quick',
      title: 'Luyện nhanh 5 phút',
      subtitle: 'Ôn tập tổng hợp cấp tốc',
      hskLevel: 2,
      exercises: mixed,
    });
  };

  // 3. Launch Mistake Review
  const handleStartMistakesReview = () => {
    const mistakeExerciseList = mistakes
      .map((m) => PRACTICE_EXERCISE_POOL[m.exerciseId])
      .filter(Boolean) as SharedExerciseItem[];

    setActiveSession({
      mode: 'mistakes',
      title: 'Luyện lại lỗi sai',
      subtitle: 'Tập trung khắc phục điểm yếu',
      hskLevel: 2,
      exercises:
        mistakeExerciseList.length > 0
          ? mistakeExerciseList
          : Object.values(PRACTICE_EXERCISE_POOL).slice(0, 6),
    });
  };

  // 4. Launch Skill Practice
  const handleSelectSkill = (skill: SkillItemConfig) => {
    const skillExercises = Object.values(PRACTICE_EXERCISE_POOL).filter(
      (ex) => ex.skill === skill.id || skill.id === 'comprehensive'
    );

    setActiveSession({
      mode: 'skill',
      title: `${skill.chinese} · ${skill.vietnamese}`,
      subtitle: `Luyện chuyên sâu kỹ năng`,
      hskLevel: 2,
      exercises: skillExercises.length > 0 ? skillExercises : Object.values(PRACTICE_EXERCISE_POOL).slice(0, 5),
    });
  };

  // 5. Launch Custom HSK Filter Practice
  const handleStartCustomPractice = (
    level: number,
    skill?: SkillCategory,
    mistakesOnly?: boolean
  ) => {
    let list = Object.values(PRACTICE_EXERCISE_POOL);

    if (skill) {
      list = list.filter((ex) => ex.skill === skill);
    }
    if (mistakesOnly) {
      const mistakeIds = new Set(mistakes.map((m) => m.exerciseId));
      list = list.filter((ex) => mistakeIds.has(ex.id));
    }

    if (list.length === 0) {
      list = Object.values(PRACTICE_EXERCISE_POOL).slice(0, 4);
    }

    setActiveSession({
      mode: 'hsk-filter',
      title: `HSK ${level} · ${skill ? skill : 'Tổng hợp'}`,
      subtitle: mistakesOnly ? 'Chỉ luyện câu từng sai' : 'Bài tập tự chọn',
      hskLevel: level,
      exercises: list,
    });
  };

  // If a practice session is active, render purely the Focus Mode!
  if (activeSession) {
    return (
      <PracticeSession
        mode={activeSession.mode}
        title={activeSession.title}
        subtitle={activeSession.subtitle}
        hskLevel={activeSession.hskLevel}
        exercises={activeSession.exercises}
        onExit={() => setActiveSession(null)}
        onContinueRecommended={() => {
          if (recommendation) handleStartRecommended(recommendation);
        }}
        onReviewMistakes={() => handleStartMistakesReview()}
      />
    );
  }

  // =========================================================================
  // PRACTICE CENTER HOME (Targeted Action Hub - Mobile Stackable Layout)
  // =========================================================================
  return (
    <div
      style={{
        maxWidth: '1080px',
        margin: '0 auto',
        padding: 'var(--space-6) var(--space-4) 80px var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
      }}
    >
      {/* 1. Header (Clean, inspiring, no dashboard stats clutter) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 800,
              color: 'var(--foreground)',
              margin: 0,
              letterSpacing: '-0.3px',
            }}
          >
            Luyện tập
          </h1>
          <span
            style={{
              fontFamily: 'var(--font-hanzi)',
              fontSize: 'var(--text-lg)',
              color: 'var(--primary)',
              fontWeight: 700,
            }}
          >
            巩固你学过的知识
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
          &quot;Củng cố những gì bạn đã học&quot; · Chủ động rèn luyện phản xạ, ngữ pháp và khắc phục các câu từng làm sai.
        </p>
      </div>

      {/* 2. Primary Hero Section: "Đề xuất cho bạn" (Top #1 CTA Priority) */}
      <section aria-label="Đề xuất cho bạn">
        <RecommendedPracticeCard
          recommendation={recommendation}
          onStart={handleStartRecommended}
        />
      </section>

      {/* 3. Fast Action Row: Quick Practice (5 min) & Mistake Review */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-4)',
        }}
        aria-label="Luyện nhanh và Lỗi sai"
      >
        <QuickPracticeCard onStart={handleStartQuickPractice} />
        <MistakeReviewCard
          mistakes={mistakes}
          onStartReview={handleStartMistakesReview}
        />
      </section>

      {/* 4. Skill Practice Grid (6 categories: 词汇, 语法, 听力, 阅读, 句子, 综合) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }} aria-label="Luyện tập theo kỹ năng">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--foreground)' }}>
              Luyện tập theo kỹ năng
            </h3>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Rèn giũa từng kỹ năng cụ thể với độ thành thạo đo lường theo thời gian thực
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 'var(--space-3)',
          }}
        >
          {SKILL_ITEMS.map((skill) => (
            <SkillPracticeCard
              key={skill.id}
              skill={skill}
              onSelect={handleSelectSkill}
            />
          ))}
        </div>
      </section>

      {/* 5. Practice By HSK & Lesson Filters */}
      <section aria-label="Lọc theo HSK">
        <HSKFilterSection onStartCustomPractice={handleStartCustomPractice} />
      </section>
    </div>
  );
};
