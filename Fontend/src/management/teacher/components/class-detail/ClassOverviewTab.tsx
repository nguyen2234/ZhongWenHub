import React from 'react';
import { BookOpen, ExternalLink, Video, MapPin, Users, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ClassDetailDTO } from '../../types/class.types';

export interface ClassOverviewTabProps {
  detail: ClassDetailDTO;
}

export const ClassOverviewTab: React.FC<ClassOverviewTabProps> = ({ detail }) => {
  const { classInfo, hskLevel, course, derivedEnrollmentCount, membersSummary } = detail;

  const fillPercent = Math.min(
    100,
    Math.round((derivedEnrollmentCount / classInfo.capacity) * 100)
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 'var(--space-6)' }}>
      {/* CỘT TRÁI: THÔNG TIN HỌC THUẬT & MÔ TẢ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {/* Card Mô tả */}
        <div className="tp-card">
          <div className="tp-card-header">
            <h3 className="tp-card-title">Mô Tả & Mục Tiêu Đào Tạo</h3>
          </div>
          <div
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--foreground)',
              lineHeight: 1.6,
            }}
          >
            {classInfo.description || 'Chưa có thông tin mô tả chi tiết cho lớp học này.'}
          </div>
        </div>

        {/* Card Chuẩn HSK Tham Chiếu */}
        <div className="tp-card">
          <div className="tp-card-header">
            <h3 className="tp-card-title">
              <Award size={18} style={{ color: hskLevel?.colorToken || 'var(--primary)' }} />
              Khung Đánh Giá Năng Lực HSK Tham Chiếu
            </h3>
            {hskLevel && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  border: `1px solid ${hskLevel.colorToken}`,
                  color: hskLevel.colorToken,
                  backgroundColor: 'var(--background)',
                }}
              >
                {hskLevel.name}
              </span>
            )}
          </div>

          {hskLevel ? (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 'var(--space-3)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--background)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Cấp độ chuẩn</div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginTop: '2px' }}>
                    {hskLevel.name} ({hskLevel.levelCode})
                  </div>
                </div>

                <div
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--background)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Từ vựng chuẩn</div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginTop: '2px' }}>
                    {hskLevel.targetVocabularyCount.toLocaleString()} từ
                  </div>
                </div>

                <div
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--background)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Hán tự chuẩn</div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginTop: '2px' }}>
                    {hskLevel.targetCharacterCount.toLocaleString()} chữ
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', lineHeight: 1.5 }}>
                Lớp học tham chiếu trực tiếp chuẩn dữ liệu từ HSK Repository trung tâm. Giáo viên
                không tạo cơ sở dữ liệu từ vựng riêng biệt.
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Không tìm thấy thông tin cấp độ HSK tương ứng trong HSK Repository.
            </div>
          )}
        </div>

        {/* Card Giáo Trình Liên Kết (nếu có) */}
        {course && (
          <div className="tp-card">
            <div className="tp-card-header">
              <h3 className="tp-card-title">
                <BookOpen size={18} style={{ color: '#059669' }} />
                Giáo Trình Học Tập Liên Kết
              </h3>
              <Link
                to="/management/content-manager/curriculum"
                className="ds-btn ds-btn-ghost ds-btn-sm"
                style={{ fontSize: '11px', gap: '4px' }}
              >
                Xem toàn bộ bài học <ExternalLink size={12} />
              </Link>
            </div>

            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: '4px' }}>
              {course.name} ({course.code})
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', lineHeight: 1.5 }}>
              {course.description}
            </div>
          </div>
        )}
      </div>

      {/* CỘT PHẢI: SĨ SỐ, ĐỊA ĐIỂM & LIÊN HỆ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {/* Card Sĩ số & Tuyển sinh */}
        <div className="tp-card">
          <div className="tp-card-header">
            <h3 className="tp-card-title">
              <Users size={18} style={{ color: 'var(--primary)' }} />
              Sĩ Số & Tình Trạng Ghi Danh
            </h3>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-2)',
            }}
          >
            <div>
              <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--foreground)' }}>
                {derivedEnrollmentCount}
              </span>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', marginLeft: '4px' }}>
                / {classInfo.capacity} học viên
              </span>
            </div>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--primary)' }}>
              {fillPercent}% sức chứa
            </span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: '8px',
              width: '100%',
              backgroundColor: 'var(--background)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              marginBottom: 'var(--space-4)',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${fillPercent}%`,
                backgroundColor: fillPercent >= 90 ? 'var(--warning)' : 'var(--primary)',
                borderRadius: 'var(--radius-full)',
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--space-2)',
              fontSize: '11px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                padding: 'var(--space-2)',
                backgroundColor: 'var(--background)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ color: 'var(--muted)' }}>Đang học</div>
              <div style={{ fontWeight: 700, color: 'var(--success)', marginTop: '2px' }}>
                {membersSummary.active}
              </div>
            </div>
            <div
              style={{
                padding: 'var(--space-2)',
                backgroundColor: 'var(--background)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ color: 'var(--muted)' }}>Bảo lưu</div>
              <div style={{ fontWeight: 700, color: 'var(--warning)', marginTop: '2px' }}>
                {membersSummary.paused}
              </div>
            </div>
            <div
              style={{
                padding: 'var(--space-2)',
                backgroundColor: 'var(--background)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ color: 'var(--muted)' }}>Còn trống</div>
              <div style={{ fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>
                {Math.max(0, classInfo.capacity - derivedEnrollmentCount)}
              </div>
            </div>
          </div>
        </div>

        {/* Card Phòng học & Hình thức */}
        <div className="tp-card">
          <div className="tp-card-header">
            <h3 className="tp-card-title">
              {classInfo.locationType === 'ONLINE' ? (
                <Video size={18} style={{ color: '#0284c7' }} />
              ) : (
                <MapPin size={18} style={{ color: '#ea580c' }} />
              )}
              Phòng Học & Hình Thức
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px' }}>
                Hình thức đào tạo
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                {classInfo.locationType === 'ONLINE'
                  ? 'Trực tuyến 100% (Online)'
                  : classInfo.locationType === 'HYBRID'
                  ? 'Kết hợp Online & Trực tiếp'
                  : 'Học trực tiếp tại cơ sở (Offline)'}
              </div>
            </div>

            {classInfo.meetingUrl && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>
                  Phòng học trực tuyến
                </div>
                <a
                  href={classInfo.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ds-btn ds-btn-primary ds-btn-sm"
                  style={{ width: '100%', gap: '6px' }}
                >
                  <Video size={14} /> Mở phòng Zoom/Meet <ExternalLink size={12} />
                </a>
              </div>
            )}

            {classInfo.roomLocation && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px' }}>
                  Địa chỉ phòng học
                </div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  {classInfo.roomLocation}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
