import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  AlertCircle,
  Save,
  CheckCheck,
} from 'lucide-react';
import { teacherPortalService } from '../../services';
import type {
  ClassMemberViewDTO,
  AttendanceStatus,
  RecordAttendanceItem,
} from '../../types';

export interface ClassAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  members: ClassMemberViewDTO[];
  onAttendanceSaved?: () => void;
}

export const ClassAttendanceModal: React.FC<ClassAttendanceModalProps> = ({
  isOpen,
  onClose,
  classId,
  className,
  members,
  onAttendanceSaved,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [records, setRecords] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeMembers = members.filter((m) => m.status === 'ACTIVE');

  // Load existing records for the selected date
  const loadDateRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const existing = await teacherPortalService.getClassAttendance(classId, selectedDate);
      const recordMap: Record<string, { status: AttendanceStatus; notes: string }> = {};

      // Initialize default for all active members as PRESENT
      activeMembers.forEach((m) => {
        recordMap[m.studentId] = { status: 'PRESENT', notes: '' };
      });

      // Override with existing records from backend
      existing.forEach((r) => {
        recordMap[r.studentId] = {
          status: r.status as AttendanceStatus,
          notes: r.notes || '',
        };
      });

      setRecords(recordMap);
    } catch {
      // If error or empty, default all to PRESENT
      const recordMap: Record<string, { status: AttendanceStatus; notes: string }> = {};
      activeMembers.forEach((m) => {
        recordMap[m.studentId] = { status: 'PRESENT', notes: '' };
      });
      setRecords(recordMap);
    } finally {
      setLoading(false);
    }
  }, [classId, selectedDate, activeMembers]);

  useEffect(() => {
    if (isOpen) {
      loadDateRecords();
    }
  }, [isOpen, selectedDate, loadDateRecords]);

  if (!isOpen) return null;

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { notes: '' }),
        status,
      },
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'PRESENT' }),
        notes,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    setRecords((prev) => {
      const updated = { ...prev };
      activeMembers.forEach((m) => {
        updated[m.studentId] = {
          ...(updated[m.studentId] || { notes: '' }),
          status: 'PRESENT',
        };
      });
      return updated;
    });
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const items: RecordAttendanceItem[] = activeMembers.map((m) => ({
        studentId: m.studentId,
        status: records[m.studentId]?.status || 'PRESENT',
        notes: records[m.studentId]?.notes || undefined,
      }));

      await teacherPortalService.recordClassAttendance(classId, {
        attendanceDate: selectedDate,
        records: items,
      });

      setSuccessMessage('Đã lưu dữ liệu điểm danh thành công!');
      if (onAttendanceSaved) {
        onAttendanceSaved();
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Đã xảy ra lỗi khi lưu kết quả điểm danh.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: 'var(--space-4)',
      }}
    >
      <div
        className="tp-card"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-6)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--foreground)' }}>
              Điểm Danh Buổi Học - {className}
            </h3>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '2px' }}>
              Ghi nhận chuyên cần và cập nhật tỷ lệ tham gia của học viên
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ds-btn ds-btn-icon ds-btn-ghost"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Date Selector & Quick Action Bar */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-6)',
            backgroundColor: 'var(--background)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Calendar size={16} style={{ color: 'var(--primary)' }} />
            <label htmlFor="attendance-date" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              Ngày học:
            </label>
            <input
              id="attendance-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="ds-input"
              style={{ width: 'auto', padding: '4px 8px', fontSize: 'var(--text-sm)' }}
            />
          </div>

          <button
            type="button"
            className="ds-btn ds-btn-sm ds-btn-outline"
            onClick={handleMarkAllPresent}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <CheckCheck size={14} style={{ color: '#059669' }} />
            <span>Tất cả có mặt</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ margin: 'var(--space-3) var(--space-6)', padding: 'var(--space-3)', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-sm)' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div style={{ margin: 'var(--space-3) var(--space-6)', padding: 'var(--space-3)', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-sm)' }}>
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Student Attendance List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4) var(--space-6)' }}>
          {loading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--muted)' }}>
              Đang tải danh sách học viên...
            </div>
          ) : activeMembers.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--muted)' }}>
              Lớp học chưa có học viên hoạt động để điểm danh.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {activeMembers.map((member) => {
                const currentStatus = records[member.studentId]?.status || 'PRESENT';
                const currentNotes = records[member.studentId]?.notes || '';

                return (
                  <div
                    key={member.studentId}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-3) var(--space-4)',
                      backgroundColor: 'var(--surface)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div style={{ flex: '1 1 200px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                        {member.studentName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {member.studentEmail} • Chuyên cần: {member.attendanceRate}%
                      </div>
                    </div>

                    {/* Status Toggle Buttons */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(member.studentId, 'PRESENT')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: currentStatus === 'PRESENT' ? '1px solid #059669' : '1px solid var(--border)',
                          backgroundColor: currentStatus === 'PRESENT' ? '#dcfce7' : 'transparent',
                          color: currentStatus === 'PRESENT' ? '#16a34a' : 'var(--muted)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCircle2 size={12} /> Có mặt
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(member.studentId, 'LATE')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: currentStatus === 'LATE' ? '1px solid #d97706' : '1px solid var(--border)',
                          backgroundColor: currentStatus === 'LATE' ? '#fef3c7' : 'transparent',
                          color: currentStatus === 'LATE' ? '#b45309' : 'var(--muted)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Clock size={12} /> Đi muộn
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(member.studentId, 'EXCUSED')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: currentStatus === 'EXCUSED' ? '1px solid #0284c7' : '1px solid var(--border)',
                          backgroundColor: currentStatus === 'EXCUSED' ? '#e0f2fe' : 'transparent',
                          color: currentStatus === 'EXCUSED' ? '#0369a1' : 'var(--muted)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <HelpCircle size={12} /> Có phép
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(member.studentId, 'ABSENT')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: currentStatus === 'ABSENT' ? '1px solid #dc2626' : '1px solid var(--border)',
                          backgroundColor: currentStatus === 'ABSENT' ? '#fee2e2' : 'transparent',
                          color: currentStatus === 'ABSENT' ? '#b91c1c' : 'var(--muted)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <XCircle size={12} /> Vắng
                      </button>
                    </div>

                    {/* Optional Note Input */}
                    <div style={{ flex: '1 1 100%', marginTop: '4px' }}>
                      <input
                        type="text"
                        placeholder="Ghi chú (ví dụ: lý do vắng, xin phép...)"
                        value={currentNotes}
                        onChange={(e) => handleNotesChange(member.studentId, e.target.value)}
                        className="ds-input"
                        style={{ width: '100%', padding: '4px 8px', fontSize: '11px' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-6)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--space-3)',
          }}
        >
          <button
            type="button"
            className="ds-btn ds-btn-outline"
            onClick={onClose}
            disabled={saving}
          >
            Đóng
          </button>
          <button
            type="button"
            className="ds-btn ds-btn-primary"
            onClick={handleSaveAttendance}
            disabled={saving || loading || activeMembers.length === 0}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Save size={15} />
            <span>{saving ? 'Đang lưu...' : 'Lưu điểm danh'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
