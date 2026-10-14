import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ClipboardList,
  BookOpen,
} from 'lucide-react';

interface EnrolledClass {
  id: string;
  name: string;
  code: string;
  hskLevel: number;
  teacherName: string;
  teacherTitle: string;
  schedule: string;
  room: string;
  progressPercent: number;
  pendingHomeworkCount: number;
  announcement?: string;
}

const MOCK_ENROLLED_CLASSES: EnrolledClass[] = [
  {
    id: 'cls-001',
    name: 'Lớp HSK 2 Cấp tốc - Khóa K14',
    code: 'ZWH-HSK2-K14',
    hskLevel: 2,
    teacherName: 'Thầy Lý Minh (李明老师)',
    teacherTitle: 'Thạc sĩ Ngôn ngữ Bắc Kinh • 8 năm giảng dạy',
    schedule: 'Thứ 3, Thứ 5 (19:30 - 21:00)',
    room: 'Phòng học trực tuyến A2',
    progressPercent: 65,
    pendingHomeworkCount: 2,
    announcement: 'Nhắc nhở: Hạn nộp bài tập Ôn tập ngữ pháp câu chữ 比 là 23:59 Chủ Nhật tuần này.',
  },
  {
    id: 'cls-002',
    name: 'CLB Luyện Phản Xạ Giao Tiếp Bắc Kinh',
    code: 'ZWH-SPEAK-03',
    hskLevel: 2,
    teacherName: 'Cô Vương Lệ (王丽老师)',
    teacherTitle: 'Giảng viên Bản ngữ • Phát thanh viên',
    schedule: 'Thứ 7 (14:00 - 16:00)',
    room: 'Studio Giao tiếp B1',
    progressPercent: 40,
    pendingHomeworkCount: 0,
    announcement: 'Tuần này chúng ta sẽ thực hành chủ đề Gọi món ăn và Mua sắm siêu thị.',
  },
];

export const StudentClassesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 24px 48px 24px' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)',
          borderRadius: '20px',
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>
            <Users size={14} />
            <span>KHÔNG GIAN LỚP HỌC HỌC VIÊN</span>
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 800 }}>
            Lớp Học Của Tôi
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, maxWidth: '640px', lineHeight: 1.5 }}>
            Theo dõi lịch học trực tiếp với giảng viên, thông báo lớp học và các bài tập được giao theo từng môn.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', padding: '12px 20px', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>{MOCK_ENROLLED_CLASSES.length} Lớp</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Đang theo học</div>
          </div>
        </div>
      </div>

      {/* Classes List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {MOCK_ENROLLED_CLASSES.map((cls) => (
          <div
            key={cls.id}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1.5px solid #e2e8f0',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
            }}
          >
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#eef2ff', color: '#4338ca' }}>
                    HSK {cls.hskLevel}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                    Mã lớp: {cls.code}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {cls.name}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {cls.pendingHomeworkCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => navigate('/homework')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <ClipboardList size={14} />
                    <span>{cls.pendingHomeworkCount} bài tập chưa nộp</span>
                  </button>
                ) : (
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', backgroundColor: '#dcfce7', padding: '6px 12px', borderRadius: '10px' }}>
                    Đã hoàn thành bài tập
                  </span>
                )}
              </div>
            </div>

            {/* Teacher and schedule details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Giảng viên phụ trách:</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{cls.teacherName}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{cls.teacherTitle}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Lịch học cố định:</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{cls.schedule}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{cls.room}</div>
              </div>
            </div>

            {/* Announcement if any */}
            {cls.announcement && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', fontSize: '12px', color: '#92400e' }}>
                📢 <strong>Thông báo giảng viên:</strong> {cls.announcement}
              </div>
            )}

            {/* Progress bar and CTA */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '16px', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ flex: 1, minWidth: '220px', maxWidth: '360px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  <span style={{ color: '#475569' }}>Tiến độ khóa học:</span>
                  <span style={{ color: '#4338ca' }}>{cls.progressPercent}%</span>
                </div>
                <div style={{ height: '8px', borderRadius: '9999px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                  <div style={{ width: `${cls.progressPercent}%`, height: '100%', borderRadius: '9999px', backgroundColor: '#4338ca' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => navigate('/homework')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <BookOpen size={14} />
                  <span>Xem tài liệu & bài tập</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentClassesPage;
