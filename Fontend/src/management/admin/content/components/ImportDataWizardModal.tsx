import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { Modal } from '../../../../design-system';
import type { HskLevel } from '../types';

export interface ImportDataWizardModalProps {
  isOpen: boolean;
  levels: HskLevel[];
  onClose: () => void;
  onSuccess: () => void;
}

type DataType = 'VOCABULARY' | 'CHARACTER' | 'GRAMMAR';

export const ImportDataWizardModal: React.FC<ImportDataWizardModalProps> = ({
  isOpen,
  levels,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<number>(1);
  const [dataType, setDataType] = useState<DataType>('VOCABULARY');
  const [selectedLevelId, setSelectedLevelId] = useState<string>(levels[0]?.id || '');
  const [fileName, setFileName] = useState<string>('hsk_standard_dataset_sample.xlsx');

  const handleReset = () => {
    setStep(1);
    onClose();
  };

  const handleFinish = () => {
    setStep(1);
    onSuccess();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="Nhập dữ liệu chuẩn HSK (Import Wizard - Demo)"
    >
      <div style={{ padding: 'var(--space-2) 0' }}>
        {/* Wizard Steps indicator */}
        <div className="lcm-wizard-steps">
          <div className={`lcm-step-item ${step >= 1 ? 'is-active' : ''}`}>
            <span className="lcm-step-badge">1</span>
            <span>Loại dữ liệu</span>
          </div>
          <div className={`lcm-step-item ${step >= 2 ? 'is-active' : ''}`}>
            <span className="lcm-step-badge">2</span>
            <span>Cấp HSK</span>
          </div>
          <div className={`lcm-step-item ${step >= 3 ? 'is-active' : ''}`}>
            <span className="lcm-step-badge">3</span>
            <span>Tải file</span>
          </div>
          <div className={`lcm-step-item ${step >= 4 ? 'is-active' : ''}`}>
            <span className="lcm-step-badge">4</span>
            <span>Kiểm tra</span>
          </div>
          <div className={`lcm-step-item ${step >= 5 ? 'is-active' : ''}`}>
            <span className="lcm-step-badge">5</span>
            <span>Trùng lặp</span>
          </div>
          <div className={`lcm-step-item ${step >= 6 ? 'is-active' : ''}`}>
            <span className="lcm-step-badge">6</span>
            <span>Xác nhận</span>
          </div>
        </div>

        {/* Notice badge */}
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
          fontSize: 'var(--text-xs)',
          color: '#1e40af',
        }}>
          💡 <strong>Giao diện mẫu (Mock Shell):</strong> Quy trình này minh họa cấu trúc nhập dữ liệu hàng loạt từ Excel / CSV chuẩn bị cho Spring Boot backend.
        </div>

        {/* Step 1: Chọn loại dữ liệu */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: 0 }}>
              Chọn danh mục dữ liệu cần nhập vào kho lưu trữ:
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer' }}>
              <input
                type="radio"
                name="dataType"
                checked={dataType === 'VOCABULARY'}
                onChange={() => setDataType('VOCABULARY')}
              />
              <div>
                <strong style={{ fontSize: 'var(--text-sm)' }}>Từ vựng chuẩn (Vocabulary)</strong>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: 0 }}>Hán tự, Pinyin, Nghĩa Việt, Nghĩa Anh, Loại từ</p>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer' }}>
              <input
                type="radio"
                name="dataType"
                checked={dataType === 'CHARACTER'}
                onChange={() => setDataType('CHARACTER')}
              />
              <div>
                <strong style={{ fontSize: 'var(--text-sm)' }}>Chữ Hán (Chinese Characters)</strong>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: 0 }}>Chữ đơn, Hán Việt, Bộ thủ, Số nét</p>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer' }}>
              <input
                type="radio"
                name="dataType"
                checked={dataType === 'GRAMMAR'}
                onChange={() => setDataType('GRAMMAR')}
              />
              <div>
                <strong style={{ fontSize: 'var(--text-sm)' }}>Điểm ngữ pháp (Grammar Points)</strong>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: 0 }}>Mã cấu trúc, Tiêu đề, Công thức, Giải thích</p>
              </div>
            </label>
          </div>
        )}

        {/* Step 2: Chọn cấp HSK */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: 0 }}>
              Chỉ định cấp độ HSK áp dụng cho dữ liệu nhập:
            </p>
            <select
              className="lcm-form-input"
              value={selectedLevelId}
              onChange={(e) => setSelectedLevelId(e.target.value)}
            >
              {levels.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.name} ({lvl.levelCode})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Step 3: Chọn file */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="lcm-upload-dropzone" onClick={() => setFileName('hsk_vocabulary_import_2026.xlsx')}>
              <UploadCloud size={36} color="var(--primary)" style={{ margin: '0 auto var(--space-2)' }} />
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, margin: '0 0 4px 0' }}>
                Kéo thả file Excel (.xlsx) hoặc CSV vào đây
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: 0 }}>
                Hỗ trợ định dạng .xlsx, .csv (tối đa 10MB)
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              <FileSpreadsheet size={16} />
              <span>Đã chọn: <strong>{fileName}</strong></span>
            </div>
          </div>
        )}

        {/* Step 4: Preview / Validation */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
              <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> 125 dòng hợp lệ
              </span>
              <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={14} /> 2 dòng lỗi định dạng (sẽ bỏ qua)
              </span>
            </div>
            <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              <table className="lcm-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Hán tự</th>
                    <th>Pinyin</th>
                    <th>Nghĩa Việt</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>高兴</td>
                    <td>gāoxìng</td>
                    <td>vui vẻ, mừng rỡ</td>
                    <td><span style={{ color: '#16a34a' }}>Hợp lệ</span></td>
                  </tr>
                  <tr>
                    <td>认识</td>
                    <td>rènshi</td>
                    <td>quen biết, nhận biết</td>
                    <td><span style={{ color: '#16a34a' }}>Hợp lệ</span></td>
                  </tr>
                  <tr>
                    <td>???</td>
                    <td>-</td>
                    <td>(Thiếu nghĩa)</td>
                    <td><span style={{ color: '#dc2626' }}>Lỗi thiếu trường</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 5: Duplicate Summary */}
        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: 0 }}>
              Phát hiện <strong>3 bản ghi đã tồn tại</strong> trong hệ thống:
            </p>
            <div style={{ padding: 'var(--space-3)', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: '#b45309' }}>
              ⚠️ Các từ: <code>喝 (hē)</code>, <code>茶 (chá)</code>, <code>咖啡 (kāfēi)</code> đã có sẵn.
              <div style={{ marginTop: 'var(--space-2)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="radio" name="dupPolicy" defaultChecked /> Ghi đè cập nhật thông tin mới
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginTop: '4px' }}>
                  <input type="radio" name="dupPolicy" /> Bỏ qua giữ nguyên dữ liệu cũ
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Confirm */}
        {step === 6 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
            <CheckCircle2 size={44} color="#16a34a" style={{ margin: '0 auto var(--space-3)' }} />
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 var(--space-2) 0' }}>
              Sẵn sàng nhập dữ liệu vào kho HSK
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: 0 }}>
              Sẽ có <strong>123 mục từ mới</strong> và <strong>3 mục cập nhật</strong> được đưa vào cấp độ HSK đã chọn.
            </p>
          </div>
        )}

        {/* Wizard Footer Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-6)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={step === 1 ? handleReset : () => setStep(step - 1)}
          >
            {step === 1 ? 'Đóng' : 'Quay lại'}
          </button>
          <button
            type="button"
            className="ds-btn ds-btn-primary ds-btn-sm"
            onClick={step === 6 ? handleFinish : () => setStep(step + 1)}
          >
            {step === 6 ? 'Hoàn tất nhập' : 'Tiếp tục'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
