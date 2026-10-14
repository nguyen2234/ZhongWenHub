import React, { useState } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import type { LessonExerciseItem } from '../../types';
import type { ExerciseType, SharedExerciseItem, MatchingPair } from '../../../../../features/exercise-engine/types';

interface ExerciseEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: 'PRACTICE' | 'QUIZ';
  initialItem?: LessonExerciseItem | null;
  lessonId: string;
  nextOrder: number;
  onSave: (item: LessonExerciseItem) => void;
}

const SUPPORTED_TYPES: Array<{ type: ExerciseType; label: string }> = [
  { type: 'multiple-choice', label: 'Trắc nghiệm chọn 1 đáp án (Multiple Choice)' },
  { type: 'fill-blank', label: 'Điền từ vào chỗ trống (Fill Blank)' },
  { type: 'sentence-order', label: 'Sắp xếp trật tự câu (Sentence Order)' },
  { type: 'matching', label: 'Nối từ tương ứng (Matching)' },
  { type: 'chinese-to-vietnamese', label: 'Dịch Hán sang Việt (ZH → VI)' },
  { type: 'vietnamese-to-chinese', label: 'Dịch Việt sang Hán (VI → ZH)' },
];

interface DialogContentProps {
  section: 'PRACTICE' | 'QUIZ';
  initialItem?: LessonExerciseItem | null;
  lessonId: string;
  nextOrder: number;
  onClose: () => void;
  onSave: (item: LessonExerciseItem) => void;
}

const ExerciseEditorDialogContent: React.FC<DialogContentProps> = ({
  section,
  initialItem,
  lessonId,
  nextOrder,
  onClose,
  onSave,
}) => {
  const ex = initialItem?.exercise;

  const [exerciseType, setExerciseType] = useState<ExerciseType>(ex?.type || 'multiple-choice');
  const [title, setTitle] = useState(ex?.title || (section === 'QUIZ' ? 'Câu hỏi kiểm tra' : 'Bài tập tương tác'));
  const [instruction, setInstruction] = useState(
    ex?.instruction || (section === 'QUIZ' ? 'Chọn phương án trả lời đúng:' : 'Chọn đáp án chính xác:')
  );
  const [promptHanzi, setPromptHanzi] = useState(ex?.promptHanzi || '');
  const [promptPinyin, setPromptPinyin] = useState(ex?.promptPinyin || '');
  const [promptVietnamese, setPromptVietnamese] = useState(ex?.promptVietnamese || '');
  const [options, setOptions] = useState<string[]>(
    ex?.options && ex.options.length > 0 ? ex.options : ['', '', '', '']
  );
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(ex?.correctOptionIndex ?? 0);
  const [sentenceTokens, setSentenceTokens] = useState<string[]>(
    ex?.sentenceTokens && ex.sentenceTokens.length > 0 ? ex.sentenceTokens : ['', '', '', '']
  );
  const [correctSentence, setCorrectSentence] = useState(ex?.correctSentence || '');
  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>(
    ex?.matchingPairs && ex.matchingPairs.length > 0
      ? ex.matchingPairs
      : [
          { id: '1', hanzi: '', meaning: '' },
          { id: '2', hanzi: '', meaning: '' },
        ]
  );
  const [explanation, setExplanation] = useState(ex?.explanation || '');
  const [points, setPoints] = useState<number>(initialItem?.points ?? 10);

  const handleSave = () => {
    const exercisePayload: SharedExerciseItem = {
      id: initialItem?.exercise?.id || `ex-${Date.now()}`,
      type: exerciseType,
      title: title.trim() || (section === 'QUIZ' ? 'Câu hỏi trắc nghiệm' : 'Bài tập tương tác'),
      instruction: instruction.trim() || 'Chọn câu trả lời đúng:',
      promptHanzi: promptHanzi.trim() || undefined,
      promptPinyin: promptPinyin.trim() || undefined,
      promptVietnamese: promptVietnamese.trim() || undefined,
      explanation: explanation.trim() || 'Hoàn thành chính xác.',
    };

    if (
      exerciseType === 'multiple-choice' ||
      exerciseType === 'fill-blank' ||
      exerciseType === 'chinese-to-vietnamese' ||
      exerciseType === 'vietnamese-to-chinese'
    ) {
      exercisePayload.options = options.filter((o) => o.trim().length > 0);
      exercisePayload.correctOptionIndex = correctOptionIndex;
    } else if (exerciseType === 'sentence-order') {
      exercisePayload.sentenceTokens = sentenceTokens.filter((t) => t.trim().length > 0);
      exercisePayload.correctSentence = correctSentence.trim();
    } else if (exerciseType === 'matching') {
      exercisePayload.matchingPairs = matchingPairs.filter((p) => p.hanzi.trim().length > 0);
    }

    const lessonExerciseItem: LessonExerciseItem = {
      id: initialItem?.id || `lex-${section.toLowerCase()}-${Date.now()}`,
      lessonId,
      exerciseId: String(exercisePayload.id),
      section,
      displayOrder: initialItem?.displayOrder ?? nextOrder,
      points: section === 'QUIZ' ? points : undefined,
      exercise: exercisePayload,
    };

    onSave(lessonExerciseItem);
    onClose();
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        width: '100%',
        maxWidth: '780px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.2)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-6)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--foreground)' }}>
            {initialItem ? 'Chỉnh sửa' : 'Thêm mới'} {section === 'QUIZ' ? 'Câu hỏi kiểm tra' : 'Bài tập'} (Exercise Engine)
          </h3>
          <p style={{ margin: '3px 0 0', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
            {section === 'QUIZ'
              ? 'Sử dụng chung SharedExerciseItem với trường điểm số riêng cho kỳ đánh giá.'
              : 'Bài tập tương tác chuẩn hóa tái sử dụng chung cho Luyện tập & Kiểm tra.'}
          </p>
        </div>
        <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Content Body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-5) var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        {/* Section & Type Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: section === 'QUIZ' ? '1fr 140px' : '1fr', gap: 'var(--space-3)' }}>
          <div className="lcm-form-group">
            <label className="lcm-form-label">Loại bài tập tương tác</label>
            <select
              className="lcm-form-select"
              value={exerciseType}
              onChange={(e) => setExerciseType(e.target.value as ExerciseType)}
            >
              {SUPPORTED_TYPES.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {section === 'QUIZ' && (
            <div className="lcm-form-group">
              <label className="lcm-form-label">Điểm số (Points)</label>
              <input
                type="number"
                min={1}
                step={5}
                className="lcm-form-input"
                value={points}
                onChange={(e) => setPoints(Math.max(1, Number(e.target.value)))}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div className="lcm-form-group">
            <label className="lcm-form-label">Tiêu đề bài tập</label>
            <input
              type="text"
              className="lcm-form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Điền từ vào chỗ trống"
            />
          </div>

          <div className="lcm-form-group">
            <label className="lcm-form-label">Hướng dẫn làm bài</label>
            <input
              type="text"
              className="lcm-form-input"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Chọn từ chính xác để hoàn thành câu:"
            />
          </div>
        </div>

        {/* Prompts */}
        <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--foreground)', marginBottom: 'var(--space-2)' }}>
            Đề bài & Dữ liệu hiển thị (Prompts)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <input
              type="text"
              className="lcm-form-input"
              placeholder="Hán tự (Hanzi): 我 ___ 喝茶。"
              value={promptHanzi}
              onChange={(e) => setPromptHanzi(e.target.value)}
              style={{ fontFamily: 'var(--font-hanzi)' }}
            />
            <input
              type="text"
              className="lcm-form-input"
              placeholder="Phiên âm: Wǒ ___ hē chá."
              value={promptPinyin}
              onChange={(e) => setPromptPinyin(e.target.value)}
            />
          </div>
          <input
            type="text"
            className="lcm-form-input"
            placeholder="Dịch nghĩa gợi ý: Tôi muốn uống trà."
            value={promptVietnamese}
            onChange={(e) => setPromptVietnamese(e.target.value)}
          />
        </div>

        {/* Type-specific Fields */}
        {(exerciseType === 'multiple-choice' ||
          exerciseType === 'fill-blank' ||
          exerciseType === 'chinese-to-vietnamese' ||
          exerciseType === 'vietnamese-to-chinese') && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <label className="lcm-form-label" style={{ margin: 0 }}>
                Các lựa chọn đáp án (Chọn radio để đánh dấu đáp án đúng)
              </label>
              <button
                type="button"
                className="ds-btn ds-btn-ghost ds-btn-xs"
                onClick={() => setOptions([...options, ''])}
              >
                <Plus size={13} /> Thêm lựa chọn
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: correctOptionIndex === idx ? 'var(--primary-light)' : 'var(--background)',
                    border: `1px solid ${correctOptionIndex === idx ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                >
                  <input
                    type="radio"
                    name="correct-option"
                    checked={correctOptionIndex === idx}
                    onChange={() => setCorrectOptionIndex(idx)}
                    title="Chọn làm đáp án đúng"
                  />
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, width: '20px', color: 'var(--muted)' }}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <input
                    type="text"
                    className="lcm-form-input"
                    value={opt}
                    onChange={(e) => {
                      const updated = [...options];
                      updated[idx] = e.target.value;
                      setOptions(updated);
                    }}
                    placeholder={`Nội dung lựa chọn ${String.fromCharCode(65 + idx)}...`}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      className="ds-btn ds-btn-ghost ds-btn-xs"
                      onClick={() => {
                        const updated = options.filter((_, i) => i !== idx);
                        setOptions(updated);
                        if (correctOptionIndex >= updated.length) {
                          setCorrectOptionIndex(0);
                        }
                      }}
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {exerciseType === 'sentence-order' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="lcm-form-group">
              <label className="lcm-form-label">Câu hoàn chỉnh đúng (Correct Sentence)</label>
              <input
                type="text"
                className="lcm-form-input"
                value={correctSentence}
                onChange={(e) => setCorrectSentence(e.target.value)}
                placeholder="你想喝什么？"
                style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-base)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <label className="lcm-form-label" style={{ margin: 0 }}>
                  Các khối từ xáo trộn để học viên chạm/sắp xếp
                </label>
                <button
                  type="button"
                  className="ds-btn ds-btn-ghost ds-btn-xs"
                  onClick={() => setSentenceTokens([...sentenceTokens, ''])}
                >
                  <Plus size={13} /> Thêm từ
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 'var(--space-2)' }}>
                {sentenceTokens.map((tok, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '2px' }}>
                    <input
                      type="text"
                      className="lcm-form-input"
                      value={tok}
                      onChange={(e) => {
                        const updated = [...sentenceTokens];
                        updated[idx] = e.target.value;
                        setSentenceTokens(updated);
                      }}
                      placeholder={`Từ ${idx + 1}`}
                      style={{ fontFamily: 'var(--font-hanzi)', textAlign: 'center' }}
                    />
                    {sentenceTokens.length > 2 && (
                      <button
                        type="button"
                        className="ds-btn ds-btn-ghost ds-btn-xs"
                        onClick={() => setSentenceTokens(sentenceTokens.filter((_, i) => i !== idx))}
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {exerciseType === 'matching' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <label className="lcm-form-label" style={{ margin: 0 }}>
                Các cặp nối tương ứng (Chữ Hán ↔ Dịch nghĩa)
              </label>
              <button
                type="button"
                className="ds-btn ds-btn-ghost ds-btn-xs"
                onClick={() =>
                  setMatchingPairs([...matchingPairs, { id: String(Date.now()), hanzi: '', meaning: '' }])
                }
              >
                <Plus size={13} /> Thêm cặp
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {matchingPairs.map((pair, idx) => (
                <div key={pair.id || idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, width: '20px', color: 'var(--muted)' }}>
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    className="lcm-form-input"
                    placeholder="Chữ Hán (Ví dụ: 咖啡)"
                    value={pair.hanzi}
                    onChange={(e) => {
                      const updated = [...matchingPairs];
                      updated[idx].hanzi = e.target.value;
                      setMatchingPairs(updated);
                    }}
                    style={{ fontFamily: 'var(--font-hanzi)' }}
                  />
                  <input
                    type="text"
                    className="lcm-form-input"
                    placeholder="Nghĩa tiếng Việt (Ví dụ: Cà phê)"
                    value={pair.meaning}
                    onChange={(e) => {
                      const updated = [...matchingPairs];
                      updated[idx].meaning = e.target.value;
                      setMatchingPairs(updated);
                    }}
                  />
                  {matchingPairs.length > 2 && (
                    <button
                      type="button"
                      className="ds-btn ds-btn-ghost ds-btn-xs"
                      onClick={() => setMatchingPairs(matchingPairs.filter((_, i) => i !== idx))}
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explanation */}
        <div className="lcm-form-group">
          <label className="lcm-form-label">Giải thích chi tiết (Feedback Explanation)</label>
          <textarea
            className="lcm-form-textarea"
            rows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Giải thích vì sao đáp án đúng và phân tích ngữ pháp liên quan..."
          />
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: 'var(--space-3) var(--space-6)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 'var(--space-2)',
          backgroundColor: 'var(--background)',
        }}
      >
        <button type="button" className="ds-btn ds-btn-outline ds-btn-sm" onClick={onClose}>
          Hủy bỏ
        </button>
        <button type="button" className="ds-btn ds-btn-primary ds-btn-sm" onClick={handleSave}>
          <Save size={15} /> Lưu {section === 'QUIZ' ? 'câu hỏi' : 'bài tập'}
        </button>
      </div>
    </div>
  );
};

export const ExerciseEditorModal: React.FC<ExerciseEditorModalProps> = ({
  isOpen,
  onClose,
  section,
  initialItem,
  lessonId,
  nextOrder,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(3px)',
        zIndex: 65,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
    >
      <ExerciseEditorDialogContent
        key={initialItem?.id || 'new-exercise'}
        section={section}
        initialItem={initialItem}
        lessonId={lessonId}
        nextOrder={nextOrder}
        onClose={onClose}
        onSave={onSave}
      />
    </div>
  );
};
