import React, { useState } from 'react';
import { Target, Clock, Calendar, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import type { LearningGoal, UpdateLearningGoalRequest } from '../services/learning-path.service';

interface GoalSetupCardProps {
  initialGoal?: LearningGoal | null;
  selectedHskLevel?: number;
  onSaveGoal: (goal: UpdateLearningGoalRequest) => Promise<void>;
  isLoading?: boolean;
}

const SKILL_OPTIONS = [
  { id: 'vocabulary', label: 'Từ vựng (Vocabulary)', desc: 'Ghi nhớ chữ Hán và ngữ nghĩa' },
  { id: 'grammar', label: 'Ngữ pháp (Grammar)', desc: 'Cấu trúc câu và liên từ' },
  { id: 'reading', label: 'Đọc hiểu (Reading)', desc: 'Tốc độ đọc và nắm ý chính' },
  { id: 'listening', label: 'Nghe hiểu (Listening)', desc: 'Phản xạ âm thanh và hội thoại' },
  { id: 'pinyin', label: 'Pinyin & Phát âm', desc: 'Thanh điệu và biến âm chuẩn' },
];

const DURATION_OPTIONS = [15, 30, 45, 60];
const DAYS_OPTIONS = [3, 4, 5, 6, 7];

export const GoalSetupCard: React.FC<GoalSetupCardProps> = ({
  initialGoal,
  selectedHskLevel = 1,
  onSaveGoal,
  isLoading = false,
}) => {
  const [targetHskLevel, setTargetHskLevel] = useState<number>(initialGoal?.targetHskLevel || Math.min(6, selectedHskLevel + 1));
  const [dailyMinutes, setDailyMinutes] = useState<number>(initialGoal?.dailyStudyMinutes || 30);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(initialGoal?.studyDaysPerWeek || 5);
  const [intensityMode, setIntensityMode] = useState<string>(initialGoal?.intensityMode || 'balanced');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    initialGoal?.prioritySkills && initialGoal.prioritySkills.length > 0
      ? initialGoal.prioritySkills
      : ['vocabulary', 'grammar']
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) => {
      if (prev.includes(skillId)) {
        if (prev.length === 1) return prev; // At least one skill
        return prev.filter((s) => s !== skillId);
      }
      return [...prev, skillId];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await onSaveGoal({
        targetHskLevel,
        dailyStudyMinutes: dailyMinutes,
        studyDaysPerWeek: daysPerWeek,
        prioritySkills: selectedSkills,
        intensityMode,
      });
      setSuccessMsg('Đã lưu thiết lập mục tiêu và cập nhật lộ trình cá nhân hóa!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu mục tiêu học tập';
      setErrorMsg(msg);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        border: '1.5px solid #fed7da',
        padding: '28px',
        boxShadow: '0 4px 20px -2px rgba(230, 0, 18, 0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: '#FFF0F1',
            color: 'var(--primary, #E60012)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Target size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Thiết lập Mục tiêu & Sở thích học tập
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
            Tùy biến mục tiêu HSK, thời lượng hàng ngày và kỹ năng bạn muốn tập trung phát triển.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: '#FEE2E2',
            color: '#B91C1C',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '18px',
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: '#DCFCE7',
            color: '#15803D',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '18px',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* Target HSK level */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
            Cấp HSK mục tiêu (Hiện tại: HSK {selectedHskLevel})
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
            {[1, 2, 3, 4, 5, 6].map((level) => {
              const isSelected = targetHskLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setTargetHskLevel(level)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid var(--primary, #E60012)' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#FFF0F1' : '#ffffff',
                    color: isSelected ? 'var(--primary, #E60012)' : '#475569',
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  HSK {level}
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily Study Minutes & Days per Week */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
              <Clock size={16} color="var(--primary, #E60012)" />
              Thời gian học mỗi ngày
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {DURATION_OPTIONS.map((min) => {
                const isSelected = dailyMinutes === min;
                return (
                  <button
                    key={min}
                    type="button"
                    onClick={() => setDailyMinutes(min)}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid var(--primary, #E60012)' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#FFF0F1' : '#ffffff',
                      color: isSelected ? 'var(--primary, #E60012)' : '#475569',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    {min}p
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
              <Calendar size={16} color="var(--primary, #E60012)" />
              Số ngày học / tuần
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {DAYS_OPTIONS.map((days) => {
                const isSelected = daysPerWeek === days;
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDaysPerWeek(days)}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid var(--primary, #E60012)' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#FFF0F1' : '#ffffff',
                      color: isSelected ? 'var(--primary, #E60012)' : '#475569',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    {days} ngày
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Intensity Mode */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
            <Zap size={16} color="var(--primary, #E60012)" />
            Cường độ học tập
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { id: 'light', label: 'Nhẹ nhàng', desc: 'Duy trì thói quen, bài tập ngắn' },
              { id: 'balanced', label: 'Cân bằng (Khuyên dùng)', desc: 'Tiến độ tiêu chuẩn theo khung HSK' },
              { id: 'intensive', label: 'Cấp tốc', desc: 'Tập trung cao độ, bài tập nâng cao' },
            ].map((mode) => {
              const isSelected = intensityMode === mode.id;
              return (
                <div
                  key={mode.id}
                  onClick={() => setIntensityMode(mode.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid var(--primary, #E60012)' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#FFF0F1' : '#f8fafc',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '13px', color: isSelected ? 'var(--primary, #E60012)' : '#1e293b' }}>
                    {mode.label}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{mode.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Skills */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
            Kỹ năng ưu tiên tập trung (Chọn ít nhất 1)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px' }}>
            {SKILL_OPTIONS.map((skill) => {
              const isSelected = selectedSkills.includes(skill.id);
              return (
                <div
                  key={skill.id}
                  onClick={() => toggleSkill(skill.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid var(--primary, #E60012)' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#FFF0F1' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    style={{ accentColor: 'var(--primary, #E60012)', marginTop: '3px' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? 'var(--primary, #E60012)' : '#1e293b' }}>
                      {skill.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{skill.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '12px 28px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary, #E60012)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '14px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px 0 rgba(230, 0, 18, 0.35)',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Đang lưu & tối ưu...' : 'Lưu mục tiêu & Cập nhật lộ trình'}
          </button>
        </div>
      </form>
    </div>
  );
};
