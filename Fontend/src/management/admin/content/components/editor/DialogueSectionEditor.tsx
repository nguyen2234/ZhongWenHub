import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, MessagesSquare, Volume2 } from 'lucide-react';
import type { LessonDialogueData, DialogueLineItem } from '../../types';

interface DialogueSectionEditorProps {
  dialogue: LessonDialogueData;
  onChange: (updatedDialogue: LessonDialogueData) => void;
}

export const DialogueSectionEditor: React.FC<DialogueSectionEditorProps> = ({
  dialogue,
  onChange,
}) => {
  const handleFieldChange = (field: 'title' | 'situationZh' | 'situationVi' | 'audioUrl', val: string) => {
    onChange({
      ...dialogue,
      [field]: val,
    });
  };

  const handleAddLine = () => {
    const isEven = dialogue.lines.length % 2 === 1;
    const newLine: DialogueLineItem = {
      id: `dl-${Date.now()}`,
      dialogueId: dialogue.id,
      speakerName: isEven ? 'Minh Anh' : 'Nhân viên',
      speakerRole: isEven ? 'Khách hàng' : 'Phục vụ',
      zh: '',
      pinyin: '',
      meaningVi: '',
      displayOrder: dialogue.lines.length + 1,
    };

    onChange({
      ...dialogue,
      lines: [...dialogue.lines, newLine],
    });
  };

  const handleUpdateLine = (id: string, field: keyof DialogueLineItem, val: string | number) => {
    onChange({
      ...dialogue,
      lines: dialogue.lines.map((l) => (l.id === id ? { ...l, [field]: val } : l)),
    });
  };

  const handleRemoveLine = (id: string) => {
    const remaining = dialogue.lines.filter((l) => l.id !== id);
    const reordered = remaining.map((l, idx) => ({ ...l, displayOrder: idx + 1 }));
    onChange({
      ...dialogue,
      lines: reordered,
    });
  };

  const handleMoveLine = (index: number, direction: 'UP' | 'DOWN') => {
    const newIdx = direction === 'UP' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= dialogue.lines.length) return;
    const updated = [...dialogue.lines];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    const reordered = updated.map((l, idx) => ({ ...l, displayOrder: idx + 1 }));
    onChange({
      ...dialogue,
      lines: reordered,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Dialogue Metadata */}
      <div
        style={{
          padding: 'var(--space-5)',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          <MessagesSquare size={18} style={{ color: 'var(--primary)' }} />
          <h4 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>
            Ngữ cảnh bài hội thoại
          </h4>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          <div className="lcm-form-group">
            <label className="lcm-form-label">Tiêu đề hội thoại</label>
            <input
              type="text"
              className="lcm-form-input"
              value={dialogue.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="Tại quán đồ uống (在饮品店)"
            />
          </div>

          <div className="lcm-form-group">
            <label className="lcm-form-label">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Volume2 size={14} /> Đường dẫn Audio toàn bài (URL)
              </span>
            </label>
            <input
              type="text"
              className="lcm-form-input"
              value={dialogue.audioUrl || ''}
              onChange={(e) => handleFieldChange('audioUrl', e.target.value)}
              placeholder="https://assets.zhongwenhub.com/audio/dialogue.mp3"
            />
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-4)' }} className="lcm-form-group">
          <label className="lcm-form-label">Mô tả tình huống / Bối cảnh giao tiếp</label>
          <textarea
            className="lcm-form-textarea"
            rows={2}
            value={dialogue.situationVi}
            onChange={(e) => {
              handleFieldChange('situationVi', e.target.value);
              handleFieldChange('situationZh', e.target.value);
            }}
            placeholder="Minh Anh đang gọi đồ uống cùng bạn tại một tiệm đồ uống ở Bắc Kinh..."
          />
        </div>
      </div>

      {/* 2. Dialogue Lines */}
      <div
        style={{
          padding: 'var(--space-5)',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-4)',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>
              Các lượt câu thoại ({dialogue.lines.length} câu)
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Cần tối thiểu 4 lượt câu thoại hoàn chỉnh để đảm bảo chất lượng bài học.
            </p>
          </div>

          <button
            type="button"
            className="ds-btn ds-btn-primary ds-btn-sm"
            onClick={handleAddLine}
          >
            <Plus size={14} /> Thêm lượt thoại
          </button>
        </div>

        {dialogue.lines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>
            Chưa có câu thoại nào. Nhấn &quot;Thêm lượt thoại&quot; để bắt đầu xây dựng đoạn hội thoại.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {dialogue.lines.map((line, index) => (
              <div
                key={line.id}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                }}
              >
                {/* Line Top Bar: Speaker & Ordering Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1 }}>
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'var(--text-2xs)',
                        fontWeight: 700,
                        color: 'var(--muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {line.displayOrder}
                    </span>

                    <input
                      type="text"
                      className="lcm-form-input"
                      value={line.speakerName}
                      onChange={(e) => handleUpdateLine(line.id, 'speakerName', e.target.value)}
                      placeholder="Tên nhân vật (ví dụ: Nhân viên quán)"
                      style={{ maxWidth: '170px', padding: '3px 8px', fontSize: 'var(--text-xs)', fontWeight: 600 }}
                    />

                    <input
                      type="text"
                      className="lcm-form-input"
                      value={line.speakerRole || ''}
                      onChange={(e) => handleUpdateLine(line.id, 'speakerRole', e.target.value)}
                      placeholder="Vai trò (Phục vụ / Khách)"
                      style={{ maxWidth: '130px', padding: '3px 8px', fontSize: 'var(--text-xs)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <button
                      type="button"
                      className="ds-btn ds-btn-ghost ds-btn-xs"
                      disabled={index === 0}
                      onClick={() => handleMoveLine(index, 'UP')}
                      title="Di chuyển lên"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      className="ds-btn ds-btn-ghost ds-btn-xs"
                      disabled={index === dialogue.lines.length - 1}
                      onClick={() => handleMoveLine(index, 'DOWN')}
                      title="Di chuyển xuống"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      className="ds-btn ds-btn-ghost ds-btn-xs"
                      onClick={() => handleRemoveLine(line.id)}
                      style={{ color: 'var(--danger)' }}
                      title="Xóa câu thoại"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Line Inputs: Zh, Pinyin, Vi */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                  <input
                    type="text"
                    className="lcm-form-input"
                    value={line.zh}
                    onChange={(e) => handleUpdateLine(line.id, 'zh', e.target.value)}
                    placeholder="Câu Hán tự: 您好！你想喝什么？"
                    style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-base)' }}
                  />
                  <input
                    type="text"
                    className="lcm-form-input"
                    value={line.pinyin}
                    onChange={(e) => handleUpdateLine(line.id, 'pinyin', e.target.value)}
                    placeholder="Phiên âm: Nínhǎo! Nǐ xiǎng hē shénme?"
                  />
                </div>

                <input
                  type="text"
                  className="lcm-form-input"
                  value={line.meaningVi}
                  onChange={(e) => handleUpdateLine(line.id, 'meaningVi', e.target.value)}
                  placeholder="Dịch nghĩa: Xin chào! Bạn muốn uống gì?"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
