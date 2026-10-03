import React from 'react';
import { Award, Flame, BookOpen, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react';
import { type LessonData } from '../types';
import { Button } from '../../../design-system';

interface LessonCompleteProps {
  lesson: LessonData;
  quizScore: number;
  totalQuizQuestions: number;
  onRestartLesson: () => void;
  onBackToLearningPath: () => void;
  onNextLesson?: () => void;
}

export const LessonComplete: React.FC<LessonCompleteProps> = ({
  lesson,
  quizScore,
  totalQuizQuestions,
  onRestartLesson,
  onBackToLearningPath,
  onNextLesson,
}) => {
  const accuracyPercent = Math.round((quizScore / totalQuizQuestions) * 100);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 'var(--space-5)',
        width: '100%',
        maxWidth: '580px',
        margin: '0 auto',
        padding: 'var(--space-6) var(--space-4)',
      }}
    >
      {/* Celebration Icon */}
      <div
        style={{
          width: '76px',
          height: '76px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--xp-bg)',
          border: '2px solid var(--xp-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          boxShadow: '0 8px 24px rgba(245, 158, 11, 0.25)',
          animation: 'bounce 0.6s ease',
        }}
      >
        🎉
      </div>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--foreground)' }}>
          Hoàn thành bài học xuất sắc!
        </h1>
        <div style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--primary)' }}>
          {lesson.hanziTitle}
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', marginTop: '2px' }}>
          {lesson.pinyinTitle} • &quot;{lesson.vietnameseTitle}&quot;
        </div>
      </div>

      {/* Result Metrics Grid */}
      <div
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--space-3)',
        }}
      >
        {/* Metric 1: XP */}
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--xp-bg)',
            border: '1px solid var(--xp-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--xp)', fontWeight: 700, fontSize: 'var(--text-xl)' }}>
            <Award size={22} />
            <span>+{lesson.xpReward} XP</span>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 500 }}>
            Điểm kinh nghiệm nhận được
          </span>
        </div>

        {/* Metric 2: Accuracy */}
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: 'var(--text-xl)' }}>
            {accuracyPercent}%
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 500 }}>
            Độ chính xác ({quizScore}/{totalQuizQuestions} câu)
          </span>
        </div>

        {/* Metric 3: Words Learned */}
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 700, fontSize: 'var(--text-lg)' }}>
            <BookOpen size={18} />
            <span>{lesson.vocabulary.length} từ mới</span>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 500 }}>
            Đã lưu vào bộ nhớ dài hạn
          </span>
        </div>

        {/* Metric 4: Streak maintained */}
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--streak-bg)',
            border: '1px solid var(--streak-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--streak)', fontWeight: 700, fontSize: 'var(--text-lg)' }}>
            <Flame size={20} />
            <span>Chuỗi {lesson.streakDays} ngày</span>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 500 }}>
            Đã duy trì mục tiêu hôm nay
          </span>
        </div>
      </div>

      {/* Action CTA Buttons */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-2-5)', marginTop: 'var(--space-2)' }}>
        {/* Primary CTA */}
        <Button
          variant="primary"
          icon={<ArrowRight size={18} />}
          onClick={onNextLesson || onBackToLearningPath}
          style={{
            width: '100%',
            minHeight: '48px',
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(67, 56, 202, 0.3)',
          }}
        >
          BÀI TIẾP THEO (BÀI 9) ➜
        </Button>

        {/* Secondary CTAs */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', width: '100%' }}>
          <Button
            variant="outline"
            icon={<RotateCcw size={15} />}
            onClick={onRestartLesson}
            style={{ flex: 1, minHeight: '42px', fontSize: 'var(--text-xs)', fontWeight: 600 }}
          >
            Ôn lại bài này
          </Button>

          <Button
            variant="secondary"
            icon={<ArrowLeft size={15} />}
            onClick={onBackToLearningPath}
            style={{ flex: 1, minHeight: '42px', fontSize: 'var(--text-xs)', fontWeight: 600 }}
          >
            Quay lại lộ trình
          </Button>
        </div>
      </div>
    </div>
  );
};
