import React, { useState } from 'react';
import { Plus, ArrowUp, ArrowDown, Trash2, BookMarked, HelpCircle } from 'lucide-react';
import { GrammarPickerModal } from './GrammarPickerModal';
import type { LessonGrammarItem, GrammarPoint } from '../../types';

interface GrammarSectionEditorProps {
  lessonId: string;
  grammars: LessonGrammarItem[];
  onChange: (updatedGrammars: LessonGrammarItem[]) => void;
}

export const GrammarSectionEditor: React.FC<GrammarSectionEditorProps> = ({
  lessonId,
  grammars,
  onChange,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Add grammar from picker
  const handleAddFromPicker = (selectedGrammars: GrammarPoint[]) => {
    const startOrder = grammars.length + 1;
    const newItems: LessonGrammarItem[] = selectedGrammars.map((g, idx) => ({
      id: `lg-${Date.now()}-${idx}`,
      lessonId,
      grammarPointId: g.id,
      displayOrder: startOrder + idx,
      lessonNotes: g.explanation,
      quickPractice: {
        question: g.examples?.[0]?.zh || '我 ___ 学习汉语。',
        pinyin: g.examples?.[0]?.pinyin || 'Wǒ ___ xuéxí Hànyǔ.',
        blankWordTranslation: 'muốn',
        options: ['想', '是', '有', '在'],
        correctIndex: 0,
        explanation: 'Dùng cấu trúc trọng tâm để diễn đạt chính xác.',
      },
      grammarPoint: g,
    }));

    onChange([...grammars, ...newItems]);
  };

  // Detach grammar from lesson
  const handleDetach = (id: string) => {
    const filtered = grammars.filter((g) => g.id !== id);
    const reordered = filtered.map((item, index) => ({
      ...item,
      displayOrder: index + 1,
    }));
    onChange(reordered);
  };

  // Reorder
  const handleMove = (index: number, direction: 'UP' | 'DOWN') => {
    const newIdx = direction === 'UP' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= grammars.length) return;
    const updated = [...grammars];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    const reordered = updated.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }));
    onChange(reordered);
  };

  // Update lesson notes
  const handleUpdateNotes = (id: string, notes: string) => {
    onChange(
      grammars.map((item) =>
        item.id === id ? { ...item, lessonNotes: notes } : item
      )
    );
  };

  // Update quick practice field
  const handleUpdateQuickPractice = (
    id: string,
    field: string,
    val: string | number | string[]
  ) => {
    onChange(
      grammars.map((item) => {
        if (item.id !== id) return item;
        const currentQp = item.quickPractice || {
          question: '',
          pinyin: '',
          blankWordTranslation: '',
          options: ['', '', '', ''],
          correctIndex: 0,
          explanation: '',
        };
        return {
          ...item,
          quickPractice: {
            ...currentQp,
            [field]: val,
          },
        };
      })
    );
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
            <BookMarked size={18} style={{ color: 'var(--primary)' }} />
            <h4 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>
              Điểm ngữ pháp trọng tâm ({grammars.length} điểm)
            </h4>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
            Bài học cần tối thiểu 1 điểm ngữ pháp trọng tâm để giảng dạy.
          </p>
        </div>

        <button
          type="button"
          className="ds-btn ds-btn-primary ds-btn-sm"
          onClick={() => setIsPickerOpen(true)}
        >
          <Plus size={15} /> Thêm điểm ngữ pháp
        </button>
      </div>

      {/* Grammar List */}
      {grammars.length === 0 ? (
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
            Chưa có điểm ngữ pháp nào được gắn vào bài học này.
          </div>
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={() => setIsPickerOpen(true)}
          >
            <Plus size={15} /> Mở kho ngữ pháp HSK
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {grammars.map((item, index) => {
            const isExpanded = expandedItemId === item.id;
            const gp = item.grammarPoint;

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  overflow: 'hidden',
                }}
              >
                {/* Main Grammar Card Row */}
                <div
                  style={{
                    padding: 'var(--space-4)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 'var(--space-3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', flex: 1 }}>
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
                        marginTop: '2px',
                      }}
                    >
                      {item.displayOrder}
                    </span>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)' }}>
                          {gp?.code || '—'}
                        </span>
                        <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--foreground)' }}>
                          {gp?.title || 'Điểm ngữ pháp'}
                        </strong>
                      </div>

                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--primary)',
                          fontWeight: 600,
                          margin: '4px 0',
                          backgroundColor: 'var(--background)',
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {gp?.structureFormula || '—'}
                      </div>

                      <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                        {gp?.explanation || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <button
                      type="button"
                      className="ds-btn ds-btn-ghost ds-btn-xs"
                      onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                    >
                      {isExpanded ? 'Ẩn cấu hình bài học' : 'Ghi chú & Luyện nhanh'}
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
                        disabled={index === grammars.length - 1}
                        onClick={() => handleMove(index, 'DOWN')}
                        title="Di chuyển xuống"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>

                    <button
                      type="button"
                      className="ds-btn ds-btn-ghost ds-btn-xs"
                      onClick={() => handleDetach(item.id)}
                      style={{ color: 'var(--danger)' }}
                      title="Gỡ liên kết khỏi bài học (Không xóa khỏi kho)"
                    >
                      <Trash2 size={13} /> Gỡ khỏi bài
                    </button>
                  </div>
                </div>

                {/* Lesson Notes & Quick Practice Form */}
                {isExpanded && (
                  <div
                    style={{
                      padding: 'var(--space-4)',
                      backgroundColor: 'var(--background)',
                      borderTop: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-4)',
                    }}
                  >
                    <div className="lcm-form-group">
                      <label className="lcm-form-label">Ghi chú giảng dạy riêng cho bài học này:</label>
                      <textarea
                        className="lcm-form-textarea"
                        rows={2}
                        value={item.lessonNotes || ''}
                        onChange={(e) => handleUpdateNotes(item.id, e.target.value)}
                        placeholder="Nhấn mạnh lưu ý, lỗi thường gặp hoặc mẹo ghi nhớ cho học viên..."
                      />
                    </div>

                    {/* Quick Practice Configuration */}
                    <div
                      style={{
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 700,
                          color: 'var(--primary)',
                          marginBottom: 'var(--space-3)',
                        }}
                      >
                        <HelpCircle size={15} />
                        <span>Câu hỏi luyện nhanh ngay sau giải thích (Quick Practice)</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                        <div className="lcm-form-group">
                          <label className="lcm-form-label">Câu hỏi điền khuyết (Hán tự)</label>
                          <input
                            type="text"
                            className="lcm-form-input"
                            value={item.quickPractice?.question || ''}
                            onChange={(e) => handleUpdateQuickPractice(item.id, 'question', e.target.value)}
                            placeholder="我 ___ 喝咖啡。"
                            style={{ fontFamily: 'var(--font-hanzi)' }}
                          />
                        </div>

                        <div className="lcm-form-group">
                          <label className="lcm-form-label">Phiên âm Pinyin</label>
                          <input
                            type="text"
                            className="lcm-form-input"
                            value={item.quickPractice?.pinyin || ''}
                            onChange={(e) => handleUpdateQuickPractice(item.id, 'pinyin', e.target.value)}
                            placeholder="Wǒ ___ hē kāfēi."
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: 'var(--space-3)' }}>
                        <label className="lcm-form-label">4 Lựa chọn đáp án (Chọn radio để xác định đáp án đúng)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-2)' }}>
                          {(item.quickPractice?.options || ['想', '是', '有', '在']).map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-2)',
                                padding: 'var(--space-2)',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: item.quickPractice?.correctIndex === optIdx ? 'var(--primary-light)' : 'var(--background)',
                                border: `1px solid ${item.quickPractice?.correctIndex === optIdx ? 'var(--primary)' : 'var(--border)'}`,
                              }}
                            >
                              <input
                                type="radio"
                                name={`qp-correct-${item.id}`}
                                checked={item.quickPractice?.correctIndex === optIdx}
                                onChange={() => handleUpdateQuickPractice(item.id, 'correctIndex', optIdx)}
                                title="Đánh dấu đáp án đúng"
                              />
                              <input
                                type="text"
                                className="lcm-form-input"
                                value={opt}
                                onChange={(e) => {
                                  const opts = [...(item.quickPractice?.options || ['', '', '', ''])];
                                  opts[optIdx] = e.target.value;
                                  handleUpdateQuickPractice(item.id, 'options', opts);
                                }}
                                style={{ padding: '3px 8px', fontSize: 'var(--text-xs)' }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginTop: 'var(--space-3)' }} className="lcm-form-group">
                        <label className="lcm-form-label">Giải thích chi tiết khi học viên chọn</label>
                        <input
                          type="text"
                          className="lcm-form-input"
                          value={item.quickPractice?.explanation || ''}
                          onChange={(e) => handleUpdateQuickPractice(item.id, 'explanation', e.target.value)}
                          placeholder="Dùng trợ động từ 想 để biểu thị..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Grammar Picker Modal */}
      <GrammarPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        attachedGrammarPointIds={grammars.map((g) => g.grammarPointId)}
        onSelectGrammars={handleAddFromPicker}
      />
    </div>
  );
};
