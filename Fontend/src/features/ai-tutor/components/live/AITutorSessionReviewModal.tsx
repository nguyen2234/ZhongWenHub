import React from 'react';
import {
  Award,
  BookOpen,
  Clock,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { Button, Modal } from '../../../../design-system';
import type { VoiceSessionReviewData } from '../../services/voice/voice.types';

export interface AITutorSessionReviewModalProps {
  isOpen: boolean;
  reviewData: VoiceSessionReviewData | null;
  onRestart: () => void;
  onSwitchToChat: () => void;
  onClose: () => void;
}

export const AITutorSessionReviewModal: React.FC<AITutorSessionReviewModalProps> = ({
  isOpen,
  reviewData,
  onRestart,
  onSwitchToChat,
  onClose,
}) => {
  if (!reviewData) return null;

  const durationMin = Math.max(1, Math.round(reviewData.durationSeconds / 60));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tổng kết phiên Luyện nói AI (Voice Session Review)"
      actions={
        <div style={{ display: 'flex', gap: 'var(--space-2)', width: '100%', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button variant="secondary" icon={<RotateCcw size={15} />} onClick={onRestart}>
            Luyện tập lại
          </Button>
          <Button variant="secondary" icon={<MessageSquare size={15} />} onClick={onSwitchToChat}>
            Chuyển sang Chat AI
          </Button>
          <Button variant="primary" icon={<ArrowRight size={15} />} onClick={onClose}>
            Hoàn tất & Về Dashboard
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-1) 0' }}>
        
        {/* Banner tóm tắt kết quả */}
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--primary-light)',
            border: '1px solid var(--border-focus)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)' }}>
              CHỦ ĐỀ: {reviewData.topic}
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: '#ffffff',
                color: 'var(--primary)',
                fontWeight: 600,
              }}
            >
              Cấp độ HSK {reviewData.hskLevel}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--foreground)', lineHeight: 1.5 }}>
            {reviewData.feedbackSummary}
          </p>
        </div>

        {/* 4 Thẻ chỉ số chính */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-2)' }}>
          <div
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>
              <Clock size={13} />
              <span>Thời gian</span>
            </div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--foreground)', marginTop: '4px' }}>
              {durationMin} phút
            </div>
            <div style={{ fontSize: '10px', color: 'var(--muted)' }}>
              {reviewData.durationSeconds} giây phản xạ
            </div>
          </div>

          <div
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>
              <MessageSquare size={13} />
              <span>Lượt đối thoại</span>
            </div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--foreground)', marginTop: '4px' }}>
              {reviewData.turnCount} câu
            </div>
            <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Hai chiều người & AI</div>
          </div>

          <div
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--streak)', fontSize: 'var(--text-xs)' }}>
              <Zap size={13} />
              <span>Cắt lời (Barge-in)</span>
            </div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--streak)', marginTop: '4px' }}>
              {reviewData.interruptionCount} lần
            </div>
            <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Chủ động ngắt câu tự nhiên</div>
          </div>

          <div
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--xp)', fontSize: 'var(--text-xs)' }}>
              <Award size={13} />
              <span>Điểm thử nghiệm</span>
            </div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--xp)', marginTop: '4px' }}>
              {reviewData.demoPronunciationScore}/100
            </div>
            <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Mẫu đánh giá Demo</div>
          </div>
        </div>

        {/* Demo Disclaimer Alert */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--warning-bg)',
            border: '1px solid var(--warning-border)',
            fontSize: 'var(--text-xs)',
            color: 'var(--warning)',
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>
            <strong>Lưu ý:</strong> Điểm số và nhận xét phát âm ở trên là <strong>dữ liệu mô phỏng (Demo)</strong>. Nền tảng chưa tính điểm này vào chứng chỉ học tập chính thức cho tới khi tích hợp AI pipeline ở giai đoạn sau.
          </span>
        </div>

        {/* Danh sách Từ vựng đã dùng */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--foreground)' }}>
            <BookOpen size={14} style={{ color: 'var(--primary)' }} />
            <span>TỪ VỰNG TIẾNG TRUNG ĐÃ THỰC HÀNH TRONG PHIÊN:</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-2)' }}>
            {reviewData.vocabularyPracticed.map((v, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border-strong)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-base)', fontWeight: 700 }}>
                    {v.hanzi}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 500 }}>
                    {v.pinyin}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  {v.vietnamese}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Điểm Ngữ pháp ghi nhận */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--foreground)' }}>
            <Sparkles size={14} style={{ color: 'var(--ai)' }} />
            <span>ĐIỂM NGỮ PHÁP ĐÃ RÈN LUYỆN:</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {reviewData.grammarPointsObserved.map((g, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--foreground)',
                }}
              >
                <CheckCircle2 size={13} style={{ color: 'var(--success)' }} />
                <span>{g}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gợi ý bước học tiếp theo */}
        <div
          style={{
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--surface)',
            border: '1px dashed var(--border-strong)',
            fontSize: 'var(--text-xs)',
          }}
        >
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Đề xuất bài học tiếp theo: </span>
          <span style={{ color: 'var(--muted)' }}>{reviewData.suggestedNextPractice}</span>
        </div>

      </div>
    </Modal>
  );
};
