import React from 'react';
import { BookOpen, Users, FileCheck, Clock } from 'lucide-react';
import { StatCard } from '../../../shared/components';
import type { TeacherKPIMetrics } from '../../types/dashboard.types';

export interface TeacherStatGridProps {
  metrics: TeacherKPIMetrics;
  onActiveClassesClick?: () => void;
  onPendingSubmissionsClick?: () => void;
}

export const TeacherStatGrid: React.FC<TeacherStatGridProps> = ({
  metrics,
  onActiveClassesClick,
  onPendingSubmissionsClick,
}) => {
  return (
    <div className="teacher-kpi-grid">
      <StatCard
        title="LỚP ĐANG DẠY"
        value={metrics.activeClassesCount.toString().padStart(2, '0')}
        change="Đang hoạt động"
        changeType="positive"
        icon={<BookOpen size={20} />}
        description="Đang giảng dạy"
        onClick={onActiveClassesClick}
      />
      <StatCard
        title="TỔNG HỌC VIÊN"
        value={metrics.totalEnrolledStudents.toLocaleString()}
        change="Active members"
        changeType="neutral"
        icon={<Users size={20} />}
        description="Đang theo học"
      />
      <StatCard
        title="BÀI NỘP CHỜ CHẤM"
        value={metrics.pendingSubmissionsCount.toString()}
        change="Cần xử lý"
        changeType={metrics.pendingSubmissionsCount > 0 ? 'negative' : 'positive'}
        icon={<FileCheck size={20} />}
        description="Bản xem thử Demo"
        onClick={onPendingSubmissionsClick}
      />
      <StatCard
        title="GIỜ DẠY TRONG TUẦN"
        value={`${metrics.weeklyTeachingHours}h`}
        change="Theo thời khóa biểu"
        changeType="neutral"
        icon={<Clock size={20} />}
        description="Tuần này"
      />
    </div>
  );
};
