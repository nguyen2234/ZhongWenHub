import React, { useState, useMemo, useEffect } from 'react';
import { Filter, Play, AlertCircle } from 'lucide-react';
import type { SkillCategory, SharedExerciseItem } from '../../exercise-engine';

export interface CustomPracticeOptions {
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'ALL';
  questionCount?: number;
  prioritizeWeakness?: boolean;
}

interface HSKFilterSectionProps {
  exercisePool?: Record<string, SharedExerciseItem>;
  publishedByHsk?: Record<number, number>;
  availableHskLevels?: number[];
  mistakeCount?: number;
  mistakeIds?: Set<string>;
  onStartCustomPractice: (
    level: number,
    skill?: SkillCategory,
    mistakesOnly?: boolean,
    options?: CustomPracticeOptions
  ) => void;
}

export const HSKFilterSection: React.FC<HSKFilterSectionProps> = ({
  exercisePool = {},
  publishedByHsk,
  availableHskLevels,
  mistakeCount = 0,
  mistakeIds = new Set<string>(),
  onStartCustomPractice,
}) => {
  const [selectedHsk, setSelectedHsk] = useState<number>(1);
  const [selectedSkill, setSelectedSkill] = useState<SkillCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [onlyMistakes, setOnlyMistakes] = useState<boolean>(false);
  const [prioritizeWeakness, setPrioritizeWeakness] = useState<boolean>(true);

  const poolByLevel = useMemo(() => {
    const counts: Record<number, number> = {};
    if (publishedByHsk) {
      Object.entries(publishedByHsk).forEach(([lvlStr, count]) => {
        const lvl = Number(lvlStr);
        if (Number.isInteger(lvl) && lvl > 0 && Number(count) > 0) {
          counts[lvl] = Number(count);
        }
      });
      return counts;
    }
    Object.values(exercisePool).forEach((ex) => {
      if (ex.hskLevel && ex.hskLevel > 0) {
        counts[ex.hskLevel] = (counts[ex.hskLevel] || 0) + 1;
      }
    });
    return counts;
  }, [exercisePool, publishedByHsk]);

  const hskLevels = useMemo(() => {
    if (availableHskLevels && availableHskLevels.length > 0) {
      return [...new Set(availableHskLevels.filter((lvl) => Number.isInteger(lvl) && lvl > 0))].sort(
        (a, b) => a - b
      );
    }
    return Object.keys(poolByLevel)
      .map(Number)
      .filter((lvl) => Number.isInteger(lvl) && lvl > 0)
      .sort((a, b) => a - b);
  }, [availableHskLevels, poolByLevel]);

  useEffect(() => {
    if (hskLevels.length > 0 && !hskLevels.includes(selectedHsk)) {
      setSelectedHsk(hskLevels[0]);
    }
  }, [hskLevels, selectedHsk]);

  const availableForLevel = useMemo(() => {
    if (publishedByHsk) {
      if (onlyMistakes) return mistakeCount || mistakeIds.size;
      return poolByLevel[selectedHsk] || 0;
    }
    let list = Object.values(exercisePool).filter((ex) => ex.hskLevel === selectedHsk);
    if (selectedSkill !== 'all') list = list.filter((ex) => ex.skill === selectedSkill);
    if (onlyMistakes) list = list.filter((ex) => mistakeIds.has(String(ex.id)));
    return list.length;
  }, [exercisePool, publishedByHsk, poolByLevel, selectedHsk, selectedSkill, onlyMistakes, mistakeIds, mistakeCount]);

  const isAvailable = availableForLevel > 0;
  const effectiveSessionCount = Math.min(questionCount, Math.max(1, availableForLevel));

  const handleStart = () => {
    if (!isAvailable) return;
    onStartCustomPractice(
      selectedHsk,
      selectedSkill === 'all' ? undefined : selectedSkill,
      onlyMistakes,
      {
        difficulty: selectedDifficulty,
        questionCount,
        prioritizeWeakness,
      }
    );
  };

  return (
    <div className="practice-hsk-filter-card" aria-label="Bộ lọc luyện tập HSK">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} style={{ color: 'var(--primary, #e60012)' }} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--foreground, #0f172a)' }}>
            Tùy chỉnh phiên luyện tập từ Ngân hàng câu hỏi
          </h3>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--muted, #64748b)' }}>
          Nạp câu hỏi theo phiên từ SQL Server & chấm điểm máy chủ
        </span>
      </div>

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

      <div className="practice-filter-controls">
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted, #64748b)' }}>
            Độ khó
          </label>
          <select
            className="practice-select-input"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value as any)}
            aria-label="Chọn độ khó"
          >
            <option value="ALL">Mọi độ khó</option>
            <option value="EASY">Dễ (EASY)</option>
            <option value="MEDIUM">Trung bình (MEDIUM)</option>
            <option value="HARD">Khó (HARD)</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted, #64748b)' }}>
            Số câu mỗi phiên
          </label>
          <select
            className="practice-select-input"
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            aria-label="Chọn số câu hỏi"
          >
            {[5, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n} câu
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
          <label className="practice-checkbox-label">
            <input
              type="checkbox"
              checked={prioritizeWeakness}
              onChange={(e) => setPrioritizeWeakness(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary, #e60012)' }}
            />
            <span>Ưu tiên câu yếu / hay sai (Adaptive)</span>
          </label>

          <label className="practice-checkbox-label">
            <input
              type="checkbox"
              checked={onlyMistakes}
              onChange={(e) => setOnlyMistakes(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary, #e60012)' }}
            />
            <span>Chỉ ôn lại các câu từng làm sai</span>
          </label>
        </div>
      </div>

      {hskLevels.length === 0 || !isAvailable ? (
        <div className="practice-filter-warning">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '2px' }}>
            <AlertCircle size={15} />
            <span>Chưa có câu hỏi đã xuất bản cho lựa chọn này</span>
          </div>
          <p style={{ margin: 0 }}>
            {hskLevels.length > 0
              ? `Kho đã xuất bản hiện có ${hskLevels
                  .map((lvl) => `HSK ${lvl} (${poolByLevel[lvl] || 0})`)
                  .join(', ')}.`
              : 'Chưa ghi nhận cấp độ HSK khả dụng từ máy chủ.'}
          </p>
        </div>
      ) : (
        <div className="practice-filter-summary-row">
          <div className="practice-filter-status-text">
            Kho <strong>HSK {selectedHsk}</strong> có <strong>{availableForLevel}</strong> câu sẵn sàng · Phiên này lấy{' '}
            <strong>{effectiveSessionCount}</strong> câu
            {selectedSkill !== 'all' && ` · Kỹ năng: ${selectedSkill}`}
            {selectedDifficulty !== 'ALL' && ` · Độ khó: ${selectedDifficulty}`}
            {onlyMistakes && ' (Chỉ câu từng sai)'}
          </div>

          <button type="button" className="practice-btn-primary" onClick={handleStart}>
            <Play size={16} fill="currentColor" />
            <span>Bắt đầu luyện tập ({effectiveSessionCount} câu)</span>
          </button>
        </div>
      )}
    </div>
  );
};
