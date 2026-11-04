import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '../../../../design-system';
import { hskRepositoryService } from '../services/hsk-repository.service';
import type { HskLevel, VocabularyImportResultDto } from '../types';

export interface ImportDataWizardModalProps {
  isOpen: boolean;
  levels: HskLevel[];
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportDataWizardModal: React.FC<ImportDataWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<VocabularyImportResultDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setErrorMessage(null);
    setIsProcessing(false);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setErrorMessage('Vui lòng chọn tệp định dạng .csv');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
      setResult(null);
    }
  };

  const handleRun = async (dryRun: boolean) => {
    if (!selectedFile) {
      setErrorMessage('Vui lòng chọn một tệp CSV để tiếp tục.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await hskRepositoryService.importVocabulariesCsvAsync(selectedFile, dryRun);
      setResult(res);
      if (!dryRun && res.importedCount > 0) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMessage(err?.message || 'Có lỗi xảy ra trong quá trình xử lý tệp CSV.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="Nhập dữ liệu từ vựng HSK 3.0 (Cấp 1–6)"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-2) 0' }}>
        {/* Banner information */}
        <div
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            fontSize: 'var(--text-xs)',
            color: '#1e40af',
            lineHeight: 1.5,
          }}
        >
          <strong>Chuẩn HSK 3.0 (Cấp 1–6):</strong> Hỗ trợ các cột CSV chuẩn:
          <code style={{ marginLeft: 4, background: '#dbeafe', padding: '1px 4px', borderRadius: 3 }}>
            id, level, hanzi, pinyin, part_of_speech, entry, homograph, level_label, source_pdf_page
          </code>
          <br />
          Từ vựng nhập mới sẽ ở trạng thái <strong>Bản nháp (DRAFT)</strong> cho đến khi được biên tập nghĩa tiếng Việt và xuất bản. Hệ thống tự động chống nhập trùng dựa trên bộ định danh mã nguồn (SourceDataset + SourceEntryId) và tổ hợp (Cấp độ, Hán tự, Pinyin, Đồng âm).
        </div>

        {/* File Dropzone / Picker */}
        <div
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
            textAlign: 'center',
            backgroundColor: 'var(--background)',
            cursor: 'pointer',
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <FileSpreadsheet
            size={36}
            style={{ color: selectedFile ? 'var(--primary)' : 'var(--muted)', margin: '0 auto 8px' }}
          />
          {selectedFile ? (
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--text-sm)' }}>{selectedFile.name}</p>
              <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>
                {(selectedFile.size / 1024).toFixed(1)} KB — Nhấp để thay đổi file
              </p>
            </div>
          ) : (
            <div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                Nhấp vào đây để chọn tệp CSV (hsk-1.csv, ...)
              </p>
              <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>
                Định dạng hỗ trợ: .csv UTF-8
              </p>
            </div>
          )}
        </div>

        {/* Error alert */}
        {errorMessage && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Results summary & Preview */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ background: 'var(--background)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Tổng số dòng</div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{result.totalRows}</div>
              </div>
              <div style={{ background: '#ecfdf5', padding: '10px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '11px', color: '#065f46' }}>
                  {result.isDryRun ? 'Từ mới dự kiến' : 'Đã nhập thành công'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>
                  {result.importedCount}
                </div>
              </div>
              <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '11px', color: '#92400e' }}>Bỏ qua (Trùng lặp)</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#d97706' }}>
                  {result.skippedCount}
                </div>
              </div>
              <div style={{ background: result.failedCount > 0 ? '#fee2e2' : 'var(--background)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: result.failedCount > 0 ? '#991b1b' : 'var(--muted)' }}>Lỗi</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: result.failedCount > 0 ? '#dc2626' : 'inherit' }}>
                  {result.failedCount}
                </div>
              </div>
            </div>

            {/* If errors occurred */}
            {result.errors.length > 0 && (
              <div style={{ maxHeight: '120px', overflowY: 'auto', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '6px', padding: '8px 12px', fontSize: '12px' }}>
                <strong style={{ color: '#9f1239' }}>Chi tiết dòng lỗi ({result.errors.length}):</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: '18px', color: '#be123c' }}>
                  {result.errors.slice(0, 10).map((err, idx) => (
                    <li key={idx}>
                      Dòng {err.rowNumber}: {err.errorMessage} {err.hanzi ? `(${err.hanzi})` : ''}
                    </li>
                  ))}
                  {result.errors.length > 10 && <li>...và {result.errors.length - 10} lỗi khác</li>}
                </ul>
              </div>
            )}

            {/* Preview sample table */}
            {result.previewSample.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
                  Mẫu xem trước ({result.previewSample.length} từ đầu tiên):
                </div>
                <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--background)', position: 'sticky', top: 0 }}>
                      <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '6px 8px' }}>Cấp HSK</th>
                        <th style={{ padding: '6px 8px' }}>Hán tự</th>
                        <th style={{ padding: '6px 8px' }}>Pinyin</th>
                        <th style={{ padding: '6px 8px' }}>Đồng âm</th>
                        <th style={{ padding: '6px 8px' }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.previewSample.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '6px 8px' }}>HSK {item.levelLabel || item.level}</td>
                          <td style={{ padding: '6px 8px', fontWeight: 700 }}>{item.hanzi}</td>
                          <td style={{ padding: '6px 8px' }}>{item.pinyin}</td>
                          <td style={{ padding: '6px 8px', color: 'var(--muted)' }}>{item.homograph || '-'}</td>
                          <td style={{ padding: '6px 8px' }}>
                            {item.isExisting ? (
                              <span style={{ color: '#d97706', fontSize: '11px', fontWeight: 500 }}>Đã tồn tại</span>
                            ) : (
                              <span style={{ color: '#059669', fontSize: '11px', fontWeight: 500 }}>Mới (DRAFT)</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Success banner after actual import */}
            {!result.isDryRun && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={16} />
                <span>
                  Đã nhập hoàn tất {result.importedCount} từ vựng mới vào kho lưu trữ (bỏ qua {result.skippedCount} từ trùng lặp).
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={handleReset}
            disabled={isProcessing}
          >
            Đóng
          </button>

          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={() => handleRun(true)}
            disabled={!selectedFile || isProcessing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Eye size={14} />}
            Kiểm tra trước (Dry Run)
          </button>

          <button
            type="button"
            className="ds-btn ds-btn-primary ds-btn-sm"
            onClick={() => handleRun(false)}
            disabled={!selectedFile || isProcessing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <UploadCloud size={14} />}
            Tiến hành nhập dữ liệu
          </button>
        </div>
      </div>
    </Modal>
  );
};
