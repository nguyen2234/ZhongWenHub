import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen, Sparkles, BookOpen, Headphones, LayoutDashboard, Target } from 'lucide-react';
import { STUDENT_MAIN_NAV_ITEMS } from '../../config/student-navigation.config';

export interface StudentSidebarProps {
  onNavigate?: () => void;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const courseLinks = [
  { label: 'Người mới bắt đầu', path: '/learning-path' },
  { label: 'Giáo trình HSK 1–9', path: '/learning-path' },
  { label: 'Bài tập', path: '/practice' },
  { label: 'Ngữ pháp', path: '/grammar' },
  { label: 'Luyện thi HSK', path: '/mock-exams' },
  { label: 'Học qua video', path: '/skills/listening' },
];
const skillLinks = [
  { label: 'Luyện nghe', path: '/skills/listening' },
  { label: 'Luyện nói', path: '/skills/speaking' },
  { label: 'Đọc hiểu', path: '/skills/reading' },
  { label: 'Luyện viết', path: '/skills/writing' },
  { label: 'Luyện phát âm', path: '/skills/speaking' },
];

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  onNavigate, className = '', isCollapsed = false, onToggleCollapse,
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [coursesOpen, setCoursesOpen] = useState(true);
  const [skillsOpen, setSkillsOpen] = useState(true);
  const go = (path: string) => { navigate(path); onNavigate?.(); };
  const active = (path: string) => pathname === path || (path !== '/dashboard' && pathname.startsWith(path + '/'));
  const compact = (label: string, path: string, Icon: typeof BookOpen) => (
    <button key={label} type="button" onClick={() => go(path)} title={label}
      aria-current={active(path) ? 'page' : undefined}
      className={`hb-sidebar-item ${active(path) ? 'is-active' : ''}`}>
      <Icon size={19} /><span>{label}</span>
    </button>
  );
  const group = (label: string, Icon: typeof BookOpen, open: boolean, toggle: () => void, links: typeof courseLinks) => (
    <div className="hb-sidebar-group">
      <button type="button" className="hb-sidebar-group-trigger" aria-expanded={open} onClick={toggle}>
        <Icon size={19} /><span>{label}</span>{open ? <ChevronDown size={15}/> : <ChevronRight size={15}/>}
      </button>
      {open && <div className="hb-sidebar-subitems">{links.map(link =>
        <button key={link.label} type="button" onClick={() => go(link.path)}
          className={`hb-sidebar-subitem ${active(link.path) ? 'is-active' : ''}`}>
          <span className="hb-sidebar-dot"/> {link.label}
        </button>
      )}</div>}
    </div>
  );
  return <aside className={`student-sidebar-container hb-sidebar ${isCollapsed ? 'hb-sidebar-collapsed' : ''} ${className}`} aria-label="Thanh điều hướng chính">
    <div className="hb-sidebar-scroll">
      <div className="hb-sidebar-top">
        {!isCollapsed && <span>KHÁM PHÁ</span>}
        {onToggleCollapse && <button type="button" aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'} onClick={onToggleCollapse}>
          {isCollapsed ? <PanelLeftOpen size={16}/> : <PanelLeftClose size={16}/>}
        </button>}
      </div>
      {compact('Dashboard', '/dashboard', LayoutDashboard)}
      {isCollapsed ? <>
        {compact('Khóa học', '/learning-path', BookOpen)}
        {compact('Kỹ năng', '/skills/listening', Headphones)}
      </> : <>
        <div className="hb-sidebar-top hb-sidebar-section">HỌC TẬP</div>
        {group('Khóa học', BookOpen, coursesOpen, () => setCoursesOpen(v => !v), courseLinks)}
        {group('Kỹ năng', Headphones, skillsOpen, () => setSkillsOpen(v => !v), skillLinks)}
      </>}
      <div className="hb-sidebar-top hb-sidebar-section">{!isCollapsed && 'CÁ NHÂN HÓA'}</div>
      {STUDENT_MAIN_NAV_ITEMS.filter(item => ['vocabulary', 'practice', 'ai-tutor', 'progress'].includes(item.id)).map(item => compact(item.label, item.path, item.icon as typeof BookOpen))}
      {compact('Đánh giá trình độ', '/mock-exams', Target)}
    </div>
    <div className="hb-sidebar-bottom">
      <button type="button" onClick={() => go('/ai-live')} title="Luyện nói cùng AI">
        <Sparkles size={18}/>{!isCollapsed && <span><strong>Trợ lý AI ZhongWen</strong><small>Luyện hội thoại ngay</small></span>}
      </button>
    </div>
  </aside>;
};
export default StudentSidebar;
