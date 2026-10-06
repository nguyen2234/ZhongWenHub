import React, { useState } from 'react';
import {
  Check,
  Lock,
  Play,
  RotateCcw,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  Target,
  Trophy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  ProgressBar,
  HSKLevel,
} from '../../../design-system';

// Type definitions
export interface LessonItem {
  id: number;
  lessonNumber: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  summary: string;
  durationMinutes: number;
  xpReward: number;
  status: 'completed' | 'in_progress' | 'locked';
  progressPercent?: number;
}

export interface UnitItem {
  id: number;
  unitNumber: number;
  hanziTitle: string;
  pinyinTitle: string;
  vietnameseTitle: string;
  totalLessons: number;
  completedLessons: number;
  status: 'completed' | 'in_progress' | 'locked';
  milestoneBadge: string;
  milestoneXp: number;
  unlockCondition?: string;
  lessons: LessonItem[];
}

export interface HSKLevelData {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  vietnameseName: string;
  status: 'completed' | 'in_progress' | 'locked';
  totalLessons: number;
  completedLessons: number;
  totalWords: number;
  completedWords: number;
  color: string;
}

export interface LearningPathProps {
  onOpenLesson?: (lessonId?: number) => void;
}

export const LearningPathPage: React.FC<LearningPathProps> = ({ onOpenLesson: customOpenLesson }) => {
  const navigate = useNavigate();
  const onOpenLesson = customOpenLesson ?? ((_id?: number) => navigate('/lesson'));

  // HSK Level selection state (default HSK 2)
  const [selectedHSK, setSelectedHSK] = useState<1 | 2 | 3 | 4 | 5 | 6>(2);

  // Unit collapsed state (Unit 1 completed default collapsed, Unit 2 in-progress default expanded)
  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>({
    1: false, // Unit 1 đã xong -> thu gọn
    2: true,  // Unit 2 đang học -> mở bung
    3: false, // Unit 3 khóa -> thu gọn
    4: false, // Unit 4 khóa -> thu gọn
  });

  const toggleUnitExpand = (unitId: number) => {
    setExpandedUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  // 6 HSK Levels Progression Data
  const hskLevels: HSKLevelData[] = [
    {
      level: 1,
      name: 'HSK 1',
      vietnameseName: 'Nhập môn',
      status: 'completed',
      totalLessons: 15,
      completedLessons: 15,
      totalWords: 150,
      completedWords: 150,
      color: 'var(--hsk1)',
    },
    {
      level: 2,
      name: 'HSK 2',
      vietnameseName: 'Sơ cấp',
      status: 'in_progress',
      totalLessons: 18,
      completedLessons: 8,
      totalWords: 300,
      completedWords: 135,
      color: 'var(--hsk2)',
    },
    {
      level: 3,
      name: 'HSK 3',
      vietnameseName: 'Trung cấp 1',
      status: 'locked',
      totalLessons: 24,
      completedLessons: 0,
      totalWords: 600,
      completedWords: 0,
      color: 'var(--hsk3)',
    },
    {
      level: 4,
      name: 'HSK 4',
      vietnameseName: 'Trung cấp 2',
      status: 'locked',
      totalLessons: 30,
      completedLessons: 0,
      totalWords: 1200,
      completedWords: 0,
      color: 'var(--hsk4)',
    },
    {
      level: 5,
      name: 'HSK 5',
      vietnameseName: 'Cao cấp 1',
      status: 'locked',
      totalLessons: 36,
      completedLessons: 0,
      totalWords: 2500,
      completedWords: 0,
      color: 'var(--hsk5)',
    },
    {
      level: 6,
      name: 'HSK 6',
      vietnameseName: 'Cao cấp 2',
      status: 'locked',
      totalLessons: 40,
      completedLessons: 0,
      totalWords: 5000,
      completedWords: 0,
      color: 'var(--hsk6)',
    },
  ];

  // Units of HSK 2 Data
  const hsk2Units: UnitItem[] = [
    {
      id: 1,
      unitNumber: 1,
      hanziTitle: '日常问候与介绍',
      pinyinTitle: 'Rìcháng wènhòu yǔ jièshào',
      vietnameseTitle: 'Chào hỏi & Giới thiệu trang trọng',
      totalLessons: 4,
      completedLessons: 4,
      status: 'completed',
      milestoneBadge: 'Huy hiệu Khéo ăn nói',
      milestoneXp: 100,
      lessons: [
        {
          id: 1,
          lessonNumber: 1,
          hanzi: '您贵姓？',
          pinyin: 'Nín guìxìng?',
          meaning: 'Hỏi họ và xưng hô lịch sự',
          summary: 'Cách dùng đại từ kính trọng 您 (nín) và cấu trúc hỏi họ trang trọng trong giao tiếp.',
          durationMinutes: 10,
          xpReward: 20,
          status: 'completed',
          progressPercent: 100,
        },
        {
          id: 2,
          lessonNumber: 2,
          hanzi: '好久不见！',
          pinyin: 'Hǎojiǔ bùjiàn!',
          meaning: 'Lâu ngày không gặp',
          summary: 'Mẫu câu chào hỏi khi gặp lại người quen và hỏi thăm sức khỏe, công việc.',
          durationMinutes: 12,
          xpReward: 20,
          status: 'completed',
          progressPercent: 100,
        },
        {
          id: 3,
          lessonNumber: 3,
          hanzi: '认识你很高兴',
          pinyin: 'Rènshi nǐ hěn gāoxìng',
          meaning: 'Rất vui được làm quen với bạn',
          summary: 'Cách đáp lại lời giới thiệu và mở rộng các mối quan hệ bạn bè, đối tác.',
          durationMinutes: 15,
          xpReward: 25,
          status: 'completed',
          progressPercent: 100,
        },
        {
          id: 4,
          lessonNumber: 4,
          hanzi: '第一单元复习与测验',
          pinyin: 'Dì-yī dānyuán fùxí yǔ cèyàn',
          meaning: 'Ôn tập & Kiểm tra Unit 1',
          summary: 'Tổng hợp 30 từ vựng và 4 mẫu câu then chốt của Unit 1.',
          durationMinutes: 15,
          xpReward: 35,
          status: 'completed',
          progressPercent: 100,
        },
      ],
    },
    {
      id: 2,
      unitNumber: 2,
      hanziTitle: '餐厅与买东西',
      pinyinTitle: 'Cāntīng yǔ mǎi dōngxi',
      vietnameseTitle: 'Ẩm thực & Mua sắm hàng ngày',
      totalLessons: 4,
      completedLessons: 3,
      status: 'in_progress',
      milestoneBadge: 'Huy hiệu Mua sắm sành sỏi',
      milestoneXp: 120,
      lessons: [
        {
          id: 5,
          lessonNumber: 5,
          hanzi: '这个多少钱？',
          pinyin: 'Zhège duōshǎo qián?',
          meaning: 'Cái này bao nhiêu tiền?',
          summary: 'Cách dùng từ để hỏi 多少 (duōshǎo) và các đơn vị tiền tệ cơ bản (块, 毛).',
          durationMinutes: 15,
          xpReward: 25,
          status: 'completed',
          progressPercent: 100,
        },
        {
          id: 6,
          lessonNumber: 6,
          hanzi: '我要买苹果',
          pinyin: 'Wǒ yào mǎi píngguǒ',
          meaning: 'Tôi muốn mua táo',
          summary: 'Tên các loại hoa quả thông dụng và cách dùng lượng từ chỉ cân nặng (斤 - cân Trung Quốc).',
          durationMinutes: 12,
          xpReward: 20,
          status: 'completed',
          progressPercent: 100,
        },
        {
          id: 7,
          lessonNumber: 7,
          hanzi: '一共多少钱？',
          pinyin: 'Yīgòng duōshǎo qián?',
          meaning: 'Tổng cộng hết bao nhiêu tiền?',
          summary: 'Cách tính tổng hóa đơn, trả tiền mặt và hỏi phương thức quét mã thanh toán.',
          durationMinutes: 15,
          xpReward: 25,
          status: 'completed',
          progressPercent: 100,
        },
        {
          id: 8,
          lessonNumber: 8,
          hanzi: '你想喝什么？',
          pinyin: 'Nǐ xiǎng hē shénme?',
          meaning: 'Bạn muốn uống gì?',
          summary: 'Hỏi đồ uống tại quán cà phê/trà sữa, cách dùng trợ động từ 想 (muốn) và lượng từ 杯 (ly/cốc).',
          durationMinutes: 15,
          xpReward: 30,
          status: 'in_progress',
          progressPercent: 65,
        },
      ],
    },
    {
      id: 3,
      unitNumber: 3,
      hanziTitle: '时间与日程安排',
      pinyinTitle: 'Shíjiān yǔ rìchéng ānpái',
      vietnameseTitle: 'Thời gian & Lịch trình sinh hoạt',
      totalLessons: 4,
      completedLessons: 0,
      status: 'locked',
      milestoneBadge: 'Huy hiệu Quản lý thời gian',
      milestoneXp: 130,
      unlockCondition: 'Hoàn thành Bài 8 trong Unit 2 để mở khóa',
      lessons: [
        {
          id: 9,
          lessonNumber: 9,
          hanzi: '现在几点？',
          pinyin: 'Xiànzài jǐ diǎn?',
          meaning: 'Bây giờ là mấy giờ?',
          summary: 'Cách xem giờ, phút, rưỡi (半) và các khoảng thời gian sáng, trưa, chiều, tối.',
          durationMinutes: 15,
          xpReward: 25,
          status: 'locked',
        },
        {
          id: 10,
          lessonNumber: 10,
          hanzi: '你的生日是几月几号？',
          pinyin: 'Nǐ de shēngrì shì jǐ yuè jǐ hào?',
          meaning: 'Sinh nhật bạn là ngày mấy tháng mấy?',
          summary: 'Cách nói ngày tháng năm trong tiếng Trung theo trật tự từ lớn đến nhỏ (Năm - Tháng - Ngày).',
          durationMinutes: 12,
          xpReward: 20,
          status: 'locked',
        },
        {
          id: 11,
          lessonNumber: 11,
          hanzi: '星期天你做什么？',
          pinyin: 'Xīngqītiān nǐ zuò shénme?',
          meaning: 'Chủ nhật bạn làm gì?',
          summary: 'Thứ trong tuần và diễn đạt các hoạt động giải trí, thể thao ngày nghỉ.',
          durationMinutes: 15,
          xpReward: 25,
          status: 'locked',
        },
        {
          id: 12,
          lessonNumber: 12,
          hanzi: '第三单元复习与测验',
          pinyin: 'Dì-sān dānyuán fùxí yǔ cèyàn',
          meaning: 'Ôn tập & Kiểm tra Unit 3',
          summary: 'Bài kiểm tra phản xạ thời gian và sắp xếp lịch trình.',
          durationMinutes: 20,
          xpReward: 40,
          status: 'locked',
        },
      ],
    },
    {
      id: 4,
      unitNumber: 4,
      hanziTitle: '交通与出行',
      pinyinTitle: 'Jiāotōng yǔ chūxíng',
      vietnameseTitle: 'Phương tiện giao thông & Đi lại',
      totalLessons: 4,
      completedLessons: 0,
      status: 'locked',
      milestoneBadge: 'Huy hiệu Nhà du hành',
      milestoneXp: 140,
      unlockCondition: 'Hoàn thành Unit 3 để mở khóa',
      lessons: [
        {
          id: 13,
          lessonNumber: 13,
          hanzi: '你怎么去学校？',
          pinyin: 'Nǐ zěnme qù xuéxiào?',
          meaning: 'Bạn đến trường bằng phương tiện gì?',
          summary: 'Cách dùng các động từ di chuyển 坐 (ngồi/đi xe), 骑 (cưỡi/đi xe đạp/máy), 开 (lái).',
          durationMinutes: 15,
          xpReward: 25,
          status: 'locked',
        },
        {
          id: 14,
          lessonNumber: 14,
          hanzi: '请问，地铁站在哪儿？',
          pinyin: 'Qǐngwèn, dìtiězhàn zài nǎr?',
          meaning: 'Xin hỏi, ga tàu điện ngầm ở đâu?',
          summary: 'Hỏi phương hướng, vị trí trái phải, trước sau, đối diện và cách chỉ đường.',
          durationMinutes: 15,
          xpReward: 25,
          status: 'locked',
        },
      ],
    },
  ];

  const currentLevelData = hskLevels.find((h) => h.level === selectedHSK) || hskLevels[1];
  const hskProgressPercent = Math.round((currentLevelData.completedLessons / currentLevelData.totalLessons) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* =====================================================================
          1. HSK 1 → HSK 6 PROGRESSION STEPPER (Thanh tiến trình liên hoàn)
          ===================================================================== */}
      <section
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: 'var(--space-4) var(--space-5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>
              Tiến trình chinh phục HSK
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>• Chọn cấp độ để xem chi tiết lộ trình</span>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--hsk2)' }}>
            Đang học: HSK 2 ({hskProgressPercent}%)
          </span>
        </div>

        {/* Continuous Progression Stepper Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            gap: 'var(--space-2)',
            position: 'relative',
          }}
        >
          {hskLevels.map((lvl) => {
            const isSelected = selectedHSK === lvl.level;
            const isCompleted = lvl.status === 'completed';
            const isInProgress = lvl.status === 'in_progress';
            const isLocked = lvl.status === 'locked';

            let borderColor = 'var(--border-strong)';
            let bgColor = 'var(--background)';
            if (isSelected) {
              borderColor = 'var(--primary)';
              bgColor = 'var(--primary-light)';
            } else if (isCompleted) {
              borderColor = 'var(--success-border)';
              bgColor = 'var(--success-bg)';
            }

            return (
              <button
                key={lvl.level}
                type="button"
                onClick={() => setSelectedHSK(lvl.level)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: 'var(--space-2-5) var(--space-3)',
                  borderRadius: 'var(--radius-lg)',
                  border: `1.5px solid ${borderColor}`,
                  backgroundColor: bgColor,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  opacity: isLocked && !isSelected ? 0.65 : 1,
                  boxShadow: isSelected ? '0 2px 8px rgba(67, 56, 202, 0.15)' : 'none',
                }}
              >
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: isCompleted ? 'var(--success)' : isInProgress ? 'var(--hsk2)' : 'var(--muted)' }}>
                    {lvl.name}
                  </span>
                  {isCompleted ? (
                    <Check size={14} style={{ color: 'var(--success)' }} />
                  ) : isInProgress ? (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--hsk2)' }} />
                  ) : (
                    <Lock size={12} style={{ color: 'var(--muted)' }} />
                  )}
                </div>

                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground)' }}>
                  {lvl.vietnameseName}
                </div>

                <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
                  {isCompleted ? '100%' : isInProgress ? `${Math.round((lvl.completedLessons / lvl.totalLessons) * 100)}%` : `${lvl.totalWords} từ`}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          2. HERO CARD "TIẾP TỤC HỌC" (CTA QUAN TRỌNG NHẤT Ở ĐẦU TRANG)
          ===================================================================== */}
      <section
        style={{
          padding: 'var(--space-5) var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--surface)',
          border: '2px solid var(--primary)',
          boxShadow: '0 4px 16px rgba(67, 56, 202, 0.1)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
              BÀI TIẾP THEO CẦN HỌC
            </span>
            <HSKLevel level={2} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Unit 2 • Bài 8 (65%)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
            <h2
              style={{
                fontFamily: 'var(--font-hanzi)',
                fontSize: 'var(--hanzi-display-sm)',
                fontWeight: 700,
                margin: 0,
                color: 'var(--foreground)',
                lineHeight: 1.2,
              }}
            >
              你想喝什么？
            </h2>
            <span style={{ fontSize: 'var(--text-base)', color: 'var(--primary)', fontWeight: 600 }}>
              Nǐ xiǎng hē shénme?
            </span>
          </div>

          <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--muted)', fontStyle: 'italic' }}>
            &quot;Bạn muốn uống gì?&quot; • Học cách gọi đồ uống, sử dụng lượng từ 杯 và hỏi giá với 多少.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} /> 15 phút
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--xp)', fontWeight: 600 }}>
              <Award size={14} /> +30 XP khi hoàn thành
            </span>
          </div>
        </div>

        {/* CTA Button Tiếp tục học */}
        <Button
          variant="primary"
          icon={<Play size={18} fill="currentColor" />}
          style={{
            minHeight: '48px',
            padding: '0 var(--space-6)',
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(67, 56, 202, 0.3)',
          }}
          onClick={() => (onOpenLesson ? onOpenLesson(8) : alert('Bắt đầu học ngay Bài 8: 你想喝什么？'))}
        >
          TIẾP TỤC HỌC BÀI 8 ➜
        </Button>
      </section>

      {/* =====================================================================
          3. MAIN LAYOUT (65% Dòng chảy Lộ trình Unit/Lesson / 35% Cột phụ gọn)
          ===================================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* ===================================================================
            CỘT CHÍNH (65%): DÒNG CHẢY UNIT VÀ LESSONS THEO CHẶNG
            =================================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', gridColumn: 'span 2' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
              Danh sách các Unit trong HSK {selectedHSK}
            </h3>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Đã hoàn thành {currentLevelData.completedLessons}/{currentLevelData.totalLessons} bài học
            </span>
          </div>

          {/* Render Units List */}
          {hsk2Units.map((unit) => {
            const isExpanded = expandedUnits[unit.id] ?? false;
            const isCompleted = unit.status === 'completed';
            const isInProgress = unit.status === 'in_progress';
            const isLocked = unit.status === 'locked';

            let unitBorder = '1px solid var(--border)';
            let unitBadgeBg = 'var(--neutral-bg)';
            let unitBadgeColor = 'var(--muted)';

            if (isInProgress) {
              unitBorder = '1.5px solid var(--hsk2-border)';
              unitBadgeBg = 'var(--hsk2-bg)';
              unitBadgeColor = 'var(--hsk2)';
            } else if (isCompleted) {
              unitBorder = '1px solid var(--success-border)';
              unitBadgeBg = 'var(--success-bg)';
              unitBadgeColor = 'var(--success)';
            }

            return (
              <div
                key={unit.id}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-xl)',
                  border: unitBorder,
                  overflow: 'hidden',
                  opacity: isLocked ? 0.75 : 1,
                  boxShadow: isInProgress ? '0 4px 16px rgba(13, 148, 136, 0.08)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Unit Header Bar (Clickable to Expand/Collapse) */}
                <header
                  onClick={() => !isLocked && toggleUnitExpand(unit.id)}
                  style={{
                    padding: 'var(--space-4) var(--space-5)',
                    backgroundColor: isInProgress ? 'var(--surface)' : isCompleted ? 'rgba(236, 253, 245, 0.4)' : 'var(--background)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    cursor: isLocked ? 'default' : 'pointer',
                    borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {/* Unit Number Badge */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: unitBadgeBg,
                        color: unitBadgeColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {isCompleted ? <Check size={18} /> : isLocked ? <Lock size={16} /> : `U${unit.unitNumber}`}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                        <span style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--foreground)' }}>
                          {unit.hanziTitle}
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', fontWeight: 600 }}>
                          {unit.pinyinTitle}
                        </span>
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '2px' }}>
                        Unit {unit.unitNumber}: {unit.vietnameseTitle} • <strong>{unit.completedLessons}/{unit.totalLessons} Bài</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right Status & Expand Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {isCompleted ? (
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--success)', backgroundColor: 'var(--success-bg)', padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>
                        ✓ Đã hoàn thành (100%)
                      </span>
                    ) : isInProgress ? (
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--hsk2)', backgroundColor: 'var(--hsk2-bg)', padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>
                        ▶ Đang học ({Math.round((unit.completedLessons / unit.totalLessons) * 100)}%)
                      </span>
                    ) : (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Lock size={13} /> {unit.unlockCondition || 'Chưa mở khóa'}
                      </span>
                    )}

                    {!isLocked && (
                      <button
                        type="button"
                        aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px' }}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    )}
                  </div>
                </header>

                {/* Lessons List Body (when expanded) */}
                {isExpanded && !isLocked && (
                  <div style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {unit.lessons.map((lesson) => {
                      const isLessonCompleted = lesson.status === 'completed';
                      const isLessonCurrent = lesson.status === 'in_progress';

                      return (
                        <div
                          key={lesson.id}
                          style={{
                            padding: 'var(--space-3-5) var(--space-4)',
                            borderRadius: 'var(--radius-lg)',
                            border: isLessonCurrent ? '2px solid var(--primary)' : '1px solid var(--border)',
                            backgroundColor: isLessonCurrent ? 'var(--primary-light)' : isLessonCompleted ? 'var(--surface)' : 'var(--background)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            position: 'relative',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {/* Left Info: Status icon + Lesson Number + Chinese hierarchy */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', flex: 1, minWidth: '240px' }}>
                            {/* Status circle */}
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: isLessonCompleted ? 'var(--success-bg)' : isLessonCurrent ? 'var(--primary)' : 'var(--neutral-bg)',
                                color: isLessonCompleted ? 'var(--success)' : isLessonCurrent ? '#ffffff' : 'var(--muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 'var(--text-xs)',
                                fontWeight: 700,
                                flexShrink: 0,
                                marginTop: '2px',
                              }}
                            >
                              {isLessonCompleted ? <Check size={16} /> : isLessonCurrent ? <Play size={14} fill="currentColor" /> : <Lock size={14} />}
                            </div>

                            {/* Typography Hierarchy: 1. Chữ Hán -> 2. Pinyin -> 3. Nghĩa tiếng Việt */}
                            <div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)' }}>
                                  Bài {lesson.lessonNumber}:
                                </span>
                                <span
                                  style={{
                                    fontFamily: 'var(--font-hanzi)',
                                    fontSize: 'var(--text-base)',
                                    fontWeight: 700,
                                    color: 'var(--foreground)',
                                    letterSpacing: '0.02em',
                                  }}
                                >
                                  {lesson.hanzi}
                                </span>
                                <span
                                  style={{
                                    fontSize: 'var(--text-sm)',
                                    fontWeight: 600,
                                    color: 'var(--primary)',
                                  }}
                                >
                                  {lesson.pinyin}
                                </span>
                              </div>

                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--foreground)', fontWeight: 500, marginTop: '2px' }}>
                                &quot;{lesson.meaning}&quot;
                              </div>

                              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                                {lesson.summary}
                              </div>
                            </div>
                          </div>

                          {/* Right Controls: Duration, XP, Button CTA */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                <Clock size={12} /> {lesson.durationMinutes} phút
                              </span>
                              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--xp)' }}>
                                +{lesson.xpReward} XP
                              </span>
                            </div>

                            {isLessonCurrent ? (
                              <Button
                                variant="primary"
                                icon={<Play size={14} fill="currentColor" />}
                                onClick={() =>
                                  onOpenLesson
                                    ? onOpenLesson(lesson.lessonNumber)
                                    : alert(`Bắt đầu Bài ${lesson.lessonNumber}: ${lesson.hanzi}`)
                                }
                              >
                                Học tiếp
                              </Button>
                            ) : isLessonCompleted ? (
                              <Button
                                variant="outline"
                                icon={<RotateCcw size={14} />}
                                onClick={() =>
                                  onOpenLesson
                                    ? onOpenLesson(lesson.lessonNumber)
                                    : alert(`Ôn tập lại Bài ${lesson.lessonNumber}: ${lesson.hanzi}`)
                                }
                              >
                                Ôn lại
                              </Button>
                            ) : (
                              <Button variant="secondary" disabled icon={<Lock size={14} />}>
                                Khóa
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ===================================================================
            CỘT PHẢI (35%): TIẾN ĐỘ HSK, MILESTONE & THÔNG TIN MỞ KHÓA
            (Gọn gàng, không bị phân tán, không trùng lặp AI Tutor)
            =================================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          
          {/* Card 1: Tổng quan tiến độ HSK hiện tại */}
          <Card title={`Tiến độ ${currentLevelData.name} (${currentLevelData.vietnameseName})`} icon={<Target size={18} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--muted)' }}>Tiến độ hoàn thành:</span>
                  <span style={{ fontWeight: 700, color: 'var(--hsk2)' }}>
                    {currentLevelData.completedLessons} / {currentLevelData.totalLessons} Bài ({hskProgressPercent}%)
                  </span>
                </div>
                <ProgressBar value={hskProgressPercent} variant="primary" showPercentage={false} />
              </div>

              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                  <span style={{ color: 'var(--muted)' }}>Từ vựng đã nắm vững:</span>
                  <span style={{ fontWeight: 600 }}>{currentLevelData.completedWords} / {currentLevelData.totalWords} từ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                  <span style={{ color: 'var(--muted)' }}>Thời lượng đã học:</span>
                  <span style={{ fontWeight: 600 }}>180 phút</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                  <span style={{ color: 'var(--muted)' }}>XP tích lũy từ HSK {selectedHSK}:</span>
                  <span style={{ fontWeight: 700, color: 'var(--xp)' }}>+480 XP</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Mốc phần thưởng Unit kế tiếp */}
          <div
            style={{
              padding: 'var(--space-5)',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--xp-bg)',
              border: '1px solid var(--xp-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Trophy size={20} style={{ color: 'var(--xp)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--xp)' }}>
                Mốc phần thưởng tiếp theo
              </span>
            </div>

            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--foreground)', lineHeight: 1.5 }}>
              Hoàn thành <strong>Bài 8 trong Unit 2</strong> để nhận ngay <strong>+120 XP</strong> và mở khóa huy hiệu danh dự <em>&quot;Mua sắm sành sỏi&quot;</em>!
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '2px' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Tiến độ Unit 2:</span>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--xp)' }}>3 / 4 Bài (75%)</span>
            </div>
          </div>

          {/* Card 3: Điều kiện thăng hạng HSK 3 */}
          <Card title="Điều kiện mở khóa HSK 3" icon={<Lock size={16} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Check size={14} style={{ color: 'var(--success)' }} />
                <span>Hoàn thành trọn vẹn HSK 1 (150 từ vựng)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--hsk2)', display: 'inline-block' }} />
                <span>Hoàn thành 18 bài học HSK 2 (Hiện tại: 8/18)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Lock size={14} />
                <span>Đạt bài thi thử HSK 2 tổng hợp từ 80%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export const LearningPath = LearningPathPage;
export default LearningPathPage;
