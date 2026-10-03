import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { SkillItemConfig } from '../types';

interface SkillPracticeCardProps {
  skill: SkillItemConfig;
  onSelect: (skill: SkillItemConfig) => void;
}

export const SkillPracticeCard: React.FC<SkillPracticeCardProps> = ({ skill, onSelect }) => {
  // Color tone for mastery level
  const isWeak = skill.masteryPercentage < 60;
  const isGood = skill.masteryPercentage >= 75;

  const progressColor = isWeak
    ? 'var(--warning)'
    : isGood
    ? 'var(--success)'
    : 'var(--primary)';

  return (
    <div
      style={{
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--surface)',
        border: '1.5px solid var(--border)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        transition: 'all 0.15s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}
    >
      {/* Top info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '24px', lineHeight: 1 }}>{skill.icon}</div>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 7px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              fontWeight: 600,
            }}
          >
            {skill.totalExercises} bài
          </span>
        </div>

        <div>
          <div style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--foreground)' }}>
            {skill.chinese}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)' }}>
            {skill.vietnamese}
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)', lineHeight: 1.3 }}>
          {skill.description}
        </p>
      </div>

      {/* Mastery light bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span style={{ color: 'var(--muted)' }}>Thuần thục</span>
          <strong style={{ color: progressColor }}>{skill.masteryPercentage}%</strong>
        </div>
        <div
          style={{
            height: '5px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--border)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${skill.masteryPercentage}%`,
              backgroundColor: progressColor,
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Button CTA */}
      <button
        type="button"
        onClick={() => onSelect(skill)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          width: '100%',
          padding: '8px 0',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--primary-light)';
          e.currentTarget.style.color = 'var(--primary)';
          e.currentTarget.style.borderColor = 'var(--primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--background)';
          e.currentTarget.style.color = 'var(--foreground)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        <span>LUYỆN TẬP</span>
        <ArrowRight size={13} />
      </button>
    </div>
  );
};
