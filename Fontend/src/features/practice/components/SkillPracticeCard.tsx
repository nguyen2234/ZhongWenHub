import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { SkillItemConfig } from '../types';

interface SkillPracticeCardProps {
  skill: SkillItemConfig;
  onSelect: (skill: SkillItemConfig) => void;
}

export const SkillPracticeCard: React.FC<SkillPracticeCardProps> = ({ skill, onSelect }) => {
  return (
    <div className="practice-skill-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Top: emoji icon & exercise count */}
        <div className="practice-skill-card-top">
          <span className="practice-skill-emoji">{skill.icon}</span>
          <span className="practice-skill-count-badge">
            {skill.totalExercises} bài luyện
          </span>
        </div>

        {/* Title Group: Chinese + Vietnamese */}
        <div className="practice-skill-title-group">
          <div className="practice-skill-hanzi">{skill.chinese}</div>
          <div className="practice-skill-vietnamese">{skill.vietnamese}</div>
        </div>

        {/* Description */}
        <p className="practice-skill-desc">{skill.description}</p>
      </div>

      {/* Action Button */}
      <div style={{ paddingTop: '4px' }}>
        <button
          type="button"
          className="practice-skill-action-btn"
          onClick={() => onSelect(skill)}
          aria-label={`Luyện tập kỹ năng ${skill.vietnamese}`}
        >
          <span>Vào luyện tập</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
