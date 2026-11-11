import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Save, Search } from 'lucide-react';
import { adminExerciseService } from '../services/admin-exercise.service';
import type { AdminExerciseItem } from '../types/admin-content.types';
import type { ExamDetail, ExamQuestionItem, ExamSectionName, UpsertExamQuestionInput } from '../types/exam-repository.types';

export interface ExamQuestionsModalProps {
  isOpen: boolean;
  exam: ExamDetail | null;
  onClose: () => void;
  onSaveQuestions: (examId: string, questions: UpsertExamQuestionInput[]) => Promise<void>;
}

const SECTIONS: ExamSectionName[] = ['Nghe hiểu', 'Đọc hiểu', 'Viết'];

export const ExamQuestionsModal: React.FC<ExamQuestionsModalProps> = ({
  isOpen,
  exam,
  onClose,
  onSaveQuestions,
}) => {
  const [selectedQuestions, setSelectedQuestions] = useState<ExamQuestionItem[]>([]);
  const [bankExercises, setBankExercises] = useState<AdminExerciseItem[]>([]);
  const [bankSearch, setBankSearch] = useState('');
  const [bankHskFilter, setBankHskFilter] = useState<number | 'ALL'>(1);
  const [isLoadingBank, setIsLoadingBank] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && exam) {
      setSelectedQuestions([...exam.questions]);
      setBankHskFilter(exam.hskLevel);
      setError(null);
      setIsLoadingBank(true);
      adminExerciseService
        .getAllAsync({ hskLevel: exam.hskLevel })
        .then((items) => setBankExercises(items))
        .catch(() => setBankExercises([]))
        .finally(() => setIsLoadingBank(false));
    }
  }, [isOpen, exam]);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoadingBank(true);
    adminExerciseService
      .getAllAsync({ hskLevel: bankHskFilter })
      .then((items) => setBankExercises(items))
      .catch(() => setBankExercises([]))
      .finally(() => setIsLoadingBank(false));
  }, [bankHskFilter, isOpen]);

  const selectedExerciseIds = useMemo(
    () => new Set(selectedQuestions.map((q) => q.exerciseId)),
    [selectedQuestions]
  );

  const filteredBank = useMemo(() => {
    const kw = bankSearch.trim().toLowerCase();
    return bankExercises.filter((item) => {
      if (selectedExerciseIds.has(item.id)) return false;
      if (!kw) return true;
      return (
        item.title.toLowerCase().includes(kw) ||
        (item.promptHanzi ?? '').toLowerCase().includes(kw) ||
        (item.promptVietnamese ?? '').toLowerCase().includes(kw)
      );
    });
  }, [bankExercises, bankSearch, selectedExerciseIds]);

  if (!isOpen || !exam) return null;

  const handleAddFromBank = (ex: AdminExerciseItem) => {
    const inferredSection: ExamSectionName =
      ex.skill === 'listening' ? 'Nghe hiểu' : ex.skill === 'sentence' ? 'Viết' : 'Đọc hiểu';

    setSelectedQuestions((prev) => [
      ...prev,
      {
        id: `temp-${ex.id}`,
        examId: exam.id,
        exerciseId: ex.id,
        sectionName: inferredSection,
        orderIndex: prev.length + 1,
        points: 10,
        exerciseTitle: ex.title,
        exerciseType: ex.type,
        exerciseSkill: ex.skill,
        hskLevel: ex.hskLevel,
        promptHanzi: ex.promptHanzi,
        promptPinyin: ex.promptPinyin,
        promptVietnamese: ex.promptVietnamese,
      },
    ]);
  };

  const handleMove = (index: number, delta: -1 | 1) => {
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= selectedQuestions.length) return;
    const copy = [...selectedQuestions];
    const [item] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, item);
    setSelectedQuestions(copy.map((q, idx) => ({ ...q, orderIndex: idx + 1 })));
  };

  const handleRemove = (index: number) => {
    setSelectedQuestions((prev) =>
      prev.filter((_, idx) => idx !== index).map((q, idx) => ({ ...q, orderIndex: idx + 1 }))
    );
  };

  const handleUpdateField = (
    index: number,
    patch: Partial<Pick<ExamQuestionItem, 'sectionName' | 'points'>>
  ) => {
    setSelectedQuestions((prev) =>
      prev.map((q, idx) => (idx === index ? { ...q, ...patch } : q))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const payload: UpsertExamQuestionInput[] = selectedQuestions.map((q, idx) => ({
        exerciseId: q.exerciseId,
        sectionName: q.sectionName,
        orderIndex: idx + 1,
        points: Math.max(1, Number(q.points) || 10),
      }));
      await onSaveQuestions(exam.id, payload);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Không thể lưu cấu trúc câu hỏi cho đề thi.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalPoints = selectedQuestions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

  return (
    <div className="lcm-drawer-overlay" onClick={onClose}>
      <div
        className="lcm-drawer-content"
        style={{ maxWidth: '960px', width: '95vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lcm-drawer-header">
          <div>
            <h3 className="lcm-drawer-title">
              Cấu trúc câu hỏi đề thi: {exam.code} — {exam.title}
            </h3>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Đã chọn <strong>{selectedQuestions.length}</strong> câu · Tổng điểm:{' '}
              <strong>{totalPoints}</strong>
            </span>
          </div>
          <button
            type="button"
            className="ds-btn ds-btn-ghost ds-btn-sm"
            onClick={onClose}
            disabled={isSaving}
          >
            <X size={18} />
          </button>
        </div>

        <div className="lcm-drawer-body" style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 'var(--space-4)' }}>
          {/* Left: Selected Questions Ordered */}
          <div>
            <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-sm)', fontWeight: 700 }}>
              Danh sách câu hỏi trong đề ({selectedQuestions.length})
            </h4>

            {error && (
              <div
                style={{
                  padding: 'var(--space-2)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--danger, #ef4444)',
                  fontSize: 'var(--text-xs)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {error}
              </div>
            )}

            {selectedQuestions.length === 0 ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)', color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>
                Chưa có câu hỏi nào. Hãy chọn câu hỏi từ Ngân hàng câu hỏi ở cột bên phải.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '55vh', overflowY: 'auto' }}>
                {selectedQuestions.map((q, idx) => (
                  <div
                    key={q.exerciseId}
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                        Câu #{idx + 1} · {q.exerciseTitle}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          className="ds-btn ds-btn-ghost ds-btn-sm"
                          onClick={() => handleMove(idx, -1)}
                          disabled={idx === 0}
                          title="Di chuyển lên"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          className="ds-btn ds-btn-ghost ds-btn-sm"
                          onClick={() => handleMove(idx, 1)}
                          disabled={idx === selectedQuestions.length - 1}
                          title="Di chuyển xuống"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          className="ds-btn ds-btn-ghost ds-btn-sm"
                          onClick={() => handleRemove(idx)}
                          title="Xóa khỏi đề thi"
                          style={{ color: 'var(--danger, #ef4444)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {q.promptHanzi && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-hanzi)' }}>
                        {q.promptHanzi}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <select
                        className="lcm-select-filter"
                        style={{ fontSize: '12px', padding: '2px 8px' }}
                        value={q.sectionName}
                        onChange={(e) => handleUpdateField(idx, { sectionName: e.target.value })}
                      >
                        {SECTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>

                      <label style={{ fontSize: '11px', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Điểm:
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={q.points}
                          onChange={(e) => handleUpdateField(idx, { points: Number(e.target.value) })}
                          style={{ width: '56px', padding: '2px 6px', border: '1px solid var(--border-strong)', borderRadius: '4px' }}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Question Bank Picker */}
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 'var(--space-3)' }}>
            <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-sm)', fontWeight: 700 }}>
              Ngân hàng câu hỏi
            </h4>

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={13} style={{ position: 'absolute', left: '8px', top: '9px', color: 'var(--muted)' }} />
                <input
                  type="text"
                  className="ds-input"
                  style={{ paddingLeft: '28px', fontSize: '12px' }}
                  placeholder="Tìm tiêu đề hoặc chữ Hán..."
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                />
              </div>

              <select
                className="lcm-select-filter"
                style={{ fontSize: '12px' }}
                value={bankHskFilter}
                onChange={(e) => setBankHskFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              >
                <option value="ALL">Tất cả HSK</option>
                {[1, 2, 3, 4, 5, 6].map((lvl) => (
                  <option key={lvl} value={lvl}>
                    HSK {lvl}
                  </option>
                ))}
              </select>
            </div>

            {isLoadingBank ? (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', padding: 'var(--space-4)' }}>
                Đang tải Ngân hàng câu hỏi...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '50vh', overflowY: 'auto' }}>
                {filteredBank.length === 0 ? (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', padding: 'var(--space-4)', textAlign: 'center' }}>
                    Không còn câu hỏi phù hợp.
                  </div>
                ) : (
                  filteredBank.slice(0, 50).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: 'var(--space-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                          HSK {item.hskLevel} · {item.skill} · {item.type}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="ds-btn ds-btn-outline ds-btn-sm"
                        onClick={() => handleAddFromBank(item)}
                      >
                        <Plus size={12} /> Thêm
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lcm-drawer-footer">
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={onClose}
            disabled={isSaving}
          >
            Đóng
          </button>
          <button
            type="button"
            className="ds-btn ds-btn-primary ds-btn-sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save size={14} /> {isSaving ? 'Đang lưu...' : 'Lưu bộ câu hỏi'}
          </button>
        </div>
      </div>
    </div>
  );
};
