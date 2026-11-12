import React, { useState } from 'react';
import { Sparkles, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { questionBankService, type GenerateQuestionsResult } from '../services/question-bank.service';

export interface QuestionBankGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: () => void;
}

export const QuestionBankGenerateModal: React.FC<QuestionBankGenerateModalProps> = ({
  isOpen,
  onClose,
  onGenerated,
}) => {
  const [hskLevel, setHskLevel] = useState(1);
  const [skill, setSkill] = useState('vocabulary');
  const [type, setType] = useState('multiple-choice');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [count, setCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateQuestionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const runGenerate = async (dryRun: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await questionBankService.generateQuestions({
        hskLevel,
        skill,
        type,
        difficulty,
        count,
        dryRun,
      });
      setResult(res);
      if (!dryRun && res.generatedCount > 0) {
        onGenerated();
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể sinh câu hỏi lúc này.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        role="dialog"
        aria-label="Sinh câu hỏi HSK tự động"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>
              Sinh câu hỏi HSK 1–4 chuẩn hóa (Vào hàng đợi duyệt)
            </h3>
          </div>
          <button type="button" className="ds-btn ds-btn-ghost" onClick={onClose} style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            fontSize: 'var(--text-xs)',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            color: '#92400E',
          }}
        >
          Quy tắc kiểm duyệt: Câu hỏi được sinh tự động từ kho Từ vựng & Ngữ pháp chuẩn HSK 1–4 luôn ở trạng thái{' '}
          <strong>DRAFT / PENDING_REVIEW</strong>, tuyệt đối không tự xuất bản lên giao diện học viên.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          <label style={{ fontSize: 'var(--text-xs)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: 600 }}>Cấp độ HSK</span>
            <select className="ds-input" value={hskLevel} onChange={(e) => setHskLevel(Number(e.target.value))}>
              {[1, 2, 3, 4].map((lvl) => (
                <option key={lvl} value={lvl}>
                  HSK {lvl}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: 'var(--text-xs)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: 600 }}>Kỹ năng</span>
            <select className="ds-input" value={skill} onChange={(e) => setSkill(e.target.value)}>
              <option value="vocabulary">Từ vựng</option>
              <option value="grammar">Ngữ pháp</option>
              <option value="reading">Đọc hiểu</option>
              <option value="sentence">Ghép câu</option>
            </select>
          </label>

          <label style={{ fontSize: 'var(--text-xs)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: 600 }}>Dạng câu hỏi</span>
            <select className="ds-input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="multiple-choice">Trắc nghiệm (Trung → Việt)</option>
              <option value="vietnamese-to-chinese">Chọn chữ Hán (Việt → Trung)</option>
              <option value="fill-blank">Điền chữ Hán</option>
              <option value="sentence-order">Sắp xếp câu</option>
            </select>
          </label>

          <label style={{ fontSize: 'var(--text-xs)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: 600 }}>Độ khó</span>
            <select className="ds-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="EASY">Dễ (EASY)</option>
              <option value="MEDIUM">Trung bình (MEDIUM)</option>
              <option value="HARD">Khó (HARD)</option>
            </select>
          </label>

          <label style={{ fontSize: 'var(--text-xs)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: 600 }}>Số lượng (tối đa 30)</span>
            <input
              type="number"
              min={1}
              max={30}
              className="ds-input"
              value={count}
              onChange={(e) => setCount(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
            />
          </label>
        </div>

        {error && (
          <div style={{ color: '#DC2626', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                fontSize: 'var(--text-xs)',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={15} />
              <span>
                {result.dryRun ? 'Xem trước:' : 'Đã lưu vào hàng đợi duyệt:'}{' '}
                <strong>{result.generatedCount}</strong> câu hợp lệ (trùng bỏ qua:{' '}
                <strong>{result.duplicateSkippedCount}</strong>).
              </span>
            </div>

            {result.previewItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '8px 10px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                }}
              >
                <div style={{ fontWeight: 700 }}>{item.title}</div>
                <div style={{ color: 'var(--muted)' }}>
                  Đề: {item.promptHanzi} · Đáp án: <strong>{item.correctSentence}</strong> · Điểm chất lượng:{' '}
                  {item.qualityScore ?? '-'}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" className="ds-btn ds-btn-ghost" onClick={onClose}>
            Đóng
          </button>
          <button
            type="button"
            className="ds-btn ds-btn-secondary"
            disabled={isLoading}
            onClick={() => runGenerate(true)}
          >
            Xem trước
          </button>
          <button
            type="button"
            className="ds-btn ds-btn-primary"
            disabled={isLoading}
            onClick={() => runGenerate(false)}
          >
            {isLoading ? 'Đang sinh...' : 'Sinh & Lưu DRAFT'}
          </button>
        </div>
      </div>
    </div>
  );
};

