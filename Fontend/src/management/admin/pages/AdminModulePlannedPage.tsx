import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  CheckSquare,
  Video,
  ShieldAlert,
  Bot,
  BarChart3,
  LifeBuoy,
  Settings,
  ArrowLeft,
  Sparkles,
  Calendar,
  Layers,
} from 'lucide-react';
import { PageHeader } from '../../shared/components';

export interface AdminModulePlannedPageProps {
  moduleKey:
    | 'grammar'
    | 'exercises'
    | 'videos'
    | 'moderation'
    | 'ai-management'
    | 'analytics'
    | 'support-requests'
    | 'settings';
}

interface ModuleSpec {
  title: string;
  subtitle: string;
  plannedPhase: 'FE-10.2' | 'FE-10.3';
  phaseTitle: string;
  icon: React.ReactNode;
  highlights: string[];
  learnerSyncNote: string;
}

const MODULE_SPECS: Record<AdminModulePlannedPageProps['moduleKey'], ModuleSpec> = {
  grammar: {
    title: 'Quản lý Ngữ pháp HSK (FE-9)',
    subtitle: 'Chuẩn hóa công thức, giải thích, ví dụ song ngữ và liên kết bài tập thực hành theo cấp độ HSK 1–6.',
    plannedPhase: 'FE-10.2',
    phaseTitle: 'Academic Content Management',
    icon: <FileText size={28} />,
    highlights: [
      'Quản lý danh mục ngữ pháp 6 nhóm (cơ bản, câu chữ, trợ từ, liên từ, bổ ngữ, phó từ)',
      'Biên soạn công thức cấu trúc (Formula display) với font mono rõ ràng',
      'Kho câu ví dụ đa phương tiện: Chữ Hán, Pinyin, Nghĩa tiếng Việt, Audio phát âm',
      'Tích hợp Live Preview 100% đồng bộ với trang /grammar của học viên',
    ],
    learnerSyncNote: 'Đồng bộ trực tiếp với tính năng Grammar Hub đã ra mắt tại FE-9.',
  },
  exercises: {
    title: 'Ngân hàng bài tập chuẩn hóa (FE-9)',
    subtitle: 'Quản lý kho câu hỏi luyện tập và kiểm tra tương thích 10 định dạng bài tập và 6 kỹ năng.',
    plannedPhase: 'FE-10.2',
    phaseTitle: 'Academic Content Management',
    icon: <CheckSquare size={28} />,
    highlights: [
      'Hỗ trợ 10 dạng câu hỏi: Trắc nghiệm, Điền khuyết, Sắp xếp câu, Nối thẻ, Nghe chọn tranh...',
      'Phân loại 6 nhóm kỹ năng: Từ vựng, Ngữ pháp, Nghe, Đọc, Viết câu, Tổng hợp',
      'Validation định dạng câu hỏi và độ khó nghiêm ngặt (không giả lập lưu dữ liệu)',
      'Live Preview thử nghiệm câu hỏi trực tiếp bằng chính ExerciseRenderer của học viên',
    ],
    learnerSyncNote: 'Đồng bộ với Practice Center và Exercise Engine của học viên.',
  },
  videos: {
    title: 'Quản lý Học liệu Video HSK',
    subtitle: 'Thư viện bài giảng video tương tác, quản lý transcript đồng bộ song ngữ theo dòng thời gian.',
    plannedPhase: 'FE-10.3',
    phaseTitle: 'Video & AI Operations Console',
    icon: <Video size={28} />,
    highlights: [
      'Danh mục video phân theo HSK 1–6, chủ đề đàm thoại và bài học',
      'Biên tập phụ đề và transcript song ngữ với mốc thời gian (timestamps) chính xác',
      'Gắn thẻ từ vựng nổi bật trực tiếp trong phụ đề để học viên tra nhanh',
      'Trình phát xem trước (Preview Player) nhúng an toàn không lộ cấu hình',
    ],
    learnerSyncNote: 'Đồng bộ với Video Library và Video Detail Player của học viên.',
  },
  moderation: {
    title: 'Hàng đợi kiểm duyệt học liệu',
    subtitle: 'Quy trình thẩm định và phê duyệt bài giảng, bài tập do giáo viên soạn trước khi công khai.',
    plannedPhase: 'FE-10.3',
    phaseTitle: 'Video & AI Operations Console',
    icon: <ShieldAlert size={28} />,
    highlights: [
      'Danh sách 14 nội dung chờ duyệt từ các tổ bộ môn',
      'So sánh thay đổi (diff view) giữa bản nháp và bản đang xuất bản',
      'Quy trình phê duyệt 2 bước: Thẩm định chuyên môn và Ký duyệt xuất bản',
      'Nhật ký phê duyệt minh bạch (Audit Trail) phục vụ đối soát chất lượng',
    ],
    learnerSyncNote: 'Đảm bảo 100% học liệu đưa lên cho học viên đều đạt chuẩn sư phạm.',
  },
  'ai-management': {
    title: 'Quản lý & Giám sát Trợ lý AI Tutor',
    subtitle: 'Trung tâm chỉ huy vận hành các mô hình AI: AI Tutor, AI Live, AI Grading, AI Analytics.',
    plannedPhase: 'FE-10.3',
    phaseTitle: 'Video & AI Operations Console',
    icon: <Bot size={28} />,
    highlights: [
      'Giám sát trạng thái hoạt động (Operational / Maintenance) từng tính năng AI',
      'Theo dõi hạn mức token và hạn ngạch truy vấn học viên',
      'Bảng tổng hợp báo cáo phản hồi chất lượng câu trả lời từ người học',
      'Bảo mật tuyệt đối: Không cấu hình hoặc lưu trữ API key ở client side',
    ],
    learnerSyncNote: 'Giám sát toàn bộ hệ sinh thái trợ lý AI học tập của học viên.',
  },
  analytics: {
    title: 'Báo cáo & Phân tích đào tạo',
    subtitle: 'Biểu đồ tăng trưởng học viên, tỷ lệ hoàn thành lộ trình HSK và phân tích kỹ năng.',
    plannedPhase: 'FE-10.3',
    phaseTitle: 'Operations & Analytics',
    icon: <BarChart3 size={28} />,
    highlights: [
      'Tỷ lệ hoàn thành theo từng cấp độ HSK 1 - HSK 6',
      'Phân tích 4 kỹ năng Nghe - Nói - Đọc - Viết trên quy mô toàn nền tảng',
      'Thời gian tự học trung bình và tỷ lệ duy trì chuỗi học tập (Streak retention)',
      'Xuất báo cáo định dạng Excel / PDF phục vụ họp chuyên môn',
    ],
    learnerSyncNote: 'Phản ánh hiệu quả đào tạo tổng hợp của học viên toàn hệ thống.',
  },
  'support-requests': {
    title: 'Yêu cầu hỗ trợ & Giám sát SLA',
    subtitle: 'Theo dõi điều phối yêu cầu trợ giúp học thuật, kỹ thuật và cam kết thời gian phản hồi.',
    plannedPhase: 'FE-10.3',
    phaseTitle: 'Operations & Support Console',
    icon: <LifeBuoy size={28} />,
    highlights: [
      'Hàng đợi vé hỗ trợ theo 3 mức ưu tiên: Gấp (SLA 30p), Cao (2h), Bình thường (24h)',
      'Phân loại theo nhóm: Nội dung học tập, Tài khoản, Kỹ thuật ứng dụng',
      'Tích hợp điều phối vé tự động cho giáo viên phụ trách HSK tương ứng',
      'Thống kê tỷ lệ hài lòng (CSAT) của học viên sau khi được giải đáp',
    ],
    learnerSyncNote: 'Hỗ trợ giải đáp khó khăn kịp thời cho học viên.',
  },
  settings: {
    title: 'Cài đặt hệ thống quản trị',
    subtitle: 'Thông tin thương hiệu, thông báo hệ thống, chính sách đào tạo và phân quyền bảo mật.',
    plannedPhase: 'FE-10.3',
    phaseTitle: 'System & Security',
    icon: <Settings size={28} />,
    highlights: [
      'Cấu hình thông tin trường đào tạo và nhận diện thương hiệu ZhongWenHub',
      'Quản lý thông báo broadcast gửi tới toàn bộ học viên hoặc theo lớp',
      'Chính sách khóa tài khoản và tiêu chuẩn mật khẩu bảo mật',
      'Cấu hình lịch trình sao lưu tự động cơ sở dữ liệu học tập',
    ],
    learnerSyncNote: 'Thiết lập tham số vận hành chung cho toàn hệ thống.',
  },
};

export const AdminModulePlannedPage: React.FC<AdminModulePlannedPageProps> = ({ moduleKey }) => {
  const spec = MODULE_SPECS[moduleKey];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      <PageHeader
        title={spec.title}
        subtitle={spec.subtitle}
        actions={
          <Link
            to="/management/admin/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-strong)',
              backgroundColor: 'var(--surface)',
              color: 'var(--foreground)',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} />
            <span>Về Dashboard</span>
          </Link>
        }
      />

      {/* Planned Phase Notice Card */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(20px, 3vw, 28px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {spec.icon}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                  {spec.title}
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    letterSpacing: '0.4px',
                  }}
                >
                  LỘ TRÌNH {spec.plannedPhase}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '4px 0 0 0' }}>
                Phân hệ thuộc giai đoạn <strong>{spec.phaseTitle}</strong> theo kế hoạch tổng thể FE-10.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border-strong)',
              fontSize: '12px',
              color: 'var(--muted)',
            }}
          >
            <Calendar size={14} style={{ color: 'var(--primary)' }} />
            <span>Sẵn sàng triển khai khi được phê duyệt</span>
          </div>
        </div>

        {/* Sync with Learner Ecosystem Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--primary-light)',
            border: '1px solid rgba(230, 0, 18, 0.2)',
            fontSize: '12.5px',
            color: 'var(--foreground)',
          }}
        >
          <Sparkles size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span>
            <strong>Đồng bộ học viên:</strong> {spec.learnerSyncNote}
          </span>
        </div>

        {/* Key Planned Capabilities */}
        <div>
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'var(--muted)',
              marginBottom: 'var(--space-3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Layers size={14} />
            Các tính năng trọng tâm sẽ triển khai:
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '10px',
            }}
          >
            {spec.highlights.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  fontSize: '12.5px',
                  color: 'var(--foreground)',
                  lineHeight: 1.45,
                }}
              >
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(230, 0, 18, 0.1)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: '1px',
                  }}
                >
                  {idx + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminModulePlannedPage;
