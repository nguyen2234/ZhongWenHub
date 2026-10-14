import React from 'react';
import {
  Award,
  Calendar,
} from 'lucide-react';

interface ResultItem {
  id: string;
  title: string;
  type: 'Bài tập về nhà' | 'Bài kiểm tra tuần' | 'Thi thử HSK';
  date: string;
  score: number;
  maxScore: number;
  teacherFeedback: string;
  passed: boolean;
}

const MOCK_RESULTS: ResultItem[] = [
  {
    id: 'res-01',
    title: 'Bài tập 03: Ngữ pháp so sánh chữ 比 và phó từ 很',
    type: 'Bài tập về nhà',
    date: '12/10/2026',
    score: 9.5,
    maxScore: 10,
    teacherFeedback: 'Em làm rất tốt phần câu chữ 比! Cần chú ý thêm vị trí của tính từ trong câu phủ định.',
    passed: true,
  },
  {
    id: 'res-02',
    title: 'Kiểm tra định kỳ Tuần 6: Luyện nghe hội thoại mua sắm',
    type: 'Bài kiểm tra tuần',
    date: '08/10/2026',
    score: 8.8,
    maxScore: 10,
    teacherFeedback: 'Phản xạ nghe hiểu tốt, nhận biết thanh điệu thanh 2 và thanh 3 chính xác.',
    passed: true,
  },
  {
    id: 'res-03',
    title: 'Đề thi thử HSK 2 Toàn diện - Bộ đề số 01',
    type: 'Thi thử HSK',
    date: '02/10/2026',
    score: 184,
    maxScore: 200,
    teacherFeedback: 'Đạt chuẩn HSK 2 với tỷ lệ chính xác 92%. Em đã sẵn sàng đăng ký thi thật!',
    passed: true,
  },
];

export const LearningResultsPage: React.FC = () => {

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 24px 48px 24px' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
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
            <Award size={14} />
            <span>KẾT QUẢ & ĐÁNH GIÁ NĂNG LỰC</span>
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 800 }}>
            Kết Quả Học Tập & Nhận Xét
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, maxWidth: '640px', lineHeight: 1.5 }}>
            Tổng hợp điểm số các bài kiểm tra, bài tập về nhà và phản hồi nhận xét trực tiếp từ giảng viên.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', padding: '12px 20px', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>9.2 / 10</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Điểm TB chung</div>
          </div>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', padding: '12px 20px', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>100%</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Tỷ lệ đạt chuẩn</div>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {MOCK_RESULTS.map((res) => (
          <div
            key={res.id}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              border: '1.5px solid #e2e8f0',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#ccfbf1',
                    color: '#0f766e',
                  }}
                >
                  {res.type}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} />
                  {res.date}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#0f766e' }}>
                  {res.score} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>/ {res.maxScore}</span>
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#dcfce7', color: '#16a34a' }}>
                  Đạt
                </span>
              </div>
            </div>

            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              {res.title}
            </h3>

            <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f8fafc', borderLeft: '4px solid #0f766e', fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
              💬 <strong>Nhận xét từ giảng viên:</strong> "{res.teacherFeedback}"
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LearningResultsPage;
