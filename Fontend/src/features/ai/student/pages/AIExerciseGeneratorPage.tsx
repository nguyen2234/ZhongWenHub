import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wand2,
} from 'lucide-react';
import {
  aiLearningEngineService,
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

export const AIExerciseGeneratorPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [hskLevel, setHskLevel] = useState<number>(() => {
    const raw = Number(searchParams.get('hsk'));
    return raw >= 1 && raw <= 4 ? raw : 1;
  });
  const [sourceType, setSourceType] = useState<string>(() => searchParams.get('source') || 'VOCABULARY');
  const [exerciseType, setExerciseType] = useState<string>('multiple-choice');
  const [count, setCount] = useState<number>(3);

  const [exercises, setExercises] = useState<AiGeneratedExercise[]>([]);
  const [selectedIndexes, setSelectedIndexes] = useState<Record<string, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [attemptResults, setAttemptResults] = useState<Record<string, AiExerciseAttemptResult>>({});

  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const list = await aiLearningEngineService.listAiExercises(hskLevel);
        if (active) setExercises(list);
      } catch (err) {
        if (active) setErrorMsg(err instanceof Error ? err.message : 'Không thể tải danh sách bài tập AI.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [hskLevel]);

  const handleGenerate = async () => {
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

  const handleSubmitAttempt = async (ex: AiGeneratedExercise) => {
    try {
      setErrorMsg(null);
      const selectedIdx = selectedIndexes[ex.id];
      const textAnswer = textAnswers[ex.id];
      const result = await aiLearningEngineService.submitAiExerciseAttempt(ex.id, {
        selectedIndex: selectedIdx,
        userAnswer: textAnswer,
      });
      setAttemptResults((prev) => ({ ...prev, [ex.id]: result }));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể nộp bài tập AI.');
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
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Trình Tạo Bài Tập AI (HSK 1–4)</h1>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#fef3c7', color: '#92400e' }}>
                AI_GENERATED · Luyện tập thử nghiệm
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
              Sinh bài tập từ từ vựng, ngữ pháp, bài đọc hoặc lỗi sai thực tế; không ghi đè ngân hàng bài tập chính thức.
            </p>
          </div>
        </div>
      </div>

      {/* Generator Controls */}
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
          onClick={() => void handleGenerate()}
          style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--primary)', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Wand2 size={15} />
          <span>{generating ? 'Đang tạo bài tập...' : 'Tạo bài tập AI'}</span>
        </button>
      </div>

      {errorMsg && (
        <div role="alert" style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {/* List of Generated Exercises */}
      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)' }}>Đang tải bài tập AI...</div>
      ) : exercises.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
          <Sparkles size={28} style={{ marginBottom: '8px' }} />
          <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>Chưa có bài tập AI cho HSK {hskLevel}</div>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px' }}>Chọn nguồn kiến thức và nhấn "Tạo bài tập AI" để bắt đầu luyện tập.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {exercises.map((ex, idx) => {
            const result = attemptResults[ex.id];
            const isChoice = ex.options && ex.options.length > 0;
            return (
              <div key={ex.id} style={{ padding: '18px 20px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)' }}>Câu {idx + 1}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#f1f5f9', color: '#334155' }}>
                      HSK {ex.hskLevel} · {ex.exerciseType}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#fef3c7', color: '#92400e' }}>
                      {ex.originTag}
                    </span>
                  </div>
                  {ex.sourceReviewNote && (
                    <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={12} />
                      {ex.sourceReviewNote}
                    </span>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{ex.promptZh}</div>
                  {ex.promptPinyin && <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>{ex.promptPinyin}</div>}
                  {ex.promptVi && <div style={{ fontSize: '13px', marginTop: '4px' }}>{ex.promptVi}</div>}
                </div>

                {isChoice ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                    {ex.options.map((opt, optIdx) => {
                      const chosen = selectedIndexes[ex.id] === optIdx;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSelectedIndexes((prev) => ({ ...prev, [ex.id]: optIdx }))}
                          style={{
                            textAlign: 'left',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: chosen ? '2px solid var(--primary)' : '1px solid var(--border)',
                            backgroundColor: chosen ? 'rgba(230, 0, 18, 0.06)' : 'var(--background)',
                            cursor: 'pointer',
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
                    value={textAnswers[ex.id] || ''}
                    onChange={(e) => setTextAnswers((prev) => ({ ...prev, [ex.id]: e.target.value }))}
                    placeholder="Nhập câu trả lời tiếng Trung của bạn..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', fontSize: '14px' }}
                  />
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => void handleSubmitAttempt(ex)}
                    style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', backgroundColor: '#1e293b', color: '#ffffff', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                  >
                    Kiểm tra đáp án
                  </button>
                </div>

                {result && (
                  <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: result.isCorrect ? '#f0fdf4' : '#fef2f2', border: result.isCorrect ? '1px solid #bbf7d0' : '1px solid #fecaca', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontWeight: 800, color: result.isCorrect ? '#047857' : '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {result.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      <span>{result.isCorrect ? 'Chính xác!' : `Chưa đúng. Đáp án chuẩn: ${result.correctAnswer || ''}`}</span>
                    </div>
                    <div style={{ color: '#1e293b' }}>{result.explanationVi}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
