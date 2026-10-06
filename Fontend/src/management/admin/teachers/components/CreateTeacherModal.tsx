import React, { useState } from 'react';
import { Info, UserPlus } from 'lucide-react';
import { Modal } from '../../../../design-system';
import type {
  CreateTeacherDTO,
  TeacherSpecialization,
  TeacherTeachingStatus,
  TeachingLevel,
} from '../types/teacher.types';
import { SPECIALIZATION_META } from '../types/teacher.types';
import { adminTeacherService } from '../services/teacher.service';

export interface CreateTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateTeacherDTO) => void;
}

const ALL_LEVELS: TeachingLevel[] = [
  'HSK 1',
  'HSK 2',
  'HSK 3',
  'HSK 4',
  'HSK 5',
  'HSK 6',
  'HSK 7–9',
];

const ALL_SPECIALIZATIONS: TeacherSpecialization[] = [
  'GRAMMAR',
  'VOCABULARY',
  'PRONUNCIATION',
  'CONVERSATION',
  'LISTENING',
  'WRITING',
  'HSKK',
  'HSK_EXAM',
];

export const CreateTeacherModal: React.FC<CreateTeacherModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateTeacherDTO>({
    name: '',
    email: '',
    phone: '',
    teachingLevels: ['HSK 3'],
    specializations: ['GRAMMAR'],
    qualifications: '',
    experienceYears: 2,
    teachingStatus: 'ACTIVE',
    bio: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleLevel = (lvl: TeachingLevel) => {
    setFormData((prev) => {
      const exists = prev.teachingLevels.includes(lvl);
      const updated = exists
        ? prev.teachingLevels.filter((l) => l !== lvl)
        : [...prev.teachingLevels, lvl];
      return { ...prev, teachingLevels: updated };
    });
    if (errors.teachingLevels) {
      setErrors((prev) => ({ ...prev, teachingLevels: '' }));
    }
  };

  const toggleSpec = (spec: TeacherSpecialization) => {
    setFormData((prev) => {
      const exists = prev.specializations.includes(spec);
      const updated = exists
        ? prev.specializations.filter((s) => s !== spec)
        : [...prev.specializations, spec];
      return { ...prev, specializations: updated };
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) {
      errs.name = 'Vui lòng nhập họ và tên giáo viên.';
    }

    if (!formData.email.trim()) {
      errs.email = 'Vui lòng nhập email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Email không hợp lệ.';
    } else if (adminTeacherService.isEmailTaken(formData.email)) {
      errs.email = 'Email này đã tồn tại trong hệ thống.';
    }

    if (formData.teachingLevels.length === 0) {
      errs.teachingLevels = 'Vui lòng chọn ít nhất một cấp độ HSK giảng dạy.';
    }

    if (formData.experienceYears < 0) {
      errs.experienceYears = 'Số năm kinh nghiệm không thể âm.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit(formData);
    onClose();
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      teachingLevels: ['HSK 3'],
      specializations: ['GRAMMAR'],
      qualifications: '',
      experienceYears: 2,
      teachingStatus: 'ACTIVE',
      bio: '',
    });
    setErrors({});
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm hồ sơ giáo viên mới">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Name and Email */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div className="drawer-edit-field">
            <label className="drawer-edit-label">
              Họ và tên <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              className="drawer-edit-input"
              placeholder="VD: Nguyễn Thu Hà"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
            />
            {errors.name && (
              <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{errors.name}</span>
            )}
          </div>

          <div className="drawer-edit-field">
            <label className="drawer-edit-label">
              Email công tác <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="email"
              className="drawer-edit-input"
              placeholder="ha.nguyen@zhongwenhub.edu.vn"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
            />
            {errors.email && (
              <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{errors.email}</span>
            )}
          </div>
        </div>

        {/* Phone & Experience */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div className="drawer-edit-field">
            <label className="drawer-edit-label">Số điện thoại liên hệ</label>
            <input
              type="tel"
              className="drawer-edit-input"
              placeholder="0912 345 678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="drawer-edit-field">
            <label className="drawer-edit-label">Kinh nghiệm giảng dạy (năm)</label>
            <input
              type="number"
              min={0}
              max={40}
              className="drawer-edit-input"
              value={formData.experienceYears}
              onChange={(e) =>
                setFormData({ ...formData, experienceYears: Number(e.target.value) || 0 })
              }
            />
            {errors.experienceYears && (
              <span style={{ fontSize: '11px', color: 'var(--danger)' }}>
                {errors.experienceYears}
              </span>
            )}
          </div>
        </div>

        {/* Teaching Levels (Multi-select) */}
        <div className="drawer-edit-field">
          <label className="drawer-edit-label">
            Cấp độ HSK đảm nhiệm <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <div className="pill-selector-grid">
            {ALL_LEVELS.map((lvl) => {
              const isSelected = formData.teachingLevels.includes(lvl);
              return (
                <button
                  type="button"
                  key={lvl}
                  className={`pill-select-button ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleLevel(lvl)}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
          {errors.teachingLevels && (
            <span style={{ fontSize: '11px', color: 'var(--danger)' }}>
              {errors.teachingLevels}
            </span>
          )}
        </div>

        {/* Specializations (Multi-select) */}
        <div className="drawer-edit-field">
          <label className="drawer-edit-label">Lĩnh vực chuyên môn</label>
          <div className="pill-selector-grid">
            {ALL_SPECIALIZATIONS.map((spec) => {
              const isSelected = formData.specializations.includes(spec);
              return (
                <button
                  type="button"
                  key={spec}
                  className={`pill-select-button ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleSpec(spec)}
                >
                  {SPECIALIZATION_META[spec]?.label || spec}
                </button>
              );
            })}
          </div>
        </div>

        {/* Qualifications & Teaching Status */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div className="drawer-edit-field">
            <label className="drawer-edit-label">Bằng cấp & Học vị</label>
            <input
              type="text"
              className="drawer-edit-input"
              placeholder="VD: Thạc sĩ Hán ngữ - ĐH Bắc Kinh"
              value={formData.qualifications}
              onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
            />
          </div>

          <div className="drawer-edit-field">
            <label className="drawer-edit-label">Trạng thái giảng dạy ban đầu</label>
            <select
              className="drawer-edit-select"
              value={formData.teachingStatus}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  teachingStatus: e.target.value as TeacherTeachingStatus,
                })
              }
            >
              <option value="ACTIVE">Đang giảng dạy</option>
              <option value="ON_LEAVE">Tạm nghỉ</option>
              <option value="INACTIVE">Ngừng giảng dạy</option>
            </select>
          </div>
        </div>

        {/* Bio */}
        <div className="drawer-edit-field">
          <label className="drawer-edit-label">Giới thiệu tóm tắt hồ sơ</label>
          <textarea
            className="drawer-edit-textarea"
            placeholder="Tóm tắt phong cách giảng dạy, thế mạnh học thuật..."
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          />
        </div>

        {/* Informational Callout */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 12px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-md)',
            fontSize: '11px',
            color: '#1e40af',
          }}
        >
          <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Ghi chú bảo mật:</strong> Không tạo mật khẩu trực tiếp. Tài khoản đăng nhập
            sẽ được kích hoạt thông qua quy trình xác thực khi backend được tích hợp.
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Hủy bỏ
          </button>
          <button type="submit" className="btn btn-primary">
            <UserPlus size={14} style={{ display: 'inline', marginRight: 4 }} />
            Tạo giáo viên
          </button>
        </div>
      </form>
    </Modal>
  );
};
