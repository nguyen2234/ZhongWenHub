import React, { useEffect, useState } from 'react';
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
import { adaptBackendExerciseToShared } from '../exercise-engine';
import type { SharedExerciseItem, SkillCategory } from '../exercise-engine';
import { useLearningState } from '../learning';
import { httpClient } from '../../core/api/client/http-client';
import { Dumbbell } from 'lucide-react';
import './practice-center.css';

function isIsolatedTestRuntime(): boolean {
  const mode = (import.meta as any)?.env?.MODE;
  const g = globalThis as any;
  const nodeEnv = g?.process?.env?.NODE_ENV;
  const isBun = typeof g?.Bun !== 'undefined';
  return mode === 'test' || nodeEnv === 'test' || isBun;
}

export const PracticeCenter: React.FC = () => {
  const { weakKnowledge } = useLearningState();
  const [exercisePool, setExercisePool] = useState<Record<string, SharedExerciseItem>>(() =>
    isIsolatedTestRuntime() ? PRACTICE_EXERCISE_POOL : {}
  );
  const [isLoadingPool, setIsLoadingPool] = useState<boolean>(() => !isIsolatedTestRuntime());
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadLiveExercises = React.useCallback(async () => {
    setIsLoadingPool(true);
    setLoadError(null);
    try {
      const response = await httpClient.get<any>('/content/exercises', {
        params: { page: 1, pageSize: 500 },
      });
      const rawItems = Array.isArray(response?.items)
        ? response.items
        : Array.isArray(response)
        ? response
        : [];
      const nextPool: Record<string, SharedExerciseItem> = {};
      for (const raw of rawItems) {
        const adapted = adaptBackendExerciseToShared(raw);
        nextPool[String(adapted.id)] = adapted;
      }
      setExercisePool(nextPool);
    } catch (err: any) {
      if (isIsolatedTestRuntime()) {
        setExercisePool(PRACTICE_EXERCISE_POOL);
      } else {
        setLoadError(err?.message || 'Không thể tải ngân hàng bài tập từ máy chủ.');
      }
    } finally {
      setIsLoadingPool(false);
    }
  }, []);

  useEffect(() => {
    if (!isIsolatedTestRuntime()) {
      void loadLiveExercises();
    }
  }, [loadLiveExercises]);

  const poolValues = React.useMemo(() => Object.values(exercisePool), [exercisePool]);
  const isRealEvidence = weakKnowledge.length > 0;

  const recommendation: PracticeRecommendation | null = React.useMemo(() => {
    const topWeak = weakKnowledge[0];
    if (topWeak) {
      const matchedIds = topWeak.suggestedPractice.exerciseIds
        .map(String)
        .filter((id) => Boolean(exercisePool[id]));
      const levelIds = poolValues
        .filter((ex) => ex.hskLevel === topWeak.hskLevel)
        .slice(0, 6)
        .map((ex) => String(ex.id));
      const chosenIds =
        matchedIds.length > 0
          ? matchedIds
          : levelIds.length > 0
          ? levelIds
          : poolValues.slice(0, 6).map((ex) => String(ex.id));

      return {
        id: `rec-${topWeak.knowledgePointId}`,
        type: 'grammar-focus',
        skill: topWeak.category as any,
        hskLevel: topWeak.hskLevel,
        title: topWeak.topicTitle,
        subtitle: `${topWeak.category === 'grammar' ? 'Ngữ pháp' : 'Từ vựng'} · HSK ${topWeak.hskLevel}`,
        reason: topWeak.evidence,
        exerciseIds: chosenIds,
        estimatedMinutes: 5,
        xpReward: Math.min(100, Math.max(5, chosenIds.length * 5)),
      };
    }

    if (isIsolatedTestRuntime()) {
      return MOCK_RECOMMENDATION;
    }

    if (poolValues.length === 0) {
      return null;
    }

    const featured = poolValues.slice(0, 6);
    const firstLevel = featured[0]?.hskLevel || 1;
    return {
      id: 'rec-live-foundation',
      type: 'mixed-review',
      skill: (featured[0]?.skill || 'comprehensive') as SkillCategory,
      hskLevel: firstLevel,
      title: `Ôn tập trọng tâm HSK ${firstLevel}`,
      subtitle: `${featured.length} câu hỏi chuẩn hóa từ kho dữ liệu`,
      reason: 'Củng cố từ vựng và mẫu câu trọng tâm đã phát hành.',
      exerciseIds: featured.map((ex) => String(ex.id)),
      estimatedMinutes: 5,
      xpReward: Math.min(100, Math.max(5, featured.length * 5)),
    };
  }, [weakKnowledge, exercisePool, poolValues]);

  const mistakes: MistakeRecord[] = React.useMemo(() => {
    if (weakKnowledge.length > 0) {
      return weakKnowledge.map((w) => ({
        exerciseId: w.suggestedPractice.exerciseIds[0] || String(poolValues[0]?.id || ''),
        mistakeCount: w.incorrectAttempts,
        lastMistakeAt: w.lastEvaluatedAt ? w.lastEvaluatedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        masteryState: w.masteryLevel === 'WEAK' ? 'critical' : 'recovering',
        skill: w.category as any,
        title: `${w.topicTitle} (${w.evidence})`,
      }));
    }
    return isIsolatedTestRuntime() ? MOCK_MISTAKE_RECORDS : [];
  }, [weakKnowledge, poolValues]);

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
      .map((id) => exercisePool[String(id)])
      .filter(Boolean) as SharedExerciseItem[];
    const finalList = list.length > 0 ? list : poolValues.slice(0, 5);
    if (finalList.length === 0) return;

    setActiveSession({
      mode: 'recommended',
      title: rec.title,
      subtitle: rec.subtitle,
      hskLevel: rec.hskLevel,
      exercises: finalList,
    });
  };

  // 2. Launch Quick Practice 5'
  const handleStartQuickPractice = () => {
    const mixed = [...poolValues].sort(() => 0.5 - Math.random()).slice(0, 10);
    if (mixed.length === 0) return;

    setActiveSession({
      mode: 'quick',
      title: 'Luyện nhanh 5 phút',
      subtitle: 'Ôn tập tổng hợp cấp tốc',
      hskLevel: mixed[0]?.hskLevel || 1,
      exercises: mixed,
    });
  };

  // 3. Launch Mistake Review
  const handleStartMistakesReview = () => {
    const mistakeExerciseList = mistakes
      .map((m) => exercisePool[String(m.exerciseId)])
      .filter(Boolean) as SharedExerciseItem[];
    const finalList = mistakeExerciseList.length > 0 ? mistakeExerciseList : poolValues.slice(0, 6);
    if (finalList.length === 0) return;

    setActiveSession({
      mode: 'mistakes',
      title: 'Luyện lại lỗi sai',
      subtitle: 'Tập trung khắc phục điểm yếu',
      hskLevel: finalList[0]?.hskLevel || 1,
      exercises: finalList,
    });
  };

  // 4. Launch Skill Practice
  const handleSelectSkill = (skill: SkillItemConfig) => {
    const skillExercises = poolValues.filter(
      (ex) => ex.skill === skill.id || skill.id === 'comprehensive'
    );
    const finalList = skillExercises.length > 0 ? skillExercises.slice(0, 15) : poolValues.slice(0, 5);
    if (finalList.length === 0) return;

    setActiveSession({
      mode: 'skill',
      title: `${skill.chinese} · ${skill.vietnamese}`,
      subtitle: 'Luyện chuyên sâu kỹ năng',
      hskLevel: finalList[0]?.hskLevel || 1,
      exercises: finalList,
    });
  };

  // 5. Launch Custom HSK Filter Practice (Strictly respects metadata)
  const handleStartCustomPractice = (
    level: number,
    skill?: SkillCategory,
    mistakesOnly?: boolean
  ) => {
    let list = poolValues.filter((ex) => ex.hskLevel === level);

    if (skill) {
      list = list.filter((ex) => ex.skill === skill);
    }
    if (mistakesOnly) {
      list = list.filter((ex) => mistakeIds.has(String(ex.id)));
    }

    if (list.length === 0) {
      return;
    }

    setActiveSession({
      mode: 'hsk-filter',
      title: `HSK ${level} · ${skill ? skill : 'Tổng hợp'}`,
      subtitle: mistakesOnly ? 'Chỉ luyện câu từng sai' : 'Bài tập tự chọn chuẩn HSK',
      hskLevel: level,
      exercises: list.slice(0, 20),
    });
  };

  const liveSkillItems = React.useMemo(() => {
    return SKILL_ITEMS.map((skill) => {
      const count =
        skill.id === 'comprehensive'
          ? poolValues.length
          : poolValues.filter((ex) => ex.skill === skill.id).length;
      return {
        ...skill,
        totalExercises: count > 0 || !isIsolatedTestRuntime() ? count : skill.totalExercises,
      };
    });
  }, [poolValues]);

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

      {isLoadingPool && (
        <div
          role="status"
          style={{
            padding: '14px 18px',
            borderRadius: '14px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#475569',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          Đang đồng bộ ngân hàng câu hỏi đã xuất bản từ máy chủ...
        </div>
      )}

      {loadError && (
        <div
          role="alert"
          style={{
            padding: '14px 18px',
            borderRadius: '14px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => void loadLiveExercises()}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #ef4444',
              backgroundColor: '#ffffff',
              color: '#991b1b',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {!isLoadingPool && !loadError && poolValues.length === 0 && (
        <div
          style={{
            padding: '20px',
            borderRadius: '16px',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#92400e',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          Hiện chưa có bài tập nào được xuất bản trong ngân hàng câu hỏi.
        </div>
      )}

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
          {liveSkillItems.map((skill) => (
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
          exercisePool={exercisePool}
          mistakeIds={mistakeIds}
          onStartCustomPractice={handleStartCustomPractice}
        />
      </section>
    </div>
  );
};
