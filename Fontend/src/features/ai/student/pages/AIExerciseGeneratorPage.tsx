import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wand2,
  Brain,
  BookOpen,
  Lightbulb,
  RefreshCw,
  Compass,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  aiLearningEngineService,
  type AdaptiveExercise,
  type AdaptiveSession,
  type AIErrorAnalysisDetail,
  type AiExerciseAttemptResult,
  type AiGeneratedExercise,
} from '../../services/ai-learning-engine.service';

const EXERCISE_TYPE_LABELS: { value: string; label: string }[] = [
  { value: 'multiple-choice', label: 'Trắc nghiệm (Multiple Choice)' },
  { value: 'fill-blank', label: 'Điền từ (Fill Blank)' },
  { value: 'meaning-match', label: 'Chọn nghĩa đúng (Meaning Match)' },
  { value: 'pinyin-match', label: 'Chọn Pinyin đúng (Pinyin Match)' },
  { value: 'sentence-order', label: 'Sắp xếp câu (Sentence Order)' },
  { value: 'error-correction', label: 'Sửa câu sai (Error Correction)' },
];

const SKILL_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tất cả kỹ năng (Thích ứng theo điểm yếu & SRS)' },
  { value: 'vocabulary', label: 'Từ vựng (Vocabulary)' },
  { value: 'grammar', label: 'Ngữ pháp (Grammar)' },
  { value: 'pinyin', label: 'Pinyin & Thanh điệu' },
  { value: 'reading', label: 'Đọc hiểu (Reading)' },
  { value: 'hanzi', label: 'Nhận diện chữ Hán' },
];

export const AIExerciseGeneratorPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Mode: adaptive (Phase 3) vs custom
  const [mode, setMode] = useState<'adaptive' | 'custom'>('adaptive');

  // Adaptive Mode States
  const [adaptiveHsk, setAdaptiveHsk] = useState<number>(() => {
    const raw = Number(searchParams.get('hsk'));
    return raw >= 1 && raw <= 4 ? raw : 1;
  });
  const [adaptiveFocusSkill, setAdaptiveFocusSkill] = useState<string>('all');
  const [adaptiveCount, setAdaptiveCount] = useState<number>(5);
  const [includeSrsDue, setIncludeSrsDue] = useState<boolean>(true);
  const [adaptiveSession, setAdaptiveSession] = useState<AdaptiveSession | null>(null);

  // Custom Generator States
  const [hskLevel, setHskLevel] = useState<number>(() => {
    const raw = Number(searchParams.get('hsk'));
    return raw >= 1 && raw <= 4 ? raw : 1;
  });
  const [sourceType, setSourceType] = useState<string>(() => searchParams.get('source') || 'VOCABULARY');
  const [exerciseType, setExerciseType] = useState<string>('multiple-choice');
  const [count, setCount] = useState<number>(3);
  const [exercises, setExercises] = useState<AiGeneratedExercise[]>([]);

  // Shared Interaction States
  const [selectedIndexes, setSelectedIndexes] = useState<Record<string, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [attemptResults, setAttemptResults] = useState<Record<string, AiExerciseAttemptResult>>({});
  const [manualErrorAnalysis, setManualErrorAnalysis] = useState<Record<string, AIErrorAnalysisDetail>>({});

  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadInitial = async () => {
      try {
        setLoading(true);
        // Load Competency profile to auto-tune target HSK if available
        try {
          const profile = await aiLearningEngineService.getCompetencyProfile();
          if (active && profile) {
            const recommended = profile.estimatedHskLevel ?? profile.selectedHskLevel ?? 1;
            if (recommended >= 1 && recommended <= 4) {
              setAdaptiveHsk(recommended);
            }
          }
        } catch {
          // Non-blocking if profile not ready
        }

        const list = await aiLearningEngineService.listAiExercises(hskLevel);
        if (active) setExercises(list);
      } catch (err) {
        if (active) setErrorMsg(err instanceof Error ? err.message : 'Không thể tải dữ liệu ban đầu.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadInitial();
    return () => {
      active = false;
    };
  }, [hskLevel]);

  // Generate Adaptive Session (Phase 3)
  const handleStartAdaptiveSession = async () => {
    try {
      setGenerating(true);
      setErrorMsg(null);
      const session = await aiLearningEngineService.generateAdaptiveSession({
        targetHskLevel: adaptiveHsk,
        focusSkill: adaptiveFocusSkill,
        questionCount: adaptiveCount,
        includeSrsDue: includeSrsDue,
        preferWeakness: true,
      });
      setAdaptiveSession(session);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể tạo phiên luyện tập thích ứng lúc này.');
    } finally {
      setGenerating(false);
    }
  };

  // Generate Custom AI Exercises
  const handleGenerateCustom = async () => {
    try {
      setGenerating(true);
      setErrorMsg(null);
      const created = await aiLearningEngineService.generateAiExercises({
        hskLevel,
        sourceType,
        exerciseType,
        count,
      });
      setExercises((prev) => [...created, ...prev]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể tạo bài tập AI lúc này.');
    } finally {
      setGenerating(false);
    }
  };

  // Submit Attempt
  const handleSubmitAttempt = async (exId: string) => {
    try {
      setErrorMsg(null);
      const selectedIdx = selectedIndexes[exId];
      const textAnswer = textAnswers[exId];
      const result = await aiLearningEngineService.submitAiExerciseAttempt(exId, {
        selectedIndex: selectedIdx,
        userAnswer: textAnswer,
      });
      setAttemptResults((prev) => ({ ...prev, [exId]: result }));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể nộp bài tập.');
    }
  };

  // Request on-demand deep error explanation
  const handleRequestDeepAnalysis = async (
    exId: string,
    questionText: string,
    userAns: string,
    correctAns: string,
    skill: string,
    hsk: number
  ) => {
    try {
      setAnalyzingId(exId);
      const detail = await aiLearningEngineService.explainErrorDetail({
        exerciseId: exId,
        questionText: questionText,
        userAnswer: userAns,
        correctAnswer: correctAns,
        skillCategory: skill,
        hskLevel: hsk,
      });
      setManualErrorAnalysis((prev) => ({ ...prev, [exId]: detail }));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể lấy phân tích sâu từ AI lúc này.');
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '20px 16px 48px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ padding: '18px 20px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/ai-learning')}
            aria-label="Quay lại AI Learning"
            style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Luyện Tập Thích Ứng & Phân Tích Lỗi Sai AI</h1>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                Phase 3 · BKT & Pedagogical Loop
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
              Tự động điều chỉnh độ khó theo điểm yếu, đan xen SRS và phân tích sâu sắc nguyên nhân lỗi sai bằng tiếng Việt.
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--background)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setMode('adaptive')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px',
              backgroundColor: mode === 'adaptive' ? 'var(--primary)' : 'transparent',
              color: mode === 'adaptive' ? '#ffffff' : 'var(--muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Brain size={14} />
            Luyện tập thích ứng
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px',
              backgroundColor: mode === 'custom' ? 'var(--primary)' : 'transparent',
              color: mode === 'custom' ? '#ffffff' : 'var(--muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Wand2 size={14} />
            Tạo bài tập tự chọn
          </button>
        </div>
      </div>

      {/* Mode Controls */}
      {mode === 'adaptive' ? (
        <div style={{ padding: '18px 20px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'end' }}>
            <div>
              <label htmlFor="adaptive-hsk" style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--muted)' }}>
                Cấp độ HSK mục tiêu
              </label>
              <select
                id="adaptive-hsk"
                value={adaptiveHsk}
                onChange={(e) => setAdaptiveHsk(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
              >
                {[1, 2, 3, 4].map((l) => (
                  <option key={l} value={l}>HSK {l} (Tự động đề xuất theo BKT)</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="adaptive-focus" style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--muted)' }}>
                Kỹ năng trọng tâm
              </label>
              <select
                id="adaptive-focus"
                value={adaptiveFocusSkill}
                onChange={(e) => setAdaptiveFocusSkill(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
              >
                {SKILL_FILTER_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="adaptive-count" style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--muted)' }}>
                Số lượng câu
              </label>
              <select
                id="adaptive-count"
                value={adaptiveCount}
                onChange={(e) => setAdaptiveCount(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
              >
                {[3, 5, 8, 10].map((n) => (
                  <option key={n} value={n}>{n} câu</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px' }}>
              <input
                type="checkbox"
                id="adaptive-srs"
                checked={includeSrsDue}
                onChange={(e) => setIncludeSrsDue(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="adaptive-srs" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Đan xen từ vựng SRS sắp quên
              </label>
            </div>

            <button
              type="button"
              disabled={generating}
              onClick={() => void handleStartAdaptiveSession()}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Brain size={16} />
              <span>{generating ? 'Đang tạo phiên thích ứng...' : 'Bắt đầu phiên thích ứng'}</span>
            </button>
          </div>

          {adaptiveSession && (
            <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Compass size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Chiến lược phiên: </strong>
                {adaptiveSession.strategySummaryVi}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '18px 20px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'end' }}>
          <div>
            <label htmlFor="ai-ex-hsk" style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--muted)' }}>Cấp độ HSK</label>
            <select id="ai-ex-hsk" value={hskLevel} onChange={(e) => setHskLevel(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
              {[1, 2, 3, 4].map((l) => (
                <option key={l} value={l}>HSK {l}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ai-ex-source" style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--muted)' }}>Nguồn kiến thức</label>
            <select id="ai-ex-source" value={sourceType} onChange={(e) => setSourceType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
              <option value="VOCABULARY">Từ vựng bài học</option>
              <option value="GRAMMAR">Điểm ngữ pháp</option>
              <option value="READING">Nội dung bài đọc</option>
              <option value="WEAKNESS">Lỗi học viên hay mắc</option>
            </select>
          </div>

          <div>
            <label htmlFor="ai-ex-type" style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--muted)' }}>Dạng bài tập</label>
            <select id="ai-ex-type" value={exerciseType} onChange={(e) => setExerciseType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
              {EXERCISE_TYPE_LABELS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ai-ex-count" style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--muted)' }}>Số lượng câu</label>
            <select id="ai-ex-count" value={count} onChange={(e) => setCount(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} câu</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={generating}
            onClick={() => void handleGenerateCustom()}
            style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--primary)', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Wand2 size={15} />
            <span>{generating ? 'Đang tạo bài tập...' : 'Tạo bài tập AI'}</span>
          </button>
        </div>
      )}

      {errorMsg && (
        <div role="alert" style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {/* Render Questions List */}
      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)' }}>Đang tải bài tập...</div>
      ) : mode === 'adaptive' ? (
        !adaptiveSession || adaptiveSession.questions.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
            <Brain size={32} style={{ marginBottom: '8px', color: 'var(--primary)' }} />
            <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>Chưa có phiên luyện tập thích ứng</div>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px' }}>
              Chọn kỹ năng trọng tâm và nhấn "Bắt đầu phiên thích ứng" để AI tạo bộ bài tập tối ưu hóa theo hồ sơ năng lực của bạn.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {adaptiveSession.questions.map((ex, idx) => renderExerciseCard(ex, idx))}
          </div>
        )
      ) : exercises.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
          <Sparkles size={28} style={{ marginBottom: '8px' }} />
          <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>Chưa có bài tập AI cho HSK {hskLevel}</div>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px' }}>Chọn nguồn kiến thức và nhấn "Tạo bài tập AI" để bắt đầu luyện tập.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {exercises.map((ex, idx) => renderExerciseCard(ex, idx))}
        </div>
      )}
    </div>
  );

  function renderExerciseCard(ex: AdaptiveExercise | AiGeneratedExercise, idx: number) {
    const result = attemptResults[ex.id];
    const isChoice = ex.options && ex.options.length > 0;
    const errorDetail = manualErrorAnalysis[ex.id] || result?.errorAnalysis;
    const isCurated = ex.originTag === 'CURATED_QUESTION_BANK';

    return (
      <div key={ex.id} style={{ padding: '18px 20px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Top Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)' }}>Câu {idx + 1}</span>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#f1f5f9', color: '#334155' }}>
              HSK {ex.hskLevel} · {ex.exerciseType}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: isCurated ? '#dcfce7' : '#fef3c7',
                color: isCurated ? '#15803d' : '#92400e',
              }}
            >
              {isCurated ? 'Nội dung kiểm duyệt' : 'AI_GENERATED'}
            </span>
            {'difficultyTag' in ex && ex.difficultyTag && (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                {ex.difficultyTag}
              </span>
            )}
          </div>
          {ex.sourceReviewNote && (
            <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={12} />
              {ex.sourceReviewNote}
            </span>
          )}
        </div>

        {/* Prompt */}
        <div>
          <div style={{ fontSize: '17px', fontWeight: 700 }}>{ex.promptZh}</div>
          {ex.promptPinyin && <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>{ex.promptPinyin}</div>}
          {ex.promptVi && <div style={{ fontSize: '13px', marginTop: '4px', color: 'var(--foreground)' }}>{ex.promptVi}</div>}
        </div>

        {/* Choice or Input Area */}
        {isChoice ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
            {ex.options.map((opt, optIdx) => {
              const chosen = selectedIndexes[ex.id] === optIdx;
              const isLocked = Boolean(result);
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={isLocked}
                  onClick={() => setSelectedIndexes((prev) => ({ ...prev, [ex.id]: optIdx }))}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: chosen ? '2px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: chosen ? 'rgba(230, 0, 18, 0.06)' : 'var(--background)',
                    cursor: isLocked ? 'default' : 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {String.fromCharCode(65 + optIdx)}. {opt}
                </button>
              );
            })}
          </div>
        ) : (
          <input
            type="text"
            disabled={Boolean(result)}
            value={textAnswers[ex.id] || ''}
            onChange={(e) => setTextAnswers((prev) => ({ ...prev, [ex.id]: e.target.value }))}
            placeholder="Nhập câu trả lời tiếng Trung của bạn..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', fontSize: '14px' }}
          />
        )}

        {/* Action Controls */}
        {!result && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => void handleSubmitAttempt(ex.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#1e293b',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Kiểm tra đáp án
            </button>
          </div>
        )}

        {/* Post-submission Result & Error Analysis */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Quick Status Bar */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: result.isCorrect ? '#f0fdf4' : '#fef2f2',
                border: result.isCorrect ? '1px solid #bbf7d0' : '1px solid #fecaca',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ fontWeight: 800, color: result.isCorrect ? '#047857' : '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {result.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>{result.isCorrect ? 'Chính xác!' : `Chưa đúng. Đáp án chuẩn: ${result.correctAnswer || ''}`}</span>
              </div>

              {!result.isCorrect && !errorDetail && (
                <button
                  type="button"
                  disabled={analyzingId === ex.id}
                  onClick={() =>
                    void handleRequestDeepAnalysis(
                      ex.id,
                      ex.promptZh,
                      result.correctAnswer || '',
                      result.correctAnswer || '',
                      result.skillCategory,
                      ex.hskLevel
                    )
                  }
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid #fca5a5',
                    backgroundColor: '#ffffff',
                    color: '#b91c1c',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RefreshCw size={12} className={analyzingId === ex.id ? 'animate-spin' : ''} />
                  {analyzingId === ex.id ? 'Đang phân tích...' : 'Phân tích sâu bằng AI'}
                </button>
              )}
            </div>

            {/* Explanation & Next Suggestion for Correct Answer */}
            {result.isCorrect && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid var(--border)', fontSize: '13px' }}>
                <div style={{ color: 'var(--foreground)' }}>{result.explanationVi}</div>
                {result.nextSuggestion && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#0369a1' }}>
                    <Lightbulb size={14} />
                    <span>{result.nextSuggestion.reasonVi}</span>
                  </div>
                )}
              </div>
            )}

            {/* Deep AI Error Analysis Card for Incorrect Answer */}
            {!result.isCorrect && errorDetail && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={16} color="#b45309" />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#92400e' }}>
                      Phân tích lỗi sai: {errorDetail.errorTypeLabelVi}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', backgroundColor: errorDetail.isFallback ? '#fef3c7' : '#e0e7ff', color: errorDetail.isFallback ? '#92400e' : '#3730a3' }}>
                    {errorDetail.isFallback ? 'Sư phạm chuẩn ngoại tuyến' : 'AI Phân tích'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                  <div style={{ color: '#78350f' }}>
                    <strong>Tại sao bạn chọn chưa đúng: </strong>
                    {errorDetail.whyIncorrectVi}
                  </div>
                  <div style={{ color: '#065f46' }}>
                    <strong>Tại sao đáp án chuẩn là đúng: </strong>
                    {errorDetail.whyCorrectVi}
                  </div>
                </div>

                {errorDetail.knowledgePointVi && (
                  <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#fef3c7', border: '1px solid #fcd34d', fontSize: '12px', color: '#92400e' }}>
                    <strong>Kiến thức cốt lõi cần nhớ: </strong>
                    {errorDetail.knowledgePointVi}
                  </div>
                )}

                {/* Example Cards */}
                {errorDetail.examples && errorDetail.examples.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <BookOpen size={14} />
                      Ví dụ minh họa:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                      {errorDetail.examples.map((eg, egIdx) => (
                        <div key={egIdx} style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #fde68a', fontSize: '12px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{eg.hanzi}</div>
                          {eg.pinyin && <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{eg.pinyin}</div>}
                          {eg.vietnamese && <div style={{ color: '#1e293b', marginTop: '2px' }}>{eg.vietnamese}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actionable Next Practice Recommendation */}
                {errorDetail.recommendedPracticeAction && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingTop: '4px', borderTop: '1px dashed #fcd34d' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#92400e' }}>
                      {errorDetail.recommendedPracticeAction}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(errorDetail.recommendedRoute || '/ai-exercises')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#d97706',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      Luyện tập chuyên đề này
                      <ArrowRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
};
