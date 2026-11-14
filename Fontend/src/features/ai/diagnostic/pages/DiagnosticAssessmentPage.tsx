import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Award,
  ChevronRight,
  Zap,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  diagnosticAssessmentService,
  type DiagnosticSessionStart,
  type DiagnosticQuestion,
  type DiagnosticResult,
} from '../../services/diagnostic-assessment.service';

const SKILL_LABEL_MAP: Record<string, string> = {
  grammar: 'Ngữ pháp',
  vocabulary: 'Từ vựng',
  reading: 'Đọc hiểu',
  listening: 'Nghe hiểu',
  pinyin: 'Phiên âm Pinyin',
  hanzi: 'Chữ Hán & Bộ thủ',
};

const SKILL_COLOR_MAP: Record<string, string> = {
  grammar: '#e11d48',
  vocabulary: '#4f46e5',
  reading: '#0284c7',
  listening: '#059669',
  pinyin: '#9333ea',
  hanzi: '#d97706',
};

export const DiagnosticAssessmentPage: React.FC = () => {
  const navigate = useNavigate();

  // Screen states: 'intro' | 'active' | 'submitting' | 'result'
  const [screen, setScreen] = useState<'intro' | 'active' | 'submitting' | 'result'>('intro');
  const [session, setSession] = useState<DiagnosticSessionStart | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmingTarget, setConfirmingTarget] = useState(false);
  const [targetConfirmed, setTargetConfirmed] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Check if there is an existing previous result on initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const latest = await diagnosticAssessmentService.getLatestResult();
        if (mounted && latest) {
          setResult(latest);
        }
      } catch {
        // Ignore initial fetch error
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Timer loop when active
  useEffect(() => {
    if (screen === 'active') {
      const interval = window.setInterval(() => {
        setTimeSpent((prev) => prev + 1);
      }, 1000);
      timerRef.current = interval;
      return () => {
        window.clearInterval(interval);
      };
    } else {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [screen]);

  const handleStartNewSession = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const newSession = await diagnosticAssessmentService.startSession();
      setSession(newSession);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setTimeSpent(0);
      setTargetConfirmed(false);
      setScreen('active');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể khởi tạo bài khảo sát. Vui lòng thử lại sau.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const currentQuestion: DiagnosticQuestion | undefined = session?.questions[currentIndex];

  const handleSubmit = useCallback(async () => {
    if (!session) return;

    setScreen('submitting');
    setErrorMessage(null);

    const answersPayload = session.questions.map((q) => {
      const selectedIndex = selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1;
      const userAnswerText = selectedIndex >= 0 && selectedIndex < q.options.length ? q.options[selectedIndex] : undefined;
      return {
        questionId: q.id,
        selectedIndex,
        userAnswer: userAnswerText,
      };
    });

    try {
      const res = await diagnosticAssessmentService.submitSession({
        sessionId: session.sessionId,
        answers: answersPayload,
        timeSpentSeconds: timeSpent,
      });
      setResult(res);
      setScreen('result');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi nộp bài khảo sát. Vui lòng thử lại.';
      setErrorMessage(message);
      setScreen('active');
    }
  }, [session, selectedAnswers, timeSpent]);

  const handleConfirmTargetHsk = async (hskLevel: number) => {
    setConfirmingTarget(true);
    setErrorMessage(null);
    try {
      await diagnosticAssessmentService.confirmTargetHsk(hskLevel);
      setTargetConfirmed(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể cập nhật mục tiêu học tập.';
      setErrorMessage(message);
    } finally {
      setConfirmingTarget(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ===================== SCREEN: INTRO =====================
  if (screen === 'intro') {
    return (
      <div
        data-testid="diagnostic-intro-screen"
        style={{
          maxWidth: '840px',
          margin: '2rem auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #4338ca 0%, #312e81 100%)',
            color: '#ffffff',
            borderRadius: '24px',
            padding: '36px',
            boxShadow: '0 10px 25px -5px rgba(67, 56, 202, 0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.15)', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
            <Sparkles size={16} />
            <span>HSK Diagnostic Placement Test (Sàng lọc ban đầu)</span>
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 12px 0', lineHeight: 1.3 }}>
            Khảo Sát Định Vị Trình Độ HSK Chuẩn Hóa
          </h1>
          <p style={{ fontSize: '15px', color: '#e0e7ff', margin: '0 0 24px 0', lineHeight: 1.6, maxWidth: '640px' }}>
            Bài kiểm tra trắc nghiệm khách quan gồm 12 câu hỏi sàng lọc (3 câu/cấp HSK 1–4). Đề thi và phương án được xáo trộn ngẫu nhiên theo từng phiên, chấm điểm độc lập tại máy chủ để định vị trình độ sơ bộ và giữ nguyên mục tiêu học tập tự chọn của bạn.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
            <button
              type="button"
              data-testid="start-diagnostic-btn"
              onClick={handleStartNewSession}
              disabled={loading}
              style={{
                backgroundColor: '#ffffff',
                color: '#4338ca',
                fontWeight: 700,
                fontSize: '15px',
                padding: '12px 28px',
                borderRadius: '14px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'transform 0.15s ease',
              }}
            >
              <Zap size={18} />
              <span>{loading ? 'Đang chuẩn bị đề thi...' : 'Bắt đầu làm bài (8–10 phút)'}</span>
            </button>

            <button
              type="button"
              data-testid="skip-diagnostic-btn"
              onClick={() => navigate('/learning-path')}
              style={{
                backgroundColor: 'transparent',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '14px',
                padding: '12px 20px',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.4)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Bỏ qua & học ngay HSK 1</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '12px',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              fontSize: '14px',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Previous Result Preview if exists */}
        {result && (
          <div
            data-testid="previous-diagnostic-result-card"
            style={{
              backgroundColor: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Kết quả định vị gần nhất
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 800, color: 'var(--foreground, #0f172a)' }}>
                  Trình độ khuyến nghị: HSK {result.estimatedHskLevel}
                </h3>
              </div>
              <button
                type="button"
                data-testid="view-previous-result-btn"
                onClick={() => setScreen('result')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>Xem chi tiết</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Độ chính xác</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#4338ca', marginTop: '4px' }}>
                  {result.correctCount}/{result.totalQuestions} ({Math.round(result.accuracyPercent)}%)
                </div>
              </div>
              <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Độ tin cậy sàng lọc</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                  {Math.round(result.confidenceScore * 100)}% (Sơ bộ)
                </div>
              </div>
              <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Thời gian làm bài</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
                  {formatSeconds(result.timeSpentSeconds)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Information Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'var(--surface, #ffffff)', border: '1px solid var(--border, #e2e8f0)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#eef2ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <Award size={20} />
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700 }}>Ngân hàng đề xáo trộn</h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              12 câu hỏi và các phương án trả lời được bốc ngẫu nhiên từ ngân hàng câu hỏi kiểm duyệt và xáo trộn theo từng phiên.
            </p>
          </div>

          <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'var(--surface, #ffffff)', border: '1px solid var(--border, #e2e8f0)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <ShieldCheck size={20} />
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700 }}>Bảo mật & Không lộ đề</h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Đáp án và lời giải chỉ được đối chiếu trên máy chủ sau khi nộp bài; không gửi bản dịch câu hỏi đọc hiểu/nghe làm lộ nội dung.
            </p>
          </div>

          <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'var(--surface, #ffffff)', border: '1px solid var(--border, #e2e8f0)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <BookOpen size={20} />
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700 }}>Bảo toàn mục tiêu cá nhân</h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Hệ thống không tự ý ghi đè mục tiêu HSK của bạn; bạn hoàn toàn chủ động quyết định việc cập nhật mục tiêu hay không.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===================== SCREEN: SUBMITTING =====================
  if (screen === 'submitting') {
    return (
      <div
        data-testid="diagnostic-submitting-screen"
        style={{
          maxWidth: '560px',
          margin: '5rem auto',
          padding: '40px 24px',
          backgroundColor: 'var(--surface, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: '24px',
          textAlign: 'center',
          boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#eef2ff',
            color: '#4338ca',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'spin 1.5s linear infinite',
          }}
        >
          <RotateCcw size={32} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--foreground, #0f172a)' }}>
          Đang Chấm Điểm Tại Máy Chủ Bảo Mật...
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: 1.6, maxWidth: '420px' }}>
          Hệ thống đang đối chiếu câu trả lời với snapshot đề thi, phân tích tỷ lệ chính xác từng cấp độ và lưu hồ sơ năng lực.
        </p>
      </div>
    );
  }

  // ===================== SCREEN: RESULTS =====================
  if (screen === 'result' && result) {
    return (
      <div
        data-testid="diagnostic-result-screen"
        style={{
          maxWidth: '920px',
          margin: '2rem auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Highlight Summary Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            color: '#ffffff',
            borderRadius: '24px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '0 12px 30px -8px rgba(30, 27, 75, 0.4)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.15)', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>
                <CheckCircle2 size={14} />
                <span>Hoàn thành khảo sát HSK Placement Test</span>
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0 }}>
                Trình Độ Khuyến Nghị: HSK {result.estimatedHskLevel}
              </h1>
              <p style={{ margin: '8px 0 0 0', color: '#c7d2fe', fontSize: '14px' }}>
                Độ tin cậy sàng lọc ban đầu: <strong>{Math.round(result.confidenceScore * 100)}% (Mức sơ bộ)</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                data-testid="retake-diagnostic-btn"
                onClick={handleStartNewSession}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RotateCcw size={15} />
                <span>Làm lại bài mới</span>
              </button>

              <button
                type="button"
                data-testid="goto-learning-path-btn"
                onClick={() => navigate('/learning-path')}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#312e81',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Vào lộ trình học HSK {result.estimatedHskLevel}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px 20px', fontSize: '14px', lineHeight: 1.6, color: '#e0e7ff' }}>
            {result.assessmentSummaryVi}
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '12px', color: '#a5b4fc' }}>Số câu đúng</div>
              <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px' }}>
                {result.correctCount} / {result.totalQuestions}
              </div>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '12px', color: '#a5b4fc' }}>Tỷ lệ chính xác</div>
              <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px' }}>
                {Math.round(result.accuracyPercent)}%
              </div>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '12px', color: '#a5b4fc' }}>Thời gian làm bài</div>
              <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px' }}>
                {formatSeconds(result.timeSpentSeconds)}
              </div>
            </div>
          </div>
        </div>

        {/* Limitations Notice */}
        {result.assessmentLimitationsVi && (
          <div
            data-testid="diagnostic-limitations-notice"
            style={{
              padding: '16px 20px',
              borderRadius: '16px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              color: '#92400e',
              fontSize: '13px',
              lineHeight: 1.6,
            }}
          >
            <AlertCircle size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '2px', color: '#78350f' }}>
                Giới hạn đánh giá & Tính minh bạch kết quả:
              </strong>
              {result.assessmentLimitationsVi}
            </div>
          </div>
        )}

        {/* Explicit Target Confirmation Card */}
        <div
          data-testid="target-confirmation-card"
          style={{
            backgroundColor: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--foreground, #0f172a)' }}>
              Cập Nhật Mục Tiêu Học Tập Cá Nhân
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b', maxWidth: '540px', lineHeight: 1.5 }}>
              Mục tiêu học tập bạn tự chọn ban đầu vẫn được giữ nguyên. Nếu muốn điều chỉnh mục tiêu theo kết quả định vị (HSK {result.estimatedHskLevel}), vui lòng xác nhận bên dưới.
            </p>
          </div>

          <button
            type="button"
            data-testid="confirm-target-hsk-btn"
            disabled={confirmingTarget || targetConfirmed}
            onClick={() => handleConfirmTargetHsk(result.estimatedHskLevel)}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              backgroundColor: targetConfirmed ? '#059669' : '#4338ca',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '13px',
              cursor: targetConfirmed ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s ease',
            }}
          >
            {targetConfirmed ? (
              <>
                <CheckCircle2 size={16} />
                <span>Đã cập nhật mục tiêu HSK {result.estimatedHskLevel}</span>
              </>
            ) : (
              <>
                <span>{confirmingTarget ? 'Đang cập nhật...' : `Xác nhận đổi mục tiêu sang HSK ${result.estimatedHskLevel}`}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>

        {/* Skill Accuracy Breakdown */}
        <div
          data-testid="diagnostic-skill-breakdown"
          style={{
            backgroundColor: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--foreground, #0f172a)' }}>
            Năng Lực Chi Tiết Theo Kỹ Năng
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {Object.entries(result.skillAccuracyPercent).map(([skill, acc]) => {
              const label = SKILL_LABEL_MAP[skill] || skill;
              const color = SKILL_COLOR_MAP[skill] || '#4338ca';
              return (
                <div
                  key={skill}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>{label}</span>
                    <span style={{ fontWeight: 800, fontSize: '13px', color }}>{Math.round(acc)}%</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '9999px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(0, acc))}%`,
                        backgroundColor: color,
                        borderRadius: '9999px',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* HSK Level Breakdown */}
        {result.hskLevelAccuracyPercent && Object.keys(result.hskLevelAccuracyPercent).length > 0 && (
          <div
            data-testid="diagnostic-hsk-breakdown"
            style={{
              backgroundColor: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--foreground, #0f172a)' }}>
              Độ Thành Thạo Theo Từng Cấp HSK
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              {Object.entries(result.hskLevelAccuracyPercent).map(([hsk, acc]) => (
                <div
                  key={hsk}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700 }}>
                    <span>HSK {hsk}</span>
                    <span style={{ color: acc >= 70 ? '#059669' : acc >= 50 ? '#d97706' : '#dc2626' }}>
                      {Math.round(acc)}%
                    </span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '9999px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(0, acc))}%`,
                        backgroundColor: acc >= 70 ? '#059669' : acc >= 50 ? '#d97706' : '#dc2626',
                        borderRadius: '9999px',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Question Review with Vietnamese explanations */}
        <div
          data-testid="diagnostic-question-review"
          style={{
            backgroundColor: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--foreground, #0f172a)' }}>
              Chi Tiết Từng Câu Hỏi & Lời Giải Thích
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {result.detailedQuestions.length} câu hỏi
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {result.detailedQuestions.map((q, idx) => (
              <div
                key={q.questionId}
                style={{
                  borderRadius: '14px',
                  border: q.isCorrect ? '1px solid #bbf7d0' : '1px solid #fecaca',
                  backgroundColor: q.isCorrect ? '#f0fdf4' : '#fef2f2',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {q.isCorrect ? (
                      <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
                    ) : (
                      <XCircle size={18} style={{ color: '#dc2626' }} />
                    )}
                    <span style={{ fontWeight: 800, fontSize: '14px', color: q.isCorrect ? '#166534' : '#991b1b' }}>
                      Câu {idx + 1} • HSK {q.hskLevel} ({SKILL_LABEL_MAP[q.skillCategory] || q.skillCategory})
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{q.topicTitle}</span>
                </div>

                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                  {q.promptZh}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginTop: '4px' }}>
                  {q.options.map((opt, optIdx) => {
                    const isUserPick = q.userSelectedIndex === optIdx;
                    const isCorrectAnswer = q.correctIndex === optIdx;
                    let optBg = '#ffffff';
                    let optBorder = '#e2e8f0';
                    let optColor = '#334155';

                    if (isCorrectAnswer) {
                      optBg = '#dcfce7';
                      optBorder = '#86efac';
                      optColor = '#166534';
                    } else if (isUserPick && !q.isCorrect) {
                      optBg = '#fee2e2';
                      optBorder = '#fca5a5';
                      optColor = '#991b1b';
                    }

                    return (
                      <div
                        key={optIdx}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: optBg,
                          border: `1px solid ${optBorder}`,
                          color: optColor,
                          fontSize: '13px',
                          fontWeight: isCorrectAnswer || isUserPick ? 700 : 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span style={{ opacity: 0.7 }}>{String.fromCharCode(65 + optIdx)}.</span>
                        <span>{opt}</span>
                        {isCorrectAnswer && <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#16a34a' }}>✓ Đúng</span>}
                        {isUserPick && !q.isCorrect && <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#dc2626' }}>✗ Đã chọn</span>}
                      </div>
                    );
                  })}
                </div>

                <div style={{ fontSize: '13px', color: '#334155', backgroundColor: 'rgba(255,255,255,0.7)', padding: '10px 14px', borderRadius: '8px', lineHeight: 1.5 }}>
                  <strong>Giải thích:</strong> {q.explanationVi}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', margin: '16px 0' }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: 'none',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Quay về Dashboard
          </button>

          <button
            type="button"
            onClick={() => navigate('/learning-path')}
            style={{
              padding: '12px 28px',
              borderRadius: '12px',
              backgroundColor: '#4338ca',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Học lộ trình HSK {result.estimatedHskLevel}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ===================== SCREEN: ACTIVE TEST =====================
  if (screen === 'active' && session && currentQuestion) {
    const total = session.totalQuestions;
    const progressPercent = ((currentIndex + 1) / total) * 100;
    const answeredCount = Object.keys(selectedAnswers).length;

    return (
      <div
        data-testid="diagnostic-active-screen"
        style={{
          maxWidth: '840px',
          margin: '2rem auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--surface, #ffffff)',
            padding: '14px 20px',
            borderRadius: '16px',
            border: '1px solid var(--border, #e2e8f0)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#4338ca' }}>
              Câu {currentIndex + 1} / {total}
            </span>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: '#eef2ff',
                color: '#4338ca',
              }}
            >
              HSK {currentQuestion.hskLevel} • {SKILL_LABEL_MAP[currentQuestion.skillCategory] || currentQuestion.skillCategory}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
              <Clock size={16} />
              <span>{formatSeconds(timeSpent)}</span>
            </div>

            <button
              type="button"
              data-testid="skip-to-learning-path-btn"
              onClick={() => {
                if (window.confirm('Bạn có chắc muốn dừng bài khảo sát và bắt đầu học ngay lộ trình HSK 1 không?')) {
                  navigate('/learning-path');
                }
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Bỏ qua bài khảo sát
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: '6px', borderRadius: '9999px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: '#4338ca',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Question Card */}
        <div
          data-testid="diagnostic-question-card"
          style={{
            backgroundColor: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: '24px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          <div>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Chủ đề: {currentQuestion.topicTitle}
            </span>

            {/* Chinese Prompt */}
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#0f172a',
                marginTop: '10px',
                lineHeight: 1.4,
                letterSpacing: '0.02em',
              }}
            >
              {currentQuestion.promptZh}
            </div>

            {/* Pinyin if available */}
            {currentQuestion.promptPinyin && (
              <div style={{ fontSize: '15px', color: '#6366f1', marginTop: '6px', fontStyle: 'italic' }}>
                {currentQuestion.promptPinyin}
              </div>
            )}

            {/* Vietnamese instruction / directive (never revealing answer) */}
            {currentQuestion.promptVi && (
              <div style={{ fontSize: '15px', color: '#475569', marginTop: '10px', lineHeight: 1.5 }}>
                {currentQuestion.promptVi}
              </div>
            )}
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswers[currentQuestion.id] === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  data-testid={`option-button-${idx}`}
                  onClick={() => handleSelectOption(currentQuestion.id, idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    border: isSelected ? '2px solid #4338ca' : '1px solid #cbd5e1',
                    backgroundColor: isSelected ? '#f5f3ff' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: isSelected ? '#4338ca' : '#f1f5f9',
                      color: isSelected ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '14px',
                      flexShrink: 0,
                    }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? '#312e81' : '#1e293b',
                    }}
                  >
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Dots and Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <button
            type="button"
            data-testid="prev-question-btn"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: 'none',
              fontWeight: 600,
              fontSize: '14px',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: currentIndex === 0 ? 0.5 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowLeft size={16} />
            <span>Câu trước</span>
          </button>

          {/* Question navigator dots */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {session.questions.map((q, idx) => {
              const answered = selectedAnswers[q.id] !== undefined;
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  title={`Câu ${idx + 1}`}
                  style={{
                    width: isCurrent ? '26px' : '10px',
                    height: '10px',
                    borderRadius: '9999px',
                    backgroundColor: isCurrent ? '#4338ca' : answered ? '#818cf8' : '#cbd5e1',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.2s ease',
                  }}
                />
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {currentIndex < total - 1 ? (
              <button
                type="button"
                data-testid="next-question-btn"
                onClick={() => setCurrentIndex((prev) => Math.min(total - 1, prev + 1))}
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  backgroundColor: '#4338ca',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Câu tiếp</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                data-testid="submit-diagnostic-btn"
                onClick={handleSubmit}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                }}
              >
                <CheckCircle2 size={16} />
                <span>Nộp bài ({answeredCount}/{total})</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer helper */}
        <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          Đã làm {answeredCount} / {total} câu hỏi. Bạn có thể nộp bài bất kỳ lúc nào để nhận đánh giá ban đầu.
        </div>
      </div>
    );
  }

  return null;
};

export default DiagnosticAssessmentPage;
