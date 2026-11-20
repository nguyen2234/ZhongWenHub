import React, { useState } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import {
  questionBankService,
  type ImportQuestionsResult,
  type QuestionImportItemPayload,
} from '../services/question-bank.service';

export interface QuestionBankImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

function parseCsvRows(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const splitCsvLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };

  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] ?? '';
    });
    return obj;
  });
}

function normalizeParsedPayload(rawText: string, sourceId: string, sourceLicense: string): QuestionImportItemPayload[] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed);
    const list: any[] = Array.isArray(parsed) ? parsed : (parsed.items || parsed.questions || []);
    return list.map((item) => ({
      type: String(item.type || 'multiple-choice'),
      skill: String(item.skill || 'reading'),
      hskLevel: Number(item.hskLevel || item.hsk || 1),
      difficulty: item.difficulty ? String(item.difficulty) : 'MEDIUM',
      title: String(item.title || ''),
      instruction: String(item.instruction || 'Chọn đáp án đúng nhất.'),
      promptHanzi: item.promptHanzi ?? item.text ?? undefined,
      promptPinyin: item.promptPinyin ?? undefined,
      promptVietnamese: item.promptVietnamese ?? undefined,
      audioUrl: item.audioUrl ?? undefined,
      options: Array.isArray(item.options) ? item.options.map(String) : undefined,
      correctOptionIndex: typeof item.correctOptionIndex === 'number' ? item.correctOptionIndex : undefined,
      correctAnswer: item.correctAnswer ?? undefined,
      explanation: item.explanation ?? undefined,
      tags: item.tags ?? undefined,
      sourceId: item.sourceId || sourceId,
      sourceLicense: item.sourceLicense || sourceLicense,
    }));
  }

  const rows = parseCsvRows(trimmed);
  return rows.map((r) => {
    const opts = r.options ? r.options.split('|').map((s) => s.trim()).filter(Boolean) : undefined;
    return {
      type: r.type || 'multiple-choice',
      skill: r.skill || 'reading',
      hskLevel: Number(r.hskLevel || 1),
      difficulty: r.difficulty || 'MEDIUM',
      title: r.title || '',
      instruction: r.instruction || 'Chọn đáp án đúng nhất.',
      promptHanzi: r.promptHanzi || undefined,
      promptPinyin: r.promptPinyin || undefined,
      promptVietnamese: r.promptVietnamese || undefined,
      options: opts,
      correctOptionIndex: r.correctOptionIndex !== '' && r.correctOptionIndex !== undefined ? Number(r.correctOptionIndex) : undefined,
      correctAnswer: r.correctAnswer || undefined,
      explanation: r.explanation || undefined,
      tags: r.tags || undefined,
      sourceId: r.sourceId || sourceId,
      sourceLicense: r.sourceLicense || sourceLicense,
    };
  });
}

export const QuestionBankImportModal: React.FC<QuestionBankImportModalProps> = ({
  isOpen,
  onClose,
  onImported,
}) => {
  const [rawContent, setRawContent] = useState('');
  const [sourceId, setSourceId] = useState('cms-bulk-import');
  const [sourceLicense, setSourceLicense] = useState('INTERNAL_AUTHORED');
  const [previewResult, setPreviewResult] = useState<ImportQuestionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRawContent(String(reader.result || ''));
      setPreviewResult(null);
      setError(null);
    };
    reader.readAsText(file, 'utf-8');
  };

  const runImport = async (dryRun: boolean) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const items = normalizeParsedPayload(rawContent, sourceId, sourceLicense);
      if (items.length === 0) {
        setError('Không đọc được câu hỏi hợp lệ từ JSON hoặc CSV.');
        setIsSubmitting(false);
        return;
      }
      const res = await questionBankService.importQuestions(items, {
        defaultSourceId: sourceId,
        defaultSourceLicense: sourceLicense,
        dryRun,
      });
      setPreviewResult(res);
      if (!dryRun && res.importedCount > 0) {
        onImported();
      }
    } catch (err: any) {
      setError(err?.message || 'Lỗi xử lý dữ liệu import câu hỏi.');
    } finally {
      setIsSubmitting(false);
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
        aria-label="Import câu hỏi JSON/CSV"
        style={{
          width: '100%',
          maxWidth: '720px',
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
            <FileSpreadsheet size={18} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>
              Import Câu hỏi hàng loạt (JSON / CSV)
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
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            color: '#1E3A8A',
          }}
        >
          Mọi câu hỏi import đều đi qua bước chuẩn hóa NFKC, kiểm tra trùng lặp SHA-256 và luôn ở trạng thái{' '}
          <strong>DRAFT / PENDING_REVIEW</strong> để giảng viên kiểm duyệt trước khi xuất bản.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={{ fontSize: 'var(--text-xs)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: 600 }}>Nguồn (SourceId)</span>
            <input
              className="ds-input"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              placeholder="vd: InAnskr/HSK4Level-Test"
            />
          </label>
          <label style={{ fontSize: 'var(--text-xs)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: 600 }}>Bản quyền (License)</span>
            <input
              className="ds-input"
              value={sourceLicense}
              onChange={(e) => setSourceLicense(e.target.value)}
              placeholder="vd: INTERNAL_AUTHORED, MIT, CC-BY-NC-SA-4.0"
            />
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Dán nội dung JSON/CSV hoặc tải tệp lên:</span>
          <label className="ds-btn ds-btn-secondary" style={{ cursor: 'pointer', fontSize: '12px' }}>
            <Upload size={14} />
            <span>Chọn file .json / .csv</span>
            <input type="file" accept=".json,.csv,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>

        <textarea
          className="ds-input"
          rows={8}
          value={rawContent}
          onChange={(e) => {
            setRawContent(e.target.value);
            setPreviewResult(null);
          }}
          placeholder={`[{"type":"multiple-choice","skill":"vocabulary","hskLevel":1,"difficulty":"EASY","title":"Nghĩa của 你好","instruction":"Chọn nghĩa đúng","promptHanzi":"你好","options":["Xin chào","Tạm biệt","Cảm ơn","Xin lỗi"],"correctOptionIndex":0,"correctAnswer":"Xin chào"}]`}
          style={{ fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
        />

        {error && (
          <div style={{ color: '#DC2626', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {previewResult && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              fontSize: 'var(--text-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={15} />
              <span>
                {previewResult.dryRun ? 'Kết quả kiểm tra thử (Dry-run):' : 'Import thành công vào hàng đợi duyệt:'}
              </span>
            </div>
            <div>
              Tổng nhận: <strong>{previewResult.totalReceived}</strong> • Hợp lệ{' '}
              {previewResult.dryRun ? 'sẵn sàng nhập' : 'đã nhập'}: <strong>{previewResult.importedCount}</strong> • Bỏ
              qua trùng: <strong>{previewResult.duplicateSkippedCount}</strong> • Từ chối:{' '}
              <strong>{previewResult.rejectedCount}</strong>
            </div>
            {previewResult.rejections.slice(0, 4).map((r) => (
              <div key={r.index} style={{ color: '#B91C1C' }}>
                Dòng #{r.index + 1} ({r.title || 'Không tiêu đề'}): {r.reason}
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
            disabled={isSubmitting || !rawContent.trim()}
            onClick={() => runImport(true)}
          >
            Kiểm tra hợp lệ
          </button>
          <button
            type="button"
            className="ds-btn ds-btn-primary"
            disabled={isSubmitting || !rawContent.trim()}
            onClick={() => runImport(false)}
          >
            {isSubmitting ? 'Đang nhập...' : 'Xác nhận Import (DRAFT)'}
          </button>
        </div>
      </div>
    </div>
  );
};

