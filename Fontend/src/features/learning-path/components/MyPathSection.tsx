import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PersonalizedLearningPath, LearningPathMilestone } from '../services/learning-path.service';

interface MyPathSectionProps {
  path: PersonalizedLearningPath | null;
  selectedHskLevel?: number;
  onGeneratePath: () => Promise<void>;
  isGenerating?: boolean;
}

export const MyPathSection: React.FC<MyPathSectionProps> = ({
  path,
  selectedHskLevel = 1,
  onGeneratePath,
  isGenerating = false,
}) => {
  const navigate = useNavigate();
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({
    0: true, // First milestone expanded by default
  });

  const toggleMilestone = (index: number) => {
    setExpandedMilestones((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  if (!path) {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #fed7da',
          padding: '48px 32px',
          textAlign: 'center',
          boxShadow: '0 4px 20px -2px rgba(230, 0, 18, 0.05)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#FFF0F1',
            color: 'var(--primary, #E60012)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Compass size={32} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
          Bạn chưa khởi tạo Lộ trình học tập Cá nhân hóa
        </h2>
        <p style={{ fontSize: '15px', color: '#475569', maxWidth: '540px', margin: '0 auto 24px', lineHeight: 1.6 }}>
          Hệ thống AI sẽ kết hợp cấp độ HSK hiện tại (HSK {selectedHskLevel}), kết quả bài đánh giá năng lực và các điểm kiến thức còn yếu để phân chia giáo trình thành các chặng học tối ưu nhất.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onGeneratePath}
            disabled={isGenerating}
            style={{
              padding: '12px 28px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary, #E60012)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '14px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(230, 0, 18, 0.3)',
            }}
          >
            <Sparkles size={16} />
            {isGenerating ? 'Đang tạo lộ trình...' : 'Tạo lộ trình ngay bây giờ'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/practice')}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1.5px solid #cbd5e1',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Làm bài đánh giá HSK trước
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Path Overview Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #fed7da',
          padding: '28px 32px',
          boxShadow: '0 4px 20px -2px rgba(230, 0, 18, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', backgroundColor: '#FFF0F1', color: 'var(--primary, #E60012)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
              <Award size={14} />
              Lộ trình Cá nhân hóa đang hoạt động
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', margin: '4px 0 6px' }}>
              {path.title}
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Cấp HSK ban đầu: <strong style={{ color: '#0f172a' }}>HSK {selectedHskLevel}</strong>
              {path.currentEstimatedHskLevel && (
                <> (Đánh giá thực tế: <strong style={{ color: 'var(--primary, #E60012)' }}>HSK {path.currentEstimatedHskLevel}</strong>)</>
              )}
              {' '}→ Cấp HSK mục tiêu: <strong style={{ color: 'var(--primary, #E60012)' }}>HSK {path.targetHskLevel}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '10px 18px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>{path.totalEstimatedWeeks}</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Tổng số tuần</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px 18px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>{path.completedLessonsCount}/{path.totalLessonsCount}</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Bài học xong</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px 18px', backgroundColor: '#FFF0F1', borderRadius: '12px', border: '1px solid #FECDD3' }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary, #E60012)' }}>{Math.round(path.overallProgressPercent)}%</div>
              <div style={{ fontSize: '12px', color: 'var(--primary, #E60012)', fontWeight: 700 }}>Tiến độ lộ trình</div>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div style={{ width: '100%', height: '10px', backgroundColor: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${path.overallProgressPercent}%`,
              height: '100%',
              backgroundColor: 'var(--primary, #E60012)',
              borderRadius: '999px',
              transition: 'width 0.5s ease',
            }}
          />
        </div>

        {/* AI Pedagogical Rationale Card */}
        {path.pedagogicalRationaleVi && (
          <div
            style={{
              marginTop: '20px',
              padding: '16px 20px',
              borderRadius: '14px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              gap: '12px',
            }}
          >
            <Sparkles size={20} color="var(--primary, #E60012)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
                Phân tích sư phạm & Định hướng lộ trình (AI Advisor)
              </div>
              <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.55 }}>
                {path.pedagogicalRationaleVi}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Milestones Stepper / Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
          Các chặng học tập (Milestones & Modules)
        </h3>

        {path.milestones.map((milestone: LearningPathMilestone, index: number) => {
          const isExpanded = !!expandedMilestones[index];
          const completedCount = milestone.lessons.filter((l) => l.isCompleted).length;
          const totalCount = milestone.lessons.length;
          const isMilestoneDone = milestone.isCompleted || (totalCount > 0 && completedCount === totalCount);

          return (
            <div
              key={milestone.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: isMilestoneDone ? '1.5px solid #BBF7D0' : '1.5px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              }}
            >
              {/* Milestone Header */}
              <div
                onClick={() => toggleMilestone(index)}
                style={{
                  padding: '18px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  backgroundColor: isMilestoneDone ? '#F0FDF4' : '#ffffff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: isMilestoneDone ? '#DCFCE7' : '#FFF0F1',
                      color: isMilestoneDone ? '#16A34A' : 'var(--primary, #E60012)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '14px',
                    }}
                  >
                    {milestone.stageOrder}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        {milestone.title}
                      </span>
                      {isMilestoneDone && (
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                          HOÀN THÀNH
                        </span>
                      )}
                    </div>
                    {milestone.pedagogicalGoalVi && (
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                        {milestone.pedagogicalGoalVi}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#64748b' }}>
                    <BookOpen size={14} />
                    {completedCount}/{totalCount} bài
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#94a3b8' }}>
                    <Calendar size={14} />
                    ~{milestone.estimatedDays} ngày
                  </div>
                  {isExpanded ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
                </div>
              </div>

              {/* Milestone Details (Lessons list) */}
              {isExpanded && (
                <div style={{ padding: '0 24px 20px', borderTop: '1px solid #f1f5f9' }}>
                  {/* Skill tags */}
                  {milestone.targetSkills.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '14px 0 12px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Kỹ năng trọng tâm:</span>
                      {milestone.targetSkills.map((skill) => (
                        <span
                          key={skill}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#F1F5F9',
                            color: '#334155',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'capitalize',
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Lessons list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    {milestone.lessons.map((lesson) => {
                      return (
                        <div
                          key={lesson.lessonId}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '10px',
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                            {lesson.isCompleted ? (
                              <CheckCircle2 size={18} color="#16A34A" />
                            ) : (
                              <Circle size={18} color="#94A3B8" />
                            )}
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: lesson.isCompleted ? '#64748b' : '#0f172a' }}>
                                Bài {lesson.lessonNumber}: {lesson.titleZh} ({lesson.titleVi})
                              </div>
                              {lesson.pinyin && (
                                <div style={{ fontSize: '12px', color: '#64748b' }}>{lesson.pinyin}</div>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94a3b8' }}>
                              <Clock size={12} />
                              {lesson.durationMinutes}p
                            </span>
                            <button
                              type="button"
                              onClick={() => navigate(`/lesson/focus?id=${lesson.lessonId}`)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #cbd5e1',
                                color: 'var(--primary, #E60012)',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              Học bài
                              <ArrowRight size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
