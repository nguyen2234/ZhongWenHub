import React, { useState } from 'react';
import {
  CheckSquare,
  Sparkles,
  Layers,
  AlertCircle,
  Plus,
  Loader2,
} from 'lucide-react';
import { teacherAIService } from '../services/teacher-ai.service';
import type { ExerciseGeneratorInput, GeneratedQuestionDraft } from '../types/teacher-ai.types';

export const ExerciseGeneratorShell: React.FC = () => {
  const [formData, setFormData] = useState<ExerciseGeneratorInput>({
    classId: 'cls-001',
    hskLevel: 'HSK 3',
    knowledgePoints: 'Cấu trúc câu chữ 把 và 被, phó từ 刚 / 刚才',
    exerciseTypes: ['multiple-choice', 'sentence-order', 'fill-blank'],
    difficulty: 'MEDIUM',
    questionCount: 3,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDrafts, setGeneratedDrafts] = useState<GeneratedQuestionDraft[]>([]);
  const [addedCount, setAddedCount] = useState(0);

  const toggleExerciseType = (type: string) => {
    setFormData((prev) => {
      const exists = prev.exerciseTypes.includes(type);
      if (exists) {
        if (prev.exerciseTypes.length === 1) return prev; // Keep at least one
        return { ...prev, exerciseTypes: prev.exerciseTypes.filter((t) => t !== type) };
      }
      return { ...prev, exerciseTypes: [...prev.exerciseTypes, type] };
    });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.knowledgePoints.trim()) {
      setError('Vui lòng nhập điểm kiến thức cần sinh bài tập.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const drafts = await teacherAIService.generateExerciseBatchDraft(formData);
      setGeneratedDrafts(drafts);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi sinh câu hỏi';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
      {/* Left Column: Form */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(67, 56, 202, 0.1)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckSquare size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)' }}>
              Thiết lập Sinh Đề Bài Tập AI
            </h3>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Biên tập câu hỏi trắc nghiệm, nối từ, điền từ tự động bám sát HSK
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              fontSize: 'var(--text-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Row 1: Class & HSK Level */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
                Lớp áp dụng
              </label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: 'var(--text-xs)',
                  outline: 'none',
                }}
              >
                <option value="cls-001">Lớp HSK 3 - K24</option>
                <option value="cls-002">Lớp HSK 2 Cơ bản</option>
                <option value="cls-003">Lớp HSK 4 Đọc hiểu</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
                Cấp độ HSK
              </label>
              <select
                value={formData.hskLevel}
                onChange={(e) => setFormData({ ...formData, hskLevel: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: 'var(--text-xs)',
                  outline: 'none',
                }}
              >
                <option value="HSK 1">HSK 1</option>
                <option value="HSK 2">HSK 2</option>
                <option value="HSK 3">HSK 3</option>
                <option value="HSK 4">HSK 4</option>
                <option value="HSK 5">HSK 5</option>
                <option value="HSK 6">HSK 6</option>
                <option value="HSK 7-9">HSK 7–9</option>
              </select>
            </div>
          </div>

          {/* Knowledge points */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
              Điểm kiến thức & Ngữ pháp mục tiêu *
            </label>
            <input
              type="text"
              value={formData.knowledgePoints}
              onChange={(e) => setFormData({ ...formData, knowledgePoints: e.target.value })}
              placeholder="VD: Cấu trúc câu chữ 把, phó từ 刚..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                fontSize: 'var(--text-xs)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Exercise Types Multi-select */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>
              Dạng câu hỏi mong muốn
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {[
                { id: 'multiple-choice', label: 'Trắc nghiệm 4 lựa chọn' },
                { id: 'sentence-order', label: 'Sắp xếp trật tự từ' },
                { id: 'fill-blank', label: 'Điền từ vào chỗ trống' },
                { id: 'matching', label: 'Ghép cặp từ và nghĩa' },
              ].map((item) => {
                const checked = formData.exerciseTypes.includes(item.id);
                return (
                  <label
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: checked ? 'rgba(67, 56, 202, 0.08)' : 'var(--background)',
                      border: checked ? '1px solid var(--primary)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      fontSize: 'var(--text-xs)',
                      color: checked ? 'var(--primary)' : 'var(--foreground)',
                      fontWeight: checked ? 700 : 500,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleExerciseType(item.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Row 2: Difficulty & Question count */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
                Độ khó
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: 'var(--text-xs)',
                  outline: 'none',
                }}
              >
                <option value="EASY">Dễ (Nhận biết cơ bản)</option>
                <option value="MEDIUM">Trung bình (Ứng dụng)</option>
                <option value="HARD">Khó (Đề thi thử thách)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
                Số lượng câu hỏi (tối đa 5 câu demo)
              </label>
              <select
                value={formData.questionCount}
                onChange={(e) => setFormData({ ...formData, questionCount: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: 'var(--text-xs)',
                  outline: 'none',
                }}
              >
                <option value={2}>2 câu hỏi</option>
                <option value={3}>3 câu hỏi</option>
                <option value={5}>5 câu hỏi</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="ds-btn ds-btn-primary"
            style={{ marginTop: 'var(--space-2)', height: '40px', fontSize: 'var(--text-xs)', fontWeight: 700, gap: '6px' }}
          >
            {loading ? <Loader2 size={15} className="spin-animation" /> : <Sparkles size={15} />}
            <span>{loading ? 'Đang tạo câu hỏi...' : 'Sinh Đề Bài Tập AI'}</span>
          </button>
        </form>
      </div>

      {/* Right Column: Draft Questions Preview */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          minHeight: '480px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Layers size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)' }}>
              Danh Sách Câu Hỏi Được Tạo ({generatedDrafts.length})
            </h3>
          </div>

          {generatedDrafts.length > 0 && (
            <button
              type="button"
              onClick={() => setAddedCount((prev) => prev + generatedDrafts.length)}
              className="ds-btn ds-btn-outline"
              style={{ height: '30px', padding: '0 10px', fontSize: '11px', gap: '4px' }}
            >
              <Plus size={13} />
              <span>{addedCount > 0 ? `Đã lưu ${addedCount} câu` : 'Lưu vào kho bài'}</span>
            </button>
          )}
        </div>

        {generatedDrafts.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-8)',
              textAlign: 'center',
              color: 'var(--muted)',
              gap: 'var(--space-2)',
            }}
          >
            <CheckSquare size={32} style={{ opacity: 0.5 }} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Chưa có câu hỏi nào được sinh</span>
            <span style={{ fontSize: 'var(--text-xs)', maxWidth: '280px' }}>
              Chọn điểm ngữ pháp và dạng bài bên trái rồi nhấn &quot;Sinh Đề Bài Tập AI&quot;.
            </span>
          </div>
        )}

        {generatedDrafts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {generatedDrafts.map((q) => (
              <div
                key={q.id}
                style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>
                    Câu {q.orderIndex} • Dạng {q.exerciseType}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      color: '#d97706',
                    }}
                  >
                    Độ khó: {q.estimatedDifficulty}
                  </span>
                </div>

                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-hanzi)' }}>
                  {q.promptHanzi}
                </div>
                {q.promptPinyin && (
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{q.promptPinyin}</div>
                )}
                {q.promptVi && (
                  <div style={{ fontSize: '11px', color: 'var(--foreground)' }}>
                    <strong>Nghĩa:</strong> {q.promptVi}
                  </div>
                )}

                {q.suggestedOptions && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {q.suggestedOptions.map((opt, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: opt === q.suggestedAnswer ? 'rgba(16, 185, 129, 0.15)' : 'var(--surface)',
                          border: opt === q.suggestedAnswer ? '1px solid #10b981' : '1px solid var(--border)',
                          fontWeight: opt === q.suggestedAnswer ? 700 : 500,
                        }}
                      >
                        {String.fromCharCode(65 + idx)}. {opt}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--muted)',
                    backgroundColor: 'var(--surface)',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    marginTop: '2px',
                  }}
                >
                  <strong style={{ color: '#059669' }}>Đáp án: </strong> {q.suggestedAnswer} •{' '}
                  <span style={{ fontStyle: 'italic' }}>{q.explanationVi}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
