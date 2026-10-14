import React from 'react';
import {
  BookOpen,
  CheckSquare,
  PenTool,
  FileText,
  BarChart3,
  TrendingUp,
  Bot,
  ArrowRight,
  Lock,
  Layers,
} from 'lucide-react';
import type { TeacherAIFeatureItem } from '../types/teacher-ai.types';

interface TeacherAIFeatureCardProps {
  feature: TeacherAIFeatureItem;
  isSelected: boolean;
  onSelect: (feature: TeacherAIFeatureItem) => void;
}

export const TeacherAIFeatureCard: React.FC<TeacherAIFeatureCardProps> = ({
  feature,
  isSelected,
  onSelect,
}) => {
  const isShellActive = feature.status === 'ACTIVE_SHELL';

  const renderIcon = () => {
    switch (feature.iconName) {
      case 'BookOpen':
        return <BookOpen size={20} />;
      case 'CheckSquare':
        return <CheckSquare size={20} />;
      case 'PenTool':
        return <PenTool size={20} />;
      case 'FileText':
        return <FileText size={20} />;
      case 'BarChart3':
        return <BarChart3 size={20} />;
      case 'TrendingUp':
        return <TrendingUp size={20} />;
      case 'Bot':
        return <Bot size={20} />;
      default:
        return <Layers size={20} />;
    }
  };

  return (
    <div
      onClick={() => onSelect(feature)}
      style={{
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
        padding: 'var(--space-4) var(--space-5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: isSelected ? '0 4px 14px rgba(67, 56, 202, 0.12)' : 'none',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isSelected ? 'var(--primary)' : 'rgba(67, 56, 202, 0.1)',
              color: isSelected ? '#ffffff' : 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {renderIcon()}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: feature.tier === 'PRO' ? 'rgba(190, 18, 60, 0.1)' : 'var(--neutral-bg)',
                color: feature.tier === 'PRO' ? 'var(--accent)' : 'var(--muted)',
              }}
            >
              {feature.tier}
            </span>

            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isShellActive ? 'rgba(16, 185, 129, 0.1)' : 'var(--neutral-bg)',
                color: isShellActive ? '#059669' : 'var(--muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              {isShellActive ? null : <Lock size={10} />}
              {feature.badge}
            </span>
          </div>
        </div>

        <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--foreground)' }}>
          {feature.title}
        </h4>

        <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)', lineHeight: 1.5 }}>
          {feature.description}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--muted)' }}>
          {isSelected ? 'Đang mở công cụ' : isShellActive ? 'Nhấp để thao tác' : 'Chưa khả dụng'}
        </span>
        <ArrowRight size={13} style={{ color: isSelected ? 'var(--primary)' : 'var(--muted)' }} />
      </div>
    </div>
  );
};
