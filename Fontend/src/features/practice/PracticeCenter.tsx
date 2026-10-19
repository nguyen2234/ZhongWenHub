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
import { useLearningState } from '../learning';
import { Dumbbell } from 'lucide-react';
import './practice-center.css';

export const PracticeCenter: React.FC = () => {
  const { weakKnowledge } = useLearningState();

  const isRealEvidence = weakKnowledge.length > 0;

  const recommendation: PracticeRecommendation = React.useMemo(() => {
    const topWeak = weakKnowledge[0];
    if (topWeak) {
      return {
        id: `rec-${topWeak.knowledgePointId}`,
        type: 'grammar-focus',
        skill: topWeak.category as any,
        hskLevel: topWeak.hskLevel,
        title: topWeak.topicTitle,
        subtitle: `${topWeak.category === 'grammar' ? 'Ngữ pháp' : 'Từ vựng'} · HSK ${topWeak.hskLevel}`,
        reason: topWeak.evidence,
        exerciseIds: topWeak.suggestedPractice.exerciseIds.length > 0
          ? topWeak.suggestedPractice.exerciseIds
          : ['ex-p1', 'ex-p2', 'ex-p3'],
        estimatedMinutes: 5,
        xpReward: 20,
      };
    }
    return MOCK_RECOMMENDATION;
  }, [weakKnowledge]);

  const mistakes: MistakeRecord[] = React.useMemo(() => {
    if (weakKnowledge.length > 0) {
      return weakKnowledge.map((w) => ({
        exerciseId: w.suggestedPractice.exerciseIds[0] || 'ex-p1',
        mistakeCount: w.incorrectAttempts,
        lastMistakeAt: w.lastEvaluatedAt ? w.lastEvaluatedAt.slice(0, 10) : '2026-10-16',
        masteryState: w.masteryLevel === 'WEAK' ? 'critical' : 'recovering',
        skill: w.category as any,
        title: `${w.topicTitle} (${w.evidence})`,
      }));
    }
    return MOCK_MISTAKE_RECORDS;
  }, [weakKnowledge]);

  const mistakeIds = React.useMemo(() => {
    return new Set(mistakes.map((m) => String(m.exerciseId)));
  }, [mistakes]);

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
      subtitle: 'Luyện chuyên sâu kỹ năng',
      hskLevel: 2,
      exercises: skillExercises.length > 0 ? skillExercises : Object.values(PRACTICE_EXERCISE_POOL).slice(0, 5),
    });
  };

  // 5. Launch Custom HSK Filter Practice (Strictly respects metadata)
  const handleStartCustomPractice = (
    level: number,
    skill?: SkillCategory,
    mistakesOnly?: boolean
  ) => {
    let list = Object.values(PRACTICE_EXERCISE_POOL).filter((ex) => ex.hskLevel === level);

    if (skill) {
      list = list.filter((ex) => ex.skill === skill);
    }
    if (mistakesOnly) {
      list = list.filter((ex) => mistakeIds.has(String(ex.id)));
    }

    if (list.length === 0) {
      // Do not substitute false-level questions
      return;
    }

    setActiveSession({
      mode: 'hsk-filter',
      title: `HSK ${level} · ${skill ? skill : 'Tổng hợp'}`,
      subtitle: mistakesOnly ? 'Chỉ luyện câu từng sai' : 'Bài tập tự chọn chuẩn HSK',
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
  // PRACTICE CENTER HOME (Option A: Action-Driven Cascade)
  // =========================================================================
  return (
    <div className="practice-page-container">
      {/* 1. Header (Clean, inspiring, no tall banner) */}
      <header className="practice-header">
        <div>
          <div className="practice-header-brand-badge">
            <Dumbbell size={13} />
            <span>TRUNG TÂM LUYỆN TẬP PHẢN XẠ</span>
          </div>
          <h1 className="practice-header-title">
            Trung tâm luyện tập
            <span className="practice-header-title-hanzi">巩固你学过的知识</span>
          </h1>
          <p className="practice-header-subtitle">
            Củng cố kiến thức đã học, rèn luyện phản xạ ngôn ngữ và khắc phục triệt để các câu từng làm sai theo chu trình lặp lại ngắt quãng.
          </p>
        </div>
      </header>

      {/* 2. Primary Hero Section: "Đề xuất cho bạn" (Top #1 CTA Priority) */}
      <section aria-label="Tiếp tục luyện tập và đề xuất">
        <RecommendedPracticeCard
          recommendation={recommendation}
          isRealEvidence={isRealEvidence}
          onStart={handleStartRecommended}
        />
      </section>

      {/* 3. Fast Action Row: Quick Practice (5 min) & Mistake Review */}
      <section className="practice-quick-dual-row" aria-label="Luyện nhanh và Ôn lỗi sai">
        <QuickPracticeCard onStart={handleStartQuickPractice} />
        <MistakeReviewCard
          mistakes={mistakes}
          onStartReview={handleStartMistakesReview}
        />
      </section>

      {/* 4. Skill Practice Grid (6 categories: 词汇, 语法, 听力, 阅读, 句子, 综合) */}
      <section className="practice-skill-section" aria-label="Luyện tập theo kỹ năng">
        <div className="practice-section-header">
          <div>
            <h2 className="practice-section-title">Luyện tập theo kỹ năng</h2>
            <span className="practice-section-subtitle">
              6 phân hệ rèn luyện chuyên biệt cho từng khía cạnh ngôn ngữ
            </span>
          </div>
        </div>

        <div className="practice-skill-grid">
          {SKILL_ITEMS.map((skill) => (
            <SkillPracticeCard
              key={skill.id}
              skill={skill}
              onSelect={handleSelectSkill}
            />
          ))}
        </div>
      </section>

      {/* 5. Practice By HSK & Custom Filters (Accurate metadata) */}
      <section aria-label="Bộ lọc luyện tập theo HSK">
        <HSKFilterSection
          exercisePool={PRACTICE_EXERCISE_POOL}
          mistakeIds={mistakeIds}
          onStartCustomPractice={handleStartCustomPractice}
        />
      </section>
    </div>
  );
};
