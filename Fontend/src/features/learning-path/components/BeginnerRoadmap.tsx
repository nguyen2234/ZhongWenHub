import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Headphones,
  Mic,
  PenTool,
  BookText,
  Sparkles,
  X,
  Target,
  Clock,
  Award,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { StudentLearningState } from '../../learning/types/learning-state.types';
import { findLessonMetadata } from '../../learning/data/curriculumData';
import './BeginnerRoadmap.css';

export type StepStatus = 'not_started' | 'in_progress' | 'completed';

export interface BeginnerStepDefinition {
  stepNumber: number;
  hanzi: string;
  pinyin: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  objectives: string[];
  topics: string[];
  linkedLessonId: string | null;
  practiceRoute: string;
  practiceTitle: string;
  completionCriteria: string;
  icon: React.ElementType;
}

export const BEGINNER_STEPS: BeginnerStepDefinition[] = [
  {
    stepNumber: 1,
    hanzi: '拼',
    pinyin: 'Pīnyīn',
    title: 'Pinyin – Phiên âm Latin',
    subtitle: 'Thanh mẫu, vận mẫu & ghép âm chuẩn',
    shortDescription: 'Làm quen 21 thanh mẫu, 36 vận mẫu và quy tắc ghép âm chuẩn quốc tế để đọc đúng tiếng Trung.',
    objectives: [
      'Phân biệt rõ 21 thanh mẫu (phụ âm) và 36 vận mẫu (nguyên âm)',
      'Nắm vững bảng ghép âm Pinyin chuẩn tiếng Trung phổ thông',
      'Tự đánh vần và phát âm đúng từ mới khi nhìn phiên âm Latin',
    ],
    topics: [
      '21 Thanh mẫu cơ bản (b, p, m, f, d, t, n, l, g, k, h, j, q, x, zh, ch, sh, r, z, c, s)',
      'Vận mẫu đơn, vận mẫu kép và vận mẫu âm mũi',
      'Quy tắc biến thể viết hoa: y, w, yu và dấu hai chấm trên ü',
    ],
    linkedLessonId: 'les-hsk1-1',
    practiceRoute: '/skills/speaking?tab=pinyin',
    practiceTitle: 'Bảng tương tác Pinyin & Luyện âm',
    completionCriteria: 'Hoàn thành bài học HSK 1 đầu tiên hoặc luyện tập phát âm Pinyin.',
    icon: VolumeIconWrapper,
  },
  {
    stepNumber: 2,
    hanzi: '声',
    pinyin: 'Shēngdiào',
    title: 'Thanh điệu tiếng Trung',
    subtitle: 'Bốn thanh điệu, thanh nhẹ & biến điệu',
    shortDescription: 'Luyện 4 thanh điệu chuẩn cao độ, thanh nhẹ và các quy tắc biến điệu quan trọng trong giao tiếp.',
    objectives: [
      'Nhận diện cao độ và âm hình của 4 thanh điệu (1, 2, 3, 4) và thanh nhẹ',
      'Nắm vững quy tắc biến điệu quan trọng: Hai thanh 3 đi liền nhau',
      'Biến điệu của 一 (yī) và 不 (bù) trong giao tiếp tự nhiên',
    ],
    topics: [
      'Thanh 1 (Âm bằng, cao độ 5-5) và Thanh 2 (Dấu sắc, cao độ 3-5)',
      'Thanh 3 (Âm lượn, cao độ 2-1-4) và Thanh 4 (Dấu huyền giật, cao độ 5-1)',
      'Thanh nhẹ và quy tắc biến điệu trong cụm từ 你好, 不客气',
    ],
    linkedLessonId: 'les-hsk1-2',
    practiceRoute: '/skills/speaking',
    practiceTitle: 'Luyện nói & AI chấm điểm âm điệu',
    completionCriteria: 'Hoàn thành ít nhất 2 bài học HSK 1 hoặc đạt điểm phát âm thanh điệu.',
    icon: Mic,
  },
  {
    stepNumber: 3,
    hanzi: '字',
    pinyin: 'Hànzì',
    title: 'Chữ Hán cơ bản',
    subtitle: 'Nét chữ, bộ thủ & quy tắc viết nét',
    shortDescription: 'Khám phá 8 nét chữ cơ bản, các bộ thủ quen thuộc và 7 quy tắc bút thuận viết chữ ngay ngắn.',
    objectives: [
      'Hiểu nguồn gốc tượng hình và cấu tạo cơ bản của chữ Hán',
      'Viết chuẩn xác 8 nét cơ bản (Ngang, Sổ, Phẩy, Mác, Hất, Chấm, Gập, Móc)',
      'Nắm vững 7 quy tắc bút thuận viết chữ ngay ngắn, cân đối',
    ],
    topics: [
      '8 Nét chữ cơ bản và các nét biến thể thường gặp',
      '50 Bộ thủ sơ cấp có tần suất xuất hiện cao (Bộ Nhân 亻, Nữ 女, Khẩu 口...)',
      'Quy tắc: Trên trước dưới sau, Trái trước phải sau, Ngoài trước trong sau...',
    ],
    linkedLessonId: 'les-hsk1-3',
    practiceRoute: '/skills/writing',
    practiceTitle: 'Phòng luyện viết tương tác từng nét',
    completionCriteria: 'Hoàn thành Bài 3 hoặc hoàn tất bài thực hành viết chữ Hán cơ bản.',
    icon: PenTool,
  },
  {
    stepNumber: 4,
    hanzi: '词',
    pinyin: 'Cíhuì',
    title: 'Từ vựng HSK 1',
    subtitle: '150 từ vựng cốt lõi theo chủ đề',
    shortDescription: 'Tích lũy vốn từ thiết yếu về gia đình, số đếm, thời gian và sinh hoạt hàng ngày.',
    objectives: [
      'Nhận diện mặt chữ, pinyin và ngữ nghĩa của 150 từ vựng HSK 1',
      'Ứng dụng từ vựng vào ngữ cảnh đặt câu thực tế',
      'Ghi nhớ sâu bền vững thông qua hệ thống Spaced Repetition (SRS)',
    ],
    topics: [
      'Danh từ chỉ người, đại từ xưng hô, số đếm và ngày tháng',
      'Động từ thông dụng: 吃 (ăn), 喝 (uống), 看 (xem), 去 (đi), 是 (là)...',
      'Tính từ chỉ trạng thái: 好 (tốt), 大 (lớn), 小 (nhỏ), 高兴 (vui vẻ)...',
    ],
    linkedLessonId: 'les-hsk1-4',
    practiceRoute: '/vocabulary',
    practiceTitle: 'Kho từ vựng & Ôn Flashcard SRS',
    completionCriteria: 'Đã học tối thiểu 30 từ vựng HSK 1 hoặc hoàn thành Bài 4.',
    icon: BookOpen,
  },
  {
    stepNumber: 5,
    hanzi: '语',
    pinyin: 'Yǔfǎ',
    title: 'Ngữ pháp cơ bản',
    subtitle: 'Cấu trúc câu & mẫu câu giao tiếp',
    shortDescription: 'Nắm chắc trật tự từ SVO, cách đặt câu hỏi với 吗/什么/哪 và dùng trợ từ kết cấu 的.',
    objectives: [
      'Nắm chắc trật tự từ cơ bản trong tiếng Trung: Chủ ngữ + Động từ + Tân ngữ',
      'Thành thạo cách đặt câu hỏi với 吗, 什么, 哪, 谁',
      'Ứng dụng chuẩn trợ từ kết cấu 的 và phó từ phủ định 不 / 没',
    ],
    topics: [
      'Câu vị ngữ động từ căn bản (S + V + O)',
      'Câu nghi vấn với trợ từ 吗 và đại từ nghi vấn 什么 / 哪儿',
      'Cụm danh từ: Định ngữ + 的 + Danh từ trung tâm',
    ],
    linkedLessonId: 'les-hsk1-5',
    practiceRoute: '/grammar',
    practiceTitle: 'Thư viện điểm ngữ pháp & Trắc nghiệm',
    completionCriteria: 'Hoàn thành Bài 5 hoặc hoàn tất bài thực hành ngữ pháp HSK 1.',
    icon: BookText,
  },
  {
    stepNumber: 6,
    hanzi: '听',
    pinyin: 'Tīngshuō',
    title: 'Luyện nghe và nói',
    subtitle: 'Đàm thoại phản xạ & ngữ điệu tự nhiên',
    shortDescription: 'Tập phản xạ hội thoại đời sống, luyện nghe bắt từ khóa và phát âm lưu loát.',
    objectives: [
      'Nghe hiểu các đoạn đàm thoại ngắn trong cuộc sống thường nhật',
      'Tự tin chào hỏi, giới thiệu bản thân và hỏi thông tin cơ bản',
      'Nâng cao phản xạ đối đáp tự nhiên không cần dịch nhẩm trong đầu',
    ],
    topics: [
      'Hội thoại làm quen, hỏi thăm sức khỏe và nghề nghiệp',
      'Giao tiếp mua sắm, gọi món tại quán ăn và hỏi đường',
      'Luyện nghe theo phương pháp Shadowing lặp lại theo người bản xứ',
    ],
    linkedLessonId: 'les-hsk1-6',
    practiceRoute: '/skills/listening',
    practiceTitle: 'Phòng luyện nghe tương tác & Đàm thoại AI',
    completionCriteria: 'Hoàn thành Bài 6 hoặc hoàn tất bài kiểm tra nghe/nói tổng hợp.',
    icon: Headphones,
  },
];

function VolumeIconWrapper(props: any) {
  return <Headphones {...props} />;
}

/**
 * Backward compatibility helper for test suites
 */
export function computeStepStatus(
  stepNumber: number,
  state: StudentLearningState,
  _linkedLessonId?: string | null
): StepStatus {
  const completedLessons = state.completedLessonIds || [];
  const totalCompleted = completedLessons.length;
  const vocabCount = Object.keys(state.userVocabStates || {}).length;

  if (stepNumber === 1) {
    if (completedLessons.includes('les-hsk1-1') || totalCompleted >= 1) return 'completed';
    if (state.lessonProgress?.['les-hsk1-1'] || totalCompleted > 0) return 'in_progress';
    return 'not_started';
  }

  if (stepNumber === 2) {
    if (completedLessons.includes('les-hsk1-2') || totalCompleted >= 2) return 'completed';
    if (completedLessons.includes('les-hsk1-1') || state.lessonProgress?.['les-hsk1-2']) return 'in_progress';
    return 'not_started';
  }

  if (stepNumber === 3) {
    if (completedLessons.includes('les-hsk1-3') || totalCompleted >= 3) return 'completed';
    if (completedLessons.includes('les-hsk1-2') || state.lessonProgress?.['les-hsk1-3']) return 'in_progress';
    return 'not_started';
  }

  if (stepNumber === 4) {
    if (completedLessons.includes('les-hsk1-4') || totalCompleted >= 4 || vocabCount >= 30) return 'completed';
    if (completedLessons.includes('les-hsk1-3') || state.lessonProgress?.['les-hsk1-4'] || vocabCount > 0) return 'in_progress';
    return 'not_started';
  }

  if (stepNumber === 5) {
    if (completedLessons.includes('les-hsk1-5') || totalCompleted >= 5) return 'completed';
    if (completedLessons.includes('les-hsk1-4') || state.lessonProgress?.['les-hsk1-5']) return 'in_progress';
    return 'not_started';
  }

  if (stepNumber === 6) {
    if (completedLessons.includes('les-hsk1-6') || totalCompleted >= 6) return 'completed';
    if (completedLessons.includes('les-hsk1-5') || state.lessonProgress?.['les-hsk1-6']) return 'in_progress';
    return 'not_started';
  }

  return 'not_started';
}

export interface BeginnerRoadmapProps {
  learningState?: StudentLearningState;
  onOpenLesson?: (lessonId: string) => void;
}

export const BeginnerRoadmap: React.FC<BeginnerRoadmapProps> = ({
  onOpenLesson,
}) => {
  const navigate = useNavigate();
  const [selectedStep, setSelectedStep] = useState<BeginnerStepDefinition | null>(null);

  const handleStartLesson = (lessonId: string | null) => {
    if (!lessonId) return;
    if (onOpenLesson) {
      onOpenLesson(lessonId);
    } else {
      navigate(`/lesson?id=${lessonId}`);
    }
    setSelectedStep(null);
  };

  const handleStartPractice = (route: string) => {
    navigate(route);
    setSelectedStep(null);
  };

  return (
    <section aria-labelledby="beginner-roadmap-title" className="beginner-roadmap-root">
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '999px',
              backgroundColor: '#FFF0F1',
              color: 'var(--primary, #E60012)',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            <Sparkles size={13} />
            Hành trình 6 bước khoa học
          </div>
          <h2
            id="beginner-roadmap-title"
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#0f172a',
              margin: 0,
            }}
          >
            Lộ trình học trực quan cho người mới
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
            Nội dung định hướng từng bước nền tảng. Nhấn &quot;Tìm hiểu&quot; để xem chi tiết kiến thức và bài học tương ứng.
          </p>
        </div>

        {/* Scroll hint on tablet */}
        <div className="beginner-scroll-hint">
          <ChevronLeft size={14} />
          <span>Cuộn ngang xem đủ 6 bước</span>
          <ChevronRight size={14} />
        </div>
      </div>

      {/* Main Roadmap Container: Track with Curve + 6 Equal Cards */}
      <div className="beginner-scroll-wrapper">
        <div className="beginner-track-container">
          {/* Gentle Wavy Connecting Line */}
          <svg
            className="beginner-curve-svg"
            viewBox="0 0 1000 20"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M 10,10 C 100,0 200,20 300,10 C 400,0 500,20 600,10 C 700,0 800,20 900,10 L 990,10"
              stroke="#FCA5A5"
              strokeWidth="2.5"
              strokeDasharray="6 6"
            />
          </svg>

          {/* 6 Milestone Numbered Circles (1-6) */}
          <div className="beginner-track-row" aria-hidden="true">
            {BEGINNER_STEPS.map((step) => (
              <div
                key={step.stepNumber}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: '2px solid var(--primary, #E60012)',
                    color: 'var(--primary, #E60012)',
                    fontSize: '13px',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(230, 0, 18, 0.15)',
                  }}
                >
                  {step.stepNumber}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6 Equal Cards on a Single Horizontal Row */}
        <div className="beginner-cards-grid">
          {BEGINNER_STEPS.map((step) => {
            return (
              <div
                key={step.stepNumber}
                className="beginner-step-card"
                data-step={step.stepNumber}
                role="article"
                aria-label={`Bước ${step.stepNumber}: ${step.title}`}
              >
                <div>
                  {/* Step Hanzi & Pinyin Badge */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '12px 8px',
                      backgroundColor: '#FFF0F1',
                      borderRadius: '12px',
                      marginBottom: '12px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: '"Noto Serif SC", "PingFang SC", "Microsoft YaHei", serif',
                        fontSize: '34px',
                        fontWeight: 900,
                        color: 'var(--primary, #E60012)',
                        lineHeight: 1,
                      }}
                    >
                      {step.hanzi}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginTop: '4px',
                      }}
                    >
                      {step.pinyin}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 800,
                      color: '#0f172a',
                      margin: '0 0 6px',
                      textAlign: 'center',
                      lineHeight: 1.35,
                    }}
                  >
                    {step.title}
                  </h3>

                  {/* Short description */}
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#64748b',
                      lineHeight: 1.45,
                      margin: '0 0 14px',
                      textAlign: 'center',
                      minHeight: '48px',
                    }}
                  >
                    {step.shortDescription}
                  </p>
                </div>

                {/* Button Tìm hiểu bước này */}
                <button
                  type="button"
                  className="beginner-btn-explore"
                  onClick={() => setSelectedStep(step)}
                  aria-label={`Tìm hiểu chi tiết bước ${step.stepNumber}: ${step.title}`}
                >
                  <span>Tìm hiểu</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          STEP DETAIL MODAL (Khi người học bấm "Tìm hiểu")
          ===================================================================== */}
      {selectedStep && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-step-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.15s ease',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedStep(null);
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '22px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
                backgroundColor: '#FFFBFB',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '16px',
                    backgroundColor: '#FFF0F1',
                    border: '1.5px solid #fed7da',
                    color: 'var(--primary, #E60012)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    fontWeight: 900,
                    fontFamily: '"Noto Serif SC", serif',
                    flexShrink: 0,
                  }}
                >
                  {selectedStep.hanzi}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--primary, #E60012)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: '2px',
                    }}
                  >
                    BƯỚC {selectedStep.stepNumber} • {selectedStep.pinyin}
                  </div>
                  <h3
                    id="modal-step-title"
                    style={{
                      fontSize: '19px',
                      fontWeight: 800,
                      color: '#0f172a',
                      margin: 0,
                    }}
                  >
                    {selectedStep.title}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                    {selectedStep.subtitle}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStep(null)}
                aria-label="Đóng bảng chi tiết"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: '24px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {/* Description */}
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#334155' }}>
                {selectedStep.shortDescription}
              </p>

              {/* Objectives */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#0f172a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '10px',
                  }}
                >
                  <Target size={14} color="var(--primary, #E60012)" />
                  Mục tiêu cần làm chủ
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedStep.objectives.map((obj, i) => (
                    <li key={i} style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Topics */}
              <div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#0f172a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '8px',
                  }}
                >
                  Chủ đề cốt lõi
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedStep.topics.map((topic, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#f1f5f9',
                        color: '#334155',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Linked Lesson preview if available */}
              {selectedStep.linkedLessonId && (() => {
                const meta = findLessonMetadata(selectedStep.linkedLessonId);
                if (!meta) return null;
                return (
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      backgroundColor: '#fffafb',
                      border: '1px solid #fed7da',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary, #E60012)', textTransform: 'uppercase' }}>
                        Bài học tương ứng trong giáo trình
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                        Bài {meta.lessonNumber}: {meta.hanzi} ({meta.meaning})
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '10px', marginTop: '3px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={12} /> {meta.durationMinutes} phút
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#d97706', fontWeight: 600 }}>
                          <Award size={12} /> +{meta.xpReward} XP
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartLesson(meta.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'var(--primary, #E60012)',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 2px 8px rgba(230, 0, 18, 0.2)',
                      }}
                    >
                      <span>Vào học</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                backgroundColor: '#ffffff',
              }}
            >
              <button
                type="button"
                onClick={() => handleStartPractice(selectedStep.practiceRoute)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #fed7da',
                  backgroundColor: '#ffffff',
                  color: 'var(--primary, #E60012)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {selectedStep.practiceTitle}
              </button>

              <button
                type="button"
                onClick={() => setSelectedStep(null)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
