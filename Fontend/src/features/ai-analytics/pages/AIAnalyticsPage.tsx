import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface SkillScore {
  name: string;
  score: number; // 0 - 100
  color: string;
}

const SKILL_SCORES: SkillScore[] = [
  { name: 'Nghe hiểu (Listening)', score: 85, color: '#0284c7' },
  { name: 'Hội thoại (Speaking)', score: 78, color: '#10b981' },
  { name: 'Đọc hiểu (Reading)', score: 90, color: '#d97706' },
  { name: 'Viết & Ngữ pháp (Writing)', score: 72, color: '#be123c' },
  { name: 'Vốn từ vựng (Vocabulary)', score: 88, color: '#4338ca' },
  { name: 'Phản xạ thanh điệu (Tones)', score: 80, color: '#8b5cf6' },
];

const WEAK_POINTS = [
  {
    id: 'wp-01',
    topic: 'Cấu trúc câu so sánh 比 (bǐ)',
    type: 'Ngữ pháp',
    impact: 'Sai 2/5 câu trong bài tập gần đây',
    recommendation: 'Cần ôn tập quy tắc: không dùng phó từ 很 sau tính từ trong câu chữ 比.',
    actionPath: '/grammar',
  },
  {
    id: 'wp-02',
    topic: 'Phân biệt thanh điệu Thanh 2 (Dấu sắc) và Thanh 3 (Dấu hỏi)',
    type: 'Phát âm',
    impact: 'Tỷ lệ nhầm lẫn 28% khi luyện nói với Kippy',
    recommendation: 'Luyện tập hạ thấp âm vực ở thanh 3 trước khi lên giọng.',
    actionPath: '/skills/speaking',
  },
  {
    id: 'wp-03',
    topic: 'Từ vựng phương hướng: 旁边, 后面, 对面',
    type: 'Từ vựng',
    impact: 'Chưa đạt mức thành thạo trong thuật toán SRS',
    recommendation: 'Thêm vào danh sách ôn tập flashcard ưu tiên hôm nay.',
    actionPath: '/vocabulary',
  },
];

export const AIAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 24px 48px 24px' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
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
            <BrainCircuit size={14} />
            <span>AI DIAGNOSTIC & COMPETENCY RADAR</span>
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 800 }}>
            Phân Tích Năng Lực Học Tập Bằng AI
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, maxWidth: '640px', lineHeight: 1.5 }}>
            Báo cáo định lượng 6 kỹ năng cốt lõi dựa trên hành vi học tập thực tế, tự động phát hiện lỗ hổng kiến thức và đề xuất lộ trình khắc phục.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', padding: '12px 20px', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>82.1 / 100</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Chỉ số Năng lực AI</div>
          </div>
        </div>
      </div>

      {/* 2-Column Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Left Column: 6 Skills Competency Breakdown */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #e2e8f0',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              Biểu đồ 6 Kỹ năng Tiếng Trung
            </h3>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#4338ca', backgroundColor: '#eef2ff', padding: '3px 8px', borderRadius: '6px' }}>
              Cập nhật hôm nay
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {SKILL_SCORES.map((item, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  <span style={{ color: '#334155' }}>{item.name}</span>
                  <span style={{ color: item.color }}>{item.score}%</span>
                </div>
                <div style={{ height: '10px', borderRadius: '9999px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${item.score}%`,
                      height: '100%',
                      borderRadius: '9999px',
                      backgroundColor: item.color,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
            💡 <strong>Nhận định AI:</strong> Kỹ năng <em>Đọc hiểu</em> và <em>Vốn từ vựng</em> của bạn đang dẫn đầu. Cần tăng cường thời lượng luyện viết và sắp xếp câu chữ 比 để cân bằng phổ điểm.
          </div>
        </div>

        {/* Right Column: HSK Readiness Forecast */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #e2e8f0',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
            Dự báo Độ Sẵn Sàng Thi Đỗ HSK
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* HSK 1 */}
            <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#166534' }}>HSK Cấp độ 1</div>
                <div style={{ fontSize: '12px', color: '#15803d' }}>Đã hoàn thành 150/150 từ vựng</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#16a34a' }}>100%</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d' }}>Đã sẵn sàng</div>
              </div>
            </div>

            {/* HSK 2 */}
            <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#3730a3' }}>HSK Cấp độ 2 (Mục tiêu hiện tại)</div>
                <div style={{ fontSize: '12px', color: '#4338ca' }}>Đã học 220/300 từ vựng • 8/12 bài học</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#4338ca' }}>84%</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#4338ca' }}>Rất khả quan</div>
              </div>
            </div>

            {/* HSK 3 */}
            <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#334155' }}>HSK Cấp độ 3 (Khóa tiếp theo)</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Đã tích lũy 35% cấu trúc căn bản</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#64748b' }}>38%</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Đang tích lũy</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weak Knowledge Points Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #e2e8f0',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} color="#d97706" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
            Lỗ Hổng Kiến Thức Cần Củng Cố Ngay (Weak Knowledge Points)
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {WEAK_POINTS.map((wp) => (
            <div
              key={wp.id}
              style={{
                padding: '16px',
                borderRadius: '14px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', backgroundColor: '#fde68a', color: '#92400e' }}>
                    {wp.type}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                    {wp.topic}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#b45309', marginBottom: '4px' }}>
                  • {wp.impact}
                </div>
                <div style={{ fontSize: '12px', color: '#475569' }}>
                  👉 {wp.recommendation}
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(wp.actionPath)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#d97706',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <span>Ôn tập ngay</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIAnalyticsPage;
