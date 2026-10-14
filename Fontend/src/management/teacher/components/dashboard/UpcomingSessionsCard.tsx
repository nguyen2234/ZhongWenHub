import React from 'react';
import { Calendar, Video, MapPin, Users, ExternalLink, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { UpcomingTeachingSession } from '../../types/dashboard.types';

export interface UpcomingSessionsCardProps {
  sessions: UpcomingTeachingSession[];
  onViewAllClasses?: () => void;
}

export const UpcomingSessionsCard: React.FC<UpcomingSessionsCardProps> = ({
  sessions,
}) => {
  return (
    <div className="tp-card" style={{ marginBottom: 'var(--space-6)' }}>
      <div className="tp-card-header">
        <div>
          <h2 className="tp-card-title">
            <Calendar size={18} style={{ color: 'var(--primary)' }} />
            Buổi Dạy Sắp Diễn Ra
          </h2>
          <div className="tp-card-subtitle">
            Lịch giảng dạy trong 7 ngày tới theo thời khóa biểu
          </div>
        </div>
        <Link
          to="/management/teacher/classes"
          className="ds-btn ds-btn-ghost ds-btn-sm"
          style={{ fontSize: 'var(--text-xs)' }}
        >
          Tất cả lớp <ArrowRight size={14} />
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-6)',
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: 'var(--text-sm)',
          }}
        >
          Không có buổi dạy nào trong thời gian tới.
        </div>
      ) : (
        <div>
          {sessions.slice(0, 3).map((session) => (
            <div
              key={session.id}
              className={`tp-session-item ${session.isToday ? 'tp-session-today' : ''}`}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    marginBottom: '4px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                    }}
                  >
                    {session.dayOfWeekText}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      color: 'var(--foreground)',
                    }}
                  >
                    {session.timeRange}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      border: `1px solid ${session.hskLevelColor}`,
                      color: session.hskLevelColor,
                    }}
                  >
                    {session.hskLevelName}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {session.className}
                </div>

                {session.lessonTopicPreview && (
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--muted)',
                      marginTop: '2px',
                    }}
                  >
                    Chủ đề: {session.lessonTopicPreview}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    marginTop: '6px',
                    fontSize: '11px',
                    color: 'var(--muted)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {session.locationType === 'ONLINE' ? (
                      <>
                        <Video size={13} style={{ color: '#0284c7' }} /> Trực tuyến
                      </>
                    ) : (
                      <>
                        <MapPin size={13} style={{ color: '#ea580c' }} />{' '}
                        {session.roomLocation || 'Phòng học'}
                      </>
                    )}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={13} /> {session.enrolledStudentsCount} học viên
                  </span>
                </div>
              </div>

              <div>
                {session.meetingUrl ? (
                  <a
                    href={session.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ds-btn ds-btn-sm ds-btn-primary"
                    style={{ fontSize: '11px', height: '32px' }}
                  >
                    Vào lớp <ExternalLink size={12} />
                  </a>
                ) : (
                  <Link
                    to={`/management/teacher/classes/${session.classId}`}
                    className="ds-btn ds-btn-sm ds-btn-outline"
                    style={{ fontSize: '11px', height: '32px' }}
                  >
                    Chi tiết
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
