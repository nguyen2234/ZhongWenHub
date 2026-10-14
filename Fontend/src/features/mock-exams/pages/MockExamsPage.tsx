import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Volume2,
} from 'lucide-react';
import { MOCK_HSK_EXAMS } from '../mock/mockExamData';
import type { HSKExam, ExamQuestion } from '../types/exam.types';

export const MockExamsPage: React.FC = () => {
  const [selectedHsk, setSelectedHsk] = useState<number | null>(null);
  const [activeExam, setActiveExam] = useState<HSKExam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [isExamCompleted, setIsExamCompleted] = useState(false);

  // Filter exams by HSK level
  const filteredExams = selectedHsk
    ? MOCK_HSK_EXAMS.filter((e) => e.hskLevel === selectedHsk)
    : MOCK_HSK_EXAMS;

  // Countdown timer when exam is running
  useEffect(() => {
    if (!activeExam || isExamCompleted) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExamCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeExam, isExamCompleted]);

  const handleStartExam = (exam: HSKExam) => {
    setActiveExam(exam);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setTimeLeftSeconds(exam.durationMinutes * 60);
    setIsExamCompleted(false);
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isExamCompleted) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleFinishExam = () => {
    setIsExamCompleted(true);
  };

  const handleExitExam = () => {
    setActiveExam(null);
    setIsExamCompleted(false);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Calculate score
  const calculateScore = () => {
    if (!activeExam) return { score: 0, total: 0, percent: 0, isPassed: false };
    let correct = 0;
    activeExam.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctOptionIndex) {
        correct++;
      }
    });
    const percent = Math.round((correct / activeExam.questions.length) * 100);
    const scaledScore = Math.round((correct / activeExam.questions.length) * 200); // HSK score out of 200 or 300
    return {
      score: scaledScore,
      correctCount: correct,
      totalCount: activeExam.questions.length,
      percent,
      isPassed: scaledScore >= activeExam.passingScore,
    };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 24px 48px 24px' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          borderRadius: '20px',
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>
            <GraduationCap size={14} />
            <span>TRUNG TÂM KHẢO THÍ MÔ PHỎNG HSK CHUẨN QUỐC TẾ</span>
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 800 }}>
            Phòng Thi Thử HSK Trực Tuyến
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, maxWidth: '640px', lineHeight: 1.5 }}>
            Trải nghiệm format thi thực tế, đồng hồ bấm giờ chuẩn xác, phân định từng phần thi Nghe - Đọc - Viết và chấm điểm ngay lập tức.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', padding: '12px 20px', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>HSK 1–6</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Hỗ trợ đề thi</div>
          </div>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', padding: '12px 20px', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>Bấm giờ</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Format thực</div>
          </div>
        </div>
      </div>

      {!activeExam ? (
        /* Exams Directory View */
        <>
          {/* Level Filter Bar */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #e2e8f0',
              padding: '14px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginRight: '6px' }}>Chọn cấp độ HSK:</span>
            {[
              { label: 'Tất cả các đề', val: null },
              { label: 'HSK 1', val: 1 },
              { label: 'HSK 2', val: 2 },
              { label: 'HSK 3', val: 3 },
              { label: 'HSK 4–6', val: 4 },
            ].map((btn) => (
              <button
                key={String(btn.val)}
                type="button"
                onClick={() => setSelectedHsk(btn.val)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: selectedHsk === btn.val ? 700 : 500,
                  border: selectedHsk === btn.val ? '1.5px solid #4338ca' : '1px solid #e2e8f0',
                  backgroundColor: selectedHsk === btn.val ? '#eef2ff' : '#ffffff',
                  color: selectedHsk === btn.val ? '#4338ca' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Exam Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '18px',
                  border: '1.5px solid #e2e8f0',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '20px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#eef2ff', color: '#4338ca' }}>
                      HSK CẤP {exam.hskLevel}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} />
                      {exam.durationMinutes} phút
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    {exam.title}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#475569', marginBottom: '16px' }}>
                    <div>• <strong>Tổng số câu hỏi:</strong> {exam.totalQuestions} câu trắc nghiệm</div>
                    <div>• <strong>Điểm đạt chuẩn:</strong> {exam.passingScore} / 200 điểm</div>
                    <div>
                      • <strong>Cấu trúc bài thi:</strong>{' '}
                      {exam.sections.map((s) => `${s.name} (${s.questionCount} câu)`).join(', ')}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartExam(exam)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#4338ca',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 3px 0 0 #312e81',
                  }}
                >
                  <Play size={15} />
                  <span>Bắt đầu thi thử ngay</span>
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Active Exam Room Runner */
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #cbd5e1',
            padding: '24px 28px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Top exam status bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#4338ca', textTransform: 'uppercase' }}>
                Đang làm bài: HSK {activeExam.hskLevel}
              </span>
              <h2 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {activeExam.title}
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Timer Pill */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  backgroundColor: timeLeftSeconds < 300 ? '#fef2f2' : '#f8fafc',
                  border: timeLeftSeconds < 300 ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                  color: timeLeftSeconds < 300 ? '#dc2626' : '#0f172a',
                  fontSize: '14px',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                }}
              >
                <Clock size={16} />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>

              <button
                type="button"
                onClick={handleExitExam}
                style={{
                  background: 'none',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  color: '#64748b',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Rời phòng thi
              </button>
            </div>
          </div>

          {/* Question Navigator Numbers Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginRight: '6px' }}>Danh sách câu:</span>
            {activeExam.questions.map((q, idx) => {
              const isAnswered = userAnswers[q.id] !== undefined;
              const isCurrent = idx === currentQuestionIndex;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: isCurrent ? '2px solid #4338ca' : '1px solid #cbd5e1',
                    backgroundColor: isCurrent ? '#eef2ff' : isAnswered ? '#f1f5f9' : '#ffffff',
                    color: isCurrent ? '#4338ca' : isAnswered ? '#0f172a' : '#64748b',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Current Question View */}
          {(() => {
            const currentQ: ExamQuestion = activeExam.questions[currentQuestionIndex];
            const currentAnswer = userAnswers[currentQ.id];

            return (
              <div
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#e2e8f0', color: '#334155' }}>
                    Phần thi: {currentQ.section} • Câu {currentQuestionIndex + 1} / {activeExam.questions.length}
                  </span>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    {currentQ.prompt}
                  </h4>

                  {currentQ.audioText && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                      <button
                        type="button"
                        onClick={() => speakText(currentQ.audioText || '')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          backgroundColor: '#4338ca',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Volume2 size={16} />
                        <span>Nghe đoạn ghi âm bài thi</span>
                      </button>
                    </div>
                  )}

                  {currentQ.pinyin && (
                    <div style={{ fontSize: '13px', color: '#6366f1', fontWeight: 600, marginTop: '6px' }}>
                      {currentQ.pinyin}
                    </div>
                  )}
                </div>

                {/* Options List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = currentAnswer === optIdx;

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.id, optIdx)}
                        style={{
                          padding: '14px 18px',
                          borderRadius: '12px',
                          backgroundColor: isSelected ? '#eef2ff' : '#ffffff',
                          border: isSelected ? '2px solid #4338ca' : '1px solid #cbd5e1',
                          color: isSelected ? '#4338ca' : '#0f172a',
                          fontSize: '14px',
                          fontWeight: isSelected ? 700 : 500,
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: isSelected ? '2px solid #4338ca' : '1px solid #cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Question Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <button
                    type="button"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#475569',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                      opacity: currentQuestionIndex === 0 ? 0.5 : 1,
                    }}
                  >
                    Câu trước
                  </button>

                  {currentQuestionIndex < activeExam.questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      style={{
                        padding: '8px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#4338ca',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Câu tiếp theo
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinishExam}
                      style={{
                        padding: '8px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Nộp bài thi ngay
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Result Modal */}
      {isExamCompleted && activeExam && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '32px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {(() => {
              const res = calculateScore();

              return (
                <div>
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      backgroundColor: res.isPassed ? '#dcfce7' : '#fee2e2',
                      color: res.isPassed ? '#16a34a' : '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px auto',
                    }}
                  >
                    {res.isPassed ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
                  </div>

                  <h3 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                    {res.isPassed ? 'Chúc mừng! Bạn đã đỗ HSK' : 'Chưa đạt chuẩn HSK'}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
                    {activeExam.title}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: '#4338ca' }}>
                        {res.score} / 200
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Điểm thi quy đổi</div>
                    </div>
                    <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>
                        {res.correctCount} / {res.totalCount}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Số câu trả lời đúng</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={handleExitExam}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: '#4338ca',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Trở về danh sách đề thi
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default MockExamsPage;
