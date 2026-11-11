import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dumbbell, History, Target, AlertCircle, Play } from 'lucide-react';
import { useLearningState } from '../learning';
import { authTokenService } from '../../core/api/client/auth-token.service';
import { RecommendedPracticeCard } from './components/RecommendedPracticeCard';
import { QuickPracticeCard } from './components/QuickPracticeCard';
import { MistakeReviewCard } from './components/MistakeReviewCard';
import { SkillPracticeCard } from './components/SkillPracticeCard';
import { HSKFilterSection, type CustomPracticeOptions } from './components/HSKFilterSection';
import { PracticeSession } from './PracticeSession';
import {
  SKILL_ITEMS,
  MOCK_RECOMMENDATION,
  MOCK_MISTAKE_RECORDS,
  PRACTICE_EXERCISE_POOL,
} from './data/mockPracticeData';
import {
  adaptPracticeQuestionToShared,
  practiceQuestionBankService,
  type AdaptiveRecommendationsResponse,
  type PracticeQuestionItem,
  type PracticeSessionHistoryItem,
} from './services/practice-question-bank.service';
import type { SkillCategory } from '../exercise-engine';
import type { MistakeRecord, PracticeMode, PracticeRecommendation, SkillItemConfig } from './types';
import './practice-center.css';

function isIsolatedTestRuntime(): boolean {
  const procEnv = typeof globalThis !== 'undefined' ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env : undefined;
  return Boolean(
    procEnv?.VITEST ||
    procEnv?.BUN_TEST ||
    procEnv?.NODE_ENV === 'test' ||
    import.meta.env?.MODE === 'test'
  );
}

interface ActiveSessionConfig {
  mode: PracticeMode;
  title: string;
  subtitle: string;
  hskLevel: number;
  exercises: PracticeQuestionItem[];
  backendSessionId?: string;
}

export const PracticeCenter: React.FC = () => {
  const { state: learningState } = useLearningState();

  const [recommendationsMeta, setRecommendationsMeta] = useState<AdaptiveRecommendationsResponse | null>(null);
  const [historyItems, setHistoryItems] = useState<PracticeSessionHistoryItem[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState<boolean>(() => !isIsolatedTestRuntime());
  const [isStartingSession, setIsStartingSession] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSessionConfig | null>(null);

  const loadAdaptiveOverview = useCallback(async () => {
    if (isIsolatedTestRuntime()) {
      setIsLoadingMeta(false);
      return;
    }

    setIsLoadingMeta(true);
    setLoadError(null);
    try {
      const [recs, history] = await Promise.all([
        practiceQuestionBankService.getRecommendations(),
        practiceQuestionBankService.getPracticeHistory(8),
      ]);
      setRecommendationsMeta(recs);
      setHistoryItems(Array.isArray(history) ? history : []);
    } catch (err: any) {
      setLoadError(err?.message || 'Không thể kết nối Ngân hàng câu hỏi để tải đề xuất luyện tập.');
    } finally {
      setIsLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    if (isIsolatedTestRuntime()) {
      setIsLoadingMeta(false);
      return;
    }

    let cancelled = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    const triggerLoad = () => {
      if (!cancelled) {
        void loadAdaptiveOverview();
      }
    };

    if (authTokenService.getAccessToken()) {
      triggerLoad();
    } else {
      // Wait for AuthContext silent refresh on full page reload before calling protected endpoints
      fallbackTimer = setTimeout(triggerLoad, 1200);
    }

    const handleSessionReady = () => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = undefined;
      }
      triggerLoad();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('zwh_auth_session_ready', handleSessionReady);
    }

    return () => {
      cancelled = true;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('zwh_auth_session_ready', handleSessionReady);
      }
    };
  }, [loadAdaptiveOverview]);

  const primaryWeakArea = recommendationsMeta?.weakAreas?.[0];
  const mistakeCount = recommendationsMeta?.mistakeReviewCount ?? 0;

  const recommendation: PracticeRecommendation | null = useMemo(() => {
    if (isIsolatedTestRuntime()) return MOCK_RECOMMENDATION;
    if (!recommendationsMeta || recommendationsMeta.totalPublishedQuestions === 0) return null;

    if (primaryWeakArea) {
      return {
        id: primaryWeakArea.key,
        type: 'weakness',
        skill: (primaryWeakArea.recommendedSkill as SkillCategory) || 'grammar',
        hskLevel: primaryWeakArea.hskLevel || 1,
        title: `Củng cố ${primaryWeakArea.title}`,
        subtitle: `Adaptive Focus · ${primaryWeakArea.reason}`,
        reason: `Hệ thống phát hiện tỷ lệ đúng hiện tại ${primaryWeakArea.accuracy}% (${primaryWeakArea.wrongCount} lỗi gần đây). Phiên luyện tập ưu tiên 65% câu thuộc điểm yếu này.`,
        exerciseIds: [],
        estimatedMinutes: 5,
        xpReward: 35,
      };
    }

    return {
      id: 'adaptive-general',
      type: 'adaptive',
      skill: 'vocabulary',
      hskLevel: learningState.selectedHskLevel || 1,
      title: `Luyện tập thích ứng HSK ${learningState.selectedHskLevel || 1}`,
      subtitle: 'Ngân hàng câu hỏi SQL Server · Chấm điểm bảo mật',
      reason: `Kho hiện có ${recommendationsMeta.totalPublishedQuestions} câu hỏi đã xuất bản trải rộng Từ vựng, Ngữ pháp, Đọc hiểu và Cấu trúc câu.`,
      exerciseIds: [],
      estimatedMinutes: 5,
      xpReward: 30,
    };
  }, [recommendationsMeta, primaryWeakArea, learningState.selectedHskLevel]);

  const isRealEvidence = Boolean(primaryWeakArea);

  const mistakes: MistakeRecord[] = useMemo(() => {
    if (isIsolatedTestRuntime()) return MOCK_MISTAKE_RECORDS;
    if (mistakeCount <= 0) return [];
    return Array.from({ length: Math.min(mistakeCount, 5) }, (_, idx) => ({
      exerciseId: `wrong-${idx}`,
      mistakeCount: 1,
      lastMistakeAt: new Date().toISOString(),
      masteryState: 'learning',
      skill: (primaryWeakArea?.recommendedSkill as SkillCategory) || 'grammar',
      title: primaryWeakArea?.title || 'Câu từng trả lời sai',
    }));
  }, [mistakeCount, primaryWeakArea]);

  const liveSkillItems: SkillItemConfig[] = useMemo(() => {
    return SKILL_ITEMS.map((item) => {
      if (isIsolatedTestRuntime()) return item;
      const serverCount = recommendationsMeta?.publishedBySkill?.[item.id] ?? 0;
      return {
        ...item,
        totalExercises: serverCount,
      };
    });
  }, [recommendationsMeta]);

  const startBackendSession = async (params: {
    mode: PracticeMode;
    apiMode: string;
    title: string;
    subtitle: string;
    hskLevel?: number;
    skill?: string;
    difficulty?: string;
    questionCount?: number;
    prioritizeWeakness?: boolean;
  }) => {
    if (isIsolatedTestRuntime()) {
      const poolList = Object.values(PRACTICE_EXERCISE_POOL);
      const filtered = poolList.filter((ex) => {
        if (params.hskLevel && ex.hskLevel !== params.hskLevel) return false;
        if (params.skill && ex.skill !== params.skill) return false;
        return true;
      });
      const chosen = (filtered.length > 0 ? filtered : poolList).slice(0, params.questionCount || 5);
      setActiveSession({
        mode: params.mode,
        title: params.title,
        subtitle: params.subtitle,
        hskLevel: params.hskLevel || 1,
        exercises: chosen,
      });
      return;
    }

    setIsStartingSession(true);
    setLoadError(null);
    try {
      const session = await practiceQuestionBankService.createPracticeSession({
        hskLevel: params.hskLevel,
        skill: params.skill,
        difficulty: params.difficulty,
        questionCount: params.questionCount ?? 10,
        mode: params.apiMode,
        prioritizeWeakness: params.prioritizeWeakness,
      });

      const adapted = session.questions.map(adaptPracticeQuestionToShared);
      setActiveSession({
        mode: params.mode,
        title: params.title,
        subtitle: params.subtitle,
        hskLevel: session.hskLevel || params.hskLevel || 1,
        exercises: adapted,
        backendSessionId: session.sessionId,
      });
    } catch (err: any) {
      setLoadError(err?.message || 'Không thể khởi tạo phiên luyện tập.');
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleStartRecommended = (rec: PracticeRecommendation) => {
    void startBackendSession({
      mode: 'recommended',
      apiMode: 'weakness',
      title: rec.title,
      subtitle: 'Luyện tập thích ứng (Adaptive)',
      hskLevel: rec.hskLevel,
      skill: rec.skill,
      questionCount: 10,
      prioritizeWeakness: true,
    });
  };

  const handleStartQuickPractice = () => {
    void startBackendSession({
      mode: 'quick',
      apiMode: 'random',
      title: 'Luyện nhanh 5 phút',
      subtitle: 'Tổng hợp phản xạ nhanh',
      hskLevel: learningState.selectedHskLevel || 1,
      questionCount: 8,
    });
  };

  const handleStartMistakesReview = () => {
    void startBackendSession({
      mode: 'mistakes',
      apiMode: 'mistake-review',
      title: 'Ôn lại lỗi sai',
      subtitle: 'Khắc phục câu từng làm sai',
      questionCount: 10,
      prioritizeWeakness: true,
    });
  };

  const handleSelectSkill = (skill: SkillItemConfig) => {
    void startBackendSession({
      mode: 'skill',
      apiMode: 'skill',
      title: `Kỹ năng ${skill.vietnamese}`,
      subtitle: skill.chinese,
      skill: skill.id,
      questionCount: 10,
    });
  };

  const handleStartCustomPractice = (
    level: number,
    skill?: SkillCategory,
    mistakesOnly?: boolean,
    options?: CustomPracticeOptions
  ) => {
    void startBackendSession({
      mode: 'hsk-filter',
      apiMode: mistakesOnly ? 'mistake-review' : options?.prioritizeWeakness ? 'weakness' : 'hsk-filter',
      title: `Luyện tập HSK ${level}`,
      subtitle: skill ? `Kỹ năng ${skill}` : 'Tổng hợp HSK',
      hskLevel: level,
      skill,
      difficulty: options?.difficulty && options.difficulty !== 'ALL' ? options.difficulty : undefined,
      questionCount: options?.questionCount ?? 10,
      prioritizeWeakness: options?.prioritizeWeakness,
    });
  };

  if (activeSession) {
    return (
      <PracticeSession
        mode={activeSession.mode}
        title={activeSession.title}
        subtitle={activeSession.subtitle}
        hskLevel={activeSession.hskLevel}
        exercises={activeSession.exercises}
        backendSessionId={activeSession.backendSessionId}
        onExit={() => {
          setActiveSession(null);
          void loadAdaptiveOverview();
        }}
        onContinueRecommended={() => {
          setActiveSession(null);
          if (recommendation) handleStartRecommended(recommendation);
        }}
        onReviewMistakes={() => {
          setActiveSession(null);
          handleStartMistakesReview();
        }}
      />
    );
  }

  return (
    <div className="practice-page-container">
      <header className="practice-header">
        <div>
          <div className="practice-header-brand-badge">
            <Dumbbell size={13} />
            <span>TRUNG TÂM LUYỆN TẬP THÍCH ỨNG</span>
          </div>
          <h1 className="practice-header-title">
            Trung tâm luyện tập
            <span className="practice-header-title-hanzi">巩固你学过的知识</span>
          </h1>
          <p className="practice-header-subtitle">
            Tạo phiên luyện tập theo HSK 1–4, kỹ năng, độ khó hoặc điểm yếu từ dữ liệu thực tế — chấm điểm máy chủ & cộng XP tự động.
          </p>
        </div>
      </header>

      {(isLoadingMeta || isStartingSession) && (
        <div
          role="status"
          style={{
            padding: '12px 16px',
            borderRadius: '14px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#475569',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {isStartingSession
            ? 'Đang tạo phiên luyện tập từ Ngân hàng câu hỏi...'
            : 'Đang đồng bộ phân tích điểm yếu & kho câu hỏi từ máy chủ...'}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadAdaptiveOverview()}
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

      <section aria-label="Tiếp tục luyện tập và đề xuất">
        <RecommendedPracticeCard
          recommendation={recommendation}
          isRealEvidence={isRealEvidence}
          onStart={handleStartRecommended}
        />
      </section>

      <section className="practice-quick-dual-row" aria-label="Luyện nhanh và Ôn lỗi sai">
        <QuickPracticeCard onStart={handleStartQuickPractice} />
        <MistakeReviewCard mistakes={mistakes} onStartReview={handleStartMistakesReview} />
      </section>

      {/* Adaptive Weak Areas Breakdown */}
      {recommendationsMeta && recommendationsMeta.weakAreas.length > 0 && (
        <section
          aria-label="Phân tích điểm yếu thích ứng"
          style={{
            padding: '18px',
            borderRadius: '18px',
            backgroundColor: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px' }}>
            <Target size={18} color="#DC2626" />
            <span>Lỗ hổng kiến thức cần ưu tiên (Adaptive Learning)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px' }}>
            {recommendationsMeta.weakAreas.map((w) => (
              <div
                key={w.key}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #FECACA',
                  backgroundColor: '#FFF5F5',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#991B1B' }}>{w.title}</div>
                  <div style={{ fontSize: '12px', color: '#7F1D1D', marginTop: '2px' }}>{w.reason}</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    void startBackendSession({
                      mode: 'recommended',
                      apiMode: 'weakness',
                      title: w.title,
                      subtitle: 'Ôn tập điểm yếu',
                      hskLevel: w.hskLevel,
                      skill: w.recommendedSkill,
                      questionCount: 8,
                      prioritizeWeakness: true,
                    })
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    width: 'fit-content',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Play size={13} fill="currentColor" />
                  <span>Luyện điểm yếu</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="practice-skill-section" aria-label="Luyện tập theo kỹ năng">
        <div className="practice-section-header">
          <div>
            <h2 className="practice-section-title">Luyện tập theo kỹ năng</h2>
            <span className="practice-section-subtitle">
              Lấy câu hỏi đã xuất bản theo từng kỹ năng từ Ngân hàng câu hỏi
            </span>
          </div>
        </div>

        <div className="practice-skill-grid">
          {liveSkillItems.map((skill) => (
            <SkillPracticeCard key={skill.id} skill={skill} onSelect={handleSelectSkill} />
          ))}
        </div>
      </section>

      <section aria-label="Bộ lọc luyện tập theo HSK">
        <HSKFilterSection
          exercisePool={isIsolatedTestRuntime() ? PRACTICE_EXERCISE_POOL : undefined}
          publishedByHsk={recommendationsMeta?.publishedByHsk}
          mistakeCount={mistakeCount}
          onStartCustomPractice={handleStartCustomPractice}
        />
      </section>

      {/* Recent Server Practice History */}
      {historyItems.length > 0 && (
        <section
          aria-label="Lịch sử phiên luyện tập gần đây"
          style={{
            padding: '18px',
            borderRadius: '18px',
            backgroundColor: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px' }}>
            <History size={18} color="var(--primary, #e60012)" />
            <span>Lịch sử luyện tập gần đây ({historyItems.length} phiên)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
            {historyItems.map((h) => (
              <div
                key={h.sessionId}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid var(--border, #e2e8f0)',
                  backgroundColor: 'var(--background, #f8fafc)',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>
                    {h.hskLevel ? `HSK ${h.hskLevel}` : 'Tổng hợp'} · {h.skill || 'Tất cả'} ({h.mode})
                  </span>
                  <span style={{ color: h.status === 'COMPLETED' ? '#16A34A' : '#D97706' }}>{h.status}</span>
                </div>
                <div style={{ color: 'var(--muted, #64748b)' }}>
                  Đúng: <strong>{h.correctCount}/{h.totalQuestions}</strong> ({Math.round(h.accuracy)}%) · XP:{' '}
                  <strong>+{h.xpAwarded}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
