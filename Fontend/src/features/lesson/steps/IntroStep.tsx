import React from 'react';
import { Target, MessageCircle, Clock, Award, Sparkles } from 'lucide-react';
import { type LessonData } from '../types';
import { AudioPlayerButton } from '../components/AudioPlayerButton';

interface IntroStepProps {
  lesson: LessonData;
}

export const IntroStep: React.FC<IntroStepProps> = ({ lesson }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', width: '100%' }}>
      {/* Title & Chinese Visual Focus */}
      <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 12px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
          <Sparkles size={14} />
          <span>MỤC TIÊU BÀI HỌC HSK {lesson.hskLevel}</span>
        </div>

        {/* 1. Hanzi -> 2. Pinyin -> 3. Vietnamese */}
        <h1
          style={{
            fontFamily: 'var(--font-hanzi)',
            fontSize: 'var(--hanzi-display-md)',
            fontWeight: 700,
            margin: 'var(--space-2) 0',
            color: 'var(--foreground)',
            lineHeight: 1.15,
          }}
        >
          {lesson.hanziTitle}
        </h1>

        <div style={{ fontSize: 'var(--text-xl)', color: 'var(--primary)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          {lesson.pinyinTitle}
        </div>

        <div style={{ fontSize: 'var(--text-base)', color: 'var(--muted)', fontWeight: 500 }}>
          &quot;{lesson.vietnameseTitle}&quot;
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} /> {lesson.durationMinutes} phút
          </span>
          <span>•</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--xp)', fontWeight: 700 }}>
            <Award size={14} /> +{lesson.xpReward} XP khi hoàn thành
          </span>
        </div>
      </div>

      {/* Learning Objectives Card */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-5)',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Target size={16} />
          </div>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--foreground)' }}>
            Sau bài học này, bạn sẽ tự tin:
          </span>
        </div>

        <ul style={{ margin: 0, paddingLeft: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--foreground)', lineHeight: 1.5 }}>
          {lesson.objectives.map((obj, i) => (
            <li key={i}>{obj}</li>
          ))}
        </ul>
      </div>

      {/* Context Dialogue Teaser */}
      {lesson.contextDialogueSnippet && (
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--background)',
            border: '1px dashed var(--border-strong)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
              <MessageCircle size={14} />
              <span>Tình huống thực tế (Quán đồ uống)</span>
            </div>
            <AudioPlayerButton textToSpeak="你想喝什么？我想喝一杯热茶。" size="sm" variant="outline" label="Nghe mẫu" />
          </div>

          <div style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--foreground)', marginTop: '4px' }}>
            {lesson.contextDialogueSnippet.hanzi}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', fontWeight: 600 }}>
            {lesson.contextDialogueSnippet.pinyin}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic' }}>
            {lesson.contextDialogueSnippet.meaning}
          </div>
        </div>
      )}
    </div>
  );
};
