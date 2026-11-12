import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Dumbbell,
  History,
  Target,
  AlertCircle,
  Play,
  BookOpenCheck,
  RotateCcw,
  Layers,
  Award,
  ArrowRight,
  Clock,
} from 'lucide-react';
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
  PRACTICE_FORMATS,
  formatHskRangeSummary,
  getFormatAvailability,
  resolveDynamicHskLevels,
  type PracticeFormatDefinition,
} from './data/exerciseFormats';
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
  const [searchParams, setSearchParams] = useSearchParams();

  const [recommendationsMeta, setRecommendationsMeta] = useState<AdaptiveRecommendationsResponse | null>(null);
  const [historyItems, setHistoryItems] = useState<PracticeSessionHistoryItem[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState<boolean>(() => !isIsolatedTestRuntime());
  const [isStartingSession, setIsStartingSession] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSessionConfig | null>(null);
  const [selectedHskFilter, setSelectedHskFilter] = useState<number | null>(null);

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

  const dynamicHskLevels = useMemo(
    () =>
      resolveDynamicHskLevels(
        recommendationsMeta,
        isIsolatedTestRuntime() ? PRACTICE_EXERCISE_POOL : undefined
      ),
    [recommendationsMeta]
  );

  const formatCardsWithAvailability = useMemo(
    () =>
      PRACTICE_FORMATS.map((format) => ({
        format,
        availability: getFormatAvailability(
          format,
          recommendationsMeta,
          isIsolatedTestRuntime() ? PRACTICE_EXERCISE_POOL : undefined,
          selectedHskFilter
        ),
      })),
    [recommendationsMeta, selectedHskFilter]
  );

  const availableFormatsCount = useMemo(
    () => formatCardsWithAvailability.filter((item) => item.availability.isAvailable).length,
    [formatCardsWithAvailability]
  );

  const selectedTypeParam = (searchParams.get('type') || '').trim().toLowerCase();
  const selectedParamFormat = useMemo(
    () =>
      selectedTypeParam
        ? formatCardsWithAvailability.find((item) => item.format.type === selectedTypeParam)
        : undefined,
    [formatCardsWithAvailability, selectedTypeParam]
  );

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
    type?: string;
    questionCount?: number;
    prioritizeWeakness?: boolean;
  }) => {
    if (isIsolatedTestRuntime()) {
      const poolList = Object.values(PRACTICE_EXERCISE_POOL);
      const filtered = poolList.filter((ex) => {
        if (params.hskLevel && ex.hskLevel !== params.hskLevel) return false;
        if (params.skill && ex.skill !== params.skill) return false;
        if (params.type && ex.type !== params.type) return false;
        return true;
      });
      if (params.type && filtered.length === 0) {
        setLoadError('Chưa có câu hỏi khả dụng cho dạng bài này.');
        return;
      }
      const chosen = (filtered.length > 0 ? filtered : poolList).slice(0, params.questionCount || 5);
      setActiveSession({
        mode: params.mode,
        title: params.title,
        subtitle: params.subtitle,
        hskLevel: params.hskLevel || dynamicHskLevels[0] || 1,
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
        type: params.type,
        questionCount: params.questionCount ?? 10,
        mode: params.apiMode,
        prioritizeWeakness: params.prioritizeWeakness,
      });

      const adapted = session.questions.map(adaptPracticeQuestionToShared);
      setActiveSession({
        mode: params.mode,
        title: params.title,
        subtitle: params.subtitle,
        hskLevel: session.hskLevel || params.hskLevel || dynamicHskLevels[0] || 1,
        exercises: adapted,
        backendSessionId: session.sessionId,
      });
    } catch (err: any) {
      setLoadError(err?.message || 'Không thể khởi tạo phiên luyện tập.');
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleStartFormat = (format: PracticeFormatDefinition, isAvailable: boolean) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('type', format.type);
    setSearchParams(nextParams, { replace: true });

    if (!isAvailable) {
      return;
    }

    void startBackendSession({
      mode: 'hsk-filter',
      apiMode: 'random',
      type: format.type,
      hskLevel: selectedHskFilter ?? undefined,
      title: format.title,
      subtitle: selectedHskFilter
        ? `HSK ${selectedHskFilter} · Ngân hàng câu hỏi`
        : 'Ngân hàng câu hỏi chuẩn hóa',
      questionCount: 10,
    });
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
      {/* 1. Intro Hero Card + Real Stats */}
      <header className="practice-header practice-intro-card">
        <div className="practice-intro-content">
          <div className="practice-header-brand-badge">
            <Dumbbell size={13} />
            <span>BÀI TẬP LUYỆN TẬP · NGÂN HÀNG CÂU HỎI</span>
          </div>
          <h1 className="practice-header-title">
            Bài tập luyện tiếng Trung
          </h1>
          <p className="practice-header-subtitle">
            Rèn luyện phản xạ cấu trúc câu, điền từ ngữ cảnh và kỹ năng ngôn ngữ qua dữ liệu thật từ Ngân hàng câu hỏi — chấm điểm máy chủ &amp; tích lũy XP tự động.
          </p>
        </div>

        <div className="practice-intro-stats" aria-label="Thống kê nhanh kho bài tập">
          <div className="practice-stat-box">
            <div className="practice-stat-icon formats">
              <Layers size={18} />
            </div>
            <div>
              <div className="practice-stat-label">Dạng bài</div>
              <div className="practice-stat-value">
                {availableFormatsCount}/{PRACTICE_FORMATS.length} khả dụng
              </div>
              <div className="practice-stat-hint">
                {recommendationsMeta
                  ? `${recommendationsMeta.totalPublishedQuestions} câu đã xuất bản`
                  : isLoadingMeta
                    ? 'Đang đồng bộ...'
                    : 'Dữ liệu thực hành'}
              </div>
            </div>
          </div>

          <div className="practice-stat-box">
            <div className="practice-stat-icon levels">
              <Award size={18} />
            </div>
            <div>
              <div className="practice-stat-label">Cấp độ</div>
              <div className="practice-stat-value">
                {formatHskRangeSummary(dynamicHskLevels, isLoadingMeta)}
              </div>
              <div className="practice-stat-hint">
                {dynamicHskLevels.length > 0
                  ? `${dynamicHskLevels.length} cấp độ có câu hỏi`
                  : 'Cập nhật từ máy chủ'}
              </div>
            </div>
          </div>

          <div className="practice-stat-box">
            <div className="practice-stat-icon retry">
              <RotateCcw size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="practice-stat-label">Luyện lại</div>
              <div className="practice-stat-value">{mistakeCount} câu cần ôn</div>
              <button
                type="button"
                className="practice-stat-action-link"
                disabled={mistakeCount === 0}
                onClick={handleStartMistakesReview}
              >
                {mistakeCount > 0 ? 'Ôn lại lỗi sai →' : 'Chưa có lỗi sai'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dynamic HSK Level Filter Strip (populated strictly from backend) */}
      {dynamicHskLevels.length > 0 && (
        <section className="practice-level-strip" aria-label="Lọc nhanh theo cấp độ HSK khả dụng">
          <span className="practice-level-strip-label">Cấp độ áp dụng:</span>
          <div className="practice-level-pills">
            <button
              type="button"
              className={`practice-level-pill ${selectedHskFilter === null ? 'active' : ''}`}
              onClick={() => setSelectedHskFilter(null)}
            >
              Tất cả cấp độ
            </button>
            {dynamicHskLevels.map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`practice-level-pill ${selectedHskFilter === lvl ? 'active' : ''}`}
                onClick={() => setSelectedHskFilter(lvl)}
              >
                HSK {lvl}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Selected deep-link unavailable notice */}
      {selectedParamFormat && !isLoadingMeta && !selectedParamFormat.availability.isAvailable && (
        <div role="status" className="practice-unavailable-banner">
          <Clock size={18} />
          <div>
            <strong>{selectedParamFormat.format.title}:</strong>{' '}
            {selectedParamFormat.format.unavailableReason}
          </div>
        </div>
      )}

      {/* 2. 5-Card Exercise Formats Grid */}
      <section className="practice-formats-section" aria-label="Danh sách dạng bài tập luyện tiếng Trung">
        <div className="practice-section-header">
          <div>
            <h2 className="practice-section-title">Chọn dạng bài luyện tập</h2>
            <span className="practice-section-subtitle">
              Hiển thị trạng thái sẵn sàng thực tế từ Ngân hàng câu hỏi đã xuất bản
            </span>
          </div>
        </div>

        <div className="practice-formats-grid">
          {formatCardsWithAvailability.map(({ format, availability }) => {
            const isSelected = selectedTypeParam === format.type;
            return (
              <article
                key={format.type}
                data-format-type={format.type}
                data-available={availability.isAvailable ? 'true' : 'false'}
                className={`practice-format-card ${
                  availability.isAvailable ? 'available' : 'unavailable'
                } ${isSelected ? 'selected' : ''}`}
              >
                <div className="practice-format-card-top">
                  <span className="practice-format-order">{format.orderLabel}</span>
                  <span
                    className={`practice-format-status-badge ${
                      availability.isAvailable ? 'ready' : 'pending'
                    }`}
                  >
                    {availability.statusLabel}
                  </span>
                </div>

                <div className="practice-format-card-body">
                  <h3 className="practice-format-title">{format.title}</h3>
                  <p className="practice-format-desc">{format.description}</p>
                </div>

                <div className="practice-format-card-footer">
                  {availability.isAvailable ? (
                    <div className="practice-format-levels-row">
                      {availability.availableHskLevels.map((lvl) => (
                        <span key={lvl} className="practice-format-level-tag">
                          HSK {lvl}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="practice-format-unavailable-note">
                      {format.unavailableReason}
                    </p>
                  )}

                  <button
                    type="button"
                    className={`practice-format-start-btn ${
                      availability.isAvailable ? '' : 'disabled'
                    }`}
                    disabled={!availability.isAvailable || isStartingSession}
                    aria-label={
                      availability.isAvailable
                        ? `BẮT ĐẦU ${format.title}`
                        : `${format.title} - Chưa khả dụng`
                    }
                    onClick={() => handleStartFormat(format, availability.isAvailable)}
                  >
                    <span>{availability.isAvailable ? 'BẮT ĐẦU' : 'Chưa khả dụng'}</span>
                    {availability.isAvailable && <ArrowRight size={15} />}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="practice-section-header" style={{ marginTop: '4px' }}>
        <div>
          <h2 className="practice-section-title">Trung tâm luyện tập theo cấp độ &amp; kỹ năng</h2>
          <span className="practice-section-subtitle">
            Tạo phiên luyện tập thích ứng theo HSK, kỹ năng, độ khó và điểm yếu cá nhân
          </span>
        </div>
      </div>

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
          availableHskLevels={dynamicHskLevels}
          mistakeCount={mistakeCount}
          onStartCustomPractice={handleStartCustomPractice}
        />
      </section>

      {/* Student Skill / HSK / Grammar Analytics */}
      {((recommendationsMeta?.skillStats?.length ?? 0) > 0 ||
        (recommendationsMeta?.hskStats?.length ?? 0) > 0 ||
        (recommendationsMeta?.grammarStats?.length ?? 0) > 0) && (
        <section
          aria-label="Phân tích năng lực luyện tập"
          style={{
            padding: '18px',
            borderRadius: '18px',
            backgroundColor: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>
              Thống kê độ chính xác theo Kỹ năng · HSK · Ngữ pháp
            </div>
            <span style={{ fontSize: '12px', color: 'var(--muted, #64748b)' }}>
              Cập nhật trực tiếp từ lịch sử làm bài của bạn
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {[
              { title: 'Theo kỹ năng', items: recommendationsMeta?.skillStats || [] },
              { title: 'Theo cấp độ HSK', items: recommendationsMeta?.hskStats || [] },
              { title: 'Điểm ngữ pháp nổi bật', items: recommendationsMeta?.grammarStats || [] },
            ]
              .filter((g) => g.items.length > 0)
              .map((group) => (
                <div
                  key={group.title}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border, #e2e8f0)',
                    backgroundColor: 'var(--background, #f8fafc)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)' }}>
                    {group.title}
                  </div>
                  {group.items.slice(0, 5).map((b) => (
                    <div key={b.key} style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600 }}>{b.label}</span>
                        <span style={{ color: b.accuracy >= 75 ? '#16A34A' : b.accuracy >= 50 ? '#D97706' : '#DC2626', fontWeight: 700 }}>
                          {Math.round(b.accuracy)}% ({b.correctCount}/{b.totalAttempts})
                        </span>
                      </div>
                      <div style={{ height: '5px', borderRadius: '999px', backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, Math.max(4, Math.round(b.accuracy)))}%`,
                            height: '100%',
                            backgroundColor: b.accuracy >= 75 ? '#16A34A' : b.accuracy >= 50 ? '#F59E0B' : '#EF4444',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </section>
      )}

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
      {/* 5. Bottom Practice Guide Card */}
      <section className="practice-guide-card" aria-label="Hướng dẫn luyện tập">
        <div className="practice-guide-header">
          <div className="practice-guide-icon">
            <BookOpenCheck size={20} />
          </div>
          <div>
            <h2 className="practice-guide-title">Hướng dẫn luyện tập</h2>
            <p className="practice-guide-subtitle">
              Quy trình 4 bước giúp bạn tận dụng tối đa hệ thống chấm điểm chuẩn hóa và ôn tập lỗi sai
            </p>
          </div>
        </div>

        <div className="practice-guide-steps">
          <div className="practice-guide-step">
            <span className="practice-guide-step-num">01</span>
            <div>
              <div className="practice-guide-step-title">Chọn dạng bài &amp; cấp độ</div>
              <p className="practice-guide-step-desc">
                Nhấn <strong>BẮT ĐẦU</strong> ở dạng bài khả dụng hoặc lọc theo cấp độ HSK từ Ngân hàng câu hỏi.
              </p>
            </div>
          </div>

          <div className="practice-guide-step">
            <span className="practice-guide-step-num">02</span>
            <div>
              <div className="practice-guide-step-title">Hoàn thành từng câu hỏi</div>
              <p className="practice-guide-step-desc">
                Sắp xếp thẻ từ theo đúng trật tự câu hoặc điền đáp án chính xác vào chỗ trống.
              </p>
            </div>
          </div>

          <div className="practice-guide-step">
            <span className="practice-guide-step-num">03</span>
            <div>
              <div className="practice-guide-step-title">Chấm điểm máy chủ &amp; nhận XP</div>
              <p className="practice-guide-step-desc">
                Đáp án được đối chiếu trên máy chủ để xem giải thích chi tiết và cộng XP vào tiến độ học tập.
              </p>
            </div>
          </div>

          <div className="practice-guide-step">
            <span className="practice-guide-step-num">04</span>
            <div>
              <div className="practice-guide-step-title">Ôn lại các câu làm sai</div>
              <p className="practice-guide-step-desc">
                Sử dụng nút <strong>Luyện lại</strong> để làm lại các câu hay nhầm và lấp đầy lỗ hổng kiến thức.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
