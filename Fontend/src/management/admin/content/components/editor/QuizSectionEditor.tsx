import React, { useState } from 'react';
import { Plus, ArrowUp, ArrowDown, Trash2, Edit3, Award, CheckCircle } from 'lucide-react';
import { ExerciseEditorModal } from './ExerciseEditorModal';
import type { LessonExerciseItem } from '../../types';

interface QuizSectionEditorProps {
  lessonId: string;
  exercises: LessonExerciseItem[];
  onChange: (updatedExercises: LessonExerciseItem[]) => void;
}

export const QuizSectionEditor: React.FC<QuizSectionEditorProps> = ({
  lessonId,
  exercises,
  onChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LessonExerciseItem | null>(null);

  const practiceItems = exercises.filter((e) => e.section === 'PRACTICE');
  const quizItems = exercises.filter((e) => e.section === 'QUIZ');

  const totalQuizPoints = quizItems.reduce((acc, curr) => acc + (curr.points ?? 10), 0);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: LessonExerciseItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSaveItem = (savedItem: LessonExerciseItem) => {
    const exists = quizItems.some((e) => e.id === savedItem.id);
    let updatedQuiz: LessonExerciseItem[];
    if (exists) {
      updatedQuiz = quizItems.map((e) => (e.id === savedItem.id ? savedItem : e));
    } else {
      updatedQuiz = [...quizItems, savedItem];
    }

    const reorderedQuiz = updatedQuiz.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }));

    onChange([...practiceItems, ...reorderedQuiz]);
  };

  const handleRemove = (id: string) => {
    const remaining = quizItems.filter((e) => e.id !== id);
    const reordered = remaining.map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
    onChange([...practiceItems, ...reordered]);
  };

  const handleMove = (index: number, direction: 'UP' | 'DOWN') => {
    const newIdx = direction === 'UP' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= quizItems.length) return;
    const updated = [...quizItems];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    const reordered = updated.map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
    onChange([...practiceItems, ...reordered]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header Bar */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-5)',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Award size={18} style={{ color: 'var(--warning, #f59e0b)' }} />
            <h4 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>
              Bài kiểm tra đánh giá ({quizItems.length} câu · Tổng {totalQuizPoints} điểm)
            </h4>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
            Dùng chung Exercise Engine với Luyện tập, hỗ trợ tính điểm số (points) cho từng câu hỏi. Cần tối thiểu 3 câu.
          </p>
        </div>

        <button
          type="button"
          className="ds-btn ds-btn-primary ds-btn-sm"
          onClick={handleOpenAdd}
        >
          <Plus size={14} /> Thêm câu hỏi kiểm tra
        </button>
      </div>

      {quizItems.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-10) var(--space-4)',
            textAlign: 'center',
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-xl)',
            border: '2px dashed var(--border)',
          }}
        >
          <div style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
            Chưa có câu hỏi kiểm tra nào.
          </div>
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={handleOpenAdd}
          >
            <Plus size={14} /> Thêm câu hỏi kiểm tra
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {quizItems.map((item, index) => {
            const ex = item.exercise;
            const points = item.points ?? 10;

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border)',
                  padding: 'var(--space-3) var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 'var(--space-3)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
              >
                {/* Left: Order, Points badge, Question Prompt */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1 }}>
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--text-2xs)',
                      fontWeight: 700,
                      color: 'var(--muted)',
                    }}
                  >
                    {item.displayOrder}
                  </span>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span
                        style={{
                          fontSize: 'var(--text-2xs)',
                          padding: '1px 8px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                          fontWeight: 700,
                        }}
                      >
                        +{points} điểm
                      </span>
                      <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--foreground)' }}>
                        {ex.title}
                      </strong>
                    </div>

                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '2px' }}>
                      {ex.promptVietnamese || ex.promptHanzi || ex.instruction}
                    </div>

                    {ex.options && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {ex.options.map((opt, oIdx) => (
                          <span
                            key={oIdx}
                            style={{
                              fontSize: 'var(--text-2xs)',
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: oIdx === ex.correctOptionIndex ? 'var(--primary-light)' : 'var(--background)',
                              border: `1px solid ${oIdx === ex.correctOptionIndex ? 'var(--primary)' : 'var(--border)'}`,
                              color: oIdx === ex.correctOptionIndex ? 'var(--primary)' : 'var(--muted)',
                              fontWeight: oIdx === ex.correctOptionIndex ? 700 : 500,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            {oIdx === ex.correctOptionIndex && <CheckCircle size={10} />}
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <button
                    type="button"
                    className="ds-btn ds-btn-ghost ds-btn-xs"
                    onClick={() => handleOpenEdit(item)}
                  >
                    <Edit3 size={13} /> Sửa
                  </button>

                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button
                      type="button"
                      className="ds-btn ds-btn-ghost ds-btn-xs"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'UP')}
                      title="Di chuyển lên"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      className="ds-btn ds-btn-ghost ds-btn-xs"
                      disabled={index === quizItems.length - 1}
                      onClick={() => handleMove(index, 'DOWN')}
                      title="Di chuyển xuống"
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="ds-btn ds-btn-ghost ds-btn-xs"
                    onClick={() => handleRemove(item.id)}
                    style={{ color: 'var(--danger)' }}
                    title="Xóa câu hỏi khỏi bài học"
                  >
                    <Trash2 size={13} /> Gỡ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Exercise Modal configured for QUIZ */}
      <ExerciseEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        section="QUIZ"
        initialItem={editingItem}
        lessonId={lessonId}
        nextOrder={quizItems.length + 1}
        onSave={handleSaveItem}
      />
    </div>
  );
};
