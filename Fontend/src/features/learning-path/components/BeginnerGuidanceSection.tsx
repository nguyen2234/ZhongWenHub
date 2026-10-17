import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Clock,
  Volume2,
  Compass,
  AlertCircle,
  Repeat,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { StudentLearningState } from '../../learning/types/learning-state.types';
import { findLessonMetadata } from '../../learning/data/curriculumData';
import { BEGINNER_STEPS, computeStepStatus } from './BeginnerRoadmap';

export interface BeginnerGuidanceSectionProps {
  learningState: StudentLearningState;
  onOpenLesson?: (lessonId: string) => void;
}

export const BeginnerGuidanceSection: React.FC<BeginnerGuidanceSectionProps> = ({
  learningState,
  onOpenLesson,
}) => {
  const navigate = useNavigate();

  // 1. Calculate active progress & next recommended step
  const completedLessons = learningState.completedLessonIds || [];
  const totalCompleted = completedLessons.length;
  const isNewStudent = totalCompleted === 0;

  // Count due vocabulary for SRS
  let srsDueCount = 0;
  for (const vocab of Object.values(learningState.userVocabStates || {})) {
    if (vocab.isDueToday) srsDueCount++;
  }

  // Find the first uncompleted beginner step
  let currentStep = BEGINNER_STEPS[0];
  for (const step of BEGINNER_STEPS) {
    const status = computeStepStatus(step.stepNumber, learningState, step.linkedLessonId);
    if (status !== 'completed') {
      currentStep = step;
      break;
    }
  }

  // Find the active lesson to resume or begin
  const activeLessonMeta = currentStep.linkedLessonId
    ? findLessonMetadata(currentStep.linkedLessonId)
    : null;

  const handleLessonAction = (lessonId: string) => {
    if (onOpenLesson) {
      onOpenLesson(lessonId);
    } else {
      navigate(`/lesson?id=${lessonId}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* =====================================================================
          1. HÔM NAY BẠN NÊN BẮT ĐẦU TỪ ĐÂU? (DYNAMIC INTELLIGENT RECOMMENDATION)
          ===================================================================== */}
      <section
        aria-labelledby="today-start-heading"
        style={{
          borderRadius: '18px',
          border: '1.5px solid #fed7da',
          backgroundColor: '#fffafb',
          padding: '24px',
          boxShadow: '0 4px 16px -2px rgba(230, 0, 18, 0.06)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: '#FFF0F1',
              color: 'var(--primary, #E60012)',
            }}
          >
            <Compass size={17} />
          </div>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--primary, #E60012)',
            }}
          >
            Đề xuất học tập hôm nay
          </span>
        </div>

        <h3
          id="today-start-heading"
          style={{
            fontSize: '20px',
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 8px',
          }}
        >
          Hôm nay bạn nên bắt đầu từ đâu?
        </h3>

        {/* New Student guidance branch */}
        {isNewStudent ? (
          <div>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: '0 0 16px' }}>
              Chào mừng bạn đến với hành trình chinh phục tiếng Trung! Đối với người bắt đầu từ con số 0,
              việc đầu tiên và quan trọng nhất là làm chủ <strong>Bước 1: Pinyin – Phiên âm Latin</strong>.
              Học chắc bảng phát âm sẽ là chiếc chìa khóa giúp bạn đọc đúng mọi từ vựng mới mà không bị lệ thuộc vào phiên âm tiếng Việt bồi.
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '16px',
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #fed7da',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#FFF0F1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: 'var(--primary, #E60012)',
                  }}
                >
                  拼
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    Bài 1: 你好！(Xin chào) • Khởi đầu với Pinyin
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Thời lượng 10 phút • Nhận +20 XP sau khi hoàn thành
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => navigate('/skills/speaking?tab=pinyin')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Xem bảng âm Pinyin
                </button>
                <button
                  type="button"
                  onClick={() => handleLessonAction('les-hsk1-1')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'var(--primary, #E60012)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 10px rgba(230, 0, 18, 0.2)',
                  }}
                >
                  Bắt đầu học ngay <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Student with existing progress branch */
          <div>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: '0 0 16px' }}>
              Bạn đang tiếp tục hành trình học tập tại{' '}
              <strong style={{ color: 'var(--primary, #E60012)' }}>
                Bước {currentStep.stepNumber}: {currentStep.title}
              </strong>
              . Bạn đã hoàn thành <strong>{totalCompleted} bài học</strong> trong giáo trình và không cần học lại nội dung đã hoàn tất.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Overdue SRS Alert if any */}
              {srsDueCount > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: '#fffbeb',
                    borderRadius: '12px',
                    border: '1px solid #fde68a',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertCircle size={18} color="#d97706" />
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400e' }}>
                        Có {srsDueCount} từ vựng đến hạn ôn tập hôm nay
                      </span>
                      <div style={{ fontSize: '12px', color: '#b45309' }}>
                        Ôn lại theo thuật toán ngắt quãng để củng cố trí nhớ dài hạn trước khi học từ mới.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/srs-review')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#d97706',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Ôn tập Flashcard SRS ({srsDueCount} từ)
                  </button>
                </div>
              )}

              {/* Incomplete lesson recommendation */}
              {activeLessonMeta ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        backgroundColor: '#FFF0F1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 700,
                        color: 'var(--primary, #E60012)',
                      }}
                    >
                      {currentStep.hanzi}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                        Bài {activeLessonMeta.lessonNumber}: {activeLessonMeta.hanzi} ({activeLessonMeta.meaning})
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Bước {currentStep.stepNumber} • {activeLessonMeta.durationMinutes} phút • Nhận +{activeLessonMeta.xpReward} XP
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => navigate(currentStep.practiceRoute)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        color: '#475569',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Thực hành kỹ năng
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLessonAction(activeLessonMeta.id)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'var(--primary, #E60012)',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 10px rgba(230, 0, 18, 0.2)',
                      }}
                    >
                      Học tiếp bài học <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    border: '1px dashed #cbd5e1',
                    fontSize: '13px',
                    color: '#64748b',
                  }}
                >
                  Chưa có bài học được liên kết cho bước tiếp theo.
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* =====================================================================
          2. 3 ĐIỀU GIÚP BẠN HỌC NHANH HƠN (THREE CRUCIAL HABIT CARDS)
          ===================================================================== */}
      <section aria-labelledby="three-tips-heading">
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}
          >
            Bí quyết thành công
          </div>
          <h3
            id="three-tips-heading"
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#0f172a',
              margin: 0,
            }}
          >
            3 điều giúp bạn học nhanh hơn
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Những nguyên tắc vàng giúp rút ngắn 50% thời gian học mà vẫn nhớ chắc chắn.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '18px',
          }}
        >
          {/* Card 1: Học đều mỗi ngày */}
          <div
            style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#fee2e2',
                  color: 'var(--primary, #E60012)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                }}
              >
                <Clock size={22} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                Học đều mỗi ngày
              </h4>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.55, margin: 0 }}>
                Dành <strong>15–20 phút mỗi ngày</strong> hiệu quả hơn nhiều so với việc dồn 3 tiếng vào cuối tuần.
                Duy trì nhịp học đều đặn giúp não bộ kích hoạt liên tục và duy trì chuỗi Streak học tập.
              </p>
            </div>
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--primary, #E60012)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Xem mục tiêu học tập hôm nay <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Card 2: Ưu tiên thanh điệu */}
          <div
            style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                }}
              >
                <Volume2 size={22} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                Ưu tiên thanh điệu
              </h4>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.55, margin: 0 }}>
                Thanh điệu là linh hồn của tiếng Trung. Cùng một âm 'ma' nhưng đổi thanh điệu sẽ thành mẹ (mā), gai (má), ngựa (mǎ) hay mắng (mà).
                Luyện chuẩn thanh điệu từ ngày đầu để tránh hình thành phản xạ sai khó sửa.
              </p>
            </div>
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => navigate('/skills/speaking')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0284c7',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Luyện thanh điệu & phát âm <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Card 3: Lặp lại ngắt quãng (SRS) */}
          <div
            style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                }}
              >
                <Repeat size={22} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                Lặp lại ngắt quãng (SRS)
              </h4>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.55, margin: 0 }}>
                Đừng học nhồi nhét từ vựng theo cách truyền thống. Thuật toán Spaced Repetition (SRS)
                sẽ tự động tính toán thời điểm vàng bạn sắp quên từ để nhắc ôn lại, đưa từ vựng vào trí nhớ vĩnh viễn.
              </p>
            </div>
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => navigate('/srs-review')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#d97706',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Ôn tập từ vựng Flashcard SRS <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. BÀI HƯỚNG DẪN: NGƯỜI MỚI BẮT ĐẦU NÊN HỌC GÌ? (EDTECH GUIDE ARTICLE)
          ===================================================================== */}
      <article
        aria-labelledby="article-guide-title"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          border: '1.5px solid #e2e8f0',
          padding: '28px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        <header style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '18px', marginBottom: '22px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: '#FFF0F1',
              color: 'var(--primary, #E60012)',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}
          >
            Cẩm nang chuyên sâu
          </div>
          <h3
            id="article-guide-title"
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#0f172a',
              margin: '0 0 8px',
              lineHeight: 1.35,
            }}
          >
            Người mới bắt đầu học tiếng Trung nên học gì?
          </h3>
          <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>⏱ 4 phút đọc</span>
            <span>•</span>
            <span>Phương pháp chuẩn khung đào tạo HSK 3.0</span>
            <span>•</span>
            <span>Biên soạn bởi ZhongWenHub Academic Team</span>
          </div>
        </header>

        {/* Article Body */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            fontSize: '14.5px',
            lineHeight: 1.75,
            color: '#334155',
          }}
        >
          {/* Section 1 */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
              1. Vì sao nên học Pinyin và Thanh điệu trước?
            </h4>
            <p style={{ margin: 0 }}>
              Tiếng Trung không sử dụng bảng chữ cái Latin mà là hệ thống chữ biểu ý (chữ tượng hình).
              Nếu lao ngay vào viết chữ Hán mà chưa vững phát âm, bạn sẽ rơi vào tình trạng “nhìn chữ nhưng không biết đọc thế nào”
              hoặc đọc theo kiểu phiên âm tiếng Việt lệch lạc. <strong>Pinyin</strong> đóng vai trò như chiếc giàn giáo giúp bạn
              giải mã cách đọc của mọi ký tự. Khi đã làm chủ 21 thanh mẫu, 36 vận mẫu và 4 thanh điệu, bạn có thể tự tin tra từ điển
              và phát âm chuẩn xác bất kỳ từ mới nào.
            </p>
          </div>

          {/* Section 2 */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
              2. Khi nào bắt đầu học chữ Hán?
            </h4>
            <p style={{ margin: 0 }}>
              Thời điểm lý tưởng để học chữ Hán là <strong>ngay sau khi bạn đã thông thạo cách đọc Pinyin cơ bản (khoảng tuần học thứ 2)</strong>.
              Đừng cố học thuộc cả chữ Hán như một bức vẽ phức tạp! Hãy bắt đầu từ <strong>8 nét cơ bản</strong> và <strong>50 bộ thủ sơ cấp</strong>.
              Chữ Hán thực chất được ghép từ các bộ thủ có ý nghĩa: ví dụ chữ <em>休 (nghỉ ngơi)</em> gồm bộ <em>Nhân 亻 (người)</em> đứng tựa vào <em>Cây 木 (mộc)</em>.
              Học theo quy tắc bút thuận giúp nét chữ ngay ngắn, viết nhanh và nhớ lâu gấp nhiều lần.
            </p>
          </div>

          {/* Section 3 */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
              3. Cách tích lũy từ vựng HSK 1 hiệu quả
            </h4>
            <p style={{ margin: 0 }}>
              Khung HSK 1 yêu cầu khoảng <strong>150 từ vựng cốt lõi</strong>. Thay vì học từ đơn lẻ theo danh sách A-Z, bạn nên học
              theo các nhóm chủ đề sinh hoạt quen thuộc như: chào hỏi, bản thân, gia đình, thời gian, ăn uống và mua sắm.
              Mỗi từ vựng nên được đặt trong câu văn cụ thể để vừa nhớ nghĩa, vừa hiểu cách dùng và vừa luyện được ngữ điệu.
            </p>
          </div>

          {/* Section 4 */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
              4. Vai trò của ngữ pháp cơ bản
            </h4>
            <p style={{ margin: 0 }}>
              Một tin rất vui cho người Việt học tiếng Trung: <strong>Tiếng Trung không chia động từ, không có thì (tense) phức tạp</strong> và cấu trúc câu
              rất tương đồng với tiếng Việt (trật tự Chủ ngữ - Động từ - Tân ngữ: S + V + O).
              Ở giai đoạn mới bắt đầu, bạn chỉ cần nắm vững 4 mẫu câu cơ bản: câu khẳng định, câu phủ định với <em>不/没</em>,
              câu nghi vấn với <em>吗/什么/哪</em>, và cách nối sở hữu với trợ từ <em>的</em>.
            </p>
          </div>

          {/* Section 5 */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
              5. Vì sao cần nghe và nói mỗi ngày?
            </h4>
            <p style={{ margin: 0 }}>
              Ngôn ngữ là phản xạ âm thanh trước khi là chữ viết. Dành ít nhất 10 phút mỗi ngày để nghe hội thoại ngắn
              và nói to lặp lại theo phương pháp <strong>Shadowing (nhại giọng)</strong> sẽ giúp cơ miệng quen với các âm uốn lưỡi (zh, ch, sh, r)
              và âm mặt lưỡi (j, q, x). Bạn sẽ không còn ngượng ngùng khi đối thoại thực tế.
            </p>
          </div>

          {/* Section 6 */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
              6. Cách sử dụng Spaced Repetition (SRS) để nhớ lâu
            </h4>
            <p style={{ margin: 0 }}>
              Đường cong quên lãng của Ebbinghaus chứng minh rằng con người quên tới 70% kiến thức mới sau 24 giờ nếu không ôn tập.
              Hệ thống <strong>Flashcard SRS của ZhongWenHub</strong> tự động sắp xếp lịch nhắc bạn ôn từ vựng vào ngày 1, ngày 3, ngày 7 và ngày 14.
              Nhờ đó, bạn chỉ cần bỏ ra vài phút mỗi ngày mà lượng từ vựng vẫn được khắc sâu vào trí nhớ dài hạn.
            </p>
          </div>
        </div>

        {/* Article Summary Box */}
        <div
          style={{
            marginTop: '24px',
            padding: '16px 20px',
            borderRadius: '12px',
            backgroundColor: '#FFF0F1',
            border: '1px solid #fed7da',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} color="var(--primary, #E60012)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary, #E60012)' }}>
              Sẵn sàng bắt đầu hành trình? Lộ trình 6 bước ở trên đã chuẩn bị sẵn mọi bài học cho bạn!
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--primary, #E60012)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Lên đầu trang lộ trình ↑
          </button>
        </div>
      </article>
    </div>
  );
};
