import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  BrainCircuit,
  Award,
  TrendingUp,
  X,
  ShieldCheck,
} from 'lucide-react';
import { studentAIService, type StudentAIFeatureItem } from '../services/student-ai.service';
import type { StudentLearningProfile } from '../types/student-ai.types';
import { getCurrentStudentIdentity } from '../../../auth/services/student-identity.adapter';
import { useAITutor } from '../../../ai-tutor';
import { StudentAIFeatureCard } from '../components/StudentAIFeatureCard';

export const StudentAIWorkspacePage: React.FC = () => {
  const currentStudent = getCurrentStudentIdentity();
  const { openAITutor } = useAITutor();

  const [features] = useState<StudentAIFeatureItem[]>(() => studentAIService.getFeatures());
  const [profile, setProfile] = useState<StudentLearningProfile | null>(null);
  const [selectedFeatureInfo, setSelectedFeatureInfo] = useState<StudentAIFeatureItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    studentAIService.getStudentLearningProfile(currentStudent.id).then((data) => {
      if (isMounted) setProfile(data);
    });
    return () => {
      isMounted = false;
    };
  }, [currentStudent.id]);

  const handleActivateFeature = (feat: StudentAIFeatureItem) => {
    if (feat.id === 'ai-tutor') {
      openAITutor(
        {
          source: 'general',
          hskLevel: 3,
        },
        'Chào bạn, tôi muốn ôn tập ngữ pháp HSK hôm nay!'
      );
    } else {
      setSelectedFeatureInfo(feat);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: 'var(--space-10)' }}>
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
                  Không gian Học tập AI
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
                  Student AI 1.0
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
                Nền tảng trí tuệ nhân tạo hỗ trợ học viên cá nhân hóa lộ trình HSK, phân tích điểm yếu và tương tác 1-1
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
              color: 'var(--foreground)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ color: 'var(--muted)' }}>Học viên:</span>
            <strong>{currentStudent.fullName}</strong>
            <span style={{ color: 'var(--muted)' }}>• Gói học:</span>
            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>Student Standard</span>
          </div>
        </div>

        {/* Diagnostic Learner Profile Highlight Bar */}
        {profile && (
          <div
            style={{
              marginTop: 'var(--space-2)',
              padding: 'var(--space-4) var(--space-5)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--neutral-bg)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-4)',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>MỤC TIÊU HIỆN TẠI</div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={18} style={{ color: 'var(--primary)' }} />
                <span>Trình độ {profile.targetHskLevel}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>TỶ LỆ THÀNH THẠO ƯỚC LƯỢNG</div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={18} />
                <span>{profile.currentMasteryAverage}% ({profile.totalEvidenceCount} bằng chứng học)</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>ĐIỂM YẾU CẦN CỦNG CỐ</div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#d97706', marginTop: '2px' }}>
                {profile.recentWeakPoints.map((w) => w.title).join(' • ')}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                type="button"
                onClick={() =>
                  openAITutor(
                    { source: 'practice', hskLevel: 3, grammarPoints: ['Câu chữ 把'] },
                    'Giải thích giúp tôi cấu trúc câu chữ 把 và cho 3 ví dụ thực tế'
                  )
                }
                className="ds-btn ds-btn-outline"
                style={{ height: '34px', fontSize: 'var(--text-xs)', fontWeight: 600, gap: '6px' }}
              >
                <Bot size={14} />
                <span>Hỏi nhanh AI Tutor</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Feature Discovery Grid */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
            Hệ sinh thái Trợ lý Học tập AI
          </h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
            7 phân hệ cá nhân hóa độc lập
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {features.map((feature) => (
            <StudentAIFeatureCard
              key={feature.id}
              feature={feature}
              onActivate={handleActivateFeature}
            />
          ))}
        </div>
      </div>

      {/* 3. Pro Entitlement & Privacy Disclosure Card */}
      <div
        style={{
          padding: 'var(--space-5)',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-4)',
        }}
      >
        <ShieldCheck size={24} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--foreground)' }}>
            Cam kết Minh bạch & Bảo mật Dữ liệu Học tập
          </h4>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--muted)', lineHeight: 1.6 }}>
            ZhongWenHub phát triển AI hỗ trợ học tập dựa trên dữ liệu chuẩn ngữ pháp HSK 3.0 và lịch sử luyện tập cá nhân.
            Hệ thống <strong>không chia sẻ</strong> thông tin cá nhân hoặc bài thi của bạn với bên thứ ba mà không có sự đồng ý.
            Các tính năng chuyên sâu (Chấm điểm tự luận, Lộ trình thích ứng) sẽ thuộc gói <strong>Student Pro</strong> trong tương lai.
          </p>
        </div>
      </div>

      {/* 4. Feature Details Modal for Coming Soon features */}
      {selectedFeatureInfo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedFeatureInfo(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border)',
              padding: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Sparkles size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--foreground)' }}>
                  {selectedFeatureInfo.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFeatureInfo(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--muted)', lineHeight: 1.6 }}>
              {selectedFeatureInfo.description}
            </p>

            <div
              style={{
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--neutral-bg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: 'var(--text-xs)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Trạng thái phát triển:</span>
                <span style={{ fontWeight: 700, color: '#d97706' }}>Đang hoàn thiện mô hình</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Cấp độ tài khoản áp dụng:</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  {selectedFeatureInfo.tier === 'PRO' ? 'Student Pro' : 'Tất cả học viên (Free)'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button
                type="button"
                onClick={() => setSelectedFeatureInfo(null)}
                className="ds-btn ds-btn-outline"
                style={{ height: '36px', fontSize: 'var(--text-xs)' }}
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedFeatureInfo(null);
                  openAITutor(
                    { source: 'general', hskLevel: 3 },
                    `Tôi muốn tìm hiểu thêm về tính năng ${selectedFeatureInfo.title}`
                  );
                }}
                className="ds-btn ds-btn-primary"
                style={{ height: '36px', fontSize: 'var(--text-xs)', gap: '6px' }}
              >
                <Bot size={14} />
                <span>Hỏi AI Tutor về tính năng</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
