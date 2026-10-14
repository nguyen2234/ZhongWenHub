import React from 'react';
import { Target, MessageSquare, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type { LessonIntroData } from '../../types';

interface IntroSectionEditorProps {
  intro: LessonIntroData;
  onChange: (updatedIntro: LessonIntroData) => void;
}

export const IntroSectionEditor: React.FC<IntroSectionEditorProps> = ({ intro, onChange }) => {
  const handleFieldChange = <K extends keyof LessonIntroData>(
    field: K,
    value: LessonIntroData[K]
  ) => {
    onChange({
      ...intro,
      [field]: value,
    });
  };

  // Objectives handling
  const handleAddObjective = () => {
    onChange({
      ...intro,
      objectives: [...intro.objectives, ''],
    });
  };

  const handleUpdateObjective = (index: number, val: string) => {
    const updated = [...intro.objectives];
    updated[index] = val;
    onChange({
      ...intro,
      objectives: updated,
    });
  };

  const handleRemoveObjective = (index: number) => {
    onChange({
      ...intro,
      objectives: intro.objectives.filter((_, i) => i !== index),
    });
  };

  const handleMoveObjective = (index: number, direction: 'UP' | 'DOWN') => {
    const newIdx = direction === 'UP' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= intro.objectives.length) return;
    const updated = [...intro.objectives];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    onChange({
      ...intro,
      objectives: updated,
    });
  };

  // Context snippet handling
  const handleContextChange = (field: 'hanzi' | 'pinyin' | 'meaningVi', val: string) => {
    onChange({
      ...intro,
      contextDialogueSnippet: {
        hanzi: intro.contextDialogueSnippet?.hanzi || '',
        pinyin: intro.contextDialogueSnippet?.pinyin || '',
        meaningVi: intro.contextDialogueSnippet?.meaningVi || '',
        [field]: val,
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Header Information */}
      <div
        style={{
          padding: 'var(--space-5)',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
        }}
      >
        <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-base)', fontWeight: 700 }}>
          1. Thông tin Tiêu đề & Tổng quan
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          <div className="lcm-form-group">
            <label className="lcm-form-label">
              Tiêu đề Tiếng Trung (Hán tự) <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              className="lcm-form-input"
              value={intro.titleZh}
              onChange={(e) => handleFieldChange('titleZh', e.target.value)}
              placeholder="Ví dụ: 你想喝什么？"
              style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-lg)', fontWeight: 600 }}
            />
          </div>

          <div className="lcm-form-group">
            <label className="lcm-form-label">Phiên âm Pinyin</label>
            <input
              type="text"
              className="lcm-form-input"
              value={intro.pinyinTitle || ''}
              onChange={(e) => handleFieldChange('pinyinTitle', e.target.value)}
              placeholder="Ví dụ: Nǐ xiǎng hē shénme?"
            />
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-4)' }} className="lcm-form-group">
          <label className="lcm-form-label">
            Tiêu đề Dịch Tiếng Việt <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            type="text"
            className="lcm-form-input"
            value={intro.titleVi}
            onChange={(e) => handleFieldChange('titleVi', e.target.value)}
            placeholder="Ví dụ: Bạn muốn uống gì?"
          />
        </div>

        <div style={{ marginTop: 'var(--space-4)' }} className="lcm-form-group">
          <label className="lcm-form-label">Tóm tắt nội dung bài học</label>
          <textarea
            className="lcm-form-textarea"
            rows={3}
            value={intro.summary}
            onChange={(e) => handleFieldChange('summary', e.target.value)}
            placeholder="Mô tả ngắn gọn về trọng tâm kiến thức và ngữ cảnh..."
          />
        </div>

        <div
          style={{
            marginTop: 'var(--space-4)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-4)',
          }}
        >
          <div className="lcm-form-group">
            <label className="lcm-form-label">Thời lượng dự kiến (phút)</label>
            <input
              type="number"
              min={1}
              className="lcm-form-input"
              value={intro.durationMinutes}
              onChange={(e) => handleFieldChange('durationMinutes', Math.max(1, Number(e.target.value)))}
            />
          </div>

          <div className="lcm-form-group">
            <label className="lcm-form-label">Phần thưởng hoàn thành (XP)</label>
            <input
              type="number"
              min={0}
              step={10}
              className="lcm-form-input"
              value={intro.xpReward}
              onChange={(e) => handleFieldChange('xpReward', Math.max(0, Number(e.target.value)))}
            />
          </div>
        </div>
      </div>

      {/* 2. Objectives List */}
      <div
        style={{
          padding: 'var(--space-5)',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Target size={18} style={{ color: 'var(--primary)' }} />
            <h4 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>
              2. Mục tiêu bài học (Tối thiểu 2 mục tiêu)
            </h4>
          </div>
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={handleAddObjective}
          >
            <Plus size={14} /> Thêm mục tiêu
          </button>
        </div>

        {intro.objectives.length === 0 ? (
          <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>
            Chưa có mục tiêu nào. Nhấp &quot;Thêm mục tiêu&quot; để bổ sung.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {intro.objectives.map((obj, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2)',
                  backgroundColor: 'var(--background)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                }}
              >
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
                  }}
                >
                  {idx + 1}
                </span>
                <input
                  type="text"
                  className="lcm-form-input"
                  style={{ flex: 1 }}
                  value={obj}
                  placeholder={`Mục tiêu số ${idx + 1}...`}
                  onChange={(e) => handleUpdateObjective(idx, e.target.value)}
                />
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button
                    type="button"
                    className="ds-btn ds-btn-ghost ds-btn-sm"
                    disabled={idx === 0}
                    onClick={() => handleMoveObjective(idx, 'UP')}
                    title="Di chuyển lên"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    className="ds-btn ds-btn-ghost ds-btn-sm"
                    disabled={idx === intro.objectives.length - 1}
                    onClick={() => handleMoveObjective(idx, 'DOWN')}
                    title="Di chuyển xuống"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    className="ds-btn ds-btn-ghost ds-btn-sm"
                    onClick={() => handleRemoveObjective(idx)}
                    style={{ color: 'var(--danger)' }}
                    title="Xóa mục tiêu"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Communication Context Snippet */}
      <div
        style={{
          padding: 'var(--space-5)',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          <MessageSquare size={18} style={{ color: 'var(--primary)' }} />
          <h4 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>
            3. Câu thoại ngữ cảnh dẫn nhập (Communication Context)
          </h4>
        </div>
        <p style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
          Câu hội thoại tiêu biểu xuất hiện ở đầu bài học giúp học viên hình dung bối cảnh ứng dụng thực tế.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div className="lcm-form-group">
            <label className="lcm-form-label">Mẫu câu Hán tự (Hanzi)</label>
            <input
              type="text"
              className="lcm-form-input"
              value={intro.contextDialogueSnippet?.hanzi || ''}
              onChange={(e) => handleContextChange('hanzi', e.target.value)}
              placeholder="Ví dụ: 服务员：你想喝什么？顾客：我想喝一杯热茶。"
              style={{ fontFamily: 'var(--font-hanzi)' }}
            />
          </div>

          <div className="lcm-form-group">
            <label className="lcm-form-label">Phiên âm Pinyin</label>
            <input
              type="text"
              className="lcm-form-input"
              value={intro.contextDialogueSnippet?.pinyin || ''}
              onChange={(e) => handleContextChange('pinyin', e.target.value)}
              placeholder="Ví dụ: Fúwùyuán: Nǐ xiǎng hē shénme? Gùkè: Wǒ xiǎng hē yībēi rè chá."
            />
          </div>

          <div className="lcm-form-group">
            <label className="lcm-form-label">Dịch nghĩa Tiếng Việt</label>
            <input
              type="text"
              className="lcm-form-input"
              value={intro.contextDialogueSnippet?.meaningVi || ''}
              onChange={(e) => handleContextChange('meaningVi', e.target.value)}
              placeholder="Ví dụ: Phục vụ: Bạn muốn uống gì? Khách: Tôi muốn uống một cốc trà nóng."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
