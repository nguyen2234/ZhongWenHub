import React, { useState } from 'react';
import {
  CheckCircle2,
  Play,
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
  Check,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { StudentLearningState } from '../../learning/types/learning-state.types';
import { findLessonMetadata } from '../../learning/data/curriculumData';

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
    shortDescription: 'Làm quen 21 thanh mẫu, 36 vận mẫu và quy tắc ghép âm quốc tế để đọc chuẩn tiếng Trung.',
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
    shortDescription: 'Luyện 4 thanh điệu chuẩn cao độ, thanh nhẹ và các quy tắc biến điệu phổ biến.',
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
    title: 'Chữ Hán & Bút thuận',
    subtitle: 'Nét chữ, bộ thủ & quy tắc viết nét',
    shortDescription: 'Khám phá 8 nét chữ cơ bản, các bộ thủ quen thuộc và 7 quy tắc bút thuận chuẩn.',
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
    hanzi: '句',
    pinyin: 'Jùzi',
    title: 'Ngữ pháp cơ bản',
    subtitle: 'Cấu trúc câu & mẫu câu giao tiếp',
    shortDescription: 'Nắm cấu trúc SVO, cách đặt câu hỏi với 吗/什么/哪 và dùng trợ từ kết cấu 的.',
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
    hanzi: '话',
    pinyin: 'Duìhuà',
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
  learningState: StudentLearningState;
  onOpenLesson?: (lessonId: string) => void;
}

export const BeginnerRoadmap: React.FC<BeginnerRoadmapProps> = ({
  learningState,
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
    <section aria-labelledby="beginner-roadmap-title" style={{ position: 'relative' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
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
              fontWeight: 700,
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
            Nhấp vào từng bước để xem chi tiết mục tiêu, bài học liên quan và tiêu chí hoàn thành.
          </p>
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            Đã hoàn thành
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary, #E60012)' }} />
            Đang học
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
            Chưa bắt đầu
          </div>
        </div>
      </div>

      {/* =========================================================
          DESKTOP ROADMAP (Connecting curve line with 6 Milestone Cards)
          ========================================================= */}
      <div
        className="beginner-roadmap-desktop"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          position: 'relative',
        }}
      >
        {BEGINNER_STEPS.map((step) => {
          const status = computeStepStatus(step.stepNumber, learningState, step.linkedLessonId);
          const isCompleted = status === 'completed';
          const isInProgress = status === 'in_progress';

          let statusBadgeText = 'Chưa bắt đầu';
          let statusBadgeBg = '#f1f5f9';
          let statusBadgeColor = '#64748b';
          let cardBorder = '#e2e8f0';
          let cardBg = '#ffffff';

          if (isCompleted) {
            statusBadgeText = 'Đã hoàn thành';
            statusBadgeBg = '#ecfdf5';
            statusBadgeColor = '#059669';
            cardBorder = '#a7f3d0';
          } else if (isInProgress) {
            statusBadgeText = 'Đang học';
            statusBadgeBg = '#FFF0F1';
            statusBadgeColor = 'var(--primary, #E60012)';
            cardBorder = '#fecdd3';
            cardBg = '#fffafb';
          }

          return (
            <div
              key={step.stepNumber}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedStep(step)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedStep(step);
                }
              }}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '22px 20px',
                borderRadius: '16px',
                backgroundColor: cardBg,
                border: `1.5px solid ${cardBorder}`,
                boxShadow: isInProgress
                  ? '0 6px 20px -4px rgba(230, 0, 18, 0.12)'
                  : '0 1px 3px rgba(0, 0, 0, 0.05)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 24px -4px rgba(0, 0, 0, 0.09)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = isInProgress
                  ? '0 6px 20px -4px rgba(230, 0, 18, 0.12)'
                  : '0 1px 3px rgba(0, 0, 0, 0.05)';
              }}
              aria-label={`Bước ${step.stepNumber}: ${step.title}. Trạng thái: ${statusBadgeText}`}
            >
              {/* Card Top: Step number badge and Status Pill */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: isInProgress ? 'var(--primary, #E60012)' : '#64748b',
                    backgroundColor: isInProgress ? '#ffe4e6' : '#f8fafc',
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}
                >
                  BƯỚC {step.stepNumber}
                </span>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    backgroundColor: statusBadgeBg,
                    color: statusBadgeColor,
                  }}
                >
                  {isCompleted && <CheckCircle2 size={13} />}
                  {isInProgress && (
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary, #E60012)',
                      }}
                    />
                  )}
                  {statusBadgeText}
                </span>
              </div>

              {/* Main Card Body with Big Chinese Hanzi and Details */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                {/* Large Calligraphic Hanzi circle */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    minWidth: '64px',
                    borderRadius: '16px',
                    backgroundColor: isCompleted
                      ? '#ecfdf5'
                      : isInProgress
                      ? '#FFF0F1'
                      : '#f8fafc',
                    border: `1.5px solid ${
                      isCompleted ? '#a7f3d0' : isInProgress ? '#fecdd3' : '#e2e8f0'
                    }`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"Noto Serif SC", "PingFang SC", "Microsoft YaHei", serif',
                      fontSize: '28px',
                      fontWeight: 700,
                      lineHeight: 1,
                      color: isCompleted
                        ? '#059669'
                        : isInProgress
                        ? 'var(--primary, #E60012)'
                        : '#334155',
                    }}
                  >
                    {step.hanzi}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: isCompleted
                        ? '#059669'
                        : isInProgress
                        ? 'var(--primary, #E60012)'
                        : '#64748b',
                      marginTop: '2px',
                    }}
                  >
                    {step.pinyin}
                  </span>
                </div>

                {/* Title & Short Description */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: '#0f172a',
                      margin: '0 0 4px',
                      lineHeight: 1.3,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: isInProgress ? 'var(--primary, #E60012)' : '#64748b',
                      margin: '0 0 6px',
                    }}
                  >
                    {step.subtitle}
                  </p>
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#475569',
                      margin: 0,
                      lineHeight: 1.45,
                    }}
                  >
                    {step.shortDescription}
                  </p>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '18px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--primary, #E60012)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Xem chi tiết mục tiêu <ArrowRight size={13} />
                </span>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#94a3b8',
                  }}
                >
                  {isCompleted ? '✓ Đã mở khóa' : isInProgress ? 'Đang thực hiện' : 'Chưa học'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================
          STEP DETAIL MODAL / SLIDE-OVER (Accurate EdTech Inspection)
          ========================================================= */}
      {selectedStep && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="step-dialog-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            padding: '16px',
          }}
          onClick={() => setSelectedStep(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              padding: '24px',
              position: 'relative',
              animation: 'fadeIn 0.15s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    backgroundColor: '#FFF0F1',
                    border: '1.5px solid #fecdd3',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"Noto Serif SC", "PingFang SC", "Microsoft YaHei", serif',
                      fontSize: '26px',
                      fontWeight: 700,
                      color: 'var(--primary, #E60012)',
                      lineHeight: 1,
                    }}
                  >
                    {selectedStep.hanzi}
                  </span>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--primary, #E60012)' }}>
                    {selectedStep.pinyin}
                  </span>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--primary, #E60012)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    BƯỚC {selectedStep.stepNumber} • LỘ TRÌNH NGƯỜI MỚI
                  </div>
                  <h3
                    id="step-dialog-title"
                    style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}
                  >
                    {selectedStep.title}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>{selectedStep.subtitle}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStep(null)}
                aria-label="Đóng bảng chi tiết"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* 1. Mục tiêu học tập */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid #f1f5f9',
                }}
              >
                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: '0 0 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Target size={15} color="var(--primary, #E60012)" />
                  Mục tiêu cần đạt
                </h4>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '18px',
                    fontSize: '13px',
                    color: '#334155',
                    lineHeight: 1.6,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  {selectedStep.objectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>

              {/* 2. Nội dung cần học */}
              <div>
                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: '0 0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <BookText size={15} color="var(--primary, #E60012)" />
                  Nội dung trọng tâm
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedStep.topics.map((topic, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: '13px',
                        color: '#475569',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary, #E60012)',
                          display: 'inline-block',
                          flexShrink: 0,
                        }}
                      />
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Bài học liên quan */}
              <div>
                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: '0 0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <BookOpen size={15} color="var(--primary, #E60012)" />
                  Bài học liên quan trong Giáo trình HSK 1
                </h4>

                {(() => {
                  const lessonMeta = selectedStep.linkedLessonId
                    ? findLessonMetadata(selectedStep.linkedLessonId)
                    : null;

                  if (!lessonMeta) {
                    return (
                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          backgroundColor: '#f8fafc',
                          border: '1px dashed #cbd5e1',
                          fontSize: '13px',
                          color: '#64748b',
                        }}
                      >
                        Chưa có bài học được liên kết
                      </div>
                    );
                  }

                  const isLessonCompleted = (learningState.completedLessonIds || []).includes(
                    lessonMeta.id
                  );

                  return (
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              color: 'var(--primary, #E60012)',
                              backgroundColor: '#FFF0F1',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            Bài {lessonMeta.lessonNumber}
                          </span>
                          <span
                            style={{
                              fontSize: '15px',
                              fontWeight: 800,
                              color: '#0f172a',
                            }}
                          >
                            {lessonMeta.hanzi} ({lessonMeta.pinyin})
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          {lessonMeta.meaning} • {lessonMeta.summary}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: '12px',
                            fontSize: '11px',
                            color: '#64748b',
                            marginTop: '6px',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={12} /> {lessonMeta.durationMinutes} phút
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#b45309' }}>
                            <Award size={12} /> +{lessonMeta.xpReward} XP
                          </span>
                          {isLessonCompleted && (
                            <span style={{ color: '#059669', fontWeight: 700 }}>
                              ✓ Đã hoàn thành
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartLesson(lessonMeta.id)}
                        style={{
                          backgroundColor: 'var(--primary, #E60012)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 14px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <Play size={13} fill="#ffffff" />
                        {isLessonCompleted ? 'Học lại' : 'Vào bài học'}
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* 4. Bài tập thực hành */}
              <div>
                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: '0 0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Sparkles size={15} color="var(--primary, #E60012)" />
                  Bài tập rèn luyện thực hành
                </h4>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                      {selectedStep.practiceTitle}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Luyện tập tương tác và nhận phản hồi trực tiếp
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartPractice(selectedStep.practiceRoute)}
                    style={{
                      backgroundColor: '#ffffff',
                      color: 'var(--primary, #E60012)',
                      border: '1.5px solid var(--primary, #E60012)',
                      borderRadius: '8px',
                      padding: '7px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    Luyện ngay <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* 5. Tiêu chí hoàn thành */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  fontSize: '12px',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Check size={14} />
                <span>
                  <strong>Tiêu chí hoàn thành:</strong> {selectedStep.completionCriteria}
                </span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '22px',
                paddingTop: '16px',
                borderTop: '1px solid #f1f5f9',
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedStep(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>
              {selectedStep.linkedLessonId && (
                <button
                  type="button"
                  onClick={() => handleStartLesson(selectedStep.linkedLessonId)}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: 'var(--primary, #E60012)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(230, 0, 18, 0.25)',
                  }}
                >
                  <Play size={14} fill="#ffffff" />
                  Bắt đầu học bước này
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
