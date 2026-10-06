import React, { useState } from 'react';
import {
  Flame,
  Award,
  BookOpen,
  Check,
  Lock,
  Sparkles,
  Play,
  RotateCcw,
  Headphones,
  Mic,
  Clock,
  CheckCircle2,
  Calendar,
  Send,
  PenTool,
  Brain,
  MessageCircle,
  FileCheck,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Badge,
  Card,
  ProgressBar,
  StreakTracker,
  HSKLevel,
  Flashcard,
  Modal,
} from '../../../design-system';

export interface DashboardProps {
  onStartReviewSession?: () => void;
  onOpenVocabulary?: () => void;
  onOpenLesson?: (lessonId?: number) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({
  onStartReviewSession,
  onOpenVocabulary,
  onOpenLesson,
}) => {
  const navigate = useNavigate();
  const handleStartReview = () => {
    if (onStartReviewSession) {
      onStartReviewSession();
    } else {
      navigate('/srs-review');
    }
  };
  const handleOpenLesson = (lessonId?: number) => {
    if (onOpenLesson) {
      onOpenLesson(lessonId);
    } else {
      navigate('/lesson');
    }
  };
  const handleOpenVocabulary = () => {
    if (onOpenVocabulary) {
      onOpenVocabulary();
    } else {
      navigate('/vocabulary');
    }
  };

  // Modal Flashcard Review State (fallback)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  // Review flashcards data
  const reviewWords = [
    {
      hanzi: '喝',
      pinyin: 'hē',
      meaning: 'Uống',
      partOfSpeech: 'Động từ',
      hskLevel: 1 as const,
      exampleSentence: '你想喝什么？',
      exampleMeaning: 'Bạn muốn uống gì?',
    },
    {
      hanzi: '多少',
      pinyin: 'duōshǎo',
      meaning: 'Bao nhiêu',
      partOfSpeech: 'Đại từ',
      hskLevel: 1 as const,
      exampleSentence: '这个多少钱？',
      exampleMeaning: 'Cái này bao nhiêu tiền?',
    },
    {
      hanzi: '苹果',
      pinyin: 'píngguǒ',
      meaning: 'Quả táo',
      partOfSpeech: 'Danh từ',
      hskLevel: 1 as const,
      exampleSentence: '我想买两斤苹果。',
      exampleMeaning: 'Tôi muốn mua hai cân táo.',
    },
    {
      hanzi: '杯',
      pinyin: 'bēi',
      meaning: 'Cốc, ly (lượng từ)',
      partOfSpeech: 'Lượng từ',
      hskLevel: 2 as const,
      exampleSentence: '我要一杯热茶。',
      exampleMeaning: 'Tôi muốn một ly trà nóng.',
    },
  ];

  // AI Tutor Interactive State
  const [aiMessage, setAiMessage] = useState<string>(
    'Ni hao Minh Anh! Trong bài 8 "你想喝什么？", cấu trúc "想" (xiǎng - muốn) diễn tả nguyện vọng lịch sự. Bạn có thắc mắc gì về ngữ pháp bài này không?'
  );
  const [aiActiveAction, setAiActiveAction] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [customAiQuery, setCustomAiQuery] = useState<string>('');

  // Daily Challenge State
  const [challenges, setChallenges] = useState([
    { id: 1, title: 'Học 10 từ mới trong Bài 8', xp: 30, completed: true },
    { id: 2, title: 'Hoàn thành 1 bài luyện nghe phản xạ', xp: 40, completed: false },
    { id: 3, title: 'Ôn tập 20 flashcard Spaced Repetition', xp: 30, completed: false },
  ]);

  const toggleChallenge = (id: number) => {
    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c))
    );
  };

  const handleAiAction = (action: string) => {
    setAiActiveAction(action);
    setIsAiLoading(true);
    setTimeout(() => {
      setIsAiLoading(false);
      if (action === 'grammar') {
        setAiMessage(
          '💡 Giải thích ngữ pháp "想 + Động từ":\n• Dùng để bày tỏ ý định, mong muốn một cách lịch sự.\n• Ví dụ: 我想买水果 (Tôi muốn mua hoa quả).\n• Phủ định dùng: 不想 (bù xiǎng) chứ không dùng 没想.'
        );
      } else if (action === 'dialogue') {
        setAiMessage(
          '🗣️ Luyện hội thoại tại quán cà phê:\nPhục vụ: 你好，你想喝点什么？\nBạn hãy trả lời: 我想要一杯冰美式咖啡，谢谢！(Tôi muốn một ly cà phê Americano đá, cảm ơn!).'
        );
      } else if (action === 'check') {
        setAiMessage(
          '✍️ Kiểm tra câu:\nHãy gửi câu tiếng Trung bạn tự đặt vào ô bên dưới, mình sẽ chấm điểm ngữ pháp, trật tự từ và cách dùng lượng từ cho bạn ngay!'
        );
      } else {
        setAiMessage(
          '📖 Giải thích từ vựng "多少" (duōshǎo):\n• Gồm hai chữ 多 (nhiều) + 少 (ít).\n• Dùng hỏi số lượng từ 10 trở lên hoặc hỏi giá: 这个多少钱？(Cái này bao nhiêu tiền?).'
        );
      }
    }, 500);
  };

  const handleSendCustomQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAiQuery.trim()) return;
    const query = customAiQuery;
    setCustomAiQuery('');
    setIsAiLoading(true);
    setTimeout(() => {
      setIsAiLoading(false);
      setAiMessage(`🤖 Nhận xét câu "${query}": Câu của bạn rất tự nhiên! Trật tự ngữ pháp chuẩn xác. Bạn có thể thay bằng "您想喝点什么？" để thêm phần kính trọng hơn nữa nhé.`);
    }, 600);
  };

  const completedChallenges = challenges.filter((c) => c.completed).length;
  const currentEarnedXp = challenges.filter((c) => c.completed).reduce((acc, cur) => acc + cur.xp, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* =====================================================================
          1. HEADER / WELCOME
          ===================================================================== */}
      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-4)',
          padding: 'var(--space-5) var(--space-6)',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
        }}
      >
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
              Chào buổi sáng, Minh Anh! 👋
            </h1>
            <HSKLevel level={2} showFullLabel />
            <Badge variant="streak" icon={<Flame size={14} />}>Chuỗi 8 ngày</Badge>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
            Hôm nay bạn có <strong>1 bài học đang dở</strong> và <strong>14 từ vựng cần ôn tập</strong> để duy trì trí nhớ dài hạn.
          </p>
        </div>

        {/* Quick Top Stats */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--xp-bg)',
              border: '1px solid var(--xp-border)',
            }}
          >
            <Award size={16} style={{ color: 'var(--xp)' }} />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--xp)' }}>
              2.180 XP Tổng
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--hsk2-bg)',
              border: '1px solid var(--hsk2-border)',
            }}
          >
            <BookOpen size={16} style={{ color: 'var(--hsk2)' }} />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--hsk2)' }}>
              HSK 2: 135/300 từ
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================================
          PHƯƠNG ÁN A: HAI CỘT DUAL-FOCUS
          Cột chính (65%): Continue Learning ➔ Spaced Review ➔ Learning Path ➔ Skills
          Cột phụ (35%): Daily Goal ➔ AI Tutor ➔ Daily Challenge ➔ Achievements
          ===================================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* ===================================================================
            CỘT CHÍNH (65%): DÒNG CHẢY HỌC TẬP & ÔN TẬP
            =================================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', gridColumn: 'span 2' }}>
          
          {/* [2] CONTINUE LEARNING (HERO CARD - QUAN TRỌNG NHẤT) */}
          <div
            style={{
              padding: 'var(--space-5) var(--space-6)',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--surface)',
              border: '2px solid var(--primary)',
              boxShadow: '0 4px 16px rgba(67, 56, 202, 0.08)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Header dải thông tin nhỏ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                  }}
                >
                  ĐANG HỌC DỞ
                </span>
                <HSKLevel level={2} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 500 }}>
                  Bài 8 • Khóa Hội thoại Giao tiếp
                </span>
              </div>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--xp)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Award size={14} /> +50 XP khi hoàn thành
              </span>
            </div>

            {/* Tiêu đề Chữ Hán lớn + Pinyin + Dịch nghĩa */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
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
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', marginTop: '4px', fontStyle: 'italic' }}>
                  &quot;Bạn muốn uống gì?&quot; • Học cách gọi đồ uống, sử dụng lượng từ 杯 và hỏi giá với 多少.
                </div>
              </div>

              {/* Nút Tiếp Tục Học - Nổi bật nhất trang */}
              <Button
                variant="primary"
                icon={<Play size={18} fill="currentColor" />}
                style={{
                  minHeight: '46px',
                  padding: '0 var(--space-6)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(67, 56, 202, 0.3)',
                }}
                onClick={() => handleOpenLesson(8)}
              >
                TIẾP TỤC HỌC ➜
              </Button>
            </div>

            {/* Thông số tiến độ bài học */}
            <div style={{ backgroundColor: 'var(--background)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                  <span>Tiến độ bài: <strong style={{ color: 'var(--foreground)' }}>65%</strong></span>
                  <span>•</span>
                  <span>Đã học: <strong style={{ color: 'var(--foreground)' }}>12/18 từ vựng</strong></span>
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> Ước tính còn 8 phút
                </span>
              </div>
              <ProgressBar value={65} showPercentage={false} />
            </div>
          </div>

          {/* [5] REVIEW: KHU VỰC ÔN TẬP SPACED REPETITION */}
          <div
            style={{
              padding: 'var(--space-5)',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--surface)',
              border: '1.5px solid var(--hsk2-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--hsk2-bg)',
                    color: 'var(--hsk2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Brain size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)' }}>
                    Ôn tập ngắt quãng (Spaced Repetition)
                  </h3>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                    14 từ vựng đến hạn ôn hôm nay • <strong>4 từ sắp quên</strong> cần củng cố
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                icon={<RotateCcw size={15} />}
                style={{ backgroundColor: 'var(--streak)', borderColor: 'var(--streak)' }}
                onClick={handleStartReview}
              >
                Ôn 18 từ đến hạn ngay
              </Button>
            </div>

            {/* Dải từ vựng sắp quên preview */}
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: 'var(--space-2)' }}>
                Từ vựng cần ôn theo thuật toán trí nhớ:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {reviewWords.map((word, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setCurrentReviewIndex(idx);
                      setIsReviewModalOpen(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border-strong)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-base)', fontWeight: 600 }}>
                      {word.hanzi}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', fontWeight: 500 }}>
                      {word.pinyin}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                      ({word.meaning})
                    </span>
                  </div>
                ))}
                <span
                  onClick={handleOpenVocabulary}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                  }}
                >
                  +10 từ khác...
                </span>
              </div>
            </div>
          </div>

          {/* [4] LEARNING PATH (LỘ TRÌNH TIẾN TRÌNH HSK 1 → HSK 6) */}
          <Card
            title="Lộ trình chinh phục HSK 1 → HSK 6"
            icon={<BookOpen size={18} />}
            action={
              <Button variant="ghost" icon={<ChevronRight size={14} />} onClick={() => alert('Xem chi tiết giáo trình HSK 1-6')}>
                Chi tiết lộ trình
              </Button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Stepper trực quan 6 chặng HSK */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-2)' }}>
                {/* HSK 1: Đã hoàn thành */}
                <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--success)' }}>HSK 1</span>
                    <Check size={14} style={{ color: 'var(--success)' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>Đã hoàn thành</div>
                  <div style={{ fontSize: '10px', color: 'var(--muted)' }}>150/150 từ vựng</div>
                </div>

                {/* HSK 2: Đang học */}
                <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--hsk2-bg)', border: '2px solid var(--hsk2)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--hsk2)' }}>HSK 2</span>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--hsk2)' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--hsk2)', fontWeight: 700 }}>Đang học (45%)</div>
                  <div style={{ fontSize: '10px', color: 'var(--muted)' }}>135/300 từ vựng</div>
                </div>

                {/* HSK 3: Chưa mở */}
                <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--background)', border: '1px solid var(--border)', opacity: 0.7, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)' }}>HSK 3</span>
                    <Lock size={12} style={{ color: 'var(--muted)' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Chưa mở khóa</div>
                  <div style={{ fontSize: '10px', color: 'var(--muted)' }}>600 từ vựng</div>
                </div>

                {/* HSK 4 */}
                <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--background)', border: '1px solid var(--border)', opacity: 0.6, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)' }}>HSK 4</span>
                    <Lock size={12} style={{ color: 'var(--muted)' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Chưa mở khóa</div>
                  <div style={{ fontSize: '10px', color: 'var(--muted)' }}>1.200 từ vựng</div>
                </div>

                {/* HSK 5 */}
                <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--background)', border: '1px solid var(--border)', opacity: 0.5, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)' }}>HSK 5</span>
                    <Lock size={12} style={{ color: 'var(--muted)' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Chưa mở khóa</div>
                  <div style={{ fontSize: '10px', color: 'var(--muted)' }}>2.500 từ vựng</div>
                </div>

                {/* HSK 6 */}
                <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--background)', border: '1px solid var(--border)', opacity: 0.5, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)' }}>HSK 6</span>
                    <Lock size={12} style={{ color: 'var(--muted)' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Chưa mở khóa</div>
                  <div style={{ fontSize: '10px', color: 'var(--muted)' }}>5.000+ từ vựng</div>
                </div>
              </div>
            </div>
          </Card>

          {/* [7] SKILLS PROGRESS: TIẾN ĐỘ 6 KỸ NĂNG NGÔN NGỮ */}
          <Card title="Tiến độ 6 Kỹ năng tiếng Trung (Skills Progress)">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <BookOpen size={13} style={{ color: 'var(--primary)' }} /> Từ vựng (Vocabulary)
                  </span>
                  <span style={{ color: 'var(--muted)' }}>285/300 từ (95%)</span>
                </div>
                <ProgressBar value={95} variant="primary" showPercentage={false} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileCheck size={13} style={{ color: 'var(--hsk2)' }} /> Ngữ pháp (Grammar)
                  </span>
                  <span style={{ color: 'var(--muted)' }}>18/25 điểm ngữ pháp (72%)</span>
                </div>
                <ProgressBar value={72} variant="primary" showPercentage={false} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Headphones size={13} style={{ color: '#0284c7' }} /> Luyện nghe (Listening)
                  </span>
                  <span style={{ color: 'var(--muted)' }}>80% đạt chuẩn</span>
                </div>
                <ProgressBar value={80} variant="primary" showPercentage={false} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mic size={13} style={{ color: 'var(--streak)' }} /> Luyện phát âm (Pronunciation)
                  </span>
                  <span style={{ color: 'var(--muted)' }}>88% độ chuẩn xác Pinyin</span>
                </div>
                <ProgressBar value={88} variant="streak" showPercentage={false} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MessageCircle size={13} style={{ color: 'var(--ai)' }} /> Luyện đọc (Reading)
                  </span>
                  <span style={{ color: 'var(--muted)' }}>65% bài đọc hiểu</span>
                </div>
                <ProgressBar value={65} variant="primary" showPercentage={false} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <PenTool size={13} style={{ color: 'var(--seal)' }} /> Viết chữ Hán (Writing)
                  </span>
                  <span style={{ color: 'var(--muted)' }}>160 chữ thuần thục</span>
                </div>
                <ProgressBar value={53} variant="primary" showPercentage={false} />
              </div>
            </div>
          </Card>
        </div>

        {/* ===================================================================
            CỘT PHẢI (35%): DAILY GOAL, AI TUTOR, CHALLENGES, ACHIEVEMENTS
            =================================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          {/* [3] DAILY GOAL & STREAK FLAME */}
          <Card title="Mục tiêu hôm nay (Daily Goal)" icon={<Calendar size={18} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--muted)' }}>Tiến độ tích lũy XP ngày:</span>
                  <span style={{ fontWeight: 700, color: 'var(--xp)' }}>65 / 100 XP (65%)</span>
                </div>
                <ProgressBar value={65} variant="xp" showPercentage={false} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)' }}>
                <span style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} /> Thời gian học:
                </span>
                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>18 / 30 phút</span>
              </div>

              {/* Streak Tracker 7 ngày */}
              <div style={{ marginTop: 'var(--space-1)' }}>
                <StreakTracker streakCount={8} />
              </div>
            </div>
          </Card>

          {/* [8] AI TUTOR CARD (NỔI BẬT NHƯNG GỌN GÀNG) */}
          <div
            style={{
              padding: 'var(--space-5)',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--ai-bg)',
              border: '1.5px solid var(--ai-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.08)',
            }}
          >
            {/* Header AI Tutor */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--ai)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--ai)' }}>
                    有什么不懂的吗？
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    Có gì chưa hiểu? Hỏi AI Tutor
                  </div>
                </div>
              </div>

              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: 'var(--radius-full)', backgroundColor: '#fff', color: 'var(--ai)', border: '1px solid var(--ai-border)', fontWeight: 600 }}>
                Trực tuyến
              </span>
            </div>

            {/* AI Response Bubble */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--ai-border)',
                fontSize: 'var(--text-xs)',
                lineHeight: 1.5,
                color: 'var(--foreground)',
                minHeight: '75px',
              }}
            >
              {isAiLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)' }}>
                  <RotateCcw size={12} className="animate-spin" />
                  <span>AI đang giải thích...</span>
                </div>
              ) : (
                <div style={{ whiteSpace: 'pre-line' }}>{aiMessage}</div>
              )}
            </div>

            {/* Quick Actions 1-chạm */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-1-5)' }}>
              <button
                type="button"
                onClick={() => handleAiAction('grammar')}
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-md)',
                  border: aiActiveAction === 'grammar' ? '1.5px solid var(--ai)' : '1px solid var(--ai-border)',
                  backgroundColor: '#ffffff',
                  color: 'var(--ai)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                📖 Ngữ pháp bài 8
              </button>

              <button
                type="button"
                onClick={() => handleAiAction('dialogue')}
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-md)',
                  border: aiActiveAction === 'dialogue' ? '1.5px solid var(--ai)' : '1px solid var(--ai-border)',
                  backgroundColor: '#ffffff',
                  color: 'var(--ai)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                🗣️ Luyện hội thoại
              </button>

              <button
                type="button"
                onClick={() => handleAiAction('check')}
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-md)',
                  border: aiActiveAction === 'check' ? '1.5px solid var(--ai)' : '1px solid var(--ai-border)',
                  backgroundColor: '#ffffff',
                  color: 'var(--ai)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                ✍️ Kiểm tra câu
              </button>

              <button
                type="button"
                onClick={() => handleAiAction('vocab')}
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-md)',
                  border: aiActiveAction === 'vocab' ? '1.5px solid var(--ai)' : '1px solid var(--ai-border)',
                  backgroundColor: '#ffffff',
                  color: 'var(--ai)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                🔍 Giải nghĩa từ vựng
              </button>
            </div>

            {/* Ô gõ hỏi AI */}
            <form onSubmit={handleSendCustomQuery} style={{ display: 'flex', gap: 'var(--space-1-5)' }}>
              <input
                type="text"
                placeholder="Gõ câu tiếng Trung cần sửa..."
                value={customAiQuery}
                onChange={(e) => setCustomAiQuery(e.target.value)}
                style={{
                  flex: 1,
                  height: '34px',
                  padding: '0 var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--ai-border)',
                  fontSize: 'var(--text-xs)',
                  outline: 'none',
                }}
              />
              <Button
                variant="primary"
                type="submit"
                isIconOnly
                icon={<Send size={13} />}
                style={{ minHeight: '34px', width: '34px', backgroundColor: 'var(--ai)', borderColor: 'var(--ai)' }}
                aria-label="Gửi"
              />
            </form>
          </div>

          {/* [6] DAILY CHALLENGE (THỬ THÁCH NGÀY NHẬN XP) */}
          <Card
            title="Thử thách hôm nay (Challenges)"
            icon={<CheckCircle2 size={18} />}
            action={
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 600 }}>
                {completedChallenges}/3 Hoàn thành (+{currentEarnedXp} XP)
              </span>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {challenges.map((c) => (
                <div
                  key={c.id}
                  onClick={() => toggleChallenge(c.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-2-5) var(--space-3)',
                    borderRadius: 'var(--radius-lg)',
                    border: c.completed ? '1px solid var(--success-border)' : '1px solid var(--border-strong)',
                    backgroundColor: c.completed ? 'var(--success-bg)' : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: 'var(--radius-sm)',
                        border: c.completed ? 'none' : '2px solid var(--border-strong)',
                        backgroundColor: c.completed ? 'var(--success)' : '#ffffff',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {c.completed && <Check size={12} />}
                    </div>
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                        color: c.completed ? 'var(--success)' : 'var(--foreground)',
                        textDecoration: c.completed ? 'line-through' : 'none',
                      }}
                    >
                      {c.title}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: c.completed ? 'var(--success)' : 'var(--xp)',
                      backgroundColor: c.completed ? 'rgba(5, 150, 105, 0.1)' : 'var(--xp-bg)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    +{c.xp} XP
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* [9] RECENT ACHIEVEMENTS (THÀNH TÍCH GẦN ĐÂY) */}
          <Card title="Thành tích gần đây (Achievements)" icon={<Award size={18} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--hsk2-bg)', color: 'var(--hsk2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Chinh phục mốc 150 từ HSK 1</div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Hoàn tất trọn vẹn lộ trình Nhập môn</div>
                  </div>
                </div>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--xp)' }}>+100 XP</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--streak-bg)', color: 'var(--streak)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Flame size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Chuỗi 7 ngày liên tiếp</div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Mở khóa huy hiệu Chiến binh Bền bỉ</div>
                  </div>
                </div>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--xp)' }}>+50 XP</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>100 câu trắc nghiệm chính xác</div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Phản xạ Pinyin & Hán tự xuất sắc</div>
                  </div>
                </div>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--xp)' }}>+40 XP</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* =====================================================================
          MODAL ÔN TẬP FLASHCARD SPACED REPETITION
          ===================================================================== */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`Ôn tập Spaced Repetition (${currentReviewIndex + 1}/${reviewWords.length})`}
        actions={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="secondary"
              disabled={currentReviewIndex === 0}
              onClick={() => setCurrentReviewIndex((i) => Math.max(0, i - 1))}
            >
              Từ trước
            </Button>

            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Từ {currentReviewIndex + 1} trên {reviewWords.length}
            </span>

            <Button
              variant="primary"
              onClick={() => {
                if (currentReviewIndex < reviewWords.length - 1) {
                  setCurrentReviewIndex((i) => i + 1);
                } else {
                  alert('Chúc mừng bạn đã hoàn thành phiên ôn tập 14 từ vựng!');
                  setIsReviewModalOpen(false);
                }
              }}
            >
              {currentReviewIndex < reviewWords.length - 1 ? 'Từ tiếp theo' : 'Hoàn tất ôn tập'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2) 0' }}>
          <Flashcard
            {...reviewWords[currentReviewIndex]}
            onPlayAudio={() => alert(`Phát âm: ${reviewWords[currentReviewIndex].pinyin}`)}
            onRate={(r) => {
              if (currentReviewIndex < reviewWords.length - 1) {
                setCurrentReviewIndex((i) => i + 1);
              } else {
                alert(`Đã hoàn tất đánh giá: ${r}! Cập nhật thuật toán Spaced Repetition thành công.`);
                setIsReviewModalOpen(false);
              }
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export const Dashboard = DashboardPage;
export default DashboardPage;
