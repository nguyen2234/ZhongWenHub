import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Film,
  Sparkles,
  User,
} from 'lucide-react';
import './StudentBottomNav.css';

export interface BottomNavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  matchPrefixes: string[];
  badge?: string;
}

export const MOBILE_BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  {
    id: 'dashboard',
    label: 'Trang chủ',
    path: '/dashboard',
    icon: LayoutDashboard,
    matchPrefixes: ['/dashboard'],
  },
  {
    id: 'hsk',
    label: 'Học HSK',
    path: '/learning-path',
    icon: BookOpen,
    matchPrefixes: [
      '/learning-path',
      '/lesson',
      '/grammar',
      '/skills',
      '/vocabulary',
      '/practice',
      '/mock-exams',
      '/games',
    ],
  },
  {
    id: 'video',
    label: 'Video',
    path: '/videos',
    icon: Film,
    matchPrefixes: ['/videos'],
    badge: 'Mới',
  },
  {
    id: 'ai-tutor',
    label: 'AI Tutor',
    path: '/ai-tutor',
    icon: Sparkles,
    matchPrefixes: ['/ai-tutor', '/ai-live', '/ai-grading', '/ai-analytics', '/ai-learning'],
    badge: 'AI',
  },
  {
    id: 'profile',
    label: 'Cá nhân',
    path: '/profile',
    icon: User,
    matchPrefixes: [
      '/profile',
      '/settings',
      '/classes',
      '/progress',
      '/achievements',
      '/leaderboard',
      '/learning-results',
      '/homework',
    ],
  },
];

export const StudentBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const isItemActive = (item: BottomNavItem): boolean => {
    if (item.path === '/dashboard' && (pathname === '/' || pathname === '/dashboard')) {
      return true;
    }
    return item.matchPrefixes.some((prefix) => pathname.startsWith(prefix));
  };

  return (
    <nav
      className="student-bottom-nav"
      aria-label="Điều hướng chính trên điện thoại"
      role="navigation"
    >
      <div className="student-bottom-nav-inner">
        {MOBILE_BOTTOM_NAV_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const active = isItemActive(item);

          return (
            <button
              key={item.id}
              type="button"
              className={`bottom-nav-item ${active ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
              data-testid={`bottom-nav-${item.id}`}
            >
              <div className="bottom-nav-icon-wrap">
                <IconComponent
                  size={20}
                  className="bottom-nav-icon"
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {item.badge && (
                  <span className="bottom-nav-badge">{item.badge}</span>
                )}
              </div>
              <span className="bottom-nav-label">{item.label}</span>
              {active && <span className="bottom-nav-active-indicator" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
