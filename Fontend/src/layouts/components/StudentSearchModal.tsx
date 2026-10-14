import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Languages,
  BookText,
  Headphones,
  Mic,
  FileText,
  PenTool,
  Dumbbell,
  GraduationCap as ExamIcon,
  Gamepad2,
  Users,
  CheckCircle2,
  Sparkles,
  Radio,
  FileCheck,
  BrainCircuit,
  TrendingUp,
  Trophy,
  Award,
  User,
  Settings,
  X,
  ArrowRight,
} from 'lucide-react';

export interface StudentSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  category: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  { id: '1', title: 'Dashboard Học tập', category: 'Tổng quan', path: '/dashboard', icon: LayoutDashboard },
  { id: '2', title: 'Lộ trình HSK 1 → HSK 7–9', category: 'Tổng quan', path: '/learning-path', icon: BookOpen },
  { id: '3', title: 'Bài 8: 你想喝什么？(Bạn muốn uống gì?)', category: 'Học tập', path: '/lesson', icon: GraduationCap, badge: 'Đang học' },
  { id: '4', title: 'Kho từ vựng & Spaced Repetition', category: 'Học tập', path: '/vocabulary', icon: Languages, badge: '18 từ đến hạn' },
  { id: '5', title: 'Ngữ pháp HSK cấu trúc & ví dụ', category: 'Học tập', path: '/grammar', icon: BookText },
  { id: '6', title: 'Luyện kỹ năng Nghe (Listening)', category: 'Kỹ năng', path: '/skills/listening', icon: Headphones },
  { id: '7', title: 'Luyện kỹ năng Nói (Speaking)', category: 'Kỹ năng', path: '/skills/speaking', icon: Mic },
  { id: '8', title: 'Luyện kỹ năng Đọc (Reading)', category: 'Kỹ năng', path: '/skills/reading', icon: FileText },
  { id: '9', title: 'Luyện kỹ năng Viết (Writing)', category: 'Kỹ năng', path: '/skills/writing', icon: PenTool },
  { id: '10', title: 'Trung tâm Luyện tập trắc nghiệm', category: 'Luyện tập', path: '/practice', icon: Dumbbell },
  { id: '11', title: 'Thi thử HSK Chuẩn hóa có bấm giờ', category: 'Luyện tập', path: '/mock-exams', icon: ExamIcon, badge: 'HSK 1-6' },
  { id: '12', title: 'Trò chơi Học tiếng Trung (Ghép từ, Lật thẻ)', category: 'Luyện tập', path: '/games', icon: Gamepad2, badge: 'Game' },
  { id: '13', title: 'Lớp học của tôi & Giảng viên', category: 'Lớp học', path: '/classes', icon: Users },
  { id: '14', title: 'Bài tập về nhà được giao', category: 'Lớp học', path: '/homework', icon: ClipboardList, badge: '2 mới' },
  { id: '15', title: 'Kết quả học tập & Nhận xét', category: 'Lớp học', path: '/learning-results', icon: CheckCircle2 },
  { id: '16', title: 'AI Tutor Trò chuyện thông minh', category: 'Trợ lý AI', path: '/ai-tutor', icon: Sparkles, badge: 'AI' },
  { id: '17', title: 'Luyện nói AI Live (Kippy giọng Bắc Kinh)', category: 'Trợ lý AI', path: '/ai-live', icon: Radio, badge: 'Live' },
  { id: '18', title: 'AI Chấm điểm bài viết & Sửa ngữ pháp', category: 'Trợ lý AI', path: '/ai-grading', icon: FileCheck },
  { id: '19', title: 'Phân tích Năng lực AI & Radar kỹ năng', category: 'Trợ lý AI', path: '/ai-analytics', icon: BrainCircuit },
  { id: '20', title: 'Tiến độ học tập & Thời gian học', category: 'Thành tích', path: '/progress', icon: TrendingUp },
  { id: '21', title: 'Bảng xếp hạng Học viên tuần này', category: 'Thành tích', path: '/leaderboard', icon: Trophy },
  { id: '22', title: 'Thành tựu & Bộ sưu tập Huy hiệu', category: 'Thành tích', path: '/achievements', icon: Award },
  { id: '23', title: 'Hồ sơ học viên & Mục tiêu HSK', category: 'Cá nhân', path: '/profile', icon: User },
  { id: '24', title: 'Cài đặt hệ thống & Giao diện', category: 'Cá nhân', path: '/settings', icon: Settings },
];

export const StudentSearchModal: React.FC<StudentSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = SEARCH_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '80px 16px 16px 16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #f1f5f9',
            gap: '12px',
          }}
        >
          <Search size={18} style={{ color: '#4338ca', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Tìm kiếm tính năng, bài học, ngữ pháp (⌘K)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              fontWeight: 500,
              color: '#0f172a',
              backgroundColor: 'transparent',
            }}
          />
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '13px',
              }}
            >
              Không tìm thấy tính năng nào khớp với "{query}"
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    gap: '12px',
                  }}
                  className="search-item-hover"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#eef2ff',
                        color: '#4338ca',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#0f172a',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {item.category} • {item.path}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: '#e0e7ff',
                          color: '#4338ca',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ArrowRight size={14} style={{ color: '#94a3b8' }} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts info */}
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <span>Nhấn <kbd style={{ padding: '1px 5px', borderRadius: '4px', background: '#e2e8f0', color: '#334155', fontWeight: 600 }}>Esc</kbd> để đóng</span>
          <span>Chọn để chuyển hướng ngay lập tức</span>
        </div>
      </div>
    </div>
  );
};
