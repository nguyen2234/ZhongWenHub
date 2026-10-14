import React from 'react';
import { Calendar, Clock, Video, MapPin, Globe, ExternalLink } from 'lucide-react';
import type { ClassSchedule } from '../../types/class.types';
import { DAY_OF_WEEK_LABELS } from '../../types/class.types';

export interface ClassScheduleTabProps {
  schedules: ClassSchedule[];
}

export const ClassScheduleTab: React.FC<ClassScheduleTabProps> = ({ schedules }) => {
  return (
    <div className="tp-card">
      <div className="tp-card-header">
        <div>
          <h3 className="tp-card-title">
            <Calendar size={18} style={{ color: 'var(--primary)' }} />
            Thời Khóa Biểu Giảng Dạy Hàng Tuần
          </h3>
          <div className="tp-card-subtitle">
            Khung giờ cố định theo tuần, múi giờ Việt Nam (Asia/Ho_Chi_Minh)
          </div>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: 'var(--text-sm)',
          }}
        >
          Lớp học chưa được thiết lập thời khóa biểu cố định.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {schedules.map((sch) => {
            const dayLabel = DAY_OF_WEEK_LABELS[sch.dayOfWeek];

            return (
              <div
                key={sch.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {/* Day of Week Pill */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        backgroundColor: 'var(--primary-light)',
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {dayLabel?.full || sch.dayOfWeek}
                    </span>

                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Globe size={12} /> {sch.timezone}
                    </span>
                  </div>

                  {/* Time Range */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 700,
                      color: 'var(--foreground)',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    <Clock size={16} style={{ color: 'var(--primary)' }} />
                    <span>
                      {sch.startTime} – {sch.endTime}
                    </span>
                  </div>

                  {/* Location Info */}
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    {sch.locationType === 'ONLINE' ? (
                      <>
                        <Video size={14} style={{ color: '#0284c7' }} />
                        <span>Trực tuyến qua Zoom / Google Meet</span>
                      </>
                    ) : (
                      <>
                        <MapPin size={14} style={{ color: '#ea580c' }} />
                        <span>{sch.roomLocation || 'Phòng học tại trung tâm'}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Meeting URL Button if Online */}
                {sch.meetingUrl && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-3)' }}>
                    <a
                      href={sch.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="ds-btn ds-btn-sm ds-btn-outline"
                      style={{ width: '100%', fontSize: '11px', gap: '6px' }}
                    >
                      <Video size={13} /> Mở phòng học <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
