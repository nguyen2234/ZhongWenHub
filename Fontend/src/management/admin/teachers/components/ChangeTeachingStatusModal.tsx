import React, { useState } from 'react';
import { AlertCircle, CalendarCheck } from 'lucide-react';
import { Modal } from '../../../../design-system';
import type { TeacherDetail, TeacherListItem, TeacherTeachingStatus } from '../types/teacher.types';

export interface ChangeTeachingStatusModalProps {
  isOpen: boolean;
  teacher: TeacherListItem | TeacherDetail | null;
  onClose: () => void;
  onConfirm: (teacherId: string, newStatus: TeacherTeachingStatus) => void;
}

interface StatusFormProps {
  teacher: TeacherListItem | TeacherDetail;
  onClose: () => void;
  onConfirm: (teacherId: string, newStatus: TeacherTeachingStatus) => void;
}

const ChangeTeachingStatusForm: React.FC<StatusFormProps> = ({
  teacher,
  onClose,
  onConfirm,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<TeacherTeachingStatus>(
    teacher.teachingStatus
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(teacher.id, selectedStatus);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 12px',
          backgroundColor: '#f8fafc',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="teacher-avatar-badge" style={{ width: 36, height: 36, fontSize: 13 }}>
          <CalendarCheck size={18} />
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
            {teacher.name}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
            {teacher.email} • {teacher.classCount} lớp đang phụ trách
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label className="drawer-edit-label">Chọn trạng thái giảng dạy mới</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${selectedStatus === 'ACTIVE' ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: selectedStatus === 'ACTIVE' ? 'var(--primary-light)' : '#ffffff',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name="teachingStatus"
              value="ACTIVE"
              checked={selectedStatus === 'ACTIVE'}
              onChange={() => setSelectedStatus('ACTIVE')}
              style={{ marginTop: 2 }}
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
                Đang giảng dạy
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Đủ điều kiện nhận lớp, mở bài học và phân công học viên bình thường.
              </div>
            </div>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${selectedStatus === 'ON_LEAVE' ? '#d97706' : 'var(--border)'}`,
              backgroundColor: selectedStatus === 'ON_LEAVE' ? '#fffbeb' : '#ffffff',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name="teachingStatus"
              value="ON_LEAVE"
              checked={selectedStatus === 'ON_LEAVE'}
              onChange={() => setSelectedStatus('ON_LEAVE')}
              style={{ marginTop: 2 }}
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#b45309' }}>
                Tạm nghỉ
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Bảo lưu hồ sơ công tác, tạm ngưng nhận thêm lớp mới trong kỳ này.
              </div>
            </div>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${selectedStatus === 'INACTIVE' ? '#dc2626' : 'var(--border)'}`,
              backgroundColor: selectedStatus === 'INACTIVE' ? '#fef2f2' : '#ffffff',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name="teachingStatus"
              value="INACTIVE"
              checked={selectedStatus === 'INACTIVE'}
              onChange={() => setSelectedStatus('INACTIVE')}
              style={{ marginTop: 2 }}
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#dc2626' }}>
                Ngừng giảng dạy
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Kết thúc nhiệm vụ giảng dạy hoặc chấm dứt hợp đồng đào tạo.
              </div>
            </div>
          </label>
        </div>
      </div>

      {selectedStatus === 'INACTIVE' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 12px',
            backgroundColor: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: 'var(--radius-md)',
            fontSize: '11px',
            color: '#c2410c',
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Cảnh báo nghiệp vụ:</strong> Nếu chuyển sang "Ngừng giảng dạy", các lớp học
            hiện tại do giáo viên phụ trách ({teacher.classCount} lớp) cần được bàn giao cho giáo
            viên khác trong phân hệ Đào tạo.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Hủy bỏ
        </button>
        <button type="submit" className="btn btn-primary">
          Cập nhật trạng thái
        </button>
      </div>
    </form>
  );
};

export const ChangeTeachingStatusModal: React.FC<ChangeTeachingStatusModalProps> = ({
  isOpen,
  teacher,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !teacher) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cập nhật trạng thái giảng dạy">
      <ChangeTeachingStatusForm
        key={teacher.id}
        teacher={teacher}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    </Modal>
  );
};
