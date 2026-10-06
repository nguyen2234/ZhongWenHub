import React, { useState } from 'react';
import { ChineseDesignSystemShowcase } from '../showcase/ChineseDesignSystemShowcase';
import { DesignSystemShowcase } from '../showcase/DesignSystemShowcase';

export const DesignSystemShowcasePage: React.FC = () => {
  const [view, setView] = useState<'chinese' | 'original'>('chinese');

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 600 }}>
          Chế độ xem Showcase:
        </span>
        <button
          type="button"
          onClick={() => setView('chinese')}
          className={`ds-btn ds-btn-sm ${view === 'chinese' ? 'ds-btn-primary' : 'ds-btn-ghost'}`}
          style={{ height: '28px', fontSize: '11px', padding: '0 10px' }}
        >
          HSK EdTech Theme
        </button>
        <button
          type="button"
          onClick={() => setView('original')}
          className={`ds-btn ds-btn-sm ${view === 'original' ? 'ds-btn-primary' : 'ds-btn-ghost'}`}
          style={{ height: '28px', fontSize: '11px', padding: '0 10px' }}
        >
          Base Design System
        </button>
      </div>

      {view === 'chinese' ? <ChineseDesignSystemShowcase /> : <DesignSystemShowcase />}
    </div>
  );
};

export default DesignSystemShowcasePage;
