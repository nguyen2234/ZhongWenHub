import React from 'react';
import { Clock, RotateCcw, Award, AlertCircle, Calendar } from 'lucide-react';
import type { StudentAssignmentDetailDTO } from '../../types/student-homework.types';

interface AssignmentRulesSummaryProps {
  detail: StudentAssignmentDetailDTO;
}

export const AssignmentRulesSummary: React.FC<AssignmentRulesSummaryProps> = ({ detail }) => {
  const rules = [
    {
      icon: Clock,
      label: 'Thời gian làm bài',
      value: detail.timeLimitMinutes ? `${detail.timeLimitMinutes} phút` : 'Không giới hạn thời gian',
      color: '#2563eb',
    },
    {
      icon: RotateCcw,
      label: 'Số lần làm tối đa',
      value: `${detail.maxAttempts} lần (${detail.attemptsUsed}/${detail.maxAttempts} đã dùng)`,
      color: '#7c3aed',
    },
    {
      icon: Award,
      label: 'Điểm số & Điểm đạt',
      value: `${detail.passingPoints}/${detail.totalPoints} điểm để vượt qua`,
      color: '#059669',
    },
    {
      icon: RotateCcw,
      label: 'Chính sách tính điểm',
      value: detail.retakePolicy === 'HIGHEST_SCORE' ? 'Lấy điểm cao nhất' : 'Lấy điểm lần làm gần nhất',
      color: '#d97706',
    },
    {
      icon: AlertCircle,
      label: 'Quy định nộp muộn',
      value: detail.allowLateSubmission
        ? `Cho phép nộp muộn (phạt ${detail.latePenaltyPercent}%)`
        : 'Không cho phép nộp muộn sau hạn',
      color: detail.allowLateSubmission ? '#d97706' : 'var(--danger)',
    },
    {
      icon: Calendar,
      label: 'Hạn chót & Đóng nộp',
      value: detail.dueDate
        ? `Hạn nộp: ${detail.dueDate}${detail.closeDate ? ` · Đóng: ${detail.closeDate}` : ''}`
        : 'Không có hạn nộp cố định',
      color: 'var(--foreground)',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 'var(--space-3)',
      }}
    >
      {rules.map((rule, idx) => {
        const Icon = rule.icon;
        return (
          <div
            key={idx}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: rule.color,
                flexShrink: 0,
              }}
            >
              <Icon size={16} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
                {rule.label}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--foreground)', fontWeight: 700, marginTop: '2px' }}>
                {rule.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
