import React from 'react';
import type { DateRangeOption } from '../types/dashboard.types';

export interface DashboardDateRangeSelectProps {
  selectedRange: DateRangeOption;
  onChange: (range: DateRangeOption) => void;
}

const RANGE_OPTIONS: Array<{ value: DateRangeOption; label: string }> = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
];

export const DashboardDateRangeSelect: React.FC<DashboardDateRangeSelectProps> = ({
  selectedRange,
  onChange,
}) => {
  return (
    <div className="dashboard-date-range-pills" role="group" aria-label="Bộ lọc khoảng thời gian">
      {RANGE_OPTIONS.map((option) => {
        const isActive = selectedRange === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={`dashboard-date-range-pill ${isActive ? 'active' : ''}`.trim()}
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
