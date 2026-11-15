import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck,
  MapPin,
  Settings,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { learningPathService } from '../services/learning-path.service';
import type {
  LearningGoal,
  PersonalizedLearningPath,
  DailyPlan,
  PersonalizedLearningProgress,
  UpdateLearningGoalRequest,
} from '../services/learning-path.service';
import { TodayPlanSection } from './TodayPlanSection';
import { MyPathSection } from './MyPathSection';
import { GoalSetupCard } from './GoalSetupCard';

export const PersonalizedLearningDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'path' | 'goal'>('today');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [goal, setGoal] = useState<LearningGoal | null>(null);
  const [path, setPath] = useState<PersonalizedLearningPath | null>(null);
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [progress, setProgress] = useState<PersonalizedLearningProgress | null>(null);

  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [isReplanning, setIsReplanning] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSavingGoal, setIsSavingGoal] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [goalRes, pathRes, planRes, progressRes] = await Promise.all([
        learningPathService.getGoals().catch(() => null),
        learningPathService.getCurrentPath().catch(() => null),
        learningPathService.getTodayPlan().catch(() => null),
        learningPathService.getProgress().catch(() => null),
      ]);

      if (goalRes) setGoal(goalRes);
      if (pathRes) setPath(pathRes);
      if (planRes) setPlan(planRes);
      if (progressRes) setProgress(progressRes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải dữ liệu lộ trình học tập';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTaskId(taskId);
    try {
      const res = await learningPathService.completeTask(taskId);
      if (res) {
        // Update local daily plan
        setPlan((prev) => {
          if (!prev) return prev;
          const updatedTasks = prev.tasks.map((t) =>
            t.taskId === taskId ? { ...t, completionStatus: 'COMPLETED', completedAt: new Date().toISOString() } : t
          );
          const completedCount = updatedTasks.filter((t) => t.completionStatus === 'COMPLETED').length;
          return {
            ...prev,
            completedTasks: completedCount,
            dayCompletionPercent: res.dayCompletionPercent,
            tasks: updatedTasks,
            suggestedNextTask: res.suggestedNextTask,
          };
        });

        // Also update path progress if path is loaded
        setPath((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            overallProgressPercent: res.updatedOverallProgressPercent,
          };
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể hoàn thành nhiệm vụ';
      alert(msg);
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleReplanToday = async () => {
    setIsReplanning(true);
    try {
      const res = await learningPathService.replanToday({ reason: 'Manual rebalance' });
      if (res) {
        setPlan(res);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể điều chỉnh kế hoạch';
      alert(msg);
    } finally {
      setIsReplanning(false);
    }
  };

  const handleGeneratePath = async () => {
    setIsGenerating(true);
    try {
      const res = await learningPathService.generatePath({ includeAiExplanation: true });
      if (res) {
        setPath(res);
        // Refresh today plan as well
        const planRes = await learningPathService.getTodayPlan().catch(() => null);
        if (planRes) setPlan(planRes);
        setActiveTab('today');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo lộ trình';
      alert(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGoal = async (goalReq: UpdateLearningGoalRequest) => {
    setIsSavingGoal(true);
    try {
      const res = await learningPathService.updateGoals(goalReq);
      if (res) {
        setGoal(res);
      }
      // Re-generate path with new goal
      await handleGeneratePath();
    } finally {
      setIsSavingGoal(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
        <RefreshCw size={32} color="var(--primary, #E60012)" className="spin" style={{ marginBottom: '16px' }} />
        <p style={{ fontSize: '15px', color: '#64748b', fontWeight: 600 }}>Đang tải lộ trình học tập cá nhân hóa...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1.5px solid #e2e8f0',
          paddingBottom: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('today')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            border: activeTab === 'today' ? '1.5px solid #FECDD3' : '1px solid transparent',
            backgroundColor: activeTab === 'today' ? '#FFF0F1' : 'transparent',
            color: activeTab === 'today' ? 'var(--primary, #E60012)' : '#475569',
            fontWeight: activeTab === 'today' ? 800 : 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <CalendarCheck size={18} />
          Kế hoạch hôm nay
          {plan && plan.totalTasks > 0 && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '999px',
                backgroundColor: activeTab === 'today' ? 'var(--primary, #E60012)' : '#cbd5e1',
                color: '#ffffff',
                fontWeight: 800,
              }}
            >
              {plan.completedTasks}/{plan.totalTasks}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('path')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            border: activeTab === 'path' ? '1.5px solid #FECDD3' : '1px solid transparent',
            backgroundColor: activeTab === 'path' ? '#FFF0F1' : 'transparent',
            color: activeTab === 'path' ? 'var(--primary, #E60012)' : '#475569',
            fontWeight: activeTab === 'path' ? 800 : 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <MapPin size={18} />
          Lộ trình của tôi
          {path && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '999px',
                backgroundColor: activeTab === 'path' ? 'var(--primary, #E60012)' : '#cbd5e1',
                color: '#ffffff',
                fontWeight: 800,
              }}
            >
              {Math.round(path.overallProgressPercent)}%
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('goal')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            border: activeTab === 'goal' ? '1.5px solid #FECDD3' : '1px solid transparent',
            backgroundColor: activeTab === 'goal' ? '#FFF0F1' : 'transparent',
            color: activeTab === 'goal' ? 'var(--primary, #E60012)' : '#475569',
            fontWeight: activeTab === 'goal' ? 800 : 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Settings size={18} />
          Thiết lập mục tiêu
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            backgroundColor: '#FEE2E2',
            color: '#B91C1C',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === 'today' && (
        <TodayPlanSection
          plan={plan}
          onCompleteTask={handleCompleteTask}
          onReplanToday={handleReplanToday}
          isCompletingTaskId={completingTaskId}
          isReplanning={isReplanning}
        />
      )}

      {activeTab === 'path' && (
        <MyPathSection
          path={path}
          selectedHskLevel={progress?.selectedHskLevel || goal?.targetHskLevel || 1}
          onGeneratePath={handleGeneratePath}
          isGenerating={isGenerating}
        />
      )}

      {activeTab === 'goal' && (
        <GoalSetupCard
          initialGoal={goal}
          selectedHskLevel={progress?.selectedHskLevel || 1}
          onSaveGoal={handleSaveGoal}
          isLoading={isSavingGoal}
        />
      )}
    </div>
  );
};
