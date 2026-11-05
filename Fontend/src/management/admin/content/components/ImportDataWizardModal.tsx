import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Eye,
  RefreshCw,
  Download,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { Modal } from '../../../../design-system';
import { hskRepositoryService } from '../services/hsk-repository.service';
import type { VocabularyImportResultDto } from '../types/vocabulary.types';
import type { HskLevel } from '../types/hsk-standard.types';

export type WizardState =
  | 'SELECT_FILE'
  | 'PREVIEW_LOADING'
  | 'PREVIEW_READY'
  | 'IMPORT_LOADING'
  | 'IMPORT_SUCCESS'
  | 'IMPORT_ERROR';

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
  const [wizardState, setWizardState] = useState<WizardState>('SELECT_FILE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewResult, setPreviewResult] = useState<VocabularyImportResultDto | null>(null);
  const [importResult, setImportResult] = useState<VocabularyImportResultDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [lastAction, setLastAction] = useState<'PREVIEW' | 'IMPORT' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isExcel = selectedFile?.name.toLowerCase().endsWith('.xlsx') ?? false;

  const handleFullReset = () => {
    setWizardState('SELECT_FILE');
    setSelectedFile(null);
    setPreviewResult(null);
    setImportResult(null);
    setErrorMessage(null);
    setLastAction(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleResetToFileSelect = () => {
    setWizardState('SELECT_FILE');
    setSelectedFile(null);
    setPreviewResult(null);
    setImportResult(null);
    setErrorMessage(null);
    setLastAction(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        setErrorMessage('Định dạng tệp không hợp lệ. Vui lòng chọn tệp Excel (.xlsx) hoặc CSV (.csv).');
        setSelectedFile(null);
        setPreviewResult(null);
        setWizardState('SELECT_FILE');
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
      setPreviewResult(null);
      setImportResult(null);
      setWizardState('SELECT_FILE');
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) {
      setErrorMessage('Vui lòng chọn một tệp Excel hoặc CSV để tiếp tục.');
      return;
    }

    setWizardState('PREVIEW_LOADING');
    setErrorMessage(null);
    setLastAction('PREVIEW');

    try {
      let res: VocabularyImportResultDto;
      if (selectedFile.name.toLowerCase().endsWith('.xlsx')) {
        res = await hskRepositoryService.importVocabulariesExcelAsync(selectedFile, true);
      } else {
        res = await hskRepositoryService.importVocabulariesCsvAsync(selectedFile, true);
      }

      setPreviewResult(res);
      setWizardState('PREVIEW_READY');
    } catch (err: any) {
      console.error('Preview error:', err);
      setErrorMessage(err?.message || 'Có lỗi xảy ra trong quá trình đọc và phân tích tệp.');
      setWizardState('IMPORT_ERROR');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setErrorMessage('Vui lòng chọn một tệp Excel hoặc CSV để nhập.');
      return;
    }
    if (!previewResult) {
      setErrorMessage('Vui lòng xem trước dữ liệu (Preview) trước khi xác nhận nhập vào hệ thống.');
      return;
    }
    if (previewResult.importedCount <= 0) {
      setErrorMessage('Không có dòng từ vựng hợp lệ nào để nhập.');
      return;
    }

    setWizardState('IMPORT_LOADING');
    setErrorMessage(null);
    setLastAction('IMPORT');

    try {
      let res: VocabularyImportResultDto;
      if (selectedFile.name.toLowerCase().endsWith('.xlsx')) {
        res = await hskRepositoryService.importVocabulariesExcelAsync(selectedFile, false);
      } else {
        res = await hskRepositoryService.importVocabulariesCsvAsync(selectedFile, false);
      }

      setImportResult(res);
      setWizardState('IMPORT_SUCCESS');
      // Thông báo cho component cha reload dữ liệu
      onSuccess();
    } catch (err: any) {
      console.error('Import commit error:', err);
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi lưu dữ liệu từ vựng vào SQL Server.');
      setWizardState('IMPORT_ERROR');
    }
  };

  const handleRetry = () => {
    if (lastAction === 'IMPORT') {
      handleImport();
    } else {
      handlePreview();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleFullReset}
      title="Nhập dữ liệu từ vựng HSK 3.0 (Cấp 1–6)"
      maxWidth="min(880px, 95vw)"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          maxHeight: 'calc(85vh - 120px)',
          overflowY: 'auto',
          paddingRight: '2px',
        }}
      >
        {/* Banner hướng dẫn & Nút tải template */}
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div>
              <strong>Chuẩn HSK 3.0 (Cấp 1–6):</strong> Hỗ trợ nhập liệu từ file{' '}
              <strong>Excel (.xlsx)</strong> hoặc <strong>CSV (.csv)</strong>.
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={isDownloadingTemplate || wizardState === 'PREVIEW_LOADING' || wizardState === 'IMPORT_LOADING'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isDownloadingTemplate ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              Tải Excel mẫu (.xlsx)
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#3b82f6' }}>
            Hệ thống tự động chống trùng lặp theo{' '}
            <code>SourceDataset + SourceEntryId</code> hoặc cặp{' '}
            <code>HskLevel + Hanzi + Pinyin</code>. Toàn bộ từ mới được nhập ở trạng thái{' '}
            <strong>Bản nháp (DRAFT)</strong>.
          </div>
        </div>

        {/* =========================================================================
            STATE: SELECT_FILE
           ========================================================================= */}
        {wizardState === 'SELECT_FILE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* File dropzone */}
            <div
              style={{
                border: selectedFile ? '2px solid #3b82f6' : '2px dashed var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                textAlign: 'center',
                backgroundColor: selectedFile ? '#f0f9ff' : 'var(--background)',
                cursor: 'pointer',
                transition: 'border-color 0.2s, background-color 0.2s',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv"
                style={{ display: 'none' }}
                onClick={(e) => {
                  (e.target as HTMLInputElement).value = '';
                }}
                onChange={handleFileChange}
              />
              <FileSpreadsheet
                size={40}
                style={{
                  color: selectedFile ? (isExcel ? '#16a34a' : '#2563eb') : 'var(--muted)',
                  margin: '0 auto 10px',
                }}
              />
              {selectedFile ? (
                <div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    <span>{selectedFile.name}</span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: isExcel ? '#dcfce7' : '#e0e7ff',
                        color: isExcel ? '#15803d' : '#3730a3',
                      }}
                    >
                      {isExcel ? 'EXCEL XLSX' : 'CSV'}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB — Nhấp vào đây nếu muốn đổi tệp khác
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                    Nhấp vào đây để chọn tệp Excel (.xlsx) hoặc CSV (.csv)
                  </p>
                  <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>
                    Hỗ trợ định dạng .xlsx hoặc .csv Unicode UTF-8 (dung lượng tối đa 50MB)
                  </p>
                </div>
              )}
            </div>

            {errorMessage && (
              <div
                style={{
                  background: '#fee2e2',
                  border: '1px solid #fca5a5',
                  color: '#991b1b',
                  padding: '10px 14px',
                  borderRadius: '6px',
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
          </div>
        )}

        {/* =========================================================================
            STATE: PREVIEW_LOADING
           ========================================================================= */}
        {wizardState === 'PREVIEW_LOADING' && (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <RefreshCw size={32} className="animate-spin" style={{ color: '#2563eb' }} />
            <div style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>
              Đang phân tích cấu trúc tệp dữ liệu...
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Hệ thống đang kiểm tra định dạng cột, xác thực HSK 1–6 và đối chiếu trùng lặp với SQL Server.
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE: PREVIEW_READY
           ========================================================================= */}
        {wizardState === 'PREVIEW_READY' && previewResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Header info bar with file name & re-select button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--background)',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} style={{ color: isExcel ? '#16a34a' : '#2563eb' }} />
                <strong>{selectedFile?.name}</strong>
                <span style={{ color: 'var(--muted)' }}>
                  ({((selectedFile?.size || 0) / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetToFileSelect}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
              >
                Chọn tệp khác
              </button>
            </div>

            {/* Summary statistics grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  background: 'var(--background)',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Tổng số dòng</div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{previewResult.totalRows}</div>
              </div>

              <div
                style={{
                  background: '#ecfdf5',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #a7f3d0',
                }}
              >
                <div style={{ fontSize: '11px', color: '#065f46' }}>Từ hợp lệ (Mới)</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>
                  {previewResult.importedCount}
                </div>
              </div>

              <div
                style={{
                  background: '#fef3c7',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #fde68a',
                }}
              >
                <div style={{ fontSize: '11px', color: '#92400e' }}>Bỏ qua (Trùng lặp)</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#d97706' }}>
                  {previewResult.skippedCount}
                </div>
              </div>

              <div
                style={{
                  background: previewResult.failedCount > 0 ? '#fee2e2' : 'var(--background)',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    color: previewResult.failedCount > 0 ? '#991b1b' : 'var(--muted)',
                  }}
                >
                  Dòng lỗi định dạng
                </div>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: previewResult.failedCount > 0 ? '#dc2626' : 'inherit',
                  }}
                >
                  {previewResult.failedCount}
                </div>
              </div>
            </div>

            {/* Policy note */}
            <div
              style={{
                fontSize: '12px',
                color: previewResult.importedCount > 0 ? '#15803d' : '#b45309',
                backgroundColor: previewResult.importedCount > 0 ? '#f0fdf4' : '#fffbeb',
                border: `1px solid ${previewResult.importedCount > 0 ? '#bbf7d0' : '#fde68a'}`,
                padding: '8px 12px',
                borderRadius: '6px',
              }}
            >
              {previewResult.importedCount > 0 ? (
                <>
                  ✓ <strong>Sẵn sàng nhập:</strong> Hệ thống sẽ lưu{' '}
                  <strong>{previewResult.importedCount}</strong> từ mới vào SQL Server ở trạng thái{' '}
                  <strong>DRAFT</strong>. Các dòng trùng lặp ({previewResult.skippedCount}) và dòng lỗi (
                  {previewResult.failedCount}) sẽ tự động bỏ qua.
                </>
              ) : (
                <>
                  ⚠ <strong>Không thể nhập:</strong> Tệp không chứa từ vựng hợp lệ mới nào để lưu vào
                  cơ sở dữ liệu.
                </>
              )}
            </div>

            {/* Error list details */}
            {previewResult.errors.length > 0 && (
              <div
                style={{
                  maxHeight: '130px',
                  overflowY: 'auto',
                  background: '#fff1f2',
                  border: '1px solid #fecdd3',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '12px',
                }}
              >
                <strong style={{ color: '#9f1239' }}>
                  Chi tiết các dòng bị lỗi ({previewResult.errors.length}):
                </strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: '18px', color: '#be123c' }}>
                  {previewResult.errors.slice(0, 15).map((err, idx) => (
                    <li key={idx}>
                      Dòng {err.rowNumber}: {err.errorMessage} {err.hanzi ? `(${err.hanzi})` : ''}
                    </li>
                  ))}
                  {previewResult.errors.length > 15 && (
                    <li>...và {previewResult.errors.length - 15} dòng lỗi khác.</li>
                  )}
                </ul>
              </div>
            )}

            {/* Preview table */}
            {previewResult.previewSample.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--muted)',
                    marginBottom: '6px',
                  }}
                >
                  Xem trước dữ liệu ({previewResult.previewSample.length} dòng mẫu):
                </div>
                <div
                  style={{
                    maxHeight: '220px',
                    overflowY: 'auto',
                    overflowX: 'auto',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                >
                  <table
                    style={{
                      width: '100%',
                      minWidth: '600px',
                      fontSize: '12px',
                      borderCollapse: 'collapse',
                    }}
                  >
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
                      {previewResult.previewSample.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '6px 8px' }}>HSK {item.levelLabel || item.hskLevel}</td>
                          <td style={{ padding: '6px 8px', fontWeight: 700 }}>{item.hanzi}</td>
                          <td style={{ padding: '6px 8px' }}>{item.pinyin}</td>
                          <td
                            style={{
                              padding: '6px 8px',
                              color: item.meaningVi ? 'inherit' : 'var(--muted)',
                            }}
                          >
                            {item.meaningVi || '(Chưa có nghĩa)'}
                          </td>
                          <td style={{ padding: '6px 8px', color: 'var(--muted)' }}>
                            {item.partOfSpeech || '-'}
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            {item.isExisting ? (
                              <span
                                style={{
                                  color: '#d97706',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  backgroundColor: '#fef3c7',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                Trùng lặp
                              </span>
                            ) : (
                              <span
                                style={{
                                  color: '#059669',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  backgroundColor: '#ecfdf5',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                }}
                              >
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
          </div>
        )}

        {/* =========================================================================
            STATE: IMPORT_LOADING
           ========================================================================= */}
        {wizardState === 'IMPORT_LOADING' && (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <RefreshCw size={32} className="animate-spin" style={{ color: '#16a34a' }} />
            <div style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>
              Đang lưu dữ liệu vào cơ sở dữ liệu SQL Server...
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Vui lòng không đóng trình duyệt. Hệ thống đang thực hiện giao dịch lưu từ vựng DRAFT.
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE: IMPORT_SUCCESS
           ========================================================================= */}
        {wizardState === 'IMPORT_SUCCESS' && importResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={40} style={{ color: '#16a34a' }} />
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#15803d' }}>
                Nhập dữ liệu thành công vào SQL Server!
              </div>
              <div style={{ fontSize: '13px', color: '#166534' }}>
                Đã thêm mới bền vững <strong>{importResult.importedCount}</strong> từ vựng ở trạng thái{' '}
                <strong>Bản nháp (DRAFT)</strong> vào cơ sở dữ liệu <code>ZhongWenHub_Dev</code>.
              </div>
            </div>

            {/* Final counts report */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  background: '#ecfdf5',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #a7f3d0',
                }}
              >
                <div style={{ fontSize: '11px', color: '#065f46' }}>Từ mới đã lưu (DRAFT)</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#059669' }}>
                  {importResult.importedCount}
                </div>
              </div>

              <div
                style={{
                  background: '#fef3c7',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #fde68a',
                }}
              >
                <div style={{ fontSize: '11px', color: '#92400e' }}>Bỏ qua (Trùng lặp)</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#d97706' }}>
                  {importResult.skippedCount}
                </div>
              </div>

              <div
                style={{
                  background: importResult.failedCount > 0 ? '#fee2e2' : 'var(--background)',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    color: importResult.failedCount > 0 ? '#991b1b' : 'var(--muted)',
                  }}
                >
                  Dòng lỗi bỏ qua
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: importResult.failedCount > 0 ? '#dc2626' : 'inherit',
                  }}
                >
                  {importResult.failedCount}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>
              Danh sách từ vựng trên giao diện đã được tự động cập nhật. Bạn có thể đóng cửa sổ này hoặc tiếp tục nhập thêm tệp khác.
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE: IMPORT_ERROR
           ========================================================================= */}
        {wizardState === 'IMPORT_ERROR' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <AlertTriangle size={24} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: '4px' }}>
                  Không thể hoàn tất thao tác
                </div>
                <div style={{ fontSize: '13px', color: '#b91c1c', lineHeight: 1.5 }}>
                  {errorMessage || 'Đã xảy ra lỗi không xác định. Vui lòng kiểm tra lại định dạng tệp.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STICKY FOOTER ACTIONS (DỰA TRÊN TỪNG TRẠNG THÁI)
           ========================================================================= */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            marginTop: '8px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
            flexWrap: 'wrap',
          }}
        >
          {/* Trạng thái 1: SELECT_FILE */}
          {wizardState === 'SELECT_FILE' && (
            <>
              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                onClick={handleFullReset}
              >
                Đóng
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                onClick={handlePreview}
                disabled={!selectedFile}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Eye size={14} />
                Xem trước dữ liệu (Preview)
              </button>
            </>
          )}

          {/* Trạng thái 2: PREVIEW_LOADING */}
          {wizardState === 'PREVIEW_LOADING' && (
            <button type="button" className="ds-btn ds-btn-outline ds-btn-sm" disabled>
              Đang phân tích...
            </button>
          )}

          {/* Trạng thái 3: PREVIEW_READY */}
          {wizardState === 'PREVIEW_READY' && (
            <>
              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                onClick={handleResetToFileSelect}
              >
                Chọn tệp khác
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                onClick={handleFullReset}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                onClick={handleImport}
                disabled={!previewResult || previewResult.importedCount <= 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor:
                    previewResult && previewResult.importedCount > 0 ? '#16a34a' : undefined,
                  borderColor:
                    previewResult && previewResult.importedCount > 0 ? '#16a34a' : undefined,
                }}
              >
                <UploadCloud size={14} />
                {previewResult && previewResult.importedCount > 0
                  ? `Xác nhận nhập vào SQL Server (${previewResult.importedCount} từ)`
                  : 'Không có từ hợp lệ để nhập'}
              </button>
            </>
          )}

          {/* Trạng thái 4: IMPORT_LOADING */}
          {wizardState === 'IMPORT_LOADING' && (
            <button type="button" className="ds-btn ds-btn-outline ds-btn-sm" disabled>
              Đang ghi vào SQL Server...
            </button>
          )}

          {/* Trạng thái 5: IMPORT_SUCCESS */}
          {wizardState === 'IMPORT_SUCCESS' && (
            <>
              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                onClick={handleResetToFileSelect}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCcw size={14} />
                Nhập thêm tệp khác
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                onClick={handleFullReset}
              >
                Đóng và xem danh sách
              </button>
            </>
          )}

          {/* Trạng thái 6: IMPORT_ERROR */}
          {wizardState === 'IMPORT_ERROR' && (
            <>
              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                onClick={handleFullReset}
              >
                Đóng
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                onClick={handleResetToFileSelect}
              >
                Chọn tệp khác
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                onClick={handleRetry}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} />
                Thử lại
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ImportDataWizardModal;
