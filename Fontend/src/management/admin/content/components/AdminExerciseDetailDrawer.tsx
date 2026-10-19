import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  Save,
  Eye,
  BookOpen,
  HelpCircle,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ContentStatusBadge } from './ContentStatusBadge';
import { AdminExerciseEnginePreviewHost } from './AdminExerciseEnginePreviewHost';
import type {
  AdminExerciseItem,
  UpdateAdminExerciseDTO,
} from '../types/admin-content.types';
import type {
  SkillCategory,
  MatchingPair,
} from '../../../../features/exercise-engine/types';
import type { ContentStatus } from '../types/common-content.types';

export interface AdminExerciseDetailDrawerProps {
  isOpen: boolean;
  exercise: AdminExerciseItem | null;
  onClose: () => void;
  onSave: (id: string, dto: UpdateAdminExerciseDTO) => void;
  onDelete?: (id: string) => void;
  onNavigateToGrammar?: (grammarId: string) => void;
  onNavigateToLesson?: (lessonId: string) => void;
}

const SKILLS: Array<{ id: SkillCategory; label: string }> = [
  { id: 'vocabulary', label: 'Từ vựng (Vocabulary)' },
  { id: 'grammar', label: 'Ngữ pháp (Grammar)' },
  { id: 'listening', label: 'Nghe (Listening)' },
  { id: 'reading', label: 'Đọc hiểu (Reading)' },
  { id: 'sentence', label: 'Cấu trúc câu (Sentence)' },
  { id: 'comprehensive', label: 'Luyện tổng hợp (Comprehensive)' },
];

export const AdminExerciseDetailDrawer: React.FC<AdminExerciseDetailDrawerProps> = ({
  isOpen,
  exercise,
  onClose,
  onSave,
  onDelete,
  onNavigateToGrammar,
  onNavigateToLesson,
}) => {
  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'EDITOR' | 'METADATA'>('PREVIEW');
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [instruction, setInstruction] = useState('');
  const [hskLevel, setHskLevel] = useState<number>(2);
  const [skill, setSkill] = useState<SkillCategory>('grammar');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [status, setStatus] = useState<ContentStatus>('PUBLISHED');
  const [promptHanzi, setPromptHanzi] = useState('');
  const [promptPinyin, setPromptPinyin] = useState('');
  const [promptVietnamese, setPromptVietnamese] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);
  const [sentenceTokens, setSentenceTokens] = useState<string[]>([]);
  const [correctSentence, setCorrectSentence] = useState('');
  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>([]);
  const [explanation, setExplanation] = useState('');
  const [xpReward, setXpReward] = useState<number>(3);
  const [grammarPointId, setGrammarPointId] = useState<string | undefined>(undefined);
  const [lessonId, setLessonId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (exercise) {
      setTitle(exercise.title);
      setInstruction(exercise.instruction);
      setHskLevel(exercise.hskLevel);
      setSkill(exercise.skill);
      setDifficulty(exercise.difficulty);
      setStatus(exercise.status);
      setPromptHanzi(exercise.promptHanzi || '');
      setPromptPinyin(exercise.promptPinyin || '');
      setPromptVietnamese(exercise.promptVietnamese || '');
      setOptions(exercise.options && exercise.options.length > 0 ? [...exercise.options] : ['', '', '', '']);
      setCorrectOptionIndex(exercise.correctOptionIndex ?? 0);
      setSentenceTokens(exercise.sentenceTokens ? [...exercise.sentenceTokens] : []);
      setCorrectSentence(exercise.correctSentence || '');
      setMatchingPairs(exercise.matchingPairs ? exercise.matchingPairs.map((m) => ({ ...m })) : []);
      setExplanation(exercise.explanation);
      setXpReward(exercise.xpReward);
      setGrammarPointId(exercise.grammarPointId);
      setLessonId(exercise.lessonId);
      setIsEditing(false);
    }
  }, [exercise]);

  if (!isOpen || !exercise) return null;

  const handleSave = () => {
    onSave(exercise.id, {
      title,
      instruction,
      hskLevel,
      skill,
      difficulty,
      status,
      promptHanzi: promptHanzi.trim() || undefined,
      promptPinyin: promptPinyin.trim() || undefined,
      promptVietnamese: promptVietnamese.trim() || undefined,
      options: options.filter((o) => o.trim().length > 0),
      correctOptionIndex,
      sentenceTokens: sentenceTokens.filter((t) => t.trim().length > 0),
      correctSentence: correctSentence.trim() || undefined,
      matchingPairs: matchingPairs.length > 0 ? matchingPairs : undefined,
      explanation,
      xpReward,
      grammarPointId: grammarPointId?.trim() || undefined,
      lessonId: lessonId?.trim() || undefined,
    });
    setIsEditing(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '700px',
          height: '100%',
          backgroundColor: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          animation: 'slideInRight 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  backgroundColor: '#FFF0F1',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'monospace',
                }}
              >
                {exercise.id}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                HSK {exercise.hskLevel}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                }}
              >
                {exercise.type}
              </span>
              <ContentStatusBadge status={exercise.status} />
            </div>
            <h2
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: '6px 0 0 0',
              }}
            >
              {exercise.title}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {!isEditing ? (
              <button
                type="button"
                className="ds-btn ds-btn-secondary"
                onClick={() => {
                  setIsEditing(true);
                  setActiveTab('EDITOR');
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '34px' }}
              >
                <Edit3 size={14} />
                <span>Biên tập</span>
              </button>
            ) : (
              <button
                type="button"
                className="ds-btn ds-btn-primary"
                onClick={handleSave}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '34px' }}
              >
                <Save size={14} />
                <span>Lưu câu hỏi</span>
              </button>
            )}

            <button
              type="button"
              className="ds-btn ds-btn-ghost"
              onClick={onClose}
              aria-label="Đóng drawer"
              style={{ padding: '6px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            padding: '0 var(--space-5)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('PREVIEW')}
            style={{
              padding: '12px 16px',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              borderBottom: activeTab === 'PREVIEW' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'PREVIEW' ? 'var(--primary)' : 'var(--muted)',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Eye size={14} />
            <span>Xem trước học viên (Exercise Engine)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('EDITOR')}
            style={{
              padding: '12px 16px',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              borderBottom: activeTab === 'EDITOR' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'EDITOR' ? 'var(--primary)' : 'var(--muted)',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Edit3 size={14} />
            <span>Biên tập nội dung</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('METADATA')}
            style={{
              padding: '12px 16px',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              borderBottom: activeTab === 'METADATA' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'METADATA' ? 'var(--primary)' : 'var(--muted)',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Layers size={14} />
            <span>Liên kết & Siêu dữ liệu</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5)' }}>
          {activeTab === 'PREVIEW' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  color: '#15803D',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={14} />
                <span>
                  Thành phần bên dưới được render bởi chính <strong>ExerciseRenderer</strong> của hệ thống học viên:
                </span>
              </div>

              {/* Reusable Exercise Engine Preview Host */}
              <AdminExerciseEnginePreviewHost exercise={exercise} />

              {/* Explanation card */}
              <div
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--background)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  Lời giải thích chuẩn cho học viên:
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-main)', lineHeight: 1.6 }}>
                  {exercise.explanation}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'EDITOR' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Tiêu đề câu hỏi
                  </label>
                  <input
                    type="text"
                    className="ds-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ width: '100%', height: '36px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Yêu cầu / Hướng dẫn làm bài
                  </label>
                  <input
                    type="text"
                    className="ds-input"
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    style={{ width: '100%', height: '36px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Cấp độ HSK (1 - 6)
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
                    Kỹ năng kiểm tra
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
                    <option value="easy">Dễ (Easy)</option>
                    <option value="medium">Trung bình (Medium)</option>
                    <option value="hard">Khó (Hard)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Trạng thái xuất bản
                  </label>
                  <select
                    className="ds-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ContentStatus)}
                    style={{ width: '100%', height: '36px' }}
                  >
                    <option value="PUBLISHED">Đã xuất bản (PUBLISHED)</option>
                    <option value="PENDING_REVIEW">Chờ duyệt (PENDING_REVIEW)</option>
                    <option value="DRAFT">Bản nháp (DRAFT)</option>
                    <option value="ARCHIVED">Lưu trữ (ARCHIVED)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Phần thưởng XP
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

              {/* Prompt Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Đề bài chữ Hán (Prompt Hanzi)
                  </label>
                  <input
                    type="text"
                    className="ds-input"
                    value={promptHanzi}
                    onChange={(e) => setPromptHanzi(e.target.value)}
                    placeholder="e.g. 请给我一 ___ 咖啡。"
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
                    value={promptPinyin}
                    onChange={(e) => setPromptPinyin(e.target.value)}
                    placeholder="e.g. Qǐng gěi wǒ yī ___ kāfēi."
                    style={{ width: '100%', height: '36px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Bản dịch đề bài tiếng Việt
                </label>
                <input
                  type="text"
                  className="ds-input"
                  value={promptVietnamese}
                  onChange={(e) => setPromptVietnamese(e.target.value)}
                  placeholder="e.g. Xin cho tôi một cốc cà phê."
                  style={{ width: '100%', height: '36px' }}
                />
              </div>

              {/* Multiple Choice Options */}
              {(exercise.type === 'multiple-choice' ||
                exercise.type === 'fill-blank' ||
                exercise.type === 'listen-choice' ||
                exercise.type === 'chinese-to-vietnamese' ||
                exercise.type === 'vietnamese-to-chinese') && (
                <div
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--background)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Danh sách các phương án trả lời & Chọn đáp án đúng:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {options.map((opt, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="radio"
                          name="correctOptionRadio"
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
                          style={{ flex: 1, height: '32px', fontSize: 'var(--text-xs)' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sentence Order Tokens */}
              {exercise.type === 'sentence-order' && (
                <div
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--background)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Các mảnh từ rời (Tokens) - Cách nhau bằng dấu phẩy:
                  </label>
                  <input
                    type="text"
                    className="ds-input"
                    value={sentenceTokens.join(', ')}
                    onChange={(e) => {
                      const tokens = e.target.value.split(',').map((t) => t.trim());
                      setSentenceTokens(tokens);
                    }}
                    placeholder="e.g. 喝, 我, 茶, 想"
                    style={{ width: '100%', height: '36px', marginBottom: '8px' }}
                  />
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Câu hoàn chỉnh chuẩn:
                  </label>
                  <input
                    type="text"
                    className="ds-input"
                    value={correctSentence}
                    onChange={(e) => setCorrectSentence(e.target.value)}
                    placeholder="e.g. 我想喝茶"
                    style={{ width: '100%', height: '36px' }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Lời giải thích chi tiết
                </label>
                <textarea
                  className="ds-input"
                  rows={3}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                <button
                  type="button"
                  className="ds-btn ds-btn-primary"
                  onClick={handleSave}
                  style={{ height: '34px', fontSize: 'var(--text-xs)' }}
                >
                  Lưu thay đổi biên tập
                </button>
              </div>
            </div>
          )}

          {activeTab === 'METADATA' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div
                style={{
                  padding: 'var(--space-4)',
                  backgroundColor: '#F8FAFC',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-main)' }}>
                  Quan hệ & Điều hướng liên kết:
                </div>

                {/* Linked Grammar Point */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)' }}>
                    <HelpCircle size={16} color="var(--primary)" />
                    <span>Điểm ngữ pháp kiểm tra:</span>
                    <strong>{exercise.grammarPointId || 'Chưa liên kết'}</strong>
                  </div>

                  {exercise.grammarPointId && onNavigateToGrammar && (
                    <button
                      type="button"
                      className="ds-btn ds-btn-secondary"
                      style={{ height: '30px', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => onNavigateToGrammar(exercise.grammarPointId!)}
                    >
                      <span>Xem điểm ngữ pháp</span>
                      <ExternalLink size={12} />
                    </button>
                  )}
                </div>

                {/* Linked Lesson */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)' }}>
                    <BookOpen size={16} color="#059669" />
                    <span>Bài học áp dụng:</span>
                    <strong>{exercise.lessonId || 'Kho chung (Toàn khóa)'}</strong>
                  </div>

                  {exercise.lessonId && onNavigateToLesson && (
                    <button
                      type="button"
                      className="ds-btn ds-btn-secondary"
                      style={{ height: '30px', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => onNavigateToLesson(exercise.lessonId!)}
                    >
                      <span>Mở Lesson Editor</span>
                      <ExternalLink size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Technical properties */}
              <div
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--background)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  fontSize: '11px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                }}
              >
                <div>
                  <span style={{ color: 'var(--muted)' }}>Thời gian tạo:</span>{' '}
                  <strong>{new Date(exercise.createdAt).toLocaleDateString('vi-VN')}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)' }}>Cập nhật lần cuối:</span>{' '}
                  <strong>{new Date(exercise.updatedAt).toLocaleDateString('vi-VN')}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)' }}>Phần thưởng hoàn thành:</span>{' '}
                  <strong>+{exercise.xpReward} XP</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)' }}>Cấp độ lưu trữ:</span>{' '}
                  <strong>{exercise.hskLevelId}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-5)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--background)',
          }}
        >
          {onDelete && (
            <button
              type="button"
              className="ds-btn"
              onClick={() => onDelete(exercise.id)}
              style={{
                color: '#EF4444',
                borderColor: '#FCA5A5',
                height: '34px',
                fontSize: 'var(--text-xs)',
              }}
            >
              Lưu trữ / Xóa
            </button>
          )}

          <button
            type="button"
            className="ds-btn ds-btn-secondary"
            onClick={onClose}
            style={{ height: '34px', fontSize: 'var(--text-xs)', marginLeft: 'auto' }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
