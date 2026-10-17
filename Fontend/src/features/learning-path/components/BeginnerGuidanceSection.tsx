import React from 'react';
import {
  Clock,
  Volume2,
  Repeat,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { StudentLearningState } from '../../learning/types/learning-state.types';

export interface BeginnerGuidanceSectionProps {
  learningState?: StudentLearningState;
  onOpenLesson?: (lessonId: string) => void;
}

export const BeginnerGuidanceSection: React.FC<BeginnerGuidanceSectionProps> = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* =====================================================================
          4.1. BA ĐIỀU GIÚP BẠN HỌC NHANH HƠN (3 CARD NẰM NGANG)
          ===================================================================== */}
      <section aria-labelledby="three-habits-title">
        <div style={{ marginBottom: '16px' }}>
          <h3
            id="three-habits-title"
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#0f172a',
              margin: '0 0 6px',
            }}
          >
            Ba điều giúp bạn học nhanh hơn
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            Những thói quen và phương pháp học tập khoa học giúp bạn rút ngắn 50% thời gian chinh phục nền tảng.
          </p>
        </div>

        {/* 3 Horizontal Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '18px',
          }}
        >
          {/* Card 1: Học đều mỗi ngày */}
          <div
            style={{
              padding: '22px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.03)';
            }}
          >
            <div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#FFF0F1',
                  color: 'var(--primary, #E60012)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                }}
              >
                <Clock size={22} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                Học đều mỗi ngày
              </h4>
              <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                Gợi ý dành <strong>15–20 phút mỗi ngày</strong> thay vì dồn nhiều tiếng vào cuối tuần.
                Duy trì thói quen học tập đều đặn giúp não bộ kích hoạt liên tục và củng cố phản xạ tự nhiên.
              </p>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--primary, #E60012)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Xem mục tiêu học tập <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Card 2: Ưu tiên thanh điệu */}
          <div
            style={{
              padding: '22px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.03)';
            }}
          >
            <div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#FFF0F1',
                  color: 'var(--primary, #E60012)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                }}
              >
                <Volume2 size={22} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                Ưu tiên thanh điệu
              </h4>
              <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                Luyện phát âm ngay từ đầu. Nghe và so sánh các thanh điệu để nhận biết cao độ chuẩn xác.
                Cùng một âm tiết nhưng thay đổi thanh điệu sẽ biểu đạt các ý nghĩa hoàn toàn khác biệt.
              </p>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => navigate('/skills/speaking')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--primary, #E60012)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Luyện phát âm thanh điệu <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Card 3: Lặp lại ngắt quãng */}
          <div
            style={{
              padding: '22px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.03)';
            }}
          >
            <div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#FFF0F1',
                  color: 'var(--primary, #E60012)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                }}
              >
                <Repeat size={22} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                Lặp lại ngắt quãng
              </h4>
              <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                Giới thiệu Flashcard SRS: hệ thống ghi nhớ thông minh tự động tính thời điểm bạn sắp quên từ để nhắc ôn tập đúng thời điểm,
                chuyển kiến thức vào trí nhớ dài hạn.
              </p>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => navigate('/vocabulary')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--primary, #E60012)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Khám phá Flashcard SRS <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4.2. NGƯỜI MỚI BẮT ĐẦU NÊN HỌC GÌ? (BÀI HƯỚNG DẪN DẠNG BÀI VIẾT)
          ===================================================================== */}
      <article
        aria-labelledby="beginner-article-title"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          border: '1.5px solid #e2e8f0',
          padding: '28px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        <header style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '18px', marginBottom: '22px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: '#FFF0F1',
              color: 'var(--primary, #E60012)',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}
          >
            Hướng dẫn định hướng
          </div>
          <h3
            id="beginner-article-title"
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#0f172a',
              margin: '0 0 8px',
              lineHeight: 1.35,
            }}
          >
            Người mới bắt đầu học tiếng Trung nên học gì?
          </h3>
          <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>⏱ 4 phút đọc</span>
            <span>•</span>
            <span>Phương pháp chuẩn hóa theo khung đào tạo HSK 3.0</span>
            <span>•</span>
            <span>Biên soạn bởi ZhongWenHub Academic Team</span>
          </div>
        </header>

        {/* Article Body */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '22px',
            fontSize: '14.5px',
            lineHeight: 1.75,
            color: '#334155',
          }}
        >
          {/* Section 1 */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              1. Học Pinyin trước để nắm cách đọc
            </h4>
            <p style={{ margin: 0 }}>
              Tiếng Trung là chữ biểu ý (tượng hình) nên không thể nhìn mặt chữ mà đoán cách đọc như tiếng Việt.
              <strong> Pinyin</strong> (hệ thống phiên âm Latin chuẩn quốc tế) đóng vai trò như chiếc giàn giáo đầu tiên giúp bạn phát âm chuẩn xác mọi từ vựng mới.
              Nắm vững 21 thanh mẫu và 36 vận mẫu sẽ giúp bạn tự tin tra từ điển và đọc đúng mà không cần dựa vào phiên âm bồi.
            </p>
          </div>

          {/* Section 2 */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              2. Luyện thanh điệu để phát âm rõ ràng
            </h4>
            <p style={{ margin: 0 }}>
              Tiếng Trung có 4 thanh điệu chính và 1 thanh nhẹ. Độ cao và hướng đi của âm thanh sẽ quyết định toàn bộ ngữ nghĩa của từ.
              Ví dụ âm &quot;ma&quot; tương ứng với <em>mā</em> (mẹ), <em>má</em> (cây gai), <em>mǎ</em> (con ngựa) và <em>mà</em> (mắng).
              Tập trung luyện nghe và lặp lại theo âm mẫu chuẩn ngay từ đầu sẽ giúp bạn tránh phản xạ sai khó sửa về sau.
            </p>
          </div>

          {/* Section 3 */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              3. Làm quen với nét chữ và bộ thủ
            </h4>
            <p style={{ margin: 0 }}>
              Chữ Hán không phải là những bức vẽ ngẫu nhiên mà được cấu tạo từ <strong>8 nét cơ bản</strong> và các bộ thủ có ý nghĩa gợi ý nghĩa hoặc gợi âm.
              Hiểu cấu tạo của các bộ thủ phổ biến (như bộ Nhân 亻, bộ Nữ 女, bộ Khẩu 口, bộ Thủy 氵) và tuân theo 7 quy tắc bút thuận
              sẽ giúp bạn viết chữ cân đối, nhanh chóng và ghi nhớ bền lâu hơn gấp nhiều lần.
            </p>
          </div>

          {/* Section 4 */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              4. Tích lũy từ vựng theo cấp HSK
            </h4>
            <p style={{ margin: 0 }}>
              Thay vì học dàn trải không mục tiêu, hãy bám sát lộ trình từ vựng của chuẩn HSK 3.0.
              Cấp độ <strong>HSK 1</strong> yêu cầu 150 từ vựng căn bản xoay quanh các chủ đề sinh hoạt quen thuộc: chào hỏi, bản thân, gia đình, thời gian, con số và mua sắm.
              Mỗi từ nên được học trong cụm từ và câu ví dụ để hiểu trọn vẹn ngữ cảnh sử dụng.
            </p>
          </div>

          {/* Section 5 */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              5. Học cấu trúc ngữ pháp cơ bản
            </h4>
            <p style={{ margin: 0 }}>
              Điểm thuận lợi lớn nhất đối với người Việt là trật tự câu tiếng Trung rất tương đồng với tiếng Việt (Chủ ngữ + Động từ + Tân ngữ: S + V + O).
              Tiếng Trung không chia thì động từ phức tạp. Người mới bắt đầu chỉ cần làm chủ các mẫu câu hỏi cơ bản với <em>吗, 什么, 哪</em>,
              câu phủ định với <em>不, 没</em> và trợ từ sở hữu <em>的</em> là đã có thể giao tiếp sinh hoạt lưu loát.
            </p>
          </div>

          {/* Section 6 */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              6. Luyện nghe, nói và ôn tập mỗi ngày
            </h4>
            <p style={{ margin: 0 }}>
              Học ngoại ngữ là xây dựng phản xạ âm thanh và vận động cơ miệng. Dành ít nhất 10 phút nghe đàm thoại ngắn và nhại lại (Shadowing)
              theo người bản xứ sẽ giúp ngữ điệu của bạn tự nhiên hơn. Kết hợp cùng việc ôn tập từ vựng ngắt quãng trên Flashcard SRS
              sẽ bảo đảm kiến thức không bị hao hụt sau mỗi tuần.
            </p>
          </div>
        </div>

        {/* Article Summary Box with CTA Button */}
        <div
          style={{
            marginTop: '28px',
            padding: '20px 24px',
            borderRadius: '14px',
            backgroundColor: '#FFFBFB',
            border: '1.5px solid #fed7da',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
              Sẵn sàng bắt đầu chinh phục mục tiêu HSK đầu tiên?
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Khám phá hệ thống bài giảng HSK 1 với đầy đủ từ vựng, ngữ pháp và đàm thoại theo chủ đề.
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/learning-path?mode=hsk')}
            style={{
              padding: '11px 22px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'var(--primary, #E60012)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(230, 0, 18, 0.22)',
              transition: 'all 0.15s ease',
            }}
          >
            <BookOpen size={16} />
            <span>Khám phá giáo trình HSK 1</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </article>
    </div>
  );
};
