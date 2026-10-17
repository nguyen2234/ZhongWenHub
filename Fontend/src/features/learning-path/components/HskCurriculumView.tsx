import React, { useState, useMemo, useEffect } from 'react';
import {
  Check,
  CheckCircle2,
  Play,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShoppingBag,
  Heart,
  Briefcase,
  Globe,
  Dumbbell,
  Sparkles,
  HelpCircle,
  Compass,
  Layers,
  Clock,
  BookOpen,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLearningState } from '../../learning';
import {
  HSK_CURRICULUM,
  type CurriculumLesson,
  type CurriculumUnit,
} from '../../learning/data/curriculumData';
import './HskCurriculumView.css';

export interface HskCurriculumViewProps {
  onOpenLesson?: (lessonId: string) => void;
}

export interface CurriculumTopic {
  id: number;
  unitNumber: number;
  hskLevel: number;
  title: string;
  hanziTitle: string;
  pinyinTitle: string;
  icon: React.ElementType;
  lessons: CurriculumLesson[];
}

/**
 * Presentation adapter: maps CurriculumUnit to thematic Topic
 * preserving 100% of the lessons, IDs, and titles without modifying raw curriculum data.
 */
function resolveTopicIcon(title: string, unitNumber: number): React.ElementType {
  const lower = title.toLowerCase();
  if (lower.includes('chào hỏi') || lower.includes('giới thiệu') || lower.includes('làm quen')) {
    return MessageSquare;
  }
  if (lower.includes('ẩm thực') || lower.includes('mua sắm') || lower.includes('nhà hàng') || lower.includes('tiền')) {
    return ShoppingBag;
  }
  if (lower.includes('thời gian') || lower.includes('lịch trình') || lower.includes('ngày')) {
    return Clock;
  }
  if (lower.includes('giao thông') || lower.includes('đi lại') || lower.includes('du lịch') || lower.includes('cuối tuần')) {
    return Compass;
  }
  if (lower.includes('tình cảm') || lower.includes('mối quan hệ') || lower.includes('yêu')) {
    return Heart;
  }
  if (lower.includes('công sở') || lower.includes('kinh doanh') || lower.includes('phỏng vấn')) {
    return Briefcase;
  }
  if (lower.includes('văn học') || lower.includes('triết học') || lower.includes('xã hội')) {
    return BookOpen;
  }
  if (lower.includes('dịch') || lower.includes('chuyên gia') || lower.includes('học thuật')) {
    return Globe;
  }
  const icons = [MessageSquare, ShoppingBag, Clock, Compass, Heart, Briefcase];
  return icons[(unitNumber - 1) % icons.length] || Layers;
}

export function mapUnitToTopic(unit: CurriculumUnit): CurriculumTopic {
  return {
    id: unit.id,
    unitNumber: unit.unitNumber,
    hskLevel: unit.hskLevel,
    title: unit.vietnameseTitle,
    hanziTitle: unit.hanziTitle,
    pinyinTitle: unit.pinyinTitle,
    icon: resolveTopicIcon(unit.vietnameseTitle, unit.unitNumber),
    lessons: unit.lessons,
  };
}

export const HSK_LEVEL_TABS = [
  { level: 1, label: 'HSK 1', name: 'Nhập môn' },
  { level: 2, label: 'HSK 2', name: 'Sơ cấp' },
  { level: 3, label: 'HSK 3', name: 'Trung cấp 1' },
  { level: 4, label: 'HSK 4', name: 'Trung cấp 2' },
  { level: 5, label: 'HSK 5', name: 'Cao cấp 1' },
  { level: 6, label: 'HSK 6', name: 'Cao cấp 2' },
  { level: 7, label: 'HSK 7–9', name: 'Chuyên gia' },
];

export const HskCurriculumView: React.FC<HskCurriculumViewProps> = ({
  onOpenLesson,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    currentHskLevel,
    selectHskLevel,
    completedLessonIds,
    currentLessonId,
    startLesson,
  } = useLearningState();

  // Selected HSK level from search param or learning state
  const paramLevel = Number(searchParams.get('level'));
  const initialLevel = paramLevel >= 1 && paramLevel <= 7 ? paramLevel : (currentHskLevel || 1);
  const [selectedLevel, setSelectedLevel] = useState<number>(initialLevel);

  // Sync state with selectedLevel
  const currentLevelData = HSK_CURRICULUM[selectedLevel] || HSK_CURRICULUM[1];

  // Topics for current level
  const topics: CurriculumTopic[] = useMemo(() => {
    return (currentLevelData.units || []).map(mapUnitToTopic);
  }, [currentLevelData]);

  // Selected topic ID
  const [selectedTopicId, setSelectedTopicId] = useState<number>(() => {
    return topics[0]?.id || 1;
  });

  // When switching HSK level, automatically pick the first topic or active topic
  useEffect(() => {
    if (topics.length > 0) {
      const topicWithActiveLesson = topics.find((t) =>
        t.lessons.some((l) => l.id === currentLessonId)
      );
      if (topicWithActiveLesson) {
        setSelectedTopicId(topicWithActiveLesson.id);
      } else {
        setSelectedTopicId(topics[0].id);
      }
    }
  }, [selectedLevel, topics, currentLessonId]);

  const handleLevelChange = (level: number) => {
    setSelectedLevel(level);
    selectHskLevel(level);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('level', String(level));
      return next;
    });
  };

  // Find currently selected topic
  const activeTopic = topics.find((t) => t.id === selectedTopicId) || topics[0] || null;

  // Compute course overall progress
  const allLessonsInLevel: CurriculumLesson[] = useMemo(() => {
    return topics.flatMap((t) => t.lessons);
  }, [topics]);

  const totalLessonsInLevel = allLessonsInLevel.length;
  const completedInLevel = useMemo(() => {
    return allLessonsInLevel.filter((l) => completedLessonIds.includes(l.id)).length;
  }, [allLessonsInLevel, completedLessonIds]);

  const courseProgressPercent = totalLessonsInLevel > 0
    ? Math.min(100, Math.round((completedInLevel / totalLessonsInLevel) * 100))
    : 0;

  // Active / next lesson to resume
  const heroLesson: CurriculumLesson | null = useMemo(() => {
    const uncompleted = allLessonsInLevel.find((l) => !completedLessonIds.includes(l.id));
    return uncompleted || allLessonsInLevel[0] || null;
  }, [allLessonsInLevel, completedLessonIds]);

  const handleLessonAction = (lessonId: string) => {
    startLesson(lessonId);
    if (onOpenLesson) {
      onOpenLesson(lessonId);
    } else {
      navigate(`/lesson?id=${lessonId}`);
    }
  };

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const faqItems = [
    {
      q: 'HSK là gì?',
      a: 'HSK (Hànyǔ Shuǐpíng Kǎoshì - 汉语水平考试) là kỳ thi chuẩn hóa năng lực Hán ngữ quốc tế dành cho người học tiếng Trung không phải tiếng mẹ đẻ, do Bộ Giáo dục Trung Quốc tổ chức và cấp chứng chỉ có giá trị toàn cầu.',
    },
    {
      q: 'HSK có những cấp độ nào?',
      a: 'Theo chuẩn HSK 3.0 mới nhất, hệ thống phân thành 3 giai đoạn 9 cấp độ: Sơ cấp (HSK 1, HSK 2, HSK 3), Trung cấp (HSK 4, HSK 5, HSK 6) và Cao cấp (HSK 7–9 dành cho chuyên gia, biên phiên dịch viên và nghiên cứu học thuật).',
    },
    {
      q: 'Người mới nên bắt đầu từ đâu?',
      a: 'Nếu bạn bắt đầu từ con số 0, hãy hoàn thành phần định hướng tại Lộ trình học tập để nắm vững 21 thanh mẫu, 36 vận mẫu Pinyin và 4 thanh điệu. Sau đó, hãy bắt đầu ngay với HSK 1 theo từng chủ đề sinh hoạt quen thuộc.',
    },
    {
      q: 'Nên học bao lâu mỗi ngày?',
      a: 'Thời lượng học tập lý tưởng và bền vững nhất là 15–30 phút mỗi ngày. Việc duy trì thói quen học đều đặn kết hợp ôn tập Flashcard SRS mỗi ngày sẽ giúp bạn ghi nhớ sâu gấp 3 lần so với việc học dồn 4–5 tiếng vào cuối tuần.',
    },
    {
      q: 'Học xong một cấp độ thì làm gì tiếp?',
      a: 'Sau khi hoàn thành tất cả bài học trong một cấp độ, bạn nên làm các đề thi thử trong mục Luyện thi HSK để làm quen với cấu trúc bài thi thực tế, sau đó tự tin chuyển tiếp lên cấp độ HSK kế tiếp.',
    },
  ];

  return (
    <div className="hsk-curriculum-root">
      {/* =====================================================================
          5.2. HEADER KHÓA HỌC: BANNER BÊN TRÁI + TIẾN ĐỘ BÊN PHẢI (COMPACT)
          ===================================================================== */}
      <section className="hsk-course-header">
        {/* Left Side: Course Info */}
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '999px',
              backgroundColor: '#FFF0F1',
              color: 'var(--primary, #E60012)',
              fontSize: '11.5px',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            <Sparkles size={13} />
            <span>Bài học {currentLevelData.name}</span>
          </div>

          <h1
            style={{
              fontSize: '24px',
              fontWeight: 900,
              color: '#0f172a',
              margin: '0 0 8px',
              lineHeight: 1.25,
            }}
          >
            Giáo trình {currentLevelData.name} — {currentLevelData.vietnameseName}
          </h1>

          <p
            style={{
              fontSize: '13.5px',
              color: '#475569',
              lineHeight: 1.55,
              margin: 0,
              maxWidth: '600px',
            }}
          >
            Chương trình đào tạo chuẩn khung HSK 3.0 với {currentLevelData.totalWords} từ vựng cốt lõi,
            các điểm ngữ pháp trọng tâm và hội thoại giao tiếp tình huống thực tế theo từng chủ đề đời sống.
          </p>
        </div>

        {/* Right Side: Course Progress Card */}
        <div
          style={{
            padding: '16px 18px',
            borderRadius: '14px',
            backgroundColor: '#FFFBFB',
            border: '1.5px solid #fed7da',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
              Tiến độ khóa học
            </span>
            <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--primary, #E60012)' }}>
              {courseProgressPercent}%
            </span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: '100%',
              height: '7px',
              borderRadius: '999px',
              backgroundColor: '#fee2e2',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${courseProgressPercent}%`,
                height: '100%',
                borderRadius: '999px',
                backgroundColor: 'var(--primary, #E60012)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {/* Metrics summary */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#64748b',
              fontWeight: 600,
            }}
          >
            <span>Tổng bài: <strong>{totalLessonsInLevel}</strong></span>
            <span>Chủ đề: <strong>{topics.length}</strong></span>
            <span>Đã học: <strong>{completedInLevel}</strong></span>
          </div>

          {/* Button Tiếp tục học */}
          {heroLesson && (
            <button
              type="button"
              onClick={() => handleLessonAction(heroLesson.id)}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: 'var(--primary, #E60012)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                boxShadow: '0 2px 8px rgba(230, 0, 18, 0.22)',
                transition: 'all 0.15s ease',
              }}
            >
              <Play size={13} fill="#ffffff" />
              <span>
                {completedInLevel === 0 ? 'Bắt đầu học' : `Tiếp tục học: Bài ${heroLesson.lessonNumber}`}
              </span>
            </button>
          )}
        </div>
      </section>

      {/* =====================================================================
          5.1. THU NHỎ CÁC NÚT CHỌN CẤP HSK: COMPACT PILL TABS
          ===================================================================== */}
      <nav aria-label="Chọn cấp độ HSK" className="hsk-pill-tabs-row">
        {HSK_LEVEL_TABS.map((tab) => {
          const isActive = selectedLevel === tab.level;
          return (
            <button
              key={tab.level}
              type="button"
              className={`hsk-pill-tab ${isActive ? 'active' : 'inactive'}`}
              onClick={() => handleLevelChange(tab.level)}
              aria-pressed={isActive}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  opacity: isActive ? 0.9 : 0.7,
                }}
              >
                ({tab.name})
              </span>
            </button>
          );
        })}
      </nav>

      {/* =====================================================================
          5.3. BỐ CỤC 2 CỘT: CỘT TRÁI (CHỦ ĐỀ 25-28%) + CỘT PHẢI (BÀI HỌC 72-75%)
          ===================================================================== */}
      <div className="hsk-two-columns">
        {/* ===================================================================
            CỘT TRÁI (25–28%): DANH SÁCH CHỦ ĐỀ
            =================================================================== */}
        <aside aria-label="Danh sách chủ đề" className="hsk-topics-list">
          <div
            style={{
              padding: '4px 4px 8px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Danh sách chủ đề
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--primary, #E60012)',
                backgroundColor: '#FFF0F1',
                padding: '2px 7px',
                borderRadius: '6px',
              }}
            >
              {topics.length} chủ đề
            </span>
          </div>

          {topics.map((topic) => {
            const isTopicSelected = activeTopic?.id === topic.id;
            const TopicIcon = topic.icon;
            const topicCompletedCount = topic.lessons.filter((l) =>
              completedLessonIds.includes(l.id)
            ).length;
            const topicTotalCount = topic.lessons.length;
            const topicPercent = topicTotalCount > 0
              ? Math.round((topicCompletedCount / topicTotalCount) * 100)
              : 0;

            return (
              <button
                key={topic.id}
                type="button"
                className={`hsk-topic-item ${isTopicSelected ? 'active' : ''}`}
                onClick={() => setSelectedTopicId(topic.id)}
                aria-pressed={isTopicSelected}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      backgroundColor: isTopicSelected ? '#ffffff' : '#f8fafc',
                      border: isTopicSelected ? '1px solid #fed7da' : '1px solid #e2e8f0',
                      color: isTopicSelected ? 'var(--primary, #E60012)' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <TopicIcon size={15} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: isTopicSelected ? 800 : 700,
                        color: isTopicSelected ? '#0f172a' : '#334155',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {topic.title}
                    </div>
                    <div
                      style={{
                        fontSize: '10.5px',
                        color: isTopicSelected ? 'var(--primary, #E60012)' : '#94a3b8',
                        fontFamily: 'var(--font-hanzi)',
                      }}
                    >
                      {topic.hanziTitle}
                    </div>
                  </div>
                </div>

                {/* Mini progress bar and count */}
                <div style={{ marginTop: '2px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '10.5px',
                      color: '#64748b',
                      marginBottom: '3px',
                    }}
                  >
                    <span>
                      {topicCompletedCount}/{topicTotalCount} bài
                    </span>
                    <span>{topicPercent}%</span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '3.5px',
                      borderRadius: '999px',
                      backgroundColor: isTopicSelected ? '#fee2e2' : '#f1f5f9',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${topicPercent}%`,
                        height: '100%',
                        borderRadius: '999px',
                        backgroundColor: 'var(--primary, #E60012)',
                      }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* ===================================================================
            CỘT PHẢI (72–75%): MỘT KHUNG TRẮNG DUY NHẤT BAO NGOÀI BÀI HỌC (FE-5.5)
            =================================================================== */}
        <main aria-label="Danh sách bài học trong chủ đề" style={{ width: '100%' }}>
          {activeTopic && (
            <div className="hsk-lessons-card-box">
              {/* Header chủ đề ở đầu container */}
              <div className="hsk-topic-header-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#FFF0F1',
                      border: '1px solid #fed7da',
                      color: 'var(--primary, #E60012)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {React.createElement(activeTopic.icon, { size: 18 })}
                  </div>

                  <div>
                    <h2
                      style={{
                        fontSize: '16.5px',
                        fontWeight: 800,
                        color: '#0f172a',
                        margin: 0,
                      }}
                    >
                      {activeTopic.title}
                    </h2>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        marginTop: '1px',
                        fontFamily: 'var(--font-hanzi)',
                      }}
                    >
                      {activeTopic.hanziTitle} • <span style={{ fontFamily: 'var(--font-pinyin)' }}>{activeTopic.pinyinTitle}</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#475569',
                    backgroundColor: '#f8fafc',
                    padding: '5px 12px',
                    borderRadius: '999px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <span>{activeTopic.lessons.length} bài học</span>
                  <span>•</span>
                  <span style={{ color: 'var(--primary, #E60012)' }}>
                    {activeTopic.lessons.filter((l) => completedLessonIds.includes(l.id)).length} đã xong
                  </span>
                </div>
              </div>

              {/* Các bài học xếp dọc trong cùng container, ngăn cách bởi divider mảnh */}
              <div className="hsk-lessons-list">
                {activeTopic.lessons.map((lesson) => {
                  const isCompleted = completedLessonIds.includes(lesson.id);
                  const isCurrent = lesson.id === currentLessonId && !isCompleted;

                  return (
                    <div
                      key={lesson.id}
                      className={`hsk-lesson-row ${isCompleted ? 'completed' : isCurrent ? 'in-progress' : ''}`}
                      onClick={() => handleLessonAction(lesson.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleLessonAction(lesson.id);
                        }
                      }}
                      aria-label={`Bài ${lesson.lessonNumber}: ${lesson.hanzi}. ${lesson.meaning}. Trạng thái: ${isCompleted ? 'Đã hoàn thành' : isCurrent ? 'Đang học' : 'Chưa học'}`}
                    >
                      {/* 1. Vòng tròn số thứ tự hoặc icon hoàn thành */}
                      <div
                        className={`hsk-lesson-circle ${isCompleted ? 'completed' : isCurrent ? 'in-progress' : 'not-started'}`}
                      >
                        {isCompleted ? (
                          <Check size={16} strokeWidth={2.5} />
                        ) : isCurrent ? (
                          <Play size={12} fill="currentColor" />
                        ) : (
                          lesson.lessonNumber
                        )}
                      </div>

                      {/* 2, 3, 4, 5. Tiêu đề Hán tự, Pinyin, Tiêu đề Tiếng Việt và Meta info */}
                      <div className="hsk-lesson-content">
                        {/* Hàng 1: Chữ Hán, Pinyin và Nghĩa tiếng Việt */}
                        <div className="hsk-lesson-primary-line">
                          <span className="hsk-lesson-hanzi">
                            {lesson.hanzi}
                          </span>
                          <span className="hsk-lesson-pinyin">
                            {lesson.pinyin}
                          </span>
                          <span className="hsk-lesson-meaning">
                            — {lesson.meaning}
                          </span>
                        </div>

                        {/* Hàng 2: Thông tin phụ gọn (từ vựng, ngữ pháp, thời lượng, XP dạng text nhỏ) */}
                        <div className="hsk-lesson-meta-line">
                          <span>{lesson.vocabularyIds.length} từ vựng</span>
                          <span>•</span>
                          <span>{lesson.grammarPointIds.length} ngữ pháp</span>
                          <span>•</span>
                          <span>{lesson.durationMinutes} phút</span>
                          <span>•</span>
                          <span style={{ color: '#d97706', fontWeight: 600 }}>+{lesson.xpReward} XP</span>
                        </div>
                      </div>

                      {/* 6, 7. Trạng thái & Icon mũi tên */}
                      <div className="hsk-lesson-status-box">
                        {isCompleted ? (
                          <span className="hsk-lesson-status-text completed">
                            <CheckCircle2 size={13} />
                            <span>Đã hoàn thành</span>
                          </span>
                        ) : isCurrent ? (
                          <span className="hsk-lesson-status-text in-progress">
                            <Play size={10} fill="currentColor" />
                            <span>Đang học</span>
                          </span>
                        ) : (
                          <span className="hsk-lesson-status-text not-started">
                            <span>Chưa học</span>
                          </span>
                        )}

                        <span className="hsk-lesson-arrow-btn">
                          <ChevronRight size={17} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =====================================================================
          PHẦN DƯỚI: BÀI TẬP THEO CẤP HSK + CÂU HỎI THƯỜNG GẶP (COMPACT)
          ===================================================================== */}
      {/* 1. Bài tập theo cấp HSK */}
      <section className="hsk-practice-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#FFF0F1',
              color: 'var(--primary, #E60012)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Dumbbell size={20} />
          </div>

          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--primary, #E60012)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1px',
              }}
            >
              Luyện tập củng cố
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
              Bài tập theo cấp độ HSK {selectedLevel}
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Thực hành bài tập ngữ pháp, luyện nghe và làm đề thi đánh giá năng lực tại Trung tâm luyện tập.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/practice')}
          style={{
            padding: '9px 18px',
            borderRadius: '9px',
            border: 'none',
            backgroundColor: 'var(--primary, #E60012)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 3px 10px rgba(230, 0, 18, 0.18)',
          }}
        >
          <span>Đến phòng luyện tập</span>
          <ArrowRight size={14} />
        </button>
      </section>

      {/* 2. Câu hỏi thường gặp (FAQ Accordion) */}
      <section aria-labelledby="hsk-faq-heading" className="hsk-faq-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <HelpCircle size={18} color="var(--primary, #E60012)" />
          <h3
            id="hsk-faq-heading"
            style={{
              fontSize: '16.5px',
              fontWeight: 800,
              color: '#0f172a',
              margin: 0,
            }}
          >
            Câu hỏi thường gặp về HSK
          </h3>
        </div>

        <div>
          {faqItems.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="hsk-faq-item">
                <button
                  type="button"
                  className="hsk-faq-trigger"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  {isOpen ? <ChevronUp size={16} color="var(--primary, #E60012)" /> : <ChevronDown size={16} color="#94a3b8" />}
                </button>
                {isOpen && (
                  <div className="hsk-faq-content">
                    <p style={{ margin: 0 }}>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
