import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  Sparkles,
  MessageSquare,
  Wand2,
  BarChart3,
  ArrowRight,
  Flame,
  BookOpen,
  Clock,
} from 'lucide-react';
import { useAITutor } from '../../../ai-tutor';
import {
  aiLearningEngineService,
  type PersonalizedLearningPlan,
} from '../../services/ai-learning-engine.service';

export const StudentAIWorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const { openAITutor } = useAITutor();

  const [plan, setPlan] = useState<PersonalizedLearningPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [explaining, setExplaining] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadPlan = async (withAiExplain = false) => {
    try {
      if (withAiExplain) setExplaining(true);
      else setLoading(true);
      setErrorMsg(null);
      const data = await aiLearningEngineService.getPersonalizedPlan(withAiExplain);
      setPlan(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể tải lộ trình học tập cá nhân hóa.');
    } finally {
      setLoading(false);
      setExplaining(false);
    }
  };

  useEffect(() => {
    void loadPlan(false);
  }, []);

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '20px 16px 48px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Hero */}
      <div style={{ padding: '24px', borderRadius: '20px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'rgba(67, 56, 202, 0.12)', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BrainCircuit size={26} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>AI Learning Engine & Lộ Trình Cá Nhân Hóa</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
              Đề xuất học tập theo thuật toán SRS, điểm yếu bài tập và lịch sử tiến độ thực tế HSK 1–4.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={explaining || loading}
          onClick={() => void loadPlan(true)}
          style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', backgroundColor: '#4338ca', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Sparkles size={15} />
          <span>{explaining ? 'AI đang phân tích...' : 'Giải thích lộ trình bằng AI'}</span>
        </button>
      </div>

      {/* Quick AI Tools Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        <button
          type="button"
          onClick={() => openAITutor({ source: 'general', hskLevel: plan?.currentHskLevel || 1 }, 'Giải thích giúp em trọng tâm ngữ pháp và từ vựng cần chú ý hôm nay.')}
          style={{ textAlign: 'left', padding: '18px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <Sparkles size={20} color="#4338ca" />
          <div style={{ fontWeight: 800, fontSize: '15px' }}>Trợ giảng AI Tutor</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Giải thích từ vựng, ngữ pháp, Hanzi/Pinyin theo bài học đang mở.</div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/conversation')}
          style={{ textAlign: 'left', padding: '18px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <MessageSquare size={20} color="#047857" />
          <div style={{ fontWeight: 800, fontSize: '15px' }}>Phòng Hội Thoại AI</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Luyện hội thoại theo tình huống HSK 1–4, sửa lỗi & gợi ý câu tự nhiên.</div>
        </button>

        <button
          type="button"
          onClick={() => navigate(`/ai-exercises?hsk=${plan?.currentHskLevel || 1}`)}
          style={{ textAlign: 'left', padding: '18px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <Wand2 size={20} color="var(--primary)" />
          <div style={{ fontWeight: 800, fontSize: '15px' }}>Tạo Bài Tập AI</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>6 dạng bài tập chuẩn hóa từ từ vựng, ngữ pháp, bài đọc & lỗi sai.</div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/ai-analytics')}
          style={{ textAlign: 'left', padding: '18px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <BarChart3 size={20} color="#d97706" />
          <div style={{ fontWeight: 800, fontSize: '15px' }}>Phân Tích Điểm Yếu</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Thống kê 6 kỹ năng thực tế từ lịch sử bài tập & bài tập AI.</div>
        </button>
      </div>

      {errorMsg && (
        <div role="alert" style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          Đang tính toán lộ trình cá nhân hóa...
        </div>
      ) : plan && (
        <>
          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Flame size={14} /> Chuỗi ngày học</div>
              <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px' }}>{plan.streakDays} ngày</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><BookOpen size={14} /> Từ SRS đến hạn</div>
              <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: plan.dueSrsWordsCount > 0 ? '#d97706' : 'var(--foreground)' }}>{plan.dueSrsWordsCount} từ</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> 7 ngày qua</div>
              <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px' }}>{plan.totalStudyMinutesLast7Days} phút ({plan.activeDaysLast7Days} ngày)</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Độ chính xác bài tập</div>
              <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px' }}>{plan.overallAccuracyPercent}%</div>
            </div>
          </div>

          {plan.usedLlmExplanation && plan.aiCoachingExplanationVi && (
            <div style={{ padding: '16px 20px', borderRadius: '16px', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe', color: '#1e1b4b', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} />
                <span>Lời khuyên từ Cố vấn AI</span>
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.5 }}>{plan.aiCoachingExplanationVi}</div>
              {plan.aiFocusTipVi && <div style={{ fontSize: '12px', fontWeight: 700 }}>Mẹo ưu tiên: {plan.aiFocusTipVi}</div>}
            </div>
          )}

          {/* Recommendations */}
          <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Đề xuất học tập ưu tiên hôm nay (HSK {plan.currentHskLevel})</h2>
            {plan.recommendations.map((rec) => (
              <div key={rec.id} style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'rgba(67, 56, 202, 0.1)', color: '#4338ca' }}>
                      #{rec.priority} · {rec.badge}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '14px' }}>{rec.title}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>{rec.reason}</div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(rec.destinationRoute)}
                  style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--primary)', color: '#ffffff', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>{rec.actionLabel}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
