import React from 'react';
import {
  MessageSquare,
  Sparkles,
  AlertTriangle,
  Compass,
  Dumbbell,
  Flame,
  BarChart3,
  ArrowRight,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import type { StudentAIFeatureItem } from '../services/student-ai.service';

interface StudentAIFeatureCardProps {
  feature: StudentAIFeatureItem;
  onActivate: (feature: StudentAIFeatureItem) => void;
}

export const StudentAIFeatureCard: React.FC<StudentAIFeatureCardProps> = ({ feature, onActivate }) => {
  const isAvailable = feature.status === 'AVAILABLE';

  const renderIcon = () => {
    switch (feature.iconName) {
      case 'MessageSquare':
        return <MessageSquare size={22} />;
      case 'Sparkles':
        return <Sparkles size={22} />;
      case 'AlertTriangle':
        return <AlertTriangle size={22} />;
      case 'Compass':
        return <Compass size={22} />;
      case 'Dumbbell':
        return <Dumbbell size={22} />;
      case 'Flame':
        return <Flame size={22} />;
      case 'BarChart3':
        return <BarChart3 size={22} />;
      default:
        return <Sparkles size={22} />;
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        padding: 'var(--space-5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        transition: 'all 0.15s ease',
        boxShadow: isAvailable ? '0 4px 12px rgba(67, 56, 202, 0.06)' : 'none',
        position: 'relative',
      }}
    >
      <div>
        {/* Top Badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: isAvailable ? 'rgba(67, 56, 202, 0.1)' : 'var(--neutral-bg)',
              color: isAvailable ? 'var(--primary)' : 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {renderIcon()}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Free / Pro Tag */}
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: feature.tier === 'PRO' ? 'rgba(190, 18, 60, 0.1)' : 'var(--neutral-bg)',
                color: feature.tier === 'PRO' ? 'var(--accent)' : 'var(--muted)',
                border: feature.tier === 'PRO' ? '1px solid rgba(190, 18, 60, 0.2)' : '1px solid var(--border)',
              }}
            >
              {feature.tier === 'PRO' ? 'PRO' : 'MIỄN PHÍ'}
            </span>

            {/* Status Badge */}
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isAvailable ? 'rgba(16, 185, 129, 0.1)' : 'var(--neutral-bg)',
                color: isAvailable ? '#059669' : 'var(--muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {isAvailable ? <CheckCircle2 size={11} /> : <Lock size={11} />}
              {feature.badge}
            </span>
          </div>
        </div>

        {/* Title and Description */}
        <h3
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            color: 'var(--foreground)',
            margin: '0 0 var(--space-2) 0',
            lineHeight: 1.3,
          }}
        >
          {feature.title}
        </h3>

        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--muted)',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {feature.description}
        </p>
      </div>

      {/* Action CTA */}
      <div style={{ paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border)' }}>
        {isAvailable ? (
          <button
            type="button"
            onClick={() => onActivate(feature)}
            className="ds-btn ds-btn-primary"
            style={{
              width: '100%',
              height: '38px',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              gap: '6px',
            }}
          >
            <span>Trải nghiệm ngay</span>
            <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="ds-btn"
            style={{
              width: '100%',
              height: '38px',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              backgroundColor: 'var(--neutral-bg)',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
              cursor: 'not-allowed',
            }}
          >
            Đang phát triển (Giai đoạn tiếp theo)
          </button>
        )}
      </div>
    </div>
  );
};
