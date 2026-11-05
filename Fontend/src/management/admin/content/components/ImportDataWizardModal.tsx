import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Eye,
  RefreshCw,
  Download,
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
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [result, setResult] = useState<VocabularyImportResultDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isExcel = selectedFile?.name.toLowerCase().endsWith('.xlsx') ?? false;

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setErrorMessage(null);
    setIsProcessing(false);
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      await hskRepositoryService.downloadVocabularyExcelTemplateAsync();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể tải template Excel mẫu.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const name = file.name.toLowerCase();
      if (!name.endsWith('.xlsx') && !name.endsWith('.csv')) {
        setErrorMessage('Vui lòng chọn tệp định dạng Excel (.xlsx) hoặc CSV (.csv).');
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
      setErrorMessage('Vui lòng chọn một tệp Excel hoặc CSV để tiếp tục.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let res: VocabularyImportResultDto;
      if (selectedFile.name.toLowerCase().endsWith('.xlsx')) {
        res = await hskRepositoryService.importVocabulariesExcelAsync(selectedFile, dryRun);
      } else {
        res = await hskRepositoryService.importVocabulariesCsvAsync(selectedFile, dryRun);
      }

      setResult(res);
      if (!dryRun && res.importedCount > 0) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMessage(err?.message || 'Có lỗi xảy ra trong quá trình xử lý tệp.');
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
        {/* Banner information & Template Download */}
        <div
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            fontSize: 'var(--text-xs)',
            color: '#1e40af',
            lineHeight: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <strong>Chuẩn HSK 3.0 (Cấp 1–6):</strong> Hệ thống hỗ trợ nhập liệu từ file <strong>Excel (.xlsx)</strong> hoặc <strong>CSV (.csv)</strong>.
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={isDownloadingTemplate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isDownloadingTemplate ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
              Tải Excel mẫu (.xlsx)
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#3b82f6' }}>
            Toàn bộ từ vựng nhập mới sẽ ở trạng thái <strong>Bản nháp (DRAFT)</strong> cho đến khi Content Manager duyệt và xuất bản. Hệ thống tự động chống trùng theo SourceDataset + SourceEntryId hoặc HskLevel + Hanzi + Pinyin.
          </div>
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
            accept=".xlsx,.csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <FileSpreadsheet
            size={36}
            style={{ color: selectedFile ? (isExcel ? '#16a34a' : 'var(--primary)') : 'var(--muted)', margin: '0 auto 8px' }}
          />
          {selectedFile ? (
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                {selectedFile.name}{' '}
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: isExcel ? '#dcfce7' : '#fee2e2',
                    color: isExcel ? '#15803d' : '#b91c1c',
                    marginLeft: '6px',
                  }}
                >
                  {isExcel ? 'EXCEL XLSX' : 'CSV'}
                </span>
              </p>
              <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>
                {(selectedFile.size / 1024).toFixed(1)} KB — Nhấp để thay đổi file
              </p>
            </div>
          ) : (
            <div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                Nhấp vào đây để chọn tệp Excel (.xlsx) hoặc CSV (.csv)
              </p>
              <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>
                Định dạng hỗ trợ: .xlsx, .csv (UTF-8, dung lượng tối đa 50MB)
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
                  {result.isDryRun ? 'Từ hợp lệ (Dự kiến)' : 'Đã nhập thành công'}
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
                <div style={{ fontSize: '11px', color: result.failedCount > 0 ? '#991b1b' : 'var(--muted)' }}>Dòng lỗi</div>
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
                  Xem trước dữ liệu ({result.previewSample.length} dòng đầu tiên):
                </div>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--background)', position: 'sticky', top: 0 }}>
                      <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '6px 8px' }}>Cấp HSK</th>
                        <th style={{ padding: '6px 8px' }}>Hán tự</th>
                        <th style={{ padding: '6px 8px' }}>Pinyin</th>
                        <th style={{ padding: '6px 8px' }}>Nghĩa tiếng Việt</th>
                        <th style={{ padding: '6px 8px' }}>Từ loại</th>
                        <th style={{ padding: '6px 8px' }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.previewSample.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '6px 8px' }}>HSK {item.levelLabel || item.hskLevel}</td>
                          <td style={{ padding: '6px 8px', fontWeight: 700 }}>{item.hanzi}</td>
                          <td style={{ padding: '6px 8px' }}>{item.pinyin}</td>
                          <td style={{ padding: '6px 8px', color: item.meaningVi ? 'inherit' : 'var(--muted)' }}>
                            {item.meaningVi || '(Chưa có nghĩa)'}
                          </td>
                          <td style={{ padding: '6px 8px', color: 'var(--muted)' }}>{item.partOfSpeech || '-'}</td>
                          <td style={{ padding: '6px 8px' }}>
                            {item.isExisting ? (
                              <span style={{ color: '#d97706', fontSize: '11px', fontWeight: 600, backgroundColor: '#fef3c7', padding: '1px 6px', borderRadius: '4px' }}>
                                Trùng lặp
                              </span>
                            ) : (
                              <span style={{ color: '#059669', fontSize: '11px', fontWeight: 600, backgroundColor: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>
                                DRAFT mới
                              </span>
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
                  Đã nhập hoàn tất {result.importedCount} từ vựng mới vào SQL Server ở trạng thái DRAFT (bỏ qua {result.skippedCount} từ trùng lặp).
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
            Xem trước (Preview / Dry Run)
          </button>

          <button
            type="button"
            className="ds-btn ds-btn-primary ds-btn-sm"
            onClick={() => handleRun(false)}
            disabled={!selectedFile || isProcessing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <UploadCloud size={14} />}
            Xác nhận nhập vào SQL Server
          </button>
        </div>
      </div>
    </Modal>
  );
};
export default ImportDataWizardModal;
