import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Eye,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ContentStatusBadge } from './ContentStatusBadge';
import type {
  AdminGrammarPoint,
  AdminGrammarExample,
  UpdateAdminGrammarDTO,
  GrammarCategory,
} from '../types/admin-content.types';
import type { ContentStatus } from '../types/common-content.types';

export interface AdminGrammarDetailDrawerProps {
  isOpen: boolean;
  grammar: AdminGrammarPoint | null;
  onClose: () => void;
  onSave: (id: string, dto: UpdateAdminGrammarDTO) => void;
  onDelete?: (id: string) => void;
  onNavigateToExercises?: (grammarId: string) => void;
  onNavigateToLesson?: (lessonId: string) => void;
}

const CATEGORIES: GrammarCategory[] = [
  'cơ bản',
  'câu chữ',
  'trợ từ',
  'liên từ',
  'bổ ngữ',
  'phó từ',
];

export const AdminGrammarDetailDrawer: React.FC<AdminGrammarDetailDrawerProps> = ({
  isOpen,
  grammar,
  onClose,
  onSave,
  onDelete,
  onNavigateToExercises,
  onNavigateToLesson,
}) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'EXAMPLES' | 'PREVIEW'>('INFO');
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [pinyinTitle, setPinyinTitle] = useState('');
  const [hskLevel, setHskLevel] = useState<number>(1);
  const [category, setCategory] = useState<GrammarCategory>('cơ bản');
  const [structureFormula, setStructureFormula] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<'Dễ' | 'Trung bình' | 'Khá'>('Dễ');
  const [status, setStatus] = useState<ContentStatus>('PUBLISHED');
  const [examples, setExamples] = useState<AdminGrammarExample[]>([]);
  const [commonMistakeWrong, setCommonMistakeWrong] = useState('');
  const [commonMistakeRight, setCommonMistakeRight] = useState('');
  const [commonMistakeNote, setCommonMistakeNote] = useState('');

  // Interactive preview state
  const [userPracticeAnswer, setUserPracticeAnswer] = useState('');
  const [practiceEvaluated, setPracticeEvaluated] = useState<boolean | null>(null);

  useEffect(() => {
    if (grammar) {
      setCode(grammar.code);
      setTitle(grammar.title);
      setPinyinTitle(grammar.pinyinTitle || '');
      setHskLevel(grammar.hskLevel);
      setCategory(grammar.category);
      setStructureFormula(grammar.structureFormula);
      setExplanation(grammar.explanation);
      setDifficulty(grammar.difficulty);
      setStatus(grammar.status);
      setExamples(grammar.examples.map((e) => ({ ...e })));
      setCommonMistakeWrong(grammar.commonMistake?.wrong || '');
      setCommonMistakeRight(grammar.commonMistake?.right || '');
      setCommonMistakeNote(grammar.commonMistake?.note || '');
      setIsEditing(false);
      setUserPracticeAnswer('');
      setPracticeEvaluated(null);
    }
  }, [grammar]);

  if (!isOpen || !grammar) return null;

  const handleSave = () => {
    onSave(grammar.id, {
      code,
      title,
      pinyinTitle,
      hskLevel,
      category,
      structureFormula,
      explanation,
      difficulty,
      status,
      examples,
      commonMistake:
        commonMistakeWrong.trim() || commonMistakeRight.trim()
          ? {
              wrong: commonMistakeWrong.trim(),
              right: commonMistakeRight.trim(),
              note: commonMistakeNote.trim(),
            }
          : undefined,
    });
    setIsEditing(false);
  };

  const handleAddExample = () => {
    setExamples((prev) => [...prev, { zh: '', pinyin: '', meaningVi: '' }]);
  };

  const handleRemoveExample = (idx: number) => {
    setExamples((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleExampleChange = (idx: number, field: keyof AdminGrammarExample, val: string) => {
    setExamples((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const evaluatePractice = () => {
    if (!grammar.practice) return;
    const cleanUser = userPracticeAnswer.trim().replace(/[。？！\s]/g, '');
    const cleanStd = grammar.practice.standardAnswer.trim().replace(/[。？！\s]/g, '');
    const acceptable = grammar.practice.acceptableAnswers?.map((a) => a.trim().replace(/[。？！\s]/g, '')) || [];
    const isCorrect = cleanUser === cleanStd || acceptable.includes(cleanUser);
    setPracticeEvaluated(isCorrect);
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
          maxWidth: '680px',
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
                }}
              >
                {grammar.code}
              </span>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                HSK {grammar.hskLevel}
              </span>
              <ContentStatusBadge status={grammar.status} />
            </div>
            <h2
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: '6px 0 0 0',
              }}
            >
              {grammar.title}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {!isEditing ? (
              <button
                type="button"
                className="ds-btn ds-btn-secondary"
                onClick={() => setIsEditing(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '34px' }}
              >
                <Edit3 size={14} />
                <span>Chỉnh sửa</span>
              </button>
            ) : (
              <button
                type="button"
                className="ds-btn ds-btn-primary"
                onClick={handleSave}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '34px' }}
              >
                <Save size={14} />
                <span>Lưu thay đổi</span>
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

        {/* Navigation Tabs */}
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
            onClick={() => setActiveTab('INFO')}
            style={{
              padding: '12px 16px',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              borderBottom: activeTab === 'INFO' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'INFO' ? 'var(--primary)' : 'var(--muted)',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
            }}
          >
            Thông tin & Công thức
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('EXAMPLES')}
            style={{
              padding: '12px 16px',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              borderBottom: activeTab === 'EXAMPLES' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'EXAMPLES' ? 'var(--primary)' : 'var(--muted)',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
            }}
          >
            Ví dụ câu ({examples.length})
          </button>
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
            <span>Xem trước học viên (Preview)</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5)' }}>
          {activeTab === 'INFO' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {isEditing ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                        Mã định danh (Code)
                      </label>
                      <input
                        type="text"
                        className="ds-input"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        style={{ width: '100%', height: '36px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                        Cấp độ HSK (1 - 6)
                      </label>
                      <select
                        className="ds-input"
                        value={hskLevel}
                        onChange={(e) => setHskLevel(Number(e.target.value))}
                        style={{ width: '100%', height: '36px' }}
                      >
                        {[1, 2, 3, 4, 5, 6].map((lvl) => (
                          <option key={lvl} value={lvl}>
                            HSK {lvl}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                        Tên điểm ngữ pháp
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
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                        Phiên âm Pinyin
                      </label>
                      <input
                        type="text"
                        className="ds-input"
                        value={pinyinTitle}
                        onChange={(e) => setPinyinTitle(e.target.value)}
                        style={{ width: '100%', height: '36px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                    <div>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                        Phân loại danh mục
                      </label>
                      <select
                        className="ds-input"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as GrammarCategory)}
                        style={{ width: '100%', height: '36px' }}
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                        Độ khó
                      </label>
                      <select
                        className="ds-input"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as 'Dễ' | 'Trung bình' | 'Khá')}
                        style={{ width: '100%', height: '36px' }}
                      >
                        <option value="Dễ">Dễ</option>
                        <option value="Trung bình">Trung bình</option>
                        <option value="Khá">Khá</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
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
                  </div>

                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                      Công thức cấu trúc chuẩn
                    </label>
                    <input
                      type="text"
                      className="ds-input"
                      value={structureFormula}
                      onChange={(e) => setStructureFormula(e.target.value)}
                      placeholder="e.g. Chủ ngữ + 想 + Động từ + Tân ngữ"
                      style={{ width: '100%', height: '36px', fontFamily: 'monospace' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                      Giải thích ngữ nghĩa & cách dùng (Tiếng Việt)
                    </label>
                    <textarea
                      className="ds-input"
                      rows={4}
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      style={{ width: '100%', padding: '8px' }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      padding: 'var(--space-4)',
                      backgroundColor: 'var(--background)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: '4px' }}>
                      Công thức cấu trúc:
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        fontFamily: 'monospace',
                        backgroundColor: 'var(--surface)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {grammar.structureFormula}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                      Giải thích ngữ nghĩa:
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', lineHeight: 1.6, color: 'var(--text-main)', margin: 0 }}>
                      {grammar.explanation}
                    </p>
                  </div>

                  {/* Deep Linking Hub */}
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
                      Liên kết điều hướng học liệu:
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)' }}>
                        <BookOpen size={16} color="var(--primary)" />
                        <span>Bài học trong giáo trình:</span>
                        <strong>{grammar.linkedLessonIds.length} bài</strong>
                      </div>
                      {grammar.linkedLessonIds.length > 0 && onNavigateToLesson && (
                        <button
                          type="button"
                          className="ds-btn ds-btn-secondary"
                          style={{ height: '30px', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => onNavigateToLesson(grammar.linkedLessonIds[0])}
                        >
                          <span>Mở bài {grammar.linkedLessonIds[0]}</span>
                          <ExternalLink size={12} />
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)' }}>
                        <HelpCircle size={16} color="#059669" />
                        <span>Câu hỏi trong Ngân hàng bài tập:</span>
                        <strong>{grammar.linkedExerciseIds.length} câu</strong>
                      </div>
                      {onNavigateToExercises && (
                        <button
                          type="button"
                          className="ds-btn ds-btn-secondary"
                          style={{ height: '30px', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => onNavigateToExercises(grammar.id)}
                        >
                          <span>Xem câu hỏi liên quan</span>
                          <ExternalLink size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'EXAMPLES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)' }}>
                  Danh sách ví dụ câu có chữ Hán, Pinyin và bản dịch:
                </span>
                {isEditing && (
                  <button
                    type="button"
                    className="ds-btn ds-btn-secondary"
                    onClick={handleAddExample}
                    style={{ height: '30px', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={12} />
                    <span>Thêm ví dụ</span>
                  </button>
                )}
              </div>

              {examples.map((ex, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--background)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>
                      Ví dụ {idx + 1}
                    </span>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveExample(idx)}
                        style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}
                        title="Xóa ví dụ"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        className="ds-input"
                        placeholder="Chữ Hán (e.g. 我想喝茶。)"
                        value={ex.zh}
                        onChange={(e) => handleExampleChange(idx, 'zh', e.target.value)}
                        style={{ width: '100%', height: '32px' }}
                      />
                      <input
                        type="text"
                        className="ds-input"
                        placeholder="Pinyin (e.g. Wǒ xiǎng hē chá.)"
                        value={ex.pinyin}
                        onChange={(e) => handleExampleChange(idx, 'pinyin', e.target.value)}
                        style={{ width: '100%', height: '32px' }}
                      />
                      <input
                        type="text"
                        className="ds-input"
                        placeholder="Nghĩa tiếng Việt (e.g. Tôi muốn uống trà.)"
                        value={ex.meaningVi}
                        onChange={(e) => handleExampleChange(idx, 'meaningVi', e.target.value)}
                        style={{ width: '100%', height: '32px' }}
                      />
                    </>
                  ) : (
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-main)' }}>
                        {ex.zh}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{ex.pinyin}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: '#059669', marginTop: '2px' }}>
                        {ex.meaningVi}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'PREVIEW' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  color: '#1E40AF',
                }}
              >
                Giao diện dưới đây mô phỏng chính xác khung hiển thị học viên trong Thư viện Ngữ pháp FE-9:
              </div>

              {/* Student View Mock Card */}
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid var(--border)',
                  padding: 'var(--space-4)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        backgroundColor: '#FFF0F1',
                        color: 'var(--primary)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 700,
                        fontSize: '11px',
                      }}
                    >
                      HSK {grammar.hskLevel}
                    </span>
                    <span
                      style={{
                        backgroundColor: 'var(--background)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        color: 'var(--muted)',
                      }}
                    >
                      {grammar.category}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Độ khó: {grammar.difficulty}</span>
                </div>

                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '4px 0' }}>{grammar.title}</h3>
                {grammar.pinyinTitle && (
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '12px' }}>
                    {grammar.pinyinTitle}
                  </div>
                )}

                <div
                  style={{
                    backgroundColor: 'var(--background)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '3px solid var(--primary)',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
                    Công thức cấu trúc:
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'monospace' }}>
                    {grammar.structureFormula}
                  </div>
                </div>

                <p style={{ fontSize: 'var(--text-xs)', lineHeight: 1.6, color: 'var(--text-main)', marginBottom: '16px' }}>
                  {grammar.explanation}
                </p>

                {/* Example preview cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)' }}>
                    Ví dụ minh họa:
                  </div>
                  {grammar.examples.slice(0, 3).map((ex, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'var(--background)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-xs)',
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{ex.zh}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{ex.pinyin}</div>
                      <div style={{ color: '#059669', fontSize: '11px' }}>{ex.meaningVi}</div>
                    </div>
                  ))}
                </div>

                {/* Interactive Practice Preview */}
                {grammar.practice && (
                  <div
                    style={{
                      borderTop: '1px solid var(--border)',
                      paddingTop: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>
                      Thử nghiệm bài tập tương tác (Practice Engine):
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-main)' }}>
                      {grammar.practice.prompt}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="ds-input"
                        placeholder="Nhập câu trả lời để kiểm thử..."
                        value={userPracticeAnswer}
                        onChange={(e) => {
                          setUserPracticeAnswer(e.target.value);
                          setPracticeEvaluated(null);
                        }}
                        style={{ flex: 1, height: '32px', fontSize: 'var(--text-xs)' }}
                      />
                      <button
                        type="button"
                        className="ds-btn ds-btn-primary"
                        onClick={evaluatePractice}
                        style={{ height: '32px', fontSize: 'var(--text-xs)', padding: '0 12px' }}
                      >
                        Kiểm tra
                      </button>
                    </div>

                    {practiceEvaluated !== null && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: practiceEvaluated ? '#059669' : '#DC2626',
                        }}
                      >
                        {practiceEvaluated ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                        <span>
                          {practiceEvaluated
                            ? 'Đáp án chính xác!'
                            : `Chưa đúng. Đáp án chuẩn: "${grammar.practice.standardAnswer}"`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
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
              onClick={() => onDelete(grammar.id)}
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
