import React, { useState } from 'react';
import { Trophy, CheckCircle2, Clock, Zap, ArrowRight, RotateCcw, Home, AlertCircle, Flag } from 'lucide-react';
import type { PracticeSessionResult } from '../types';
import {
  practiceQuestionBankService,
  type BackendQuestionResultItem,
} from '../services/practice-question-bank.service';

interface PracticeResultProps {
  result: PracticeSessionResult;
  questionResults?: BackendQuestionResultItem[];
  onContinueRecommended: () => void;
  onReviewMistakes: () => void;
  onBackToCenter: () => void;
}

export const PracticeResult: React.FC<PracticeResultProps> = ({
  result,
  questionResults,
  onContinueRecommended,
  onReviewMistakes,
  onBackToCenter,
}) => {
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportedIds, setReportedIds] = useState<Record<string, string>>({});
  const [reportBusy, setReportBusy] = useState(false);

  const handleSubmitReport = async (questionId: string) => {
    const cleanReason = reportReason.trim() || 'Câu hỏi hoặc giải thích chưa chính xác';
    setReportBusy(true);
    try {
      await practiceQuestionBankService.reportQuestion(questionId, cleanReason);
      setReportedIds((prev) => ({ ...prev, [questionId]: 'Đã gửi báo lỗi để kiểm duyệt' }));
      setReportingId(null);
      setReportReason('');
    } catch {
      setReportedIds((prev) => ({ ...prev, [questionId]: 'Không thể gửi báo lỗi lúc này' }));
    } finally {
      setReportBusy(false);
    }
  };

  const minutes = Math.floor(result.timeSpentSeconds / 60);
  const seconds = result.timeSpentSeconds % 60;
  const timeFormatted = `${minutes}p ${seconds < 10 ? '0' : ''}${seconds}s`;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          borderRadius: 'var(--radius-2xl)',
          backgroundColor: 'var(--surface)',
          border: '1.5px solid var(--border)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-5)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          textAlign: 'center',
        }}
      >
        {/* Trophy icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: 'var(--warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Trophy size={34} />
        </div>

        <div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 4px 0' }}>
            🎉 Hoàn thành luyện tập!
          </h2>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--muted)', fontWeight: 600 }}>
            {result.skillTitle} · HSK {result.hskLevel}
          </p>
        </div>

        {/* 4 Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--space-3)',
            width: '100%',
          }}
        >
          <div
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              <CheckCircle2 size={13} style={{ color: 'var(--success)' }} />
              <span>Chính xác</span>
            </div>
            <strong style={{ fontSize: 'var(--text-xl)', color: 'var(--success)' }}>
              {result.accuracy}%
            </strong>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
              ({result.correctAnswers}/{result.totalQuestions} câu)
            </span>
          </div>

          <div
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              <Clock size={13} style={{ color: 'var(--primary)' }} />
              <span>Thời gian</span>
            </div>
            <strong style={{ fontSize: 'var(--text-xl)', color: 'var(--foreground)' }}>
              {timeFormatted}
            </strong>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
              Tốc độ: ~{Math.round(result.timeSpentSeconds / result.totalQuestions)}s / câu
            </span>
          </div>

          <div
            style={{
              gridColumn: '1 / -1',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Zap size={18} style={{ color: 'var(--streak)' }} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--foreground)' }}>
              Nhận được: <strong style={{ color: 'var(--primary)' }}>+{result.xpEarned} XP</strong> vào tiến độ ngày!
            </span>
          </div>
        </div>

        {/* Weak points section */}
        {result.weakPoints.length > 0 && (
          <div
            style={{
              width: '100%',
              textAlign: 'left',
              backgroundColor: 'var(--background)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--warning)' }}>
              <AlertCircle size={15} />
              <span>ĐIỂM CẦN CỦNG CỐ THÊM:</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: 'var(--text-xs)', color: 'var(--foreground)', lineHeight: 1.6 }}>
              {result.weakPoints.map((pt, i) => (
                <li key={i}>
                  <strong>{pt.title}</strong> ({pt.count} lần cần chú ý)
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed Server-Graded Question Review */}
        {questionResults && questionResults.length > 0 && (
          <div
            style={{
              width: '100%',
              maxHeight: '280px',
              overflowY: 'auto',
              textAlign: 'left',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--foreground)' }}>
              Chi tiết đáp án & Giải thích ({result.correctAnswers}/{result.totalQuestions}):
            </div>
            {questionResults.map((qr, idx) => (
              <div
                key={qr.questionId}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: `1px solid ${qr.isCorrect ? '#BBF7D0' : '#FECACA'}`,
                  backgroundColor: qr.isCorrect ? '#F0FDF4' : '#FEF2F2',
                  fontSize: '12px',
                }}
              >
                <div style={{ fontWeight: 700, color: qr.isCorrect ? '#166534' : '#991B1B' }}>
                  {idx + 1}. {qr.isCorrect ? '✓' : '✗'} {qr.title}
                </div>
                <div style={{ color: '#334155', marginTop: '2px' }}>
                  Bạn chọn: <strong>{qr.givenAnswer || '(Bỏ trống)'}</strong>
                  {!qr.isCorrect && qr.correctAnswer && (
                    <span>
                      {' '}
                      · Đáp án đúng: <strong style={{ color: '#059669' }}>{qr.correctAnswer}</strong>
                    </span>
                  )}
                </div>
                {qr.explanation && (
                  <div style={{ color: '#475569', marginTop: '3px', fontSize: '11px' }}>
                    {qr.explanation}
                  </div>
                )}
                <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {reportedIds[qr.questionId] ? (
                    <span style={{ fontSize: '11px', color: '#B45309', fontWeight: 600 }}>
                      {reportedIds[qr.questionId]}
                    </span>
                  ) : reportingId === qr.questionId ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                      <input
                        type="text"
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        placeholder="Mô tả ngắn lỗi (sai đáp án, chính tả, thiếu ngữ cảnh...)"
                        style={{
                          flex: 1,
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                        }}
                      />
                      <button
                        type="button"
                        disabled={reportBusy}
                        onClick={() => void handleSubmitReport(qr.questionId)}
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#D97706',
                          color: '#FFFFFF',
                          cursor: 'pointer',
                        }}
                      >
                        {reportBusy ? 'Đang gửi...' : 'Gửi'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReportingId(null);
                          setReportReason('');
                        }}
                        style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          cursor: 'pointer',
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setReportingId(qr.questionId);
                          setReportReason('');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#B45309',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                        }}
                      >
                        <Flag size={11} />
                        <span>Báo lỗi câu hỏi</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', width: '100%', marginTop: 'var(--space-2)' }}>
          {/* Primary CTA */}
          <button
            type="button"
            onClick={onContinueRecommended}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px 24px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(67, 56, 202, 0.3)',
            }}
          >
            <span>LUYỆN TIẾP ĐỀ XUẤT</span>
            <ArrowRight size={16} />
          </button>

          {/* Secondary CTAs */}
          <div style={{ display: 'grid', gridTemplateColumns: result.mistakeIds.length > 0 ? '1fr 1fr' : '1fr', gap: 'var(--space-2)' }}>
            {result.mistakeIds.length > 0 && (
              <button
                type="button"
                onClick={onReviewMistakes}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={14} />
                <span>Xem lỗi sai ({result.mistakeIds.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={onBackToCenter}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Home size={14} />
              <span>Về Trung tâm luyện tập</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
