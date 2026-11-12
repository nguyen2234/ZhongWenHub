import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  AlertTriangle,
  ArrowRight,
  Info,
  RefreshCw,
} from 'lucide-react';
import {
  aiLearningEngineService,
  type ErrorAnalysisReport,
} from '../../ai/services/ai-learning-engine.service';

const SKILL_COLORS: Record<string, string> = {
  vocabulary: '#4338ca',
  grammar: '#be123c',
  hanzi: '#d97706',
  pinyin: '#8b5cf6',
  reading: '#0284c7',
  listening: '#10b981',
};

export const AIAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState<ErrorAnalysisReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadReport = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await aiLearningEngineService.getErrorAnalysis();
      setReport(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể tải báo cáo phân tích lỗi học tập.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport();
  }, []);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px 48px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
          borderRadius: '20px',
          padding: '24px 28px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>
            <BrainCircuit size={14} />
            <span>AI ERROR ANALYSIS · DỮ LIỆU THỰC TẾ</span>
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 800 }}>
            Phân Tích Điểm Yếu & Kỹ Năng HSK
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, maxWidth: '640px', lineHeight: 1.5 }}>
            Thống kê trực tiếp từ lịch sử làm bài tập chính thức và bài tập AI của bạn, phân loại theo 6 kỹ năng cốt lõi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadReport()}
          disabled={loading}
          style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.12)', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} />
          <span>Làm mới số liệu</span>
        </button>
      </div>

      {errorMsg && (
        <div role="alert" style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          Đang tổng hợp dữ liệu phân tích lỗi từ SQL Server...
        </div>
      ) : report && (
        <>
          {/* Audio disclaimer */}
          <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={16} />
            <span>
              <strong>Lưu ý đánh giá:</strong> {report.audioEvaluationNote} (Đã phân tích <strong>{report.totalAttemptsAnalyzed}</strong> lượt làm bài, độ chính xác tổng: <strong>{report.overallAccuracyPercent}%</strong>).
            </span>
          </div>

          {/* 6 Skill Statistics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {report.skills.map((skill) => {
              const color = SKILL_COLORS[skill.skillCategory] || '#4338ca';
              return (
                <div key={skill.skillCategory} style={{ padding: '18px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '14px' }}>{skill.labelVi}</span>
                    <span style={{ fontWeight: 800, fontSize: '16px', color }}>
                      {skill.hasData ? `${skill.accuracyPercent}%` : 'Chưa có dữ liệu'}
                    </span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '9999px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                    <div style={{ width: `${skill.hasData ? skill.accuracyPercent : 0}%`, height: '100%', backgroundColor: color, borderRadius: '9999px' }} />
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {skill.hasData
                      ? `Đúng ${skill.correctAttempts}/${skill.totalAttempts} lượt (Sai ${skill.incorrectAttempts} lượt)`
                      : 'Hãy hoàn thành bài tập thuộc kỹ năng này để hệ thống thống kê.'}
                  </div>
                  {skill.weakTopics.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 600 }}>
                      Điểm hay sai: {skill.weakTopics.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Weak Points */}
          <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 800 }}>
              <AlertTriangle size={18} color="#d97706" />
              <span>Chủ điểm cần củng cố ({report.weakPoints.length})</span>
            </div>

            {report.weakPoints.length === 0 ? (
              <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'var(--background)', color: 'var(--muted)', fontSize: '13px' }}>
                {report.totalAttemptsAnalyzed === 0
                  ? 'Chưa có lượt làm bài nào được ghi nhận. Hãy làm bài tập hoặc luyện tập AI để hệ thống phát hiện điểm yếu.'
                  : 'Chưa phát hiện chủ điểm yếu nào (độ chính xác hiện tại đạt ngưỡng tốt).'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {report.weakPoints.map((wp) => (
                  <div key={`${wp.skillCategory}-${wp.topicTitle}`} style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '14px' }}>{wp.topicTitle} (HSK {wp.hskLevel})</div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>{wp.evidenceVi}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/ai-exercises?hsk=${wp.hskLevel}&source=WEAKNESS`)}
                      style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--primary)', color: '#ffffff', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>Luyện củng cố AI</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
