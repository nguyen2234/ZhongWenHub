import React from 'react';
import type { HskLevel } from '../types';

export interface LevelFilterBarProps {
  levels: HskLevel[];
  selectedLevelId: string; // 'ALL' or specific levelId
  onSelectLevel: (levelId: string) => void;
  showAllOption?: boolean;
}

export const LevelFilterBar: React.FC<LevelFilterBarProps> = ({
  levels,
  selectedLevelId,
  onSelectLevel,
  showAllOption = true,
}) => {
  return (
    <div className="lcm-level-bar-wrap">
      <span className="lcm-level-bar-label">Cấp độ HSK:</span>
      <div className="lcm-level-pills">
        {showAllOption && (
          <button
            type="button"
            className={`lcm-level-pill ${selectedLevelId === 'ALL' ? 'is-active' : ''}`}
            onClick={() => onSelectLevel('ALL')}
          >
            Tất cả
          </button>
        )}
        {levels.map((lvl) => {
          const isActive = selectedLevelId === lvl.id;
          return (
            <button
              key={lvl.id}
              type="button"
              className={`lcm-level-pill ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelectLevel(lvl.id)}
            >
              {lvl.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
