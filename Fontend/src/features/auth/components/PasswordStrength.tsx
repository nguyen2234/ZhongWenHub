import React from 'react';
import { Check, X } from 'lucide-react';
import type { PasswordStrengthResult } from '../types/auth.types';

export interface PasswordStrengthProps {
  strength: PasswordStrengthResult;
  showChecklist?: boolean;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  strength,
  showChecklist = true,
}) => {
  const { score, level, label, requirements } = strength;

  const getColor = () => {
    switch (level) {
      case 'weak':
        return 'var(--danger)';
      case 'fair':
        return 'var(--warning)';
      case 'good':
        return 'var(--color-teal)';
      case 'strong':
        return 'var(--success)';
      default:
        return 'var(--border-strong)';
    }
  };

  const activeColor = getColor();

  const checklistItems = [
    { label: 'Tối thiểu 8 ký tự', met: requirements.minLength },
    { label: 'Chữ hoa & chữ thường', met: requirements.hasUpperLower },
    { label: 'Ít nhất 1 chữ số', met: requirements.hasNumber },
    { label: 'Ký tự đặc biệt (@, #, $, ...)', met: requirements.hasSpecial },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
      {/* 4-Bar Strength Meter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', gap: '4px', flex: 1, height: '4px' }}>
          {[1, 2, 3, 4].map((step) => {
            const isFilled = score >= step;
            return (
              <div
                key={step}
                style={{
                  flex: 1,
                  height: '100%',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isFilled ? activeColor : 'var(--border-strong)',
                  transition: 'background-color 0.25s ease',
                }}
              />
            );
          })}
        </div>
        {level !== 'empty' && (
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: activeColor,
              minWidth: '60px',
              textAlign: 'right',
            }}
          >
            {label}
          </span>
        )}
      </div>

      {/* Progressive Requirements Checklist */}
      {showChecklist && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '4px var(--space-2)',
            padding: 'var(--space-2) var(--space-2-5)',
            backgroundColor: 'var(--surface-hover)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
          }}
        >
          {checklistItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                color: item.met ? 'var(--success)' : 'var(--muted)',
                transition: 'color 0.15s ease',
              }}
            >
              {item.met ? (
                <Check size={12} strokeWidth={2.5} style={{ color: 'var(--success)', flexShrink: 0 }} />
              ) : (
                <X size={12} strokeWidth={2} style={{ color: 'var(--muted)', flexShrink: 0, opacity: 0.6 }} />
              )}
              <span style={{ fontWeight: item.met ? 600 : 400 }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
