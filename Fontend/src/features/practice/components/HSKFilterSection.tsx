import React, { useState } from 'react';
import { Filter, Play } from 'lucide-react';
import type { SkillCategory } from '../../exercise-engine';

interface HSKFilterSectionProps {
  onStartCustomPractice: (level: number, skill?: SkillCategory, mistakesOnly?: boolean) => void;
}

export const HSKFilterSection: React.FC<HSKFilterSectionProps> = ({ onStartCustomPractice }) => {
  const [selectedHsk, setSelectedHsk] = useState<number>(2);
  const [selectedSkill, setSelectedSkill] = useState<SkillCategory | 'all'>('all');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [onlyMistakes, setOnlyMistakes] = useState<boolean>(false);

  const hskLevels = [1, 2, 3, 4, 5, 6];

  return (
    <div
      style={{
        borderRadius: 'var(--radius-2xl)',
        backgroundColor: 'var(--surface)',
        border: '1.5px solid var(--border)',
        padding: 'var(--space-5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} style={{ color: 'var(--primary)' }} />
          <h4 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)' }}>
            Luyện tập theo cấp độ HSK & Bài học
          </h4>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
          Tự chọn trọng tâm bài tập bạn muốn rèn luyện
        </span>
      </div>

      {/* HSK Level Pills */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {hskLevels.map((lvl) => {
          const isSelected = selectedHsk === lvl;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedHsk(lvl)}
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--background)',
                color: isSelected ? 'var(--primary)' : 'var(--foreground)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              HSK {lvl}
            </button>
          );
        })}
      </div>

      {/* Filter Row: Unit, Skill, Mistake Checkbox */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 'var(--space-3)',
          alignItems: 'center',
          backgroundColor: 'var(--background)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Unit Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)' }}>Unit / Bài học</label>
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--foreground)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
            }}
          >
            <option value="all">Tất cả Unit</option>
            <option value="unit-1">Unit 1: Bạn là người nước nào?</option>
            <option value="unit-2">Unit 2: Bạn muốn uống gì?</option>
            <option value="unit-3">Unit 3: Hỏi đường & Đi lại</option>
          </select>
        </div>

        {/* Skill Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)' }}>Kỹ năng</label>
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value as SkillCategory | 'all')}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--foreground)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
            }}
          >
            <option value="all">Tất cả kỹ năng</option>
            <option value="vocabulary">Từ vựng (词汇)</option>
            <option value="grammar">Ngữ pháp (语法)</option>
            <option value="listening">Nghe (听力)</option>
            <option value="reading">Đọc hiểu (阅读)</option>
            <option value="sentence">Cấu trúc câu (句子)</option>
          </select>
        </div>

        {/* Checkbox mistakes only */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--foreground)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={onlyMistakes}
              onChange={(e) => setOnlyMistakes(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
            />
            <span>Chỉ luyện câu từng làm sai</span>
          </label>
        </div>

        {/* Start button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '14px' }}>
          <button
            type="button"
            onClick={() => onStartCustomPractice(selectedHsk, selectedSkill === 'all' ? undefined : selectedSkill, onlyMistakes)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 18px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Play size={12} fill="#ffffff" />
            <span>BẮT ĐẦU LUYỆN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
