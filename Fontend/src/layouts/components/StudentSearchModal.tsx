import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Languages,
  Dumbbell,
  RotateCcw,
  Sparkles,
  Radio,
  BrainCircuit,
  Layers,
  ShieldCheck,
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
  { id: '1', title: 'Dashboard Học tập', category: 'Trang chính', path: '/dashboard', icon: LayoutDashboard },
  { id: '2', title: 'Lộ trình HSK 1 → HSK 7–9', category: 'Trang chính', path: '/learning-path', icon: BookOpen },
  { id: '3', title: 'Bài 8: 你想喝什么？(Bạn muốn uống gì?)', category: 'Khóa học', path: '/lesson', icon: GraduationCap, badge: 'Đang học' },
  { id: '4', title: 'Bài tập về nhà & Kiểm tra', category: 'Học tập', path: '/homework', icon: ClipboardList },
  { id: '5', title: 'Kho từ vựng & Spaced Repetition', category: 'Từ vựng', path: '/vocabulary', icon: Languages, badge: '18 từ đến hạn' },
  { id: '6', title: 'Trung tâm Luyện tập trắc nghiệm', category: 'Học tập', path: '/practice', icon: Dumbbell },
  { id: '7', title: 'Phiên ôn Flashcard SRS', category: 'Từ vựng', path: '/srs-review', icon: RotateCcw },
  { id: '8', title: 'AI Tutor Trò chuyện thông minh', category: 'Trợ lý AI', path: '/ai-tutor?mode=chat', icon: Sparkles, badge: 'AI' },
  { id: '9', title: 'Luyện nói AI Live (Kippy UX)', category: 'Trợ lý AI', path: '/ai-tutor?mode=live', icon: Radio, badge: 'Live' },
  { id: '10', title: 'Không gian Trí tuệ Nhân tạo AI', category: 'Trợ lý AI', path: '/ai-learning', icon: BrainCircuit },
  { id: '11', title: 'Design System Showcase', category: 'Hệ thống', path: '/design-system', icon: Layers },
  { id: '12', title: 'Cổng Quản trị viên & Giáo viên', category: 'Hệ thống', path: '/management/admin/dashboard', icon: ShieldCheck },
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
        padding: '80px var(--space-4) var(--space-4) var(--space-4)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-2xl)',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            borderBottom: '1.5px solid #f1f5f9',
          }}
        >
          <Search size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Tìm kiếm tính năng, bài học, AI Tutor... (Nhấn Esc để đóng)"
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: 'var(--foreground)',
              backgroundColor: 'transparent',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 'var(--text-xs)' }}>
              Không tìm thấy tính năng nào phù hợp với &quot;{query}&quot;
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
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-xl)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: '#eef2ff',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={17} />
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--foreground)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {item.category}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: '#f5f3ff',
                          color: 'var(--ai)',
                          border: '1px solid #ede9fe',
                          fontWeight: 700,
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

        {/* Footer Shortcut Helper */}
        <div
          style={{
            padding: '10px 18px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <span>Điều hướng nhanh với bàn phím</span>
          <span>
            <kbd style={{ padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}>
              ESC
            </kbd>{' '}
            để thoát
          </span>
        </div>
      </div>
    </div>
  );
};
