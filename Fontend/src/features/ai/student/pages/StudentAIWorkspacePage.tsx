import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  Sparkles,
  MessageSquare,
  Wand2,
  BarChart3,
} from 'lucide-react';
import { useAITutor } from '../../../ai-tutor';
import { CompetencyDashboardWidget } from '../../components/CompetencyDashboardWidget';

export const StudentAIWorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const { openAITutor } = useAITutor();

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '20px 16px 48px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Hero */}
      <div style={{ padding: '24px', borderRadius: '20px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'rgba(67, 56, 202, 0.12)', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BrainCircuit size={26} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>AI Learning Engine & Lộ Trình Cá Nhân Hóa</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
              Đo lường năng lực theo mô hình Bayesian Knowledge Tracing và ma trận đề xuất đa yếu tố HSK 1–4.
            </p>
          </div>
        </div>
      </div>

      {/* Quick AI Tools Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        <button
          type="button"
          onClick={() => openAITutor({ source: 'general', hskLevel: 1 }, 'Giải thích giúp em trọng tâm ngữ pháp và từ vựng cần chú ý hôm nay.')}
          style={{ textAlign: 'left', padding: '18px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <Sparkles size={20} color="#4338ca" />
          <div style={{ fontWeight: 800, fontSize: '15px' }}>Trợ giảng AI Tutor</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Giải thích từ vựng, ngữ pháp, Hanzi/Pinyin theo bài học đang mở.</div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/conversation')}
          style={{ textAlign: 'left', padding: '18px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <MessageSquare size={20} color="#047857" />
          <div style={{ fontWeight: 800, fontSize: '15px' }}>Phòng Hội Thoại AI</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Luyện hội thoại theo tình huống HSK 1–4, sửa lỗi & gợi ý câu tự nhiên.</div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/ai-exercises?hsk=1')}
          style={{ textAlign: 'left', padding: '18px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <Wand2 size={20} color="var(--primary)" />
          <div style={{ fontWeight: 800, fontSize: '15px' }}>Tạo Bài Tập AI</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>6 dạng bài tập chuẩn hóa từ từ vựng, ngữ pháp, bài đọc & lỗi sai.</div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/ai-analytics')}
          style={{ textAlign: 'left', padding: '18px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <BarChart3 size={20} color="#d97706" />
          <div style={{ fontWeight: 800, fontSize: '15px' }}>Phân Tích Điểm Yếu</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Thống kê 6 kỹ năng thực tế từ lịch sử bài tập & bài tập AI.</div>
        </button>
      </div>

      {/* Competency Profile & Recommendation Engine V2 Widget */}
      <CompetencyDashboardWidget />
    </div>
  );
};
