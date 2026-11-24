import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Compass,
  Clock,
} from 'lucide-react';
import {
  aiLearningEngineService,
  type CompetencyProfile,
  type PersonalizedLearningPlanV2,
  type SkillCompetency,
} from '../services/ai-learning-engine.service';

const SKILL_COLOR_MAP: Record<string, string> = {
  vocabulary: '#4338ca', // Indigo
  grammar: '#be123c',    // Rose
  hanzi: '#d97706',      // Amber
  pinyin: '#8b5cf6',     // Violet
};

const MASTERY_TIER_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  NOT_ASSESSED: { label: 'Chưa đánh giá', color: '#64748b', bg: '#f1f5f9' },
  NOVICE: { label: 'Mới bắt đầu (<40%)', color: '#dc2626', bg: '#fef2f2' },
  EMERGING: { label: 'Đang hình thành (40-69%)', color: '#d97706', bg: '#fffbeb' },
  COMPETENT: { label: 'Thành thạo (70-84%)', color: '#2563eb', bg: '#eff6ff' },
  MASTERED: { label: 'Vững vàng (≥85%)', color: '#16a34a', bg: '#f0fdf4' },
};

interface CompetencyDashboardWidgetProps {
  onPlanLoaded?: (plan: PersonalizedLearningPlanV2) => void;
  className?: string;
}

export const CompetencyDashboardWidget: React.FC<CompetencyDashboardWidgetProps> = ({
  onPlanLoaded,
  className = '',
}) => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<CompetencyProfile | null>(null);
  const [plan, setPlan] = useState<PersonalizedLearningPlanV2 | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [explaining, setExplaining] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async (withAiExplain = false) => {
    try {
      if (withAiExplain) {
        setExplaining(true);
      } else {
        setLoading(true);
      }
      setErrorMsg(null);

      const [profileData, planData] = await Promise.all([
        aiLearningEngineService.getCompetencyProfile(),
        aiLearningEngineService.getRecommendationsV2(25, withAiExplain),
      ]);

      setProfile(profileData);
      setPlan(planData);
      if (onPlanLoaded) {
        onPlanLoaded(planData);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Không thể tải hồ sơ năng lực và đề xuất học tập AI.'
      );
    } finally {
      setLoading(false);
      setExplaining(false);
    }
  };

  useEffect(() => {
    void fetchData(false);
  }, []);

  // 1. Loading State
  if (loading) {
    return (
      <div
        data-testid="competency-loading-state"
        style={{
          padding: '40px',
          borderRadius: '20px',
          backgroundColor: 'var(--surface, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          textAlign: 'center',
          color: 'var(--muted, #64748b)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <RefreshCw size={28} className="animate-spin" style={{ color: '#4338ca' }} />
        <div style={{ fontWeight: 700, fontSize: '15px' }}>
          Đang tổng hợp hồ sơ năng lực và tính toán ma trận đề xuất V2...
        </div>
        <div style={{ fontSize: '12px', maxWidth: '420px', lineHeight: 1.5 }}>
          Thuật toán Bayesian Knowledge Tracing (BKT) đang phân tích lịch sử trả lời để lượng hóa độ thành thạo từng kỹ năng.
        </div>
      </div>
    );
  }

  // 2. Error State
  if (errorMsg) {
    return (
      <div
        data-testid="competency-error-state"
        role="alert"
        style={{
          padding: '24px',
          borderRadius: '16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
          <AlertTriangle size={18} />
          <span>Lỗi tải dữ liệu Hồ sơ năng lực</span>
        </div>
        <div style={{ fontSize: '13px' }}>{errorMsg}</div>
        <div>
          <button
            type="button"
            data-testid="competency-retry-button"
            onClick={() => void fetchData(false)}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={13} />
            <span>Thử lại</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Not Assessed / Empty State
  const isNotAssessed = !profile || profile.assessmentStatus === 'NOT_ASSESSED' || profile.totalEvaluations === 0;

  return (
    <div
      data-testid="competency-dashboard-widget"
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Overview Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          borderRadius: '20px',
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(30, 27, 75, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              marginBottom: '10px',
              letterSpacing: '0.5px',
            }}
          >
            <ShieldCheck size={14} />
            <span>BKT ENGINE · ĐO LƯỜNG NĂNG LỰC XÁC SUẤT</span>
          </div>

          <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: 800 }}>
            Hồ Sơ Năng Lực Học Viên & Đề Xuất Cá Nhân Hóa V2
          </h2>

          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, lineHeight: 1.5, maxWidth: '640px' }}>
            {isNotAssessed
              ? 'Học viên mới chưa có dữ liệu câu hỏi thực tế. Hãy bắt đầu học theo lộ trình HSK hoặc làm bài tập để hệ thống kích hoạt ma trận năng lực.'
              : profile?.estimatedHskLevel
              ? `Ước tính trình độ HSK ${profile.estimatedHskLevel} dựa trên ${profile.totalEvaluations} lượt làm bài với độ tin cậy thống kê ${Math.round(profile.confidenceScore * 100)}%.`
              : `Mục tiêu học viên chọn: HSK ${profile?.selectedHskLevel || 1}. Hệ thống đang thu thập thêm bằng chứng câu hỏi để xác định trình độ thực tế.`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            data-testid="competency-refresh-btn"
            onClick={() => void fetchData(false)}
            disabled={loading || explaining}
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Cập nhật</span>
          </button>

          <button
            type="button"
            data-testid="competency-explain-ai-btn"
            onClick={() => void fetchData(true)}
            disabled={loading || explaining}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
            }}
          >
            <Sparkles size={14} />
            <span>{explaining ? 'AI đang tư vấn...' : 'Tư vấn sư phạm AI'}</span>
          </button>
        </div>
      </div>

      {/* When Completely Not Assessed */}
      {isNotAssessed && (
        <div
          data-testid="competency-not-assessed-banner"
          style={{
            padding: '24px',
            borderRadius: '16px',
            backgroundColor: 'var(--surface, #ffffff)',
            border: '2px dashed var(--border, #cbd5e1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', maxWidth: '720px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Compass size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--foreground, #0f172a)' }}>
                Trạng thái: Chưa có dữ liệu đánh giá ban đầu
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted, #64748b)', marginTop: '4px', lineHeight: 1.5 }}>
                Học viên chưa có dữ liệu làm bài tập. Hãy bắt đầu học bài học đầu tiên trong lộ trình HSK để hệ thống ghi nhận và phân tích năng lực của bạn.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              data-testid="competency-start-diagnostic-btn"
              onClick={() => navigate('/diagnostic-assessment')}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#4338ca',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Làm bài khảo sát định vị trình độ (12 câu)</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              data-testid="competency-start-learning-path-btn"
              onClick={() => navigate('/learning-path')}
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <span>Hoặc bắt đầu học lộ trình HSK 1 ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* Profile Overview Stats */}
      {profile && !isNotAssessed && (
        <div
          data-testid="competency-stats-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
          }}
        >
          <div
            style={{
              padding: '18px 20px',
              borderRadius: '16px',
              backgroundColor: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--muted, #64748b)', fontWeight: 600 }}>Trình độ HSK</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#4338ca', marginTop: '6px' }}>
              {profile.estimatedHskLevel ? `Đánh giá: HSK ${profile.estimatedHskLevel}` : `Mục tiêu: HSK ${profile.selectedHskLevel}`}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted, #64748b)', marginTop: '4px' }}>
              {profile.estimatedHskLevel ? `Trạng thái: ${profile.assessmentStatus}` : 'Chưa đủ bằng chứng để xác định HSK thực tế'}
            </div>
          </div>

          <div
            style={{
              padding: '18px 20px',
              borderRadius: '16px',
              backgroundColor: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--muted, #64748b)', fontWeight: 600 }}>Độ tin cậy BKT</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
              {Math.round(profile.confidenceScore * 100)}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted, #64748b)', marginTop: '4px' }}>
              Dựa trên {profile.totalEvaluations} câu hỏi thực tế
            </div>
          </div>

          <div
            style={{
              padding: '18px 20px',
              borderRadius: '16px',
              backgroundColor: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--muted, #64748b)', fontWeight: 600 }}>Độ thành thạo trung bình</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563eb', marginTop: '6px' }}>
              {Math.round(profile.overallMasteryPercent)}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted, #64748b)', marginTop: '4px' }}>
              Trọng số theo độ tin cậy kỹ năng
            </div>
          </div>

          <div
            style={{
              padding: '18px 20px',
              borderRadius: '16px',
              backgroundColor: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--muted, #64748b)', fontWeight: 600 }}>Điểm mạnh nổi bật</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>
              {profile.topStrengths && profile.topStrengths.length > 0
                ? profile.topStrengths.slice(0, 2).join(', ')
                : 'Đang tích lũy'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted, #64748b)', marginTop: '4px' }}>
              Điểm thành thạo ≥ 85%
            </div>
          </div>
        </div>
      )}

      {/* Active Macro-Skills Grid */}
      {profile && (
        <div
          data-testid="competency-macro-skills-section"
          style={{
            padding: '22px',
            borderRadius: '18px',
            backgroundColor: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                Chi Tiết Kỹ Năng Ngôn Ngữ Trọng Tâm
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--muted, #64748b)' }}>
                Độ thành thạo được tính toán độc lập qua thuật toán Bayesian Knowledge Tracing.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '14px',
            }}
          >
            {profile.macroSkills
              .filter((s: SkillCompetency) => !['listening', 'speaking', 'reading', 'writing', 'legacy_retired'].includes(s.skillCategory))
              .map((skill: SkillCompetency) => {
                const tierInfo = MASTERY_TIER_LABELS[skill.masteryTier] || MASTERY_TIER_LABELS.NOT_ASSESSED;
                const skillColor = SKILL_COLOR_MAP[skill.skillCategory] || '#4338ca';

                return (
                  <div
                    key={skill.skillCategory}
                    data-testid={`skill-card-${skill.skillCategory}`}
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      backgroundColor: 'var(--background, #f8fafc)',
                      border: '1px solid var(--border, #e2e8f0)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: skillColor,
                            display: 'inline-block',
                          }}
                        />
                        <span style={{ fontWeight: 800, fontSize: '14px' }}>{skill.labelVi}</span>
                      </div>

                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: tierInfo.bg,
                          color: tierInfo.color,
                        }}
                      >
                        {tierInfo.label}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--muted, #64748b)' }}>Độ thành thạo</span>
                        <span style={{ fontWeight: 800, color: skillColor }}>{Math.round(skill.masteryPercent)}%</span>
                      </div>
                      <div
                        style={{
                          height: '6px',
                          borderRadius: '9999px',
                          backgroundColor: '#e2e8f0',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, Math.max(0, skill.masteryPercent))}%`,
                            height: '100%',
                            backgroundColor: skillColor,
                            borderRadius: '9999px',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted, #64748b)' }}>
                      <span>Làm bài: {skill.correctAttempts}/{skill.totalAttempts} câu</span>
                      <span>Độ tin cậy: {Math.round(skill.confidenceScore * 100)}%</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Top Weak Concepts Remediation */}
      {profile && profile.topWeakConcepts && profile.topWeakConcepts.length > 0 && (
        <div
          data-testid="competency-weak-concepts-section"
          style={{
            padding: '22px',
            borderRadius: '18px',
            backgroundColor: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#b91c1c' }}>
              Trọng Tâm Cần Củng Cố Ngay (BKT Identified Weak Points)
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--muted, #64748b)' }}>
              Các chủ đề/điểm ngữ pháp có tỷ lệ làm bài sai cao cần bài tập củng cố thích ứng.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {profile.topWeakConcepts.map((weak) => (
              <div
                key={weak.conceptCode}
                data-testid={`weak-concept-${weak.conceptCode}`}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                      }}
                    >
                      {weak.skillCategory.toUpperCase()}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '14px', color: '#991b1b' }}>
                      {weak.titleVi}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f1d1d', marginTop: '4px' }}>
                    {weak.evidenceVi}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(weak.recommendedActionRoute)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>Luyện tập củng cố</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Coaching Explanation (when generated) */}
      {plan?.usedLlmExplanation && plan?.aiCoachingExplanationVi && (
        <div
          data-testid="competency-ai-coaching-box"
          style={{
            padding: '18px 22px',
            borderRadius: '16px',
            backgroundColor: '#eef2ff',
            border: '1px solid #c7d2fe',
            color: '#1e1b4b',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} style={{ color: '#4338ca' }} />
            <span>Phân Tích & Lời Khuyên Sư Phạm Từ AI</span>
          </div>
          <div style={{ fontSize: '13px', lineHeight: 1.6 }}>{plan.aiCoachingExplanationVi}</div>
          {plan.aiFocusTipVi && (
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#3730a3' }}>
              🎯 Trọng tâm hôm nay: {plan.aiFocusTipVi}
            </div>
          )}
        </div>
      )}

      {/* Recommendation Engine V2 List */}
      {plan && plan.recommendations && plan.recommendations.length > 0 && (
        <div
          data-testid="competency-recommendations-section"
          style={{
            padding: '22px',
            borderRadius: '18px',
            backgroundColor: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
              Đề Xuất Học Tập V2 (Multi-factor Utility Ranking)
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--muted, #64748b)' }}>
              Được sắp xếp theo điểm hữu dụng sư phạm: ưu tiên chống quên SRS, khắc phục điểm yếu và bám sát khung HSK.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {plan.recommendations.map((rec) => (
              <div
                key={rec.id}
                data-testid={`rec-card-${rec.id}`}
                style={{
                  padding: '16px 20px',
                  borderRadius: '14px',
                  border: '1px solid var(--border, #e2e8f0)',
                  backgroundColor: 'var(--background, #f8fafc)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
              >
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(67, 56, 202, 0.1)',
                        color: '#4338ca',
                      }}
                    >
                      #{rec.priority} · Điểm hữu dụng: {Math.round(rec.utilityScore * 100)}%
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                      }}
                    >
                      {rec.badge}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--muted, #64748b)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={12} /> ~{rec.estimatedMinutes} phút
                    </span>
                  </div>

                  <div style={{ fontWeight: 800, fontSize: '15px', marginTop: '6px', color: 'var(--foreground, #0f172a)' }}>
                    {rec.title}
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--muted, #64748b)', marginTop: '4px', lineHeight: 1.4 }}>
                    {rec.reason}
                  </div>

                  {rec.pedagogicalGoalVi && (
                    <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', fontStyle: 'italic' }}>
                      Mục tiêu sư phạm: {rec.pedagogicalGoalVi}
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    data-testid={`rec-action-btn-${rec.id}`}
                    onClick={() => navigate(rec.destinationRoute)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: 'var(--primary, #4338ca)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(67, 56, 202, 0.25)',
                    }}
                  >
                    <span>{rec.actionLabel}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
