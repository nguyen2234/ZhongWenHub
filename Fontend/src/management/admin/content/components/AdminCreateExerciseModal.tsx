import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { CreateAdminExerciseDTO } from '../types/admin-content.types';
import type { ExerciseType, SkillCategory, MatchingPair } from '../../../../features/exercise-engine/types';

export interface AdminCreateExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateAdminExerciseDTO) => void;
  prefilledGrammarId?: string;
  prefilledLessonId?: string;
  prefilledHskLevel?: number;
}

const SUPPORTED_TYPES: Array<{ type: ExerciseType; label: string }> = [
  { type: 'multiple-choice', label: 'Trắc nghiệm chọn 1 đáp án (Multiple Choice)' },
  { type: 'fill-blank', label: 'Điền từ vào chỗ trống (Fill Blank)' },
  { type: 'sentence-order', label: 'Sắp xếp trật tự câu (Sentence Order)' },
  { type: 'matching', label: 'Nối từ tương ứng (Matching)' },
  { type: 'chinese-to-vietnamese', label: 'Dịch Hán sang Việt (ZH → VI)' },
  { type: 'vietnamese-to-chinese', label: 'Dịch Việt sang Hán (VI → ZH)' },
  { type: 'listen-choice', label: 'Nghe và chọn đáp án (Listening Choice)' },
];

const SKILLS: Array<{ id: SkillCategory; label: string }> = [
  { id: 'vocabulary', label: 'Từ vựng (Vocabulary)' },
  { id: 'grammar', label: 'Ngữ pháp (Grammar)' },
  { id: 'listening', label: 'Nghe (Listening)' },
  { id: 'reading', label: 'Đọc hiểu (Reading)' },
  { id: 'sentence', label: 'Cấu trúc câu (Sentence)' },
  { id: 'comprehensive', label: 'Luyện tổng hợp (Comprehensive)' },
];

export const AdminCreateExerciseModal: React.FC<AdminCreateExerciseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  prefilledGrammarId,
  prefilledLessonId,
  prefilledHskLevel = 2,
}) => {
  const [exerciseType, setExerciseType] = useState<ExerciseType>('multiple-choice');
  const [skill, setSkill] = useState<SkillCategory>('grammar');
  const [hskLevel, setHskLevel] = useState<number>(prefilledHskLevel);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [title, setTitle] = useState('');
  const [instruction, setInstruction] = useState('Chọn đáp án chính xác:');
  const [promptHanzi, setPromptHanzi] = useState('');
  const [promptPinyin, setPromptPinyin] = useState('');
  const [promptVietnamese, setPromptVietnamese] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);
  const [sentenceTokensInput, setSentenceTokensInput] = useState('');
  const [correctSentence, setCorrectSentence] = useState('');
  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>([
    { id: '1', hanzi: '', meaning: '' },
    { id: '2', hanzi: '', meaning: '' },
  ]);
  const [explanation, setExplanation] = useState('');
  const [grammarPointId, setGrammarPointId] = useState(prefilledGrammarId || '');
  const [lessonId, setLessonId] = useState(prefilledLessonId || '');
  const [xpReward, setXpReward] = useState(3);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề câu hỏi.');
      return;
    }
    if (!instruction.trim()) {
      setErrorMsg('Vui lòng nhập hướng dẫn làm bài.');
      return;
    }
    if (!explanation.trim()) {
      setErrorMsg('Vui lòng nhập lời giải thích chuẩn.');
      return;
    }

    if (
      exerciseType === 'multiple-choice' ||
      exerciseType === 'fill-blank' ||
      exerciseType === 'listen-choice' ||
      exerciseType === 'chinese-to-vietnamese' ||
      exerciseType === 'vietnamese-to-chinese'
    ) {
      const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
      if (validOptions.length < 2) {
        setErrorMsg('Dạng bài này cần tối thiểu 2 phương án trả lời.');
        return;
      }
      if (correctOptionIndex < 0 || correctOptionIndex >= validOptions.length) {
        setErrorMsg('Vui lòng chọn đáp án đúng hợp lệ.');
        return;
      }
    }

    if (exerciseType === 'sentence-order') {
      const tokens = sentenceTokensInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      if (tokens.length < 2) {
        setErrorMsg('Dạng sắp xếp câu cần tối thiểu 2 mảnh từ rời.');
        return;
      }
      if (!correctSentence.trim()) {
        setErrorMsg('Vui lòng nhập câu hoàn chỉnh chuẩn.');
        return;
      }
    }

    if (exerciseType === 'matching') {
      const validPairs = matchingPairs.filter((p) => p.hanzi.trim() && p.meaning.trim());
      if (validPairs.length < 2) {
        setErrorMsg('Dạng bài nối từ cần tối thiểu 2 cặp Hán - Nghĩa tương ứng.');
        return;
      }
    }

    // Default status: strictly DRAFT per requirement
    onSubmit({
      type: exerciseType,
      skill,
      hskLevel,
      difficulty,
      status: 'DRAFT',
      title: title.trim(),
      instruction: instruction.trim(),
      promptHanzi: promptHanzi.trim() || undefined,
      promptPinyin: promptPinyin.trim() || undefined,
      promptVietnamese: promptVietnamese.trim() || undefined,
      options: options.map((o) => o.trim()).filter((o) => o.length > 0),
      correctOptionIndex,
      sentenceTokens: sentenceTokensInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
      correctSentence: correctSentence.trim() || undefined,
      matchingPairs: matchingPairs.filter((p) => p.hanzi.trim() && p.meaning.trim()),
      explanation: explanation.trim(),
      grammarPointId: grammarPointId.trim() || undefined,
      lessonId: lessonId.trim() || undefined,
      xpReward,
    });

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--background)',
          }}
        >
          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>
              Tạo mới Câu hỏi Bài tập
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
              Nội dung tạo mới sẽ ở trạng thái Bản nháp (DRAFT) để đảm bảo chất lượng
            </span>
          </div>
          <button type="button" className="ds-btn ds-btn-ghost" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {errorMsg && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: 'var(--radius-sm)',
                color: '#991B1B',
                fontSize: 'var(--text-xs)',
              }}
            >
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Dạng bài tập (Exercise Engine Type) *
              </label>
              <select
                className="ds-input"
                value={exerciseType}
                onChange={(e) => setExerciseType(e.target.value as ExerciseType)}
                style={{ width: '100%', height: '36px' }}
              >
                {SUPPORTED_TYPES.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Kỹ năng trọng tâm *
              </label>
              <select
                className="ds-input"
                value={skill}
                onChange={(e) => setSkill(e.target.value as SkillCategory)}
                style={{ width: '100%', height: '36px' }}
              >
                {SKILLS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Cấp độ HSK *
              </label>
              <select
                className="ds-input"
                value={hskLevel}
                onChange={(e) => setHskLevel(Number(e.target.value))}
                style={{ width: '100%', height: '36px' }}
              >
                {[1, 2, 3, 4, 5, 6].map((l) => (
                  <option key={l} value={l}>
                    HSK {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Độ khó
              </label>
              <select
                className="ds-input"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                style={{ width: '100%', height: '36px' }}
              >
                <option value="easy">Dễ</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Khó</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Điểm XP
              </label>
              <input
                type="number"
                className="ds-input"
                value={xpReward}
                onChange={(e) => setXpReward(Number(e.target.value))}
                style={{ width: '100%', height: '36px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Tiêu đề câu hỏi *
            </label>
            <input
              type="text"
              className="ds-input"
              placeholder="e.g. Điền lượng từ phù hợp cho đồ uống"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', height: '36px' }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Yêu cầu đề bài *
            </label>
            <input
              type="text"
              className="ds-input"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              style={{ width: '100%', height: '36px' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Đề bài Chữ Hán (tùy chọn)
              </label>
              <input
                type="text"
                className="ds-input"
                placeholder="e.g. 请给我一 ___ 咖啡。"
                value={promptHanzi}
                onChange={(e) => setPromptHanzi(e.target.value)}
                style={{ width: '100%', height: '36px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Phiên âm Pinyin
              </label>
              <input
                type="text"
                className="ds-input"
                placeholder="e.g. Qǐng gěi wǒ yī ___ kāfēi."
                value={promptPinyin}
                onChange={(e) => setPromptPinyin(e.target.value)}
                style={{ width: '100%', height: '36px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Bản dịch tiếng Việt (tùy chọn)
            </label>
            <input
              type="text"
              className="ds-input"
              placeholder="e.g. Xin cho tôi một cốc cà phê."
              value={promptVietnamese}
              onChange={(e) => setPromptVietnamese(e.target.value)}
              style={{ width: '100%', height: '36px' }}
            />
          </div>

          {/* Type specific: Options for Multiple choice / Fill blank */}
          {(exerciseType === 'multiple-choice' ||
            exerciseType === 'fill-blank' ||
            exerciseType === 'listen-choice' ||
            exerciseType === 'chinese-to-vietnamese' ||
            exerciseType === 'vietnamese-to-chinese') && (
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Nhập phương án và tích chọn phương án ĐÚNG:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {options.map((opt, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="radio"
                      name="newCorrectOptionRadio"
                      checked={correctOptionIndex === idx}
                      onChange={() => setCorrectOptionIndex(idx)}
                      style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '11px', fontWeight: 700, width: '20px' }}>
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <input
                      type="text"
                      className="ds-input"
                      value={opt}
                      onChange={(e) => {
                        const next = [...options];
                        next[idx] = e.target.value;
                        setOptions(next);
                      }}
                      placeholder={`Lựa chọn ${String.fromCharCode(65 + idx)}`}
                      style={{ flex: 1, height: '30px', fontSize: 'var(--text-xs)' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Type specific: Sentence order */}
          {exerciseType === 'sentence-order' && (
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Các mảnh từ (ngăn cách bằng dấu phẩy) *
              </label>
              <input
                type="text"
                className="ds-input"
                placeholder="e.g. 喝, 我, 茶, 想"
                value={sentenceTokensInput}
                onChange={(e) => setSentenceTokensInput(e.target.value)}
                style={{ width: '100%', height: '34px', marginBottom: '6px' }}
              />
              <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Câu ghép hoàn chỉnh chuẩn *
              </label>
              <input
                type="text"
                className="ds-input"
                placeholder="e.g. 我想喝茶"
                value={correctSentence}
                onChange={(e) => setCorrectSentence(e.target.value)}
                style={{ width: '100%', height: '34px' }}
              />
            </div>
          )}

          {/* Type specific: Matching pairs */}
          {exerciseType === 'matching' && (
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Các cặp từ nối tương ứng (Chữ Hán - Nghĩa tiếng Việt) *
              </label>
              {matchingPairs.map((pair, idx) => (
                <div key={pair.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '6px' }}>
                  <input
                    type="text"
                    className="ds-input"
                    placeholder={`Chữ Hán cặp ${idx + 1} (e.g. 咖啡)`}
                    value={pair.hanzi}
                    onChange={(e) => {
                      const next = [...matchingPairs];
                      next[idx] = { ...next[idx], hanzi: e.target.value };
                      setMatchingPairs(next);
                    }}
                    style={{ height: '32px', fontSize: 'var(--text-xs)' }}
                  />
                  <input
                    type="text"
                    className="ds-input"
                    placeholder={`Nghĩa tiếng Việt cặp ${idx + 1} (e.g. Cà phê)`}
                    value={pair.meaning}
                    onChange={(e) => {
                      const next = [...matchingPairs];
                      next[idx] = { ...next[idx], meaning: e.target.value };
                      setMatchingPairs(next);
                    }}
                    style={{ height: '32px', fontSize: 'var(--text-xs)' }}
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Lời giải thích đáp án *
            </label>
            <textarea
              className="ds-input"
              rows={3}
              placeholder="Giải thích vì sao chọn đáp án này, dẫn chứng ngữ pháp..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Mã điểm ngữ pháp liên kết (tùy chọn)
              </label>
              <input
                type="text"
                className="ds-input"
                placeholder="e.g. g-hsk2-01"
                value={grammarPointId}
                onChange={(e) => setGrammarPointId(e.target.value)}
                style={{ width: '100%', height: '34px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Mã bài học liên kết (tùy chọn)
              </label>
              <input
                type="text"
                className="ds-input"
                placeholder="e.g. les-8"
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                style={{ width: '100%', height: '34px' }}
              />
            </div>
          </div>

          <div
            style={{
              paddingTop: 'var(--space-3)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
            }}
          >
            <button type="button" className="ds-btn ds-btn-secondary" onClick={onClose} style={{ height: '34px' }}>
              Hủy
            </button>
            <button type="submit" className="ds-btn ds-btn-primary" style={{ height: '34px' }}>
              Tạo câu hỏi (Bản nháp)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
