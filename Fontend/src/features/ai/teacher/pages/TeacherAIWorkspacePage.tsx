import React, { useState } from 'react';
import {
  BrainCircuit,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { teacherAIService } from '../services/teacher-ai.service';
import type { TeacherAIFeatureItem } from '../types/teacher-ai.types';
import { TeacherAIFeatureCard } from '../components/TeacherAIFeatureCard';
import { LessonPlannerShell } from '../components/LessonPlannerShell';
import { ExerciseGeneratorShell } from '../components/ExerciseGeneratorShell';
import { PreGradingShell } from '../components/PreGradingShell';

export const TeacherAIWorkspacePage: React.FC = () => {
  const [features] = useState<TeacherAIFeatureItem[]>(() => teacherAIService.getFeatures());
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>('lesson-planner');

  const selectedFeature = features.find((f) => f.id === selectedFeatureId) || features[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: 'var(--space-6)' }}>
      {/* 1. Header Hero */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(67, 56, 202, 0.12)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BrainCircuit size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                  Không gian Trợ lý Giảng dạy AI
                </h1>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(67, 56, 202, 0.1)',
                    color: 'var(--primary)',
                  }}
                >
                  Teacher AI 1.0
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
                Bộ công cụ AI nâng cao năng suất giảng dạy: Soạn giáo án, sinh đề bài tập và tiền chấm điểm tự luận
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--neutral-bg)',
              border: '1px solid var(--border)',
              fontSize: 'var(--text-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ color: 'var(--muted)' }}>Giảng viên:</span>
            <strong>Thầy Nguyễn Văn A (tch-001)</strong>
            <span style={{ color: 'var(--muted)' }}>• Quyền:</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Teacher Pro AI</span>
          </div>
        </div>
      </div>

      {/* 2. Feature Cards Grid */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
            Công Cụ Trợ Lý Giảng Dạy ({features.length})
          </h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
            Chọn công cụ để hiển thị khung làm việc tương ứng
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'var(--space-3)',
          }}
        >
          {features.map((feature) => (
            <TeacherAIFeatureCard
              key={feature.id}
              feature={feature}
              isSelected={selectedFeatureId === feature.id}
              onSelect={(f) => setSelectedFeatureId(f.id)}
            />
          ))}
        </div>
      </div>

      {/* 3. Active Workspace Tool Shell */}
      <div style={{ marginTop: 'var(--space-2)' }}>
        {selectedFeatureId === 'lesson-planner' && <LessonPlannerShell />}
        {selectedFeatureId === 'exercise-generator' && <ExerciseGeneratorShell />}
        {selectedFeatureId === 'pre-grading' && <PreGradingShell />}

        {selectedFeature.status === 'COMING_SOON' && (
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px dashed var(--border)',
              padding: 'var(--space-12) var(--space-6)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--neutral-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--muted)',
              }}
            >
              <Lock size={22} />
            </div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)' }}>
              {selectedFeature.title}
            </h3>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--muted)', maxWidth: '420px', lineHeight: 1.6 }}>
              Tính năng đang được nghiên cứu mô hình hóa trong lộ trình Phase tiếp theo. Chúng tôi sẽ thông báo đến quý thầy cô ngay khi phiên bản thử nghiệm sẵn sàng.
            </p>
          </div>
        )}
      </div>

      {/* 4. Pedagogical Quality & Authorization Disclaimers */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-5)',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-3)',
        }}
      >
        <ShieldCheck size={22} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ margin: '0 0 2px 0', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--foreground)' }}>
            Nguyên tắc Vận hành AI: Giáo viên nắm quyền quyết định tối cao (Teacher-in-the-Loop)
          </h4>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)', lineHeight: 1.5 }}>
            Tất cả các nội dung do AI tạo ra (giáo án, bài tập, đề xuất điểm thi) đều chỉ đóng vai trò hỗ trợ và tham khảo.
            Giáo viên là người kiểm duyệt cuối cùng trước khi tài liệu hoặc điểm số được công bố tới học viên.
          </p>
        </div>
      </div>
    </div>
  );
};
