import React from 'react';
import type { TeacherSummaryKPIs } from '../types/teacher.types';

export interface TeacherSummaryStripProps {
  kpis: TeacherSummaryKPIs;
}

export const TeacherSummaryStrip: React.FC<TeacherSummaryStripProps> = ({ kpis }) => {
  return (
    <div className="teacher-summary-strip" role="region" aria-label="Thống kê nhanh giáo viên">
      <div className="teacher-strip-item">
        <span className="teacher-strip-dot" style={{ backgroundColor: 'var(--primary)' }} />
        <div className="teacher-strip-content">
          <span className="teacher-strip-val">{kpis.totalTeachers.toLocaleString()}</span>
          <span className="teacher-strip-lbl">Tổng giáo viên</span>
        </div>
      </div>

      <div className="teacher-strip-item">
        <span className="teacher-strip-dot" style={{ backgroundColor: '#16a34a' }} />
        <div className="teacher-strip-content">
          <span className="teacher-strip-val">{kpis.activeTeaching.toLocaleString()}</span>
          <span className="teacher-strip-lbl">Đang giảng dạy</span>
        </div>
      </div>

      <div className="teacher-strip-item">
        <span className="teacher-strip-dot" style={{ backgroundColor: '#d97706' }} />
        <div className="teacher-strip-content">
          <span className="teacher-strip-val">{kpis.onLeaveTeaching.toLocaleString()}</span>
          <span className="teacher-strip-lbl">Tạm nghỉ</span>
        </div>
      </div>

      <div className="teacher-strip-item">
        <span className="teacher-strip-dot" style={{ backgroundColor: '#0284c7' }} />
        <div className="teacher-strip-content">
          <span className="teacher-strip-val">{kpis.activeClasses.toLocaleString()}</span>
          <span className="teacher-strip-lbl">Lớp đang hoạt động</span>
        </div>
      </div>
    </div>
  );
};
