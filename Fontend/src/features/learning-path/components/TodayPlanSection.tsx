import React from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Sparkles,
  BookOpen,
  Brain,
  Layers,
  FileQuestion,
  RefreshCw,
  Flame,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DailyPlan, DailyLearningTask } from '../services/learning-path.service';

interface TodayPlanSectionProps {
  plan: DailyPlan | null;
  onCompleteTask: (taskId: string) => Promise<void>;
  onReplanToday: () => Promise<void>;
  isCompletingTaskId?: string | null;
  isReplanning?: boolean;
}

export const TodayPlanSection: React.FC<TodayPlanSectionProps> = ({
  plan,
  onCompleteTask,
  onReplanToday,
  isCompletingTaskId = null,
  isReplanning = false,
}) => {
  const navigate = useNavigate();

  if (!plan || plan.tasks.length === 0) {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          border: '1.5px solid #e2e8f0',
          padding: '36px',
          textAlign: 'center',
        }}
      >
        <Sparkles size={36} color="var(--primary, #E60012)" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Hôm nay bạn chưa có kế hoạch học tập</h3>
        <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '480px', margin: '8px auto 20px' }}>
          Hãy thiết lập mục tiêu hoặc tạo lộ trình cá nhân hóa để hệ thống AI sắp xếp danh sách bài học và bài tập hôm nay.
        </p>
      </div>
    );
  }

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'vocab':
      case 'srs':
        return <Brain size={18} color="#D97706" />;
      case 'grammar':
        return <Layers size={18} color="#2563EB" />;
      case 'reading':
        return <BookOpen size={18} color="#059669" />;
      case 'ai-exercise':
        return <Sparkles size={18} color="#7C3AED" />;
      case 'weakness':
        return <Flame size={18} color="#E60012" />;
      default:
        return <FileQuestion size={18} color="#475569" />;
    }
  };

  const getTaskTypeBadge = (taskType: string) => {
    switch (taskType) {
      case 'vocab':
        return { label: 'Từ vựng', bg: '#FEF3C7', color: '#B45309' };
      case 'srs':
        return { label: 'Ôn tập SRS', bg: '#FEE2E2', color: '#B91C1C' };
      case 'grammar':
        return { label: 'Ngữ pháp', bg: '#DBEAFE', color: '#1D4ED8' };
      case 'reading':
        return { label: 'Đọc hiểu', bg: '#D1FAE5', color: '#047857' };
      case 'ai-exercise':
        return { label: 'Bài tập AI', bg: '#EDE9FE', color: '#6D28D9' };
      case 'weakness':
        return { label: 'Khắc phục yếu điểm', bg: '#FFF0F1', color: '#E60012' };
      default:
        return { label: 'Bài học', bg: '#F1F5F9', color: '#475569' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Daily Summary & Progress Header */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          border: '1.5px solid #fed7da',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 4px 20px -2px rgba(230, 0, 18, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary, #E60012)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Kế hoạch học tập hôm nay
              </span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>•</span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                {new Date(plan.planDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>
              {plan.completedTasks >= plan.totalTasks && plan.totalTasks > 0
                ? 'Xuất sắc! Bạn đã hoàn thành toàn bộ mục tiêu hôm nay 🎉'
                : `Còn ${plan.totalTasks - plan.completedTasks} nhiệm vụ cần hoàn thành`}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onReplanToday}
              disabled={isReplanning}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isReplanning ? 'not-allowed' : 'pointer',
              }}
              title="Tính toán và điều chỉnh lại các nhiệm vụ chưa làm dựa theo tiến độ"
            >
              <RefreshCw size={14} className={isReplanning ? 'spin' : ''} />
              {isReplanning ? 'Đang điều chỉnh...' : 'Điều chỉnh hôm nay'}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
            <span style={{ color: '#475569' }}>
              Tiến độ: {plan.completedTasks}/{plan.totalTasks} nhiệm vụ ({Math.round(plan.dayCompletionPercent)}%)
            </span>
            <span style={{ color: '#64748b' }}>Ước tính: {plan.totalEstimatedMinutes} phút</span>
          </div>
          <div style={{ width: '100%', height: '10px', backgroundColor: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${plan.dayCompletionPercent}%`,
                height: '100%',
                backgroundColor: 'var(--primary, #E60012)',
                borderRadius: '999px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Suggested Next Task Card */}
      {plan.suggestedNextTask && (
        <div
          style={{
            backgroundColor: '#FFF0F1',
            borderRadius: '16px',
            border: '1.5px solid #FECDD3',
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                color: 'var(--primary, #E60012)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(230, 0, 18, 0.15)',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary, #E60012)', textTransform: 'uppercase' }}>
                Nhiệm vụ AI khuyên làm tiếp theo
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{plan.suggestedNextTask.title}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {plan.suggestedNextTask.description} ({plan.suggestedNextTask.estimatedMinutes} phút)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => navigate(plan.suggestedNextTask!.destinationRoute)}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary, #E60012)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Bắt đầu ngay
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {plan.tasks.map((task: DailyLearningTask) => {
          const isCompleted = task.completionStatus === 'COMPLETED';
          const typeBadge = getTaskTypeBadge(task.taskType);
          const isBusy = isCompletingTaskId === task.taskId;

          return (
            <div
              key={task.taskId}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                border: isCompleted ? '1.5px solid #BBF7D0' : '1.5px solid #E2E8F0',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                opacity: isCompleted ? 0.85 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                <button
                  type="button"
                  onClick={() => !isCompleted && onCompleteTask(task.taskId)}
                  disabled={isCompleted || isBusy}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: isCompleted ? 'default' : 'pointer',
                    color: isCompleted ? '#16A34A' : '#94A3B8',
                    marginTop: '2px',
                  }}
                  title={isCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                >
                  {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: typeBadge.bg,
                        color: typeBadge.color,
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {getTaskIcon(task.taskType)}
                      {typeBadge.label}
                    </span>

                    <span style={{ fontSize: '14px', fontWeight: 800, color: isCompleted ? '#64748b' : '#0f172a', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                      {task.title}
                    </span>
                  </div>

                  {task.description && (
                    <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.4 }}>
                      {task.description}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {task.estimatedMinutes} phút
                    </span>
                    <span>•</span>
                    <span>HSK {task.targetHskLevel}</span>
                    <span>•</span>
                    <span style={{ textTransform: 'capitalize' }}>{task.targetSkill}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => navigate(task.destinationRoute)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: isCompleted ? '#F1F5F9' : '#FFF0F1',
                    color: isCompleted ? '#475569' : 'var(--primary, #E60012)',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {isCompleted ? 'Xem lại' : 'Luyện tập'}
                  <ArrowRight size={13} />
                </button>

                {!isCompleted && (
                  <button
                    type="button"
                    onClick={() => onCompleteTask(task.taskId)}
                    disabled={isBusy}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#16A34A',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: isBusy ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isBusy ? 'Đang lưu...' : 'Xong'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
