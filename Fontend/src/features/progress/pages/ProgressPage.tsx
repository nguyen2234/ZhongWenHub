import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Flame,
  Zap,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  ArrowRight,
  Target,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLearningState } from '../../learning';
import { HSK_CURRICULUM, type CurriculumHskLevel } from '../../learning/data/curriculumData';
import type { DailyActivityRecord, PracticeAttemptRecord, WeakKnowledgeRecord } from '../../learning/types/learning-state.types';
import { StudentSecondaryNav } from '../../../layouts/components/StudentSecondaryNav';
import { STUDENT_MAIN_NAV_ITEMS } from '../../../config/student-navigation.config';

export const ProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    state,
    xpTotal,
    streakDays,
    completedLessonIds,
    learnedVocabCount,
    masteredVocabCount,
    weakKnowledge,
    resetDemoProgress,
  } = useLearningState();

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Calculate practice accuracy from attempts
  const practiceAccuracy = useMemo(() => {
    const attempts = state.exerciseAttempts || [];
    if (attempts.length === 0) {
      return null;
    }
    const correctCount = attempts.filter((a: PracticeAttemptRecord) => a.isCorrect).length;
    return Math.round((correctCount / attempts.length) * 100);
  }, [state.exerciseAttempts]);

  // Aggregate weekly study time (last 7 days from dailyActivityHistory or default days)
  const weeklyData = useMemo(() => {
    const historyEntries = Object.values(state.dailyActivityHistory || {});
    if (historyEntries.length > 0) {
      const slice = historyEntries.slice(-7);
      return slice.map((entry: DailyActivityRecord) => {
        const parts = entry.date.split('-');
        const dateStr = parts.length === 3 ? `${parts[2]}/${parts[1]}` : entry.date;
        const dayOfWeek = new Date(entry.date).toLocaleDateString('vi-VN', { weekday: 'short' });
        return {
          day: dayOfWeek.toUpperCase(),
          date: dateStr,
          minutes: entry.minutes,
          xp: entry.xpEarned,
          lessons: entry.completedLessons.length,
          vocab: entry.reviewsCompleted,
        };
      });
    }

    // Default fallback placeholder matching local demo
    return [
      { day: 'T2', date: '08/10', minutes: 25, xp: 60, lessons: 1, vocab: 10 },
      { day: 'T3', date: '09/10', minutes: 35, xp: 80, lessons: 1, vocab: 15 },
      { day: 'T4', date: '10/10', minutes: 20, xp: 40, lessons: 0, vocab: 20 },
      { day: 'T5', date: '11/10', minutes: 45, xp: 110, lessons: 1, vocab: 25 },
      { day: 'T6', date: '12/10', minutes: 30, xp: 75, lessons: 1, vocab: 15 },
      { day: 'T7', date: '13/10', minutes: 60, xp: 150, lessons: 2, vocab: 30 },
      { day: 'CN', date: '14/10', minutes: 40, xp: 90, lessons: 1, vocab: 20 },
    ];
  }, [state.dailyActivityHistory]);

  const totalWeeklyMinutes = weeklyData.reduce((acc: number, cur) => acc + cur.minutes, 0);
  const maxWeeklyMinutes = Math.max(1, ...weeklyData.map((d) => d.minutes));

  // Compute HSK level completion stats
  const hskProgressStats = useMemo(() => {
    return Object.values(HSK_CURRICULUM).map((level: CurriculumHskLevel) => {
      let totalLessonsInLevel = 0;
      let completedInLevel = 0;

      level.units.forEach((u) => {
        u.lessons.forEach((l) => {
          totalLessonsInLevel++;
          if (completedLessonIds.includes(l.id)) {
            completedInLevel++;
          }
        });
      });

      const percent =
        totalLessonsInLevel > 0
          ? Math.round((completedInLevel / totalLessonsInLevel) * 100)
          : 0;

      return {
        level: level.level,
        title: level.name,
        color: level.color,
        badgeText: level.vietnameseName,
        totalLessons: totalLessonsInLevel,
        completedLessons: completedInLevel,
        percent,
      };
    });
  }, [completedLessonIds]);

  const handleConfirmReset = () => {
    resetDemoProgress();
    setShowResetModal(false);
    setResetSuccess(true);
    setTimeout(() => {
      setResetSuccess(false);
    }, 3500);
  };

  return (
    <div className="student-content-container">
      {/* Toast Notification */}
      {resetSuccess && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            backgroundColor: '#16a34a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          <Check size={18} />
          <span>Đã đặt lại toàn bộ tiến độ học tập Demo thành công!</span>
        </div>
      )}

      {/* Secondary Sub-navigation for Tiến độ */}
      <div style={{ marginBottom: '20px' }}>
        <StudentSecondaryNav
          title="Tiến độ"
          items={STUDENT_MAIN_NAV_ITEMS.find((i) => i.id === 'progress')?.secondaryFeatures || []}
        />
      </div>

      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4338ca 0%, #312e81 100%)',
          borderRadius: '20px',
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              marginBottom: '8px',
            }}
          >
            <TrendingUp size={14} />
            <span>THỐNG KÊ & TIẾN ĐỘ HỌC TẬP</span>
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 800 }}>
            Tiến Độ Học Tập Cá Nhân
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, maxWidth: '640px', lineHeight: 1.5 }}>
            Theo dõi dữ liệu thực tế: bài học hoàn thành, từ vựng ghi nhớ Spaced Repetition, độ chính xác làm bài và phân tích kiến thức còn yếu.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              padding: '12px 20px',
              borderRadius: '14px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '22px', fontWeight: 800 }}>
              {Math.round(totalWeeklyMinutes / 60)}h {totalWeeklyMinutes % 60}m
            </div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Thời lượng tuần này</div>
          </div>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fecaca',
              padding: '10px 16px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
            title="Đặt lại tiến độ mẫu"
          >
            <RotateCcw size={14} />
            <span>Đặt lại Demo</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {[
          {
            label: 'Chuỗi học liên tiếp',
            value: `${streakDays} Ngày`,
            sub: `Hoạt động gần nhất hôm nay`,
            icon: Flame,
            color: '#ea580c',
            bg: '#ffedd5',
          },
          {
            label: 'Tổng điểm kinh nghiệm',
            value: `${xpTotal.toLocaleString()} XP`,
            sub: 'Tích lũy từ bài học & SRS',
            icon: Zap,
            color: '#4338ca',
            bg: '#eef2ff',
          },
          {
            label: 'Bài học đã xong',
            value: `${completedLessonIds.length} bài`,
            sub: `Đã mở khóa các bài kế tiếp`,
            icon: BookOpen,
            color: '#16a34a',
            bg: '#dcfce7',
          },
          {
            label: 'Từ vựng trong SRS',
            value: `${learnedVocabCount} từ`,
            sub: `${masteredVocabCount} từ đã thuộc vững`,
            icon: CheckCircle2,
            color: '#0284c7',
            bg: '#e0f2fe',
          },
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1.5px solid #e2e8f0',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: m.bg,
                  color: m.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={24} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '2px 0' }}>
                  {m.value}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{m.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid: Study Chart + Accuracy & Goal */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Study Time Chart */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #e2e8f0',
            padding: '24px 28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Thời Gian Học 7 Ngày Gần Nhất
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Trung bình mỗi ngày: <strong>{Math.round(totalWeeklyMinutes / Math.max(1, weeklyData.length))} phút</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#4338ca' }} />
              <span>Thời lượng (phút)</span>
            </div>
          </div>

          {/* Visual Bar Chart */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: '180px',
              paddingTop: '20px',
              borderBottom: '1px solid #e2e8f0',
              gap: '12px',
            }}
          >
            {weeklyData.map((d, idx: number) => {
              const heightPercent = Math.max(8, Math.round((d.minutes / maxWeeklyMinutes) * 100));

              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#4338ca' }}>
                    {d.minutes}m
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '44px',
                      height: `${heightPercent}%`,
                      borderRadius: '8px 8px 0 0',
                      backgroundColor: d.minutes >= 30 ? '#4338ca' : '#818cf8',
                      transition: 'height 0.4s ease',
                    }}
                    title={`${d.day}: ${d.minutes} phút · +${d.xp} XP`}
                  />
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
            {weeklyData.map((d, idx: number) => (
              <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{d.day}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>{d.date}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '14px', fontSize: '11px', color: '#94a3b8', textAlign: 'right' }}>
            * Dữ liệu thời gian học lưu trực tiếp tại Local Storage trình duyệt.
          </div>
        </div>

        {/* Practice Performance & Accuracy Tile */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #e2e8f0',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Target size={20} style={{ color: '#4338ca' }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Hiệu Suất Luyện Tập Bài Tập
              </h3>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: '#f8fafc',
                border: '1px solid #f1f5f9',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: practiceAccuracy !== null && practiceAccuracy >= 80 ? '#dcfce7' : '#eef2ff',
                  color: practiceAccuracy !== null && practiceAccuracy >= 80 ? '#16a34a' : '#4338ca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                {practiceAccuracy !== null ? `${practiceAccuracy}%` : '--'}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  {practiceAccuracy !== null
                    ? practiceAccuracy >= 80
                      ? 'Độ chính xác rất tốt!'
                      : 'Đang tiếp tục cải thiện'
                    : 'Chưa có lượt làm bài'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {state.exerciseAttempts?.length || 0} lượt trả lời câu hỏi được ghi nhận từ các phiên luyện tập.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#f1f5f9' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Số câu đã đúng</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>
                  {state.exerciseAttempts?.filter((a: PracticeAttemptRecord) => a.isCorrect).length || 0} câu
                </span>
              </div>
              <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#f1f5f9' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Số câu cần lưu ý</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#ea580c' }}>
                  {state.exerciseAttempts?.filter((a: PracticeAttemptRecord) => !a.isCorrect).length || 0} câu
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/practice')}
            style={{
              marginTop: '20px',
              width: '100%',
              backgroundColor: '#4338ca',
              color: '#ffffff',
              border: 'none',
              padding: '12px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>Tới Trung Tâm Luyện Tập</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* HSK Roadmap Completion Grid */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #e2e8f0',
          padding: '24px 28px',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              Tiến Độ Từng Cấp Độ HSK
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Chinh phục từ cơ bản HSK 1 đến nâng cao HSK 7–9.
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/learning-path')}
            style={{
              background: 'none',
              border: 'none',
              color: '#4338ca',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Xem lộ trình</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
          {hskProgressStats.map((item) => {
            const isCompleted = item.percent === 100;
            const inProgress = item.percent > 0 && item.percent < 100;

            return (
              <div
                key={item.level}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  backgroundColor: isCompleted ? '#ecfdf5' : inProgress ? '#f0fdfa' : '#f8fafc',
                  border: isCompleted
                    ? '1.5px solid #a7f3d0'
                    : inProgress
                    ? '1.5px solid #5eead4'
                    : '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: item.color,
                      color: '#ffffff',
                    }}
                  >
                    HSK {item.level}
                  </span>
                  {isCompleted ? (
                    <Check size={14} style={{ color: '#059669' }} />
                  ) : inProgress ? (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0d9488' }} />
                  ) : null}
                </div>

                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                  {item.title}
                </div>

                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                  {item.completedLessons}/{item.totalLessons} bài học ({item.percent}%)
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${item.percent}%`,
                      height: '100%',
                      backgroundColor: item.color,
                      borderRadius: '9999px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weak Knowledge Analysis Section */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #e2e8f0',
          padding: '24px 28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <AlertCircle size={20} style={{ color: '#ea580c' }} />
          <div>
            <h3 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              Phân Tích Kiến Thức Cần Cải Thiện (Adaptive Weak Knowledge)
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Thuật toán phân tích tất cả lần làm sai, tỷ lệ giải đúng gần nhất và tần suất xuất hiện (Không dùng AI bên ngoài).
            </span>
          </div>
        </div>

        {weakKnowledge.length === 0 ? (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: '16px',
              border: '1px dashed #cbd5e1',
            }}
          >
            <Sparkles size={32} style={{ color: '#16a34a', margin: '0 auto 12px auto' }} />
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
              Không có điểm kiến thức yếu nào cần cảnh báo!
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
              Bạn đang hoàn thành các bài học và bài tập với độ chính xác cao. Tiếp tục giữ vững phong độ nhé!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {weakKnowledge.map((item: WeakKnowledgeRecord) => {
              const isWeak = item.masteryLevel === 'WEAK';
              const isRecovering = item.masteryLevel === 'RECOVERING';

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    backgroundColor: isWeak ? '#fff7ed' : isRecovering ? '#f0fdf4' : '#f8fafc',
                    border: isWeak ? '1.5px solid #fdba74' : isRecovering ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                    flexWrap: 'wrap',
                    gap: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px' }}>
                    <div
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        backgroundColor: isWeak ? '#ea580c' : '#16a34a',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 800,
                      }}
                    >
                      {item.category.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                        {item.topicTitle}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {item.evidence}
                      </div>
                    </div>
                  </div>

                  {/* Accuracy & Trend Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: isWeak ? '#ea580c' : '#16a34a' }}>
                        {item.accuracy}% đúng
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                        {item.trend === 'improving' ? (
                          <>
                            <ArrowUpRight size={13} style={{ color: '#16a34a' }} />
                            <span>Đang cải thiện</span>
                          </>
                        ) : item.trend === 'declining' ? (
                          <>
                            <ArrowDownRight size={13} style={{ color: '#dc2626' }} />
                            <span>Cần chú ý thêm</span>
                          </>
                        ) : (
                          <>
                            <Minus size={13} style={{ color: '#64748b' }} />
                            <span>Ổn định</span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(item.suggestedPractice.route || '/practice')}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        color: '#0f172a',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      }}
                    >
                      <span>Luyện tập</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Reset Modal */}
      {showResetModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <RotateCcw size={24} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              Đặt lại tiến độ học tập Demo?
            </h3>

            <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Hành động này sẽ xóa dữ liệu học tập đã lưu trong trình duyệt (localStorage), bao gồm bài học đã xong, thẻ SRS, điểm XP và lịch sử luyện tập, sau đó khôi phục lại dữ liệu mẫu ban đầu.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmReset}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)',
                }}
              >
                Xác nhận đặt lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressPage;
