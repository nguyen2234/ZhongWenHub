import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Headphones, Volume2, CheckCircle2 } from 'lucide-react';
import type { LessonListeningItem } from '../../types';

interface ListeningSectionEditorProps {
  lessonId: string;
  listenings: LessonListeningItem[];
  onChange: (updatedListenings: LessonListeningItem[]) => void;
}

export const ListeningSectionEditor: React.FC<ListeningSectionEditorProps> = ({
  lessonId,
  listenings,
  onChange,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number>(0);

  const handleAddActivity = () => {
    const newIdx = listenings.length + 1;
    const newItem: LessonListeningItem = {
      id: `lis-${Date.now()}`,
      lessonId,
      title: `Luyện nghe số ${newIdx}`,
      audioUrl: `https://assets.zhongwenhub.com/audio/listening-${newIdx}.mp3`,
      transcriptZh: '',
      transcriptPinyin: '',
      transcriptVi: '',
      prompt: 'Lắng nghe đoạn ghi âm sau và chọn đáp án chính xác:',
      options: [
        { id: 1, text: 'Lựa chọn A', isCorrect: true },
        { id: 2, text: 'Lựa chọn B', isCorrect: false },
        { id: 3, text: 'Lựa chọn C', isCorrect: false },
      ],
      explanation: 'Giải thích chi tiết theo nội dung đoạn ghi âm.',
      displayOrder: newIdx,
    };

    onChange([...listenings, newItem]);
    setExpandedIndex(listenings.length);
  };

  const handleUpdateItem = (index: number, field: keyof LessonListeningItem, val: unknown) => {
    const updated = [...listenings];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    onChange(updated);
  };

  const handleRemoveItem = (index: number) => {
    const remaining = listenings.filter((_, i) => i !== index);
    const reordered = remaining.map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
    onChange(reordered);
    if (expandedIndex >= reordered.length) {
      setExpandedIndex(Math.max(0, reordered.length - 1));
    }
  };

  const handleMove = (index: number, direction: 'UP' | 'DOWN') => {
    const newIdx = direction === 'UP' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= listenings.length) return;
    const updated = [...listenings];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    const reordered = updated.map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
    onChange(reordered);
    setExpandedIndex(newIdx);
  };

  // Option handling within an activity
  const handleOptionChange = (actIdx: number, optIdx: number, text: string) => {
    const item = listenings[actIdx];
    const currentOptions = item.options || [];
    const updatedOptions = currentOptions.map((opt, i) =>
      i === optIdx ? { ...opt, text } : opt
    );
    handleUpdateItem(actIdx, 'options', updatedOptions);
  };

  const handleSetCorrectOption = (actIdx: number, optId: number) => {
    const item = listenings[actIdx];
    const currentOptions = item.options || [];
    const updatedOptions = currentOptions.map((opt) => ({
      ...opt,
      isCorrect: opt.id === optId,
    }));
    handleUpdateItem(actIdx, 'options', updatedOptions);
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
            <Headphones size={18} style={{ color: 'var(--primary)' }} />
            <h4 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>
              Hoạt động Luyện nghe hiểu ({listenings.length} hoạt động)
            </h4>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
            Cần tối thiểu 1 hoạt động luyện nghe kèm file âm thanh và câu hỏi trắc nghiệm kiểm tra.
          </p>
        </div>

        <button
          type="button"
          className="ds-btn ds-btn-primary ds-btn-sm"
          onClick={handleAddActivity}
        >
          <Plus size={14} /> Thêm hoạt động nghe
        </button>
      </div>

      {listenings.length === 0 ? (
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
            Chưa có bài luyện nghe nào trong bài học này.
          </div>
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={handleAddActivity}
          >
            <Plus size={14} /> Thêm hoạt động nghe
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {listenings.map((item, index) => {
            const isExpanded = expandedIndex === index;

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
                {/* Header Row */}
                <div
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isExpanded ? 'var(--background)' : 'var(--surface)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpandedIndex(isExpanded ? -1 : index)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--surface)',
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
                    <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--foreground)' }}>
                      {item.title}
                    </strong>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                      {item.transcriptZh ? `"${item.transcriptZh}"` : '(Chưa có transcript)'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }} onClick={(e) => e.stopPropagation()}>
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
                      disabled={index === listenings.length - 1}
                      onClick={() => handleMove(index, 'DOWN')}
                      title="Di chuyển xuống"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      className="ds-btn ds-btn-ghost ds-btn-xs"
                      onClick={() => handleRemoveItem(index)}
                      style={{ color: 'var(--danger)' }}
                      title="Xóa bài nghe"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Form Details */}
                {isExpanded && (
                  <div
                    style={{
                      padding: 'var(--space-4)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-4)',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
                      <div className="lcm-form-group">
                        <label className="lcm-form-label">Tiêu đề bài luyện nghe</label>
                        <input
                          type="text"
                          className="lcm-form-input"
                          value={item.title}
                          onChange={(e) => handleUpdateItem(index, 'title', e.target.value)}
                        />
                      </div>

                      <div className="lcm-form-group">
                        <label className="lcm-form-label">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Volume2 size={14} /> Đường dẫn File Audio (URL) <span style={{ color: 'var(--danger)' }}>*</span>
                          </span>
                        </label>
                        <input
                          type="text"
                          className="lcm-form-input"
                          value={item.audioUrl}
                          onChange={(e) => handleUpdateItem(index, 'audioUrl', e.target.value)}
                          placeholder="https://assets.zhongwenhub.com/audio/..."
                        />
                      </div>
                    </div>

                    {/* Transcripts */}
                    <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--foreground)', marginBottom: 'var(--space-2)' }}>
                        Văn bản Lời thoại âm thanh (Audio Transcript)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                        <input
                          type="text"
                          className="lcm-form-input"
                          placeholder="Hán tự: 我想喝咖啡，不想喝茶。"
                          value={item.transcriptZh || ''}
                          onChange={(e) => handleUpdateItem(index, 'transcriptZh', e.target.value)}
                          style={{ fontFamily: 'var(--font-hanzi)' }}
                        />
                        <input
                          type="text"
                          className="lcm-form-input"
                          placeholder="Pinyin: Wǒ xiǎng hē kāfēi, bù xiǎng hē chá."
                          value={item.transcriptPinyin || ''}
                          onChange={(e) => handleUpdateItem(index, 'transcriptPinyin', e.target.value)}
                        />
                      </div>
                      <input
                        type="text"
                        className="lcm-form-input"
                        placeholder="Dịch nghĩa: Tôi muốn uống cà phê, không muốn uống trà."
                        value={item.transcriptVi || ''}
                        onChange={(e) => handleUpdateItem(index, 'transcriptVi', e.target.value)}
                      />
                    </div>

                    {/* Question Prompt */}
                    <div className="lcm-form-group">
                      <label className="lcm-form-label">Câu hỏi trắc nghiệm nghe hiểu</label>
                      <input
                        type="text"
                        className="lcm-form-input"
                        value={item.prompt || ''}
                        onChange={(e) => handleUpdateItem(index, 'prompt', e.target.value)}
                        placeholder="Lắng nghe đoạn ghi âm sau và cho biết người nói muốn uống gì:"
                      />
                    </div>

                    {/* Options */}
                    <div>
                      <label className="lcm-form-label">
                        Các lựa chọn (Đánh dấu tích tròn vào đáp án chính xác)
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {(item.options || []).map((opt, optIdx) => (
                          <div
                            key={opt.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--space-2)',
                              padding: 'var(--space-2)',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: opt.isCorrect ? 'var(--primary-light)' : 'var(--background)',
                              border: `1px solid ${opt.isCorrect ? 'var(--primary)' : 'var(--border)'}`,
                            }}
                          >
                            <button
                              type="button"
                              className="ds-btn ds-btn-ghost ds-btn-xs"
                              onClick={() => handleSetCorrectOption(index, opt.id)}
                              style={{ color: opt.isCorrect ? 'var(--primary)' : 'var(--muted)' }}
                              title="Đặt làm đáp án đúng"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <input
                              type="text"
                              className="lcm-form-input"
                              value={opt.text}
                              onChange={(e) => handleOptionChange(index, optIdx, e.target.value)}
                              placeholder={`Lựa chọn ${optIdx + 1}...`}
                            />
                            {opt.isCorrect && (
                              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                                Đáp án đúng
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="lcm-form-group">
                      <label className="lcm-form-label">Giải thích chi tiết đáp án</label>
                      <input
                        type="text"
                        className="lcm-form-input"
                        value={item.explanation || ''}
                        onChange={(e) => handleUpdateItem(index, 'explanation', e.target.value)}
                        placeholder="Người nói phát âm rõ ràng: '我想喝咖啡'..."
                      />
                    </div>
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
