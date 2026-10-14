import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import type { Course, HskLevel } from '../../../admin/content/types';
import type {
  ClassLifecycleStatus,
  ClassSummaryDTO,
  CreateTeachingClassDTO,
  DayOfWeek,
  LocationType,
  TeachingClass,
  UpdateTeachingClassDTO,
} from '../../types/class.types';
import { DAY_OF_WEEK_LABELS } from '../../types/class.types';
import { teacherPortalService } from '../../services';

export interface ClassFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTeachingClassDTO | UpdateTeachingClassDTO) => Promise<void>;
  editingClass?: TeachingClass | ClassSummaryDTO | null;
  hskLevels: HskLevel[];
  courses: Course[];
}

interface ScheduleRowState {
  id?: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  locationType: LocationType;
  meetingUrl?: string;
  roomLocation?: string;
}

export const ClassFormDrawer: React.FC<ClassFormDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingClass,
  hskLevels,
  courses,
}) => {
  const isEditing = Boolean(editingClass);

  // Form Fields State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [hskLevelId, setHskLevelId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [capacity, setCapacity] = useState(25);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationType, setLocationType] = useState<LocationType>('ONLINE');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [roomLocation, setRoomLocation] = useState('');
  const [status, setStatus] = useState<ClassLifecycleStatus>('UPCOMING');
  const [schedules, setSchedules] = useState<ScheduleRowState[]>([
    {
      dayOfWeek: 'TUESDAY',
      startTime: '19:00',
      endTime: '20:30',
      locationType: 'ONLINE',
    },
    {
      dayOfWeek: 'THURSDAY',
      startTime: '19:00',
      endTime: '20:30',
      locationType: 'ONLINE',
    },
  ]);

  // Validation Errors & Loading
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset or Populate form when editingClass or isOpen changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingClass) {
      setName(editingClass.name);
      setCode(editingClass.code);
      setDescription(editingClass.description || '');
      setHskLevelId(editingClass.hskLevelId);
      setCourseId(editingClass.courseId || '');
      setCapacity(editingClass.capacity);
      setStartDate(editingClass.startDate);
      setEndDate(editingClass.endDate || '');
      setLocationType(editingClass.locationType);
      setMeetingUrl(editingClass.meetingUrl || '');
      setRoomLocation(editingClass.roomLocation || '');
      setStatus(editingClass.status);

      // Load schedules for editingClass
      const classSchedules = teacherPortalService.getClassSchedules(editingClass.id);
      if (classSchedules.length > 0) {
        setSchedules(
          classSchedules.map((s) => ({
            id: s.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            locationType: s.locationType,
            meetingUrl: s.meetingUrl,
            roomLocation: s.roomLocation,
          }))
        );
      }
    } else {
      // Default for Create
      setName('');
      setCode(`CLS-HSK3-${Math.floor(100 + Math.random() * 900)}`);
      setDescription('');
      setHskLevelId(hskLevels[0]?.id || 'level-hsk-3');
      setCourseId('');
      setCapacity(25);
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate('');
      setLocationType('ONLINE');
      setMeetingUrl('https://zoom.us/j/84920491029');
      setRoomLocation('');
      setStatus('UPCOMING');
      setSchedules([
        {
          dayOfWeek: 'TUESDAY',
          startTime: '19:00',
          endTime: '20:30',
          locationType: 'ONLINE',
        },
        {
          dayOfWeek: 'THURSDAY',
          startTime: '19:00',
          endTime: '20:30',
          locationType: 'ONLINE',
        },
      ]);
    }
    setErrors({});
  }, [isOpen, editingClass, hskLevels]);

  if (!isOpen) return null;

  // Add a schedule row
  const handleAddSchedule = () => {
    setSchedules((prev) => [
      ...prev,
      {
        dayOfWeek: 'SATURDAY',
        startTime: '19:00',
        endTime: '20:30',
        locationType,
        meetingUrl: locationType === 'ONLINE' ? meetingUrl : undefined,
      },
    ]);
  };

  // Remove a schedule row
  const handleRemoveSchedule = (index: number) => {
    setSchedules((prev) => prev.filter((_, i) => i !== index));
  };

  // Update schedule field
  const handleScheduleChange = (
    index: number,
    field: keyof ScheduleRowState,
    value: unknown
  ) => {
    setSchedules((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Client-side Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Vui lòng nhập tên lớp học.';
    }

    if (!isEditing && !code.trim()) {
      newErrors.code = 'Vui lòng nhập mã lớp học.';
    }

    if (!capacity || capacity <= 0) {
      newErrors.capacity = 'Sĩ số tối đa phải lớn hơn 0.';
    }

    if (!startDate) {
      newErrors.startDate = 'Vui lòng chọn ngày khai giảng.';
    }

    if (endDate && startDate && endDate < startDate) {
      newErrors.endDate = 'Ngày bế giảng không được trước ngày khai giảng.';
    }

    if (!hskLevelId) {
      newErrors.hskLevelId = 'Vui lòng chọn cấp độ HSK chuẩn.';
    }

    if (meetingUrl.trim()) {
      try {
        new URL(meetingUrl.trim());
      } catch {
        newErrors.meetingUrl = 'Đường dẫn phòng học (URL) không đúng định dạng.';
      }
    }

    // Validate schedules
    for (let i = 0; i < schedules.length; i++) {
      const sch = schedules[i];
      if (sch.startTime >= sch.endTime) {
        newErrors.schedules = `Buổi thứ ${i + 1} (${sch.dayOfWeek}): Giờ bắt đầu phải nhỏ hơn giờ kết thúc.`;
        break;
      }
    }

    // Check duplicate days
    const scheduleKeys = new Set<string>();
    for (const sch of schedules) {
      const key = `${sch.dayOfWeek}-${sch.startTime}`;
      if (scheduleKeys.has(key)) {
        newErrors.schedules = `Trùng lịch học vào ${sch.dayOfWeek} lúc ${sch.startTime}.`;
        break;
      }
      scheduleKeys.add(key);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (isEditing) {
        const updateDTO: UpdateTeachingClassDTO = {
          name: name.trim(),
          description: description.trim(),
          hskLevelId,
          courseId: courseId || undefined,
          capacity: Number(capacity),
          startDate,
          endDate: endDate || undefined,
          locationType,
          meetingUrl: meetingUrl.trim() || undefined,
          roomLocation: roomLocation.trim() || undefined,
          status,
          schedules: schedules.map((s) => ({
            id: s.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            locationType: s.locationType,
            meetingUrl: s.meetingUrl?.trim() || undefined,
            roomLocation: s.roomLocation?.trim() || undefined,
          })),
        };
        await onSubmit(updateDTO);
      } else {
        const createDTO: CreateTeachingClassDTO = {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
          hskLevelId,
          courseId: courseId || undefined,
          capacity: Number(capacity),
          startDate,
          endDate: endDate || undefined,
          locationType,
          meetingUrl: meetingUrl.trim() || undefined,
          roomLocation: roomLocation.trim() || undefined,
          schedules: schedules.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            locationType: s.locationType,
            meetingUrl: s.meetingUrl?.trim() || undefined,
            roomLocation: s.roomLocation?.trim() || undefined,
          })),
        };
        await onSubmit(createDTO);
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu lớp học.';
      setErrors((prev) => ({ ...prev, submit: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="tp-drawer-backdrop" onClick={onClose}>
      <div
        className="tp-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Drawer Header */}
        <div className="tp-drawer-header">
          <div>
            <h2 id="drawer-title" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>
              {isEditing ? 'Chỉnh Sửa Lớp Học' : 'Tạo Lớp Học Mới'}
            </h2>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '2px' }}>
              {isEditing
                ? `Cập nhật thông tin cho lớp ${editingClass?.code}`
                : 'Mở lớp giảng dạy mới và thiết lập thời khóa biểu'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ds-btn ds-btn-ghost ds-btn-sm"
            style={{ width: '32px', height: '32px', padding: 0 }}
            aria-label="Đóng bảng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body Form */}
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="tp-drawer-body">
            {/* Global submit error */}
            {errors.submit && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--danger)',
                  fontSize: 'var(--text-xs)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <AlertCircle size={16} />
                <span>{errors.submit}</span>
              </div>
            )}

            {/* PHẦN 1: THÔNG TIN CƠ BẢN */}
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)', marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              1. Thông Tin Định Danh
            </div>

            <div className="tp-form-group">
              <label className="tp-form-label">
                Tên lớp học <span className="required">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="vd: HSK 3 Giao Tiếp Thực Hành - K24"
                className="tp-input"
              />
              {errors.name && <div className="tp-form-error">{errors.name}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="tp-form-group">
                <label className="tp-form-label">
                  Mã lớp học <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  disabled={isEditing}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="CLS-HSK3-024"
                  className="tp-input"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: isEditing ? 'var(--background)' : 'var(--surface)',
                  }}
                />
                {errors.code && <div className="tp-form-error">{errors.code}</div>}
              </div>

              <div className="tp-form-group">
                <label className="tp-form-label">
                  Cấp độ HSK chuẩn <span className="required">*</span>
                </label>
                <select
                  value={hskLevelId}
                  onChange={(e) => setHskLevelId(e.target.value)}
                  className="tp-select"
                  style={{ width: '100%' }}
                >
                  {hskLevels.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.name} ({lvl.levelCode})
                    </option>
                  ))}
                </select>
                {errors.hskLevelId && <div className="tp-form-error">{errors.hskLevelId}</div>}
              </div>
            </div>

            <div className="tp-form-group">
              <label className="tp-form-label">Khóa học / Giáo trình liên kết (Tùy chọn)</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="tp-select"
                style={{ width: '100%' }}
              >
                <option value="">-- Không liên kết khóa học cố định --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="tp-form-group">
              <label className="tp-form-label">Mô tả lớp học & mục tiêu giảng dạy</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Tóm tắt nội dung trọng tâm và yêu cầu đầu vào..."
                className="tp-textarea"
              />
            </div>

            {/* PHẦN 2: THỜI GIAN & SĨ SỐ */}
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)', margin: 'var(--space-5) 0 var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              2. Sĩ Số & Thời Gian Đào Tạo
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="tp-form-group">
                <label className="tp-form-label">
                  Sĩ số tối đa <span className="required">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="tp-input"
                />
                {errors.capacity && <div className="tp-form-error">{errors.capacity}</div>}
              </div>

              <div className="tp-form-group">
                <label className="tp-form-label">
                  Khai giảng <span className="required">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="tp-input"
                />
                {errors.startDate && <div className="tp-form-error">{errors.startDate}</div>}
              </div>

              <div className="tp-form-group">
                <label className="tp-form-label">Bế giảng dự kiến</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="tp-input"
                />
                {errors.endDate && <div className="tp-form-error">{errors.endDate}</div>}
              </div>
            </div>

            {isEditing && (
              <div className="tp-form-group">
                <label className="tp-form-label">Trạng thái vòng đời lớp học</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ClassLifecycleStatus)}
                  className="tp-select"
                  style={{ width: '100%' }}
                >
                  <option value="UPCOMING">Sắp diễn ra (Upcoming)</option>
                  <option value="ACTIVE">Đang giảng dạy (Active)</option>
                  <option value="DRAFT">Bản nháp (Draft)</option>
                  <option value="COMPLETED">Đã kết thúc (Completed)</option>
                  <option value="ARCHIVED">Lưu trữ (Archived)</option>
                </select>
              </div>
            )}

            {/* PHẦN 3: HÌNH THỨC & PHÒNG HỌC */}
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)', margin: 'var(--space-5) 0 var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              3. Hình Thức Đào Tạo & Địa Điểm
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="tp-form-group">
                <label className="tp-form-label">Hình thức</label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value as LocationType)}
                  className="tp-select"
                  style={{ width: '100%' }}
                >
                  <option value="ONLINE">Trực tuyến (Online)</option>
                  <option value="OFFLINE">Trực tiếp (Offline)</option>
                  <option value="HYBRID">Kết hợp (Hybrid)</option>
                </select>
              </div>

              <div className="tp-form-group">
                <label className="tp-form-label">Phòng học (nếu Offline/Hybrid)</label>
                <input
                  type="text"
                  value={roomLocation}
                  onChange={(e) => setRoomLocation(e.target.value)}
                  placeholder="vd: Phòng 302, Tòa nhà ZhongWen"
                  className="tp-input"
                />
              </div>
            </div>

            <div className="tp-form-group">
              <label className="tp-form-label">Đường dẫn lớp học trực tuyến (Meeting URL)</label>
              <input
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://zoom.us/j/123456789"
                className="tp-input"
              />
              {errors.meetingUrl && <div className="tp-form-error">{errors.meetingUrl}</div>}
            </div>

            {/* PHẦN 4: THỜI KHÓA BIỂU HÀNG TUẦN */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                margin: 'var(--space-5) 0 var(--space-2)',
              }}
            >
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                4. Thời Khóa Biểu Tuần
              </div>
              <button
                type="button"
                onClick={handleAddSchedule}
                className="ds-btn ds-btn-ghost ds-btn-sm"
                style={{ fontSize: '11px', height: '28px', color: 'var(--primary)' }}
              >
                <Plus size={14} /> Thêm buổi học
              </button>
            </div>

            {errors.schedules && <div className="tp-form-error" style={{ marginBottom: '8px' }}>{errors.schedules}</div>}

            {schedules.length === 0 ? (
              <div
                style={{
                  padding: 'var(--space-3)',
                  textAlign: 'center',
                  backgroundColor: 'var(--background)',
                  border: '1px dashed var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--muted)',
                }}
              >
                Chưa có buổi học nào được thiết lập. Hãy bấm "+ Thêm buổi học".
              </div>
            ) : (
              <div>
                {schedules.map((sch, idx) => (
                  <div key={idx} className="tp-schedule-row">
                    {/* Ngày trong tuần */}
                    <select
                      value={sch.dayOfWeek}
                      onChange={(e) => handleScheduleChange(idx, 'dayOfWeek', e.target.value as DayOfWeek)}
                      className="tp-select"
                      style={{ height: '36px', fontSize: '11px' }}
                    >
                      {(Object.keys(DAY_OF_WEEK_LABELS) as DayOfWeek[]).map((d) => (
                        <option key={d} value={d}>
                          {DAY_OF_WEEK_LABELS[d].full}
                        </option>
                      ))}
                    </select>

                    {/* Giờ bắt đầu */}
                    <input
                      type="time"
                      value={sch.startTime}
                      onChange={(e) => handleScheduleChange(idx, 'startTime', e.target.value)}
                      className="tp-input"
                      style={{ height: '36px', fontSize: '11px' }}
                    />

                    {/* Giờ kết thúc */}
                    <input
                      type="time"
                      value={sch.endTime}
                      onChange={(e) => handleScheduleChange(idx, 'endTime', e.target.value)}
                      className="tp-input"
                      style={{ height: '36px', fontSize: '11px' }}
                    />

                    {/* Hình thức buổi học */}
                    <select
                      value={sch.locationType}
                      onChange={(e) => handleScheduleChange(idx, 'locationType', e.target.value as LocationType)}
                      className="tp-select"
                      style={{ height: '36px', fontSize: '11px' }}
                    >
                      <option value="ONLINE">Online</option>
                      <option value="OFFLINE">Offline</option>
                      <option value="HYBRID">Hybrid</option>
                    </select>

                    {/* Nút xóa */}
                    <button
                      type="button"
                      onClick={() => handleRemoveSchedule(idx)}
                      className="ds-btn ds-btn-ghost ds-btn-sm"
                      style={{ height: '36px', width: '36px', padding: 0, color: 'var(--danger)' }}
                      title="Xóa buổi học"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="tp-drawer-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="ds-btn ds-btn-outline ds-btn-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="ds-btn ds-btn-primary ds-btn-sm"
              style={{ minWidth: '110px' }}
            >
              {isSubmitting ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo lớp học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
