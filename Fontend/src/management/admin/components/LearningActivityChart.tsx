import React, { useState } from 'react';
import type { LearningActivityPoint } from '../types/dashboard.types';

export interface LearningActivityChartProps {
  data: LearningActivityPoint[];
  rangeLabel: string;
}

type ActiveMetric = 'sessions' | 'completedLessons';

export const LearningActivityChart: React.FC<LearningActivityChartProps> = ({
  data,
  rangeLabel,
}) => {
  const [activeMetric, setActiveMetric] = useState<ActiveMetric>('sessions');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compute maximum value for scaling
  const values = data.map((d) => d[activeMetric]);
  const rawMax = Math.max(...values, 10);
  // Round up to nearest clean step
  const step = Math.ceil(rawMax / 4 / 50) * 50 || 10;
  const chartMax = step * 4;

  const metricLabel = activeMetric === 'sessions' ? 'Lượt học / Phiên học' : 'Bài học hoàn thành';
  const metricColor = activeMetric === 'sessions' ? '#4f46e5' : '#0ea5e9';

  // SVG dimensions
  const svgWidth = 640;
  const svgHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const barCount = data.length;
  const slotWidth = plotWidth / barCount;
  const barWidth = Math.min(36, Math.max(16, slotWidth * 0.55));

  return (
    <div className="chart-card-wrapper">
      <div className="chart-header">
        <div className="chart-title-area">
          <h3>Hoạt động học tập ({rangeLabel})</h3>
          <p>Tần suất học tập và tiến độ hoàn thành bài giảng</p>
        </div>

        <div className="chart-metric-toggles" role="tablist" aria-label="Chọn chỉ số biểu đồ">
          <button
            type="button"
            className={`chart-toggle-btn ${activeMetric === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveMetric('sessions')}
          >
            Lượt học (Sessions)
          </button>
          <button
            type="button"
            className={`chart-toggle-btn ${activeMetric === 'completedLessons' ? 'active' : ''}`}
            onClick={() => setActiveMetric('completedLessons')}
          >
            Bài hoàn thành
          </button>
        </div>
      </div>

      <div className="svg-chart-container">
        <svg
          className="svg-chart-inner"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: 'visible' }}
        >
          {/* Horizontal grid lines and Y-axis labels */}
          {[0, 1, 2, 3, 4].map((stepIdx) => {
            const yVal = paddingTop + (plotHeight * (4 - stepIdx)) / 4;
            const gridVal = Math.round((chartMax * stepIdx) / 4);

            return (
              <g key={stepIdx}>
                <line
                  x1={paddingLeft}
                  y1={yVal}
                  x2={svgWidth - paddingRight}
                  y2={yVal}
                  stroke="var(--border-subtle, #f1f5f9)"
                  strokeWidth="1"
                  strokeDasharray={stepIdx === 0 ? 'none' : '3 3'}
                />
                <text
                  x={paddingLeft - 8}
                  y={yVal + 3.5}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--muted, #94a3b8)"
                  fontWeight="500"
                >
                  {gridVal >= 1000 ? `${(gridVal / 1000).toFixed(1)}k` : gridVal}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((item, idx) => {
            const val = item[activeMetric];
            const barHeight = Math.max(4, (val / chartMax) * plotHeight);
            const x = paddingLeft + idx * slotWidth + (slotWidth - barWidth) / 2;
            const y = paddingTop + plotHeight - barHeight;
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={item.date}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Background hover slot highlight */}
                <rect
                  x={paddingLeft + idx * slotWidth}
                  y={paddingTop}
                  width={slotWidth}
                  height={plotHeight}
                  fill={isHovered ? 'rgba(79, 70, 229, 0.04)' : 'transparent'}
                  rx="4"
                />

                {/* Primary Bar */}
                <rect
                  className="svg-bar-element"
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={isHovered ? '#3730a3' : metricColor}
                  rx="4"
                  ry="4"
                />

                {/* X-axis date label */}
                <text
                  x={x + barWidth / 2}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  fontSize="11"
                  fill={isHovered ? 'var(--foreground, #0f172a)' : 'var(--muted, #64748b)'}
                  fontWeight={isHovered ? '700' : '500'}
                >
                  {item.date}
                </text>

                {/* Floating tooltip / badge on hover */}
                {isHovered && (
                  <g pointerEvents="none">
                    <rect
                      x={Math.max(10, Math.min(svgWidth - 110, x + barWidth / 2 - 50))}
                      y={Math.max(5, y - 34)}
                      width="100"
                      height="26"
                      rx="4"
                      fill="#0f172a"
                    />
                    <text
                      x={Math.max(10, Math.min(svgWidth - 110, x + barWidth / 2 - 50)) + 50}
                      y={Math.max(5, y - 34) + 16}
                      textAnchor="middle"
                      fontSize="10.5"
                      fill="#ffffff"
                      fontWeight="600"
                    >
                      {val.toLocaleString()} {activeMetric === 'sessions' ? 'lượt' : 'bài'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-2)', fontSize: '11px', color: 'var(--muted)' }}>
        <span>Đơn vị đo: {metricLabel}</span>
        <span>Hover vào cột để xem chi tiết</span>
      </div>
    </div>
  );
};
