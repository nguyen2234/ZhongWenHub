import React, { useState, useMemo } from 'react';
import { Filter, Play, AlertCircle } from 'lucide-react';
import type { SkillCategory, SharedExerciseItem } from '../../exercise-engine';

interface HSKFilterSectionProps {
  exercisePool: Record<string, SharedExerciseItem>;
  mistakeIds: Set<string>;
  onStartCustomPractice: (level: number, skill?: SkillCategory, mistakesOnly?: boolean) => void;
}

export const HSKFilterSection: React.FC<HSKFilterSectionProps> = ({
  exercisePool,
  mistakeIds,
  onStartCustomPractice,
}) => {
  const [selectedHsk, setSelectedHsk] = useState<number>(2);
  const [selectedSkill, setSelectedSkill] = useState<SkillCategory | 'all'>('all');
  const [onlyMistakes, setOnlyMistakes] = useState<boolean>(false);

  const hskLevels = [1, 2, 3, 4, 5, 6];

  // Calculate real pool availability per level
  const poolByLevel = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    Object.values(exercisePool).forEach((ex) => {
      if (ex.hskLevel && counts[ex.hskLevel] !== undefined) {
        counts[ex.hskLevel]++;
      }
    });
    return counts;
  }, [exercisePool]);

  // Calculate filtered exercises matching current selection
  const matchingExercises = useMemo(() => {
    let list = Object.values(exercisePool).filter((ex) => ex.hskLevel === selectedHsk);

    if (selectedSkill !== 'all') {
      list = list.filter((ex) => ex.skill === selectedSkill);
    }

    if (onlyMistakes) {
      list = list.filter((ex) => mistakeIds.has(String(ex.id)));
    }

    return list;
  }, [exercisePool, selectedHsk, selectedSkill, onlyMistakes, mistakeIds]);

  const count = matchingExercises.length;
  const isAvailable = count > 0;

  const handleStart = () => {
    if (!isAvailable) return;
    onStartCustomPractice(
      selectedHsk,
      selectedSkill === 'all' ? undefined : selectedSkill,
      onlyMistakes
    );
  };

  return (
    <div className="practice-hsk-filter-card" aria-label="Bộ lọc luyện tập HSK">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} style={{ color: 'var(--primary, #e60012)' }} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--foreground, #0f172a)' }}>
            Luyện tập theo cấp độ HSK tùy chọn
          </h3>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--muted, #64748b)' }}>
          Lọc chính xác theo metadata câu hỏi có sẵn
        </span>
      </div>

      {/* HSK Level Pills */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>
          Chọn cấp độ HSK:
        </div>
        <div className="practice-hsk-pills">
          {hskLevels.map((lvl) => {
            const isSelected = selectedHsk === lvl;
            const levelCount = poolByLevel[lvl] || 0;
            return (
              <button
                key={lvl}
                type="button"
                className={`practice-hsk-pill ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedHsk(lvl)}
              >
                <span>HSK {lvl}</span>
                <span className="practice-hsk-count-tag">
                  ({levelCount > 0 ? `${levelCount} câu` : 'chưa có bài'})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="practice-filter-controls">
        {/* Skill Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted, #64748b)' }}>
            Kỹ năng rèn luyện
          </label>
          <select
            className="practice-select-input"
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value as any)}
            aria-label="Chọn kỹ năng"
          >
            <option value="all">Tất cả kỹ năng</option>
            <option value="vocabulary">Từ vựng (词汇)</option>
            <option value="grammar">Ngữ pháp (语法)</option>
            <option value="listening">Luyện nghe (听力)</option>
            <option value="reading">Đọc hiểu (阅读)</option>
            <option value="sentence">Cấu trúc câu (句子)</option>
          </select>
        </div>

        {/* Mistake Only Checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: '16px' }}>
          <label className="practice-checkbox-label">
            <input
              type="checkbox"
              checked={onlyMistakes}
              onChange={(e) => setOnlyMistakes(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary, #e60012)' }}
            />
            <span>Chỉ luyện lại các câu từng trả lời sai</span>
          </label>
        </div>
      </div>

      {/* Availability Notice & Action */}
      {!isAvailable ? (
        <div className="practice-filter-warning">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '2px' }}>
            <AlertCircle size={15} />
            <span>Kho câu hỏi mẫu chưa có bài tập cho lựa chọn này</span>
          </div>
          <p style={{ margin: 0 }}>
            Hiện tại kho bài tập mẫu hỗ trợ HSK 1 ({poolByLevel[1]} câu) và HSK 2 ({poolByLevel[2]} câu).
            Hệ thống không tự ý nạp câu hỏi lệch cấp để đảm bảo tính chuẩn xác cho người học.
          </p>
        </div>
      ) : (
        <div className="practice-filter-summary-row">
          <div className="practice-filter-status-text">
            Tìm thấy <strong>{count}</strong> câu hỏi phù hợp với <strong>HSK {selectedHsk}</strong>
            {selectedSkill !== 'all' && ` · Kỹ năng: ${selectedSkill}`}
            {onlyMistakes && ' (Chỉ câu từng sai)'}
          </div>

          <button
            type="button"
            className="practice-btn-primary"
            onClick={handleStart}
          >
            <Play size={16} fill="currentColor" />
            <span>Bắt đầu luyện tập ({count} câu)</span>
          </button>
        </div>
      )}
    </div>
  );
};
