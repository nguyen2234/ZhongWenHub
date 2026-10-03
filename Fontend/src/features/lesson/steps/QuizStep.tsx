import React, { useState } from 'react';
import { HelpCircle, ArrowRight } from 'lucide-react';
import { type QuizQuestionItem } from '../types';
import { AnswerFeedback } from '../components/AnswerFeedback';

interface QuizStepProps {
  quiz: QuizQuestionItem[];
  onCompleteQuiz: (score: number, total: number) => void;
}

export const QuizStep: React.FC<QuizStepProps> = ({ quiz, onCompleteQuiz }) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const currentQ = quiz[currentQIndex];
  const isCorrect = selectedOption === currentQ.correctIndex;

  const handleSelect = (idx: number) => {
    if (!hasChecked) {
      setSelectedOption(idx);
    }
  };

  const handleCheck = () => {
    if (selectedOption !== null && !hasChecked) {
      setHasChecked(true);
      if (selectedOption === currentQ.correctIndex) {
        setCorrectCount((c) => c + 1);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQIndex < quiz.length - 1) {
      setCurrentQIndex((idx) => idx + 1);
      setSelectedOption(null);
      setHasChecked(false);
    } else {
      // Completed all quiz questions
      const finalScore = isCorrect ? correctCount + 1 : correctCount;
      onCompleteQuiz(finalScore, quiz.length);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%', alignItems: 'center' }}>
      
      {/* Quiz Progress Counter: Câu 3 / 5 & Progress Bar */}
      <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
            MINI QUIZ • Câu {currentQIndex + 1} / {quiz.length}
          </span>
          <span style={{ color: 'var(--muted)', fontWeight: 600 }}>
            Đúng: {correctCount} câu
          </span>
        </div>

        {/* Mini Segmented Bar */}
        <div style={{ height: '6px', backgroundColor: 'var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${((currentQIndex + 1) / quiz.length) * 100}%`,
              backgroundColor: 'var(--primary)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          borderRadius: 'var(--radius-2xl)',
          backgroundColor: 'var(--surface)',
          border: '1.5px solid var(--border)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <HelpCircle size={18} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--foreground)', lineHeight: 1.4 }}>
            {currentQ.question}
          </h2>
        </div>

        {/* Optional Hanzi/Pinyin Display */}
        {currentQ.hanzi && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--foreground)' }}>
              {currentQ.hanzi}
            </div>
            {currentQ.pinyin && (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
                {currentQ.pinyin}
              </div>
            )}
          </div>
        )}

        {/* 4 Choices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            let border = isSelected ? '2px solid var(--primary)' : '1px solid var(--border)';
            let bg = isSelected ? 'var(--primary-light)' : 'var(--surface)';

            if (hasChecked) {
              if (idx === currentQ.correctIndex) {
                border = '2px solid var(--success-border)';
                bg = 'var(--success-bg)';
              } else if (isSelected && idx !== currentQ.correctIndex) {
                border = '2px solid var(--danger-border)';
                bg = 'var(--danger-bg)';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={hasChecked}
                onClick={() => handleSelect(idx)}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-xl)',
                  border,
                  backgroundColor: bg,
                  color: 'var(--foreground)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  cursor: hasChecked ? 'default' : 'pointer',
                  textAlign: 'left',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: isSelected ? 'var(--primary)' : 'var(--neutral-bg)',
                    color: isSelected ? '#ffffff' : 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback after checking */}
        {hasChecked && (
          <AnswerFeedback
            isCorrect={isCorrect}
            explanation={currentQ.explanation}
            correctAnswerText={currentQ.options[currentQ.correctIndex]}
            userAnswerText={selectedOption !== null ? currentQ.options[selectedOption] : undefined}
          />
        )}

        {/* Next Question / Check Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
          {!hasChecked ? (
            <button
              type="button"
              disabled={selectedOption === null}
              onClick={handleCheck}
              style={{
                padding: '8px 24px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: selectedOption === null ? 'var(--border)' : 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: 'var(--text-sm)',
                cursor: selectedOption === null ? 'default' : 'pointer',
              }}
            >
              Kiểm tra
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNextQuestion}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 24px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: 'var(--text-sm)',
                cursor: 'pointer',
              }}
            >
              <span>{currentQIndex < quiz.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
